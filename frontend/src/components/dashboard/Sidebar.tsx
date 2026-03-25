import { FileText, Github, Heart, Home, LayoutGrid, LogIn, Settings as SettingsIcon } from 'lucide-react';

type AppPage = 'home' | 'dashboard' | 'docs' | 'credits' | 'auth';

interface SidebarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenSettings: () => void;
  session: unknown;
  t: (key: string) => string;
}

const NAV_ITEMS = [
  { id: 'home' as const, icon: Home, label: 'Home' },
  { id: 'dashboard' as const, icon: LayoutGrid, label: 'Dashboard' },
  { id: 'docs' as const, icon: FileText, label: 'Documentation' },
  { id: 'credits' as const, icon: Heart, label: 'Credits' },
];

export const Sidebar = ({ currentPage, onNavigate, onOpenSettings, session, t }: SidebarProps) => (
  <div className="w-full md:w-72 bg-white dark:bg-[#121214] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col sticky top-0 md:h-screen z-20">
    <div className="flex items-center gap-3 mb-8 md:mb-10">
      <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">C</div>
      <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">CodeCanvas</h1>
    </div>

    <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
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
    <a
      href="https://github.com/g-khang-1211/CodeCanvas-AI-main"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl font-medium whitespace-nowrap text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="View source code on GitHub"
    >
      <Github size={18} />
      GitHub
    </a>

    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 hidden md:block space-y-3">
      {session ? (
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
        >
          <SettingsIcon size={18} />
          {t('settings')}
        </button>
      ) : (
        <button
          onClick={() => onNavigate('auth')}
          className="w-full flex items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold justify-center hover:opacity-90 transition-opacity"
        >
          <LogIn size={16} /> Sign In
        </button>
      )}

      <a
        href="http://buymeacoffee.com/kelvinomg1l"
        target="_blank"
        rel="noreferrer"
        className="hidden"
      >
        ☕ Donate
      </a>
    </div>
  </div>
);
