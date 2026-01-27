
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { encryptKey, decryptKey } from '../lib/crypto';
import { AppTheme, LanguageCode, Course, Level, Unit } from '../types';
import { UI_TEXT, COURSES as DEFAULT_COURSES } from '../constants';

interface AppContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  courses: Course[];
  updateCourseUnits: (courseId: string, levelId: string, units: Unit[]) => void;
  updateUnitContent: (courseId: string, levelId: string, unitId: string, content: string, questions: any[]) => void;
  selectedCourse: Course | null;
  selectCourse: (course: Course | null) => void;
  selectedLevel: Level | null;
  selectLevel: (level: Level | null) => void;
  selectedUnit: Unit | null;
  selectUnit: (unit: Unit | null) => void;
  
  // Auth & API Key
  userApiKey: string;
  hasApiKey: boolean; // Source of truth from DB
  setUserApiKey: (key: string) => Promise<void>;
  session: any;
  loadingSession: boolean;
  signOut: () => Promise<void>;
  
  // UI State
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // STRICT REQUIREMENT: Dark mode must be default.
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [showSettings, setShowSettings] = useState(false);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  // API Key State
  const [userApiKey, setUserApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false); // Default to false until proven otherwise

  // Local state copy of courses
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // Force Dark Mode on Mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
    setTheme('dark');
  }, []);

  // Theme Toggle
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Auth & Profile Sync
  useEffect(() => {
    let mounted = true;

    // 1. SAFETY TIMEOUT:
    // If Supabase authentication hangs (common with stale local storage or network hiccups),
    // force loading to complete after 2 seconds so the user isn't stuck.
    const safetyTimeout = setTimeout(() => {
      if (mounted && loadingSession) {
        console.warn("Session loading timed out. Forcing app render.");
        setLoadingSession(false);
      }
    }, 2000);

    const initAuth = async () => {
      try {
        // 2. Check Session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          if (currentSession) {
            setSession(currentSession);
            // 3. Fetch Profile (Non-blocking for critical UI)
            try {
               await fetchProfile(currentSession.user.id);
            } catch (err) {
               console.error("Profile load failed, but continuing:", err);
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        // 4. Always turn off loading, no matter what
        if (mounted) setLoadingSession(false);
      }
    };

    initAuth();

    // 5. Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession) {
        // Fetch profile to get the key if it exists
        fetchProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Clear state
        setUserApiKeyState('');
        setHasApiKey(false);
        setSession(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Profile (Boolean check + Encrypted Key if exists)
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('api_key_encrypted, has_api_key')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.warn('Profile fetch warning:', error.message);
        return;
      }

      if (data) {
        setHasApiKey(data.has_api_key);
        if (data.api_key_encrypted) {
          const decrypted = decryptKey(data.api_key_encrypted);
          if (decrypted) setUserApiKeyState(decrypted);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    }
  };

  // Secure Save Logic with Optimistic Update
  const saveUserKey = async (key: string) => {
    // 1. Optimistic Update: Set state immediately so user can use the app NOW.
    // This fixes "key not working for content generation" issue.
    setUserApiKeyState(key);
    
    if (!session) return;
    
    try {
      const encrypted = encryptKey(key);
      const userId = session.user.id;

      // 2. Attempt Cloud Save (UPSERT)
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId, 
          email: session.user.email,
          api_key_encrypted: encrypted,
          has_api_key: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('Supabase upsert error:', error);
        throw error;
      }

      // 3. Confirm Success
      setHasApiKey(true);

    } catch (error: any) {
      console.error('Save error details:', error);
      // We throw so the UI knows it failed, but we leave `userApiKey` set locally
      // so the user isn't blocked for this session.
      throw new Error(error.message || 'Database save failed');
    }
  };
  
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error", e);
    }
    setUserApiKeyState('');
    setHasApiKey(false);
    setSession(null);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const t = (key: string): string => {
    const entry = UI_TEXT[key];
    if (!entry) return key;
    return entry[language] || entry['en'];
  };

  // Helper getters
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || null;
  const selectedLevel = selectedCourse?.levels.find(l => l.id === selectedLevelId) || null;
  const selectedUnit = selectedLevel?.units.find(u => u.id === selectedUnitId) || null;

  const updateCourseUnits = (courseId: string, levelId: string, units: Unit[]) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        levels: c.levels.map(l => {
          if (l.id !== levelId) return l;
          return { ...l, units };
        })
      };
    }));
  };

  const updateUnitContent = (courseId: string, levelId: string, unitId: string, content: string, questions: any[]) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        levels: c.levels.map(l => {
          if (l.id !== levelId) return l;
          return {
            ...l,
            units: l.units.map(u => {
              if (u.id !== unitId) return u;
              return { ...u, content, questions };
            })
          };
        })
      };
    }));
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
      setUserApiKey: saveUserKey,
      session,
      loadingSession,
      signOut,
      
      showSettings,
      setShowSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
