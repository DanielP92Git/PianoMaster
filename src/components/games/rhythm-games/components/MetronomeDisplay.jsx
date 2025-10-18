import React from "react";
import { Volume2 } from "lucide-react";

/**
 * Metronome visual display component
 * Shows the current beat and time signature visually - Compact horizontal layout
 */
export function MetronomeDisplay({
  currentBeat = 1,
  timeSignature = { beats: 4, name: "4/4" },
  isActive = false,
  isCountIn = false,
}) {
  if (!isActive) return null;

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: timeSignature.beats }, (_, i) => i + 1).map(
        (beat) => (
          <div
            key={beat}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-150 ${
              beat === currentBeat
                ? isCountIn
                  ? "bg-yellow-500 text-black border-yellow-500 scale-125 shadow-xl animate-pulse"
                  : "bg-blue-500 text-white border-blue-500 scale-110 shadow-lg"
                : "bg-white/10 border-white/30 text-white/80"
            }`}
          >
            {beat}
          </div>
        )
      )}
    </div>
  );
}

/**
 * Floating metronome indicator (fixed position)
 * Shows metronome status in bottom-right corner
 */
export function MetronomeIndicator({
  isActive = false,
  isFlashing = false,
  className = "fixed bottom-6 right-6",
}) {
  return (
    <div className={className}>
      <div
        className={`
        w-16 h-16 rounded-full border-4 border-white/30 
        flex items-center justify-center text-white font-bold
        transition-all duration-100
        ${isFlashing ? "bg-yellow-400 scale-110" : "bg-white/10"}
        ${isActive ? "animate-pulse" : ""}
      `}
      >
        <Volume2 className="w-6 h-6" />
      </div>
    </div>
  );
}

export default MetronomeDisplay;
