import { describe, it, expect, vi } from "vitest";

// Mock skillProgressService's transitive dependencies so importing it (via scoreCalculator.js's
// import of calculateStarsFromPercentage) doesn't try to hit a real Supabase client. Mirrors the
// pattern in src/services/skillProgressService.test.js, with paths adjusted for this file's
// location: src/components/games/sight-reading-game/utils/ -> src/services/ is 4 levels up,
// matching scoreCalculator.js's own import path.
vi.mock("../../../../services/supabase", () => ({
  default: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
  },
}));
vi.mock("../../../../services/authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));
vi.mock("../../../../data/skillTrail", () => ({
  isNodeUnlocked: vi.fn(),
  getUnlockedNodes: vi.fn(),
}));
vi.mock("../../../../services/rateLimitService", () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock("../../../../config/subscriptionConfig", () => ({
  isFreeNode: vi.fn(),
}));
vi.mock("../../../../services/sentryService", () => ({
  Sentry: { captureException: vi.fn() },
}));

// Intentionally NOT mocked: BUG-9's regression test needs getPerformanceRating(score).stars to
// match a REAL call to calculateStarsFromPercentage, exercising actual delegation rather than a
// mocked stand-in.
import { calculateStarsFromPercentage } from "../../../../services/skillProgressService";
import {
  calculatePitchAccuracy,
  calculateRhythmAccuracy,
  calculateOverallScore,
  getPerformanceRating,
  getDetailedBreakdown,
} from "./scoreCalculator";

// Real timing.score values assigned by useTimingAnalysis.js: perfect=1.0, good=0.8, okay=0.5,
// early/late=0.3. "missed" and "wrong_pitch" results carry NO `timing` field at all (the key is
// absent, not null), so `result.timing?.score ?? 0` evaluates to 0 for them — mirrored below by
// simply omitting `timing` for those two helpers.
const perfect = () => ({
  isCorrect: true,
  timingStatus: "perfect",
  timing: { score: 1.0 },
});
const good = () => ({
  isCorrect: true,
  timingStatus: "good",
  timing: { score: 0.8 },
});
const okay = () => ({
  isCorrect: true,
  timingStatus: "okay",
  timing: { score: 0.5 },
});
const early = () => ({
  isCorrect: true,
  timingStatus: "early",
  timing: { score: 0.3 },
});
const late = () => ({
  isCorrect: true,
  timingStatus: "late",
  timing: { score: 0.3 },
});
const missed = () => ({ isCorrect: false, timingStatus: "missed" });
const wrongPitch = () => ({ isCorrect: false, timingStatus: "wrong_pitch" });

describe("calculatePitchAccuracy", () => {
  it("returns 0 for an empty array", () => {
    expect(calculatePitchAccuracy([])).toBe(0);
  });

  it("returns 0 for null/undefined input", () => {
    expect(calculatePitchAccuracy(null)).toBe(0);
    expect(calculatePitchAccuracy(undefined)).toBe(0);
  });

  it("returns 100 when every result is correct", () => {
    const results = [perfect(), good(), okay()];
    expect(calculatePitchAccuracy(results)).toBe(100);
  });

  it("returns the percentage of isCorrect results out of the total", () => {
    // 3 correct out of 4
    const results = [perfect(), good(), okay(), missed()];
    expect(calculatePitchAccuracy(results)).toBe(75);
  });
});

describe("calculateRhythmAccuracy", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateRhythmAccuracy([])).toBe(0);
  });

  it("returns 0 for null/undefined input", () => {
    expect(calculateRhythmAccuracy(null)).toBe(0);
    expect(calculateRhythmAccuracy(undefined)).toBe(0);
  });

  it("returns 100 when every hit is 'perfect'", () => {
    const results = [perfect(), perfect(), perfect(), perfect()];
    expect(calculateRhythmAccuracy(results)).toBe(100);
  });

  it("BUG-8 regression: an all-'okay' run scores 50, not 0", () => {
    const results = [okay(), okay(), okay(), okay()];
    expect(calculateRhythmAccuracy(results)).toBe(50);
  });

  it("BUG-8 regression: all-'okay' run agrees with getDetailedBreakdown (all counted correct)", () => {
    // Historically this was the inconsistency: getDetailedBreakdown counted "okay" hits as
    // fully correct while calculateRhythmAccuracy (pre-fix) only weighted perfect/good, so an
    // "all correct" breakdown could coexist with a 0% rhythm score. Both must now agree.
    const results = [okay(), okay(), okay(), okay()];
    expect(calculateRhythmAccuracy(results)).toBe(50);
    expect(getDetailedBreakdown(results).correct).toBe(results.length);
  });

  it("computes the weighted mean across mixed timing statuses, treating missed as 0", () => {
    // perfect(1.0) + good(0.8) + okay(0.5) + early(0.3) + missed(0, no timing field) = 2.6 / 5
    const results = [perfect(), good(), okay(), early(), missed()];
    expect(calculateRhythmAccuracy(results)).toBeCloseTo(52, 5);
  });

  it("treats late hits the same as early hits (0.3) and wrong-pitch as 0", () => {
    // late(0.3) + wrongPitch(0) = 0.3 / 2 -> 15
    const results = [late(), wrongPitch()];
    expect(calculateRhythmAccuracy(results)).toBe(15);
  });
});

describe("calculateOverallScore", () => {
  it("weights pitch accuracy at 70% and rhythm accuracy at 30%", () => {
    expect(calculateOverallScore(100, 50)).toBe(85);
  });

  it("returns 0 when both inputs are 0", () => {
    expect(calculateOverallScore(0, 0)).toBe(0);
  });

  it("returns 100 when both inputs are 100", () => {
    expect(calculateOverallScore(100, 100)).toBe(100);
  });
});

describe("getPerformanceRating (BUG-9 regression: parity with calculateStarsFromPercentage)", () => {
  it.each([
    [95, 3],
    [94.9, 2],
    [80, 2],
    [79.9, 1],
    [60, 1],
    [59.9, 0],
  ])(
    "score %s -> %s stars, matching calculateStarsFromPercentage's threshold",
    (score, expectedStars) => {
      expect(calculateStarsFromPercentage(score)).toBe(expectedStars);
      expect(getPerformanceRating(score).stars).toBe(expectedStars);
    }
  );

  it("agrees with calculateStarsFromPercentage for every integer score from 0 to 100", () => {
    for (let score = 0; score <= 100; score++) {
      expect(getPerformanceRating(score).stars).toBe(
        calculateStarsFromPercentage(score)
      );
    }
  });
});
