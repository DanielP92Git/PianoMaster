import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── Mock: useActiveChildId — role/child fixture control per test ────────────
const mockActiveChild = vi.hoisted(() => ({
  childId: null,
  ready: false,
}));

vi.mock("../../hooks/useActiveChildId", () => ({
  useActiveChildId: () => ({
    childId: mockActiveChild.childId,
    ready: mockActiveChild.ready,
  }),
}));

// ─── Mock: apiScores ──────────────────────────────────────────────────────────
vi.mock("../../services/apiScores", () => ({
  getStudentScores: vi.fn(() => Promise.resolve({ scores: [], totalScore: 0 })),
  updateStudentScore: vi.fn(() => Promise.resolve({ newScore: {} })),
}));

// ─── Mock: react-hot-toast ─────────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// ─── Mock: @tanstack/react-query — capture the useQuery/useMutation configs
// so we can assert queryKey/queryFn/enabled/invalidations without spinning
// up a real QueryClient.
const queryCalls = vi.hoisted(() => ({ current: [] }));
const mutationCalls = vi.hoisted(() => ({ current: [] }));
const invalidateSpy = vi.hoisted(() => ({ fn: null }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn((config) => {
    queryCalls.current.push(config);
    return { data: undefined, error: null, isLoading: false };
  }),
  useMutation: vi.fn((config) => {
    mutationCalls.current.push(config);
    return {
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => Promise.resolve()),
      error: null,
      isLoading: false,
    };
  }),
  useQueryClient: vi.fn(() => {
    invalidateSpy.fn = vi.fn();
    return { invalidateQueries: invalidateSpy.fn };
  }),
}));

import { getStudentScores, updateStudentScore } from "../../services/apiScores";
import { useScores } from "./useScores";

describe("useScores", () => {
  beforeEach(() => {
    queryCalls.current = [];
    mutationCalls.current = [];
    mockActiveChild.childId = null;
    mockActiveChild.ready = false;
    vi.clearAllMocks();
  });

  it("keys the scores query on the active child id", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useScores());

    const config = queryCalls.current[0];
    expect(config.queryKey).toEqual(["scores", "childA"]);
  });

  it("queryFn fetches scores for the active child, not a parent user id", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useScores());

    const config = queryCalls.current[0];
    config.queryFn();
    expect(getStudentScores).toHaveBeenCalledWith("childA");
  });

  it("parent-role fixture (childId set, ready true) enables the query — no isStudent gate", () => {
    // Simulates a parent session: useActiveChildId resolves childId from the
    // active-child context rather than user.id, and ready reflects that
    // resolution — the hook must no longer require isStudent to be true.
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useScores());

    const config = queryCalls.current[0];
    expect(config.enabled).toBe(true);
  });

  it("query is disabled when the active child id is not yet resolved", () => {
    mockActiveChild.childId = null;
    mockActiveChild.ready = false;

    renderHook(() => useScores());

    const config = queryCalls.current[0];
    expect(config.enabled).toBe(false);
  });

  it("switching the active child changes the query key — proves no unkeyed bleed", () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;
    const first = renderHook(() => useScores());
    const firstKey = queryCalls.current[0].queryKey;

    first.unmount();
    queryCalls.current = [];

    mockActiveChild.childId = "childB";
    mockActiveChild.ready = true;
    renderHook(() => useScores());
    const secondKey = queryCalls.current[0].queryKey;

    expect(firstKey).toEqual(["scores", "childA"]);
    expect(secondKey).toEqual(["scores", "childB"]);
    expect(firstKey).not.toEqual(secondKey);
  });

  it("mutationFn updates the active child's score, not a parent/user id", async () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useScores());

    const config = mutationCalls.current[0];
    await config.mutationFn({ score: 42, gameType: "sight_reading" });
    expect(updateStudentScore).toHaveBeenCalledWith(
      "childA",
      42,
      "sight_reading"
    );
  });

  it("onSuccess invalidations key every child-scoped entry on childId", async () => {
    mockActiveChild.childId = "childA";
    mockActiveChild.ready = true;

    renderHook(() => useScores());

    const config = mutationCalls.current[0];
    await config.onSuccess();

    expect(invalidateSpy.fn).toHaveBeenCalledWith(["scores", "childA"]);
    expect(invalidateSpy.fn).toHaveBeenCalledWith(["student-scores", "childA"]);
    expect(invalidateSpy.fn).toHaveBeenCalledWith(["point-balance", "childA"]);
    expect(invalidateSpy.fn).toHaveBeenCalledWith([
      "earned-achievements",
      "childA",
    ]);
  });
});
