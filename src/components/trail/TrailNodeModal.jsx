/**
 * TrailNodeModal Component
 *
 * Displays detailed information about a trail node and allows starting practice.
 * Shows exercise list with completion status for sequential exercise progression.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getNodeById } from '../../data/skillTrail';
import { getExerciseProgress, getNextExerciseIndex } from '../../services/skillProgressService';
import { useUser } from '../../features/authentication/useUser';
import { translateNodeName } from '../../utils/translateNodeName';
import { getNodeTypeIcon, getCategoryColors } from '../../utils/nodeTypeStyles';

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
    default:
      return type;
  }
};

const TrailNodeModal = ({ node, progress, isUnlocked, prerequisites = [], onClose }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { t, i18n } = useTranslation(['trail', 'common']);
  const isRTL = i18n.dir() === 'rtl';
  const [exerciseProgress, setExerciseProgress] = useState([]);
  const [nextExerciseIndex, setNextExerciseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  if (!node) return null;

  const totalExercises = node.exercises?.length || 0;

  // Fetch exercise progress when modal opens
  useEffect(() => {
    const fetchExerciseProgress = async () => {
      if (!user?.id || !node?.id) {
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
  }, [user?.id, node?.id, totalExercises]);

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

    // Common navigation state
    const navState = {
      nodeId: node.id,
      nodeConfig: exercise.config,
      exerciseIndex: exerciseIndex,
      totalExercises: totalExercises,
      exerciseType: exercise.type
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
  const NodeIcon = getNodeTypeIcon(node.nodeType, node.category);
  const headerColors = getCategoryColors(
    node.isBoss ? 'boss' : node.category,
    isUnlocked ? 'available' : 'locked'
  );

  // Determine skill badge colors based on category (dark theme)
  const skillBadgeColors = node.isBoss
    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
    : node.category === 'treble_clef'
      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
      : node.category === 'bass_clef'
        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
        : node.category === 'rhythm'
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
          : 'bg-blue-500/20 text-blue-300 border border-blue-400/30';

  // Category-aware gradient for progress bar and CTA button
  const progressGradient = node.isBoss
    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
    : node.category === 'treble_clef'
      ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
      : node.category === 'bass_clef'
        ? 'bg-gradient-to-r from-purple-500 to-violet-600'
        : node.category === 'rhythm'
          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600';

  return (
    <div className="fixed inset-0 z-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-slate-800/95 backdrop-blur-sm border ${headerColors.border} shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden modal-scrollbar ${isRTL ? 'text-right' : ''}`}>
        {/* Category accent strip */}
        <div className={`h-1 w-full rounded-t-2xl ${headerColors.bg}`} />

        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className={`mb-3 sm:mb-4 flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="flex-1">
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                {/* Node type icon with category color background + glow */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${headerColors.bg} ${headerColors.border} border ${headerColors.glow}`}>
                  <NodeIcon size={18} className={headerColors.text} strokeWidth={2} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{translateNodeName(node.name, t, i18n)}</h2>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-white/70">{t(`descriptions.${node.name}`, { defaultValue: node.description })}</p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-lg p-1.5 sm:p-2 text-white/50 hover:bg-white/10 hover:text-white/80 flex-shrink-0 transition-colors ${isRTL ? 'mr-2' : 'ml-2'}`}
              aria-label={t('common:actions.close', { defaultValue: 'Close' })}
            >
              &#10005;
            </button>
          </div>

          {/* Progress section (if unlocked) */}
          {isUnlocked && (
            <div className="mb-3 sm:mb-4 rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4">
              <h3 className="mb-2 text-xs sm:text-sm font-semibold text-white/80">{t('modal.yourProgress')}</h3>

              {/* Node Stars (only show if all exercises complete) */}
              {allExercisesComplete && (
                <div className="mb-2 flex items-center gap-1">
                  {[1, 2, 3].map((starNum) => (
                    <span
                      key={starNum}
                      className={`text-xl sm:text-2xl drop-shadow-lg ${
                        starNum <= stars ? 'text-yellow-400' : 'text-gray-600'
                      }`}
                    >
                      &#11088;
                    </span>
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
                <p className="text-xs sm:text-sm text-white/60">
                  {t('modal.bestScore')} <span className="font-bold text-white">{t('modal.bestScoreValue', { score: bestScore })}</span>
                </p>
              )}
            </div>
          )}

          {/* Exercise List (if multiple exercises, hidden while loading) */}
          {isUnlocked && !isLoading && totalExercises > 1 && (
            <div className="mb-3 sm:mb-4">
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
                                <span
                                  key={s}
                                  className={`text-xs sm:text-sm ${s <= epData.stars ? 'text-yellow-400' : 'text-gray-600'}`}
                                >
                                  &#11088;
                                </span>
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
                          // Show "Start" button for next exercise
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

          {/* Skills covered */}
          <div className="mb-3 sm:mb-4">
            <h3 className="mb-2 text-xs sm:text-sm font-semibold text-white/80">{t('modal.skillsYoullLearn')}</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {node.skills.map((skill, index) => (
                <span
                  key={index}
                  className={`rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium ${skillBadgeColors}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* XP reward */}
          <div className="mb-3 sm:mb-4 flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-2.5 sm:p-3">
            <span className="text-xs sm:text-sm font-medium text-white/80">{t('modal.xpReward')}</span>
            <span className="text-base sm:text-lg font-bold text-purple-400">
              {t('modal.xpRewardValue', { xp: node.xpReward })}
            </span>
          </div>

          {/* Accessory unlock (if applicable) */}
          {node.accessoryUnlock && (
            <div className="mb-3 sm:mb-4 rounded-lg bg-yellow-400/10 border border-yellow-400/30 p-2.5 sm:p-3">
              <p className="text-xs font-medium text-yellow-300">
                &#127873; {t('modal.unlockLabel')} <span className="font-bold">{node.accessoryUnlock}</span>
              </p>
            </div>
          )}

          {/* Boss unlock hint (prominent display for locked boss nodes) */}
          {!isUnlocked && node.isBoss && node.unlockHint && (
            <div className="mb-3 sm:mb-4 rounded-xl bg-yellow-400/10 border-2 border-yellow-500/30 p-4 sm:p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                    <span className="text-3xl sm:text-4xl">&#128274;</span>
                  </div>
                </div>
                <div className="flex-1">
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

          {/* Prerequisites (if locked and has prerequisites) */}
          {!isUnlocked && prerequisites.length > 0 && (
            <div className="mb-3 sm:mb-4 rounded-lg bg-red-500/10 border border-red-400/30 p-2.5 sm:p-3">
              <h3 className="mb-2 text-xs sm:text-sm font-semibold text-red-400">
                &#128274; {t('modal.prerequisites')}
              </h3>
              <ul className="list-inside list-disc text-xs sm:text-sm text-red-400/80">
                {prerequisites.map((prereqId) => {
                  const prereqNode = getNodeById(prereqId);
                  return (
                    <li key={prereqId}>{prereqNode ? translateNodeName(prereqNode.name, t, i18n) : prereqId}</li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className={`flex gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-b from-gray-100 to-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-700 transition-transform hover:scale-[1.02] duration-200"
            >
              {t('common:actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              onClick={handleStartPractice}
              disabled={!isUnlocked || isLoading}
              className={`
                flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-lg transition-all duration-200
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailNodeModal;
