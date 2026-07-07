import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./supabase", () => ({
  default: {
    from: vi.fn(),
  },
}));

vi.mock("./rateLimitService", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("./authorizationUtils", () => ({
  verifyStudentDataAccess: vi.fn(),
}));

import supabase from "./supabase";
import { checkRateLimit } from "./rateLimitService";
import { updateStudentScore } from "./apiScores";

describe("updateStudentScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mirrors supabase.from('students_score').insert([...]).select().single()
  const mockInsertChain = (resolvedValue) => {
    const singleMock = vi.fn().mockResolvedValue(resolvedValue);
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });
    supabase.from.mockReturnValue({ insert: insertMock });
    return { insertMock, selectMock, singleMock };
  };

  // Mirrors supabase.from('students_score').upsert([{...}]).select() — returns an array (never the
  // pgrst.object 406 path a .update()...maybeSingle() PATCH would hit).
  const mockUpsertChain = (resolvedValue) => {
    const selectMock = vi.fn().mockResolvedValue(resolvedValue);
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });
    supabase.from.mockReturnValue({ upsert: upsertMock });
    return { upsertMock, selectMock };
  };

  it("inserts a new row when no existingScoreId is given", async () => {
    const { insertMock } = mockInsertChain({
      data: {
        id: "row-1",
        student_id: "student-1",
        score: 80,
        game_type: "sight_reading",
      },
      error: null,
    });

    const result = await updateStudentScore("student-1", 80, "sight_reading");

    expect(supabase.from).toHaveBeenCalledWith("students_score");
    expect(insertMock).toHaveBeenCalledWith([
      { student_id: "student-1", score: 80, game_type: "sight_reading" },
    ]);
    expect(result).toEqual({
      rateLimited: false,
      newScore: {
        id: "row-1",
        student_id: "student-1",
        score: 80,
        game_type: "sight_reading",
      },
    });
  });

  it("upserts by row id when existingScoreId is given (updates the instance's one row in place)", async () => {
    const { upsertMock } = mockUpsertChain({
      data: [
        {
          id: "row-1",
          student_id: "student-1",
          score: 95,
          game_type: "sight_reading",
        },
      ],
      error: null,
    });

    const result = await updateStudentScore(
      "student-1",
      95,
      "sight_reading",
      null,
      { existingScoreId: "row-1" }
    );

    expect(supabase.from).toHaveBeenCalledWith("students_score");
    // Keyed on the row id so PostgREST's default (primary key) conflict target resolves it.
    // student_id stays in the payload so the insert branch of the upsert passes RLS WITH CHECK.
    expect(upsertMock).toHaveBeenCalledWith([
      {
        id: "row-1",
        student_id: "student-1",
        score: 95,
        game_type: "sight_reading",
      },
    ]);
    expect(result).toEqual({
      rateLimited: false,
      newScore: {
        id: "row-1",
        student_id: "student-1",
        score: 95,
        game_type: "sight_reading",
      },
    });
  });

  it("re-inserts at the same id (no duplicate, no 406) when the row was gone", async () => {
    // When the id no longer exists, PostgREST upsert INSERTs at that id and still returns the row
    // as a 1-element array (HTTP 200) — so there's no 0-row 406 and no second/duplicate row. The
    // mock can't distinguish update-vs-insert (both resolve the affected row), which is the point:
    // the caller path is identical and always succeeds.
    const { upsertMock } = mockUpsertChain({
      data: [
        {
          id: "stale-row",
          student_id: "student-1",
          score: 95,
          game_type: "sight_reading",
        },
      ],
      error: null,
    });

    const result = await updateStudentScore(
      "student-1",
      95,
      "sight_reading",
      null,
      { existingScoreId: "stale-row" }
    );

    expect(upsertMock).toHaveBeenCalledWith([
      {
        id: "stale-row",
        student_id: "student-1",
        score: 95,
        game_type: "sight_reading",
      },
    ]);
    expect(result.newScore).toEqual({
      id: "stale-row",
      student_id: "student-1",
      score: 95,
      game_type: "sight_reading",
    });
  });

  it("inserts (does not update) when existingScoreId is falsy", async () => {
    const { insertMock } = mockInsertChain({
      data: { id: "row-2", student_id: "student-1", score: 70 },
      error: null,
    });

    await updateStudentScore("student-1", 70, "sight_reading", null, {});

    expect(insertMock).toHaveBeenCalled();
  });

  it("checks the rate limit when nodeId is provided and short-circuits if not allowed", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, resetTime: 12345 });

    const result = await updateStudentScore(
      "student-1",
      80,
      "sight_reading",
      "node-1"
    );

    expect(checkRateLimit).toHaveBeenCalledWith("student-1", "node-1");
    expect(supabase.from).not.toHaveBeenCalled();
    expect(result).toEqual({
      rateLimited: true,
      resetTime: 12345,
      newScore: null,
    });
  });

  it("skips the rate limit check when nodeId is omitted", async () => {
    const { insertMock } = mockInsertChain({
      data: { id: "row-3", student_id: "student-1", score: 80 },
      error: null,
    });

    await updateStudentScore("student-1", 80, "sight_reading");

    expect(checkRateLimit).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalled();
  });

  it("throws when the underlying query returns an error", async () => {
    mockInsertChain({ data: null, error: new Error("db unavailable") });

    await expect(
      updateStudentScore("student-1", 80, "sight_reading")
    ).rejects.toThrow("Failed to update score");
  });
});
