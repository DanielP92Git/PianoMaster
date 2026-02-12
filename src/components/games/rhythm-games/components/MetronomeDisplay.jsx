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
    <div className="flex justify-center gap-2" dir="ltr">
      {Array.from({ length: timeSignature.beats }, (_, i) => i + 1).map(
        (beat) => (
          <div
            key={beat}
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-150 sm:h-14 sm:w-14 sm:text-lg ${
              beat === currentBeat
                ? isCountIn
                  ? "scale-125 animate-pulse border-yellow-500 bg-yellow-500 text-black shadow-xl"
                  : "scale-110 border-blue-500 bg-blue-500 text-white shadow-lg"
                : "border-white/30 bg-white/10 text-white/80"
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
        className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/30 font-bold text-white transition-all duration-100 ${isFlashing ? "scale-110 bg-yellow-400" : "bg-white/10"} ${isActive ? "animate-pulse" : ""} `}
      >
        <Volume2 className="h-6 w-6" />
      </div>
    </div>
  );
}

export default MetronomeDisplay;
