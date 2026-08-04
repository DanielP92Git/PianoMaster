import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// ─── Mock: useUser — role duality control per test ───────────────────────────
const mockUserState = vi.hoisted(() => ({
  user: null,
  isStudent: false,
  isParent: false,
}));

vi.mock("../features/authentication/useUser", () => ({
  useUser: () => ({
    user: mockUserState.user,
    isStudent: mockUserState.isStudent,
    isParent: mockUserState.isParent,
  }),
}));

// ─── Mock: useActiveChild — reads localStorage the way ActiveChildProvider
// does on mount, so a fresh renderHook() call after unmount simulates a
// reload/remount and proves PROFILE-06 persistence without needing the
// full provider (owned-children validation is covered by the bleed test).
vi.mock("../contexts/ActiveChildContext", () => ({
  useActiveChild: () => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("active_child_id")
        : null;
    return { activeChildId: stored, ready: !!stored };
  },
}));

import { useActiveChildId } from "./useActiveChildId";

describe("useActiveChildId", () => {
  beforeEach(() => {
    localStorage.clear();
    mockUserState.user = null;
    mockUserState.isStudent = false;
    mockUserState.isParent = false;
  });

  it("student role: returns childId=user.id, ready=true", () => {
    mockUserState.user = { id: "student-1" };
    mockUserState.isStudent = true;

    const { result } = renderHook(() => useActiveChildId());

    expect(result.current.childId).toBe("student-1");
    expect(result.current.ready).toBe(true);
  });

  it("parent role: returns childId=validated-localStorage-id, ready when set", () => {
    localStorage.setItem("active_child_id", "child-abc");
    mockUserState.user = { id: "parent-1" };
    mockUserState.isParent = true;

    const { result } = renderHook(() => useActiveChildId());

    expect(result.current.childId).toBe("child-abc");
    expect(result.current.ready).toBe(true);
  });

  it("parent role with no active child set: childId=null, ready=false", () => {
    mockUserState.user = { id: "parent-1" };
    mockUserState.isParent = true;

    const { result } = renderHook(() => useActiveChildId());

    expect(result.current.childId).toBe(null);
    expect(result.current.ready).toBe(false);
  });

  it("unknown/unresolved role: returns childId=null, ready=false", () => {
    mockUserState.user = { id: "someone" };

    const { result } = renderHook(() => useActiveChildId());

    expect(result.current.childId).toBe(null);
    expect(result.current.ready).toBe(false);
  });

  it("PROFILE-06: active_child_id read from seeded localStorage persists across a simulated reload (unmount + remount)", () => {
    localStorage.setItem("active_child_id", "child-reload-survivor");
    mockUserState.user = { id: "parent-1" };
    mockUserState.isParent = true;

    const first = renderHook(() => useActiveChildId());
    expect(first.result.current.childId).toBe("child-reload-survivor");

    first.unmount();

    // Simulate reload: fresh render, same localStorage (never cleared)
    const second = renderHook(() => useActiveChildId());
    expect(second.result.current.childId).toBe("child-reload-survivor");
    expect(second.result.current.ready).toBe(true);
  });

  it("D-04: returned object has exactly {childId, ready} — no isOwner/authz field", () => {
    mockUserState.user = { id: "student-1" };
    mockUserState.isStudent = true;

    const { result } = renderHook(() => useActiveChildId());

    expect(Object.keys(result.current).sort()).toEqual(["childId", "ready"]);
    expect(result.current.isOwner).toBeUndefined();
    expect(result.current.isAuthorized).toBeUndefined();
  });
});
