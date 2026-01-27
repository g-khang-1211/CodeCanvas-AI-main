
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Flashcard, Unit, Question, QuestionType, Video } from "../types";

// Helper to get full language name
const getLanguageName = (code: string) => {
  const map: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    zh: "Chinese (Simplified)",
    vi: "Vietnamese",
    it: "Italian",
    hi: "Hindi",
    ar: "Arabic",
    ja: "Japanese",
    ko: "Korean",
    pt: "Portuguese",
    ru: "Russian",
    tr: "Turkish"
  };
  return map[code] || "English";
}

export const generateChatResponse = async (
  apiKey: string,
  history: ChatMessage[], 
  currentMessage: string, 
  context: string,
  languageCode: string = 'en'
): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please check your settings.";

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const model = ai.models;
    const response = await model.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: You are a friendly, expert tutor. The user is currently studying: ${context}.
      
      User History: ${JSON.stringify(history.slice(-5))}
      
      User Question: ${currentMessage}
      
      Instructions:
      1. Provide a concise, helpful explanation in ${lang}.
      2. Use Markdown for formatting. 
      3. STRICT UI RENDERING RULES (Prevent Broken UI):
         - Inline code (\`...\`) is ONLY for identifiers or expressions longer than one character (e.g. print() or file.ext).
         - CRITICAL: Simple types like 'string', 'number', 'boolean', 'int', 'float', 'void' MUST be formatted as inline code (\`string\`), NEVER as code blocks.
         - NEVER format single characters or punctuation as code.
         - The following must NEVER appear as code (inline or block): : ; ( ) { } [ ] = => + - * /
         - Code blocks (\`\`\`...\`\`\`) are ONLY for multi-line examples.
         - A code block MUST contain at least one newline.
         - A code block MUST contain at least one letter or digit.
         - A code block MUST show a complete, meaningful example.
         - NEVER place a single symbol, operator, or token inside a code block.
         - Prohibited behavior:
           - Do NOT isolate symbols on their own line.
           - Do NOT “demonstrate” syntax by showing only punctuation.
           - Do NOT use a code block unless the example would compile or run if copied.
         - Explanation rules:
           - When explaining syntax such as colons, arrows, or brackets, explain them in plain text sentences.
           - Use words, not symbols, when possible.
         - Formatting rules:
           - Inline code: single backticks.
           - Code blocks: triple backticks with a language tag.
           - If a choice is ambiguous, prefer plain text over code.
      4. Keep it encouraging and clean.
      5. Ensure all information included is correct and up-to-date.`,
    });
    
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error connecting to the AI. Please check your API key.";
  }
};

export const generateFlashcardsForTopic = async (
  apiKey: string,
  topic: string, 
  languageCode: string, 
  difficulty: string,
  count: number = 5
): Promise<Flashcard[]> => {
  if (!apiKey) return [{ front: "API Key Missing", back: "Please check your settings." }];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${count} educational flashcards for the topic: "${topic}". 
      Target audience: ${difficulty} level.
      Output Language: ${lang}.
      
      Return ONLY a JSON array of objects with "front" (question/concept) and "back" (answer/explanation) properties.
      Ensure the content is in ${lang}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              back: { type: Type.STRING }
            },
            required: ['front', 'back']
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Flashcard Gen Error:", error);
    return [{ front: "Error", back: "Could not generate cards. Check API Key." }];
  }
};

