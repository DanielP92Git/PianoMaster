import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { practiceService } from "../services/practiceService";
import { useUser } from "../features/authentication/useUser";
import { Pencil, Trash2, Save, X, Loader2, Square, CheckSquare } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../components/ui/BackButton";
import PracticeSessionPlayer from "../components/ui/PracticeSessionPlayer";
import { useStudentFeedbackNotifications } from "../hooks/useStudentFeedbackNotifications";

export default function PracticeSessions() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const { clearFeedbackNotifications } = useStudentFeedbackNotifications(user?.id);

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
      clearFeedbackNotifications();
    }
  }, [user?.id, clearFeedbackNotifications]);

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

  // Delete selected sessions mutation
  const deleteSelectedMutation = useMutation({
    mutationFn: async (sessionIds) => {
      // Delete sessions one by one
      await Promise.all(
        sessionIds.map((id) => practiceService.deletePracticeSession(id))
      );
      return sessionIds;
    },
    onMutate: async (sessionIds) => {
      await queryClient.cancelQueries(["practice-sessions", user?.id]);

      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        user?.id,
      ]);

      // Optimistically remove selected sessions
      queryClient.setQueryData(["practice-sessions", user?.id], (old) =>
        old?.filter((session) => !sessionIds.includes(session.id))
      );

      // Stop playing if any deleted session was being played
      if (sessionIds.includes(playingId)) {
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onSuccess: (sessionIds) => {
      queryClient.invalidateQueries(["practice-sessions", user?.id]);
      setSelectedSessions([]);
      toast.success(
        `Successfully deleted ${sessionIds.length} recording${sessionIds.length > 1 ? "s" : ""}`
      );
    },
    onError: (error, sessionIds, context) => {
      console.error("Delete selected error:", error);
      queryClient.setQueryData(
        ["practice-sessions", user?.id],
        context.previousSessions
      );
      toast.error("Failed to delete selected recordings");
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

  const handleSessionSelect = (sessionId, isSelected) => {
    if (isSelected) {
      setSelectedSessions((prev) => [...prev, sessionId]);
    } else {
      setSelectedSessions((prev) => prev.filter((id) => id !== sessionId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedSessions(sessions.map((s) => s.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSessions.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedSessions.length} selected recording${selectedSessions.length > 1 ? "s" : ""}?`
      )
    ) {
      try {
        await deleteSelectedMutation.mutateAsync(selectedSessions);
      } catch (error) {
        console.error("Error in handleDeleteSelected:", error);
      }
    }
  };

  const isSessionSelected = (sessionId) => selectedSessions.includes(sessionId);
  const isAllSelected =
    sessions?.length > 0 && selectedSessions.length === sessions.length;

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
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Practice Recordings</h1>
          {sessions?.length > 0 && (
            <button
              onClick={() => handleSelectAll(!isAllSelected)}
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-400" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedSessions.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleteSelectedMutation.isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {deleteSelectedMutation.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedSessions.length})
                </>
              )}
            </button>
          )}
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
              <div
                className={`bg-white/10 backdrop-blur-md rounded-xl border overflow-hidden transition-all ${
                  isSessionSelected(session.id)
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/20"
                }`}
              >
                {/* Practice Session Player with Checkbox */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() =>
                        handleSessionSelect(
                          session.id,
                          !isSessionSelected(session.id)
                        )
                      }
                      className="mt-2 text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
                    >
                      {isSessionSelected(session.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    {/* Player */}
                    <div className="flex-1 min-w-0">
                      <PracticeSessionPlayer
                        session={session}
                        isPlaying={playingId === session.id}
                        onPlayStateChange={handlePlayStateChange}
                        showDownload={true}
                        className="bg-transparent border-none p-0"
                      />
                    </div>
                  </div>
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

                {/* Teacher Feedback - Integrated within recording container */}
                {session.teacher_feedback && (
                  <div className="border-t border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4">
                    <h4 className="text-indigo-300 font-semibold mb-3 flex items-center gap-2">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="w-5 h-5 text-indigo-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                        />
                      </svg>
                      Teacher Feedback
                    </h4>
                    <div className="bg-white/10 rounded-lg p-3 border border-indigo-400/30">
                      <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                        {session.teacher_feedback}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
