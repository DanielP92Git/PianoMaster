import "@testing-library/jest-dom/vitest";

// Make requestAnimationFrame work predictably under fake timers.
// Many timing loops in this app (metronome/timeline) rely on RAF.
if (typeof globalThis.requestAnimationFrame !== "function") {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
}

if (typeof globalThis.cancelAnimationFrame !== "function") {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}




