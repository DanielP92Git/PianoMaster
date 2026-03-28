import React from "react";
import { Volume2 } from "lucide-react";

/**
 * Metronome visual display component
 * Shows the current beat and time signature visually - Compact horizontal layout
 *
 * For compound time (6/8): renders `subdivisions` circles (6) with beats 1 and 4 accented.
 * For simple time (4/4, 3/4, 2/4): renders `beats` circles with beat 1 accented.
 */
export function MetronomeDisplay({
  currentBeat = 1,
  timeSignature = { beats: 4, name: "4/4" },
  isActive = false,
  isCountIn = false,
}) {
  if (!isActive) return null;

  // For compound time (6/8), use subdivisions count for display (6 circles, not 2).
  // For simple time, display one circle per beat.
  const displayCount = timeSignature.subdivisions ?? timeSignature.beats;

  // Build a Set of 1-indexed accented positions from strongBeats (0-indexed).
  // For 6/8: strongBeats=[0,3] → accented positions {1, 4}
  // For 4/4: strongBeats=[0] → accented position {1}
  const accentedPositions = new Set(
    (timeSignature.strongBeats ?? [0]).map((pos) => pos + 1)
  );

  return (
    <div className="flex justify-center gap-2" dir="ltr">
      {Array.from({ length: displayCount }, (_, i) => i + 1).map((beat) => {
        const isAccented = accentedPositions.has(beat);
        const isCurrentBeat = beat === currentBeat;

        return (
          <div
            key={beat}
            className={`flex items-center justify-center rounded-full border-2 font-bold transition-all duration-150
              h-9 w-9 text-xs sm:h-10 sm:w-10 sm:text-sm
            ${
              isCurrentBeat
                ? isCountIn
                  ? "scale-150 border-yellow-500 bg-yellow-500 text-black shadow-xl"
                  : "scale-150 border-blue-500 bg-blue-500 text-white shadow-lg"
                : isAccented
                  ? "border-white/50 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/60"
            }`}
          >
            {beat}
          </div>
        );
      })}
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
