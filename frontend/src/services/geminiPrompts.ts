import { ChatMessage, QuestionType } from '../types';

export const buildChatPrompt = (
  context: string,
  history: ChatMessage[],
  currentMessage: string,
  language: string
) => `Context: You are a friendly, expert tutor. The user is currently studying: ${context}.
      
      User History: ${JSON.stringify(history.slice(-5))}
      
      User Question: ${currentMessage}
      
      Instructions:
      1. Provide a concise, helpful explanation in ${language}.
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
      5. Ensure all information included is correct and up-to-date.`;

export const buildFlashcardsPrompt = (
  topic: string,
  difficulty: string,
  count: number,
  language: string
) => `Generate ${count} educational flashcards for the topic: "${topic}". 
      Target audience: ${difficulty} level.
      Output Language: ${language}.
      
      Return ONLY a JSON array of objects with "front" (question/concept) and "back" (answer/explanation) properties.
      Ensure the content is in ${language}.`;

export const buildSyllabusPrompt = (
  courseName: string,
  level: string,
  focus: string,
  language: string
) => {
  const isCustom = courseName.toLowerCase().includes('custom') || courseName.toLowerCase().includes('other');
  const promptContext = isCustom
    ? `Create a syllabus of 5 units for learning the topic: "${focus}". Level: ${level}.`
    : `Create a syllabus of 5 units for learning ${courseName} at a ${level} level. Focus area: ${focus}.`;

  return `${promptContext}
      Output Language: ${language}.
      
      Return a JSON array of objects with 'id', 'title', 'content' (empty string), and 'questions' (empty array).
      The 'id' should be unique-ish (e.g., 'unit_1').`;
};

export const buildQuizPrompt = (
  courseName: string,
  level: string,
  unitTitle: string,
  questionCount: number,
  questionTypes: QuestionType[],
  language: string
) => `Generate ${questionCount} quiz questions for ${courseName} (${level}) on topic "${unitTitle}".
      Allowed Question Types: ${questionTypes.join(', ')}.
      Output Language: ${language}.
      IMPORTANT: The 'text', 'options', 'answer', and 'pairs' MUST be in ${language}. However, keep specific code syntax or keywords in English/Code format if required.`;

export const buildLessonPrompt = (
  courseName: string,
  level: string,
  unitTitle: string,
  focus: string,
  language: string
) => `Write a comprehensive, engaging educational lesson for ${courseName} (${level}) on the topic: "${unitTitle}".
      ${focus ? `Focus primarily on: ${focus}` : ''}
      Output Language: ${language}.
      
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
      6. Explain concepts clearly with examples, avoiding massive walls of text.`;

export const buildVideosPrompt = (topic: string, language: string) => `Find 3 helpful YouTube video tutorials for the topic: "${topic}".
      Language: ${language}.
      
      Instructions:
      1. Use Google Search to find video IDs.
      2. Prefer official tutorials or high-quality educational channels that allow embedding.
      3. Return ONLY a JSON object.
      
      JSON Schema:
      {
        "videos": [
          { "title": "string", "videoId": "string (11 char ID ONLY)", "description": "short string" }
        ]
      }`;
