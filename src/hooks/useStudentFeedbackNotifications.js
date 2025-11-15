import { useState, useEffect, useCallback } from "react";
import supabase from "../services/supabase";

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

  const clearFeedbackNotifications = useCallback(() => {
    if (!studentId) return;

    const lastViewedKey = `lastViewedFeedback_${studentId}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    setNewFeedbackCount(0);
  }, [studentId]);

  return {
    newFeedbackCount,
    isLoading,
    clearFeedbackNotifications,
    refreshCount: fetchNewFeedbackCount,
  };
}

