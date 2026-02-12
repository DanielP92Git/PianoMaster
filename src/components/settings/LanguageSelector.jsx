import { useTranslation } from "react-i18next";
import { Languages, ChevronDown, Check } from "lucide-react";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "he", label: "עברית", flag: "🇮🇱" },
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation("common");
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";
  const isRTL = i18n.dir() === "rtl";

  const handleChange = (event) => {
    const nextLang = event.target.value;
    if (nextLang !== currentLanguage) {
      i18n.changeLanguage(nextLang);
    }
  };

  const currentOption = LANGUAGE_OPTIONS.find(
    (opt) => opt.value === currentLanguage
  );

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden">
      <div className={`p-6 ${isRTL ? "text-right" : ""}`}>
        <div
          className={`flex items-center gap-4 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Languages className="w-6 h-6 text-white" />
          </div>
          <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            <h3 className="text-xl font-bold text-white">
              {t("pages.settings.languageTitle")}
            </h3>
            <p className="text-sm text-white/70 mt-1">
              {t("pages.settings.languageDescription")}
            </p>
          </div>
        </div>

    

        {/* Language options as buttons (alternative visual representation) */}
        <div
          className={`mt-4 grid grid-cols-2 gap-3 ${isRTL ? "text-right" : ""}`}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                if (option.value !== currentLanguage) {
                  i18n.changeLanguage(option.value);
                }
              }}
              className={`
                relative flex items-center gap-3 p-3 rounded-xl
                transition-all duration-200
                ${isRTL ? "flex-row-reverse" : ""}
                ${
                  option.value === currentLanguage
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                }
              `}
            >
              <span className="font-medium text-sm flex-1">{option.label}</span>
              {option.value === currentLanguage && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
