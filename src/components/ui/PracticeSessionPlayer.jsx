import React, { useState, useCallback, useEffect, useRef } from "react";
import { Play, Pause, Loader2, AlertCircle, Download } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import { practiceService } from "../../services/practiceService";
import audioCacheService from "../../services/audioCacheService";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function PracticeSessionPlayer({
  session,
  isPlaying,
  onPlayStateChange,
  className = "",
  disabled = false,
  showDownload = false,
}) {
  const { t } = useTranslation("common");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [urlExpiry, setUrlExpiry] = useState(null);
  const audioPlayerRef = useRef(null);

  // Get signed URL for the audio file with caching
  const getAudioUrl = useCallback(async () => {
    if (!session?.recording_url) return;

    try {
      setIsLoadingUrl(true);
      setUrlError(null);

      // Use cache service for URL management
      const cacheKey = `session_${session.id}_${session.recording_url}`;
      const url = await audioCacheService.get(cacheKey, async () => {
        return await practiceService.getRecordingUrl(session.recording_url);
      });

      setAudioUrl(url);

      // Set expiry time (Supabase signed URLs typically expire in 1 hour)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      setUrlExpiry(expiryTime);
    } catch (error) {
      console.error("Failed to get audio URL:", error);
      setUrlError("Failed to load audio");
      toast.error("Failed to load recording");
    } finally {
      setIsLoadingUrl(false);
    }
  }, [session?.recording_url, session?.id]);

  // Check if URL needs refresh (before expiry)
  const needsUrlRefresh = useCallback(() => {
    if (!urlExpiry) return true;

    const now = new Date();
    const timeUntilExpiry = urlExpiry.getTime() - now.getTime();

    // Refresh if less than 10 minutes remaining
    return timeUntilExpiry < 10 * 60 * 1000;
  }, [urlExpiry]);

  // Handle audio player events
  const handleAudioPlay = useCallback(() => {
    // Audio started playing successfully
    onPlayStateChange?.(session.id);
  }, [onPlayStateChange, session.id]);

  const handleAudioPause = useCallback(() => {
    // Audio was paused - only clear if this session is currently playing
    if (isPlaying) {
      onPlayStateChange?.(null);
    }
  }, [isPlaying, onPlayStateChange]);

  const handleAudioStop = useCallback(() => {
    onPlayStateChange?.(null);
  }, [onPlayStateChange]);

  const handleAudioEnded = useCallback(() => {
    onPlayStateChange?.(null);
  }, [onPlayStateChange]);

  const handleAudioError = useCallback(
    (error) => {
      console.error("Audio playback error:", error);
      setUrlError("Playback failed");
      onPlayStateChange?.(null);

      // If error might be due to expired URL, try refreshing
      if (audioUrl && needsUrlRefresh()) {
        toast.error("Audio expired, click play to reload");
      } else {
        toast.error("Audio playback failed");
      }
    },
    [audioUrl, needsUrlRefresh, onPlayStateChange]
  );

  // Download recording
  const handleDownload = useCallback(async () => {
    if (!audioUrl) {
      await getAudioUrl();
    }

    if (audioUrl) {
      try {
        const link = document.createElement("a");
        link.href = audioUrl;
        link.download = `practice-session-${session.id}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      } catch (error) {
        console.error("Download failed:", error);
        toast.error("Download failed");
      }
    }
  }, [audioUrl, getAudioUrl, session.id]);

  // Load URL on mount
  useEffect(() => {
    if (!audioUrl && session?.recording_url) {
      getAudioUrl();
    }
  }, [session?.recording_url]); // Only run when recording_url changes

  // Auto-refresh URL when needed
  useEffect(() => {
    if (isPlaying && audioUrl && needsUrlRefresh()) {
      getAudioUrl();
    }
  }, [isPlaying, audioUrl, needsUrlRefresh, getAudioUrl]);

  // Format session info
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = t("common.locale"); // Get locale from translations

    return date.toLocaleString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${kb.toFixed(0)} KB`;
    }
  };

  return (
    <div
      className={
        className ||
        `bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20`
      }
    >
      {/* Session Info Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <div className="text-white text-sm font-medium">
            {formatDate(session.submitted_at)}
          </div>
          <div className="flex items-center gap-4 text-xs text-white/70">
            {session.format && <span>Format: {session.format}</span>}
            {session.quality && <span>Quality: {session.quality}</span>}
            {session.file_size && (
              <span>Size: {formatFileSize(session.file_size)}</span>
            )}
            {session.duration_seconds && (
              <span>
                Duration: {Math.floor(session.duration_seconds / 60)}:
                {(session.duration_seconds % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {showDownload && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={disabled || (!audioUrl && !session.recording_url)}
              className="p-2 text-white/70 hover:text-white disabled:text-white/30 disabled:cursor-not-allowed transition-colors"
              title="Download recording"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Session Notes */}
      {session.notes && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <div className="text-white/70 text-sm font-medium mb-1">Notes:</div>
          <div className="text-white text-sm whitespace-pre-wrap">
            {session.notes}
          </div>
        </div>
      )}

      {/* Error Display */}
      {urlError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm">{urlError}</span>
          <button
            onClick={getAudioUrl}
            className="ml-auto text-red-300 hover:text-red-200 text-sm underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Audio Player - Always visible, shows loading state if URL not ready */}
      {isLoadingUrl ? (
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-3" />
          <span className="text-white/70">Loading audio...</span>
        </div>
      ) : audioUrl && !urlError ? (
        <AudioPlayer
          src={audioUrl}
          autoPlay={false}
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onStop={handleAudioStop}
          onEnded={handleAudioEnded}
          onError={handleAudioError}
          showVolumeControl={true}
          showSeekBar={true}
          showTimeDisplay={true}
          disabled={disabled}
          knownDuration={session?.duration_seconds || null}
          className="bg-transparent border-white/10"
        />
      ) : null}

      {/* Status Indicator */}
      {session.status && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-white/50">
            {t("pages.practiceSessions.statusLabel")}:
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              session.status === "excellent"
                ? "bg-green-500/20 text-green-400"
                : session.status === "reviewed"
                  ? "bg-blue-500/20 text-blue-400"
                  : session.status === "needs_work"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-gray-500/20 text-gray-400"
            }`}
          >
            {t(`pages.practiceSessions.status.${session.status}`)}
          </span>
        </div>
      )}
    </div>
  );
}
