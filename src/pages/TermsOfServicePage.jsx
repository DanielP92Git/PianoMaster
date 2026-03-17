import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FileText } from 'lucide-react';

/**
 * Terms of Service — public page (no auth required).
 * Fully translated via i18n (legal.tos.* keys).
 */
function TermsOfServicePage() {
  const { t } = useTranslation('common');

  const sectionKeys = [
    'acceptance',
    'accounts',
    'subscriptions',
    'acceptableUse',
    'ip',
    'liability',
    'changes',
    'contact',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl p-6 md:p-8 my-8">
        {/* Back to home link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('legal.backToHome')}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {t('legal.tosTitle')}
          </h1>
          <p className="text-white/60 text-sm mt-2">
            {t('legal.tosLastUpdated')}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sectionKeys.map((key) => (
            <div
              key={key}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <h2 className="text-sm font-semibold text-white/90 mb-2">
                {t(`legal.tos.${key}.title`)}
              </h2>
              <p className="text-sm text-white/70 leading-relaxed">
                {t(`legal.tos.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy Policy link */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/50 text-xs">
            {t('legal.tosPrivacyNote')}{' '}
            <Link
              to="/legal"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              {t('legal.privacyPolicyLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;
