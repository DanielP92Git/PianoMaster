export const hasNavigator = () => typeof navigator !== "undefined";
export const hasWindow = () => typeof window !== "undefined";

export const isIOSDevice = () =>
  hasNavigator() && /iPad|iPhone|iPod/.test(navigator.userAgent);

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

