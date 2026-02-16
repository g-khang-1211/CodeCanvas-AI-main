
import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Settings } from './components/Settings';
import { AIChat } from './components/AIChat';
import { UnitView } from './components/UnitView';
import { Login } from './components/Login';
import { generateSyllabus } from './services/geminiService';
import { LayoutGrid, BookOpen, Settings as SettingsIcon, ChevronRight, Wand2, Sparkles, X, Home, FileText, Heart, LogIn } from 'lucide-react';

// --- Sub-components for Static Pages ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
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

const DocsPage = () => (
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

const CreditsPage = () => (
  <div className="p-8 max-w-4xl mx-auto animate-fade-in text-center">
    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-8">Credits</h1>
    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800">
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
        Built with ❤️ by the CodeCanvas Team.
      </p>
      <p className="text-slate-500 dark:text-slate-500">
        Powered by Google Gemini • React • Supabase • TailwindCSS
      </p>
    </div>
  </div>
);

// --- Main App Logic ---

const MainContent = () => {
  const { 
    t, courses, selectedCourse, selectCourse, selectedLevel, selectLevel, 
    selectedUnit, selectUnit, updateCourseUnits, language, userApiKey, 
    showSettings, setShowSettings, session, loadingSession 
  } = useApp();
  
  const [currentPage, setCurrentPage] = useState<'home' | 'dashboard' | 'docs' | 'credits' | 'auth'>('home');
  const [syllabusFocus, setSyllabusFocus] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [subjectError, setSubjectError] = useState(false);
  const [generatingSyllabus, setGeneratingSyllabus] = useState(false);

  const syllabusRequestId = useRef<number>(0);

  // Auth Redirect Handler
  useEffect(() => {
    if (session) {
      if (currentPage === 'auth') setCurrentPage('dashboard');
      // If user logs in from home, go to dashboard automatically if they have a key? 
      // No, let them explore home first, or if they were at auth, push them in.
    }
  }, [session, currentPage]);

  useEffect(() => {
    if (session && !loadingSession && !userApiKey) {
      setShowSettings(true);
    }
  }, [session, loadingSession, userApiKey]);

  const handleGenerateSyllabus = async () => {
    if (!selectedCourse || !selectedLevel) return;
    if (!userApiKey) {
      alert("Error: No API Key. Please add your API key in settings.");
      setShowSettings(true);
      return;
    }

    let targetCourseName = selectedCourse.name;
    let targetFocus = syllabusFocus;

    if (selectedCourse.id === 'other') {
      if (!customSubject.trim()) {
        setSubjectError(true);
        return;
      }
      targetCourseName = customSubject;
    }

    const requestId = Date.now();
    syllabusRequestId.current = requestId;
    setGeneratingSyllabus(true);

    try {
      const units = await generateSyllabus(
        userApiKey,
        targetCourseName, 
        selectedLevel.id, 
        targetFocus || `General ${targetCourseName} concepts`,
        language
      );
      
      if (syllabusRequestId.current === requestId) {
        updateCourseUnits(selectedCourse.id, selectedLevel.id, units);
        setGeneratingSyllabus(false);
        setSyllabusFocus('');
        setCustomSubject('');
      }
    } catch (error) {
       if (syllabusRequestId.current === requestId) setGeneratingSyllabus(false);
    }
  };

  const handleCancelSyllabus = () => {
    syllabusRequestId.current = 0;
    setGeneratingSyllabus(false);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Unit View (Full Screen Override)
  if (selectedUnit) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0B0F]">
        <div className="max-w-5xl mx-auto px-6 py-8">
           <UnitView />
        </div>
        <AIChat />
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        <button 
           onClick={() => setShowSettings(true)}
           className={`fixed top-6 ${language === 'ar' ? 'left-6' : 'right-6'} p-3 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors z-30`}
        >
          <SettingsIcon size={20} className="dark:text-white" />
        </button>
      </div>
    );
  }

  // --- Main Layout ---
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0B0F] flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-white dark:bg-[#121214] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col sticky top-0 md:h-screen z-20">
        <div className="flex items-center gap-3 mb-8 md:mb-10">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">C</div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">CodeCanvas</h1>
        </div>
        
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
            { id: 'docs', icon: FileText, label: 'Documentation' },
            { id: 'credits', icon: Heart, label: 'Credits' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'dashboard' && !session) {
                  setCurrentPage('auth');
                } else {
                  setCurrentPage(item.id as any);
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
                currentPage === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 hidden md:block space-y-3">
          {session ? (
            <button 
              onClick={() => setShowSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
            >
              <SettingsIcon size={18} />
              {t('settings')}
            </button>
          ) : (
            <button 
              onClick={() => setCurrentPage('auth')}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold justify-center hover:opacity-90 transition-opacity"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
          
          <a 
            href="http://buymeacoffee.com/kelvinomg1l" 
            target="_blank" 
            rel="noreferrer"
            // className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 rounded-xl font-bold text-sm hover:bg-yellow-400/20 transition-colors"
            className="hidden"
          >
            ☕ Donate 
          </a>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)] md:h-screen">
        {currentPage === 'home' && <LandingPage onStart={() => session ? setCurrentPage('dashboard') : setCurrentPage('auth')} />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'credits' && <CreditsPage />}
        {currentPage === 'auth' && <Login />}
        
        {currentPage === 'dashboard' && session && (
          <div className="p-6 md:p-12 max-w-6xl mx-auto">
            {!selectedCourse ? (
               <div className="animate-fade-in">
                 <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t('welcome')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">{t('continue_learning')}</p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {courses.map(course => (
                     <button
                       key={course.id}
                       onClick={() => selectCourse(course)}
                       className="group bg-white dark:bg-[#151518] p-6 rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-slate-100 dark:border-slate-800 text-left"
                     >
                       <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                         {course.icon}
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t(`course_${course.id}`) || course.name}</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t(`desc_${course.id}`)}</p>
                     </button>
                   ))}
                 </div>
               </div>
            ) : !selectedLevel ? (
              <div className="animate-fade-in">
                <button onClick={() => selectCourse(null)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  <ChevronRight size={16} className={`rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} /> {t('back')}
                </button>
                <div className="flex items-center gap-4 mb-8">
                  <span className="text-4xl">{selectedCourse.icon}</span>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t(`course_${selectedCourse.id}`) || selectedCourse.name}</h2>
                </div>
                
                <div className="space-y-4">
                  {selectedCourse.levels.map(level => (
                    <button
                      key={level.id}
                      onClick={() => selectLevel(level)}
                      className="w-full bg-white dark:bg-[#151518] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-between group"
                    >
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{t(`level_${level.id.substring(0,3)}`) || level.title}</h4>
                        <p className="text-sm text-slate-500">{level.units.length > 0 ? `${level.units.length} ${t('units_created')}` : t('create_custom_syllabus')}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                 <button onClick={() => selectLevel(null)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                  <ChevronRight size={16} className={`rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} /> {t('back')}
                </button>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{t(`level_${selectedLevel.id.substring(0,3)}`)}</h2>
                <p className="text-slate-500 mb-8">{t('select_unit_prompt')}</p>
                
                <div className="grid gap-4">
                  {selectedLevel.units.length > 0 ? (
                    <>
                      {selectedLevel.units.map((unit, idx) => (
                        <button
                          key={unit.id}
                          onClick={() => selectUnit(unit)}
                          className="bg-white dark:bg-[#151518] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white flex-1">{unit.title}</span>
                          <BookOpen size={18} className="text-slate-400" />
                        </button>
                      ))}
                      <button 
                         onClick={() => updateCourseUnits(selectedCourse.id, selectedLevel.id, [])}
                         className="mt-6 text-sm text-red-500 hover:underline"
                      >
                        {t('reset_syllabus')}
                      </button>
                    </>
                  ) : (
                    <div className="bg-white dark:bg-[#151518] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        <Wand2 size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('design_path')}</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        {selectedCourse.id === 'other' ? t('other_prompt_desc') : t('tell_ai')}
                      </p>
                      
                      <div className="max-w-md mx-auto space-y-4">
                        {selectedCourse.id === 'other' ? (
                          <>
                            <div className="text-left">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                  {t('subject_label')} <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={customSubject}
                                onChange={(e) => { setCustomSubject(e.target.value); setSubjectError(false); }}
                                placeholder={t('subject_placeholder')}
                                className={`w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 ${subjectError ? 'border-red-500 focus:ring-red-500' : 'border-transparent focus:ring-blue-500'} focus:ring-2 outline-none text-slate-900 dark:text-white transition-all`}
                              />
                              {subjectError && <p className="text-red-500 text-xs mt-1 ml-1">This field is required</p>}
                            </div>
                            
                            <div className="text-left">
                              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                  {t('focus_label')} <span className="text-slate-400 font-normal text-xs">({t('optional')})</span>
                              </label>
                              <input 
                                type="text" 
                                value={syllabusFocus}
                                onChange={(e) => setSyllabusFocus(e.target.value)}
                                placeholder={t('focus_placeholder')}
                                className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                              />
                            </div>
                          </>
                        ) : (
                          <input 
                            type="text" 
                            value={syllabusFocus}
                            onChange={(e) => setSyllabusFocus(e.target.value)}
                            placeholder="E.g. Web scraping, APIs..."
                            className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                          />
                        )}
                        
                        {generatingSyllabus ? (
                          <button 
                            onClick={handleCancelSyllabus}
                            className="w-full py-4 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            <X size={20} />
                            {t('cancel')}
                          </button>
                        ) : (
                          <button 
                            onClick={handleGenerateSyllabus}
                            disabled={generatingSyllabus}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            <Sparkles size={20} />
                            {t('generate_syllabus')}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AIChat />
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
