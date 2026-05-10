/* eslint-disable react-refresh/only-export-components */
/**
 * NeedsLandscapeContext — content-driven landscape declaration for rhythm games.
 *
 * Renderers call useDeclareNeedsLandscape(boolean) on mount; cleanup clears.
 * Last-writer-wins (only one rhythm renderer is active at a time per D-15).
 * Default-value variant — useNeedsLandscape() returns false outside provider safely.
 *
 * Phase 34 Plan 01 (INFRA-02). Consumed by Phase 35 vertical-lanes work.
 */

import { createContext, useContext, useState, useEffect } from "react";

const NeedsLandscapeContext = createContext({
  needsLandscape: false,
  setNeedsLandscape: () => {},
});

export function NeedsLandscapeProvider({ children }) {
  const [needsLandscape, setNeedsLandscape] = useState(false);
  return (
    <NeedsLandscapeContext.Provider
      value={{ needsLandscape, setNeedsLandscape }}
    >
      {children}
    </NeedsLandscapeContext.Provider>
  );
}

export function useNeedsLandscape() {
  return useContext(NeedsLandscapeContext).needsLandscape;
}

/**
 * Mount-time declaration. Each mount sets the flag, each unmount clears it.
 * Pass false explicitly to clear any prior true (e.g., MixedLessonGame swapping
 * a long-pattern renderer out for a short-pattern renderer).
 */
export function useDeclareNeedsLandscape(value) {
  const { setNeedsLandscape } = useContext(NeedsLandscapeContext);
  useEffect(() => {
    setNeedsLandscape(Boolean(value));
    return () => setNeedsLandscape(false);
  }, [value, setNeedsLandscape]);
}
