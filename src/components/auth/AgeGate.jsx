import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthSelect from "./AuthSelect";
import AuthCta from "./AuthCta";

/**
 * Birth year collection step (simplified from full DOB for COPPA).
 * Renders a single year dropdown. Calls onSubmit with an integer year.
 *
 * Back navigation is owned by the shell (see SignupForm), not this step.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with integer birth year (e.g. 2014)
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function AgeGate({ onSubmit, disabled = false }) {
  const { t } = useTranslation("common");
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
    if (
      isNaN(parsedYear) ||
      parsedYear > currentYear ||
      parsedYear < currentYear - 100
    ) {
      setError(t("auth.signup.ageGate.errorInvalid"));
      return;
    }

    onSubmit(parsedYear);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-center text-[14.5px] text-white/[0.82]">
        {t("auth.signup.ageGate.question")}
      </p>

      {error && (
        <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
          {error}
        </div>
      )}

      <AuthSelect
        id="signup-birth-year"
        label={t("auth.signup.ageGate.label")}
        value={year}
        onChange={(e) => setYear(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">{t("auth.signup.ageGate.selectYear")}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </AuthSelect>

      <AuthCta variant="secondary" type="submit" disabled={disabled}>
        {t("auth.signup.ageGate.continue")}
      </AuthCta>
    </form>
  );
}

export default AgeGate;
