
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#121212] flex flex-col items-center justify-center p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-3xl shadow-2xl p-8 md:p-12 text-center border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center text-white font-bold text-4xl shadow-lg mx-auto mb-8">
          C
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">CodeCanvas AI</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          Master programming with your personal AI tutor. Sign in to sync your progress and secure your keys.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-70"
        >
          {loading ? (
             <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
               <svg className="w-5 h-5" viewBox="0 0 24 24">
                 <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                 <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                 <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                 <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
               </svg>
               <span>Sign in with Google</span>
            </>
          )}
        </button>

        <p className="mt-8 text-xs text-gray-400">
          Secure, encrypted storage for your API keys. <br/> Powered by Supabase.
        </p>
      </div>
    </div>
  );
};
