import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { GRADING_MODES } from "../components/games/sight-reading-game/constants/gradingModes";

const TOTAL_EXERCISES_PER_SESSION = 10;
const DEFAULT_MAX_SCORE_PER_EXERCISE = 100;
const ON_FIRE_THRESHOLD = 5; // reuse NotesRecognitionGame's constant (D-06)

const createInitialState = () => ({
  totalExercises: TOTAL_EXERCISES_PER_SESSION,
  currentExerciseIndex: 0,
  exerciseResults: Array(TOTAL_EXERCISES_PER_SESSION).fill(null),
  status: "idle", // idle | in-progress | complete
  sessionId: Date.now(),
});

const SightReadingSessionContext = createContext(null);

export function SightReadingSessionProvider({ children }) {
  const [state, setState] = useState(() => createInitialState());

  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [isOnFire, setIsOnFire] = useState(false);
  const isOnFireRef = useRef(false);

  // Session-scoped grading mode (D-05): Practice vs Test, with a lock to prevent switching
  // mid-exercise. gradingModeRef mirrors gradingMode so synchronous detection callbacks (e.g.
  // pitch-detection handlers) can read the current mode without a stale closure (Pattern 1).
  const [gradingMode, setGradingModeState] = useState(GRADING_MODES.TEST);
  const gradingModeRef = useRef(GRADING_MODES.TEST);
  const [isModeLocked, setIsModeLocked] = useState(false);
  const isModeLockedRef = useRef(false);

  // Phase 03 (ADAPT-01/02, D-01): adaptive-difficulty streak + current tier, SEPARATE from the HUD
  // combo. Ref mirrors let handleNextExercise / mic callbacks read current values without a stale
  // closure (same rationale as comboRef/gradingModeRef).
  const [successStreak, setSuccessStreakState] = useState(0);
  const successStreakRef = useRef(0);
  const [adaptiveTierIndex, setAdaptiveTierIndexState] = useState(0); // 0 == baseline (adaptiveTiers.BASELINE_TIER_INDEX)
  const adaptiveTierIndexRef = useRef(0);

  const setSuccessStreak = useCallback((n) => {
    successStreakRef.current = n;
    setSuccessStreakState(n);
  }, []);
  const setAdaptiveTierIndex = useCallback((n) => {
    adaptiveTierIndexRef.current = n;
    setAdaptiveTierIndexState(n);
  }, []);

  const setGradingMode = useCallback((mode) => {
    if (isModeLockedRef.current) {
      return;
    }
    if (mode !== GRADING_MODES.PRACTICE && mode !== GRADING_MODES.TEST) {
      return;
    }
    gradingModeRef.current = mode;
    setGradingModeState(mode);
  }, []);

  const lockMode = useCallback(() => {
    isModeLockedRef.current = true;
    setIsModeLocked(true);
  }, []);

  const unlockMode = useCallback(() => {
    isModeLockedRef.current = false;
    setIsModeLocked(false);
  }, []);

  const incrementCombo = useCallback(() => {
    comboRef.current += 1;
    setCombo(comboRef.current);
    if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
      isOnFireRef.current = true;
      setIsOnFire(true);
    }
  }, []);

  const resetCombo = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
    if (isOnFireRef.current) {
      isOnFireRef.current = false;
      setIsOnFire(false);
    }
  }, []);

  const startSession = useCallback(() => {
    setState(() => ({
      ...createInitialState(),
      status: "in-progress",
      sessionId: Date.now(),
    }));
    comboRef.current = 0;
    setCombo(0);
    isOnFireRef.current = false;
    setIsOnFire(false);
    successStreakRef.current = 0;
    setSuccessStreakState(0);
    adaptiveTierIndexRef.current = 0;
    setAdaptiveTierIndexState(0);
  }, []);

  const resetSession = useCallback(() => {
    setState(() => createInitialState());
    comboRef.current = 0;
    setCombo(0);
    isOnFireRef.current = false;
    setIsOnFire(false);
    successStreakRef.current = 0;
    setSuccessStreakState(0);
    adaptiveTierIndexRef.current = 0;
    setAdaptiveTierIndexState(0);
  }, []);

  const recordExerciseResult = useCallback(
    (score = 0, maxScore = DEFAULT_MAX_SCORE_PER_EXERCISE) => {
      setState((prev) => {
        const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
        const safeMaxScore =
          Number.isFinite(maxScore) && maxScore > 0
            ? maxScore
            : DEFAULT_MAX_SCORE_PER_EXERCISE;

        const exerciseResults = [...prev.exerciseResults];
        exerciseResults[prev.currentExerciseIndex] = {
          score: safeScore,
          maxScore: safeMaxScore,
          completedAt: Date.now(),
        };

        const completedExercises = exerciseResults.filter(Boolean).length;
        const isSessionComplete = completedExercises === prev.totalExercises;

        return {
          ...prev,
          exerciseResults,
          status: isSessionComplete ? "complete" : prev.status || "in-progress",
        };
      });
    },
    []
  );

  const goToNextExercise = useCallback(() => {
    setState((prev) => {
      if (prev.status === "complete") {
        return prev;
      }
      if (prev.currentExerciseIndex >= prev.totalExercises - 1) {
        return {
          ...prev,
          status: "complete",
        };
      }
      return {
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        status: "in-progress",
      };
    });
  }, []);

  const value = useMemo(() => {
    const completedExercises = state.exerciseResults.filter(Boolean).length;
    const totalScore = state.exerciseResults.reduce(
      (sum, entry) => sum + (entry?.score ?? 0),
      0
    );
    const maxPossibleScore = state.exerciseResults.reduce(
      (sum, entry) => sum + (entry?.maxScore ?? 0),
      0
    );

    const percentage = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    const isSessionComplete = completedExercises === state.totalExercises;
    const isVictory = isSessionComplete && percentage >= 0.7;
    const progressFraction = completedExercises / state.totalExercises;

    const currentExerciseNumber = isSessionComplete
      ? state.totalExercises
      : Math.min(completedExercises + 1, state.totalExercises);

    return {
      totalExercises: state.totalExercises,
      currentExerciseIndex: state.currentExerciseIndex,
      currentExerciseNumber,
      completedExercises,
      exerciseResults: state.exerciseResults,
      totalScore,
      maxPossibleScore,
      percentage,
      progressFraction,
      isSessionComplete,
      isVictory,
      status: state.status,
      sessionId: state.sessionId,
      startSession,
      resetSession,
      recordExerciseResult,
      goToNextExercise,
      combo,
      isOnFire,
      incrementCombo,
      resetCombo,
      gradingMode,
      isModeLocked,
      gradingModeRef,
      setGradingMode,
      lockMode,
      unlockMode,
      successStreak,
      successStreakRef,
      setSuccessStreak,
      adaptiveTierIndex,
      adaptiveTierIndexRef,
      setAdaptiveTierIndex,
    };
  }, [
    state,
    startSession,
    resetSession,
    recordExerciseResult,
    goToNextExercise,
    combo,
    isOnFire,
    incrementCombo,
    resetCombo,
    gradingMode,
    isModeLocked,
    setGradingMode,
    lockMode,
    unlockMode,
    successStreak,
    setSuccessStreak,
    adaptiveTierIndex,
    setAdaptiveTierIndex,
  ]);

  return (
    <SightReadingSessionContext.Provider value={value}>
      {children}
    </SightReadingSessionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export function useSightReadingSession() {
  const context = useContext(SightReadingSessionContext);
  if (!context) {
    throw new Error(
      "useSightReadingSession must be used within a SightReadingSessionProvider"
    );
  }
  return context;
}

// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export const SIGHT_READING_SESSION_CONSTANTS = {
  TOTAL_EXERCISES_PER_SESSION,
  DEFAULT_MAX_SCORE_PER_EXERCISE,
};

export default SightReadingSessionContext;
