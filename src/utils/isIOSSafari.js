/**
 * isIOSSafari
 *
 * Shared utility to detect whether the current browser is Safari on iOS/iPadOS.
 * Extracted from SightReadingGame.jsx (Phase 09) so all game components and
 * providers can import a single source of truth.
 *
 * Detection logic:
 * - Checks for iPad/iPhone/iPod in userAgent, OR Macintosh with touch support
 *   (covers iPadOS 13+ which reports a desktop UA by default)
 * - Checks that userAgent contains "Safari" but NOT any of the embedded
 *   browser wrappers (Chrome iOS, Firefox iOS, Edge iOS, Opera iOS)
 *
 * @type {boolean}
 */
export const isIOSSafari =
  typeof navigator !== "undefined" &&
  (() => {
    const ua = navigator.userAgent || "";
    const isIOSDevice =
      /iPad|iPhone|iPod/i.test(ua) ||
      (ua.includes("Macintosh") &&
        typeof document !== "undefined" &&
        "ontouchend" in document);
    const isSafari =
      /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
    return isIOSDevice && isSafari;
  })();
