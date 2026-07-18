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
      rhythmComplexity = "simple",
      keySignature = null,
      noteWeights = null
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
        keySignature,
        noteWeights,
      }),
    []
  );

  return { generatePattern };
}

export { generatePatternData };
