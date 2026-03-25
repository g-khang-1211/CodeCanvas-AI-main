import { Course } from '../types';

const createLevels = () => [
  { id: 'beginner' as const, title: 'Beginner', units: [] },
  { id: 'intermediate' as const, title: 'Intermediate', units: [] },
  { id: 'advanced' as const, title: 'Advanced', units: [] }
];

export const COURSES: Course[] = [
  {
    id: 'other',
    name: 'Other',
    icon: '✨',
    description: '',
    levels: createLevels()
  },
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    description: '',
    levels: createLevels()
  },
  {
    id: 'cpp',
    name: 'C++',
    icon: '🚀',
    description: '',
    levels: createLevels()
  },
  {
    id: 'js',
    name: 'JavaScript',
    icon: '⚡',
    description: '',
    levels: createLevels()
  },
  {
    id: 'ts',
    name: 'TypeScript',
    icon: '📘',
    description: '',
    levels: createLevels()
  },
  {
    id: 'java',
    name: 'Java',
    icon: '☕',
    description: '',
    levels: createLevels()
  },
  {
    id: 'csharp',
    name: 'C#',
    icon: '♯',
    description: '',
    levels: createLevels()
  },
  {
    id: 'sql',
    name: 'SQL',
    icon: '🗄️',
    description: '',
    levels: createLevels()
  },
  {
    id: 'html',
    name: 'HTML/CSS',
    icon: '🌐',
    description: '',
    levels: createLevels()
  },
  {
    id: 'rust',
    name: 'Rust',
    icon: '🦀',
    description: '',
    levels: createLevels()
  },
  {
    id: 'c',
    name: 'C',
    icon: '🇨',
    description: '',
    levels: createLevels()
  },
  {
    id: 'excel',
    name: 'Excel',
    icon: '📊',
    description: '',
    levels: createLevels()
  },
];
