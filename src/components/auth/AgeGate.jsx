import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Birth year collection step (simplified from full DOB for COPPA).
 * Renders a single year dropdown. Calls onSubmit with an integer year.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with integer birth year (e.g. 2014)
 * @param {Function} props.onBack - Back button handler
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function AgeGate({ onSubmit, onBack, disabled = false }) {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const [year, setYear] = useState("");
  const [error, setError] = useState(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!year) {
      setError(t("auth.signup.ageGate.errorRequired"));
      return;
    }

    const parsedYear = parseInt(year, 10);
    if (isNaN(parsedYear) || parsedYear > currentYear || parsedYear < currentYear - 100) {
      setError(t("auth.signup.ageGate.errorInvalid"));
      return;
    }

    onSubmit(parsedYear);
  };

  const selectClass = `w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2
    border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50
    transition-all duration-300 text-white`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
        >
          {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          {t("auth.signup.back")}
        </button>
      )}

      <div className="text-center mb-2">
        <p className="text-white/90 text-sm">{t("auth.signup.ageGate.question")}</p>
      </div>

      {error && (
        <div className="p-2 text-xs text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg">
          {error}
        </div>
      )}

      <div className="max-w-[200px] mx-auto">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className={selectClass}
          disabled={disabled}
          required
          aria-label="Birth year"
        >
          <option value="" className="text-gray-900">{t("auth.signup.ageGate.selectYear")}</option>
          {years.map((y) => (
            <option key={y} value={y} className="text-gray-900">
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {t("auth.signup.ageGate.continue")}
        </button>
      </div>
    </form>
  );
}

export default AgeGate;
