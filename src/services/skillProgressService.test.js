import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase and its dependencies before importing service
vi.mock("./supabase", () => ({
  default: {
    auth: { getUser: vi.fn() },
    from: vi.fn(() => ({ select: vi.fn(), insert: vi.fn(), update: vi.fn() })),
  },
}));
vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));
vi.mock("../data/skillTrail", () => ({
  isNodeUnlocked: vi.fn(),
  getUnlockedNodes: vi.fn(),
}));
vi.mock("./rateLimitService", () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock("../config/subscriptionConfig", () => ({
  isFreeNode: vi.fn(),
}));
vi.mock("./sentryService", () => ({
  Sentry: { captureException: vi.fn() },
}));

import {
  calculateStarsFromPercentage,
  updateNodeProgress,
  updateExerciseProgress,
  mergeNoteMasteryOnly,
} from "./skillProgressService";
import supabase from "./supabase";
import { checkRateLimit } from "./rateLimitService";

describe("calculateStarsFromPercentage", () => {
  it("returns 3 stars for 100%", () => {
    expect(calculateStarsFromPercentage(100)).toBe(3);
  });

  it("returns 3 stars for exactly 95%", () => {
    expect(calculateStarsFromPercentage(95)).toBe(3);
  });

  it("returns 2 stars for 94% (just below 3-star threshold)", () => {
    expect(calculateStarsFromPercentage(94)).toBe(2);
  });

  it("returns 2 stars for exactly 80%", () => {
    expect(calculateStarsFromPercentage(80)).toBe(2);
  });

  it("returns 1 star for 79% (just below 2-star threshold)", () => {
    expect(calculateStarsFromPercentage(79)).toBe(1);
  });

  it("returns 1 star for exactly 60%", () => {
    expect(calculateStarsFromPercentage(60)).toBe(1);
  });

  it("returns 0 stars for 59% (just below 1-star threshold)", () => {
    expect(calculateStarsFromPercentage(59)).toBe(0);
  });

  it("returns 0 stars for 0%", () => {
    expect(calculateStarsFromPercentage(0)).toBe(0);
  });
});

// ============================================
// note_mastery merge-on-upsert (Phase 03 ADAPT-03/D-10)
// ============================================

/**
 * Wires supabase.from() to satisfy both call shapes used by
 * updateNodeProgress/updateExerciseProgress:
 *   read:  .select('*').eq(...).eq(...).maybeSingle()
 *   write: .upsert(progressData, opts).select().maybeSingle()
 * Returns the upsert spy so tests can assert on the progressData passed in.
 */
function mockSupabaseFrom({ existingRow = null, writtenRow = {} } = {}) {
  const upsertSpy = vi.fn(() => ({
    select: vi.fn(() => ({
      maybeSingle: vi.fn().mockResolvedValue({ data: writtenRow, error: null }),
    })),
  }));

  supabase.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: existingRow, error: null }),
        })),
      })),
    })),
    upsert: upsertSpy,
  });

  return upsertSpy;
}

describe("note_mastery merge (updateExerciseProgress)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it("merges a delta into existing note_mastery via pure per-pitch addition", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercise_progress: [],
        note_mastery: { C4: { correct: 5, total: 6 } },
      },
    });

    await updateExerciseProgress(
      "student-1",
      "node-1",
      0,
      "sight_reading",
      2,
      85,
      1,
      {},
      { C4: { correct: 2, total: 3 } }
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 7, total: 9 });
  });

  it("inserts a new pitch as-is and preserves stored pitches absent from the delta", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercise_progress: [],
        note_mastery: { C4: { correct: 5, total: 6 } },
      },
    });

    await updateExerciseProgress(
      "student-1",
      "node-1",
      0,
      "sight_reading",
      2,
      85,
      1,
      {},
      { D4: { correct: 1, total: 1 } }
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.D4).toEqual({ correct: 1, total: 1 });
    expect(progressData.note_mastery.C4).toEqual({ correct: 5, total: 6 });
  });

  it("omits note_mastery from progressData entirely when the param is not supplied", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercise_progress: [],
        note_mastery: { C4: { correct: 5, total: 6 } },
      },
    });

    await updateExerciseProgress(
      "student-1",
      "node-1",
      0,
      "sight_reading",
      2,
      85,
      1
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData).not.toHaveProperty("note_mastery");
  });

  it("skips malformed delta entries (negative, non-integer, correct > total) but merges the rest", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercise_progress: [],
        note_mastery: {},
      },
    });

    await updateExerciseProgress(
      "student-1",
      "node-1",
      0,
      "sight_reading",
      2,
      85,
      1,
      {},
      {
        C4: { correct: 1, total: 2 }, // valid
        D4: { correct: -1, total: 2 }, // negative -> skipped
        E4: { correct: 1.5, total: 2 }, // non-integer -> skipped
        F4: { correct: 3, total: 2 }, // correct > total -> skipped
      }
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 1, total: 2 });
    expect(progressData.note_mastery).not.toHaveProperty("D4");
    expect(progressData.note_mastery).not.toHaveProperty("E4");
    expect(progressData.note_mastery).not.toHaveProperty("F4");
  });
});

