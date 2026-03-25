import { BookOpen, ChevronRight, Sparkles, Wand2, X } from 'lucide-react';
import { Course, Level } from '../../types';

interface SyllabusBuilderProps {
  customSubject: string;
  generatingSyllabus: boolean;
  language: string;
  onBack: () => void;
  onCancel: () => void;
  onCustomSubjectChange: (value: string) => void;
  onFocusChange: (value: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onSelectUnit: (unitId: string) => void;
  selectedCourse: Course;
  selectedLevel: Level;
  subjectError: boolean;
  syllabusFocus: string;
  t: (key: string) => string;
}

export const SyllabusBuilder = ({
  customSubject,
  generatingSyllabus,
  language,
  onBack,
  onCancel,
  onCustomSubjectChange,
  onFocusChange,
  onGenerate,
  onReset,
  onSelectUnit,
  selectedCourse,
  selectedLevel,
  subjectError,
  syllabusFocus,
  t,
}: SyllabusBuilderProps) => (
  <div className="animate-fade-in">
    <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
      <ChevronRight size={16} className={`rotate-180 ${language === 'ar' ? 'rotate-0' : ''}`} /> {t('back')}
    </button>
    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{t(`level_${selectedLevel.id.substring(0, 3)}`)}</h2>
    <p className="text-slate-500 mb-8">{t('select_unit_prompt')}</p>

    <div className="grid gap-4">
      {selectedLevel.units.length > 0 ? (
        <>
          {selectedLevel.units.map((unit, idx) => (
            <button
              key={unit.id}
              onClick={() => onSelectUnit(unit.id)}
              className="bg-white dark:bg-[#151518] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white flex-1">{unit.title}</span>
              <BookOpen size={18} className="text-slate-400" />
            </button>
          ))}
          <button onClick={onReset} className="mt-6 text-sm text-red-500 hover:underline">
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
                    onChange={(event) => onCustomSubjectChange(event.target.value)}
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
                    onChange={(event) => onFocusChange(event.target.value)}
                    placeholder={t('focus_placeholder')}
                    className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <input
                type="text"
                value={syllabusFocus}
                onChange={(event) => onFocusChange(event.target.value)}
                placeholder="E.g. Web scraping, APIs..."
                className="w-full px-5 py-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              />
            )}

            {generatingSyllabus ? (
              <button
                onClick={onCancel}
                className="w-full py-4 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <X size={20} />
                {t('cancel')}
              </button>
            ) : (
              <button
                onClick={onGenerate}
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
);
