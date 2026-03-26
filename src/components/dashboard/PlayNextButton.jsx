/**
 * PlayNextButton - Large gradient pill CTA that overlaps hero/content boundary.
 *
 * Primary call-to-action on the kid-friendly dashboard.
 * Renders as a React Router Link navigating to the trail map.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const PlayNextButton = ({
  to = '/trail',
  highlightNodeId,
  isRTL = false,
}) => {
  const { t } = useTranslation('common');
  const { reducedMotion } = useAccessibility();

  return (
    <div className="relative z-40 flex justify-center -mt-7">
      <Link
        to={to}
        state={highlightNodeId ? { highlightNodeId } : undefined}
        className={[
          'inline-flex items-center justify-center px-10 py-1.5 rounded-full',
          'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600',
          'border-2 border-blue-300/50',
          'shadow-[0_4px_24px_rgba(99,102,241,0.5)]',
          'hover:shadow-[0_4px_32px_rgba(99,102,241,0.7)]',
          'transition-all duration-300 hover:scale-105',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          !reducedMotion && 'animate-[play-next-glow_2s_ease-in-out_infinite]',
        ]
          .filter(Boolean)
          .join(' ')}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <span className="text-xl font-bold text-white tracking-widest uppercase">
          {t('dashboard.playNext.label', { defaultValue: 'CONTINUE JOURNEY' })}
        </span>
      </Link>

      {/* Keyframes for glow pulse animation */}
      {!reducedMotion && (
        <style>{`
          @keyframes play-next-glow {
            0%, 100% {
              box-shadow: 0 4px 24px rgba(99,102,241,0.5);
            }
            50% {
              box-shadow: 0 4px 32px rgba(99,102,241,0.75), 0 0 16px rgba(139,92,246,0.3);
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default PlayNextButton;
