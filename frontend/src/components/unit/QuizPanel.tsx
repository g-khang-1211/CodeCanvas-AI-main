import { AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { Question } from '../../types';

interface QuizPanelProps {
  handleMatchingAnswer: (qId: string, term: string, definition: string) => void;
  handleMcqAnswer: (qId: string, index: number) => void;
  matchingAnswers: Record<string, Record<string, string>>;
  questions: Question[];
  quizSubmitted: boolean;
  selectedAnswers: Record<string, number>;
  setShowFrqAnswers: (updater: (current: Record<string, boolean>) => Record<string, boolean>) => void;
  showFrqAnswers: Record<string, boolean>;
  submitQuiz: () => void;
  t: (key: string) => string;
}

export const QuizPanel = ({
  handleMatchingAnswer,
  handleMcqAnswer,
  matchingAnswers,
  questions,
  quizSubmitted,
  selectedAnswers,
  setShowFrqAnswers,
  showFrqAnswers,
  submitQuiz,
  t,
}: QuizPanelProps) => (
  <div className="max-w-2xl mx-auto space-y-8">
    {questions.length === 0 ? (
      <div className="text-center text-gray-500">No questions generated.</div>
    ) : (
      questions.map((question, index) => {
        if (question.type === 'mcq' && question.options) {
          return (
            <div key={question.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {question.text}
              </h4>
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  let buttonClassName = 'w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ';

                  if (quizSubmitted) {
                    if (optionIndex === question.correctIndex) buttonClassName += 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300 ';
                    else if (selectedAnswers[question.id] === optionIndex) buttonClassName += 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:text-red-300 ';
                    else buttonClassName += 'border-transparent bg-gray-50 dark:bg-gray-700/50 opacity-50 dark:text-gray-400 ';
                  } else if (selectedAnswers[question.id] === optionIndex) {
                    buttonClassName += 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 ';
                  } else {
                    buttonClassName += 'border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 dark:text-gray-300 ';
                  }

                  return (
                    <button key={optionIndex} onClick={() => handleMcqAnswer(question.id, optionIndex)} className={buttonClassName}>
                      <div className="flex items-center justify-between">
                        {option}
                        {quizSubmitted && optionIndex === question.correctIndex && <CheckCircle size={16} className="text-green-600" />}
                        {quizSubmitted && selectedAnswers[question.id] === optionIndex && optionIndex !== question.correctIndex && <AlertCircle size={16} className="text-red-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        if (question.type === 'frq') {
          return (
            <div key={question.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {question.text}
              </h4>
              <textarea
                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white h-32 mb-4"
                placeholder={t('type_message')}
              />
              <button
                onClick={() => setShowFrqAnswers((current) => ({ ...current, [question.id]: !current[question.id] }))}
                className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-2 hover:underline"
              >
                <Eye size={16} /> {t('reveal_answer')}
              </button>
              {showFrqAnswers[question.id] && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300 text-sm">
                  <strong>{t('model_answer')}:</strong> {question.answer}
                </div>
              )}
            </div>
          );
        }

        if (question.type === 'matching' && question.pairs) {
          return (
            <div key={question.id} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                <span className="text-gray-400 mr-2">{index + 1}.</span>
                {question.text || t('match_pairs')}
              </h4>
              <div className="space-y-4">
                {question.pairs.map((pair, pairIndex) => {
                  const currentAnswer = matchingAnswers[question.id]?.[pair.term];
                  const isCorrect = quizSubmitted && currentAnswer === pair.definition;

                  return (
                    <div key={pairIndex} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                      <div className="flex-1 font-semibold text-gray-800 dark:text-gray-200">{pair.term}</div>
                      <div className="hidden sm:block text-gray-400">→</div>
                      <select
                        value={currentAnswer || ''}
                        onChange={(event) => handleMatchingAnswer(question.id, pair.term, event.target.value)}
                        disabled={quizSubmitted}
                        className={`flex-1 p-2.5 rounded-lg border text-sm outline-none transition-colors ${
                          quizSubmitted
                            ? (isCorrect
                              ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                              : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-200')
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white focus:border-blue-500'
                        }`}
                      >
                        <option value="">{t('select_match')}</option>
                        {question.pairs?.map((answerPair) => (
                          <option key={answerPair.definition} value={answerPair.definition}>{answerPair.definition}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return null;
      })
    )}

    <div className="sticky bottom-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {t('submit')}
      </div>
      <button
        onClick={submitQuiz}
        disabled={quizSubmitted || questions.length === 0}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-blue-500/30"
      >
        {t('submit')}
      </button>
    </div>
  </div>
);
