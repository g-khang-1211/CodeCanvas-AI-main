
import { getCurrentAccessToken } from './supabase';
import { ChatMessage, Flashcard, Question, QuestionType, Unit, Video } from '../types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Request failed';

const authenticatedFetch = async (path: string, body: Record<string, unknown>) => {
  const accessToken = await getCurrentAccessToken();
  if (!accessToken) {
    throw new Error('Unauthorized');
  }

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response;
};

export const generateChatResponse = async (
  _apiKey: string,
  history: ChatMessage[], 
  currentMessage: string, 
  context: string,
  languageCode: string = 'en'
): Promise<string> => {
  try {
    const response = await authenticatedFetch('/api/gemini/chat', {
      context,
      currentMessage,
      history,
      languageCode,
    });

    const payload = await response.json();
    if (!response.ok || typeof payload.text !== 'string') {
      return payload.error || "Sorry, I encountered an error connecting to the AI. Please check your API key.";
    }

    return payload.text || "I couldn't generate a response.";
  } catch (error: unknown) {
    console.error('Chat Error:', error);
    return getErrorMessage(error) || "Sorry, I encountered an error connecting to the AI. Please check your API key.";
  }
};

export const generateFlashcardsForTopic = async (
  _apiKey: string,
  topic: string, 
  languageCode: string, 
  difficulty: string,
  count: number = 5
): Promise<Flashcard[]> => {
  try {
    const response = await authenticatedFetch('/api/gemini/flashcards', {
      count,
      difficulty,
      languageCode,
      topic,
    });

    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.cards)) {
      return [{ front: 'Error', back: payload.error || 'Could not generate cards. Check API Key.' }];
    }

    return payload.cards;
  } catch (error: unknown) {
    console.error('Flashcard Gen Error:', error);
    return [{ front: 'Error', back: getErrorMessage(error) || 'Could not generate cards. Check API Key.' }];
  }
};

export const generateSyllabus = async (
  _apiKey: string,
  courseName: string,
  level: string,
  focus: string = "general",
  languageCode: string = "en"
): Promise<Unit[]> => {
  try {
    const response = await authenticatedFetch('/api/gemini/syllabus', {
      courseName,
      focus,
      languageCode,
      level,
    });

    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.units)) {
      return [];
    }

    return payload.units;
  } catch (error: unknown) {
    console.error('Syllabus Gen Error:', error);
    return [];
  }
};

export const generateUnitContent = async (
  _apiKey: string,
  courseName: string,
  unitTitle: string,
  level: string,
  languageCode: string = "en",
  quizConfig: { count: number; types: QuestionType[] } = { count: 3, types: ['mcq'] },
  focus: string = "",
  onProgress?: (partialContent: string) => void
): Promise<{ content: string; questions: Question[] }> => {
  try {
    const response = await authenticatedFetch('/api/gemini/unit', {
      courseName,
      focus,
      languageCode,
      level,
      quizConfig,
      unitTitle,
    });

    if (!response.ok || !response.body) {
      const payload = await response.json().catch(() => ({ error: 'Failed to generate content. Please check your API key and try again.' }));
      return {
        content: payload.error || 'Failed to generate content. Please check your API key and try again.',
        questions: [],
      };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        const payload = JSON.parse(line) as
          | { type: 'content'; delta: string }
          | { type: 'done'; content: string; questions: Question[] }
          | { type: 'error'; error: string };

        if (payload.type === 'content') {
          accumulatedContent += payload.delta;
          if (onProgress) {
            onProgress(accumulatedContent);
          }
        }

        if (payload.type === 'done') {
          return {
            content: payload.content,
            questions: payload.questions,
          };
        }

        if (payload.type === 'error') {
          return {
            content: payload.error || 'Failed to generate content. Please check your API key and try again.',
            questions: [],
          };
        }
      }
    }

    return {
      content: accumulatedContent || 'Failed to generate content. Please check your API key and try again.',
      questions: [],
    };
  } catch (error: unknown) {
    console.error('Unit Content Gen Error:', error);
    return {
      content: getErrorMessage(error) || 'Failed to generate content. Please check your API key and try again.',
      questions: [],
    };
  }
};

export const fetchVideos = async (
  _apiKey: string,
  topic: string, 
  languageCode: string
): Promise<Video[]> => {
  try {
    const response = await authenticatedFetch('/api/gemini/videos', {
      languageCode,
      topic,
    });

    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.videos)) {
      return [];
    }

    return payload.videos;
  } catch (error) {
    console.error('Fetch Videos Error:', error);
    return [];
  }
};
