import React, { useState } from "react";
import { Send, Loader2, X, Mic } from "lucide-react";
import { useUser } from "../../features/authentication/useUser";
import { useNewRecordingsCount } from "../../hooks/useNewRecordingsCount";
import { useModal } from "../../contexts/ModalContext";
import { usePracticeSessionWithAchievements } from "../../hooks/usePracticeSessionWithAchievements";
import AudioRecorder from "../ui/AudioRecorder";
import AudioPlayer from "../ui/AudioPlayer";
import toast from "react-hot-toast";

// Recording Modal Component
function RecordingModalContent({ onClose, onSubmit }) {
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Handle recording completion
  const handleRecordingComplete = (blob, duration) => {
    setRecordingBlob(blob);
    setRecordingDuration(duration);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    toast.success(
      `Recording completed (${minutes}:${seconds.toString().padStart(2, "0")})`
    );
  };

  // Handle recording cancellation
  const handleRecordingCancel = () => {
    setRecordingBlob(null);
    setRecordingDuration(0);
    setNotes("");
  };

  const handleModalClose = () => {
    handleRecordingCancel();
    onClose();
  };

  // Handle submit with local state
  const handleSubmit = async () => {
    if (!recordingBlob) return;

    setIsUploading(true);
    try {
      await onSubmit(
        recordingBlob,
        notes,
        recordingDuration,
        setUploadProgress
      );
      // Close modal on success
      onClose();
    } catch (error) {
      // Error handling is done in the parent
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Modal Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Record Practice Session
        </h2>
        <button
          onClick={handleModalClose}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Audio Recorder Component */}
        {!recordingBlob && (
          <div className="bg-gray-50 rounded-xl p-6">
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onRecordingCancel={handleRecordingCancel}
              maxDuration={600} // 10 minutes
              showVisualization={true}
              visualizationHeight={120}
              className="bg-white shadow-sm"
            />
          </div>
        )}

        {/* Recording Review and Submit */}
        {recordingBlob && (
          <div className="space-y-6">
            {/* Audio Player for Review */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Review Your Recording
              </h3>
              <AudioPlayer
                src={URL.createObjectURL(recordingBlob)}
                showVolumeControl={true}
                showSeekBar={true}
                showTimeDisplay={true}
                className="bg-white shadow-sm"
              />
            </div>

            {/* Notes Input */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Practice Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your practice session, what you worked on, challenges faced, etc..."
                className="w-full p-4 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows="4"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {uploadProgress?.phase === "preparing" && "Preparing..."}
                    {uploadProgress?.phase === "uploading" &&
                      `Uploading... (${uploadProgress.percentage}%)`}
                    {uploadProgress?.phase === "completed" && "Finalizing..."}
                    {!uploadProgress && "Uploading..."}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Recording
                  </>
                )}
              </button>
              <button
                onClick={handleRecordingCancel}
                disabled={isUploading}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <X className="w-5 h-5" />
                Record Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PracticeRecorder() {
  const { user } = useUser();
  const { addNewRecording } = useNewRecordingsCount(user?.id);
  const { openModal, closeModal } = useModal();
  const uploadPracticeSession = usePracticeSessionWithAchievements();

  // Open recording modal
  const openRecordingModal = () => {
    openModal(
      <RecordingModalContent onSubmit={handleSubmit} onClose={closeModal} />
    );
  };

  const handleSubmit = async (
    recordingBlob,
    notes,
    recordingDuration,
    setUploadProgress
  ) => {
    if (!recordingBlob) return;

    setUploadProgress({ phase: "preparing", percentage: 0 });

    const result = await uploadPracticeSession.mutateAsync({
      recordingBlob,
      notes,
      recordingDuration,
      options: {
        compressionQuality: "MEDIUM",
        maxRetries: 3,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
        onRetry: (retryInfo) => {
          toast.error(`Upload failed, retrying... (${retryInfo.attempt}/3)`);
        },
      },
    });

    // Add the new recording to the count
    if (result?.session?.id) {
      addNewRecording(result.session.id);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="text-center lg:text-left">
        <h2 className="text-xl font-bold text-white mb-4 whitespace-nowrap">
          Record Practice Session
        </h2>
        <div className="flex justify-center lg:justify-start">
          <button
            onClick={openRecordingModal}
            className="flex gap-2 items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors"
          >
            <Mic className="w-5 h-5" />
            Start Recording
          </button>
        </div>
      </div>
    </div>
  );
}