export const generateSyllabus = async (
  apiKey: string,
  courseName: string,
  level: string,
  focus: string = "general",
  languageCode: string = "en"
): Promise<Unit[]> => {
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  // Special handling if course is 'Other' or 'Custom'
  const isCustom = courseName.toLowerCase().includes('custom') || courseName.toLowerCase().includes('other');
  const promptContext = isCustom 
    ? `Create a syllabus of 5 units for learning the topic: "${focus}". Level: ${level}.` 
    : `Create a syllabus of 5 units for learning ${courseName} at a ${level} level. Focus area: ${focus}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${promptContext}
      Output Language: ${lang}.
      
      Return a JSON array of objects with 'id', 'title', 'content' (empty string), and 'questions' (empty array).
      The 'id' should be unique-ish (e.g., 'unit_1').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING }, // Initial empty
              questions: { type: Type.ARRAY, items: { type: Type.STRING } } // Initial empty
            },
            required: ['id', 'title']
          }
        }
      }
    });
    
    const units = JSON.parse(response.text || "[]");
    // Ensure structure
    return units.map((u: any, i: number) => ({
      id: `${courseName}_${level}_${i}_${Date.now()}`,
      title: u.title,
      content: "",
      questions: []
    }));

  } catch (error) {
    console.error("Syllabus Gen Error:", error);
    return [];
  }
};

export const generateUnitContent = async (
  apiKey: string,
  courseName: string,
  unitTitle: string,
  level: string,
  languageCode: string = "en",
  quizConfig: { count: number; types: QuestionType[] } = { count: 3, types: ['mcq'] },
  focus: string = "",
  onProgress?: (partialContent: string) => void
): Promise<{ content: string; questions: Question[] }> => {
  if (!apiKey) return { content: "API Key missing. Please check configuration.", questions: [] };

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);
  const typeStr = quizConfig.types.join(', ');

  try {
    // Start Quiz generation in parallel (Promise)
    const quizPromise = ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate ${quizConfig.count} quiz questions for ${courseName} (${level}) on topic "${unitTitle}".
      Allowed Question Types: ${typeStr}.
      Output Language: ${lang}.
      IMPORTANT: The 'text', 'options', 'answer', and 'pairs' MUST be in ${lang}. However, keep specific code syntax or keywords in English/Code format if required.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  answer: { type: Type.STRING },
                  pairs: { 
                    type: Type.ARRAY, 
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        term: { type: Type.STRING },
                        definition: { type: Type.STRING }
                      }
                    } 
                  }
                },
                required: ['text', 'type']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    // Start Content generation (Streaming)
    const contentStreamResponse = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: `Write a comprehensive, engaging educational lesson for ${courseName} (${level}) on the topic: "${unitTitle}".
      ${focus ? `Focus primarily on: ${focus}` : ''}
      Output Language: ${lang}.
      
      Formatting Requirements:
      1. Use Markdown.
      2. STRUCTURE IS IMPORTANT: Use H2 headers (##) and H3 headers (###) frequently to break up sections.
      3. Use bullet points for lists.
      4. Use bold text for key terms.
      5. STRICT UI RENDERING RULES (Prevent Broken UI):
          - Inline code (\`...\`) is ONLY for identifiers or expressions longer than one character (e.g. print() or file.ext).
          - CRITICAL: Simple types like 'string', 'number', 'boolean', 'int', 'float', 'void' MUST be formatted as inline code (\`string\`), NEVER as code blocks.
          - NEVER format single characters or punctuation as code.
          - The following must NEVER appear as code (inline or block): : ; ( ) { } [ ] = => + - * /
          - Code blocks (\`\`\`...\`\`\`) are ONLY for multi-line examples.
          - A code block MUST contain at least one newline.
          - A code block MUST contain at least one letter or digit.
          - A code block MUST show a complete, meaningful example.
          - NEVER place a single symbol, operator, or token inside a code block.
          - Prohibited behavior:
            - Do NOT isolate symbols on their own line.
            - Do NOT “demonstrate” syntax by showing only punctuation.
            - Do NOT use a code block unless the example would compile or run if copied.
          - Explanation rules:
            - When explaining syntax such as colons, arrows, or brackets, explain them in plain text sentences.
            - Use words, not symbols, when possible.
          - Formatting rules:
            - Inline code: single backticks.
            - Code blocks: triple backticks with a language tag.
            - If a choice is ambiguous, prefer plain text over code.
      6. Explain concepts clearly with examples, avoiding massive walls of text.`,
    });

    let fullContentText = "";
    
    // Process stream
    for await (const chunk of contentStreamResponse) {
      const chunkText = (chunk as GenerateContentResponse).text;
      if (chunkText) {
        fullContentText += chunkText;
        if (onProgress) {
          onProgress(fullContentText);
        }
      }
    }

    // Await quiz response after content is done (or it might already be done)
    const quizResponse = await quizPromise;
    const quizJson = JSON.parse(quizResponse.text || "{\"questions\": []}");
    
    // Add IDs if missing
    const questions = (quizJson.questions || []).map((q: any, i: number) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${i}`
    }));

    return {
      content: fullContentText,
      questions: questions
    };

  } catch (error) {
    console.error("Unit Content Gen Error:", error);
    return {
      content: "Failed to generate content. Please check your API key and try again.",
      questions: []
    };
  }
};

export const fetchVideos = async (
  apiKey: string,
  topic: string, 
  languageCode: string
): Promise<Video[]> => {
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });
  const lang = getLanguageName(languageCode);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find 3 helpful YouTube video tutorials for the topic: "${topic}".
      Language: ${lang}.
      
      Instructions:
      1. Use Google Search to find video IDs.
      2. Prefer official tutorials or high-quality educational channels that allow embedding.
      3. Return ONLY a JSON object.
      
      JSON Schema:
      {
        "videos": [
          { "title": "string", "videoId": "string (11 char ID ONLY)", "description": "short string" }
        ]
      }`,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    
    // Robust ID extraction/sanitization
    const videos = (data.videos || []).map((v: any) => {
      // If the AI returns a full URL, extract the ID
      let id = v.videoId;
      if (id.length > 11) {
        const match = id.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
        if (match) id = match[1];
      }
      return { ...v, videoId: id };
    });

    return videos;
  } catch (error) {
    console.error("Fetch Videos Error:", error);
    return [];
  }
};
