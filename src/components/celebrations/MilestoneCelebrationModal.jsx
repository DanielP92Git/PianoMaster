/**
 * MilestoneCelebrationModal Component
 *
 * Lightweight modal overlay shown when a student reaches an instrument practice
 * streak milestone (5, 10, 21, or 30 days).
 *
 * Design decisions:
 * - D-03: Lightweight overlay, NOT full VictoryScreen
 * - D-04: Uses ConfettiEffect for visual flair
 * - D-05: Skippable — tap backdrop, press Escape, or auto-dismiss after 4 seconds
 * - D-09: Emerald/green theme (distinct from amber app-usage streak and indigo XP)
 * - D-10: Trophy icon, milestone number prominently displayed, tier messages
 * - D-13: useMotionTokens for animation tokens (respects reduced-motion)
 * - Pitfall 6: clearTimeout before calling onClose to avoid double-fire race
 */

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { ConfettiEffect } from './ConfettiEffect';
import { useMotionTokens } from '../../utils/useMotionTokens';

/**
 * MilestoneCelebrationModal
 *
 * @param {Object} props
 * @param {5 | 10 | 21 | 30} props.milestone - The milestone streak count reached
 * @param {Function} props.onClose - Callback when the modal is dismissed
 */
export function MilestoneCelebrationModal({ milestone, onClose }) {
  const { t } = useTranslation('common');
  const { reduce, soft } = useMotionTokens();
  const autoTimerRef = useRef(null);

  // Stable close handler that clears the auto-dismiss timer (Pitfall 6)
  const handleClose = useCallback(() => {
    clearTimeout(autoTimerRef.current);
    onClose();
  }, [onClose]);

  // Auto-dismiss after 4 seconds (D-05)
  useEffect(() => {
    autoTimerRef.current = setTimeout(handleClose, 4000);
    return () => clearTimeout(autoTimerRef.current);
  }, [handleClose]);

  // Escape key dismiss (D-05)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose]);

  // Confetti tier: 'epic' for 30-day (D-12 discretion), 'full' for others
  const confettiTier = milestone === 30 ? 'epic' : 'full';

  return createPortal(
    <>
      {/* Confetti — rendered as sibling, NOT nested inside modal card (anti-pattern per RESEARCH.md) */}
      <ConfettiEffect tier={confettiTier} />

      {/* Backdrop + modal */}
      <motion.div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduce ? { duration: 0 } : soft}
        role="dialog"
        aria-modal="true"
        aria-label={t('practice.milestone.ariaLabel')}
        onClick={handleClose}
      >
        <motion.div
          className="relative z-[10002] w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-slate-800/95 p-6 text-center backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={reduce ? { duration: 0 } : soft}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Trophy icon in emerald circle (D-09, D-10) */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-green-500">
            <Trophy className="h-8 w-8 text-emerald-900" />
          </div>

          {/* Milestone number prominently displayed (D-10) */}
          <p className="text-5xl font-black text-emerald-400">{milestone}</p>
          <p className="mb-2 text-sm font-bold text-white/70">
            {t('practice.milestone.daysLabel')}
          </p>

          {/* Title + message (D-10, D-12) */}
          <h2 className="mb-1 text-xl font-black text-white">
            {t(`practice.milestone.${milestone}.title`)}
          </h2>
          <p className="mb-5 text-sm text-white/70">
            {t(`practice.milestone.${milestone}.message`)}
          </p>

          {/* Dismiss button (D-05) — min 48px touch target, emerald theme (D-09) */}
          <button
            className="min-h-[48px] w-full rounded-full bg-emerald-500 px-6 py-3 text-base font-bold text-white shadow-lg hover:bg-emerald-600"
            onClick={handleClose}
            autoFocus
          >
            {t('practice.milestone.dismiss')}
          </button>
        </motion.div>
      </motion.div>
    </>,
    document.body
  );
}
