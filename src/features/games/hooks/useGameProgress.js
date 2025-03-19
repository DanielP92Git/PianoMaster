import { useState, useCallback } from "react";
import { useScores } from "../../../features/userData/useScores";

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

  const { updateScore: updateUserScore } = useScores();

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
    (isLost = false, timeRanOut = false) => {
      setProgress((prev) => {
        // Calculate final score
        const finalScore = prev.score;

        // Update user's score in the database
        updateUserScore({
          score: finalScore,
          gameType: "note-recognition",
        });

        return {
          ...prev,
          isFinished: true,
          isLost,
          timeRanOut,
        };
      });
    },
    [updateUserScore]
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
