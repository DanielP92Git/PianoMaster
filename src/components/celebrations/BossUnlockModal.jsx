/**
 * BossUnlockModal Component
 *
 * 3-stage celebration modal for boss node completions:
 *   Stage 1: CELEBRATION - "Boss Defeated!" with musical confetti
 *   Stage 2: UNLOCK - Boss node icon with gold glow + "Unit Complete!"
 *   Stage 3: PREVIEW - Next unit preview or "Path Complete!" message
 *
 * Design considerations:
 * - Renders at z-[10000] on top of VictoryScreen (z-[9999])
 * - Fires once per boss node per user (localStorage tracking via useBossUnlockTracking)
 * - Continue button appears after 1s delay per stage (prevents accidental double-tap)
 * - Auto-advance fallback for distracted children (10s/8s/12s per stage)
 * - Reduced motion collapses to single summary screen
 * - Fanfare sound plays on user gesture (Stage 1 Continue click) to satisfy autoplay policy
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Confetti from 'react-confetti';
import { Trophy, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { getRandomMusicShape } from '../../utils/musicSymbolShapes';
import { playFanfare } from '../../utils/fanfareSound';
import { SKILL_NODES, getNodeById } from '../../data/skillTrail';
import { translateNodeName } from '../../utils/translateNodeName';

// Stage constants
const STAGES = {
  CELEBRATION: 'celebration',
  UNLOCK: 'unlock',
  PREVIEW: 'preview'
};

// Auto-advance timeouts per stage (milliseconds)
const AUTO_ADVANCE_TIMEOUTS = {
  [STAGES.CELEBRATION]: 10000,
  [STAGES.UNLOCK]: 8000,
  [STAGES.PREVIEW]: 12000
};

// Continue button appearance delay (milliseconds)
const CONTINUE_BUTTON_DELAY = 1000;

// Gold/amber/white confetti colors for boss celebrations
const BOSS_CONFETTI_COLORS = ['#FFD700', '#FFC107', '#FFA000', '#FFFFFF', '#FFE082'];

/**
 * Get congratulatory message based on the node's category
 * @param {string} nodeId - The boss node ID
 * @returns {string} Category-specific congratulatory message
 */
const getPathCompleteMessage = (nodeId, t) => {
  const node = getNodeById(nodeId);
  if (!node) {
    return t ? t('trail:boss.pathCompleteMessages.default') : 'You have mastered this path!';
  }

  const category = node.category;
  if (t) {
    const key = `trail:boss.pathCompleteMessages.${category}`;
    return t(key, { defaultValue: t('trail:boss.pathCompleteMessages.default') });
  }
  if (category === 'treble_clef') return "You've mastered all Treble Clef notes!";
  if (category === 'bass_clef') return 'Bass Clef Master!';
  if (category === 'rhythm') return 'Rhythm Champion!';
  return 'You have mastered this path!';
};

/**
 * Get upcoming nodes in the same category as the next node
 * @param {Object|null} nextNode - The next recommended node
 * @returns {Array} Up to 4 upcoming nodes
 */
const getUpcomingNodes = (nextNode) => {
  if (!nextNode) return [];

  return SKILL_NODES
    .filter(n =>
      n.category === nextNode.category &&
      n.order >= nextNode.order
    )
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);
};

/**
 * Get category color for mini trail preview nodes
 * @param {string} category - Node category
 * @returns {string} Tailwind bg class
 */
const getCategoryBgColor = (category) => {
  if (category === 'treble_clef') return 'bg-blue-500';
  if (category === 'bass_clef') return 'bg-purple-500';
  if (category === 'rhythm') return 'bg-emerald-500';
  return 'bg-yellow-500';
};

/**
 * BossUnlockModal - 3-stage boss celebration overlay
 *
 * @param {Object} props
 * @param {string} props.nodeId - Completed boss node ID
 * @param {string} props.nodeName - Display name of boss node
 * @param {Object|null} props.nextNode - Next recommended node, or null if path complete
 * @param {number} props.stars - Stars earned (1-3)
 * @param {Function} props.onClose - Callback when modal dismissed
 * @param {Function} props.onNavigateToNext - Callback to navigate to next node
 */
