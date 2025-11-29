import { useCallback } from "react";
import { generatePatternData } from "../utils/patternBuilder";

export function usePatternGeneration() {
  const generatePattern = useCallback(
    (
      difficulty,
      timeSignature,
      tempo = 80,
      selectedNotes = [],
      clef = "Treble",
      measuresPerPattern = 1
    ) =>
      generatePatternData({
        difficulty,
        timeSignature,
        tempo,
        selectedNotes,
        clef,
        measuresPerPattern,
      }),
    []
  );

  return { generatePattern };
}

export { generatePatternData };
