import { useState, useEffect, useCallback } from "react";

export function useNewRecordingsCount(userId) {
  const [newCount, setNewCount] = useState(0);

  const updateCount = useCallback(() => {
    if (!userId) return;
    const newRecordings =
      JSON.parse(localStorage.getItem(`newRecordings_${userId}`)) || [];
    setNewCount(newRecordings.length);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    updateCount();

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === `newRecordings_${userId}`) {
        updateCount();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [userId, updateCount]);

  const addNewRecording = useCallback(
    (recordingId) => {
      if (!userId) return;

      const newRecordings =
        JSON.parse(localStorage.getItem(`newRecordings_${userId}`)) || [];
      if (!newRecordings.includes(recordingId)) {
        newRecordings.push(recordingId);
        localStorage.setItem(
          `newRecordings_${userId}`,
          JSON.stringify(newRecordings)
        );
        setNewCount(newRecordings.length); // Immediately update the count
      }
    },
    [userId]
  );

  const clearNewRecordings = useCallback(() => {
    if (!userId) return;

    localStorage.setItem(`newRecordings_${userId}`, JSON.stringify([]));
    localStorage.setItem(
      `lastViewedRecordings_${userId}`,
      new Date().toISOString()
    );
    setNewCount(0); // Immediately update the count
  }, [userId]);

  return { newCount, addNewRecording, clearNewRecordings };
}
