
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, X, Globe, Key, Eye, EyeOff, LogOut, Check, UploadCloud, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { 
    theme, toggleTheme, language, setLanguage, t, 
    userApiKey, setUserApiKey, signOut, session, hasApiKey
  } = useApp();

  const [inputKey, setInputKey] = useState(userApiKey);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setInputKey(userApiKey);
  }, [userApiKey]);

  const handleSaveKey = async () => {
    if (!inputKey.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await setUserApiKey(inputKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      // If saving fails (e.g., DB permissions), we show an error but the key is still applied locally for this session
      setSaveError("Cloud save failed. Key is active for this session only.");
    } finally {
      setIsSaving(false);
    }
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'zh', label: '中文 (Chinese)' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'ko', label: '한국어 (Korean)' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский (Russian)' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'it', label: 'Italiano' },
    { code: 'vi', label: 'Tiếng Việt' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-gray-100 dark:border-slate-800 transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white">{t('settings')}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 dark:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Account Section */}
          {session && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div>
                   <h3 className="font-bold text-gray-900 dark:text-white text-sm">Account</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                </div>
                <button 
                  onClick={signOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* API Key Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
               <Key size={18} className="text-blue-500" />
               <h3 className="font-bold text-gray-900 dark:text-white text-sm">Google Gemini API Key</h3>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Your API Key is encrypted and stored securely in the cloud via Supabase.
            </p>

            <div className="relative mb-3">
              <input 
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter your API Key..."
                className="w-full pl-3 pr-10 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {saveError && (
              <div className="flex items-center gap-2 mb-3 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                <AlertTriangle size={14} />
                {saveError}
              </div>
            )}

            <button 
              onClick={handleSaveKey}
              disabled={isSaving || !inputKey}
              className={`w-full py-2.5 rounded-lg text-xs font-bold mb-3 flex items-center justify-center gap-2 transition-all ${
                isSaved 
                  ? "bg-green-500 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Encrypting...
                </>
              ) : isSaved ? (
                <>
                  <Check size={14} />
                  Saved
                </>
              ) : (
                <>
                  <UploadCloud size={14} />
                  Save Securely
                </>
              )}
            </button>

            {hasApiKey && !isSaved && !isSaving && !saveError && (
              <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Key active & synced
              </div>
            )}
            
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="block mt-3 text-xs text-center text-blue-500 hover:underline">
              Get a Gemini API Key
            </a>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Sun className="text-orange-500" /> : <Moon className="text-blue-400" />}
              <span className="font-medium dark:text-white">{theme === 'light' ? t('light_mode') : t('dark_mode')}</span>
            </div>
            <button 
              onClick={toggleTheme}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`bg-white w-6 h-6 rounded-full shadow-md transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              <Globe size={16} /> {t('language_label')}
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    language === lang.code 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
