export const getStorageItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorageItem = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors to preserve runtime behavior.
  }
};

export const removeStorageItem = (key: string) => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal errors to preserve runtime behavior.
  }
};

export const getStorageJson = <T>(key: string, fallback: T): T => {
  const stored = getStorageItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
};

export const setStorageJson = (key: string, value: unknown) => {
  setStorageItem(key, JSON.stringify(value));
};
