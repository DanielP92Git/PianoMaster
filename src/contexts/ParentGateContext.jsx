import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import { useActiveChild } from "./ActiveChildContext";

// D-05: short auto-closing shared window (~3 min, Claude's discretion 2-5 min).
const WINDOW_MS = 3 * 60 * 1000;

// Only /parent-portal and /manage-children actually consume the shared gate's
// `passed` state today (ParentGateProtectedRoute wraps /manage-children;
// /parent-portal reads useParentGate() directly for its gated action rows).
// Denylist, not allowlist: every OTHER post-auth surface — including ones
// that are unguarded but not gate-consuming, like /avatars or /settings —
// is treated as a child surface and closes the shared window on navigation
// (D-05 trigger 4). This fails closed: a new route added later without being
// added here loses the gate by default instead of silently inheriting it.
const GATED_PARENT_ONLY_ROUTES = ["/parent-portal", "/manage-children"];

const isChildSurfaceRoute = (pathname) =>
  !GATED_PARENT_ONLY_ROUTES.some((route) => pathname.startsWith(route));

const ParentGateContext = createContext();

/**
 * Shared, short-lived, in-memory parental gate (D-05/D-06). Gate-passed state is
 * NEVER persisted to browser storage (no reads/writes to any Web Storage API) — it
 * lives only in React state and a ref-held timer for the current tab session.
 * Closes on ALL FOUR triggers:
 *   1. timeout      — the ~3-minute window armed in pass()
 *   2. profile-switch — activeChildId change (ActiveChildContext)
 *   3. blur/visibilitychange — app backgrounded
 *   4. route-change — navigating to any route outside GATED_PARENT_ONLY_ROUTES
 * Follows the SettingsContext provider+co-located-hook triad.
 */
export const ParentGateProvider = ({ children }) => {
  const [passedAt, setPassedAt] = useState(null);
  const timeoutRef = useRef(null);
  const location = useLocation();
  const { activeChildId } = useActiveChild();

  const closeGate = useCallback(() => {
    setPassedAt(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const pass = useCallback(() => {
    setPassedAt(Date.now());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // trigger 1: timeout
    timeoutRef.current = setTimeout(closeGate, WINDOW_MS);
  }, [closeGate]);

  // trigger 3: backgrounded/blurred
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) closeGate();
    };
    // visibilitychange fires on `document` per spec (does not bubble to window)
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", closeGate);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", closeGate);
    };
  }, [closeGate]);

  // trigger 2: profile-switch — close whenever the active child changes
  useEffect(() => {
    closeGate();
  }, [activeChildId, closeGate]);

  // trigger 4: navigating back to a child surface
  useEffect(() => {
    if (isChildSurfaceRoute(location.pathname)) closeGate();
  }, [location.pathname, closeGate]);

  // Clean up the timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const passed = passedAt !== null && Date.now() - passedAt < WINDOW_MS;

  const value = { passed, pass, closeGate };

  return (
    <ParentGateContext.Provider value={value}>
      {children}
    </ParentGateContext.Provider>
  );
};

/**
 * Hook to use the parental gate context.
 */
// eslint-disable-next-line react-refresh/only-export-components -- context provider and hook are co-located by design; splitting would break encapsulation with no HMR benefit
export const useParentGate = () => {
  const context = useContext(ParentGateContext);
  if (!context) {
    throw new Error("useParentGate must be used within a ParentGateProvider");
  }
  return context;
};

export default ParentGateContext;