describe("note_mastery merge (updateNodeProgress)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  it("merges a delta into existing note_mastery via pure per-pitch addition", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercises_completed: 1,
        stars: 1,
        best_score: 50,
        note_mastery: { C4: { correct: 5, total: 6 } },
      },
    });

    await updateNodeProgress(
      "student-1",
      "node-1",
      2,
      85,
      {},
      { C4: { correct: 2, total: 3 } }
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 7, total: 9 });
  });

  it("omits note_mastery from progressData entirely when the param is not supplied", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercises_completed: 1,
        stars: 1,
        best_score: 50,
        note_mastery: { C4: { correct: 5, total: 6 } },
      },
    });

    await updateNodeProgress("student-1", "node-1", 2, 85);

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData).not.toHaveProperty("note_mastery");
  });

  it("skips malformed delta entries but merges the rest", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        exercises_completed: 1,
        stars: 1,
        best_score: 50,
        note_mastery: {},
      },
    });

    await updateNodeProgress(
      "student-1",
      "node-1",
      2,
      85,
      {},
      {
        C4: { correct: 1, total: 2 }, // valid
        D4: { correct: -1, total: 2 }, // negative -> skipped
      }
    );

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 1, total: 2 });
    expect(progressData.note_mastery).not.toHaveProperty("D4");
  });
});

// ============================================
// WR-01 (03-REVIEW.md): mergeNoteMasteryOnly — a lighter-weight persistence path for
// non-victory ("encouragement") sessions, independent of the stars/XP rate-limit gate.
// ============================================
describe("mergeNoteMasteryOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges a delta into existing note_mastery via pure per-pitch addition", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: { note_mastery: { C4: { correct: 5, total: 6 } } },
    });

    await mergeNoteMasteryOnly("student-1", "node-1", {
      C4: { correct: 2, total: 3 },
      D4: { correct: 0, total: 1 },
    });

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 7, total: 9 });
    expect(progressData.note_mastery.D4).toEqual({ correct: 0, total: 1 });
  });

  it("does NOT include stars/best_score/exercises_completed in the upsert payload (WR-01: no graded-outcome fields)", async () => {
    const upsertSpy = mockSupabaseFrom({
      existingRow: {
        stars: 2,
        best_score: 90,
        exercises_completed: 4,
        note_mastery: {},
      },
    });

    await mergeNoteMasteryOnly("student-1", "node-1", {
      C4: { correct: 1, total: 1 },
    });

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData).not.toHaveProperty("stars");
    expect(progressData).not.toHaveProperty("best_score");
    expect(progressData).not.toHaveProperty("exercises_completed");
  });

  it("does NOT call checkRateLimit (WR-01: telemetry, not a graded/anti-farming-gated write)", async () => {
    mockSupabaseFrom({ existingRow: { note_mastery: {} } });

    await mergeNoteMasteryOnly("student-1", "node-1", {
      C4: { correct: 1, total: 1 },
    });

    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("skips malformed delta entries but merges the rest", async () => {
    const upsertSpy = mockSupabaseFrom({ existingRow: { note_mastery: {} } });

    await mergeNoteMasteryOnly("student-1", "node-1", {
      C4: { correct: 1, total: 2 }, // valid
      D4: { correct: -1, total: 2 }, // negative -> skipped
      E4: { correct: 3, total: 2 }, // correct > total -> skipped
    });

    const progressData = upsertSpy.mock.calls[0][0];
    expect(progressData.note_mastery.C4).toEqual({ correct: 1, total: 2 });
    expect(progressData.note_mastery).not.toHaveProperty("D4");
    expect(progressData.note_mastery).not.toHaveProperty("E4");
  });

  it("returns null and never calls supabase for an empty perNoteMastery", async () => {
    const upsertSpy = mockSupabaseFrom({ existingRow: { note_mastery: {} } });

    const result = await mergeNoteMasteryOnly("student-1", "node-1", {});

    expect(result).toBeNull();
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("returns null and never calls supabase for a null/undefined perNoteMastery", async () => {
    const upsertSpy = mockSupabaseFrom({ existingRow: { note_mastery: {} } });

    expect(await mergeNoteMasteryOnly("student-1", "node-1", null)).toBeNull();
    expect(
      await mergeNoteMasteryOnly("student-1", "node-1", undefined)
    ).toBeNull();
    expect(upsertSpy).not.toHaveBeenCalled();
  });
});
