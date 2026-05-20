/**
 * CountSubdivisionQuestion.jsx
 *
 * Stateless renderer for subdivision-counting quiz questions.
 * Shows a large SVG note icon prompt ("How many eighth notes make a ...?")
 * and a 2x2 (portrait) or 1x4 (landscape) grid of numeric DurationCards.
 *
 * Used in the 6/8 trail (Unit 7) to teach that one dotted quarter note equals
 * three eighth notes — a clearer task than syllable recall, whose dotted-quarter
 * syllable ("ta-a") collides with the half note's.
 *
 * Consumed by:
 * - MixedLessonGame (unified engine)
 *
 * Contract: NO useState, NO useEffect, NO useNavigate, NO useSounds.
 */

import { useTranslation } from "react-i18next";
import DurationCard, { SVG_COMPONENTS } from "../components/DurationCard";
import { DURATION_INFO } from "../utils/durationInfo";
import { useDeclareNeedsLandscape } from "../../../../contexts/NeedsLandscapeContext";

/**
 * @param {Object} props
 * @param {{ correct: number, choices: number[], target: string }} props.question - Current question
 * @param {string[]} props.cardStates - Array of 4 card states ('default'|'correct'|'wrong'|'dimmed')
 * @param {boolean} props.isLandscape - Whether device is in landscape orientation
 * @param {(cardIndex: number) => void} props.onSelect - Card selection callback
 * @param {boolean} props.disabled - Whether cards are disabled (during feedback)
 */
export default function CountSubdivisionQuestion({
  question,
  cardStates,
  // isLandscape no longer used — Tailwind landscape: variant drives grid.
  // Kept as accepted prop for backward compatibility with existing callers.
  isLandscape: _isLandscape,
  onSelect,
  disabled,
}) {
  const { t } = useTranslation("common");

  // Card grid always fits portrait (2x2) — declare false (CORE-05).
  useDeclareNeedsLandscape(false);

  const SvgIcon = SVG_COMPONENTS[question.target];
  const durationName = t(DURATION_INFO[question.target].i18nKey);
  const promptText = t("countSubdivision.prompt", { durationName });

  return (
    <>
      {/* Prompt panel with large SVG */}
      <div className="flex flex-col items-center rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <div dir="ltr" className="flex items-center justify-center text-white">
          {SvgIcon && (
            <SvgIcon
              className="h-24 w-auto landscape:max-md:h-16"
              aria-label={durationName}
            />
          )}
        </div>
        <p className="mt-2 text-center text-base text-white/60">{promptText}</p>
      </div>

      {/* Card grid — 2x2 phone-portrait, 1x4 phone-landscape, 2x2 tablet
          (D-05/D-06; literal classes for Tailwind purge per RESEARCH Pitfall 5). */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3 md:max-w-2xl md:grid-cols-2 md:gap-4 lg:max-w-4xl lg:grid-cols-2 lg:gap-6 landscape:max-md:grid-cols-4">
        {question.choices.map((choice, i) => (
          <DurationCard
            key={`${question.target}-${i}`}
            type="text"
            text={String(choice)}
            state={cardStates[i]}
            onSelect={onSelect}
            disabled={disabled}
            cardIndex={i}
            ariaLabel={String(choice)}
          />
        ))}
      </div>
    </>
  );
}
