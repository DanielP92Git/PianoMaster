import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AudioPlayer({
  src,
  className = "",
  autoPlay = false,
  loop = false,
  showVolumeControl = true,
  showSeekBar = true,
  showTimeDisplay = true,
  onPlay,
  onPause,
  onStop,
  onEnded,
  onError,
  onLoadStart,
  onLoadEnd,
  disabled = false,
}) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  // Refs
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const isDragging = useRef(false);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Set initial properties
    audio.loop = loop;
    audio.volume = volume;
    audio.muted = isMuted;

    // Event listeners
    const handleLoadStart = () => {
      setIsLoading(true);
      onLoadStart?.();
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration || 0);
      onLoadEnd?.();
    };

    const handleTimeUpdate = () => {
      if (!isDragging.current) {
        setCurrentTime(audio.currentTime || 0);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleError = (e) => {
      const errorMessage = "Audio playback error occurred";
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      onError?.(e);
      toast.error(errorMessage);
    };

    const handleVolumeChange = () => {
      setVolume(audio.volume);
      setIsMuted(audio.muted);
    };

    // Add event listeners
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("volumechange", handleVolumeChange);

    return () => {
      // Cleanup event listeners
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [
    loop,
    volume,
    isMuted,
    onPlay,
    onPause,
    onEnded,
    onError,
    onLoadStart,
    onLoadEnd,
  ]);

  // Handle src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    audio.src = src;
    audio.load();
    setError(null);
    setCurrentTime(0);
    setDuration(0);

    if (autoPlay && !disabled) {
      audio.play().catch((err) => {
        console.error("Auto-play failed:", err);
      });
    }
  }, [src, autoPlay, disabled]);

  // Play/pause toggle
  const togglePlayPause = useCallback(async () => {
    if (disabled || !audioRef.current) return;

    const audio = audioRef.current;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (err) {
      console.error("Playback error:", err);
      toast.error("Playback failed");
    }
  }, [disabled, isPlaying]);

  // Stop playback
  const stop = useCallback(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    onStop?.();
  }, [onStop]);

  // Seek to specific time
  const seekTo = useCallback(
    (seconds) => {
      if (!audioRef.current) return;

      const audio = audioRef.current;
      const clampedTime = Math.max(0, Math.min(seconds, duration));
      audio.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    },
    [duration]
  );

  // Handle seek bar interaction
  const handleSeekBarClick = useCallback(
    (e) => {
      if (!progressRef.current || !duration) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      seekTo(newTime);
    },
    [duration, seekTo]
  );

  // Handle seek bar drag
  const handleSeekBarMouseDown = useCallback(
    (e) => {
      isDragging.current = true;
      handleSeekBarClick(e);

      const handleMouseMove = (e) => {
        if (isDragging.current) {
          handleSeekBarClick(e);
        }
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleSeekBarClick]
  );

  // Volume control
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  // Skip forward/backward
  const skipForward = useCallback(() => {
    seekTo(currentTime + 10);
  }, [currentTime, seekTo]);

  const skipBackward = useCallback(() => {
    seekTo(currentTime - 10);
  }, [currentTime, seekTo]);

  // Format time display
  const formatTime = useCallback((seconds) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calculate progress percentage
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 ${className}`}
    >
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center gap-4">
        {/* Skip backward */}
        <button
          onClick={skipBackward}
          disabled={disabled || !src}
          className="p-2 text-white hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Play/Pause button */}
        <button
          onClick={togglePlayPause}
          disabled={disabled || !src || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        {/* Stop button */}
        <button
          onClick={stop}
          disabled={disabled || !src}
          className="p-2 text-white hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <Square className="w-5 h-5" />
        </button>

        {/* Skip forward */}
        <button
          onClick={skipForward}
          disabled={disabled || !src}
          className="p-2 text-white hover:text-indigo-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        {/* Volume control */}
        {showVolumeControl && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={toggleMute}
              className="p-1 text-white hover:text-indigo-300 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${
                  (isMuted ? 0 : volume) * 100
                }%, #374151 ${(isMuted ? 0 : volume) * 100}%, #374151 100%)`,
              }}
            />
          </div>
        )}

        {/* Time display */}
        {showTimeDisplay && (
          <div className="text-white text-sm font-mono ml-auto">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        )}
      </div>

      {/* Seek bar */}
      {showSeekBar && (
        <div className="mt-4">
          <div
            ref={progressRef}
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer relative"
            onMouseDown={handleSeekBarMouseDown}
          >
            <div
              className="h-2 bg-indigo-600 rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-lg"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
