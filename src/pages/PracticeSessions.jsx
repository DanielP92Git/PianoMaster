import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { practiceService } from "../services/practiceService";
import { useUser } from "../features/authentication/useUser";
import { Pencil, Trash2, Save, X, Play, Pause, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../components/ui/BackButton";
import { useNewRecordingsCount } from "../hooks/useNewRecordingsCount";

export default function PracticeSessions() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(new Audio());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { clearNewRecordings } = useNewRecordingsCount(user?.id);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (user?.id) {
      clearNewRecordings();
      fetchSessions();
    }
  }, [user?.id, clearNewRecordings]);

  // Fetch practice sessions
  const fetchSessions = async () => {
    try {
      const data = await practiceService.getPracticeSessions(user.id);
      setSessions(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching practice sessions:", error);
      setIsLoading(false);
    }
  };

  // Get the latest recording timestamp
  const latestRecordingTime = sessions?.[0]?.submitted_at;
  const isNewRecording = (submittedAt) => {
    if (!latestRecordingTime) return false;
    return submittedAt === latestRecordingTime;
  };

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({ sessionId, notes }) =>
      practiceService.updatePracticeSessionNotes(sessionId, notes),
    onMutate: async ({ sessionId, notes }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", user?.id]);

      // Snapshot the previous sessions
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        user?.id,
      ]);

      // Optimistically update the sessions
      setSessions((currentSessions) =>
        currentSessions.map((session) =>
          session.id === sessionId ? { ...session, notes } : session
        )
      );

      return { previousSessions };
    },
    onError: (error, { sessionId }, context) => {
      // Revert to the previous sessions on error
      setSessions(context.previousSessions);
      toast.error("Failed to update notes");
    },
    onSuccess: () => {
      toast.success("Notes updated successfully");
      setEditingId(null);
    },
    onSettled: () => {
      // Refetch to ensure server state
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      console.log("Starting delete mutation for session:", sessionId);
      const result = await practiceService.deletePracticeSession(sessionId);
      console.log("Delete mutation completed:", result);
      return result;
    },
    onMutate: async (sessionId) => {
      console.log("Optimistic update starting for session:", sessionId);
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", user?.id]);

      // Snapshot the previous value
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        user?.id,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(["practice-sessions", user?.id], (old) =>
        old?.filter((session) => session.id !== sessionId)
      );

      // Stop playing if the deleted session was being played
      if (playingId === sessionId) {
        audioRef.current.pause();
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onError: (error, sessionId, context) => {
      console.error("Delete mutation error:", error);
      // Rollback on error
      queryClient.setQueryData(
        ["practice-sessions", user?.id],
        context.previousSessions
      );
      toast.error(`Failed to delete recording: ${error.message}`);
    },
    onSuccess: () => {
      console.log("Delete mutation succeeded");
      toast.success("Recording deleted successfully");
    },
    onSettled: () => {
      console.log("Delete mutation settled, invalidating queries");
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
    },
  });

  // Add cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => practiceService.cleanupAllSessions(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
      toast.success("All practice sessions have been deleted");
      // Stop any playing audio
      if (playingId) {
        audioRef.current.pause();
        setPlayingId(null);
      }
    },
    onError: (error) => {
      console.error("Cleanup error:", error);
      toast.error("Failed to delete all sessions");
    },
  });

  // Format time helper function
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Format status helper function
  const formatStatus = (status) => {
    if (!status) return "";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Update time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setPlayingId(null);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEdit = (session) => {
    setEditingId(session.id);
    setEditedNotes(session.notes || "");
  };

  const handleSave = async (sessionId) => {
    const notes = editedNotes.trim();
    updateNotesMutation.mutate({ sessionId, notes });
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this recording?")) {
      console.log("User confirmed deletion of session:", sessionId);
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
      } catch (error) {
        console.error("Error in handleDelete:", error);
      }
    }
  };

  const handlePlay = async (session) => {
    try {
      // If currently playing this session, pause it
      if (playingId === session.id) {
        audioRef.current.pause();
        setPlayingId(null);
        return;
      }

      // If playing a different session, stop it first
      if (playingId) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setPlayingId(null);
      }

      // If this session was previously loaded and paused, just resume
      if (
        audioRef.current.src &&
        audioRef.current.src.includes(session.recording_url)
      ) {
        try {
          await audioRef.current.play();
          setPlayingId(session.id);
          return;
        } catch (playError) {
          console.error("Play error:", playError);
          toast.error("Failed to play recording");
          setPlayingId(null);
        }
      }

      // Get the signed URL
      const url = await practiceService.getRecordingUrl(session.recording_url);

      // Reset audio states
      setCurrentTime(0);
      setDuration(0);

      // Set up the audio element
      audioRef.current.src = url;
      audioRef.current.load();

      // Set up error handling for the audio element
      audioRef.current.onerror = (e) => {
        console.error("Audio playback error:", e.target.error);
        toast.error("Failed to play recording");
        setPlayingId(null);
      };

      // Wait for the audio to be loaded before playing
      audioRef.current.oncanplay = async () => {
        try {
          await audioRef.current.play();
          setPlayingId(session.id);
          setDuration(audioRef.current.duration);
        } catch (playError) {
          console.error("Play error:", playError);
          toast.error("Failed to play recording");
          setPlayingId(null);
        }
      };
    } catch (error) {
      console.error("Error getting recording URL:", error);
      toast.error("Failed to play recording");
      setPlayingId(null);
    }
  };

  const handleCleanup = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete ALL practice sessions? This cannot be undone."
      )
    ) {
      try {
        await cleanupMutation.mutateAsync();
      } catch (error) {
        console.error("Error in handleCleanup:", error);
      }
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <BackButton to="/" name="Dashboard" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Practice Recordings</h1>
        {sessions?.length > 0 && (
          <button
            onClick={handleCleanup}
            disabled={cleanupMutation.isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {cleanupMutation.isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cleaning up...
              </div>
            ) : (
              "Delete All Sessions"
            )}
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {sessions?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No practice sessions recorded yet.</p>
          </div>
        ) : (
          sessions?.map((session, index) => (
            <div
              key={session.id}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className="flex items-center gap-2 text-sm text-gray-700">
                    Status:
                    <div className="text-indigo-300">
                      {formatStatus(session.status)}
                    </div>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePlay(session)}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      {playingId === session.id ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>
                    {playingId === session.id && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="text-xs text-gray-400 w-16 text-right">
                          {formatTime(currentTime)}
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={currentTime || 0}
                          onChange={handleSeek}
                          className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer 
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                            [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                            [&::-webkit-slider-thumb]:bg-white hover:[&::-webkit-slider-thumb]:bg-indigo-400
                            [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-runnable-track]:rounded-lg
                            [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                            [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0
                            [&::-moz-range-track]:bg-white/20 [&::-moz-range-track]:rounded-lg"
                        />
                        <div className="text-xs text-gray-400 w-16">
                          {formatTime(duration)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-400">
                          {new Date(session.submitted_at).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(session.submitted_at).toLocaleTimeString()}
                        </p>
                        {index === 0 && (
                          <span className="px-2 py-0.5 text-xs font-medium text-white bg-green-500 rounded-full">
                            New recording
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {editingId === session.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(session.id)}
                          disabled={updateNotesMutation.isLoading}
                          className="p-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <Save className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white">
                      {session.notes || "No notes added"}
                    </p>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={() => handleEdit(session)}
                    className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Pencil className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => handleDelete(session.id)}
                    disabled={deleteSessionMutation.isLoading}
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {session.teacher_feedback && (
                <div className="mt-4 p-3 rounded-lg bg-indigo-900/50 border border-indigo-500/30">
                  <p className="text-sm font-medium text-indigo-300">
                    Teacher Feedback:
                  </p>
                  <p className="text-white">{session.teacher_feedback}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
