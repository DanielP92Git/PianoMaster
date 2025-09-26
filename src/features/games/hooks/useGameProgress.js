import { useState, useCallback } from "react";
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

  const { updateScore: updateUserScore } = useScores();
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
      let finalScore = 0;
      let accuracy = 0;
      let totalQuestions = 0;

      setProgress((prev) => {
        // Calculate final score and session data
        finalScore = prev.score;
        totalQuestions = prev.totalQuestions;
        accuracy =
          prev.totalQuestions > 0
            ? (prev.correctAnswers / prev.totalQuestions) * 100
            : 0;

        // Update user's score in the database
        updateUserScore({
          score: finalScore,
          gameType: "note-recognition",
        });

        // Don't call showPointsGain here - will be called after state update

        return {
          ...prev,
          isFinished: true,
          isLost,
          timeRanOut,
        };
      });

      // Show points gain notification after state update
      if (finalScore > 0) {
        showPointsGain(finalScore, "note-recognition");
      }

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
    [updateUserScore, user]
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
