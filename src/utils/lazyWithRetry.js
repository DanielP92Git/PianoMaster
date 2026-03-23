import React from "react";

const RELOAD_KEY = "chunk-reload";

/**
 * Wraps React.lazy with automatic recovery from stale-chunk errors.
 *
 * After a deployment, old chunk filenames no longer exist. Netlify returns 404
 * (or previously served index.html as text/html), which breaks dynamic imports.
 * This wrapper catches those failures and reloads the page once so the browser
 * fetches the new index.html with correct chunk references.
 *
 * @param {() => Promise<{default: React.ComponentType}>} importFn
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithRetry(importFn) {
  return React.lazy(() =>
    importFn().catch((error) => {
      const hasReloaded = sessionStorage.getItem(RELOAD_KEY);
      if (!hasReloaded) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        // Return a never-resolving promise — page is reloading
        return new Promise(() => {});
      }
      // Already reloaded once — clear flag and let ErrorBoundary handle it
      sessionStorage.removeItem(RELOAD_KEY);
      throw error;
    })
  );
}
