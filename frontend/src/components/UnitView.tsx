
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Flashcards } from './Flashcards';
import { generateUnitContent, fetchVideos } from '../services/geminiService';
import { ArrowLeft, X, RotateCcw } from 'lucide-react';
import { QuestionType, Video } from '../types';
import { useUnitViewState } from '../hooks/useUnitViewState';
import { useRequireApiKey } from '../hooks/useRequireApiKey';
import { UnitConfigPanel } from './unit/UnitConfigPanel';
import { QuizPanel } from './unit/QuizPanel';
import { VideosPanel } from './unit/VideosPanel';
import { MarkdownRenderer } from './MarkdownRenderer';

export const UnitView: React.FC = () => {
  const { 
    selectedUnit, selectedCourse, selectedLevel, selectUnit, updateUnitContent, t, language,
    hasApiKey
  } = useApp();
  const requireApiKey = useRequireApiKey();
  const {
    activeTab,
    configMode,
    matchingAnswers,
    quizCount,
    quizSubmitted,
    selectedAnswers,
    selectedTypes,
    showFrqAnswers,
    unitFocus,
    setActiveTab,
    setConfigMode,
    setMatchingAnswers,
    setQuizCount,
    setQuizSubmitted,
    setSelectedAnswers,
    setSelectedTypes,
    setShowFrqAnswers,
    setUnitFocus,
  } = useUnitViewState(selectedUnit);
  
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosFetched, setVideosFetched] = useState(false);
  
  // Request Cancellation Tracking
  const generationRequestId = useRef<number>(0);
  
  useEffect(() => {
    // Reset video state when unit changes
    setVideos([]);
    setVideosFetched(false);
  }, [selectedUnit?.id]);

  useEffect(() => {
    if (activeTab === 'videos' && !videosFetched && selectedUnit) {
      if (!hasApiKey) return;

      const loadVideos = async () => {
        setLoadingVideos(true);
        const topic = `${selectedCourse?.name} - ${selectedUnit.title}`;
        const results = await fetchVideos('backend-managed', topic, language);
        setVideos(results);
        setVideosFetched(true);
        setLoadingVideos(false);
      };
      loadVideos();
    }
  }, [activeTab, selectedUnit, videosFetched, selectedCourse, language, hasApiKey]);

  const handleStartLesson = async () => {
    if (selectedUnit && selectedCourse && selectedLevel) {
      const apiKey = requireApiKey();
      if (!apiKey) {
        return;
      }

      const requestId = Date.now();
      generationRequestId.current = requestId;
      
      // Immediately switch to content view and show loading state
      setConfigMode(false);
      setLoading(true);

      try {
        const data = await generateUnitContent(
          apiKey,
          selectedCourse.name, 
          selectedUnit.title, 
          selectedLevel.id, 
          language,
          { count: quizCount, types: selectedTypes },
          unitFocus,
          (partialContent) => {
            // Streaming callback
            if (generationRequestId.current === requestId) {
               // If this is the first chunk, stop loading spinner
               setLoading((prev) => {
                 if (prev) return false;
                 return prev;
               });
               // Update content in real-time
               updateUnitContent(selectedCourse.id, selectedLevel.id, selectedUnit.id, partialContent, []);
            }
          }
        );

        // Only update if this request is still the active one
        if (generationRequestId.current === requestId) {
          updateUnitContent(selectedCourse.id, selectedLevel.id, selectedUnit.id, data.content, data.questions);
          setLoading(false);
        }
      } catch (e) {
        if (generationRequestId.current === requestId) {
          setLoading(false);
          // Optionally revert config mode or show error
          setConfigMode(true);
        }
      }
    }
  };

  const handleCancelGeneration = () => {
    // Invalidate current request
    generationRequestId.current = 0;
    setLoading(false);
    // Go back to config mode
    setConfigMode(true);
  };

  const handleRegenerate = () => {
    if (selectedCourse && selectedLevel && selectedUnit) {
       // Clear current content effectively resetting to "not generated" state
       updateUnitContent(selectedCourse.id, selectedLevel.id, selectedUnit.id, "", []);
       // Explicitly switch to config mode
       setConfigMode(true);
    }
  };

  const toggleType = (type: QuestionType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type) && prev.length > 1) {
        return prev.filter(t => t !== type);
      } else if (!prev.includes(type)) {
        return [...prev, type];
      }
      return prev;
    });
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  if (!selectedUnit) return null;

  if (loading) {
     return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center animate-fade-in px-4">
           <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6" />
           <h2 className="text-xl font-bold dark:text-white mb-2">{t('generating_lesson')}</h2>
           <p className="text-gray-500 text-center max-w-md mb-8">{t('crafting_lesson')} {selectedUnit.title}</p>
           
           <button 
             onClick={handleCancelGeneration}
             className="flex items-center gap-2 px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
           >
             <X size={18} />
             {t('cancel')}
           </button>
        </div>
     )
  }

  // Initial Configuration Screen
  if (configMode) {
    return (
      <UnitConfigPanel
        onBack={() => selectUnit(null)}
        onStartLesson={handleStartLesson}
        quizCount={quizCount}
        selectedTypes={selectedTypes}
        setQuizCount={setQuizCount}
        t={t}
        toggleType={toggleType}
        unitFocus={unitFocus}
        unit={selectedUnit}
        onUnitFocusChange={setUnitFocus}
      />
    );
  }

  const handleMcqAnswer = (qId: string, idx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const handleMatchingAnswer = (qId: string, term: string, def: string) => {
    if (quizSubmitted) return;
    setMatchingAnswers(prev => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), [term]: def }
    }));
  };

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => selectUnit(null)} 
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {t('back')}
        </button>

        <button 
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          <RotateCcw size={12} />
          {t('regenerate')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {selectedUnit.title}
        </h1>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('learn')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'learn' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('learn')}
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'quiz' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('quiz')}
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'videos' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            {t('videos')}
          </button>
        </div>
      </div>

      {activeTab === 'learn' && (
        <div className="max-w-4xl mx-auto">
          <MarkdownRenderer content={selectedUnit.content} />
          <div className="my-16 border-t border-gray-100 dark:border-gray-800 pt-10">
            <Flashcards />
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <QuizPanel
          handleMatchingAnswer={handleMatchingAnswer}
          handleMcqAnswer={handleMcqAnswer}
          matchingAnswers={matchingAnswers}
          questions={selectedUnit.questions}
          quizSubmitted={quizSubmitted}
          selectedAnswers={selectedAnswers}
          setShowFrqAnswers={setShowFrqAnswers}
          showFrqAnswers={showFrqAnswers}
          submitQuiz={submitQuiz}
          t={t}
        />
      )}
      {activeTab === 'videos' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <VideosPanel loadingVideos={loadingVideos} videos={videos} />
        </div>
      )}
    </div>
  );
};
