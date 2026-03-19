
import CryptoJS from 'crypto-js';

// In a production app, use a secure secret management system.
// For this client-side implementation, we use a fixed secret key to obfuscate the API Key in the DB.
// This ensures that even if someone sees the raw DB table, they don't see plain text keys immediately.
const SECRET = 'codecanvas-client-secret-v1'; 

export const encryptKey = (key: string): string => {
  if (!key) return '';
  return CryptoJS.AES.encrypt(key, SECRET).toString();
};

export const decryptKey = (cipherText: string): string => {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.error("Decryption failed", e);
    return '';
  }
};
