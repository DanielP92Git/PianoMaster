import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { practiceService } from "../services/practiceService";
import { useUser } from "../features/authentication/useUser";
import { useActiveChildId } from "../hooks/useActiveChildId";
import {
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Square,
  CheckSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import PracticeSessionPlayer from "../components/ui/PracticeSessionPlayer";
import { useStudentFeedbackNotifications } from "../hooks/useStudentFeedbackNotifications";
import { useTranslation } from "react-i18next";

export default function PracticeSessions() {
  const { user } = useUser();
  const { childId, ready } = useActiveChildId();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editedNotes, setEditedNotes] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const { clearFeedbackNotifications } = useStudentFeedbackNotifications(
    user?.id
  );
  const { t } = useTranslation("common");

  // Fetch practice sessions using React Query
  const {
    data: sessions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["practice-sessions", childId],
    queryFn: () => practiceService.getPracticeSessions(childId),
    enabled: ready && !!childId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  useEffect(() => {
    if (user?.id) {
      clearFeedbackNotifications();
    }
  }, [user?.id, clearFeedbackNotifications]);

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({ sessionId, notes }) =>
      practiceService.updatePracticeSessionNotes(sessionId, notes),
    onMutate: async ({ sessionId, notes }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", childId]);

      // Snapshot the previous sessions
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        childId,
      ]);

      // Optimistically update the cache
      queryClient.setQueryData(["practice-sessions", childId], (old) =>
        old?.map((session) =>
          session.id === sessionId
            ? { ...session, recording_description: notes }
            : session
        )
      );

      return { previousSessions };
    },
    onError: (error, { sessionId: _sessionId }, context) => {
      // Revert to the previous sessions on error
      queryClient.setQueryData(
        ["practice-sessions", childId],
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
      queryClient.invalidateQueries(["practice-sessions", childId]);
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
      await queryClient.cancelQueries(["practice-sessions", childId]);

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        childId,
      ]);

      // Optimistically update React Query cache
      queryClient.setQueryData(["practice-sessions", childId], (old) =>
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
        ["practice-sessions", childId],
        context.previousSessions
      );
      toast.error(`Failed to delete recording: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Recording deleted successfully");
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries(["practice-sessions", childId]);
    },
  });

  // Add cleanup mutation
  const cleanupMutation = useMutation({
    mutationFn: () => practiceService.cleanupAllSessions(childId),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(["practice-sessions", childId]);

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        childId,
      ]);

      // Optimistically clear cache
      queryClient.setQueryData(["practice-sessions", childId], []);

      // Stop any playing audio
      if (playingId) {
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["practice-sessions", childId]);
      toast.success("All practice sessions have been deleted");
    },
    onError: (error, variables, context) => {
      console.error("Cleanup error:", error);
      // Rollback on error
      queryClient.setQueryData(
        ["practice-sessions", childId],
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
      await queryClient.cancelQueries(["practice-sessions", childId]);

      const previousSessions = queryClient.getQueryData([
        "practice-sessions",
        childId,
      ]);

      // Optimistically remove selected sessions
      queryClient.setQueryData(["practice-sessions", childId], (old) =>
        old?.filter((session) => !sessionIds.includes(session.id))
      );

      // Stop playing if any deleted session was being played
      if (sessionIds.includes(playingId)) {
        setPlayingId(null);
      }

      return { previousSessions };
    },
    onSuccess: (sessionIds) => {
      queryClient.invalidateQueries(["practice-sessions", childId]);
      setSelectedSessions([]);
      toast.success(
        `Successfully deleted ${sessionIds.length} recording${sessionIds.length > 1 ? "s" : ""}`
      );
    },
    onError: (error, sessionIds, context) => {
      console.error("Delete selected error:", error);
      queryClient.setQueryData(
        ["practice-sessions", childId],
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

  const isExpanded = (sessionId) => expandedSessions.has(sessionId);

  const toggleExpanded = (sessionId) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Format date and time separately
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="py-8 text-center">
          <p className="text-red-400">Failed to load practice recordings.</p>
          <p className="mt-2 text-sm text-gray-400">
            {error.message || "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      {/* Mobile-optimized header with stacked layout */}
      <div className="space-y-3">
        {/* Select All - Full width on mobile */}
        {sessions?.length > 0 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleSelectAll(!isAllSelected)}
              className="flex items-center gap-2 text-sm text-gray-300 transition-colors hover:text-white"
            >
              {isAllSelected ? (
                <CheckSquare className="h-5 w-5 text-blue-400" />
              ) : (
                <Square className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">
                {t("common.actions.selectAll")}
              </span>
              <span className="sm:hidden">Select All</span>
            </button>
          </div>
        )}

        {/* Action Buttons - Stacked on mobile, row on larger screens */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {/* Show "Delete All" only when all sessions are selected */}
          {isAllSelected && sessions?.length > 0 && (
            <button
              onClick={handleCleanup}
              disabled={cleanupMutation.isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto"
            >
              {cleanupMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Cleaning up...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.actions.deleteAllSessions")}
                  </span>
                  <span className="sm:hidden">Delete All</span>
                </>
              )}
            </button>
          )}

          {/* Show "Delete Selected" when specific recordings are selected (but not all) */}
          {selectedSessions.length > 0 && !isAllSelected && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleteSelectedMutation.isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 sm:w-auto"
            >
              {deleteSelectedMutation.isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("common.actions.deleteSelected")} (
                    {selectedSessions.length})
                  </span>
                  <span className="sm:hidden">
                    Delete Selected ({selectedSessions.length})
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {sessions?.length === 0 ? (
          <div className="py-12 text-center sm:py-16">
            <p className="text-sm text-gray-400 sm:text-base">
              {t("pages.practiceSessions.noPracticeSessions")}
            </p>
          </div>
        ) : (
          sessions?.map((session, index) => {
            const expanded = isExpanded(session.id);

            return (
              <div key={session.id} className="space-y-3 sm:space-y-4">
                {/* New Recording Badge */}
                {index === 0 && (
                  <div className="flex justify-center">
                    <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-medium text-white sm:text-sm">
                      {t("pages.practiceSessions.latestRecording")}
                    </span>
                  </div>
                )}

                {/* Combined Practice Session Container */}
                <div
                  className={`overflow-hidden rounded-xl border bg-white/10 backdrop-blur-md transition-all ${
                    isSessionSelected(session.id)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/20"
                  }`}
                >
                  {/* Collapsed Header - Always visible */}
                  <button
                    onClick={() => toggleExpanded(session.id)}
                    className="w-full border-b border-white/10 p-3 transition-colors hover:bg-white/5 sm:p-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Selection Checkbox */}
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSessionSelected(session.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSessionSelect(
                            session.id,
                            !isSessionSelected(session.id)
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSessionSelect(
                              session.id,
                              !isSessionSelected(session.id)
                            );
                          }
                        }}
                        className="flex min-h-[44px] min-w-[44px] flex-shrink-0 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:text-blue-400"
                        aria-label={
                          isSessionSelected(session.id)
                            ? "Deselect session"
                            : "Select session"
                        }
                      >
                        {isSessionSelected(session.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-400 sm:h-6 sm:w-6" />
                        ) : (
                          <Square className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                      </div>

                      {/* Basic Info - Date, Time, Status */}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <div className="text-sm font-medium text-white sm:text-base">
                              {formatDate(session.submitted_at)}
                            </div>
                            <div className="text-xs text-white/70 sm:text-sm">
                              {formatTime(session.submitted_at)}
                            </div>
                          </div>
                          {session.status && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/50">
                                {t("pages.practiceSessions.statusLabel")}:
                              </span>
                              <span
                                className={`rounded px-2 py-1 text-xs font-medium ${
                                  session.status === "excellent"
                                    ? "bg-green-500/20 text-green-400"
                                    : session.status === "reviewed"
                                      ? "bg-blue-500/20 text-blue-400"
                                      : session.status === "needs_work"
                                        ? "bg-yellow-500/20 text-yellow-400"
                                        : "bg-gray-500/20 text-gray-400"
                                }`}
                              >
                                {t(
                                  `pages.practiceSessions.status.${session.status}`
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse Icon */}
                      <div className="flex-shrink-0 text-white/70">
                        {expanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content - Only shown when expanded */}
                  {expanded && (
                    <>
                      {/* Practice Session Player */}
                      <div className="border-b border-white/10 p-3 sm:p-4">
                        <PracticeSessionPlayer
                          session={session}
                          isPlaying={playingId === session.id}
                          onPlayStateChange={handlePlayStateChange}
                          showDownload={true}
                          className="border-none bg-transparent p-0"
                        />
                      </div>

                      {/* Notes Section */}
                      <div className="p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h4 className="flex items-center gap-2 text-sm font-medium text-white sm:text-base">
                            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></span>
                            <span className="truncate">
                              {t("pages.practiceSessions.sessionStudentNotes")}
                            </span>
                          </h4>
                          <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => handleEdit(session)}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-blue-600 p-2 transition-colors hover:bg-blue-700 sm:p-2.5"
                              title={t(
                                "pages.practiceSessions.editStudentNotes"
                              )}
                              aria-label={t(
                                "pages.practiceSessions.editStudentNotes"
                              )}
                            >
                              <Pencil className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(session.id)}
                              disabled={deleteSessionMutation.isLoading}
                              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-red-600 p-2 transition-colors hover:bg-red-700 disabled:opacity-50 sm:p-2.5"
                              title={t("pages.practiceSessions.deleteSession")}
                              aria-label={t(
                                "pages.practiceSessions.deleteSession"
                              )}
                            >
                              <Trash2 className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>

                        {editingId === session.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editedNotes}
                              onChange={(e) => setEditedNotes(e.target.value)}
                              className="w-full resize-none rounded-lg border border-white/20 bg-white/10 p-3 text-sm text-white placeholder-white/50 sm:text-base"
                              rows="4"
                              placeholder={t(
                                "pages.practiceSessions.addStudentNotes"
                              )}
                            />
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => handleSave(session.id)}
                                disabled={updateNotesMutation.isLoading}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-green-700 disabled:opacity-50 sm:flex-none"
                              >
                                <Save className="h-4 w-4" />
                                {updateNotesMutation.isLoading
                                  ? t("common.actions.saving")
                                  : t("common.actions.save")}
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-700 sm:flex-none"
                              >
                                <X className="h-4 w-4" />
                                {t("common.actions.cancel")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-white/80 sm:text-base">
                            {session.recording_description ? (
                              <div className="whitespace-pre-wrap break-words">
                                {session.recording_description}
                              </div>
                            ) : (
                              <div className="italic text-white/50">
                                {t(
                                  "pages.practiceSessions.noStudentNotesAdded"
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Teacher Feedback - Integrated within recording container */}
                      {session.teacher_feedback && (
                        <div className="border-t border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 sm:p-4">
                          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-300 sm:mb-3 sm:text-base">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 flex-shrink-0 text-indigo-400 sm:h-5 sm:w-5"
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
                            <span className="truncate">
                              {t("pages.practiceSessions.teacherFeedback")}
                            </span>
                          </h4>
                          <div className="rounded-lg border border-indigo-400/30 bg-white/10 p-3">
                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white sm:text-base">
                              {session.teacher_feedback}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
