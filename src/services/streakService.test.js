import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase default export
vi.mock("./supabase", () => ({
  default: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import supabase from "./supabase";
import { streakService, resetStreakServiceCaches } from "./streakService";

describe("streakService childId row-targeting (PROFILE-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStreakServiceCaches();
  });

  // The session always resolves the PARENT's authenticated uid — this is the
  // RLS principal and must NOT be used as the row target.
  const mockAuthSession = (sessionUserId = "parentUid") => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: sessionUserId } } },
    });
  };

  // Chain for supabase.from().select().eq().maybeSingle()
  const mockSelectEqMaybeSingleChain = (resolvedValue) => {
    const maybeSingleMock = vi.fn().mockResolvedValue(resolvedValue);
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    return { select: selectMock, eqMock, maybeSingleMock };
  };

  describe("getStreak(childId)", () => {
    it("targets student_id = childId, NOT the session (parent) uid", async () => {
      mockAuthSession("parentUid");
      const chain = mockSelectEqMaybeSingleChain({
        data: { streak_count: 7 },
        error: null,
      });
      supabase.from.mockImplementation((table) => {
        if (table === "current_streak") return chain;
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await streakService.getStreak("childB");

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(chain.eqMock).toHaveBeenCalledWith("student_id", "childB");
      expect(chain.eqMock).not.toHaveBeenCalledWith("student_id", "parentUid");
      expect(result).toBe(7);
    });

    it("legacy-compat: childId === session uid behaves identically (existing accounts unaffected)", async () => {
      mockAuthSession("legacyUser1");
      const chain = mockSelectEqMaybeSingleChain({
        data: { streak_count: 3 },
        error: null,
      });
      supabase.from.mockImplementation(() => chain);

      const result = await streakService.getStreak("legacyUser1");

      expect(chain.eqMock).toHaveBeenCalledWith("student_id", "legacyUser1");
      expect(result).toBe(3);
    });
  });

  describe("getStreakState(childId)", () => {
    it("targets student_id = childId for both current_streak and last_practiced_date reads, while getSession() still proves identity", async () => {
      mockAuthSession("parentUid");

      const streakChain = mockSelectEqMaybeSingleChain({
        data: {
          streak_count: 5,
          streak_freezes: 1,
          weekend_pass_enabled: false,
          last_freeze_consumed_at: null,
          comeback_bonus_start: null,
          comeback_bonus_expires: null,
        },
        error: null,
      });
      const practiceChain = mockSelectEqMaybeSingleChain({
        data: { practiced_at: null },
        error: null,
      });

      supabase.from.mockImplementation((table) => {
        if (table === "current_streak") return streakChain;
        if (table === "last_practiced_date") return practiceChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await streakService.getStreakState("childB");

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(streakChain.eqMock).toHaveBeenCalledWith("student_id", "childB");
      expect(practiceChain.eqMock).toHaveBeenCalledWith("student_id", "childB");
      expect(streakChain.eqMock).not.toHaveBeenCalledWith(
        "student_id",
        "parentUid"
      );
      expect(result.streakCount).toBe(5);
      expect(result.freezeCount).toBe(1);
    });

    it("legacy-compat: childId === session uid returns the same shape as before", async () => {
      mockAuthSession("legacyUser1");

      const streakChain = mockSelectEqMaybeSingleChain({
        data: {
          streak_count: 2,
          streak_freezes: 0,
          weekend_pass_enabled: true,
          last_freeze_consumed_at: null,
          comeback_bonus_start: null,
          comeback_bonus_expires: null,
        },
        error: null,
      });
      const practiceChain = mockSelectEqMaybeSingleChain({
        data: { practiced_at: null },
        error: null,
      });
      supabase.from.mockImplementation((table) => {
        if (table === "current_streak") return streakChain;
        if (table === "last_practiced_date") return practiceChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      const result = await streakService.getStreakState("legacyUser1");

      expect(streakChain.eqMock).toHaveBeenCalledWith(
        "student_id",
        "legacyUser1"
      );
      expect(result.streakCount).toBe(2);
      expect(result.weekendPassEnabled).toBe(true);
    });
  });

  describe("getLastPracticeDate(childId)", () => {
    it("targets student_id = childId, not the session uid", async () => {
      mockAuthSession("parentUid");
      const chain = mockSelectEqMaybeSingleChain({
        data: { practiced_at: "2026-08-01T00:00:00.000Z" },
        error: null,
      });
      supabase.from.mockImplementation(() => chain);

      const result = await streakService.getLastPracticeDate("childB");

      expect(chain.eqMock).toHaveBeenCalledWith("student_id", "childB");
      expect(chain.eqMock).not.toHaveBeenCalledWith("student_id", "parentUid");
      expect(result).toEqual(new Date("2026-08-01T00:00:00.000Z"));
    });
  });

  describe("updateStreak(childId)", () => {
    it("writes to current_streak/last_practiced_date/highest_streak with student_id = childId, while the RLS principal (getSession) is still derived from the parent's session", async () => {
      mockAuthSession("parentUid");

      // 1st call: getLastPracticeDate's internal from('last_practiced_date') read (no prior practice)
      const lastPracticeReadChain = mockSelectEqMaybeSingleChain({
        data: null,
        error: null,
      });
      // 2nd call: current_streak row read inside updateStreak's Promise.all
      const streakRowReadChain = mockSelectEqMaybeSingleChain({
        data: null,
        error: null,
      });
      // 3rd call: current_streak upsert (write)
      const upsertStreakMock = vi.fn().mockResolvedValue({ error: null });
      // 4th call: last_practiced_date upsert (write)
      const upsertPracticeMock = vi.fn().mockResolvedValue({ error: null });
      // 5th call: highest_streak select
      const highestStreakReadChain = mockSelectEqMaybeSingleChain({
        data: null,
        error: null,
      });
      // 6th call: highest_streak upsert
      const upsertHighestMock = vi.fn().mockResolvedValue({ error: null });

      // Per-table call counters — read call comes before the write call for
      // current_streak and highest_streak; last_practiced_date is read once
      // (inside getLastPracticeDate) then written once later.
      const callCounts = {};
      supabase.from.mockImplementation((table) => {
        callCounts[table] = (callCounts[table] || 0) + 1;
        const n = callCounts[table];

        if (table === "last_practiced_date") {
          return n === 1
            ? lastPracticeReadChain
            : { upsert: upsertPracticeMock };
        }
        if (table === "current_streak") {
          return n === 1 ? streakRowReadChain : { upsert: upsertStreakMock };
        }
        if (table === "highest_streak") {
          return n === 1
            ? highestStreakReadChain
            : { upsert: upsertHighestMock };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      await streakService.updateStreak("childB");

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(lastPracticeReadChain.eqMock).toHaveBeenCalledWith(
        "student_id",
        "childB"
      );
      expect(streakRowReadChain.eqMock).toHaveBeenCalledWith(
        "student_id",
        "childB"
      );
      expect(upsertStreakMock).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: "childB" }),
        expect.anything()
      );
      expect(upsertPracticeMock).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: "childB" }),
        expect.anything()
      );

      // Prove the parent's session uid never appears as a row target anywhere
      expect(lastPracticeReadChain.eqMock).not.toHaveBeenCalledWith(
        "student_id",
        "parentUid"
      );
      expect(streakRowReadChain.eqMock).not.toHaveBeenCalledWith(
        "student_id",
        "parentUid"
      );
    });
  });

  describe("setWeekendPass(childId, enabled)", () => {
    it("upserts student_id = childId", async () => {
      mockAuthSession("parentUid");
      const upsertMock = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockReturnValue({ upsert: upsertMock });

      await streakService.setWeekendPass("childB", true);

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: "childB",
          weekend_pass_enabled: true,
        }),
        expect.anything()
      );
    });
  });

  describe("resetStreak(childId)", () => {
    it("upserts both current_streak and last_practiced_date with student_id = childId", async () => {
      mockAuthSession("parentUid");
      const upsertStreakMock = vi.fn().mockResolvedValue({ error: null });
      const upsertPracticeMock = vi.fn().mockResolvedValue({ error: null });
      supabase.from.mockImplementation((table) => {
        if (table === "current_streak") return { upsert: upsertStreakMock };
        if (table === "last_practiced_date")
          return { upsert: upsertPracticeMock };
        throw new Error(`Unexpected table: ${table}`);
      });

      await streakService.resetStreak("childB");

      expect(upsertStreakMock).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: "childB" }),
        expect.anything()
      );
      expect(upsertPracticeMock).toHaveBeenCalledWith(
        expect.objectContaining({ student_id: "childB" }),
        expect.anything()
      );
    });
  });
});
