import { verifyAccessToken } from '../services/supabaseAdmin.js';

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const getBearerToken = (authorizationHeader = '') => {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
};

export const requireAuth = async (req, res) => {
  const accessToken = getBearerToken(req.headers.authorization);
  if (!accessToken) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  const user = await verifyAccessToken(accessToken);
  if (!user) {
    sendJson(res, 401, { error: 'Unauthorized' });
    return null;
  }

  return { accessToken, user };
};
