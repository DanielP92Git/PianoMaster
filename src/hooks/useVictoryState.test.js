import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// ─── Mock: react-router-dom ────────────────────────────────────────────────
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// ─── Mock: react-i18next ────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: "en" } }),
}));

// ─── Mock: react-hot-toast ──────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Mock: useActiveChildId — the hook under test (Task 2 rescope) ─────────
const mockActiveChild = vi.hoisted(() => ({
  childId: null,
  ready: false,
}));
vi.mock("./useActiveChildId", () => ({
  useActiveChildId: () => ({
    childId: mockActiveChild.childId,
    ready: mockActiveChild.ready,
  }),
}));

// ─── Mock: useUser — `user` is still consumed for account-scoped fields
// (isTeacher, and the two explicitly-deferred localStorage-only consumers:
// useBossUnlockTracking + levelUpTracking — see 04-06-SUMMARY.md). ─────────
vi.mock("../features/authentication/useUser", () => ({
  useUser: () => ({ user: { id: "parent-1" }, isTeacher: false }),
}));

// ─── Mock: useAccessibility ─────────────────────────────────────────────────
vi.mock("../contexts/AccessibilityContext", () => ({
  useAccessibility: () => ({ reducedMotion: false }),
}));

// ─── Mock: sub-hooks unrelated to the childId rescope — static stubs ───────
vi.mock("./useAccessories", () => ({
  useAccessoriesList: () => ({ data: [] }),
  usePointBalance: () => ({ data: { earned: 0 } }),
}));
vi.mock("./useGamesPlayed", () => ({
  useGamesPlayed: () => ({ data: 1 }),
}));
vi.mock("./useUserProfile", () => ({
  useUserProfile: () => ({ data: {} }),
}));
vi.mock("./useAccessoryUnlockDetection", () => ({
  useAccessoryUnlockDetection: () => [],
}));
vi.mock("./useBossUnlockTracking", () => ({
  useBossUnlockTracking: () => ({
    shouldShow: false,
    markAsShown: vi.fn(),
  }),
}));

// ─── Mock: useStreakWithAchievements — capture the childId it's constructed
// with (Task 2: "any practice/award_xp calls to pass childId"). ─────────────
const streakWithAchievementsCalls = vi.hoisted(() => ({ current: [] }));
vi.mock("./useStreakWithAchievements", () => ({
  useStreakWithAchievements: vi.fn((childId) => {
    streakWithAchievementsCalls.current.push(childId);
    return { mutate: vi.fn() };
  }),
}));

// ─── Mock: streakService — capture the childId passed to getStreakState ───
const streakServiceCalls = vi.hoisted(() => ({ current: [] }));
vi.mock("../services/streakService", () => ({
  streakService: {
    getStreakState: vi.fn((childId) => {
      streakServiceCalls.current.push(childId);
      return Promise.resolve({
        streakCount: 0,
        comebackBonus: { active: false },
      });
    }),
  },
}));

// ─── Mock: skillProgressService — trail persistence (award_xp adjacent) ───
const awardXPCalls = vi.hoisted(() => ({ current: [] }));
vi.mock("../services/skillProgressService", () => ({
  updateNodeProgress: vi.fn(() =>
    Promise.resolve({ rateLimited: false, nodeComplete: true })
  ),
  getNodeProgress: vi.fn(() => Promise.resolve(null)),
  updateExerciseProgress: vi.fn(() =>
    Promise.resolve({
      rateLimited: false,
      nodeComplete: true,
      exercisesRemaining: 0,
    })
  ),
  calculateStarsFromPercentage: vi.fn(() => 3),
}));

// ─── Mock: xpSystem — capture the childId passed to awardXP ────────────────
vi.mock("../utils/xpSystem", () => ({
  awardXP: vi.fn((childId, amount) => {
    awardXPCalls.current.push({ childId, amount });
    return Promise.resolve({
      newTotalXP: amount,
      newLevel: 1,
      leveledUp: false,
    });
  }),
  calculateSessionXP: vi.fn(() => ({ totalXP: 50 })),
  calculateFreePlayXP: vi.fn(() => 20),
  getLevelProgress: vi.fn(() => null),
  PRESTIGE_XP_PER_TIER: 3000,
}));

// ─── Mock: skillTrail data lookups ──────────────────────────────────────────
vi.mock("../data/skillTrail", () => ({
  getNodeById: vi.fn(() => ({
    isBoss: false,
    nodeType: null,
    exercises: [{ type: "note_recognition" }],
  })),
  getTrailTabForNode: vi.fn(() => null),
}));

// ─── Mock: celebration + level-tracking utilities — trivial passthroughs ──
vi.mock("../utils/celebrationTiers", () => ({
  determineCelebrationTier: vi.fn(() => "minimal"),
  getCelebrationConfig: vi.fn(() => ({ confetti: false })),
}));
vi.mock("../utils/celebrationMessages", () => ({
  getCelebrationMessage: vi.fn(() => "Great job!"),
}));
vi.mock("../utils/levelUpTracking", () => ({
  hasLevelBeenCelebrated: vi.fn(() => true),
  markLevelCelebrated: vi.fn(),
}));

