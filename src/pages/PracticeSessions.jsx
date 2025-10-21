import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { practiceService } from "../services/practiceService";
import { useUser } from "../features/authentication/useUser";
import { Pencil, Trash2, Save, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../components/ui/BackButton";
import PracticeSessionPlayer from "../components/ui/PracticeSessionPlayer";
import { useNewRecordingsCount } from "../hooks/useNewRecordingsCount";

export default function PracticeSessions() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const { clearNewRecordings } = useNewRecordingsCount(user?.id);

  // Fetch practice sessions using React Query
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["practice-sessions", user?.id],
    queryFn: () => practiceService.getPracticeSessions(user.id),
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  useEffect(() => {
    if (user?.id) {
      clearNewRecordings();
    }
  }, [user?.id, clearNewRecordings]);

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

      // Optimistically update the cache
      queryClient.setQueryData(["practice-sessions", user?.id], (old) =>
        old?.map((session) =>
          session.id === sessionId
            ? { ...session, recording_description: notes }
            : session
        )
      );

      return { previousSessions };
    },
    onError: (error, { sessionId }, context) => {
      // Revert to the previous sessions on error
      queryClient.setQueryData(
        ["practice-sessions", user?.id],
        context.previousSessions
      );
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
      
      const result = await practiceService.deletePracticeSession(sessionId);
      
      return result;
    },
    onMutate: async (sessionId) => {
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", user?.id]);

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        user?.id,
      ]);

      // Optimistically update React Query cache
      queryClient.setQueryData(["practice-sessions", user?.id], (old) =>
        old?.filter((session) => session.id !== sessionId)
      );

      // Stop playing if the deleted session was being played
      if (playingId === sessionId) {
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onError: (error, sessionId, context) => {
      console.error("Delete mutation error:", error);
      // Rollback React Query cache
      queryClient.setQueryData(
        ["practice-sessions", user?.id],
        context.previousSessions
      );
      toast.error(`Failed to delete recording: ${error.message}`);
    },
    onSuccess: () => {
      
      toast.success("Recording deleted successfully");
    },
    onSettled: () => {
      
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
    },
  });

  // Add cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => practiceService.cleanupAllSessions(user.id),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", user?.id]);

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        user?.id,
      ]);

      // Optimistically clear cache
      queryClient.setQueryData(["practice-sessions", user?.id], []);

      // Stop any playing audio
      if (playingId) {
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
      toast.success("All practice sessions have been deleted");
    },
    onError: (error, variables, context) => {
      console.error("Cleanup error:", error);
      // Rollback on error
      queryClient.setQueryData(
        ["practice-sessions", user?.id],
        context.previousSessions
      );
      toast.error("Failed to delete all sessions");
    },
  });

  // Handle play state changes
  const handlePlayStateChange = (sessionId) => {
    setPlayingId(sessionId);
  };

  const handleEdit = (session) => {
    setEditingId(session.id);
    setEditedNotes(session.recording_description || "");
  };

  const handleSave = async (sessionId) => {
    const notes = editedNotes.trim();
    updateNotesMutation.mutate({ sessionId, notes });
  };

  const handleDelete = async (sessionId) => {
    if (window.confirm("Are you sure you want to delete this recording?")) {
      
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
      } catch (error) {
        console.error("Error in handleDelete:", error);
      }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <BackButton to="/" name="Dashboard" />
        <div className="text-center py-8">
          <p className="text-red-400">Failed to load practice recordings.</p>
          <p className="text-gray-400 text-sm mt-2">
            {error.message || "Please try again later."}
          </p>
        </div>
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
            <div key={session.id} className="space-y-4">
              {/* New Recording Badge */}
              {index === 0 && (
                <div className="flex justify-center">
                  <span className="px-3 py-1 text-sm font-medium text-white bg-green-500 rounded-full">
                    Latest Recording
                  </span>
                </div>
              )}

              {/* Combined Practice Session Container */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                {/* Practice Session Player */}
                <div className="p-4 border-b border-white/10">
                  <PracticeSessionPlayer
                    session={session}
                    isPlaying={playingId === session.id}
                    onPlayStateChange={handlePlayStateChange}
                    showDownload={true}
                    className="bg-transparent border-none p-0"
                  />
                </div>

                {/* Notes Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      Session Notes
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                        title="Edit notes"
                      >
                        <Pencil className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deleteSessionMutation.isLoading}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {editingId === session.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 resize-none"
                        rows="4"
                        placeholder="Add notes about this practice session..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(session.id)}
                          disabled={updateNotesMutation.isLoading}
                          className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {updateNotesMutation.isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/80 text-sm">
                      {session.recording_description ? (
                        <div className="whitespace-pre-wrap">
                          {session.recording_description}
                        </div>
                      ) : (
                        <div className="text-white/50 italic">
                          No notes added yet. Click the edit button to add
                          notes.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Teacher Feedback */}
              {session.teacher_feedback && (
                <div className="bg-indigo-900/30 rounded-xl p-4 border border-indigo-500/30">
                  <h4 className="text-indigo-300 font-medium mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                    Teacher Feedback
                  </h4>
                  <div className="text-white text-sm whitespace-pre-wrap">
                    {session.teacher_feedback}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
