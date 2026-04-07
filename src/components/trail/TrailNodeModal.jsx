/**
 * TrailNodeModal Component
 *
 * Displays detailed information about a trail node and allows starting practice.
 * Shows exercise list with completion status for sequential exercise progression.
 *
 * Kid-friendly centered design with glowing category icon, 3D bubble note badges,
 * golden star XP card, and gradient action buttons.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import GoldStar from '../ui/GoldStar';
import { getExerciseProgress, getNextExerciseIndex } from '../../services/skillProgressService';
import { useUser } from '../../features/authentication/useUser';
import { translateNodeName } from '../../utils/translateNodeName';
import { getNodeTypeIcon, getCategoryColors } from '../../utils/nodeTypeStyles';
import NotePreview from './NotePreview';

/**
 * Get display name for exercise type
 */
const getExerciseTypeName = (type, t) => {
  switch (type) {
    case 'note_recognition':
      return t('trail:exerciseTypes.note_recognition');
    case 'sight_reading':
      return t('trail:exerciseTypes.sight_reading');
    case 'rhythm':
      return t('trail:exerciseTypes.rhythm');
    case 'boss_challenge':
      return t('trail:exerciseTypes.boss_challenge');
    case 'memory_game':
      return t('trail:exerciseTypes.memory_game');
    case 'note_catch':
      return t('trail:exerciseTypes.note_catch');
    case 'rhythm_tap':
      return t('trail:exerciseTypes.rhythm_tap');
    case 'rhythm_dictation':
      return t('trail:exerciseTypes.rhythm_dictation');
    case 'arcade_rhythm':
      return t('trail:exerciseTypes.arcade_rhythm');
    case 'pitch_comparison':
      return t('trail:exerciseTypes.pitch_comparison');
    case 'interval_id':
      return t('trail:exerciseTypes.interval_id');
    default:
      return type;
  }
};

/**
 * Color gradients for 3D bubble badges by category.
 * Each entry has { bg, shadow } where bg is a radial-gradient string
 * and shadow is an RGB triplet for box-shadow.
 */
const BUBBLE_COLORS = {
  treble_clef: [
    { bg: 'radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6 60%, #1d4ed8)', shadow: '59,130,246' },
    { bg: 'radial-gradient(circle at 35% 35%, #c4b5fd, #8b5cf6 60%, #6d28d9)', shadow: '139,92,246' },
    { bg: 'radial-gradient(circle at 35% 35%, #f9a8d4, #ec4899 60%, #be185d)', shadow: '236,72,153' },
    { bg: 'radial-gradient(circle at 35% 35%, #a5b4fc, #6366f1 60%, #4338ca)', shadow: '99,102,241' },
    { bg: 'radial-gradient(circle at 35% 35%, #67e8f9, #06b6d4 60%, #0e7490)', shadow: '6,182,212' },
    { bg: 'radial-gradient(circle at 35% 35%, #d8b4fe, #a855f7 60%, #7e22ce)', shadow: '168,85,247' },
    { bg: 'radial-gradient(circle at 35% 35%, #fda4af, #f43f5e 60%, #be123c)', shadow: '244,63,94' },
  ],
  bass_clef: [
    { bg: 'radial-gradient(circle at 35% 35%, #d8b4fe, #a855f7 60%, #7e22ce)', shadow: '168,85,247' },
    { bg: 'radial-gradient(circle at 35% 35%, #a5b4fc, #6366f1 60%, #4338ca)', shadow: '99,102,241' },
    { bg: 'radial-gradient(circle at 35% 35%, #c4b5fd, #8b5cf6 60%, #6d28d9)', shadow: '139,92,246' },
    { bg: 'radial-gradient(circle at 35% 35%, #e9d5ff, #c084fc 60%, #9333ea)', shadow: '192,132,252' },
    { bg: 'radial-gradient(circle at 35% 35%, #818cf8, #4f46e5 60%, #3730a3)', shadow: '79,70,229' },
    { bg: 'radial-gradient(circle at 35% 35%, #f0abfc, #d946ef 60%, #a21caf)', shadow: '217,70,239' },
    { bg: 'radial-gradient(circle at 35% 35%, #93c5fd, #3b82f6 60%, #1d4ed8)', shadow: '59,130,246' },
  ],
  rhythm: [
    { bg: 'radial-gradient(circle at 35% 35%, #6ee7b7, #10b981 60%, #047857)', shadow: '16,185,129' },
    { bg: 'radial-gradient(circle at 35% 35%, #5eead4, #14b8a6 60%, #0f766e)', shadow: '20,184,166' },
    { bg: 'radial-gradient(circle at 35% 35%, #a7f3d0, #34d399 60%, #059669)', shadow: '52,211,153' },
    { bg: 'radial-gradient(circle at 35% 35%, #99f6e4, #2dd4bf 60%, #0d9488)', shadow: '45,212,191' },
    { bg: 'radial-gradient(circle at 35% 35%, #86efac, #22c55e 60%, #15803d)', shadow: '34,197,94' },
    { bg: 'radial-gradient(circle at 35% 35%, #67e8f9, #06b6d4 60%, #0e7490)', shadow: '6,182,212' },
  ],
  boss: [
    { bg: 'radial-gradient(circle at 35% 35%, #fde68a, #f59e0b 60%, #b45309)', shadow: '245,158,11' },
    { bg: 'radial-gradient(circle at 35% 35%, #fcd34d, #eab308 60%, #a16207)', shadow: '234,179,8' },
    { bg: 'radial-gradient(circle at 35% 35%, #fed7aa, #f97316 60%, #c2410c)', shadow: '249,115,22' },
  ],
  ear_training: [
    { bg: 'radial-gradient(circle at 35% 35%, #67e8f9, #06b6d4 60%, #0e7490)', shadow: '6,182,212' },
    { bg: 'radial-gradient(circle at 35% 35%, #5eead4, #14b8a6 60%, #0f766e)', shadow: '20,184,166' },
    { bg: 'radial-gradient(circle at 35% 35%, #a5f3fc, #22d3ee 60%, #0891b2)', shadow: '34,211,238' },
  ],
};

