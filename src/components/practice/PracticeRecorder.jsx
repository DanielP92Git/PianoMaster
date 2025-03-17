import React, { useState, useRef } from "react";
import { Mic, Square, Send, Loader2, X } from "lucide-react";
import { practiceService } from "../../services/practiceService";
import { useUser } from "../../features/authentication/useUser";
import { useNewRecordingsCount } from "../../hooks/useNewRecordingsCount";
import toast from "react-hot-toast";

export default function PracticeRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const isCancelling = useRef(false);
  const { user } = useUser();
  const { addNewRecording } = useNewRecordingsCount(user?.id);

  const startRecording = async () => {
    try {
      // First check if the device supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Your device doesn't support audio recording");
        return;
      }

      // Request microphone access with specific audio constraints for iOS
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: "audio/webm",
        audioBitsPerSecond: 128000,
      });

      chunks.current = []; // Reset chunks
      isCancelling.current = false;

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        if (!isCancelling.current) {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          setRecordingBlob(blob);
        }
        setIsRecording(false);
        chunks.current = []; // Clear chunks after use

        // Stop all tracks to properly release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording in 100ms chunks to ensure smooth data collection
      mediaRecorder.current.start(100);
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      console.error("Error accessing microphone:", error);

      // Handle specific iOS and permission errors
      if (error.name === "NotAllowedError") {
        toast.error(
          "Microphone access was denied. Please allow microphone access in your device settings and try again."
        );
      } else if (error.name === "NotFoundError") {
        toast.error("No microphone found. Please check your device settings.");
      } else if (error.name === "NotSupportedError") {
        toast.error(
          "Audio recording is not supported on this device or browser."
        );
      } else if (error.name === "SecurityError") {
        toast.error(
          "Microphone access is blocked. Please check your browser settings."
        );
      } else {
        toast.error("Could not access microphone. Please try again.");
      }

      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      isCancelling.current = false;
      mediaRecorder.current.stop();
      // Stop all tracks to properly release the microphone
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      toast.success("Recording stopped");
    }
  };

  const cancelRecording = () => {
    isCancelling.current = true;

    if (mediaRecorder.current) {
      if (mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop();
        // Stop all tracks to properly release the microphone
        mediaRecorder.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }

    // Clear all state and data
    chunks.current = [];
    setRecordingBlob(null);
    setNotes("");
    mediaRecorder.current = null;
    setIsRecording(false);
    toast.success("Recording cancelled");
  };

  const handleSubmit = async () => {
    if (!recordingBlob) return;

    try {
      setIsUploading(true);
      const session = await practiceService.uploadPracticeSession(
        recordingBlob,
        user.id,
        notes
      );
      setRecordingBlob(null);
      setNotes("");
      toast.success("Practice session submitted successfully!");

      // Add the new recording to the count
      if (session?.id) {
        addNewRecording(session.id);
      }
    } catch (error) {
      console.error("Error uploading practice session:", error);
      toast.error("Failed to upload practice session");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-white mb-4">
          Record Practice Session
        </h2>

        <div className="space-y-4">
          {!recordingBlob ? (
            <div className="flex gap-2">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                  isRecording
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Recording
                  </>
                )}
              </button>
              {isRecording && (
                <button
                  onClick={cancelRecording}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your practice session..."
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Recording
                    </>
                  )}
                </button>
                <button
                  onClick={cancelRecording}
                  disabled={isUploading}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
