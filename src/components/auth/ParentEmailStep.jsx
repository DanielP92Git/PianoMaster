import { useState } from 'react';
import { Mail, ArrowLeft, Info } from 'lucide-react';

/**
 * Parent email collection step for under-13 users
 * @param {Object} props
 * @param {Function} props.onSubmit - Called with parent email
 * @param {Function} props.onBack - Go back to previous step
 * @param {boolean} props.disabled - Disable inputs during submission
 */
export function ParentEmailStep({ onSubmit, onBack, disabled = false }) {
  const [parentEmail, setParentEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!parentEmail || !confirmEmail) {
      setError('Please fill in both fields');
      return;
    }

    if (parentEmail.toLowerCase() !== confirmEmail.toLowerCase()) {
      setError('Email addresses do not match');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError('Please enter a valid email address');
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
      {/* Info banner */}
      <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-lg">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-indigo-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/90">
            <p className="font-medium mb-1">Parent or Guardian Required</p>
            <p className="text-white/70">
              Since you're under 13, we need a parent or guardian's email to create your account.
              They'll receive an email to approve your account.
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

        <div className="space-y-2">
          <div className="group">
            <label
              htmlFor="parent-email"
              className="block text-xs font-medium text-white/90 mb-0.5"
            >
              Parent/Guardian Email
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
                placeholder="parent@example.com"
                required
              />
            </div>
          </div>

          <div className="group">
            <label
              htmlFor="confirm-parent-email"
              className="block text-xs font-medium text-white/90 mb-0.5"
            >
              Confirm Email
            </label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                type="email"
                id="confirm-parent-email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                disabled={disabled}
                className={`${inputClass} pl-9`}
                placeholder="Confirm parent email"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="flex items-center justify-center gap-1 px-3 py-2 text-sm text-white/80 hover:text-white border-2 border-white/20 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            type="submit"
            disabled={disabled}
            className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Continue to Create Account
          </button>
        </div>
      </form>
    </div>
  );
}

export default ParentEmailStep;
