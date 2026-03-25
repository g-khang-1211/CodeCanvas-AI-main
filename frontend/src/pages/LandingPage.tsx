import { ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage = ({ onStart }: LandingPageProps) => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
    <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl flex items-center justify-center text-white font-bold text-5xl shadow-2xl mb-8">
      C
    </div>
    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
      CodeCanvas AI
    </h1>
    <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed">
      Your personal AI tutor for mastering any programming language.
      Dynamic curriculums, interactive quizzes, and intelligent flashcards.
    </p>
    <button
      onClick={onStart}
      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
    >
      Start Learning <ChevronRight size={20} />
    </button>
  </div>
);
