/**
 * VisualRecognitionQuestion.jsx
 *
 * Stateless renderer for visual recognition quiz questions.
 * Shows a "Which one is a [duration]?" prompt and a 2x2 (portrait)
 * or 1x4 (landscape) grid of SVG icon DurationCards.
 *
 * Consumed by:
 * - VisualRecognitionGame (standalone game wrapper)
 * - MixedLessonGame (unified engine, Plan 03)
 *
 * Contract: NO useState, NO useEffect, NO useNavigate, NO useSounds.
 */

import { useTranslation } from "react-i18next";
import DurationCard from "../components/DurationCard";
import { DURATION_INFO } from "../utils/durationInfo";

/**
 * @param {Object} props
 * @param {{ correct: string, choices: string[] }} props.question - Current question
 * @param {string[]} props.cardStates - Array of 4 card states ('default'|'correct'|'wrong'|'dimmed')
 * @param {boolean} props.isLandscape - Whether device is in landscape orientation
 * @param {(cardIndex: number) => void} props.onSelect - Card selection callback
 * @param {boolean} props.disabled - Whether cards are disabled (during feedback)
 */
export default function VisualRecognitionQuestion({
  question,
  cardStates,
  isLandscape,
  onSelect,
  disabled,
}) {
  const { t } = useTranslation("common");

  const durationName = t(DURATION_INFO[question.correct].i18nKey);
  const promptText = t("visualRecognition.prompt", { durationName });

  const gridClass = isLandscape
    ? "grid grid-cols-4 gap-3 w-full max-w-2xl"
    : "grid grid-cols-2 gap-4 w-full max-w-sm";

  return (
    <>
      {/* Prompt heading */}
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
        <h2 className="text-center text-xl font-bold text-white">
          {promptText}
        </h2>
      </div>

      {/* Card grid */}
      <div className={gridClass}>
        {question.choices.map((choice, i) => (
          <DurationCard
            key={`${question.correct}-${i}`}
            type="icon"
            durationCode={choice}
            state={cardStates[i]}
            onSelect={onSelect}
            disabled={disabled}
            cardIndex={i}
            ariaLabel={t(DURATION_INFO[choice].i18nKey)}
          />
        ))}
      </div>
    </>
  );
}