export function BossUnlockModal({
  nodeId,
  nodeName,
  nextNode,
  stars,
  onClose,
  onNavigateToNext
}) {
  const { t, i18n } = useTranslation(['trail', 'common']);
  const { reducedMotion } = useAccessibility();
  const [stage, setStage] = useState(STAGES.CELEBRATION);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Refs for timeout cleanup
  const continueTimerRef = useRef(null);
  const autoAdvanceTimerRef = useRef(null);
  const continueButtonRef = useRef(null);

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clear all timers helper
  const clearTimers = useCallback(() => {
    if (continueTimerRef.current) {
      clearTimeout(continueTimerRef.current);
      continueTimerRef.current = null;
    }
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Set up timers for each stage transition
  useEffect(() => {
    if (reducedMotion) return;

    clearTimers();
    setShowContinueButton(false);

    // Show continue button after delay
    continueTimerRef.current = setTimeout(() => {
      setShowContinueButton(true);
    }, CONTINUE_BUTTON_DELAY);

    // Auto-advance after timeout
    const autoAdvanceMs = AUTO_ADVANCE_TIMEOUTS[stage];
    if (autoAdvanceMs) {
      autoAdvanceTimerRef.current = setTimeout(() => {
        advanceStage();
      }, autoAdvanceMs);
    }

    // We intentionally only re-run this when stage changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, reducedMotion]);

  // Focus the continue button when it appears
  useEffect(() => {
    if (showContinueButton && continueButtonRef.current) {
      continueButtonRef.current.focus();
    }
  }, [showContinueButton]);

  // Escape key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Advance to next stage
  const advanceStage = useCallback(() => {
    clearTimers();
    if (stage === STAGES.CELEBRATION) {
      setStage(STAGES.UNLOCK);
    } else if (stage === STAGES.UNLOCK) {
      setStage(STAGES.PREVIEW);
    } else {
      // Preview stage done — close or navigate
      if (nextNode) {
        onNavigateToNext();
      } else {
        onClose();
      }
    }
  }, [stage, nextNode, onNavigateToNext, onClose, clearTimers]);

  // Handle Continue button click for Stage 1 (plays fanfare)
  const handleCelebrationContinue = useCallback(() => {
    // Play fanfare on user gesture (satisfies autoplay policy)
    playFanfare();
    advanceStage();
  }, [advanceStage]);

  // ---------- Reduced Motion: Single Summary Screen ----------
  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Boss unlock celebration"
      >
        <div className="w-full max-w-sm rounded-2xl border border-yellow-500/30 bg-slate-800/95 p-6 text-center backdrop-blur-sm">
          <h2 className="mb-3 text-2xl font-bold text-yellow-400">
            {t('trail:boss.cleared')}
          </h2>

          {/* Star display */}
          <div className="mb-4 flex items-center justify-center gap-1">
            {[1, 2, 3].map((starNum) => (
              <span
                key={starNum}
                className={`text-3xl ${
                  starNum <= stars ? 'text-yellow-400' : 'text-gray-600'
                }`}
              >
                {starNum <= stars ? '\u2B50' : '\u2606'}
              </span>
            ))}
          </div>

          <p className="mb-2 text-sm text-white/70">{translateNodeName(nodeName, t, i18n)}</p>

          {nextNode ? (
            <>
              <p className="mb-4 text-sm text-white/80">
                {t('trail:boss.next', { name: translateNodeName(nextNode.name, t, i18n) })}
              </p>
              <button
                onClick={onNavigateToNext}
                className="min-h-[48px] w-full rounded-full bg-white px-6 py-3 text-base font-bold text-slate-900 shadow-lg"
                autoFocus
              >
                {t('trail:boss.startNextNode')}
              </button>
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-white/80">
                {getPathCompleteMessage(nodeId, t)}
              </p>
              <button
                onClick={onClose}
                className="min-h-[48px] w-full rounded-full bg-white px-6 py-3 text-base font-bold text-slate-900 shadow-lg"
                autoFocus
              >
                {t('trail:boss.backToTrail')}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------- Full Animation: 3-Stage Sequence ----------
  const upcomingNodes = getUpcomingNodes(nextNode);

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Boss unlock celebration"
    >
      {/* Musical confetti (Stage 1 only) */}
      {stage === STAGES.CELEBRATION && (
        <div className="pointer-events-none fixed inset-0 z-[10001]">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={400}
            colors={BOSS_CONFETTI_COLORS}
            gravity={0.25}
            recycle={false}
            drawShape={(ctx) => {
              const drawFn = getRandomMusicShape();
              drawFn(ctx);
            }}
          />
        </div>
      )}

      {/* Content card */}
      <div className="relative z-[10002] w-full max-w-sm rounded-2xl border border-yellow-500/30 bg-slate-800/95 p-6 text-center backdrop-blur-sm">

        {/* ===== STAGE 1: CELEBRATION ===== */}
        {stage === STAGES.CELEBRATION && (
          <div className="animate-fade-in">
            <h2
              className="mb-3 text-3xl font-black text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.5)' }}
            >
              {stars === 3 ? t('trail:boss.perfectVictory') : t('trail:boss.defeated')}
            </h2>

            {/* Star display */}
            <div className="mb-4 flex items-center justify-center gap-2">
              {[1, 2, 3].map((starNum) => (
                <span
                  key={starNum}
                  className={`text-4xl transition-all duration-300 ${
                    starNum <= stars
                      ? 'animate-bounce text-yellow-400 drop-shadow-lg'
                      : 'text-gray-600'
                  }`}
                  style={{
                    animationDelay: `${starNum * 150}ms`,
                    animationDuration: '600ms'
                  }}
                >
                  {starNum <= stars ? '\u2B50' : '\u2606'}
                </span>
              ))}
            </div>

            <p className="mb-6 text-sm text-white/60">{translateNodeName(nodeName, t, i18n)}</p>

            {/* Continue button */}
            <button
              ref={continueButtonRef}
              onClick={handleCelebrationContinue}
              className={`min-h-[48px] rounded-full bg-white px-8 py-3 text-base font-bold text-slate-900 shadow-lg transition-opacity duration-300 ${
                showContinueButton
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
              tabIndex={showContinueButton ? 0 : -1}
              aria-hidden={!showContinueButton}
            >
              {t('trail:boss.continue')}
            </button>
          </div>
        )}

        {/* ===== STAGE 2: UNLOCK ===== */}
        {stage === STAGES.UNLOCK && (
          <div className="animate-fade-in">
            {/* Boss icon with golden glow */}
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-scale-up">
              <Trophy className="h-10 w-10 text-amber-900" />
            </div>

            <h2
              className="mb-2 text-2xl font-black text-yellow-400"
              style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.4)' }}
            >
              {t('trail:boss.unitComplete')}
            </h2>

            <p className="mb-6 text-lg text-white/80">{translateNodeName(nodeName, t, i18n)}</p>

            {/* Continue button */}
            <button
              ref={continueButtonRef}
              onClick={advanceStage}
              className={`min-h-[48px] rounded-full bg-white px-8 py-3 text-base font-bold text-slate-900 shadow-lg transition-opacity duration-300 ${
                showContinueButton
                  ? 'opacity-100'
                  : 'pointer-events-none opacity-0'
              }`}
              tabIndex={showContinueButton ? 0 : -1}
              aria-hidden={!showContinueButton}
            >
              {t('trail:boss.continue')}
            </button>
          </div>
        )}

        {/* ===== STAGE 3: PREVIEW ===== */}
        {stage === STAGES.PREVIEW && (
          <div className="animate-fade-in">
            {nextNode ? (
              <>
                <h2
                  className="mb-3 text-2xl font-black text-yellow-400"
                  style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.4)' }}
                >
                  {t('trail:boss.newPathUnlocked')}
                </h2>

                <p className="mb-4 text-lg text-white/90">
                  {t('trail:boss.next', { name: translateNodeName(nextNode.name, t, i18n) })}
                </p>

                {/* Mini trail preview - upcoming nodes */}
                {upcomingNodes.length > 0 && (
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {upcomingNodes.map((node, index) => (
                      <div
                        key={node.id}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          index === 0
                            ? `${getCategoryBgColor(node.category)} border-white/60`
                            : 'border-gray-600 bg-gray-700'
                        }`}
                        title={node.name}
                      >
                        <span className="text-xs text-white/70">
                          {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA: Start Next Node */}
                <button
                  ref={continueButtonRef}
                  onClick={onNavigateToNext}
                  className={`min-h-[48px] w-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 px-8 py-3 text-base font-bold text-amber-900 shadow-lg transition-opacity duration-300 ${
                    showContinueButton
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0'
                  }`}
                  tabIndex={showContinueButton ? 0 : -1}
                  aria-hidden={!showContinueButton}
                >
                  {t('trail:boss.startNextNode')}
                </button>
              </>
            ) : (
              <>
                {/* Path Complete (final boss) */}
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500">
                  <Crown className="h-8 w-8 text-amber-900" />
                </div>

                <h2
                  className="mb-3 text-2xl font-black text-yellow-400"
                  style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.4)' }}
                >
                  {t('trail:boss.pathComplete')}
                </h2>

                <p className="mb-6 text-base text-white/80">
                  {getPathCompleteMessage(nodeId, t)}
                </p>

                {/* CTA: Back to Trail */}
                <button
                  ref={continueButtonRef}
                  onClick={onClose}
                  className={`min-h-[48px] w-full rounded-full bg-white px-8 py-3 text-base font-bold text-slate-900 shadow-lg transition-opacity duration-300 ${
                    showContinueButton
                      ? 'opacity-100'
                      : 'pointer-events-none opacity-0'
                  }`}
                  tabIndex={showContinueButton ? 0 : -1}
                  aria-hidden={!showContinueButton}
                >
                  {t('trail:boss.backToTrail')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* CSS keyframe animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
        @keyframes scale-up {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scale-up 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default BossUnlockModal;
