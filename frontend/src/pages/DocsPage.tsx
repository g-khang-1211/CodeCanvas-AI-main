export const DocsPage = () => (
  <div className="p-8 max-w-4xl mx-auto animate-fade-in text-slate-900 dark:text-white">
    <h1 className="text-4xl font-bold mb-6">Documentation</h1>
    <div className="prose dark:prose-invert max-w-none">
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
        CodeCanvas AI uses the Gemini API to generate real-time educational content.
      </p>
      <h3 className="text-2xl font-bold mb-2">Features</h3>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Custom Syllabus Generation</li>
        <li>Interactive Quizzes (MCQ, FRQ, Matching)</li>
        <li>Flashcard generation for spaced repetition</li>
        <li>AI Chat Tutor with context awareness</li>
      </ul>
      <h3 className="text-2xl font-bold mb-2">Getting Started</h3>
      <p>1. Sign in with Google.</p>
      <p>2. Enter your Gemini API Key in Settings.</p>
      <p>3. Select a course or create a custom one.</p>
    </div>
  </div>
);
