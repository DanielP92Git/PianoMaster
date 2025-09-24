import React from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import Button from "../../../ui/Button";

/**
 * Game control buttons component
 * Provides play/pause, reset, and settings controls
 */
export function GameControls({
  isPlaying = false,
  onPlay,
  onPause,
  onReset,
  onSettings,
  showSettings = true,
  showReset = true,
  isAudioReady = true,
  className = "",
}) {
  return (
    <div className={`flex gap-3 justify-center items-center ${className}`}>
      {/* Play/Pause Button */}
      <Button
        onClick={isPlaying ? onPause : onPlay}
        variant={isPlaying ? "secondary" : "primary"}
        size="large"
        icon={isPlaying ? Pause : Play}
        disabled={!isAudioReady}
      >
        {isPlaying ? "Pause" : "Play"}
      </Button>

      {/* Reset Button */}
      {showReset && (
        <Button
          onClick={onReset}
          variant="secondary"
          size="large"
          icon={RotateCcw}
        >
          Reset
        </Button>
      )}

      {/* Settings Button */}
      {showSettings && (
        <Button
          onClick={onSettings}
          variant="secondary"
          size="large"
          icon={Settings}
        >
          Settings
        </Button>
      )}
    </div>
  );
}

/**
 * Floating settings button (absolute positioned)
 * For minimal UI with just a settings icon
 */
export function FloatingSettingsButton({
  onClick,
  className = "absolute top-2 right-2",
}) {
  return (
    <div className={className}>
      <button
        onClick={onClick}
        className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200 group backdrop-blur-md border border-white/20"
        title="Game Settings"
      >
        <Settings className="w-5 h-5 text-white group-hover:text-amber-100 transition-colors duration-200" />
      </button>
    </div>
  );
}

export default GameControls;
