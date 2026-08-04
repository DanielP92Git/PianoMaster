import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "../features/authentication/useUser";
import { useChildProfiles } from "../hooks/useChildProfiles";
import { purgeChildScopedLocalStorage } from "../services/apiAuth";
import { resetStreakServiceCaches } from "../services/streakService";

const ACTIVE_CHILD_STORAGE_KEY = "active_child_id";

const ActiveChildContext = createContext();

/**
 * Holds the localStorage-backed active-child id, the parent's owned-children
 * list, and the switch-clear routine (RESEARCH.md Pattern 2). Follows the
 * SettingsContext provider+co-located-hook triad.
 */
export const ActiveChildProvider = ({ children }) => {
  const { isParent } = useUser();
  const { data: ownedChildren = [], isLoading: childrenLoading } =
    useChildProfiles();
  const queryClient = useQueryClient();

  const [activeChildId, setActiveChildId] = useState(null);
  const [ready, setReady] = useState(false);

  // Read localStorage BEFORE any child-scoped query fires (D-04): validate
  // the stored id against the owned-children list, then flip `ready`.
  // Mirrors SettingsContext's load-effect/isLoading-in-finally shape.
  useEffect(() => {
    if (!isParent) {
      setReady(false);
      return;
    }
    if (childrenLoading) return;

    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(ACTIVE_CHILD_STORAGE_KEY)
          : null;
      const validId =
        stored && ownedChildren.some((child) => child.id === stored)
          ? stored
          : null;
      setActiveChildId(validId);
    } finally {
      setReady(true);
    }
  }, [isParent, childrenLoading, ownedChildren]);

  /**
   * Clear-then-set switch routine (RESEARCH.md Pattern 2, T-04-02-02
   * mitigation): clears React Query cache, purges child-scoped
   * localStorage, resets streakService module singletons, THEN persists +
   * sets the new active child id — in that order, so nothing can serve
   * Child A's data under Child B's id.
   */
  const switchChild = useCallback(
    (nextChildId) => {
      queryClient.removeQueries();
      purgeChildScopedLocalStorage();
      resetStreakServiceCaches();
      if (typeof window !== "undefined") {
        localStorage.setItem("active_child_id", nextChildId);
      }
      setActiveChildId(nextChildId);
    },
    [queryClient]
  );

  const value = { activeChildId, ownedChildren, ready, switchChild };

  return (
    <ActiveChildContext.Provider value={value}>
      {children}
    </ActiveChildContext.Provider>
  );
};

/**
 * Hook to use the active-child context.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export const useActiveChild = () => {
  const context = useContext(ActiveChildContext);
  if (!context) {
    throw new Error(
      "useActiveChild must be used within an ActiveChildProvider"
    );
  }
  return context;
};

export default ActiveChildContext;
