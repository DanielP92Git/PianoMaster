/**
 * SyllableMatchingQuestion.jsx
 *
 * Stateless renderer for syllable matching quiz questions.
 * Shows a large SVG note icon prompt with "What syllable is this?"
 * and a 2x2 (portrait) or 1x4 (landscape) grid of text DurationCards
 * displaying Kodaly syllables.
 *
 * Consumed by:
 * - SyllableMatchingGame (standalone game wrapper)
 * - MixedLessonGame (unified engine, Plan 03)
 *
 * Contract: NO useState, NO useEffect, NO useNavigate, NO useSounds.
 */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import DurationCard, { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO } from "../utils/durationInfo";
import {
  SYLLABLE_MAP_EN,
  SYLLABLE_MAP_HE,
  REST_SYLLABLE_EN,
  REST_SYLLABLE_HE,
} from "../utils/rhythmVexflowHelpers";

/**
 * @param {Object} props
 * @param {{ correct: string, choices: string[] }} props.question - Current question
 * @param {string[]} props.cardStates - Array of 4 card states ('default'|'correct'|'wrong'|'dimmed')
 * @param {boolean} props.isLandscape - Whether device is in landscape orientation
 * @param {(cardIndex: number) => void} props.onSelect - Card selection callback
 * @param {boolean} props.disabled - Whether cards are disabled (during feedback)
 */
export default function SyllableMatchingQuestion({
  question,
  cardStates,
  isLandscape,
  onSelect,
  disabled,
}) {
  const { t, i18n } = useTranslation("common");

  // Syllable lookup helper
  const getSyllable = useCallback(
    (code) => {
      const info = DURATION_INFO[code];
      if (!info) return code;
      const lang = i18n.language;
      if (info.isRest)
        return lang === "he" ? REST_SYLLABLE_HE : REST_SYLLABLE_EN;
      const map = lang === "he" ? SYLLABLE_MAP_HE : SYLLABLE_MAP_EN;
      return map[info.durationUnits] || code;
    },
    [i18n.language]
  );

  const SvgIcon = SVG_COMPONENTS[question.correct];

  const gridClass = isLandscape
    ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
    : "grid grid-cols-2 gap-4 w-full max-w-sm";

  return (
    <>
      {/* Prompt panel with large SVG */}
      <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div dir="ltr" className="flex items-center justify-center text-white">
          {SvgIcon && (
            <SvgIcon
              className={`${isLandscape ? "h-16" : "h-24"} w-auto`}
              aria-label={t(DURATION_INFO[question.correct].i18nKey)}
            />
          )}
        </div>
        <p className="mt-2 text-center text-base text-white/60">
          {t("syllableMatching.prompt")}
        </p>
      </div>

      {/* Card grid */}
      <div className={gridClass}>
        {question.choices.map((choice, i) => {
          const syllable = getSyllable(choice);
          return (
            <DurationCard
              key={`${question.correct}-${i}`}
              type="text"
              text={syllable}
              state={cardStates[i]}
              onSelect={onSelect}
              disabled={disabled}
              cardIndex={i}
              ariaLabel={syllable}
            />
          );
        })}
      </div>
    </>
  );
}
