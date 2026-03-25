
import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Settings } from './components/Settings';
import { AIChat } from './components/AIChat';
import { UnitView } from './components/UnitView';
import { Login } from './components/Login';
import { generateSyllabus } from './services/geminiService';
import { Settings as SettingsIcon } from 'lucide-react';
import { CourseGrid } from './components/dashboard/CourseGrid';
import { LevelList } from './components/dashboard/LevelList';
import { Sidebar } from './components/dashboard/Sidebar';
import { SyllabusBuilder } from './components/dashboard/SyllabusBuilder';
import { usePersistentState } from './hooks/usePersistentState';
import { useRequireApiKey } from './hooks/useRequireApiKey';
import { CreditsPage } from './pages/CreditsPage';
import { DocsPage } from './pages/DocsPage';
import { LandingPage } from './pages/LandingPage';

// --- Main App Logic ---

type AppPage = 'home' | 'dashboard' | 'docs' | 'credits' | 'auth';

const MainContent = () => {
  const { 
    t, courses, selectedCourse, selectCourse, selectedLevel, selectLevel, 
    selectedUnit, selectUnit, updateCourseUnits, language, userApiKey, 
    showSettings, setShowSettings, session, loadingSession 
  } = useApp();

  const requireApiKey = useRequireApiKey();
  const [currentPage, setCurrentPage] = usePersistentState<AppPage>('app_currentPage', 'home');
  const [syllabusFocus, setSyllabusFocus] = usePersistentState('app_syllabusFocus', '');
  const [customSubject, setCustomSubject] = usePersistentState('app_customSubject', '');
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
    const apiKey = requireApiKey();
    if (!apiKey) {
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
        apiKey,
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

  const handleNavigate = (page: AppPage) => {
    if (page === 'dashboard' && !session) {
      setCurrentPage('auth');
      return;
    }

    setCurrentPage(page);
  };

  const handleSelectLevel = (levelId: string) => {
    const level = selectedCourse?.levels.find((item) => item.id === levelId);
    if (level) {
      selectLevel(level);
    }
  };

  const handleSelectUnit = (unitId: string) => {
    const unit = selectedLevel?.units.find((item) => item.id === unitId);
    if (unit) {
      selectUnit(unit);
    }
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
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSettings={() => setShowSettings(true)}
        session={session}
        t={t}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)] md:h-screen">
        {currentPage === 'home' && <LandingPage onStart={() => session ? setCurrentPage('dashboard') : setCurrentPage('auth')} />}
        {currentPage === 'docs' && <DocsPage />}
        {currentPage === 'credits' && <CreditsPage />}
        {currentPage === 'auth' && <Login />}
        
        {currentPage === 'dashboard' && session && (
          <div className="p-6 md:p-12 max-w-6xl mx-auto">
            {!selectedCourse ? (
              <CourseGrid courses={courses} onSelectCourse={selectCourse} t={t} />
            ) : !selectedLevel ? (
              <LevelList
                language={language}
                onBack={() => selectCourse(null)}
                onSelectLevel={handleSelectLevel}
                selectedCourse={selectedCourse}
                t={t}
              />
            ) : (
              <SyllabusBuilder
                customSubject={customSubject}
                generatingSyllabus={generatingSyllabus}
                language={language}
                onBack={() => selectLevel(null)}
                onCancel={handleCancelSyllabus}
                onCustomSubjectChange={(value) => {
                  setCustomSubject(value);
                  setSubjectError(false);
                }}
                onFocusChange={setSyllabusFocus}
                onGenerate={handleGenerateSyllabus}
                onReset={() => updateCourseUnits(selectedCourse.id, selectedLevel.id, [])}
                onSelectUnit={handleSelectUnit}
                selectedCourse={selectedCourse}
                selectedLevel={selectedLevel}
                subjectError={subjectError}
                syllabusFocus={syllabusFocus}
                t={t}
              />
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
