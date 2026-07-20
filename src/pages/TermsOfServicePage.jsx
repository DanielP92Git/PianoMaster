import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, FileText } from "lucide-react";

/**
 * Terms of Service — public page (no auth required).
 * Fully translated via i18n (legal.tos.* keys).
 */
function TermsOfServicePage() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();

  // Public page — see the note in PrivacyPolicyPage; /settings is auth-gated.
  const goBack = () =>
    window.history.length > 1 ? navigate(-1) : navigate("/");

  const sectionKeys = [
    "acceptance",
    "accounts",
    "subscriptions",
    "acceptableUse",
    "ip",
    "liability",
    "changes",
    "contact",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4">
      <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-lg md:p-8">
        {/* Back link */}
        <button
          type="button"
          onClick={goBack}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-indigo-300 transition-colors hover:text-indigo-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("legal.backToHome")}
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {t("legal.tosTitle")}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {t("legal.tosLastUpdated")}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sectionKeys.map((key) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <h2 className="mb-2 text-sm font-semibold text-white/90">
                {t(`legal.tos.${key}.title`)}
              </h2>
              <p className="text-sm leading-relaxed text-white/70">
                {t(`legal.tos.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy Policy link */}
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/50">
            {t("legal.tosPrivacyNote")}{" "}
            <Link
              to="/privacy"
              className="text-indigo-400 underline hover:text-indigo-300"
            >
              {t("legal.privacyPolicyLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;
