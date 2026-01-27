
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'vi' | 'it' | 'hi' | 'ar' | 'ja' | 'ko' | 'pt' | 'ru' | 'tr';

export type AppTheme = 'light' | 'dark';

export interface UserProfile {
  id: string;
  email: string;
  has_api_key: boolean;
  api_key_encrypted?: string; // Optional because we might only fetch the boolean
}

export interface TranslationDictionary {
  [key: string]: {
    [code in LanguageCode]: string;
  };
}

export type QuestionType = 'mcq' | 'frq' | 'matching';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctIndex?: number;
  answer?: string; 
  pairs?: { term: string; definition: string }[]; 
}

export interface Unit {
  id: string;
  title: string;
  content: string;
  questions: Question[];
}

export interface Level {
  id: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  units: Unit[];
}

export interface Course {
  id: string;
  name: string;
  icon: string;
  description: string;
  levels: Level[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Video {
  videoId: string;
  title: string;
  description: string;
}
