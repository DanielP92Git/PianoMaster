import { useState } from "react";
import { useTranslation } from "react-i18next";
import AuthSelect from "./AuthSelect";
import AuthInput from "./AuthInput";
import AuthCta from "./AuthCta";
import { isValidDOB, dobPartsToDate, isUnder18 } from "../../utils/ageUtils";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Open-field Month/Day/Year date-of-birth gate (D-08, SIGNUP-01).
 *
 * Replaces the old year-only dropdown with a neutral, FTC-defensible
 * open-field DOB entry. A valid 18+ DOB calls onSubmit; a valid under-18
 * DOB calls onUnder18 (D-10: no data persisted, no data forwarded to
 * onSubmit); an invalid/incomplete DOB shows the red error banner and
 * calls neither.
 *
 * Back navigation is owned by the shell (see SignupForm), not this step.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with { month, day, year } for an 18+ DOB
 * @param {Function} props.onUnder18 - Called (no args) for an under-18 DOB
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function AgeGate({ onSubmit, onUnder18, disabled = false }) {
  const { t } = useTranslation("common");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const dob = { month: Number(month), day: Number(day), year: Number(year) };
    if (!isValidDOB(dob)) {
      setError(t("auth.signup.ageGate.errorInvalid"));
      return;
    }

    const birthDate = dobPartsToDate(dob);
    if (isUnder18(birthDate)) {
      onUnder18(); // D-10: routes to AgeBlockScreen, no data persisted
      return;
    }

    onSubmit(dob); // D-09: caller (SignupForm) discards the DOB after this point
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-center text-[14.5px] text-white/[0.82]">
        {t("auth.signup.dobGate.heading")}
      </p>

      {error && (
        <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <AuthSelect
          id="signup-dob-month"
          label={t("auth.signup.dobGate.month")}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          disabled={disabled}
          required
        >
          <option value="">{t("auth.signup.dobGate.selectMonth")}</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </AuthSelect>
        <AuthInput
          id="signup-dob-day"
          type="number"
          label={t("auth.signup.dobGate.day")}
          value={day}
          onChange={(e) => setDay(e.target.value)}
          disabled={disabled}
          required
        />
        <AuthInput
          id="signup-dob-year"
          type="number"
          label={t("auth.signup.dobGate.year")}
          value={year}
          onChange={(e) => setYear(e.target.value)}
          disabled={disabled}
          required
        />
      </div>

      <AuthCta variant="secondary" type="submit" disabled={disabled}>
        {t("auth.signup.ageGate.continue")}
      </AuthCta>
    </form>
  );
}

export default AgeGate;
