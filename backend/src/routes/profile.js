import { requireAuth } from '../middleware/requireAuth.js';
import { getKeyStatus, saveApiKey } from '../services/profileKeyService.js';

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

export const handleProfileRequest = async ({ body, pathname, req, res }) => {
  const auth = await requireAuth(req, res);
  if (!auth) {
    return;
  }

  if (req.method === 'GET' && pathname === '/api/profile/key-status') {
    try {
      const hasApiKey = await getKeyStatus({ accessToken: auth.accessToken, userId: auth.user.id });
      sendJson(res, 200, { hasApiKey });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load key status';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  if (req.method === 'PUT' && pathname === '/api/profile/key') {
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!apiKey) {
      sendJson(res, 400, { error: 'Invalid API key' });
      return;
    }

    try {
      await saveApiKey({
        accessToken: auth.accessToken,
        user: {
          apiKey,
          email: auth.user.email || '',
          id: auth.user.id,
        },
      });
      sendJson(res, 200, { success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save key';
      sendJson(res, 500, { error: message });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
};
