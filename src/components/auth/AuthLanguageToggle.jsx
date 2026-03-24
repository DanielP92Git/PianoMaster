import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "he", label: "עב" },
];

export function AuthLanguageToggle() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || "en";

  return (
    <div className="flex rounded-full bg-white/10 backdrop-blur-sm border border-white/15 overflow-hidden">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => {
            if (lang.code !== current) i18n.changeLanguage(lang.code);
          }}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            lang.code === current
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white/90"
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
