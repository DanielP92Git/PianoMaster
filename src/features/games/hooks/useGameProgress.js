import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useScores } from "../../../features/userData/useScores";
import { createPracticeSession } from "../../../services/apiDatabase";
import { useUser } from "../../authentication/useUser";
import { showPointsGain } from "../../../components/ui/Toast";

export function useGameProgress() {
  const [progress, setProgress] = useState({
    score: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    currentNote: null,
    isStarted: false,
    isFinished: false,
    isLost: false,
    timeRanOut: false,
    feedbackMessage: null,
  });

  // Use ref to always have access to latest progress without causing callback recreation
  const progressRef = useRef(progress);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const queryClient = useQueryClient();
  const { updateScoreAsync: updateUserScoreAsync } = useScores();
  const { user } = useUser();

  const updateProgress = useCallback((updates) => {
    setProgress((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleAnswer = useCallback((selectedAnswer, correctAnswer) => {
    const isCorrect = selectedAnswer === correctAnswer;

    setProgress((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + 10 : prev.score,
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      feedbackMessage: {
        text: isCorrect ? "נכון!" : "לא נכון...",
        type: isCorrect ? "correct" : "wrong",
      },
    }));

    // Clear feedback message after 1.5 seconds
    setTimeout(() => {
      setProgress((prev) => ({
        ...prev,
        feedbackMessage: null,
      }));
    }, 1500);

    return isCorrect;
  }, []);

  const finishGame = useCallback(
    async (isLost = false, timeRanOut = false) => {
      // Use ref to get current state values to avoid closure/stale state issues
      const currentScore = progressRef.current.score;
      const currentCorrectAnswers = progressRef.current.correctAnswers;
      const currentTotalQuestions = progressRef.current.totalQuestions;

      // Calculate final score and session data from captured values
      const finalScore = currentScore;
      const totalQuestions = currentTotalQuestions;
      const accuracy =
        currentTotalQuestions > 0
          ? (currentCorrectAnswers / currentTotalQuestions) * 100
          : 0;

      // Capture pre-game total points from React Query cache
      let preGameTotal = null;
      if (user?.id) {
        const cachedTotal = queryClient.getQueryData(["total-points", user.id]);
        if (cachedTotal?.totalPoints !== undefined) {
          preGameTotal = cachedTotal.totalPoints;
          queryClient.setQueryData(["pre-total-points", user.id], preGameTotal);
        }
      }

      // Only award points for successful runs (no loss, no timeout)
      const shouldAwardScore = !isLost && !timeRanOut && finalScore > 0;

      if (shouldAwardScore) {
        // Update user's score in the database and wait for cache invalidation
        await updateUserScoreAsync({
          score: finalScore,
          gameType: "note-recognition",
        });

        // Show points gain notification
        showPointsGain(finalScore, "note-recognition");
      }

      // Update state to mark game as finished AFTER score is saved
      setProgress((prev) => ({
        ...prev,
        isFinished: true,
        isLost,
        timeRanOut,
      }));

      // Create practice session record after state update
      if (user?.id) {
        // Determine status based on performance
        const status =
          accuracy >= 80
            ? "excellent"
            : accuracy >= 60
              ? "reviewed"
              : "needs_work";

        const sessionData = {
          student_id: user.id,
          recording_url: "", // No audio recording for note recognition game
          recording_description: `Note Recognition Game - Score: ${finalScore}, Accuracy: ${accuracy.toFixed(1)}%, Questions: ${totalQuestions}/${totalQuestions}`,
          has_recording: false,
          duration: 0, // Game duration would need to be tracked separately
          analysis_score: accuracy,
          notes_played: totalQuestions,
          unique_notes: totalQuestions, // Each question is a unique note
          status: status,
          submitted_at: new Date().toISOString(),
        };

        // Create the practice session
        createPracticeSession(sessionData).catch((error) => {
          console.error("Failed to create practice session:", error);
        });
      }
    },
    [queryClient, updateUserScoreAsync, user]
  );

  const resetProgress = useCallback(() => {
    setProgress({
      score: 0,
      totalQuestions: 0,
      correctAnswers: 0,
      currentNote: null,
      isStarted: false,
      isFinished: false,
      isLost: false,
      timeRanOut: false,
      feedbackMessage: null,
    });
  }, []);

  return {
    progress,
    updateProgress,
    handleAnswer,
    finishGame,
    resetProgress,
  };
}
