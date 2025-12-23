export const MIC_INPUT_PRESETS = {
  // Sight reading prioritizes precision + timing; keep tolerances tighter.
  sightReading: {
    // Laptop mics + acoustic pianos often decay under 0.015 quickly, causing missed notes.
    // 0.010 keeps detection alive for soft/decaying notes without being overly noise-sensitive.
    rmsThreshold: 0.01,
    tolerance: 0.02,
    // Lower stability requirement to reduce perceived latency in performance mode.
    onFrames: 4,
    changeFrames: 5,
    offMs: 140,
    minInterOnMs: 80,
  },

  // Notes recognition can be slightly more forgiving (especially for soft playing).
  notesRecognition: {
    rmsThreshold: 0.012,
    tolerance: 0.03,
    onFrames: 4,
    changeFrames: 5,
    offMs: 160,
    minInterOnMs: 90,
  },
};


