import { useState, useEffect, useCallback } from "react";
import supabase from "../services/supabase";

export function useTeacherRecordingNotifications(teacherId) {
  const [newRecordingsCount, setNewRecordingsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNewRecordingsCount = useCallback(async () => {
    if (!teacherId) {
      setNewRecordingsCount(0);
      setIsLoading(false);
      return;
    }

    try {
      // Get last viewed timestamp from localStorage
      const lastViewedKey = `lastViewedRecordings_teacher_${teacherId}`;
      const lastViewedStr = localStorage.getItem(lastViewedKey);
      const lastViewed = lastViewedStr ? new Date(lastViewedStr) : new Date(0);

      // Get all student IDs connected to this teacher
      const { data: connections, error: connectionsError } = await supabase
        .from("teacher_student_connections")
        .select("student_id")
        .eq("teacher_id", teacherId)
        .eq("status", "accepted");

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setNewRecordingsCount(0);
        setIsLoading(false);
        return;
      }

      const studentIds = connections.map((conn) => conn.student_id);

      // Count recordings submitted after last viewed timestamp
      const { data: recordings, error: recordingsError } = await supabase
        .from("practice_sessions")
        .select("id, submitted_at")
        .in("student_id", studentIds)
        .eq("has_recording", true)
        .not("recording_url", "is", null)
        .neq("recording_url", "")
        .gt("submitted_at", lastViewed.toISOString());

      if (recordingsError) throw recordingsError;

      setNewRecordingsCount(recordings?.length || 0);
    } catch (error) {
      console.error("Error fetching new recordings count:", error);
      setNewRecordingsCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchNewRecordingsCount();

    // Poll for new recordings every 30 seconds
    const interval = setInterval(fetchNewRecordingsCount, 30000);

    return () => clearInterval(interval);
  }, [fetchNewRecordingsCount]);

  const clearTeacherNotifications = useCallback(() => {
    if (!teacherId) return;

    const lastViewedKey = `lastViewedRecordings_teacher_${teacherId}`;
    localStorage.setItem(lastViewedKey, new Date().toISOString());
    setNewRecordingsCount(0);
  }, [teacherId]);

  return {
    newRecordingsCount,
    isLoading,
    clearTeacherNotifications,
    refreshCount: fetchNewRecordingsCount,
  };
}

