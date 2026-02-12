import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "../locales/en/common.json";
import heCommon from "../locales/he/common.json";
import enTrail from "../locales/en/trail.json";
import heTrail from "../locales/he/trail.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, trail: enTrail },
      he: { common: heCommon, trail: heTrail },
    },
    supportedLngs: ["en", "he"],
    fallbackLng: "en",
    load: "languageOnly",
    ns: ["common", "trail"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

// Expose i18n to window for debugging
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}

export default i18n;
