
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateFlashcardsForTopic } from '../services/geminiService';
import { Flashcard } from '../types';
import { Brain, RotateCw, ChevronLeft, ChevronRight, Wand2, X } from 'lucide-react';

export const Flashcards: React.FC = () => {
  const { t, selectedUnit, selectedCourse, language, userApiKey, setShowSettings } = useApp();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(5);
  
  const requestId = useRef<number>(0);

  const handleGenerate = async () => {
    if (!selectedUnit) return;

    if (!userApiKey) {
      alert("Error: No API Key. Please add your API key in settings.");
      setShowSettings(true);
      return;
    }

    const id = Date.now();
    requestId.current = id;
    setLoading(true);
    
    const topic = `${selectedCourse?.name} - ${selectedUnit.title}`;
    try {
      const generated = await generateFlashcardsForTopic(userApiKey, topic, language, 'Beginner', count);
      if (requestId.current === id) {
        setCards(generated);
        setCurrentIndex(0);
        setIsFlipped(false);
        setLoading(false);
      }
    } catch (e) {
      if (requestId.current === id) {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    requestId.current = 0;
    setLoading(false);
  };

  if (!selectedUnit) return null;

  return (
    <div className="mt-12 mb-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
          <Brain className="text-blue-500" />
          {t('flashcards')}
        </h3>
        
        {cards.length === 0 && !loading && (
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-lg px-2 py-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2">{t('count')}:</span>
              <input 
                type="number" 
                min="3" 
                max="10" 
                value={count} 
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-12 bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
              />
            </div>
            <button 
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
            >
              <Wand2 size={14} />
              {t('generate_flashcards')}
            </button>
          </div>
        )}

        {loading && (
          <button 
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
          >
            <X size={14} />
            {t('cancel')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
           <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-gray-500 dark:text-gray-400 animate-pulse">Generating cards...</p>
        </div>
      ) : cards.length > 0 ? (
        <div className="flex flex-col items-center">
          <div 
            className="perspective-1000 w-full max-w-2xl h-80 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center">
                <span className="absolute top-6 left-6 text-xs font-bold text-gray-400 uppercase tracking-wider">Question</span>
                <p className="text-2xl font-medium text-gray-900 dark:text-white leading-relaxed">
                  {cards[currentIndex].front}
                </p>
                <div className="absolute bottom-6 text-gray-400 text-sm flex items-center gap-2">
                  <RotateCw size={14} /> Click to flip
                </div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center text-center rotate-y-180 text-white">
                <span className="absolute top-6 left-6 text-xs font-bold text-white/60 uppercase tracking-wider">Answer</span>
                <p className="text-xl font-medium leading-relaxed">
                  {cards[currentIndex].back}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <button 
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => (prev === 0 ? cards.length - 1 : prev - 1));
              }}
              className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 hover:scale-110 transition-transform"
            >
              <ChevronLeft size={20} className="dark:text-white" />
            </button>
            
            <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {cards.length}
            </span>

            <button 
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex(prev => (prev === cards.length - 1 ? 0 : prev + 1));
              }}
              className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700 hover:scale-110 transition-transform"
            >
              <ChevronRight size={20} className="dark:text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
           <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
             <Brain size={24} />
           </div>
           <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm px-4">
             Click "Generate Cards" to create AI-powered flashcards for this unit.
           </p>
        </div>
      )}
    </div>
  );
};
