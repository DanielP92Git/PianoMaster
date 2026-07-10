// Grading modes for the sight-reading game (Phase 02 — PRAC-03).
// Test mode is the default and the only scored path (D-01/D-03).
// Practice mode widens timing tolerances AND grades pitch-only (D-04).
export const GRADING_MODES = { PRACTICE: "practice", TEST: "test" };

// localStorage key — mirrors the existing "sightReadingInputMode" preference pattern (D-03).
export const GRADING_MODE_STORAGE_KEY = "sightReadingGradingMode";

// Practice-mode leniency. Must scale BOTH the base constants AND the duration-fraction clamps,
// because at fast tempos the clamp binds before the constant (RESEARCH.md Pitfall 5).
// ~2x is the starting hypothesis (Claude's discretion per CONTEXT.md); clamp fractions stay < 1.0
// to avoid full window overlap / neighbor misattribution.
export const PRACTICE_TIMING = {
  toleranceMultiplier: 2, // NOTE_EARLY 200->400, NOTE_LATE 300->600, FIRST_EARLY 500->1000
  lateClampFraction: 0.85, // vs 0.6 in Test (buildTimingWindows scaledLate)
  earlyClampFraction: 0.75, // vs 0.5 in Test (buildTimingWindows earlyAllowance)
  statusMultiplier: 2, // TIMING_STATUS_MAP thresholds 100/200/300 -> 200/400/600
};
