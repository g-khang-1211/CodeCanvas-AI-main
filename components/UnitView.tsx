
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Flashcards } from './Flashcards';
import { generateUnitContent, fetchVideos } from '../services/geminiService';
import { ArrowLeft, CheckCircle, AlertCircle, Eye, SlidersHorizontal, Play, Youtube, AlertTriangle, ExternalLink, X, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { QuestionType, Video } from '../types';

export const UnitView: React.FC = () => {
  const { 
    selectedUnit, selectedCourse, selectedLevel, selectUnit, updateUnitContent, t, language,
    userApiKey, setShowSettings
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<'learn' | 'quiz' | 'videos'>('learn');
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosFetched, setVideosFetched] = useState(false);
  
  // Request Cancellation Tracking
  const generationRequestId = useRef<number>(0);
  
  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({}); // For MCQ
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, string>>>({}); // For Matching: qId -> term -> selectedDefinition
  const [showFrqAnswers, setShowFrqAnswers] = useState<Record<string, boolean>>({}); // For FRQ
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Configuration State
  const [configMode, setConfigMode] = useState(!selectedUnit?.content);
  const [quizCount, setQuizCount] = useState(3);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['mcq']);
  const [unitFocus, setUnitFocus] = useState('');

  useEffect(() => {
    // Reset video state when unit changes
    setVideos([]);
    setVideosFetched(false);
    setActiveTab('learn');
    setUnitFocus('');
  }, [selectedUnit?.id]);

  useEffect(() => {
    if (activeTab === 'videos' && !videosFetched && selectedUnit) {
      if (!userApiKey) {
         // Optionally alert here or just show the settings when they switch tabs
         return; 
      }

      const loadVideos = async () => {
        setLoadingVideos(true);
        const topic = `${selectedCourse?.name} - ${selectedUnit.title}`;
        const results = await fetchVideos(userApiKey, topic, language);
        setVideos(results);
        setVideosFetched(true);
        setLoadingVideos(false);
      };
      loadVideos();
    }
  }, [activeTab, selectedUnit, videosFetched, selectedCourse, language, userApiKey]);

  const handleStartLesson = async () => {
    if (selectedUnit && selectedCourse && selectedLevel) {
      if (!userApiKey) {
        alert("Error: No API Key. Please add your API key in settings.");
        setShowSettings(true);
        return;
      }

      const requestId = Date.now();
      generationRequestId.current = requestId;
      
      // Immediately switch to content view and show loading state
      setConfigMode(false);
      setLoading(true);

      try {
        const data = await generateUnitContent(
          userApiKey,
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
      <div className="max-w-xl mx-auto pt-10 animate-fade-in">
        <button 
          onClick={() => selectUnit(null)} 
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {t('back')}
        </button>
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <SlidersHorizontal size={28} />
          </div>
          <h2 className="text-2xl font-bold dark:text-white mb-2">{t('customize_quiz')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{selectedUnit.title}</p>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {t('unit_focus_label')}
              </label>
              <input 
                 type="text"
                 value={unitFocus}
                 onChange={(e) => setUnitFocus(e.target.value)}
                 placeholder={t('unit_focus_placeholder')}
                 className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                {t('num_questions')}: <span className="text-blue-600">{quizCount}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={quizCount} 
                onChange={(e) => setQuizCount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                {t('question_types')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'mcq' as const, label: 'MCQ' },
                  { id: 'frq' as const, label: 'Open Ended' },
                  { id: 'matching' as const, label: 'Matching' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                      selectedTypes.includes(type.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleStartLesson}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              {t('start_lesson')}
            </button>
          </div>
        </div>
      </div>
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
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown 
               components={{
                 h1: ({children}) => <h1 className="text-4xl font-extrabold mt-12 mb-6 text-gray-900 dark:text-white leading-tight">{children}</h1>,
                 h2: ({children}) => <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3">{children}</h2>,
                 h3: ({children}) => <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-200">{children}</h3>,
                 p: ({children}) => <p className="text-lg leading-loose mb-6 text-gray-700 dark:text-gray-300">{children}</p>,
                 ul: ({children}) => <ul className="list-disc pl-6 mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">{children}</ul>,
                 ol: ({children}) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">{children}</ol>,
                 li: ({children}) => <li className="pl-2">{children}</li>,
                 code: ({node, inline, className, children, ...props}: any) => {
                   const content = String(children).replace(/\n$/, '');
                   const isMultiLine = content.includes('\n');

                   if (inline || !isMultiLine) {
                     return (
                       <code className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[0.9em] font-mono border border-indigo-100 dark:border-indigo-800/50 align-middle" {...props}>
                         {children}
                       </code>
                     );
                   }
                   return (
                     <div className="my-10 rounded-2xl overflow-hidden shadow-2xl bg-[#1e1e1e] border border-gray-700/50 transform transition-transform hover:scale-[1.01] duration-300">
                       <div className="flex items-center gap-2 px-5 py-3 bg-[#2d2d2d] border-b border-gray-700/50">
                         <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                         <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                         <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                         <div className="ml-auto text-xs text-gray-500 font-mono opacity-50">code</div>
                       </div>
                       <div className="p-6 overflow-x-auto">
                         <code className="font-mono text-sm text-gray-200 leading-relaxed block" {...props}>
                           {children}
                         </code>
                       </div>
                     </div>
                   );
                 },
                 blockquote: ({children}) => (
                   <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-8 italic bg-blue-50/50 dark:bg-blue-900/10 rounded-r-xl text-gray-700 dark:text-gray-300">
                     {children}
                   </blockquote>
                 )
               }}
            >
              {selectedUnit.content}
            </ReactMarkdown>
          </div>
          <div className="my-16 border-t border-gray-100 dark:border-gray-800 pt-10">
            <Flashcards />
          </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-8">
          {selectedUnit.questions.length === 0 ? (
            <div className="text-center text-gray-500">No questions generated.</div>
          ) : (
             selectedUnit.questions.map((q, idx) => {
                if (q.type === 'mcq' && q.options) {
                  return (
                    <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                        {q.text}
                      </h4>
                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          let btnClass = "w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ";
                          if (quizSubmitted) {
                            if (optIdx === q.correctIndex) btnClass += "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300 ";
                            else if (selectedAnswers[q.id] === optIdx) btnClass += "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:text-red-300 ";
                            else btnClass += "border-transparent bg-gray-50 dark:bg-gray-700/50 opacity-50 dark:text-gray-400 ";
                          } else {
                            if (selectedAnswers[q.id] === optIdx) btnClass += "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 ";
                            else btnClass += "border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-300 ";
                          }
                          return (
                            <button key={optIdx} onClick={() => handleMcqAnswer(q.id, optIdx)} className={btnClass}>
                              <div className="flex items-center justify-between">
                                {opt}
                                {quizSubmitted && optIdx === q.correctIndex && <CheckCircle size={16} className="text-green-600" />}
                                {quizSubmitted && selectedAnswers[q.id] === optIdx && optIdx !== q.correctIndex && <AlertCircle size={16} className="text-red-500" />}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  );
                }
                if (q.type === 'frq') {
                  return (
                    <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                        {q.text}
                      </h4>
                      <textarea 
                        className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white h-32 mb-4"
                        placeholder={t('type_message')}
                      ></textarea>
                      <button 
                        onClick={() => setShowFrqAnswers(prev => ({...prev, [q.id]: !prev[q.id]}))}
                        className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-2 hover:underline"
                      >
                        <Eye size={16} /> {t('reveal_answer')}
                      </button>
                      {showFrqAnswers[q.id] && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300 text-sm">
                          <strong>{t('model_answer')}:</strong> {q.answer}
                        </div>
                      )}
                    </div>
                  );
                }
                if (q.type === 'matching' && q.pairs) {
                  return (
                    <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                        <span className="text-gray-400 mr-2">{idx + 1}.</span>
                        {q.text || t('match_pairs')}
                      </h4>
                      <div className="space-y-4">
                        {q.pairs.map((pair, pIdx) => {
                          const currentAnswer = matchingAnswers[q.id]?.[pair.term];
                          const isCorrect = quizSubmitted && currentAnswer === pair.definition;
                          
                          return (
                            <div key={pIdx} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                              <div className="flex-1 font-semibold text-gray-800 dark:text-gray-200">{pair.term}</div>
                              <div className="hidden sm:block text-gray-400">→</div>
                              <select 
                                value={currentAnswer || ""}
                                onChange={(e) => handleMatchingAnswer(q.id, pair.term, e.target.value)}
                                disabled={quizSubmitted}
                                className={`flex-1 p-2.5 rounded-lg border text-sm outline-none transition-colors ${
                                  quizSubmitted 
                                    ? (isCorrect 
                                        ? "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                        : "bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-200")
                                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white focus:border-blue-500"
                                }`}
                              >
                                <option value="">{t('select_match')}</option>
                                {q.pairs?.map((p) => (
                                  <option key={p.definition} value={p.definition}>{p.definition}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
            })
          )}

          <div className="sticky bottom-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
             <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
               {quizSubmitted ? t('submit') : t('submit')}
             </div>
             <button
               onClick={submitQuiz}
               disabled={quizSubmitted || selectedUnit.questions.length === 0}
               className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-blue-500/30"
             >
               {t('submit')}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
