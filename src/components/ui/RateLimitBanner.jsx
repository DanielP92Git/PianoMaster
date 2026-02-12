import React from 'react';
import Countdown from 'react-countdown';
import { Coffee } from 'lucide-react';

/**
 * Banner shown when a student is rate-limited from submitting scores.
 * Child-friendly messaging with countdown timer.
 *
 * @param {Object} props
 * @param {Date} props.resetTime - When the rate limit resets
 * @param {Function} props.onComplete - Called when countdown reaches zero
 */
export default function RateLimitBanner({ resetTime, onComplete }) {
  // Countdown renderer for MM:SS format
  const countdownRenderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      // Call onComplete when countdown finishes
      return null;
    }

    return (
      <span className="font-bold text-kidsWarning-700 text-xl tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  };

  return (
    <div
      className="
        w-full rounded-kids-lg
        bg-gradient-to-r from-kidsWarning-100 to-kidsWarning-200
        border-2 border-kidsWarning-300
        p-4 shadow-lg
      "
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 p-2 bg-kidsWarning-200 rounded-full">
          <Coffee className="w-6 h-6 text-kidsWarning-600" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-kidsWarning-800 flex items-center gap-2">
            Take a breather!
          </h3>

          <p className="text-kidsWarning-700 mt-1">
            You can continue in{' '}
            <Countdown
              date={resetTime}
              renderer={countdownRenderer}
              onComplete={onComplete}
            />
          </p>

          <p className="text-sm text-kidsWarning-600 mt-2 italic">
            Practice Mode — scores won't be saved
          </p>
        </div>
      </div>
    </div>
  );
}
