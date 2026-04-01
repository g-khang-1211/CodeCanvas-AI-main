const parseJson = (text, fallback) => {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
};

export const parseFlashcards = (text) => parseJson(text || '[]', []);

export const parseSyllabusUnits = (courseName, level, text) => {
  const units = parseJson(text || '[]', []);

  return units.map((unit, index) => ({
    id: `${courseName}_${level}_${index}_${Date.now()}`,
    title: unit.title || `Unit ${index + 1}`,
    content: '',
    questions: [],
  }));
};

export const parseQuestions = (text) => {
  const parsed = parseJson(text || '{"questions":[]}', { questions: [] });

  return (parsed.questions || []).map((question, index) => ({
    ...question,
    id: question.id || `q_${Date.now()}_${index}`,
  }));
};

export const parseVideos = (text) => {
  const parsed = parseJson(text || '{}', { videos: [] });

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
