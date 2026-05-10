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
import {
  DURATION_INFO,
  getSyllable as getDurationSyllable,
} from "../utils/durationInfo";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";

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
  // isLandscape no longer used — Tailwind landscape: variant drives grid.
  // Kept as accepted prop for backward compatibility with existing callers.
  isLandscape: _isLandscape,
  onSelect,
  disabled,
}) {
  const { t, i18n } = useTranslation("common");

  // Card grid always fits portrait (2x2) — declare false (CORE-05).
  useDeclareNeedsLandscape(false);

  // Syllable lookup helper — delegates to durationInfo.getSyllable so the
  // info.syllable override (e.g., "8_pair" → "ti-ti") is honored. Without this
  // delegation, two cards could render the same syllable text when the dedup
  // pass in generateQuestions misses an override-only collision (bug 2).
  const getSyllable = useCallback(
    (code) => getDurationSyllable(code, i18n.language) || code,
    [i18n.language]
  );

  const SvgIcon = SVG_COMPONENTS[question.correct];

  return (
    <>
      {/* Prompt panel with large SVG */}
      <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div dir="ltr" className="flex items-center justify-center text-white">
          {SvgIcon && (
            <SvgIcon
              className="h-24 w-auto landscape:max-md:h-16"
              aria-label={t(DURATION_INFO[question.correct].i18nKey)}
            />
          )}
        </div>
        <p className="mt-2 text-center text-base text-white/60">
          {t("syllableMatching.prompt")}
        </p>
      </div>

      {/* Card grid — 2x2 phone-portrait, 1x4 phone-landscape, 2x2 tablet
          (D-05/D-06; literal classes for Tailwind purge per RESEARCH Pitfall 5). */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6 landscape:max-md:grid-cols-4">
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
