/**
 * TrailNodeModal Component
 *
 * Displays detailed information about a trail node and allows starting practice.
 * Shows exercise list with completion status for sequential exercise progression.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNodeById } from '../../data/skillTrail';
import { getExerciseProgress, getNextExerciseIndex } from '../../services/skillProgressService';
import { useUser } from '../../features/authentication/useUser';

/**
 * Get display name for exercise type
 */
const getExerciseTypeName = (type) => {
  switch (type) {
    case 'note_recognition':
      return 'Note Recognition';
    case 'sight_reading':
      return 'Sight Reading';
    case 'rhythm':
      return 'Rhythm Practice';
    case 'boss_challenge':
      return 'Boss Challenge';
    default:
      return type;
  }
};

const TrailNodeModal = ({ node, progress, isUnlocked, prerequisites = [], onClose }) => {
  const navigate = useNavigate();
  const { user } = useUser();
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

  // Check if all exercises are complete
  const allExercisesComplete = exercisesCompleted >= totalExercises && totalExercises > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md rounded-2xl bg-white p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto modal-scrollbar">
        {/* Header */}
        <div className="mb-3 sm:mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{node.name}</h2>
              {node.isBoss && <span className="text-xl sm:text-2xl">&#128081;</span>}
            </div>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">{node.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-2 rounded-lg p-1.5 sm:p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex-shrink-0"
            aria-label="Close"
          >
            &#10005;
          </button>
        </div>

        {/* Progress section (if unlocked) */}
        {isUnlocked && (
          <div className="mb-3 sm:mb-4 rounded-xl bg-gray-50 p-3 sm:p-4">
            <h3 className="mb-2 text-xs sm:text-sm font-semibold text-gray-700">Your Progress</h3>

            {/* Node Stars (only show if all exercises complete) */}
            {allExercisesComplete && (
              <div className="mb-2 flex items-center gap-1">
                {[1, 2, 3].map((starNum) => (
                  <span
                    key={starNum}
                    className={`text-xl sm:text-2xl ${
                      starNum <= stars ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    &#11088;
                  </span>
                ))}
              </div>
            )}

            {/* Exercises progress bar */}
            {totalExercises > 1 && (
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>Exercises</span>
                  <span>{exercisesCompleted}/{totalExercises}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(exercisesCompleted / totalExercises) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Best score */}
            {bestScore > 0 && allExercisesComplete && (
              <p className="text-xs sm:text-sm text-gray-600">
                Best Score: <span className="font-bold text-gray-900">{bestScore}%</span>
              </p>
            )}
          </div>
        )}

        {/* Exercise List (if multiple exercises) */}
        {isUnlocked && totalExercises > 1 && (
          <div className="mb-3 sm:mb-4">
            <h3 className="mb-2 text-xs sm:text-sm font-semibold text-gray-700">Exercises</h3>
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
                      ${isNext ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}
                      ${isCompleted ? 'bg-green-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Status indicator */}
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs sm:text-sm font-medium">
                        {isCompleted ? (
                          <span className="text-green-600">&#10003;</span>
                        ) : isLocked ? (
                          <span className="text-gray-400">&#128274;</span>
                        ) : (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                      </span>

                      {/* Exercise name */}
                      <span className={`text-xs sm:text-sm ${isLocked ? 'text-gray-400' : 'text-gray-700'}`}>
                        {getExerciseTypeName(exercise.type)}
                      </span>
                    </div>

                    {/* Stars or action */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isCompleted && epData ? (
                        // Show stars earned
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <span
                              key={s}
                              className={`text-xs sm:text-sm ${s <= epData.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                              &#11088;
                            </span>
                          ))}
                        </div>
                      ) : isNext ? (
                        // Show "Start" button for next exercise
                        <button
                          onClick={() => navigateToExercise(index)}
                          className="rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 whitespace-nowrap"
                        >
                          Start
                        </button>
                      ) : isCompleted ? (
                        // Replay button for completed
                        <button
                          onClick={() => navigateToExercise(index)}
                          className="rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-300 whitespace-nowrap"
                        >
                          Replay
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
          <h3 className="mb-2 text-xs sm:text-sm font-semibold text-gray-700">Skills You'll Learn</h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {node.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-blue-100 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* XP reward */}
        <div className="mb-3 sm:mb-4 flex items-center justify-between rounded-lg bg-purple-50 p-2.5 sm:p-3">
          <span className="text-xs sm:text-sm font-medium text-purple-900">XP Reward</span>
          <span className="text-base sm:text-lg font-bold text-purple-600">
            {node.xpReward} x &#11088; stars
          </span>
        </div>

        {/* Accessory unlock (if applicable) */}
        {node.accessoryUnlock && (
          <div className="mb-3 sm:mb-4 rounded-lg bg-yellow-50 p-2.5 sm:p-3">
            <p className="text-xs font-medium text-yellow-900">
              &#127873; Unlock: <span className="font-bold">{node.accessoryUnlock}</span>
            </p>
          </div>
        )}

        {/* Prerequisites (if locked) */}
        {!isUnlocked && prerequisites.length > 0 && (
          <div className="mb-3 sm:mb-4 rounded-lg bg-red-50 p-2.5 sm:p-3">
            <h3 className="mb-2 text-xs sm:text-sm font-semibold text-red-900">
              &#128274; Complete These First:
            </h3>
            <ul className="list-inside list-disc text-xs sm:text-sm text-red-700">
              {prerequisites.map((prereqId) => {
                const prereqNode = getNodeById(prereqId);
                return (
                  <li key={prereqId}>{prereqNode?.name || prereqId}</li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-300 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleStartPractice}
            disabled={!isUnlocked}
            className={`
              flex-1 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-lg transition-all
              ${
                isUnlocked
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl'
                  : 'cursor-not-allowed bg-gray-300 text-gray-500'
              }
            `}
          >
            {!isUnlocked
              ? 'Locked'
              : allExercisesComplete
                ? 'Practice Again'
                : nextExerciseIndex === 0
                  ? 'Start Practice'
                  : `Continue (${exercisesCompleted}/${totalExercises})`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrailNodeModal;
