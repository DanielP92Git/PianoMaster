import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTeacherRecordings,
  updatePracticeSessionReview,
  getTeacherStudents,
  deletePracticeSessions,
} from "../../services/apiTeacher";
import { useTeacherRecordingNotifications } from "../../hooks/useTeacherRecordingNotifications";
import { useUser } from "../../features/authentication/useUser";
import {
  Clock,
  User,
  Calendar,
  Filter,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Search,
  ChevronDown,
  Trash2,
  Square,
  CheckSquare,
} from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import PracticeSessionPlayer from "../ui/PracticeSessionPlayer";
import { toast } from "react-hot-toast";

const REVIEW_STATUSES = [
  {
    value: "pending_review",
    label: "Pending Review",
    icon: Clock,
    color: "orange",
  },
  { value: "reviewed", label: "Reviewed", icon: CheckCircle, color: "blue" },
  { value: "needs_work", label: "Needs Work", icon: AlertCircle, color: "red" },
  { value: "excellent", label: "Excellent", icon: Star, color: "green" },
];

const ReviewModal = ({
  isOpen,
  onClose,
  recording,
  onSubmitReview,
  isLoading,
}) => {
  const [feedback, setFeedback] = useState(recording?.teacher_feedback || "");
  const [status, setStatus] = useState(recording?.status || "pending_review");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview(recording.id, {
      teacher_feedback: feedback,
      status: status,
    });
  };

  const handleClose = () => {
    setFeedback(recording?.teacher_feedback || "");
    setStatus(recording?.status || "pending_review");
    onClose();
  };

  const getStatusColor = (statusValue) => {
    const statusObj = REVIEW_STATUSES.find((s) => s.value === statusValue);
    return statusObj?.color || "gray";
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Review Recording">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recording Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Student:</span>
              <p className="text-gray-900">{recording?.student_name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Submitted:</span>
              <p className="text-gray-900">{recording?.formatted_date}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration:</span>
              <p className="text-gray-900">{recording?.duration_formatted}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Score:</span>
              <p className="text-gray-900">
                {recording?.analysis_score || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Status Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {REVIEW_STATUSES.map((statusOption) => (
              <button
                key={statusOption.value}
                type="button"
                onClick={() => setStatus(statusOption.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  status === statusOption.value
                    ? `border-${statusOption.color}-500 bg-${statusOption.color}-50`
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <statusOption.icon
                  className={`w-4 h-4 ${
                    status === statusOption.value
                      ? `text-${statusOption.color}-600`
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    status === statusOption.value
                      ? `text-${statusOption.color}-800`
                      : "text-gray-600"
                  }`}
                >
                  {statusOption.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teacher Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide feedback for the student..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Save Review
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const RecordingsReview = () => {
  const [filters, setFilters] = useState({
    studentId: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [selectedRecordings, setSelectedRecordings] = useState([]);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useUser();
  const { clearTeacherNotifications } = useTeacherRecordingNotifications(user?.id);

  // Clear notifications when component mounts
  useEffect(() => {
    if (user?.id) {
      clearTeacherNotifications();
    }
  }, [user?.id, clearTeacherNotifications]);

  // Debug effect to log component lifecycle
  useEffect(() => {
    // Component mounted or filters changed
    // 
    // 
  }, [filters]);

  // Memoize query key to prevent unnecessary refetches
  const recordingsQueryKey = useMemo(
    () => ["teacher-recordings", filters],
    [filters]
  );

  // Fetch recordings
  const {
    data: recordings = [],
    isLoading: recordingsLoading,
    error: recordingsError,
  } = useQuery({
    queryKey: recordingsQueryKey,
    queryFn: () => {
      // 
      return getTeacherRecordings(filters);
    },
    refetchInterval: 180000, // Refresh every 3 minutes (reduced from 30 seconds)
    staleTime: 120000, // Consider data fresh for 2 minutes
    onSuccess: (data) => {
      // 
    },
    onError: (error) => {
      console.error("❌ RecordingsReview - Error fetching recordings:", error);
    },
  });

  // Fetch students for filter dropdown
  const { data: students = [] } = useQuery({
    queryKey: ["teacher-students-for-recordings"],
    queryFn: () => {
      // 
      return getTeacherStudents();
    },
    staleTime: 300000, // Consider data fresh for 5 minutes
    refetchInterval: false, // No polling for dropdown data
    onSuccess: (data) => {
      // 
    },
    onError: (error) => {
      console.error("❌ RecordingsReview - Error fetching students:", error);
    },
  });

  // Update review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ sessionId, updates }) =>
      updatePracticeSessionReview(sessionId, updates),
    onSuccess: () => {
      // Only invalidate the recordings query with current filters
      queryClient.invalidateQueries({
        queryKey: ["teacher-recordings"],
        exact: false,
      });
      setReviewModalOpen(false);
      toast.success("Review saved successfully");
    },
    onError: (error) => {
      console.error("Review submission error:", error);
      toast.error("Failed to save review");
    },
  });

  // Delete recordings mutation
  const deleteMutation = useMutation({
    mutationFn: deletePracticeSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["teacher-recordings"],
        exact: false,
      });
      setSelectedRecordings([]);
      setShowDeleteConfirmModal(false);
      toast.success(data.message);
    },
    onError: (error) => {
      console.error("Delete recordings error:", error);
      toast.error(error.message || "Failed to delete recordings");
    },
  });

  // Filter recordings based on search term
  const filteredRecordings = recordings.filter((recording) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      recording.student_name.toLowerCase().includes(searchLower) ||
      recording.student_email.toLowerCase().includes(searchLower)
    );
  });

  // Debug logging for component state (disabled to prevent HMR spam)
  // 

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      studentId: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setSearchTerm("");
  };

  const handleReviewRecording = (recording) => {
    setSelectedRecording(recording);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = (sessionId, updates) => {
    reviewMutation.mutate({ sessionId, updates });
  };

  const handleRecordingSelect = (recording, isSelected) => {
    if (isSelected) {
      setSelectedRecordings((prev) => [...prev, recording]);
    } else {
      setSelectedRecordings((prev) =>
        prev.filter((r) => r.id !== recording.id)
      );
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedRecordings(filteredRecordings);
    } else {
      setSelectedRecordings([]);
    }
  };

  const isRecordingSelected = (recording) => {
    return selectedRecordings.some((r) => r.id === recording.id);
  };

  const handleDeleteSelected = () => {
    if (selectedRecordings.length > 0) {
      setShowDeleteConfirmModal(true);
    }
  };

  const handleConfirmDelete = () => {
    const recordingIds = selectedRecordings.map((r) => r.id);
    deleteMutation.mutate(recordingIds);
  };

  const isAllSelected =
    filteredRecordings.length > 0 &&
    filteredRecordings.every((recording) => isRecordingSelected(recording));

  const getStatusBadge = (status) => {
    const statusObj = REVIEW_STATUSES.find((s) => s.value === status);
    if (!statusObj) return null;

    const colorClasses = {
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      red: "bg-red-100 text-red-800 border-red-200",
      green: "bg-green-100 text-green-800 border-green-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
          colorClasses[statusObj.color]
        }`}
      >
        <statusObj.icon className="w-3 h-3" />
        {statusObj.label}
      </span>
    );
  };

  if (recordingsError) {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          Error Loading Recordings
        </h3>
        <p className="text-gray-300">Failed to load student recordings</p>
        <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30 max-w-lg mx-auto">
          <p className="text-red-300 text-sm">
            <strong>Error details:</strong> {recordingsError.message}
          </p>
          <p className="text-red-200 text-xs mt-2">
            Check browser console for more details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          <Button variant="secondary" size="small" onClick={clearFilters}>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Student Filter */}
          <select
            value={filters.studentId}
            onChange={(e) => handleFilterChange("studentId", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="" className="text-gray-900">
              All Students
            </option>
            {students.map((student) => (
              <option
                key={student.student_id}
                value={student.student_id}
                className="text-gray-900"
              >
                {student.student_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          >
            <option value="" className="text-gray-900">
              All Statuses
            </option>
            {REVIEW_STATUSES.map((status) => (
              <option
                key={status.value}
                value={status.value}
                className="text-gray-900"
              >
                {status.label}
              </option>
            ))}
          </select>

          {/* Date Range - Start Date */}
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            placeholder="Start Date"
          />
        </div>
      </Card>

      {/* Recordings List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">
              Recent Recordings ({filteredRecordings.length})
            </h2>
            {filteredRecordings.length > 0 && (
              <button
                onClick={() => handleSelectAll(!isAllSelected)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedRecordings.length > 0 && (
              <Button
                variant="error"
                size="small"
                onClick={handleDeleteSelected}
                icon={Trash2}
              >
                Delete Selected ({selectedRecordings.length})
              </Button>
            )}
            {filteredRecordings.length > 0 && (
              <Button
                variant="error"
                size="small"
                onClick={() => {
                  setSelectedRecordings(filteredRecordings);
                  setShowDeleteConfirmModal(true);
                }}
                icon={Trash2}
              >
                Delete All
              </Button>
            )}
          </div>
        </div>

        {recordingsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading recordings...</p>
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No Recordings Found
            </h3>
            <p className="text-gray-300 mb-4">
              {recordings.length === 0
                ? "No student recordings to review yet"
                : "No recordings match your current filters"}
            </p>
            {recordings.length === 0 && students.length === 0 && (
              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30 max-w-md mx-auto">
                <p className="text-blue-300 text-sm">
                  <strong>Getting started:</strong> Add students to your class
                  first using the "Students" tab, then they can submit practice
                  recordings for you to review.
                </p>
              </div>
            )}
            {recordings.length === 0 && students.length > 0 && (
              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30 max-w-md mx-auto">
                <p className="text-yellow-300 text-sm">
                  <strong>Note:</strong> You have {students.length} student(s)
                  but no recordings yet. Recordings will appear here once your
                  students start practicing and submitting audio recordings.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecordings.map((recording) => {
              const isSelected = isRecordingSelected(recording);
              return (
                <div
                  key={recording.id}
                  className={`bg-white/5 backdrop-blur-sm rounded-lg p-4 border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <button
                      onClick={() => handleRecordingSelect(recording, !isSelected)}
                      className="mt-1 text-gray-400 hover:text-blue-400 transition-colors flex-shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="font-medium text-white">
                          {recording.student_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        {recording.formatted_date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Clock className="w-4 h-4" />
                        {recording.duration_formatted}
                      </div>
                      {getStatusBadge(recording.status)}
                    </div>

                    {/* Audio Player */}
                    <div className="mb-3">
                      <PracticeSessionPlayer
                        session={recording}
                        isPlaying={playingId === recording.id}
                        onPlayStateChange={setPlayingId}
                        className="bg-white/5 border border-white/10 rounded-lg p-3"
                      />
                    </div>

                    {/* Feedback */}
                    {recording.teacher_feedback && (
                      <div className="bg-white/5 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-white">
                            Feedback:
                          </span>{" "}
                          {recording.teacher_feedback}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleReviewRecording(recording)}
                        icon={MessageSquare}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        recording={selectedRecording}
        onSubmitReview={handleSubmitReview}
        isLoading={reviewMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title="Delete Recordings"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete {selectedRecordings.length} Recording{selectedRecordings.length > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-gray-700">
            Are you sure you want to delete {selectedRecordings.length} selected recording{selectedRecordings.length > 1 ? "s" : ""}? 
            The audio files and all associated data will be permanently removed.
          </p>

          {selectedRecordings.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Recordings to be deleted:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                {selectedRecordings.map((recording) => (
                  <li key={recording.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    {recording.student_name} - {recording.formatted_date}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirmModal(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              icon={Trash2}
            >
              {deleteMutation.isPending
                ? "Deleting..."
                : `Delete ${selectedRecordings.length} Recording${selectedRecordings.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RecordingsReview;
