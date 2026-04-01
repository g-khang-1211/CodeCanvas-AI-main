import CryptoJS from 'crypto-js';
import { createPrivilegedSupabase } from './supabaseAdmin.js';

const LEGACY_MAIN_COMPAT_SECRET = 'codecanvas-client-secret-v1';

const getSecret = () => {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET?.trim();

  if (!secret) {
    throw new Error('Server misconfigured: missing API_KEY_ENCRYPTION_SECRET.');
  }

  return secret;
};

const encryptKey = (key) => {
  if (!key) {
    return '';
  }

  return CryptoJS.AES.encrypt(key, getSecret()).toString();
};

const tryDecryptKey = (cipherText, secret) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, secret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const decryptKey = (cipherText) => {
  if (!cipherText) {
    return '';
  }

  const secret = getSecret();

  try {
    const decrypted = tryDecryptKey(cipherText, secret);
    if (decrypted) {
      return decrypted;
    }

    if (cipherText.startsWith('U2FsdGVkX1') && secret !== LEGACY_MAIN_COMPAT_SECRET) {
      const legacyDecrypted = tryDecryptKey(cipherText, LEGACY_MAIN_COMPAT_SECRET);
      if (legacyDecrypted) {
        return legacyDecrypted;
      }
    }
  } catch (error) {
    console.error('Key decryption failed', error);
  }

  throw new Error('Failed to decrypt stored API key. Check API_KEY_ENCRYPTION_SECRET compatibility.');
};

const getProfileClient = (accessToken) => createPrivilegedSupabase(accessToken);

export const getKeyStatus = async ({ accessToken, userId }) => {
  const client = getProfileClient(accessToken);
  const { data, error } = await client
    .from('profiles')
    .select('has_api_key')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load key status');
  }

  return Boolean(data?.has_api_key);
};

export const getStoredApiKey = async ({ accessToken, userId }) => {
  const client = getProfileClient(accessToken);
  const { data, error } = await client
    .from('profiles')
    .select('api_key_encrypted, has_api_key')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Failed to load stored key');
  }

  if (!data?.has_api_key || !data.api_key_encrypted) {
    return '';
  }

  return decryptKey(data.api_key_encrypted);
};

export const saveApiKey = async ({ accessToken, user }) => {
  const client = getProfileClient(accessToken);
  const encrypted = encryptKey(user.apiKey);
  const payload = {
    id: user.id,
    email: user.email,
    api_key_encrypted: encrypted,
    has_api_key: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message || 'Failed to save key');
  }
};
