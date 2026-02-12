import { useState, useEffect, useCallback } from "react";
import supabase from "../services/supabase";

const STUDENT_FEEDBACK_CLEARED_EVENT = "student-feedback-cleared";

export function useStudentFeedbackNotifications(studentId) {
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNewFeedbackCount = useCallback(async () => {
    if (!studentId) {
      setNewFeedbackCount(0);
      setIsLoading(false);
      return;
    }

    try {
      // Get last viewed feedback timestamp from localStorage
      const lastViewedKey = `lastViewedFeedback_${studentId}`;
      const lastViewedStr = localStorage.getItem(lastViewedKey);
      const lastViewed = lastViewedStr ? new Date(lastViewedStr) : new Date(0);

      // Count recordings with feedback added after last viewed timestamp
      const { data: recordings, error } = await supabase
        .from("practice_sessions")
        .select("id, reviewed_at, teacher_feedback")
        .eq("student_id", studentId)
        .not("teacher_feedback", "is", null)
        .not("reviewed_at", "is", null)
        .gt("reviewed_at", lastViewed.toISOString());

      if (error) throw error;

      setNewFeedbackCount(recordings?.length || 0);
    } catch (error) {
      console.error("Error fetching new feedback count:", error);
      setNewFeedbackCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchNewFeedbackCount();

    // Poll for new feedback every 30 seconds
    const interval = setInterval(fetchNewFeedbackCount, 30000);

    return () => clearInterval(interval);
  }, [fetchNewFeedbackCount]);

  // Listen for a global "cleared" signal so *all* instances of this hook
  // (sidebar/mobile tabs + PracticeSessions page) stay in sync immediately.
  useEffect(() => {
    if (!studentId || typeof window === "undefined") return;

    const onCleared = (event) => {
      const clearedFor = event?.detail?.studentId;
      if (clearedFor && clearedFor === studentId) {
        setNewFeedbackCount(0);
      }
    };

    window.addEventListener(STUDENT_FEEDBACK_CLEARED_EVENT, onCleared);
    return () => {
      window.removeEventListener(STUDENT_FEEDBACK_CLEARED_EVENT, onCleared);
    };
  }, [studentId]);

  const clearFeedbackNotifications = useCallback(() => {
    if (!studentId) return;

    const lastViewedKey = `lastViewedFeedback_${studentId}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    setNewFeedbackCount(0);

    // Notify other hook instances (e.g., sidebar/mobile nav) to clear immediately.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(STUDENT_FEEDBACK_CLEARED_EVENT, {
          detail: { studentId },
        })
      );
    }
  }, [studentId]);

  return {
    newFeedbackCount,
    isLoading,
    clearFeedbackNotifications,
    refreshCount: fetchNewFeedbackCount,
  };
}

