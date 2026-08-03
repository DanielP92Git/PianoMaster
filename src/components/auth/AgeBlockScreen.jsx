import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthCta from "./AuthCta";

/**
 * Friendly under-18 dead-end (D-10, SIGNUP-02).
 *
 * Renders guidance in the blue informational tone — never the red error
 * treatment — with two low-emphasis ghost actions. This screen creates,
 * persists, and logs nothing (D-11): no Supabase call, no analytics, no
 * console output. It renders inside the wizard's existing AuthShell frame
 * supplied by the caller.
 *
 * @param {Object} props
 * @param {Function} props.onTryAgain - Called when the user wants to re-enter their DOB
 * @param {Function} props.onBackToLogin - Called when the user wants to return to login
 */
export function AgeBlockScreen({ onTryAgain, onBackToLogin }) {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[14px] border border-[rgba(96,165,250,0.35)] bg-[rgba(37,99,235,0.22)] p-3">
        <div className="flex gap-2.5">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[#93c5fd]"
            aria-hidden="true"
          />
          <div className="text-[13px]">
            <p className="mb-1 font-semibold text-white">
              {t("auth.signup.ageBlock.title")}
            </p>
            <p className="leading-[1.5] text-white/70">
              {t("auth.signup.ageBlock.body")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <AuthCta variant="ghost" onClick={onTryAgain}>
          {t("auth.signup.ageBlock.tryAgain")}
        </AuthCta>
        <AuthCta variant="ghost" onClick={onBackToLogin}>
          {t("auth.signup.ageBlock.backToLogin")}
        </AuthCta>
      </div>
    </div>
  );
}

export default AgeBlockScreen;
