
import { createClient } from '@supabase/supabase-js';

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
