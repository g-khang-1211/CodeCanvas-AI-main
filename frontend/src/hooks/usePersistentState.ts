import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getStorageItem, removeStorageItem, setStorageItem } from '../utils/storage';

export const usePersistentState = <T>(
  key: string,
  initialValue: T
) => {
  const [value, setValue] = useState<T>(() => {
    const stored = getStorageItem(key);
    return stored !== null ? (stored as T) : initialValue;
  });

  useEffect(() => {
    if (value === '') {
      removeStorageItem(key);
      return;
    }

    setStorageItem(key, String(value));
  }, [key, value]);

  return [value, setValue] as [T, Dispatch<SetStateAction<T>>];
};
