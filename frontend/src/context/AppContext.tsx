import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { getAccessTokenForRequest, supabase } from '../services/supabase';
import { AppTheme, LanguageCode, Course, Level, Question, Unit } from '../types';
import { UI_TEXT, COURSES as DEFAULT_COURSES } from '../constants';
import { getStorageItem, getStorageJson, removeStorageItem, setStorageItem, setStorageJson } from '../utils/storage';
import { replaceCourseUnits, replaceUnitContent } from '../utils/courseState';

interface AppContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  courses: Course[];
  updateCourseUnits: (courseId: string, levelId: string, units: Unit[]) => void;
  updateUnitContent: (courseId: string, levelId: string, unitId: string, content: string, questions: Question[]) => void;
  selectedCourse: Course | null;
  selectCourse: (course: Course | null) => void;
  selectedLevel: Level | null;
  selectLevel: (level: Level | null) => void;
  selectedUnit: Unit | null;
  selectUnit: (unit: Unit | null) => void;

  // Auth & API Key
  userApiKey: string;
  hasApiKey: boolean;
  hasLoadedKeyStatus: boolean;
  setUserApiKey: (key: string) => Promise<void>;
  session: Session | null;
  loadingSession: boolean;
  loadingKeyStatus: boolean;
  signOut: () => Promise<void>;

  // UI State
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = getStorageItem('app_theme');
    return (saved as AppTheme) || 'dark';
  });
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = getStorageItem('app_language');
    return (saved as LanguageCode) || 'en';
  });
  const [showSettings, setShowSettings] = useState(false);

  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingKeyStatus, setLoadingKeyStatus] = useState(false);
  const activeUserIdRef = useRef<string | null>(null);

  const [userApiKey, setUserApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasLoadedKeyStatus, setHasLoadedKeyStatus] = useState(false);

  const [courses, setCourses] = useState<Course[]>(() => {
    return getStorageJson('app_courses', DEFAULT_COURSES);
  });
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    return getStorageItem('app_selectedCourseId') || null;
  });
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(() => {
    return getStorageItem('app_selectedLevelId') || null;
  });
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(() => {
    return getStorageItem('app_selectedUnitId') || null;
  });

  useEffect(() => {
    setStorageItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    setStorageItem('app_language', language);
  }, [language]);

  useEffect(() => {
    setStorageJson('app_courses', courses);
  }, [courses]);

  useEffect(() => {
    if (selectedCourseId) setStorageItem('app_selectedCourseId', selectedCourseId);
    else removeStorageItem('app_selectedCourseId');
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedLevelId) setStorageItem('app_selectedLevelId', selectedLevelId);
    else removeStorageItem('app_selectedLevelId');
  }, [selectedLevelId]);

  useEffect(() => {
    if (selectedUnitId) setStorageItem('app_selectedUnitId', selectedUnitId);
    else removeStorageItem('app_selectedUnitId');
  }, [selectedUnitId]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingSession) {
        console.warn('Session loading timed out. Forcing app render.');
        setLoadingSession(false);
      }
    }, 2000);

    const initAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            activeUserIdRef.current = currentSession.user.id;
            setHasLoadedKeyStatus(false);
            try {
              await fetchKeyStatus(currentSession);
            } catch (err) {
              console.error('Key status load failed, but continuing:', err);
            }
          } else {
            setHasApiKey(false);
            setHasLoadedKeyStatus(false);
            setUserApiKeyState('');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) setLoadingSession(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        activeUserIdRef.current = newSession.user.id;
        setHasLoadedKeyStatus(false);
        fetchKeyStatus(newSession);
      } else if (event === 'SIGNED_OUT') {
        activeUserIdRef.current = null;
        setUserApiKeyState('');
        setHasApiKey(false);
        setHasLoadedKeyStatus(false);
        setLoadingKeyStatus(false);
        setSession(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchKeyStatus = async (currentSession: Session) => {
    const requestUserId = currentSession.user.id;
    setLoadingKeyStatus(true);
    try {
      const accessToken = await getAccessTokenForRequest(currentSession, requestUserId);
      if (!accessToken) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/profile/key-status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load key status');
      }

      if (activeUserIdRef.current !== requestUserId) {
        return;
      }

      setHasApiKey(Boolean(payload.hasApiKey));
      setHasLoadedKeyStatus(true);
      setUserApiKeyState('');
    } catch (error) {
      console.error('Error loading key status:', error);
      if (activeUserIdRef.current === requestUserId) {
        setHasLoadedKeyStatus(false);
      }
    } finally {
      if (activeUserIdRef.current === requestUserId) {
        setLoadingKeyStatus(false);
      }
    }
  };

  const saveUserKey = async (key: string) => {
    if (!session) {
      throw new Error('Please sign in to save your API key.');
    }

    const requestUserId = session.user.id;

    try {
      const accessToken = await getAccessTokenForRequest(session, requestUserId);
      if (!accessToken) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/profile/key', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: key }),
      });

      const payload = await response.json().catch(() => ({ success: false }));
      if (!response.ok) {
        throw new Error(payload.error || 'Database save failed');
      }

      if (activeUserIdRef.current === requestUserId) {
        setUserApiKeyState(key);
        setHasApiKey(true);
        setHasLoadedKeyStatus(true);
      }
    } catch (error) {
      console.error('Save error details:', error);
      throw new Error(error instanceof Error ? error.message : 'Database save failed');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Sign out error', e);
    }
    activeUserIdRef.current = null;
    setUserApiKeyState('');
    setHasApiKey(false);
    setHasLoadedKeyStatus(false);
    setLoadingKeyStatus(false);
    setSession(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    const entry = UI_TEXT[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;
  const selectedLevel = selectedCourse?.levels.find((l) => l.id === selectedLevelId) || null;
  const selectedUnit = selectedLevel?.units.find((u) => u.id === selectedUnitId) || null;

  const updateCourseUnits = (courseId: string, levelId: string, units: Unit[]) => {
    setCourses((prev) => replaceCourseUnits(prev, courseId, levelId, units));
  };

  const updateUnitContent = (courseId: string, levelId: string, unitId: string, content: string, questions: Question[]) => {
    setCourses((prev) => replaceUnitContent(prev, courseId, levelId, unitId, content, questions));
  };

  return (
    <AppContext.Provider value={{
      theme,
      toggleTheme,
      language,
      setLanguage,
      t,
      courses,
      updateCourseUnits,
      updateUnitContent,
      selectedCourse,
      selectCourse: (c) => {
        setSelectedCourseId(c ? c.id : null);
        setSelectedLevelId(null);
        setSelectedUnitId(null);
      },
      selectedLevel,
      selectLevel: (l) => {
        setSelectedLevelId(l ? l.id : null);
        setSelectedUnitId(null);
      },
      selectedUnit,
      selectUnit: (u) => setSelectedUnitId(u ? u.id : null),
      userApiKey,
      hasApiKey,
      hasLoadedKeyStatus,
      setUserApiKey: saveUserKey,
      session,
      loadingSession,
      loadingKeyStatus,
      signOut,
      showSettings,
      setShowSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
