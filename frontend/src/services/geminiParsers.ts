import { Flashcard, Question, Unit, Video } from '../types';

const parseJson = <T>(text: string, fallback: T): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
};

export const parseFlashcards = (text: string): Flashcard[] => parseJson(text || '[]', []);

export const parseSyllabusUnits = (courseName: string, level: string, text: string): Unit[] => {
  const units = parseJson<Array<{ title?: string }>>(text || '[]', []);

  return units.map((unit, index) => ({
    id: `${courseName}_${level}_${index}_${Date.now()}`,
    title: unit.title || `Unit ${index + 1}`,
    content: '',
    questions: [],
  }));
};

export const parseQuestions = (text: string): Question[] => {
  const parsed = parseJson<{ questions?: Question[] }>(text || '{"questions":[]}', { questions: [] });

  return (parsed.questions || []).map((question, index) => ({
    ...question,
    id: question.id || `q_${Date.now()}_${index}`,
  }));
};

export const parseVideos = (text: string): Video[] => {
  const parsed = parseJson<{ videos?: Video[] }>(text || '{}', { videos: [] });

  return (parsed.videos || []).map((video) => {
    let videoId = video.videoId;

    if (videoId && videoId.length > 11) {
      const match = videoId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      if (match) {
        videoId = match[1];
      }
    }

    return { ...video, videoId };
  });
};
