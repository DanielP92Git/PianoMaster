import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle, ShieldCheck, Database, Clock, Trash2 } from 'lucide-react';
import { verifyParentalConsent } from '../services/consentService';

/**
 * Consent verification page for parents.
 * Parents land here after clicking the link in their consent email.
 *
 * URL format: /consent/verify?token=xxx&student=yyy
 *
 * This page:
 * 1. Validates the token and student ID from URL params
 * 2. Calls verifyParentalConsent to activate the account
 * 3. Shows success with COPPA-required data collection summary
 * 4. Shows error with helpful message if token is invalid/expired
 */
function ConsentVerifyPage() {
  const { t } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [error, setError] = useState(null);

  const token = searchParams.get('token');
  const studentId = searchParams.get('student');

  useEffect(() => {
    async function verify() {
      // Validate required params
      if (!token || !studentId) {
        setStatus('error');
        setError(t('consent.verify.missingParams', 'Invalid verification link. Please use the link from your email.'));
        return;
      }

      try {
        await verifyParentalConsent(studentId, token);
        setStatus('success');
      } catch (err) {
        console.error('Consent verification failed:', err);
        setStatus('error');

        // Provide helpful error messages
        if (err.message?.includes('expired')) {
          setError(t('consent.verify.expired', 'This verification link has expired. Please ask your child to request a new one.'));
        } else if (err.message?.includes('Invalid')) {
          setError(t('consent.verify.invalid', 'This verification link is invalid or has already been used.'));
        } else {
          setError(t('consent.verify.genericError', 'Something went wrong. Please try again or contact support.'));
        }
      }
    }

    verify();
  }, [token, studentId, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-lg p-6 md:p-8">
        {/* Loading state */}
        {status === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-white">
              {t('consent.verify.verifying', 'Verifying your consent...')}
            </h1>
            <p className="text-white/70 mt-2">
              {t('consent.verify.pleaseWait', 'Please wait a moment.')}
            </p>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div className="text-center">
            {/* Success icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {t('consent.verify.successTitle', 'Consent Verified!')}
            </h1>

            <p className="text-white/90 text-base mb-6">
              {t('consent.verify.successMessage', "Your child's account is now active. They can start learning piano!")}
            </p>

            {/* COPPA-required data collection summary */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left border border-white/10">
              <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                {t('consent.verify.dataTitle', 'What we collect and how we protect it')}
              </h2>

              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <Database className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white/90">
                      {t('consent.verify.dataLearning', 'Learning progress')}
                    </span>
                    <p className="text-white/60 text-xs mt-0.5">
                      {t('consent.verify.dataLearningDesc', 'Scores, completed exercises, and skill levels to track improvement')}
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white/90">
                      {t('consent.verify.dataActivity', 'Practice activity')}
                    </span>
                    <p className="text-white/60 text-xs mt-0.5">
                      {t('consent.verify.dataActivityDesc', 'Session times and daily streaks to encourage practice habits')}
                    </p>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <Trash2 className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-white/90">
                      {t('consent.verify.dataRights', 'Your rights')}
                    </span>
                    <p className="text-white/60 text-xs mt-0.5">
                      {t('consent.verify.dataRightsDesc', 'You can request data export or deletion anytime via Settings')}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Privacy policy link */}
            <p className="text-white/50 text-xs mb-6">
              {t('consent.verify.privacyNote', 'For full details, see our')}{' '}
              <a
                href="/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline"
              >
                {t('consent.verify.privacyLink', 'Privacy Policy')}
              </a>
            </p>

            {/* Close button */}
            <p className="text-white/70 text-sm">
              {t('consent.verify.closeMessage', 'You can close this window. Your child can now use PianoMaster!')}
            </p>
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="text-center">
            {/* Error icon */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {t('consent.verify.errorTitle', 'Verification Failed')}
            </h1>

            <p className="text-white/90 text-base mb-6">
              {error}
            </p>

            {/* Helpful suggestions */}
            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left border border-white/10">
              <h2 className="text-sm font-semibold text-white/90 mb-2">
                {t('consent.verify.whatToDo', 'What you can do:')}
              </h2>
              <ul className="text-sm text-white/70 space-y-1.5">
                <li>
                  {t('consent.verify.suggestion1', '1. Ask your child to send a new verification email')}
                </li>
                <li>
                  {t('consent.verify.suggestion2', '2. Check if you have a newer email in your inbox')}
                </li>
                <li>
                  {t('consent.verify.suggestion3', '3. Contact support if the problem continues')}
                </li>
              </ul>
            </div>

            {/* Return to login */}
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('consent.verify.backToLogin', 'Go to Login Page')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsentVerifyPage;
