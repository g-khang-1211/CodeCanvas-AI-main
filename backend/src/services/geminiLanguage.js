const LANGUAGE_MAP = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese (Simplified)',
  vi: 'Vietnamese',
  it: 'Italian',
  hi: 'Hindi',
  ar: 'Arabic',
  ja: 'Japanese',
  ko: 'Korean',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
};

export const getLanguageName = (code) => LANGUAGE_MAP[code] || 'English';
