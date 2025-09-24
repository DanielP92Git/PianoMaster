import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Loader2,
  X,
  Volume2,
  Settings,
} from "lucide-react";
import AudioCompressionService, {
  AUDIO_QUALITY_PRESETS,
} from "../../services/audioCompressionService";
import toast from "react-hot-toast";

export default function AudioRecorder({
  onRecordingComplete,
  onRecordingCancel,
  maxDuration = 300, // 5 minutes default
  showVisualization = true,
  visualizationHeight = 100,
  className = "",
  disabled = false,
  showQualitySettings = true,
  defaultQuality = "MEDIUM",
  useCase = "practice",
}) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qualityPreset, setQualityPreset] = useState(defaultQuality);
  const [estimatedFileSize, setEstimatedFileSize] = useState(null);
  const [recordingConfig, setRecordingConfig] = useState(null);

  // Refs for audio components
  const mediaRecorder = useRef(null);
  const audioStream = useRef(null);
  const chunks = useRef([]);
  const durationTimer = useRef(null);
  const isCancelling = useRef(false);
  const actualDuration = useRef(0); // Track actual duration for callbacks

  // Audio visualization refs
  const audioContext = useRef(null);
  const analyser = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const dataArray = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop recording if active
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }

    // Stop audio stream
    if (audioStream.current) {
      audioStream.current.getTracks().forEach((track) => track.stop());
      audioStream.current = null;
    }

    // Clear timers
    if (durationTimer.current) {
      clearInterval(durationTimer.current);
      durationTimer.current = null;
    }

    // Stop visualization
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Close audio context
    if (audioContext.current && audioContext.current.state !== "closed") {
      audioContext.current.close();
      audioContext.current = null;
    }

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    actualDuration.current = 0;
    chunks.current = [];
  }, []);

  // Setup audio visualization
  const setupVisualization = useCallback(
    (stream) => {
      if (!showVisualization || !canvasRef.current) return;

      try {
        audioContext.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        const source = audioContext.current.createMediaStreamSource(stream);

        analyser.current = audioContext.current.createAnalyser();
        analyser.current.fftSize = 256;

        const bufferLength = analyser.current.frequencyBinCount;
        dataArray.current = new Uint8Array(bufferLength);

        source.connect(analyser.current);

        drawVisualization();
      } catch (error) {
        console.warn("Audio visualization setup failed:", error);
      }
    },
    [showVisualization]
  );

  // Draw audio visualization
  const drawVisualization = useCallback(() => {
    if (!analyser.current || !canvasRef.current || !dataArray.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = canvas;

    animationRef.current = requestAnimationFrame(drawVisualization);

    analyser.current.getByteFrequencyData(dataArray.current);

    // Clear canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);

    // Draw frequency bars
    const barWidth = (width / dataArray.current.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.current.length; i++) {
      barHeight = (dataArray.current[i] / 128) * (height / 2);

      const gradient = ctx.createLinearGradient(
        0,
        height - barHeight,
        0,
        height
      );
      gradient.addColorStop(0, "#3B82F6");
      gradient.addColorStop(1, "#1D4ED8");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }, []);

  // Initialize recording configuration
  useEffect(() => {
    const config = AudioCompressionService.getOptimizedConfig(useCase);
    setRecordingConfig(config);
    setQualityPreset(config.qualityPreset || config.quality || "MEDIUM");
  }, [useCase]);

  // Update file size estimation when duration or quality changes
  useEffect(() => {
    if (recordingDuration > 0) {
      const safeQualityPreset = qualityPreset || defaultQuality || "MEDIUM";
      const sizeEstimate = AudioCompressionService.estimateFileSize(
        recordingDuration,
        safeQualityPreset
      );
      setEstimatedFileSize(sizeEstimate);
    }
  }, [recordingDuration, qualityPreset, defaultQuality]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      setIsProcessing(true);

      // Check browser support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser");
      }

      // Get optimized recording options with fallback validation
      const safeQualityPreset = qualityPreset || defaultQuality || "MEDIUM";
      const config =
        AudioCompressionService.getRecordingOptions(safeQualityPreset);

      // Request microphone access with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia(config.options);

      audioStream.current = stream;

      // Setup MediaRecorder with optimized settings
      const options = {
        mimeType: config.mimeType,
        audioBitsPerSecond: config.audioBitsPerSecond,
      };

      // Fallback for unsupported codecs
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        const fallbackFormat = AudioCompressionService.getBestSupportedFormat();
        options.mimeType = fallbackFormat.mimeType;
      }

      mediaRecorder.current = new MediaRecorder(stream, options);
      chunks.current = [];
      isCancelling.current = false;

      // Setup event handlers
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0 && !isCancelling.current) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        if (!isCancelling.current && chunks.current.length > 0) {
          const blob = new Blob(chunks.current, { type: "audio/webm" });
          setRecordingBlob(blob);
          onRecordingComplete?.(blob, actualDuration.current);
        }
        cleanup();
      };

      mediaRecorder.current.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        toast.error("Recording error occurred");
        cleanup();
      };

      // Setup visualization
      setupVisualization(stream);

      // Start recording
      mediaRecorder.current.start(100);
      setIsRecording(true);
      setIsProcessing(false);

      // Start duration timer
      durationTimer.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          actualDuration.current = newDuration; // Keep ref in sync
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsProcessing(false);

      // Handle specific error types
      if (error.name === "NotAllowedError") {
        toast.error(
          "Microphone access denied. Please allow microphone access and try again."
        );
      } else if (error.name === "NotFoundError") {
        toast.error("No microphone found. Please check your device settings.");
      } else if (error.name === "NotSupportedError") {
        toast.error("Audio recording is not supported on this device.");
      } else {
        toast.error(error.message || "Failed to start recording");
      }

      cleanup();
    }
  }, [
    disabled,
    maxDuration,
    onRecordingComplete,
    recordingDuration,
    setupVisualization,
  ]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.pause();
      setIsPaused(true);

      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }

      toast.success("Recording paused");
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "paused") {
      mediaRecorder.current.resume();
      setIsPaused(false);

      // Restart duration timer
      durationTimer.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          actualDuration.current = newDuration; // Keep ref in sync
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newDuration;
        });
      }, 1000);

      toast.success("Recording resumed");
    }
  }, [maxDuration]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (
      mediaRecorder.current &&
      (mediaRecorder.current.state === "recording" ||
        mediaRecorder.current.state === "paused")
    ) {
      mediaRecorder.current.stop();
      toast.success("Recording stopped");
    }
  }, []);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    isCancelling.current = true;
    cleanup();
    setRecordingBlob(null);
    onRecordingCancel?.();
    toast.success("Recording cancelled");
  }, [onRecordingCancel]);

  // Format duration
  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div
      className={`bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 ${className}`}
    >
      {/* Recording Timer Display */}
      {(isRecording || isPaused) && (
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-black/30 rounded-2xl border border-white/20">
            <div
              className={`w-4 h-4 rounded-full ${
                isRecording && !isPaused
                  ? "bg-red-500 animate-pulse"
                  : isPaused
                    ? "bg-yellow-500"
                    : "bg-gray-500"
              }`}
            />
            <div className="text-white text-2xl font-mono font-bold tracking-wider">
              {formatDuration(recordingDuration)}
            </div>
            <div className="text-white/60 text-sm">
              / {formatDuration(maxDuration)}
            </div>
          </div>
        </div>
      )}

      {/* Audio Visualization */}
      {showVisualization && (
        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={visualizationHeight}
            className="w-full rounded-lg bg-black/20"
          />
        </div>
      )}

      {/* Recording Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isRecording && !isPaused && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-sm font-medium">
                Recording
              </span>
            </div>
          )}
          {isPaused && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-yellow-400 text-sm font-medium">
                Paused
              </span>
            </div>
          )}
          {!isRecording && !isPaused && recordingBlob && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-400 text-sm font-medium">
                Recorded
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Quality Settings Button */}
          {showQualitySettings && !isRecording && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Audio Quality Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          <div className="text-white text-sm font-mono">
            {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
          </div>
        </div>
      </div>

      {/* Quality Settings Panel */}
      {showSettings && showQualitySettings && !isRecording && (
        <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="flex items-center gap-4 mb-3">
            <h4 className="text-white text-sm font-semibold">Audio Quality</h4>
            {estimatedFileSize && (
              <span className="text-white/70 text-xs">
                Est. Size: {estimatedFileSize.humanReadable}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {Object.entries(AUDIO_QUALITY_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setQualityPreset(key)}
                className={`p-2 rounded-lg text-left transition-colors ${
                  qualityPreset === key
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="text-sm font-medium">{preset.label}</div>
                <div className="text-xs opacity-70">
                  {preset.fileSize} files
                </div>
              </button>
            ))}
          </div>

          {recordingConfig && (
            <div className="mt-3 text-xs text-white/50">
              Format: {recordingConfig.description}
            </div>
          )}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex flex-wrap gap-2">
        {!isRecording && !recordingBlob && (
          <button
            onClick={startRecording}
            disabled={disabled || isProcessing}
            className="flex-1 min-w-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Starting...</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Start Recording</span>
              </>
            )}
          </button>
        )}

        {isRecording && !isPaused && (
          <>
            <button
              onClick={pauseRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Pause</span>
            </button>
            <button
              onClick={stopRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Square className="w-4 h-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>
            <button
              onClick={cancelRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={resumeRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Resume</span>
            </button>
            <button
              onClick={stopRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Square className="w-4 h-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>
            <button
              onClick={cancelRecording}
              className="flex-1 min-w-0 px-2 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {isRecording && (
        <div className="mt-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(recordingDuration / maxDuration) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
