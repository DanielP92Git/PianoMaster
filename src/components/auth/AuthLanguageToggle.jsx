import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "he", label: "עב" },
];

export function AuthLanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || "en";

  return (
    <div className="flex gap-[2px] rounded-full border border-white/[0.22] bg-white/[0.12] p-[3px] backdrop-blur-[8px]">
      {LANGUAGES.map((lang) => {
        // `startsWith` so `he-IL` still matches the Hebrew pill.
        const isActive = current.startsWith(lang.code);
        return (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            aria-pressed={isActive}
            onClick={() => {
              if (!isActive) i18n.changeLanguage(lang.code);
            }}
            className={`rounded-full px-[11px] py-[5px] text-xs transition-colors ${
              isActive
                ? "bg-white font-bold text-[#1e1b4b]"
                : "font-semibold text-white/85 hover:text-white"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
