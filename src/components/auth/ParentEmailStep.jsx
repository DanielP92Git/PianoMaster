import { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Optional parent email collection step for under-13 students.
 * Email is used for weekly progress reports and push notification reminders (D-06).
 * User can skip this step entirely (D-07).
 *
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with parent email string
 * @param {Function} props.onSkip - Called when user skips (no arguments)
 * @param {Function} props.onBack - Go back to previous step
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function ParentEmailStep({ onSubmit, onSkip, onBack, disabled = false }) {
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';
  const [parentEmail, setParentEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!parentEmail) {
      setError(t('auth.signup.parentEmail.errorRequired'));
      return;
    }

    // Basic email validation (same regex as before)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError(t('auth.signup.parentEmail.errorInvalid'));
      return;
    }

    onSubmit(parentEmail.toLowerCase().trim());
  };

  const inputClass = `w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2
    border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25
    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50
    transition-all duration-300 text-white placeholder-white/70`;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className="flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
      >
        {isRTL ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        {t('auth.signup.back')}
      </button>

      {/* Info banner — purpose-driven messaging per D-06/D-14 */}
      <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-lg">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/90">
            <p className="font-medium mb-1">{t('auth.signup.parentEmail.title')}</p>
            <p className="text-white/70">
              {t('auth.signup.parentEmail.description')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2 text-xs text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="group">
          <label
            htmlFor="parent-email"
            className="block text-xs font-medium text-white/90 mb-0.5"
          >
            {t('auth.signup.parentEmail.label')}
          </label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="email"
              id="parent-email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              disabled={disabled}
              className={`${inputClass} pl-9`}
              placeholder={t('auth.signup.parentEmail.placeholder')}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={disabled}
            className="flex-1 py-2 text-sm text-white/70 hover:text-white border-2 border-white/20 rounded-lg transition-colors"
          >
            {t('auth.signup.parentEmail.skip')}
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {t('auth.signup.parentEmail.continue')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParentEmailStep;