/**
 * Category-specific icon badge styles for the modal header.
 * Dark circle with luminous colored ring + white icon — matches design reference.
 */
const MODAL_ICON_STYLES = {
  treble_clef: {
    background: 'radial-gradient(circle at 40% 38%, #1e3a6e 0%, #0f172a 70%)',
    ringColor: 'rgba(56, 152, 255, 0.85)',
    glowColor: 'rgba(59, 130, 246, 0.45)',
  },
  bass_clef: {
    background: 'radial-gradient(circle at 40% 38%, #3b1e6e 0%, #1a0a2e 70%)',
    ringColor: 'rgba(168, 85, 247, 0.85)',
    glowColor: 'rgba(168, 85, 247, 0.45)',
  },
  rhythm: {
    background: 'radial-gradient(circle at 40% 38%, #0f3d2e 0%, #052e1a 70%)',
    ringColor: 'rgba(16, 185, 129, 0.85)',
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  boss: {
    background: 'radial-gradient(circle at 40% 38%, #5c3d0e 0%, #2a1a04 70%)',
    ringColor: 'rgba(234, 179, 8, 0.85)',
    glowColor: 'rgba(234, 179, 8, 0.45)',
  },
  ear_training: {
    background: 'radial-gradient(circle at 40% 38%, #0e3d3d 0%, #0a1a2a 70%)',
    ringColor: 'rgba(34, 211, 238, 0.85)',
    glowColor: 'rgba(6, 182, 212, 0.45)',
  },
};

const TrailNodeModal = ({ node, progress, isUnlocked, isPremiumLocked = false, prerequisites: _prerequisites = [], onClose }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, i18n } = useTranslation(['trail', 'common']);
  const isRTL = i18n.dir() === 'rtl';
  const [exerciseProgress, setExerciseProgress] = useState([]);
  const [nextExerciseIndex, setNextExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const totalExercises = node?.exercises?.length || 0;

  // Fetch exercise progress when modal opens
  useEffect(() => {
    if (!node) return;
    const fetchExerciseProgress = async () => {
      if (isPremiumLocked || !user?.id || !node?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [epData, nextIdx] = await Promise.all([
          getExerciseProgress(user.id, node.id),
          getNextExerciseIndex(user.id, node.id, totalExercises)
        ]);
        setExerciseProgress(epData || []);
        setNextExerciseIndex(nextIdx !== null ? nextIdx : 0);
      } catch (error) {
        console.error('Error fetching exercise progress:', error);
        setExerciseProgress([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExerciseProgress();
  }, [node, user?.id, totalExercises, isPremiumLocked]);

  if (!node) return null;

  /**
   * Get the exercise data by index from exerciseProgress array
   */
  const getExerciseData = (index) => {
    return exerciseProgress.find(ep => ep.index === index) || null;
  };

  /**
   * Navigate to a specific exercise
   */
  const navigateToExercise = (exerciseIndex) => {
    const exercise = node.exercises[exerciseIndex];
    if (!exercise) {
      console.error('No exercise at index:', exerciseIndex);
      return;
    }

    // Close modal first
    onClose();

    // Derive accidental flags from the exercise's notePool so trail sessions
    // override user game settings (locked decision: flags come from curriculum).
    const notePool = exercise.config?.notePool || [];
    const enableSharps = notePool.some(n => n.includes('#'));
    const enableFlats = notePool.some(n => /^[A-G]b\d/.test(n));

    // Common navigation state
    const navState = {
      nodeId: node.id,
      nodeConfig: exercise.config,
      exerciseIndex: exerciseIndex,
      totalExercises: totalExercises,
      exerciseType: exercise.type,
      enableSharps,
      enableFlats,
      keySignature: exercise.config?.keySignature ?? null,
    };

    // Navigate based on exercise type
    switch (exercise.type) {
      case 'note_recognition':
        navigate('/notes-master-mode/notes-recognition-game', { state: navState });
        break;
      case 'sight_reading':
        navigate('/notes-master-mode/sight-reading-game', { state: navState });
        break;
      case 'memory_game':
        navigate('/notes-master-mode/memory-game', { state: navState });
        break;
      case 'rhythm':
        navigate('/rhythm-mode/metronome-trainer', { state: navState });
        break;
      case 'boss_challenge':
        navigate('/notes-master-mode/sight-reading-game', {
          state: { ...navState, isBoss: true }
        });
        break;
      case 'note_catch':
        navigate('/notes-master-mode/note-speed-cards', { state: navState });
        break;
      case 'rhythm_tap':
        navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
        break;
      case 'rhythm_dictation':
        navigate('/rhythm-mode/rhythm-dictation-game', { state: navState });
        break;
      case 'arcade_rhythm':
        navigate('/rhythm-mode/arcade-rhythm-game', { state: navState });
        break;
      case 'pitch_comparison':
        navigate('/ear-training-mode/note-comparison-game', { state: navState });
        break;
      case 'interval_id':
        navigate('/ear-training-mode/interval-game', { state: navState });
        break;
      default:
        console.error('Unknown exercise type:', exercise.type);
    }
  };

  const handleStartPractice = () => {
    // Navigate to the next uncompleted exercise
    const targetIndex = nextExerciseIndex !== null ? nextExerciseIndex : 0;
    navigateToExercise(targetIndex);
  };

  const stars = progress?.stars || 0;
  const bestScore = progress?.best_score || 0;
  const exercisesCompleted = exerciseProgress.filter(ep => ep.stars > 0).length;

  // Check if all exercises are complete.
  // While loading, fall back to the parent-provided progress (stars > 0 means node was completed before)
  const allExercisesComplete = isLoading
    ? stars > 0
    : exercisesCompleted >= totalExercises && totalExercises > 0;

  // Get node type icon and category colors for header
  const NodeIcon = isPremiumLocked ? Sparkles : getNodeTypeIcon(node.nodeType, node.category);
  const headerColors = isPremiumLocked
    ? {
        bg: 'bg-gradient-to-br from-amber-400 to-yellow-600',
        border: 'border-amber-400',
        text: 'text-amber-900',
        icon: 'opacity-100',
        glow: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]'
      }
    : getCategoryColors(
        node.isBoss ? 'boss' : node.category,
        isUnlocked ? 'available' : 'locked'
      );

  // Category-aware gradient for progress bar and CTA button
  const progressGradient = node.isBoss
    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
    : node.category === 'treble_clef'
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
      : node.category === 'bass_clef'
        ? 'bg-gradient-to-r from-purple-500 to-violet-600'
        : node.category === 'rhythm'
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
          : node.category === 'ear_training'
            ? 'bg-gradient-to-r from-cyan-400 to-teal-500'
            : 'bg-gradient-to-r from-blue-500 to-indigo-600';

  // Get bubble colors for the current node category
  const bubbleCategory = node.isBoss ? 'boss' : (node.category || 'treble_clef');
  const bubbleColorSet = BUBBLE_COLORS[bubbleCategory] || BUBBLE_COLORS.treble_clef;

  // Convert ASCII accidentals to Unicode symbols for display (e.g. F# → F♯, Bb → B♭)
  // Negative lookahead (?![a-z]) ensures only note-name patterns are converted (not words like "Bubble")
  const sanitizeAccidentals = (str) =>
    str?.replace(/([A-G])#/g, '$1♯').replace(/([A-G])b(?![a-z])/g, '$1♭') || str;

  return (
    <div className="fixed inset-0 z-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-slate-800/95 backdrop-blur-sm border ${headerColors.border} shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden modal-scrollbar`}>
        {/* Category accent strip */}
        <div className={`h-1 w-full rounded-t-2xl ${headerColors.bg}`} />

        <div className="p-5 sm:p-7">
          {/* Large centered category icon — dark circle with luminous ring */}
          <div className="flex justify-center mb-4">
            {(() => {
              const iconCat = isPremiumLocked ? null : (node.isBoss ? 'boss' : node.category);
              const mStyle = iconCat && MODAL_ICON_STYLES[iconCat];
              if (mStyle) {
                return (
                  <div
                    className="flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full"
                    style={{
                      background: mStyle.background,
                      boxShadow: [
                        `0 0 0 3px ${mStyle.ringColor}`,
                        `0 0 18px ${mStyle.glowColor}`,
                        `inset 0 0 12px rgba(0,0,0,0.4)`,
                      ].join(', '),
                      width: 80,
                      height: 80,
                    }}
                  >
                    <NodeIcon size={40} color="white" strokeWidth={2} />
                  </div>
                );
              }
              // Fallback for premium/locked/unknown — original behavior
              return (
                <div
                  className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full ${headerColors.bg} ${headerColors.glow} ring-4 ring-white/15`}
                >
                  <NodeIcon size={36} className={headerColors.text} strokeWidth={2} />
                </div>
              );
            })()}
          </div>

          {/* Centered title and subtitle */}
          <div className="text-center mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {translateNodeName(node.name, t, i18n)}
            </h2>
            <p className="mt-1 text-sm text-white/60">
              {t(`descriptions.${node.name}`, { defaultValue: sanitizeAccidentals(node.description) || t('modal.subtitle') })}
            </p>
          </div>

          {/* Skills 3D bubble badges */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white/70 text-center mb-3">
              {t('modal.skillsYoullLearn')}
            </h3>
            <div className="flex justify-center flex-wrap gap-3 sm:gap-4">
              {/* Determine which skills to show: focusNotes for Discovery nodes, full skills for others */}
              {(node.noteConfig?.focusNotes?.length > 0 ? node.noteConfig.focusNotes : node.skills).map((skill, index) => {
                const noteMatch = skill.match(/^([A-Ga-g][b#]?)(\d)$/);
                const displaySkill = noteMatch
                  ? t(`trail:noteNames.${noteMatch[1].toUpperCase()}`, { defaultValue: noteMatch[1] })
                  : t(`trail:skillNames.${skill}`, { defaultValue: skill.replace(/_/g, ' ') });
                const textSizeClass = displaySkill.length > 4
                  ? 'text-xs sm:text-sm'   // Long labels (Hebrew accidentals like "פה דיאז")
                  : 'text-xl sm:text-2xl'; // Short labels (C, D, F♯)
                const colorIdx = index % bubbleColorSet.length;
                const bubbleColor = bubbleColorSet[colorIdx];
                return (
                  <div
                    key={index}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center ${textSizeClass} font-bold text-white select-none`}
                    style={{
                      background: bubbleColor.bg,
                      boxShadow: `inset 0 -4px 8px rgba(0,0,0,0.3), 0 2px 8px rgba(${bubbleColor.shadow}, 0.4)`,
                    }}
                  >
                    {displaySkill}
                    {/* Sparkle decorations */}
                    <span
                      className="absolute text-[8px] text-white/80 pointer-events-none"
                      style={{ top: '3px', right: '6px' }}
                      aria-hidden="true"
                    >
                      *
                    </span>
                    <span
                      className="absolute text-[6px] text-white/60 pointer-events-none"
                      style={{ bottom: '8px', left: '5px' }}
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note preview — staff image + mini keyboard for Discovery nodes */}
          <NotePreview node={node} />

          {/* Loading skeleton — reserves space while exercise progress loads to prevent layout shift */}
          {isUnlocked && isLoading && (
            <div className="mb-4 space-y-2 animate-pulse">
              {(stars > 0) && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                  <div className="h-3 bg-white/10 rounded w-1/3 mx-auto mb-2" />
                  <div className="h-2 bg-white/10 rounded-full" />
                </div>
              )}
              {totalExercises > 1 && node.exercises.map((_, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className="h-5 w-5 rounded-full bg-white/10 flex-shrink-0" />
                  <div className="h-3 bg-white/10 rounded w-24" />
                </div>
              ))}
            </div>
          )}

          {/* Progress section (if unlocked and has been played) */}
          {isUnlocked && !isLoading && (stars > 0 || exercisesCompleted > 0) && (
            <div className="mb-4 rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold text-white/80 text-center">{t('modal.yourProgress')}</h3>

              {/* Node Stars (only show if all exercises complete) */}
              {allExercisesComplete && (
                <div className="mb-2 flex items-center justify-center gap-1.5">
                  {[1, 2, 3].map((starNum) => (
                    <GoldStar
                      key={starNum}
                      size={28}
                      filled={starNum <= stars}
                      glow={starNum <= stars}
                    />
                  ))}
                </div>
              )}

              {/* Exercises progress bar (hidden while loading) */}
              {!isLoading && totalExercises > 1 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>{t('modal.exercises')}</span>
                    <span>{t('modal.exerciseCount', { completed: exercisesCompleted, total: totalExercises })}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressGradient} transition-all duration-300`}
                      style={{ width: `${(exercisesCompleted / totalExercises) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Best score */}
              {bestScore > 0 && allExercisesComplete && (
                <p className="text-xs sm:text-sm text-white/60 text-center">
                  {t('modal.bestScore')} <span className="font-bold text-white">{t('modal.bestScoreValue', { score: bestScore })}</span>
                </p>
              )}
            </div>
          )}

          {/* Exercise List (if multiple exercises, hidden while loading) */}
          {isUnlocked && !isLoading && totalExercises > 1 && (
            <div className="mb-4">
              <h3 className="mb-2 text-xs sm:text-sm font-semibold text-white/80">{t('modal.exercises')}</h3>
              <div className="space-y-1.5 sm:space-y-2">
                {node.exercises.map((exercise, index) => {
                  const epData = getExerciseData(index);
                  const isCompleted = epData && epData.stars > 0;
                  const isNext = index === nextExerciseIndex;
                  const isLocked = index > 0 && !getExerciseData(index - 1)?.stars;

                  return (
                    <div
                      key={index}
                      className={`
                        flex items-center justify-between rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 transition-colors
                        ${isNext ? `bg-white/10 border ${headerColors.border}` : 'bg-white/5'}
                        ${isCompleted ? 'bg-emerald-500/10' : ''}
                      `}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* Status indicator */}
                        <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs sm:text-sm font-medium">
                          {isCompleted ? (
                            <span className="text-emerald-400">&#10003;</span>
                          ) : isLocked ? (
                            <span className="text-gray-600">&#128274;</span>
                          ) : (
                            <span className="text-white/50">{index + 1}</span>
                          )}
                        </span>

                        {/* Exercise name */}
                        <span className={`text-xs sm:text-sm ${isLocked ? 'text-white/30' : 'text-white/80'}`}>
                          {getExerciseTypeName(exercise.type, t)}
                        </span>
                      </div>

                      {/* Stars or action */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isCompleted && epData ? (
                          // Show stars earned + replay button for completed exercises
                          <>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3].map((s) => (
                                <GoldStar
                                  key={s}
                                  size={16}
                                  filled={s <= epData.stars}
                                />
                              ))}
                            </div>
                            <button
                              onClick={() => navigateToExercise(index)}
                              className="rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/20 whitespace-nowrap transition-colors"
                              aria-label={t('modal.replayButton')}
                            >
                              {t('modal.replayButton')}
                            </button>
                          </>
                        ) : isNext ? (
                          // Show Start button for next exercise
                          <button
                            onClick={() => navigateToExercise(index)}
                            className={`rounded-md ${progressGradient} px-2 py-1 text-xs font-medium text-white hover:scale-[1.02] whitespace-nowrap transition-transform`}
                          >
                            {t('modal.startButton')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* XP Reward card */}
          <div className="mb-4 rounded-xl bg-white/5 border border-white/10 p-4 flex items-center justify-center gap-4">
            <GoldStar size={48} filled glow />
            <div className="text-center">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {node.xpReward}
              </span>
              <p className="text-xs text-white/50">{t('modal.xpReward')}</p>
            </div>
          </div>

          {/* Accessory unlock (if applicable) */}
          {node.accessoryUnlock && (
            <div className="mb-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 p-2.5 sm:p-3">
              <p className="text-xs font-medium text-yellow-300 text-center">
                &#127873; {t('modal.unlockLabel')} <span className="font-bold">{t(`trail:accessories.${node.accessoryUnlock}`, { defaultValue: node.accessoryUnlock.replace(/_/g, ' ') })}</span>
              </p>
            </div>
          )}

          {/* Boss unlock hint (prominent display for locked boss nodes) */}
          {!isUnlocked && !isPremiumLocked && node.isBoss && node.unlockHint && (
            <div className="mb-4 rounded-xl bg-yellow-400/10 border-2 border-yellow-500/30 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    <span className="text-3xl sm:text-4xl">&#128274;</span>
                  </div>
                </div>
                <div>
                  <h3
                    className="text-base sm:text-lg font-black text-yellow-400 mb-2 uppercase tracking-wide"
                    style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.3)' }}
                  >
                    {t('modal.bossUnlockTitle', { defaultValue: 'How to Unlock This Challenge' })}
                  </h3>
                  <p className="text-sm sm:text-base text-white/80 font-bold leading-relaxed">
                    {t(`unlockHints.${node.name}`, { defaultValue: node.unlockHint })}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* Paywall message for premium-locked nodes */}
          {isPremiumLocked && (
            <div className="mb-4 rounded-xl bg-amber-400/10 border border-amber-400/30 p-4 text-center">
              <Sparkles size={28} className="mx-auto mb-2 text-amber-400" />
              <p className="text-sm font-medium text-amber-300">
                {t('trail:modal.premiumMessage')}
              </p>
            </div>
          )}

          {/* Action buttons -- pill-shaped */}
          <div className={`flex gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {isPremiumLocked ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white/70 transition-colors hover:bg-white/15"
                >
                  {t('trail:modal.button.gotIt')}
                </button>
                <button
                  onClick={() => { onClose(); navigate('/subscribe'); }}
                  className="flex-1 rounded-full bg-gradient-to-b from-amber-400 to-yellow-500 px-6 py-3 text-base font-bold text-amber-900 transition-transform hover:scale-[1.02] duration-200"
                >
                  {t('trail:modal.button.askParent')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-full bg-white/10 px-6 py-3 text-base font-semibold text-white/70 transition-colors hover:bg-white/15"
                >
                  {t('common:actions.cancel', { defaultValue: 'Cancel' })}
                </button>
                <button
                  onClick={handleStartPractice}
                  disabled={!isUnlocked || isLoading}
                  className={`
                    flex-1 rounded-full px-6 py-3 text-base font-bold text-white shadow-lg transition-all duration-200
                    ${
                      !isUnlocked
                        ? 'cursor-not-allowed bg-gray-700 text-gray-500'
                        : isLoading
                          ? `${progressGradient} opacity-70 cursor-wait`
                          : `${progressGradient} hover:scale-[1.02] hover:shadow-xl`
                    }
                  `}
                >
                  {!isUnlocked
                    ? t('modal.button.locked')
                    : isLoading
                      ? (stars > 0 ? t('modal.button.practiceAgain') : t('modal.button.startPractice'))
                      : allExercisesComplete
                        ? t('modal.button.practiceAgain')
                        : nextExerciseIndex === 0
                          ? t('modal.button.startPractice')
                          : t('modal.button.continue', { completed: exercisesCompleted, total: totalExercises })
                  }
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailNodeModal;
