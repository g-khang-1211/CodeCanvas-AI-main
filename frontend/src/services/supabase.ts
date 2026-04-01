
import { createClient, Session } from '@supabase/supabase-js';


// Safely access env variables to prevent runtime errors if import.meta.env is undefined
const getEnv = (key: string) => {
  try {
    const env = (import.meta as any).env || {};
    return env[key] || '';
  } catch (e) {
    return '';
  }
};


// Prioritize Environment Variables (for Render/Localhost .env), fallback to hardcoded demo values
const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');



const supabaseUrl = envUrl;
const supabaseAnonKey = envKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
};

const sessionMatchesUser = (session: Session | null, expectedUserId?: string) => {
  if (!session?.access_token) {
    return false;
  }

  if (!expectedUserId) {
    return true;
  }

  return session.user.id === expectedUserId;
};

const tokenExpiresSoon = (session: Session | null) => {
  if (!session?.expires_at) {
    return false;
  }

  return (session.expires_at * 1000) - Date.now() < 60_000;
};

const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
};

export const getAccessTokenForRequest = async (
  preferredSession?: Session | null,
  expectedUserId?: string,
) => {
  const requestUserId = expectedUserId ?? preferredSession?.user.id;
  let session = await getCurrentSession();

  if (!sessionMatchesUser(session, requestUserId)) {
    session = sessionMatchesUser(preferredSession ?? null, requestUserId)
      ? preferredSession ?? null
      : null;
  }

  if (!sessionMatchesUser(session, requestUserId)) {
    return '';
  }

  if (tokenExpiresSoon(session)) {
    try {
      const refreshedSession = await refreshSession();
      if (sessionMatchesUser(refreshedSession, requestUserId)) {
        session = refreshedSession;
      }
    } catch (error) {
      console.warn('Unable to refresh Supabase session before request:', error);
    }
  }

  return session?.access_token || '';
};

export const getCurrentAccessToken = async () => {
  return getAccessTokenForRequest();
};
