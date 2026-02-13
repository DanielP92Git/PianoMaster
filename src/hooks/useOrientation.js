import { useEffect, useState } from "react";

/**
 * Reactive orientation detection via matchMedia.
 * Returns current orientation state synchronously on first render (no flash).
 */
export function useOrientation() {
  const getOrientation = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return "portrait";
    return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
  };

  const [orientation, setOrientation] = useState(() => getOrientation());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function")
      return;

    const mq = window.matchMedia("(orientation: portrait)");
    const onChange = () => {
      setOrientation(mq.matches ? "portrait" : "landscape");
    };

    // Initialize and subscribe
    onChange();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    // Safari fallback
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return {
    orientation,
    isPortrait: orientation === "portrait",
    isLandscape: orientation === "landscape"
  };
}
