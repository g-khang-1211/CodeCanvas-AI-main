import { GoogleGenAI, Type } from '@google/genai';
import { executeWithFallback } from './geminiFallback.js';
import { getLanguageName } from './geminiLanguage.js';
import { parseFlashcards, parseQuestions, parseSyllabusUnits, parseVideos } from './geminiParsers.js';
import {
  buildChatPrompt,
  buildFlashcardsPrompt,
  buildLessonPrompt,
  buildQuizPrompt,
  buildSyllabusPrompt,
  buildVideosPrompt,
} from './geminiPrompts.js';

export const generateChatResponse = async ({ apiKey, history, currentMessage, context, languageCode = 'en' }) => {
  const ai = new GoogleGenAI({ apiKey });
  const language = getLanguageName(languageCode);

  const response = await executeWithFallback(async (modelName) => ai.models.generateContent({
    model: modelName,
    contents: buildChatPrompt(context, history, currentMessage, language),
  }));

  return response.text || "I couldn't generate a response.";
};

export const generateFlashcardsForTopic = async ({ apiKey, topic, languageCode, difficulty, count = 5 }) => {
  const ai = new GoogleGenAI({ apiKey });
  const language = getLanguageName(languageCode);

  const response = await executeWithFallback(async (modelName) => ai.models.generateContent({
    model: modelName,
    contents: buildFlashcardsPrompt(topic, difficulty, count, language),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ['front', 'back'],
        },
      },
    },
  }));

  return parseFlashcards(response.text || '[]');
};

export const generateSyllabus = async ({ apiKey, courseName, level, focus = 'general', languageCode = 'en' }) => {
  const ai = new GoogleGenAI({ apiKey });
  const language = getLanguageName(languageCode);

  const response = await executeWithFallback(async (modelName) => ai.models.generateContent({
    model: modelName,
    contents: buildSyllabusPrompt(courseName, level, focus, language),
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            questions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['id', 'title'],
        },
      },
    },
  }));

  return parseSyllabusUnits(courseName, level, response.text || '[]');
};

export const streamUnitContent = async ({
  apiKey,
  courseName,
  unitTitle,
  level,
  languageCode = 'en',
  quizConfig = { count: 3, types: ['mcq'] },
  focus = '',
  onChunk,
}) => {
  const ai = new GoogleGenAI({ apiKey });
  const language = getLanguageName(languageCode);

  return executeWithFallback(async (modelName) => {
    const quizPromise = ai.models.generateContent({
      model: modelName,
      contents: buildQuizPrompt(courseName, level, unitTitle, quizConfig.count, quizConfig.types, language),
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  answer: { type: Type.STRING },
                  pairs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING },
                      },
                    },
                  },
                },
                required: ['text', 'type'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const contentStream = await ai.models.generateContentStream({
      model: modelName,
      contents: buildLessonPrompt(courseName, level, unitTitle, focus, language),
    });

    let content = '';
    for await (const chunk of contentStream) {
      const delta = chunk.text || '';
      if (!delta) {
        continue;
      }

      content += delta;
      if (onChunk) {
        onChunk(delta, content);
      }
    }

    const quizResponse = await quizPromise;

    return {
      content,
      questions: parseQuestions(quizResponse.text || '{"questions": []}'),
    };
  });
};

export const fetchVideos = async ({ apiKey, topic, languageCode }) => {
  const ai = new GoogleGenAI({ apiKey });
  const language = getLanguageName(languageCode);

  const response = await executeWithFallback(async (modelName) => ai.models.generateContent({
    model: modelName,
    contents: buildVideosPrompt(topic, language),
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
    },
  }));

  return parseVideos(response.text || '{}');
};
