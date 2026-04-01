import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});

const createScopedClient = (url, key, accessToken) =>
  createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

export const hasServiceRole = () => Boolean(getSupabaseConfig().serviceRoleKey);

export const createUserScopedSupabase = (accessToken) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !accessToken) {
    throw new Error('Supabase is not configured for authenticated requests.');
  }

  return createScopedClient(url, anonKey, accessToken);
};

export const createPrivilegedSupabase = (accessToken) => {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (serviceRoleKey) {
    return createScopedClient(url, serviceRoleKey, undefined);
  }

  return createUserScopedSupabase(accessToken);
};

export const verifyAccessToken = async (accessToken) => {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !accessToken) {
    return null;
  }

  const client = createScopedClient(url, anonKey, undefined);
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    return null;
  }

  return data.user;
};
