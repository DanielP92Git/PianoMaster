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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl p-6 space-y-5"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={isRTL ? "text-right" : ""}>
            <h3 className="text-white font-bold text-lg leading-tight">
              {t("pages.settings.notifications.parentGate.title")}
            </h3>
            <p className="text-white/70 text-sm mt-1">
              {t("pages.settings.notifications.parentGate.subtitle")}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label={t("pages.settings.notifications.parentGate.cancel")}
            className="text-white/60 hover:text-white/90 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Math problem */}
        <div className="flex items-center justify-center py-4">
          <div className="text-4xl font-black text-white tracking-wide select-none">
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
            placeholder={t("pages.settings.notifications.parentGate.placeholder")}
            className={`w-full bg-white/10 border ${
              error ? "border-red-400/70" : "border-white/20"
            } rounded-lg px-4 py-3 text-white text-center text-xl font-bold placeholder-white/40 focus:outline-none focus:border-indigo-400/70 focus:ring-1 focus:ring-indigo-400/40 transition-colors`}
            autoFocus
          />

          {error && (
            <p className={`text-red-300 text-sm ${isRTL ? "text-right" : ""}`}>
              {t("pages.settings.notifications.parentGate.wrong")}
            </p>
          )}

          {attempts >= 3 && (
            <p className={`text-white/50 text-xs ${isRTL ? "text-right" : ""}`}>
              {t("pages.settings.notifications.parentGate.hint")}
            </p>
          )}

          <button
            type="submit"
            disabled={!answer.trim()}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {t("pages.settings.notifications.parentGate.submit")}
          </button>
        </form>

        {/* Cancel link */}
        <div className={`text-center ${isRTL ? "text-right" : ""}`}>
          <button
            onClick={onCancel}
            className="text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            {t("pages.settings.notifications.parentGate.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ParentGateMath;
