import { ArrowLeft, Play, SlidersHorizontal } from 'lucide-react';
import { QuestionType, Unit } from '../../types';

interface UnitConfigPanelProps {
  onBack: () => void;
  onStartLesson: () => void;
  quizCount: number;
  selectedTypes: QuestionType[];
  setQuizCount: (count: number) => void;
  toggleType: (type: QuestionType) => void;
  t: (key: string) => string;
  unitFocus: string;
  unit: Unit;
  onUnitFocusChange: (value: string) => void;
}

const QUESTION_TYPES = [
  { id: 'mcq' as const, label: 'MCQ' },
  { id: 'frq' as const, label: 'Open Ended' },
  { id: 'matching' as const, label: 'Matching' }
];

export const UnitConfigPanel = ({
  onBack,
  onStartLesson,
  quizCount,
  selectedTypes,
  setQuizCount,
  toggleType,
  t,
  unitFocus,
  unit,
  onUnitFocusChange,
}: UnitConfigPanelProps) => (
  <div className="max-w-xl mx-auto pt-10 animate-fade-in">
    <button
      onClick={onBack}
      className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
    >
      <ArrowLeft size={16} /> {t('back')}
    </button>

    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
        <SlidersHorizontal size={28} />
      </div>
      <h2 className="text-2xl font-bold dark:text-white mb-2">{t('customize_quiz')}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{unit.title}</p>

      <div className="space-y-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {t('unit_focus_label')}
          </label>
          <input
            type="text"
            value={unitFocus}
            onChange={(event) => onUnitFocusChange(event.target.value)}
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
            onChange={(event) => setQuizCount(parseInt(event.target.value, 10))}
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
            {QUESTION_TYPES.map((type) => (
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
          onClick={onStartLesson}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          {t('start_lesson')}
        </button>
      </div>
    </div>
  </div>
);
