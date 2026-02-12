import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const TOTAL_EXERCISES_PER_SESSION = 10;
const DEFAULT_MAX_SCORE_PER_EXERCISE = 100;

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

  const startSession = useCallback(() => {
    setState(() => ({
      ...createInitialState(),
      status: "in-progress",
      sessionId: Date.now(),
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState(() => createInitialState());
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
    };
  }, [
    state,
    startSession,
    resetSession,
    recordExerciseResult,
    goToNextExercise,
  ]);

  return (
    <SightReadingSessionContext.Provider value={value}>
      {children}
    </SightReadingSessionContext.Provider>
  );
}

export function useSightReadingSession() {
  const context = useContext(SightReadingSessionContext);
  if (!context) {
    throw new Error(
      "useSightReadingSession must be used within a SightReadingSessionProvider"
    );
  }
  return context;
}

export const SIGHT_READING_SESSION_CONSTANTS = {
  TOTAL_EXERCISES_PER_SESSION,
  DEFAULT_MAX_SCORE_PER_EXERCISE,
};

export default SightReadingSessionContext;
