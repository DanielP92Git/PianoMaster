import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

/**
 * Generate a two-digit addition problem for parent verification (COPPA knowledge-based gate).
 * a: 20-60, b: 15-40
 * @returns {{ expression: string, answer: number }}
 */
function generateMathProblem() {
  const a = Math.floor(Math.random() * 41) + 20; // 20-60
  const b = Math.floor(Math.random() * 26) + 15; // 15-40
  return { expression: `${a} + ${b}`, answer: a + b };
}

/**
 * Parent verification gate using a math problem.
 * Shown to verify a parent (not the child) is enabling push notifications.
 *
 * Props:
 *   onConsent  - called when parent solves the problem correctly
 *   onCancel   - called when parent dismisses the gate
 *   isRTL      - RTL layout support
 */
export function ParentGateMath({ onConsent, onCancel, isRTL = false }) {
  const { t } = useTranslation();
  const [problem, setProblem] = useState(() => generateMathProblem());
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseInt(answer, 10);
    if (parsed === problem.answer) {
      onConsent();
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(true);
      setProblem(generateMathProblem());
      setAnswer("");
    }
  };

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
    if (error) setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-sm space-y-5 rounded-xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div
          className={`flex items-start justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className={isRTL ? "text-right" : ""}>
            <h3 className="text-lg font-bold leading-tight text-white">
              {t("parentGate.title")}
            </h3>
            <p className="mt-1 text-sm text-white/70">
              {t("parentGate.subtitle")}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label={t("parentGate.cancel")}
            className="flex-shrink-0 text-white/60 transition-colors hover:text-white/90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Math problem */}
        <div className="flex items-center justify-center py-4">
          <div className="select-none text-4xl font-black tracking-wide text-white">
            {problem.expression} = ?
          </div>
        </div>

        {/* Answer form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={answer}
            onChange={handleAnswerChange}
            placeholder={t("parentGate.placeholder")}
            className={`w-full border bg-white/10 ${
              error ? "border-red-400/70" : "border-white/20"
            } rounded-lg px-4 py-3 text-center text-xl font-bold text-white placeholder-white/40 transition-colors focus:border-indigo-400/70 focus:outline-none focus:ring-1 focus:ring-indigo-400/40`}
            autoFocus
          />

          {error && (
            <p className={`text-sm text-red-300 ${isRTL ? "text-right" : ""}`}>
              {t("parentGate.wrong")}
            </p>
          )}

          {attempts >= 3 && (
            <p className={`text-xs text-white/50 ${isRTL ? "text-right" : ""}`}>
              {t("parentGate.hint")}
            </p>
          )}

          <button
            type="submit"
            disabled={!answer.trim()}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("parentGate.submit")}
          </button>
        </form>

        {/* Cancel link */}
        <div className={`text-center ${isRTL ? "text-right" : ""}`}>
          <button
            onClick={onCancel}
            className="text-sm text-white/50 transition-colors hover:text-white/80"
          >
            {t("parentGate.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParentGateMath;
