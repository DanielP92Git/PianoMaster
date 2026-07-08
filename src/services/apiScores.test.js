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

  // Mirrors supabase.from('students_score').update({...}).eq('id',...).eq('student_id',...).select()
  // Terminates in a plain array .select() (NOT .single()/.maybeSingle()): on a PATCH those send the
  // pgrst.object Accept header, so a 0-row match returns a raw HTTP 406; an array .select() returns
  // HTTP 200 with [] instead, which is what lets a vanished row fall back to an insert with no noise.
  const mockUpdateChain = (resolvedValue) => {
    const selectMock = vi.fn().mockResolvedValue(resolvedValue);
    const eq2Mock = vi.fn().mockReturnValue({ select: selectMock });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const updateMock = vi.fn().mockReturnValue({ eq: eq1Mock });
    supabase.from.mockReturnValue({ update: updateMock });
    return { updateMock, eq1Mock, eq2Mock, selectMock };
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

  it("updates the existing row's score in place when existingScoreId is given, scoped to the student", async () => {
    const { updateMock, eq1Mock, eq2Mock } = mockUpdateChain({
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
    expect(updateMock).toHaveBeenCalledWith({ score: 95 });
    expect(eq1Mock).toHaveBeenCalledWith("id", "row-1");
    expect(eq2Mock).toHaveBeenCalledWith("student_id", "student-1");
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

  it("falls back to insert when the existing row is gone (update returns [])", async () => {
    // Array .select() resolves [] for a 0-row match (HTTP 200, not a 406), which is what lets us
    // fall back to an insert rather than losing the score. In production the update only matches a
    // present row thanks to the students_score UPDATE RLS policy (migration 20260707120000).
    const updSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    const updEq2 = vi.fn().mockReturnValue({ select: updSelect });
    const updEq1 = vi.fn().mockReturnValue({ eq: updEq2 });
    const updateMock = vi.fn().mockReturnValue({ eq: updEq1 });

    const insSingle = vi.fn().mockResolvedValue({
      data: { id: "row-new", student_id: "student-1", score: 95 },
      error: null,
    });
    const insSelect = vi.fn().mockReturnValue({ single: insSingle });
    const insertMock = vi.fn().mockReturnValue({ select: insSelect });

    supabase.from
      .mockReturnValueOnce({ update: updateMock })
      .mockReturnValueOnce({ insert: insertMock });

    const result = await updateStudentScore(
      "student-1",
      95,
      "sight_reading",
      null,
      { existingScoreId: "stale-row" }
    );

    expect(updateMock).toHaveBeenCalledWith({ score: 95 });
    expect(updEq1).toHaveBeenCalledWith("id", "stale-row");
    expect(updEq2).toHaveBeenCalledWith("student_id", "student-1");
    expect(insertMock).toHaveBeenCalledWith([
      { student_id: "student-1", score: 95, game_type: "sight_reading" },
    ]);
    expect(result).toEqual({
      rateLimited: false,
      newScore: { id: "row-new", student_id: "student-1", score: 95 },
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
