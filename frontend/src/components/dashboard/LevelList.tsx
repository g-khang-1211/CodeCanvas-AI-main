import { ChevronRight } from 'lucide-react';
import { Course } from '../../types';

interface LevelListProps {
  language: string;
  onBack: () => void;
  onSelectLevel: (levelId: string) => void;
  selectedCourse: Course;
  t: (key: string) => string;
}

export const LevelList = ({ language, onBack, onSelectLevel, selectedCourse, t }: LevelListProps) => (
  <div className="animate-fade-in">
    <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
      <ChevronRight size={16} className={`rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} /> {t('back')}
    </button>
    <div className="flex items-center gap-4 mb-8">
      <span className="text-4xl">{selectedCourse.icon}</span>
      <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t(`course_${selectedCourse.id}`) || selectedCourse.name}</h2>
    </div>

    <div className="space-y-4">
      {selectedCourse.levels.map((level) => (
        <button
          key={level.id}
          onClick={() => onSelectLevel(level.id)}
          className="w-full bg-white dark:bg-[#151518] p-6 rounded-3xl shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-800 flex items-center justify-between group"
        >
          <div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{t(`level_${level.id.substring(0, 3)}`) || level.title}</h4>
            <p className="text-sm text-slate-500">{level.units.length > 0 ? `${level.units.length} ${t('units_created')}` : t('create_custom_syllabus')}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <ChevronRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
          </div>
        </button>
      ))}
    </div>
  </div>
);
