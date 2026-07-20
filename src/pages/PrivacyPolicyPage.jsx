import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  Clock,
  Users,
  Server,
  Trash2,
  Cookie,
  Mail,
} from "lucide-react";

/**
 * Public privacy policy page — no auth required.
 * COPPA-compliant privacy policy for PianoMaster.
 * Fully translated via i18n (privacy.* keys).
 */
function PrivacyPolicyPage() {
  const { t } = useTranslation("common");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Back to home link */}
        <Link
          to="/settings"
          className="mb-6 inline-flex items-center gap-2 text-white/70 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("privacy.backHome")}
        </Link>

        {/* Main card */}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-lg md:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              {t("privacy.title")}
            </h1>
            <p className="text-sm text-white/60">
              PianoMaster — {t("privacy.subtitle")}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {/* 1. Data We Collect */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Database className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.dataCollect.title")}
              </h2>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataCollect.dobLabel")}
                  </span>{" "}
                  — {t("privacy.dataCollect.dobDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataCollect.parentEmailLabel")}
                  </span>{" "}
                  — {t("privacy.dataCollect.parentEmailDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataCollect.progressLabel")}
                  </span>{" "}
                  — {t("privacy.dataCollect.progressDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataCollect.activityLabel")}
                  </span>{" "}
                  — {t("privacy.dataCollect.activityDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataCollect.localStorageLabel")}
                  </span>{" "}
                  — {t("privacy.dataCollect.localStorageDesc")}
                </li>
              </ul>
            </section>

            {/* 2. How We Use Your Data */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Clock className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.dataUse.title")}
              </h2>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataUse.personalizeLabel")}
                  </span>{" "}
                  — {t("privacy.dataUse.personalizeDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataUse.trackLabel")}
                  </span>{" "}
                  — {t("privacy.dataUse.trackDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataUse.remindersLabel")}
                  </span>{" "}
                  — {t("privacy.dataUse.remindersDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    {t("privacy.dataUse.subscriptionsLabel")}
                  </span>{" "}
                  — {t("privacy.dataUse.subscriptionsDesc")}
                </li>
              </ul>
            </section>

            {/* 3. Third-Party Services */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Server className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.thirdParty.title")}
              </h2>
              <p className="mb-3 text-sm text-white/80">
                {t("privacy.thirdParty.intro")}
              </p>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>
                  <span className="font-medium text-white/90">Supabase</span> —{" "}
                  {t("privacy.thirdParty.supabaseDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">Brevo</span> —{" "}
                  {t("privacy.thirdParty.brevoDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">
                    Lemon Squeezy
                  </span>{" "}
                  — {t("privacy.thirdParty.lemonDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">Umami</span> —{" "}
                  {t("privacy.thirdParty.umamiDesc")}
                </li>
                <li>
                  <span className="font-medium text-white/90">Sentry</span> —{" "}
                  {t("privacy.thirdParty.sentryDesc")}
                </li>
              </ul>
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-white/90">
                  {t("privacy.thirdParty.noSell")}
                </p>
              </div>
            </section>

            {/* 4. Parental Rights (COPPA) */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Users className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.parentalRights.title")}
              </h2>
              <p className="mb-3 text-sm text-white/80">
                {t("privacy.parentalRights.intro")}
              </p>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>{t("privacy.parentalRights.consent")}</li>
                <li>{t("privacy.parentalRights.review")}</li>
                <li>{t("privacy.parentalRights.export")}</li>
                <li>{t("privacy.parentalRights.deletion")}</li>
                <li>{t("privacy.parentalRights.minimum")}</li>
              </ul>
            </section>

            {/* 5. Data Retention */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Trash2 className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.dataRetention.title")}
              </h2>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>{t("privacy.dataRetention.active")}</li>
                <li>{t("privacy.dataRetention.gracePeriod")}</li>
                <li>{t("privacy.dataRetention.permanent")}</li>
                <li>{t("privacy.dataRetention.immediate")}</li>
              </ul>
            </section>

            {/* 6. Cookies & Local Storage */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Cookie className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.cookies.title")}
              </h2>
              <ul className="ml-1 list-inside list-disc space-y-2 text-sm text-white/80">
                <li>{t("privacy.cookies.noTracking")}</li>
                <li>{t("privacy.cookies.localStorageUse")}</li>
                <li>{t("privacy.cookies.deviceOnly")}</li>
              </ul>
            </section>

            {/* 7. Contact */}
            <section className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
                <Mail className="h-5 w-5 flex-shrink-0 text-indigo-400" />
                {t("privacy.contact.title")}
              </h2>
              <p className="text-sm text-white/80">
                {t("privacy.contact.desc")}
              </p>
              <a
                href="mailto:support@pianomaster.app"
                className="mt-2 inline-block text-sm text-indigo-300 underline transition-colors hover:text-indigo-200"
              >
                support@pianomaster.app
              </a>
            </section>

            {/* Last Updated */}
            <div className="pt-2 text-center">
              <p className="text-xs text-white/50">
                {t("privacy.lastUpdated")}: March 2026
              </p>
            </div>

            {/* Terms of Service link */}
            <div className="border-t border-white/10 pb-2 pt-2 text-center">
              <Link
                to="/terms"
                className="text-sm text-indigo-300 underline transition-colors hover:text-indigo-200"
              >
                {t("privacy.termsLink")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
