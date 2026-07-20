import { useState } from "react";
import { Mail, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthInput from "./AuthInput";
import AuthCta from "./AuthCta";

/**
 * Optional parent email collection step for under-13 students.
 * Email is used for weekly progress reports and push notification reminders (D-06).
 * User can skip this step entirely (D-07).
 *
 * Back navigation is owned by the shell (see SignupForm), not this step.
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with parent email string
 * @param {Function} props.onSkip - Called when user skips (no arguments)
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function ParentEmailStep({ onSubmit, onSkip, disabled = false }) {
  const { t } = useTranslation("common");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!parentEmail) {
      setError(t("auth.signup.parentEmail.errorRequired"));
      return;
    }

    // Basic email validation (same regex as before)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError(t("auth.signup.parentEmail.errorInvalid"));
      return;
    }

    onSubmit(parentEmail.toLowerCase().trim());
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Info banner — purpose-driven messaging per D-06/D-14 */}
      <div className="rounded-[14px] border border-[rgba(96,165,250,0.35)] bg-[rgba(37,99,235,0.22)] p-3">
        <div className="flex gap-2.5">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#93c5fd]"
            aria-hidden="true"
          />
          <div className="text-[13px]">
            <p className="mb-1 font-semibold text-white">
              {t("auth.signup.parentEmail.title")}
            </p>
            <p className="leading-[1.5] text-white/70">
              {t("auth.signup.parentEmail.description")}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
            {error}
          </div>
        )}

        <AuthInput
          id="parent-email"
          type="email"
          label={t("auth.signup.parentEmail.label")}
          icon={Mail}
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          placeholder={t("auth.signup.parentEmail.placeholder")}
          disabled={disabled}
          autoComplete="email"
        />

        <div className="flex gap-3">
          <AuthCta variant="ghost" onClick={onSkip} disabled={disabled}>
            {t("auth.signup.parentEmail.skip")}
          </AuthCta>
          <AuthCta variant="secondary" type="submit" disabled={disabled}>
            {t("auth.signup.parentEmail.continue")}
          </AuthCta>
        </div>
      </form>
    </div>
  );
}

export default ParentEmailStep;
