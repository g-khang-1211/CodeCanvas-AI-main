import { useEffect, useState } from 'react';
import { QuestionType, Unit } from '../types';
import { getStorageJson, setStorageJson } from '../utils/storage';

export type UnitTab = 'learn' | 'quiz' | 'videos';

interface UnitViewState {
  activeTab: UnitTab;
  configMode: boolean;
  matchingAnswers: Record<string, Record<string, string>>;
  quizCount: number;
  quizSubmitted: boolean;
  selectedAnswers: Record<string, number>;
  selectedTypes: QuestionType[];
  showFrqAnswers: Record<string, boolean>;
  unitFocus: string;
}

const buildDefaultState = (selectedUnit: Unit | null): UnitViewState => ({
  activeTab: 'learn',
  configMode: !selectedUnit?.content,
  matchingAnswers: {},
  quizCount: 3,
  quizSubmitted: false,
  selectedAnswers: {},
  selectedTypes: ['mcq'],
  showFrqAnswers: {},
  unitFocus: '',
});

const getUnitStorageKey = (unitId: string) => `unit_state_${unitId}`;

export const useUnitViewState = (selectedUnit: Unit | null) => {
  const getPersistedState = (unit: Unit | null) => {
    if (!unit) return buildDefaultState(null);
    return {
      ...buildDefaultState(unit),
      ...getStorageJson(getUnitStorageKey(unit.id), buildDefaultState(unit)),
      configMode: getStorageJson(getUnitStorageKey(unit.id), buildDefaultState(unit)).configMode ?? !unit.content,
    };
  };

  const [state, setState] = useState<UnitViewState>(() => getPersistedState(selectedUnit));

  useEffect(() => {
    setState(getPersistedState(selectedUnit));
  }, [selectedUnit?.id]);

  useEffect(() => {
    if (!selectedUnit) return;
    setStorageJson(getUnitStorageKey(selectedUnit.id), state);
  }, [selectedUnit?.id, state]);

  return {
    ...state,
    setActiveTab: (activeTab: UnitTab) => setState((current) => ({ ...current, activeTab })),
    setConfigMode: (configMode: boolean) => setState((current) => ({ ...current, configMode })),
    setMatchingAnswers: (updater: (current: Record<string, Record<string, string>>) => Record<string, Record<string, string>>) => (
      setState((current) => ({ ...current, matchingAnswers: updater(current.matchingAnswers) }))
    ),
    setQuizCount: (quizCount: number) => setState((current) => ({ ...current, quizCount })),
    setQuizSubmitted: (quizSubmitted: boolean) => setState((current) => ({ ...current, quizSubmitted })),
    setSelectedAnswers: (updater: (current: Record<string, number>) => Record<string, number>) => (
      setState((current) => ({ ...current, selectedAnswers: updater(current.selectedAnswers) }))
    ),
    setSelectedTypes: (updater: (current: QuestionType[]) => QuestionType[]) => (
      setState((current) => ({ ...current, selectedTypes: updater(current.selectedTypes) }))
    ),
    setShowFrqAnswers: (updater: (current: Record<string, boolean>) => Record<string, boolean>) => (
      setState((current) => ({ ...current, showFrqAnswers: updater(current.showFrqAnswers) }))
    ),
    setUnitFocus: (unitFocus: string) => setState((current) => ({ ...current, unitFocus })),
  };
};
