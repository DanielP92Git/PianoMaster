/**
 * ActiveChildContext.bleed.test.jsx — MANDATORY PROFILE-05 no-bleed acceptance test.
 *
 * Falsifiable proof that a fast child switch cannot serve Child A's cached
 * data to Child B: switchChild() must clear the React Query cache (incl. the
 * two UNKEYED queries ["streak-state"] and ["scores"], per RESEARCH.md's
 * React Query Key Inventory), purge child-scoped localStorage, and reset
 * streakService's module-level in-flight singletons (Pitfall 2 —
 * queryClient.removeQueries() cannot touch module state).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockPurge = vi.hoisted(() => vi.fn());
const mockResetStreak = vi.hoisted(() => vi.fn());

vi.mock("../services/apiAuth", () => ({
  purgeChildScopedLocalStorage: mockPurge,
}));

vi.mock("../services/streakService", () => ({
  resetStreakServiceCaches: mockResetStreak,
}));

vi.mock("../features/authentication/useUser", () => ({
  useUser: () => ({
    user: { id: "parent-1" },
    isParent: true,
    isStudent: false,
  }),
}));

vi.mock("../hooks/useChildProfiles", () => ({
  useChildProfiles: () => ({
    data: [{ id: "childA" }, { id: "childB" }],
    isLoading: false,
  }),
}));

import { ActiveChildProvider, useActiveChild } from "./ActiveChildContext";

function SwitchButton() {
  const { switchChild } = useActiveChild();
  return (
    <button data-testid="switch-btn" onClick={() => switchChild("childB")}>
      switch
    </button>
  );
}

describe("ActiveChildContext switchChild — PROFILE-05 no-bleed", () => {
  let queryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("clears unkeyed + keyed cache, purges localStorage, resets streak singletons, persists the new child id", () => {
    // Seed distinct cached values that must belong to Child A only.
    queryClient.setQueryData(["streak-state"], { streakCount: 5 });
    queryClient.setQueryData(["scores"], [{ score: 100 }]);
    queryClient.setQueryData(["student-xp", "childA"], { xp: 999 });

    render(
      <QueryClientProvider client={queryClient}>
        <ActiveChildProvider>
          <SwitchButton />
        </ActiveChildProvider>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByTestId("switch-btn"));

    // (1) BOTH unkeyed queries are gone after switch — the falsifiable
    // no-bleed proof (a fast switch cannot serve Child A's cached value
    // to Child B because these keys carry no id to disambiguate them).
    expect(queryClient.getQueryData(["streak-state"])).toBeUndefined();
    expect(queryClient.getQueryData(["scores"])).toBeUndefined();
    // Keyed query is cleared too (removeQueries() with no filter clears all).
    expect(queryClient.getQueryData(["student-xp", "childA"])).toBeUndefined();

    // (2) streakService module singletons reset (Pitfall 2)
    expect(mockResetStreak).toHaveBeenCalledTimes(1);

    // (3) child-scoped localStorage purged (incl. shown-accessory-unlocks- prefix)
    expect(mockPurge).toHaveBeenCalledTimes(1);

    // (4) new active child id persisted
    expect(localStorage.getItem("active_child_id")).toBe("childB");
  });
});
