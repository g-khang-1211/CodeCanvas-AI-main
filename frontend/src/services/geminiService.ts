
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Flashcard, Unit, Question, QuestionType, Video } from "../types";
import { executeWithFallback } from "./geminiFallback";
import { getLanguageName } from "./geminiLanguage";
import { parseFlashcards, parseQuestions, parseSyllabusUnits, parseVideos } from "./geminiParsers";
import {
  buildChatPrompt,
  buildFlashcardsPrompt,
  buildLessonPrompt,
  buildQuizPrompt,
  buildSyllabusPrompt,
  buildVideosPrompt,
} from "./geminiPrompts";

export const generateChatResponse = async (
  apiKey: string,
  history: ChatMessage[], 
  currentMessage: string, 
  context: string,
  languageCode: string = 'en'
): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please check your settings.";

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const modelObj = ai.models;
    const response = await executeWithFallback(async (modelName) => {
      return await modelObj.generateContent({
        model: modelName,
        contents: buildChatPrompt(context, history, currentMessage, lang),
      });
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error: any) {
    console.error("Chat Error:", error);
    return error.message || "Sorry, I encountered an error connecting to the AI. Please check your API key.";
  }
};

export const generateFlashcardsForTopic = async (
  apiKey: string,
  topic: string, 
  languageCode: string, 
  difficulty: string,
  count: number = 5
): Promise<Flashcard[]> => {
  if (!apiKey) return [{ front: "API Key Missing", back: "Please check your settings." }];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const response = await executeWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: buildFlashcardsPrompt(topic, difficulty, count, lang),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ['front', 'back']
            }
          }
        }
      });
    });

    return parseFlashcards(response.text || '[]');
  } catch (error: any) {
    console.error("Flashcard Gen Error:", error);
    return [{ front: "Error", back: error.message || "Could not generate cards. Check API Key." }];
  }
};

export const generateSyllabus = async (
  apiKey: string,
  courseName: string,
  level: string,
  focus: string = "general",
  languageCode: string = "en"
): Promise<Unit[]> => {
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const response = await executeWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: buildSyllabusPrompt(courseName, level, focus, lang),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING }, // Initial empty
                questions: { type: Type.ARRAY, items: { type: Type.STRING } } // Initial empty
              },
              required: ['id', 'title']
            }
          }
        }
      });
    });
    
    return parseSyllabusUnits(courseName, level, response.text || '[]');

  } catch (error: any) {
    console.error("Syllabus Gen Error:", error);
    return [];
  }
};

export const generateUnitContent = async (
  apiKey: string,
  courseName: string,
  unitTitle: string,
  level: string,
  languageCode: string = "en",
  quizConfig: { count: number; types: QuestionType[] } = { count: 3, types: ['mcq'] },
  focus: string = "",
  onProgress?: (partialContent: string) => void
): Promise<{ content: string; questions: Question[] }> => {
  if (!apiKey) return { content: "API Key missing. Please check configuration.", questions: [] };

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const { fullContentText, questions } = await executeWithFallback(async (modelName) => {
      // Start Quiz generation in parallel (Promise)
      const quizPromise = ai.models.generateContent({
        model: modelName,
        contents: buildQuizPrompt(courseName, level, unitTitle, quizConfig.count, quizConfig.types, lang),
        config: {
          responseMimeType: "application/json",
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
                          definition: { type: Type.STRING }
                        }
                      } 
                    }
                  },
                  required: ['text', 'type']
                }
              }
            },
            required: ['questions']
          }
        }
      });

      // Start Content generation (Streaming)
      const contentStreamResponse = await ai.models.generateContentStream({
        model: modelName,
        contents: buildLessonPrompt(courseName, level, unitTitle, focus, lang),
      });

      let text = "";
      
      // Process stream
      for await (const chunk of contentStreamResponse) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
          text += chunkText;
          if (onProgress) {
            onProgress(text);
          }
        }
      }

      // Await quiz response after content is done (or it might already be done)
      const quizResponse = await quizPromise;
      return { fullContentText: text, questions: parseQuestions(quizResponse.text || '{"questions": []}') };
    });

    return {
      content: fullContentText,
      questions: questions
    };

  } catch (error: any) {
    console.error("Unit Content Gen Error:", error);
    return {
      content: error.message || "Failed to generate content. Please check your API key and try again.",
      questions: []
    };
  }
};

export const fetchVideos = async (
  apiKey: string,
  topic: string, 
  languageCode: string
): Promise<Video[]> => {
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const response = await executeWithFallback(async (modelName) => {
      return await ai.models.generateContent({
        model: modelName,
        contents: buildVideosPrompt(topic, lang),
        config: {
          tools: [{googleSearch: {}}],
          responseMimeType: "application/json"
        }
      });
    });

    return parseVideos(response.text || '{}');
  } catch (error) {
    console.error("Fetch Videos Error:", error);
    return [];
  }
};
