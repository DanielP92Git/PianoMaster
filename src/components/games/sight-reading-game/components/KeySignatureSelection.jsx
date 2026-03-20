import React from "react";
import { useTranslation } from "react-i18next";
import { KEY_SIGNATURE_OPTIONS } from "../constants/keySignatureConfig.js";

/**
 * Key signature selection step for the UnifiedGameSettings wizard.
 * Renders 7 selectable key options (C, G, D, A, F, Bb, Eb) with glassmorphism styling.
 *
 * @param {Object} props
 * @param {Object} props.settings - Current game settings (reads settings.keySignature)
 * @param {Function} props.updateSetting - Callback to update a single setting key
 */
export function KeySignatureSelection({ settings, updateSetting }) {
  const { t } = useTranslation("common");
  const selectedKey = settings.keySignature ?? null;

  const handleSelect = (value) => {
    updateSetting("keySignature", value);
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <div className="grid grid-cols-2 gap-3">
        {KEY_SIGNATURE_OPTIONS.map((option) => {
          const isSelected = selectedKey === option.value;
          return (
            <button
              key={option.value ?? "C"}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(option.value)}
              className={[
                "rounded-xl border p-3 text-center cursor-pointer transition-colors min-h-[44px] min-w-[44px]",
                "focus:ring-2 focus:ring-white/50 focus:outline-none",
                isSelected
                  ? "border-indigo-400 bg-indigo-600/30"
                  : "border-white/20 bg-white/10 hover:bg-white/15",
              ].join(" ")}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-semibold text-white">
                  {t(option.labelKey)}
                </span>
                <span className="text-xs text-indigo-300">
                  {t(option.badgeKey)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
