import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail, RefreshCw, LogOut } from 'lucide-react';
import { resendConsentEmail } from '../../services/consentService';
import { logout } from '../../services/apiAuth';
import toast from 'react-hot-toast';

/**
 * Child-friendly UI shown when account is suspended awaiting parental consent.
 * Displays a friendly message and allows resending the consent email.
 *
 * @param {Object} props
 * @param {string} props.parentEmail - Parent's email (may be partially masked)
 * @param {string} props.studentId - Student's UUID for resending consent
 * @param {function} props.onRefresh - Callback to refresh account status
 */
function ParentalConsentPending({ parentEmail, studentId, onRefresh }) {
  const { t } = useTranslation('common');
  const [isResending, setIsResending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [lastSent, setLastSent] = useState(null);

  // Mask email for display: j***@gmail.com
  const maskedEmail = parentEmail
    ? parentEmail.replace(/^(.{1,2})(.*)(@.*)$/, (_, first, middle, domain) =>
        first + '*'.repeat(Math.min(middle.length, 5)) + domain
      )
    : t('consent.pending.parentEmailUnknown', 'your parent');

  const handleResendEmail = async () => {
    if (isResending) return;

    // Rate limit: 60 seconds between resends
    if (lastSent && Date.now() - lastSent < 60000) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
      toast.error(
        t('consent.pending.waitToResend', {
          seconds: secondsLeft,
          defaultValue: `Please wait ${secondsLeft} seconds before resending`
        })
      );
      return;
    }

    setIsResending(true);
    try {
      await resendConsentEmail(studentId);
      setLastSent(Date.now());
      toast.success(
        t('consent.pending.emailSent', 'Email sent! Ask your parent to check their inbox.')
      );
    } catch (error) {
      console.error('Failed to resend consent email:', error);
      toast.error(
        t('consent.pending.emailFailed', 'Could not send email. Please try again.')
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6 md:p-8 text-center">
        {/* Mailbox icon */}
        <div className="mb-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Mail className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          {t('consent.pending.title', 'Almost there!')}
        </h1>

        {/* Child-friendly message */}
        <p className="text-white/90 text-base md:text-lg mb-2">
          {t('consent.pending.message', 'Ask your parent to check their email so you can start playing!')}
        </p>

        {/* Parent email info */}
        <p className="text-white/70 text-sm mb-6">
          {t('consent.pending.emailSentTo', {
            email: maskedEmail,
            defaultValue: `We sent an email to ${maskedEmail}`
          })}
        </p>

        {/* Visual waiting indicator */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Resend email button */}
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {t('consent.pending.resendEmail', 'Resend email to parent')}
          </button>

          {/* Check status button */}
          <button
            onClick={onRefresh}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white/90 bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            {t('consent.pending.checkStatus', "My parent already approved - let me in!")}
          </button>

          {/* Logout option */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {t('consent.pending.logout', 'Sign out')}
          </button>
        </div>

        {/* Help text */}
        <p className="mt-6 text-white/50 text-xs">
          {t('consent.pending.helpText', "Can't find the email? Check the spam folder or ask your parent to look there.")}
        </p>
      </div>
    </div>
  );
}

export default ParentalConsentPending;
