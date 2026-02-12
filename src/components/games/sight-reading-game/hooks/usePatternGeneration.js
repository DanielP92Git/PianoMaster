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
      measuresPerPattern = 1,
      rhythmSettings,
      rhythmComplexity = "simple"
    ) =>
      generatePatternData({
        difficulty,
        timeSignature,
        tempo,
        selectedNotes,
        clef,
        measuresPerPattern,
        rhythmSettings,
        rhythmComplexity,
      }),
    []
  );

  return { generatePattern };
}

export { generatePatternData };
