import { useEffect, useRef } from "react";
import { requestFullscreen } from "../utils/pwa";

/**
 * Best-effort: enter fullscreen on the first user tap anywhere in the app.
 * This makes the whole app feel more native (especially in Android Chrome),
 * while keeping orientation logic separate (portrait/landscape is handled elsewhere).
 *
 * Notes:
 * - Fullscreen APIs require a user gesture, hence the event listener.
 * - iOS Safari generally does not support document fullscreen; requestFullscreen() becomes a no-op.
 * - In React StrictMode (dev), effects run twice; refs ensure this only arms once.
 */
export function useGlobalFullscreenOnFirstTap() {
  const armedRef = useRef(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (armedRef.current) return;
    armedRef.current = true;

    const handler = () => {
      if (firedRef.current) return;
      firedRef.current = true;

      cleanup();

      // Fire-and-forget: don't block UI; fullscreen may be rejected by browser policy.
      try {
        void requestFullscreen();
      } catch {
        // ignore
      }
    };

    const cleanup = () => {
      if (typeof window === "undefined") return;
      window.removeEventListener("pointerdown", handler, true);
      window.removeEventListener("touchstart", handler, true);
      window.removeEventListener("mousedown", handler, true);
    };

    if (typeof window !== "undefined") {
      // Capture phase increases odds we run before other handlers that might stop propagation.
      window.addEventListener("pointerdown", handler, { capture: true, passive: true });
      // Fallbacks for older browsers/devices.
      window.addEventListener("touchstart", handler, { capture: true, passive: true });
      window.addEventListener("mousedown", handler, { capture: true, passive: true });
    }

    return cleanup;
  }, []);
}




