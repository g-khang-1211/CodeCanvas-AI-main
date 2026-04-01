import { requireAuth } from '../middleware/requireAuth.js';
import { getStoredApiKey } from '../services/profileKeyService.js';
import {
  fetchVideos,
  generateChatResponse,
  generateFlashcardsForTopic,
  generateSyllabus,
  streamUnitContent,
} from '../services/geminiService.js';

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const getUserApiKey = async (auth, res) => {
  const apiKey = await getStoredApiKey({ accessToken: auth.accessToken, userId: auth.user.id });

  if (!apiKey) {
    sendJson(res, 400, { error: 'Missing API key' });
    return '';
  }

  return apiKey;
};

export const handleGeminiRequest = async ({ body, pathname, req, res }) => {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  try {
    const apiKey = await getUserApiKey(auth, res);
    if (!apiKey) {
      return;
    }

    if (req.method === 'POST' && pathname === '/api/gemini/chat') {
      const text = await generateChatResponse({
        apiKey,
        history: Array.isArray(body.history) ? body.history : [],
        currentMessage: typeof body.currentMessage === 'string' ? body.currentMessage : '',
        context: typeof body.context === 'string' ? body.context : '',
        languageCode: typeof body.languageCode === 'string' ? body.languageCode : 'en',
      });
      sendJson(res, 200, { text });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/gemini/flashcards') {
      const cards = await generateFlashcardsForTopic({
        apiKey,
        topic: typeof body.topic === 'string' ? body.topic : '',
        languageCode: typeof body.languageCode === 'string' ? body.languageCode : 'en',
        difficulty: typeof body.difficulty === 'string' ? body.difficulty : 'Beginner',
        count: typeof body.count === 'number' ? body.count : 5,
      });
      sendJson(res, 200, { cards });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/gemini/syllabus') {
      const units = await generateSyllabus({
        apiKey,
        courseName: typeof body.courseName === 'string' ? body.courseName : '',
        level: typeof body.level === 'string' ? body.level : '',
        focus: typeof body.focus === 'string' ? body.focus : 'general',
        languageCode: typeof body.languageCode === 'string' ? body.languageCode : 'en',
      });
      sendJson(res, 200, { units });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/gemini/videos') {
      const videos = await fetchVideos({
        apiKey,
        topic: typeof body.topic === 'string' ? body.topic : '',
        languageCode: typeof body.languageCode === 'string' ? body.languageCode : 'en',
      });
      sendJson(res, 200, { videos });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/gemini/unit') {
      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-ndjson; charset=utf-8',
      });

      try {
        const result = await streamUnitContent({
          apiKey,
          courseName: typeof body.courseName === 'string' ? body.courseName : '',
          unitTitle: typeof body.unitTitle === 'string' ? body.unitTitle : '',
          level: typeof body.level === 'string' ? body.level : '',
          languageCode: typeof body.languageCode === 'string' ? body.languageCode : 'en',
          quizConfig: typeof body.quizConfig === 'object' && body.quizConfig !== null
            ? body.quizConfig
            : { count: 3, types: ['mcq'] },
          focus: typeof body.focus === 'string' ? body.focus : '',
          onChunk: (delta) => {
            res.write(`${JSON.stringify({ type: 'content', delta })}\n`);
          },
        });

        res.write(`${JSON.stringify({ type: 'done', content: result.content, questions: result.questions })}\n`);
        res.end();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to generate content';
        res.write(`${JSON.stringify({ type: 'error', error: message })}\n`);
        res.end();
      }
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    sendJson(res, 500, { error: message });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
};
