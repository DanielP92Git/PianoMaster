export const hasNavigator = () => typeof navigator !== "undefined";
export const hasWindow = () => typeof window !== "undefined";

export const isIOSDevice = () => {
  if (!hasNavigator() || !hasWindow()) return false;

  const ua = navigator.userAgent || "";
  const platform = navigator.platform || "";

  const isClassicIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOSDesktopMode =
    platform === "MacIntel" && window.navigator.maxTouchPoints > 1;

  return isClassicIOS || isIPadOSDesktopMode;
};

export const isSafariBrowser = () =>
  hasNavigator() &&
  /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

export const isAndroidDevice = () =>
  hasNavigator() && /Android/.test(navigator.userAgent);

export const isChromeBrowser = () =>
  hasNavigator() &&
  /Chrome|CriOS/i.test(navigator.userAgent) &&
  !/Edge|Edg/i.test(navigator.userAgent);

export const isInStandaloneMode = () =>
  hasWindow() &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone);

