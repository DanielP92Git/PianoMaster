/**
 * Whether the dev mic-debug overlay is on. Toggle with `?debug-mic=1` / `?debug-mic=0`
 * in the URL (persisted, so it survives navigating into a game) — usable on
 * devices without a console, e.g. iPad Safari. Or in a console:
 * localStorage.setItem("debug-mic", "1") then refresh.
 */
export function isMicDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    const param = new URLSearchParams(window.location.search).get("debug-mic");
    if (param === "1" || param === "0") {
      window.localStorage?.setItem("debug-mic", param);
    }
    return window.localStorage?.getItem("debug-mic") === "1";
  } catch {
    return false;
  }
}