// ─── Mock: @tanstack/react-query — capture useQuery config + invalidations
// without spinning up a real QueryClient (same technique as useScores.test.js). ─
const queryCalls = vi.hoisted(() => ({ current: [] }));
const invalidateSpy = vi.hoisted(() => ({ fn: null }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((config) => {
    queryCalls.current.push(config);
    return { data: undefined, isLoading: false };
  }),
  // NOTE: useQueryClient() is called on every render (the hook re-renders many
  // times as its async effects settle) — a persistent spy is required or a later
  // render would silently replace it, losing history of earlier invalidateQueries
  // calls made in prior renders.
  useQueryClient: vi.fn(() => {
    if (!invalidateSpy.fn) {
      invalidateSpy.fn = vi.fn();
    }
    return { invalidateQueries: invalidateSpy.fn };
  }),
}));

import { useVictoryState } from "./useVictoryState";

const baseProps = {
  score: 8,
  totalPossibleScore: 10,
  onReset: vi.fn(),
  timedMode: false,
  timeRemaining: 0,
  initialTime: 0,
  onExit: vi.fn(),
};

describe("useVictoryState — active-child rescope (04-06)", () => {
  beforeEach(() => {
    queryCalls.current = [];
    streakServiceCalls.current = [];
    streakWithAchievementsCalls.current = [];
    awardXPCalls.current = [];
    invalidateSpy.fn = null;
    mockActiveChild.childId = null;
    mockActiveChild.ready = false;
    window.localStorage.clear();
    vi.spyOn(window.localStorage.__proto__, "getItem");
  });

  it("keys the streak-state query on the active child id (closes the second unkeyed bleed vector)", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useVictoryState({ ...baseProps }));

    const streakConfig = queryCalls.current.find(
      (c) => c.queryKey?.[0] === "streak-state"
    );
    expect(streakConfig.queryKey).toEqual(["streak-state", "childA"]);
    expect(streakConfig.enabled).toBe(true);
  });

  it("getStreakState queryFn is called with the active child id, not undefined/parent id", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useVictoryState({ ...baseProps }));

    const streakConfig = queryCalls.current.find(
      (c) => c.queryKey?.[0] === "streak-state"
    );
    streakConfig.queryFn();
    expect(streakServiceCalls.current).toContain("childA");
  });

  it("streak-state query is disabled until the active child id resolves", () => {
    mockActiveChild.childId = null;
    mockActiveChild.ready = false;

    renderHook(() => useVictoryState({ ...baseProps }));

    const streakConfig = queryCalls.current.find(
      (c) => c.queryKey?.[0] === "streak-state"
    );
    expect(streakConfig.enabled).toBe(false);
  });

  it("useStreakWithAchievements is constructed with the active child id (practice call passes childId)", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useVictoryState({ ...baseProps }));

    expect(streakWithAchievementsCalls.current).toContain("childA");
  });

  it("the accessory-unlock localStorage key is shown-accessory-unlocks-<childId>, not the parent user id", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useVictoryState({ ...baseProps }));

    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "shown-accessory-unlocks-childA"
    );
    expect(window.localStorage.getItem).not.toHaveBeenCalledWith(
      "shown-accessory-unlocks-parent-1"
    );
  });

  it("switching the active child changes both the query key and the localStorage key — no cross-child bleed", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;
    const first = renderHook(() => useVictoryState({ ...baseProps }));
    const firstKey = queryCalls.current.find(
      (c) => c.queryKey?.[0] === "streak-state"
    ).queryKey;
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "shown-accessory-unlocks-childA"
    );

    first.unmount();
    queryCalls.current = [];
    window.localStorage.getItem.mockClear();

    mockActiveChild.childId = "childB";
    mockActiveChild.ready = true;
    renderHook(() => useVictoryState({ ...baseProps }));
    const secondKey = queryCalls.current.find(
      (c) => c.queryKey?.[0] === "streak-state"
    ).queryKey;

    expect(firstKey).toEqual(["streak-state", "childA"]);
    expect(secondKey).toEqual(["streak-state", "childB"]);
    expect(firstKey).not.toEqual(secondKey);
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      "shown-accessory-unlocks-childB"
    );
    expect(window.localStorage.getItem).not.toHaveBeenCalledWith(
      "shown-accessory-unlocks-childA"
    );
  });

  it("award_xp for a completed trail node is awarded to the active child id, not the parent's own id", async () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() =>
      useVictoryState({
        ...baseProps,
        nodeId: "treble_c_d",
      })
    );

    await waitFor(() => {
      expect(awardXPCalls.current.length).toBeGreaterThan(0);
    });

    expect(awardXPCalls.current[0].childId).toBe("childA");
  });

  it("invalidateQueries for student-scores/earned-achievements/user-accessories/student-xp key on childId", async () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() =>
      useVictoryState({
        ...baseProps,
        nodeId: "treble_c_d",
      })
    );

    await waitFor(() => {
      expect(invalidateSpy.fn.mock.calls.length).toBeGreaterThan(0);
    });

    const calledKeys = invalidateSpy.fn.mock.calls.map(
      (call) => call[0]?.queryKey
    );
    expect(calledKeys).toContainEqual(["student-xp", "childA"]);
    // Never invalidate using the parent's own user id for these child-scoped caches
    expect(calledKeys).not.toContainEqual(["student-xp", "parent-1"]);
  });
});
