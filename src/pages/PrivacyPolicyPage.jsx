import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
} from 'lucide-react';

/**
 * Public privacy policy page — no auth required.
 * COPPA-compliant privacy policy for PianoMaster.
 * Fully translated via i18n (privacy.* keys).
 */
function PrivacyPolicyPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back to home link */}
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('privacy.backHome')}
        </Link>

        {/* Main card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {t('privacy.title')}
            </h1>
            <p className="text-white/60 text-sm">
              PianoMaster — {t('privacy.subtitle')}
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-6">
            {/* 1. Data We Collect */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.dataCollect.title')}
              </h2>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataCollect.dobLabel')}</span> — {t('privacy.dataCollect.dobDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataCollect.parentEmailLabel')}</span> — {t('privacy.dataCollect.parentEmailDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataCollect.progressLabel')}</span> — {t('privacy.dataCollect.progressDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataCollect.activityLabel')}</span> — {t('privacy.dataCollect.activityDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataCollect.localStorageLabel')}</span> — {t('privacy.dataCollect.localStorageDesc')}
                </li>
              </ul>
            </section>

            {/* 2. How We Use Your Data */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.dataUse.title')}
              </h2>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataUse.personalizeLabel')}</span> — {t('privacy.dataUse.personalizeDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataUse.trackLabel')}</span> — {t('privacy.dataUse.trackDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataUse.remindersLabel')}</span> — {t('privacy.dataUse.remindersDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">{t('privacy.dataUse.subscriptionsLabel')}</span> — {t('privacy.dataUse.subscriptionsDesc')}
                </li>
              </ul>
            </section>

            {/* 3. Third-Party Services */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.thirdParty.title')}
              </h2>
              <p className="text-sm text-white/80 mb-3">
                {t('privacy.thirdParty.intro')}
              </p>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>
                  <span className="font-medium text-white/90">Supabase</span> — {t('privacy.thirdParty.supabaseDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">Brevo</span> — {t('privacy.thirdParty.brevoDesc')}
                </li>
                <li>
                  <span className="font-medium text-white/90">Lemon Squeezy</span> — {t('privacy.thirdParty.lemonDesc')}
                </li>
              </ul>
              <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-sm text-white/90 font-medium">
                  {t('privacy.thirdParty.noSell')}
                </p>
              </div>
            </section>

            {/* 4. Parental Rights (COPPA) */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.parentalRights.title')}
              </h2>
              <p className="text-sm text-white/80 mb-3">
                {t('privacy.parentalRights.intro')}
              </p>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>{t('privacy.parentalRights.consent')}</li>
                <li>{t('privacy.parentalRights.review')}</li>
                <li>{t('privacy.parentalRights.export')}</li>
                <li>{t('privacy.parentalRights.deletion')}</li>
                <li>{t('privacy.parentalRights.minimum')}</li>
              </ul>
            </section>

            {/* 5. Data Retention */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.dataRetention.title')}
              </h2>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>{t('privacy.dataRetention.active')}</li>
                <li>{t('privacy.dataRetention.gracePeriod')}</li>
                <li>{t('privacy.dataRetention.permanent')}</li>
                <li>{t('privacy.dataRetention.immediate')}</li>
              </ul>
            </section>

            {/* 6. Cookies & Local Storage */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Cookie className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.cookies.title')}
              </h2>
              <ul className="space-y-2 text-sm text-white/80 list-disc list-inside ml-1">
                <li>{t('privacy.cookies.noTracking')}</li>
                <li>{t('privacy.cookies.localStorageUse')}</li>
                <li>{t('privacy.cookies.deviceOnly')}</li>
              </ul>
            </section>

            {/* 7. Contact */}
            <section className="bg-white/5 rounded-xl p-5 border border-white/10">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                {t('privacy.contact.title')}
              </h2>
              <p className="text-sm text-white/80">
                {t('privacy.contact.desc')}
              </p>
              <a
                href="mailto:support@pianomaster.app"
                className="inline-block mt-2 text-indigo-300 hover:text-indigo-200 underline text-sm transition-colors"
              >
                support@pianomaster.app
              </a>
            </section>

            {/* Last Updated */}
            <div className="text-center pt-2">
              <p className="text-white/50 text-xs">
                {t('privacy.lastUpdated')}: March 2026
              </p>
            </div>

            {/* Terms of Service link */}
            <div className="text-center pt-2 pb-2 border-t border-white/10">
              <Link
                to="/legal"
                className="text-indigo-300 hover:text-indigo-200 underline text-sm transition-colors"
              >
                {t('privacy.termsLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
