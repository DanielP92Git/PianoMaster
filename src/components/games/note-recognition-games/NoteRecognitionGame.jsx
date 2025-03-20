import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import doImage from "../../../assets/noteImages/treble-do-middle.svg";
import reImage from "../../../assets/noteImages/treble-re-first.svg";
import miImage from "../../../assets/noteImages/treble-mi-first.svg";
import faImage from "../../../assets/noteImages/treble-fa-first.svg";
import solImage from "../../../assets/noteImages/treble-sol-first.svg";
import laImage from "../../../assets/noteImages/treble-la-first.svg";
import siImage from "../../../assets/noteImages/treble-si-first.svg";
import bassDoImage from "../../../assets/noteImages/bass-do-middle.svg";
import bassReImage from "../../../assets/noteImages/bass-re-small.svg";
import bassMiImage from "../../../assets/noteImages/bass-mi-small.svg";
import bassFaImage from "../../../assets/noteImages/bass-fa-small.svg";
import bassSolImage from "../../../assets/noteImages/bass-sol-small.svg";
import bassLaImage from "../../../assets/noteImages/bass-la-small.svg";
import bassSiImage from "../../../assets/noteImages/bass-si-small.svg";
import BackButton from "../../ui/BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";
import GameOverScreen from "../GameOverScreen";
import { FaPlay, FaPause } from "react-icons/fa";
import { GameSettings } from "../shared/GameSettings";
import { useGameSettings } from "../../../features/games/hooks/useGameSettings";
import { useGameProgress } from "../../../features/games/hooks/useGameProgress";
import { useSounds } from "../../../features/games/hooks/useSounds";

const trebleNotes = [
  { note: "דו", image: doImage },
  { note: "רה", image: reImage },
  { note: "מי", image: miImage },
  { note: "פה", image: faImage },
  { note: "סול", image: solImage },
  { note: "לה", image: laImage },
  { note: "סי", image: siImage },
];

const bassNotes = [
  { note: "דו", image: bassDoImage },
  { note: "סי", image: bassSiImage },
  { note: "לה", image: bassLaImage },
  { note: "סול", image: bassSolImage },
  { note: "פה", image: bassFaImage },
  { note: "מי", image: bassMiImage },
  { note: "רה", image: bassReImage },
];

// Simple timer display component
const TimerDisplay = ({ formattedTime }) => {
  return (
    <div className="timer-display flex items-center text-white bg-black/30 px-3 py-1 rounded-lg">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Time: {formattedTime || "00:00"}
    </div>
  );
};

// Progress bar component to track answered questions
const ProgressBar = ({ current, total }) => {
  const progressPercent = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full bg-white/20 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
      <div
        className="bg-indigo-500 h-3 rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
        style={{ width: `${progressPercent}%` }}
      >
        {progressPercent > 15 && (
          <span className="text-xs text-white font-medium">
            {current}/{total}
          </span>
        )}
      </div>
      <div className="text-xs text-white text-center mt-1 font-medium">
        Question {current} of {total}
      </div>
    </div>
  );
};

export function NoteRecognitionGame() {
  // Game settings with defaults
  const { settings, updateSettings, resetSettings } = useGameSettings({
    timedMode: false,
    timeLimit: 45,
  });

  const { progress, updateProgress, handleAnswer, finishGame, resetProgress } =
    useGameProgress();

  // Use the centralized sounds hook
  const {
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    playGameOverSound,
  } = useSounds();

  // Game state
  const [gameOver, setGameOver] = useState(false);

  // Timer implementation
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, [timeRemaining]);

  // Add this after the other useRef declarations
  const prevTimedMode = useRef(settings.timedMode);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerActive(false);
    }
  }, []);

  // Reset the timer
  const resetTimer = useCallback((newTime = 45) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeRemaining(newTime);
    setIsTimerActive(false);
  }, []);

  // Handle game over logic
  const handleGameOver = useCallback(() => {
    if (gameOver) return;

    const scorePercentage =
      (progress.correctAnswers / Math.max(1, progress.totalQuestions)) * 100;

    // Only consider time running out as a loss condition if in timed mode
    const isLost =
      scorePercentage < 50 || (settings.timedMode && timeRemaining === 0);
    const timeRanOut = settings.timedMode && timeRemaining === 0;

    setTimeout(() => {
      if (isLost) {
        playGameOverSound();
      } else {
        playVictorySound();
      }
    }, 300);

    pauseTimer();
    setGameOver(true);
    finishGame(isLost, timeRanOut);
  }, [
    gameOver,
    progress.correctAnswers,
    progress.totalQuestions,
    timeRemaining,
    pauseTimer,
    finishGame,
    settings.timedMode,
    playGameOverSound,
    playVictorySound,
  ]);

  // Start the timer
  const startTimer = useCallback(() => {
    // Don't start timer if game hasn't started or if already running or if not in timed mode
    if (!progress.isStarted || timerRef.current || !settings.timedMode) {
      return;
    }

    setIsTimerActive(true);

    timerRef.current = setInterval(() => {
      setTimeRemaining((time) => {
        if (time <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsTimerActive(false);

          setTimeout(() => handleGameOver(), 50);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }, [progress.isStarted, handleGameOver, settings.timedMode]);

  // Get random note based on current settings
  const getRandomNote = () => {
    const notesArray = settings.clef === "Treble" ? trebleNotes : bassNotes;

    let selectedNotes = settings.selectedNotes;
    if (!Array.isArray(selectedNotes) || selectedNotes.length < 2) {
      selectedNotes = notesArray.map((note) => note.note);
      updateSettings({
        ...settings,
        selectedNotes: selectedNotes,
      });
    }

    const filteredNotes = notesArray.filter((note) =>
      selectedNotes.includes(note.note)
    );

    if (filteredNotes.length === 0) {
      const allNotes = notesArray;
      return allNotes[Math.floor(Math.random() * allNotes.length)];
    }

    return filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
  };

  // Handle game settings from the GameSettings component
  const handleGameSettings = (newSettings) => {
    if (!newSettings) return;

    const clef = newSettings.clef === "Bass" ? "Bass" : "Treble";

    let selectedNotes = Array.isArray(newSettings.selectedNotes)
      ? newSettings.selectedNotes
      : [];

    if (selectedNotes.length < 2) {
      selectedNotes =
        clef === "Treble"
          ? trebleNotes.map((note) => note.note)
          : bassNotes.map((note) => note.note);
    }

    // Make sure timedMode is explicitly set
    const timedMode =
      newSettings.timedMode !== undefined ? newSettings.timedMode : false;

    // Calculate time limit based on timedMode and difficulty
    const timeLimit = timedMode ? newSettings.timeLimit || 45 : 45;

    const completeSettings = {
      clef,
      selectedNotes,
      timedMode,
      difficulty: newSettings.difficulty || "Medium",
      timeLimit,
    };

    updateSettings(completeSettings);
    resetTimer(timeLimit);

    setTimeout(() => {
      startGame(completeSettings);
    }, 100);
  };

  // Start the game with current or new settings
  const startGame = (gameSettings = settings) => {
    if (!gameSettings.selectedNotes || gameSettings.selectedNotes.length < 2) {
      gameSettings.selectedNotes =
        gameSettings.clef === "Treble"
          ? trebleNotes.map((note) => note.note)
          : bassNotes.map((note) => note.note);
    }

    // Make sure we capture the timedMode correctly
    const timedMode =
      gameSettings.timedMode !== undefined ? gameSettings.timedMode : false;

    const updatedSettings = {
      ...gameSettings,
      timedMode, // Ensure timedMode is explicitly set
    };

    updateSettings(updatedSettings);
    resetProgress();
    setGameOver(false);

    const timeLimit = updatedSettings.timeLimit || 45;
    pauseTimer();
    resetTimer(timeLimit);

    const firstNote = getRandomNote();
    if (!firstNote) {
      console.error("Failed to get initial note");
      return;
    }

    updateProgress({
      currentNote: firstNote,
      isStarted: true,
      totalQuestions: 0,
      correctAnswers: 0,
      score: 0,
    });

    // Clear any previous timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset timer regardless of mode
    setTimeRemaining(timeLimit);
    setIsTimerActive(false);

    // Only start timer if in timed mode
    if (updatedSettings.timedMode) {
      setTimeout(() => {
        startTimer();
      }, 300);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (selectedAnswer) => {
    if (!progress.currentNote) return;

    const isCorrect = handleAnswer(selectedAnswer, progress.currentNote.note);
    playSound(isCorrect);

    // In timed mode, we end after 10 questions
    // In non-timed mode, keep going until user chooses to end
    if (settings.timedMode && progress.totalQuestions >= 9) {
      handleGameOver();
      return;
    }

    updateProgress({
      currentNote: getRandomNote(),
    });
  };

  // Handle pause game
  const handlePauseGame = () => {
    pauseTimer();
    updateProgress({ showSettingsModal: true });
  };

  // Handle resume game from settings modal
  const handleResumeGame = () => {
    updateProgress({ showSettingsModal: false });

    setTimeout(() => {
      // Only restart timer if in timed mode and there's time remaining
      if (settings.timedMode && timeRemaining > 0) {
        startTimer();
      } else if (timeRemaining === 0) {
        handleGameOver();
      }
    }, 100);
  };

  // Handle restart game from settings modal
  const handleRestartGame = (newSettings) => {
    updateProgress({ showSettingsModal: false });

    if (!newSettings || !newSettings.selectedNotes) {
      newSettings = {
        clef: settings.clef,
        selectedNotes: settings.selectedNotes,
        timedMode: settings.timedMode,
        difficulty: settings.difficulty,
        timeLimit: settings.timeLimit,
      };
    }

    updateSettings(newSettings);

    setTimeout(() => {
      startGame(newSettings);
    }, 100);
  };

  // Function to play sounds
  const playSound = (isCorrect) => {
    if (isCorrect) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Effect to handle timer behavior
  useEffect(() => {
    // Start timer when game starts, but only if in timed mode
    if (
      progress.isStarted &&
      !gameOver &&
      !isTimerActive &&
      settings.timedMode
    ) {
      startTimer();
    }

    // End game when time runs out, but only if in timed mode
    if (
      progress.isStarted &&
      !gameOver &&
      settings.timedMode &&
      timeRemaining === 0
    ) {
      handleGameOver();
    }
  }, [
    progress.isStarted,
    gameOver,
    isTimerActive,
    timeRemaining,
    startTimer,
    handleGameOver,
    settings.timedMode,
  ]);

  // Update the handleSettingsChange function
  const handleSettingsChange = (changedSettings) => {
    // Only update settings if timedMode actually changed
    if (
      changedSettings.timedMode !== undefined &&
      changedSettings.timedMode !== prevTimedMode.current
    ) {
      // Update our ref to track the new value
      prevTimedMode.current = changedSettings.timedMode;

      // Update settings with the new timedMode
      updateSettings({
        ...settings,
        timedMode: changedSettings.timedMode,
      });
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="p-2">
        <BackButton
          to="/note-recognition-mode"
          name="Note Recognition"
          styling="text-white/80 hover:text-white text-sm"
        />
      </div>

      {progress.showFireworks && <Firework />}

      {!progress.isStarted ? (
        <GameSettings
          gameType="note-recognition"
          onStart={handleGameSettings}
          onChange={handleSettingsChange}
          initialClef={settings.clef}
          initialSelectedNotes={settings.selectedNotes}
          initialTimedMode={settings.timedMode}
          initialDifficulty={settings.difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          noteOptions={settings.selectedNotes}
        />
      ) : progress.isFinished ? (
        progress.isLost ? (
          <GameOverScreen
            score={progress.score}
            totalQuestions={progress.totalQuestions}
            timeRanOut={progress.timeRanOut}
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
          />
        ) : (
          <VictoryScreen
            score={progress.score}
            totalPossibleScore={progress.totalQuestions * 10}
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
          />
        )
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Score and Timer at the top */}
          <div className="text-2xl font-bold text-white text-center mt-2 mb-3 flex justify-center items-center space-x-8">
            <span>Score: {progress.score}</span>

            {/* Always render appropriate mode indicator */}
            {settings.timedMode ? (
              <TimerDisplay formattedTime={formattedTime} />
            ) : (
              <div className="bg-green-600/70 text-white px-3 py-1 rounded-lg text-lg flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                Practice Mode
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-3xl mx-auto px-6 mb-4">
            <ProgressBar
              current={progress.totalQuestions}
              total={settings.timedMode ? 10 : 20} // Set higher goal for non-timed mode
            />
          </div>

          {/* Main game area */}
          <div className="flex items-center justify-center pt-5">
            <div className="flex flex-col w-full max-w-3xl px-4">
              <div className="flex w-full">
                {/* Note Buttons on the left */}
                <div className="grid grid-cols-2 gap-2 w-1/2 mr-4">
                  {(settings.clef === "Treble" ? trebleNotes : bassNotes).map(
                    (note) => (
                      <button
                        key={note.note}
                        onClick={() => handleAnswerSelect(note.note)}
                        className="px-3 py-1.5 backdrop-blur-sm border rounded-lg transition-colors bg-white/20 border-white/30 text-white hover:bg-white/30"
                      >
                        {note.note}
                      </button>
                    )
                  )}
                </div>

                {/* Current Note on the right */}
                <div className="w-1/2 flex justify-center">
                  {progress.currentNote ? (
                    <div className="bg-white rounded-xl p-2 w-48 h-48 flex items-center justify-center">
                      <img
                        src={progress.currentNote.image}
                        alt={`Musical Note: ${progress.currentNote.note}`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            settings.clef === "Treble"
                              ? trebleNotes[0].image
                              : bassNotes[0].image;
                        }}
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-2 w-48 h-48 flex items-center justify-center">
                      <span className="text-red-500">Note Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback Message - Below the game elements */}
              {progress.feedbackMessage && (
                <div
                  className={`mt-4 mb-2 rounded-lg p-3 animate-fadeIn text-center shadow-lg text-xl font-bold ${
                    progress.feedbackMessage.type === "correct"
                      ? "bg-emerald-600/80 text-white"
                      : "bg-rose-600/80 text-white"
                  }`}
                  dir="rtl"
                >
                  {progress.feedbackMessage.type === "correct" ? (
                    <span className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {progress.feedbackMessage.text}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      {progress.feedbackMessage.text}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings/Pause Button */}
      <div className="absolute top-2 right-2">
        {progress.isStarted && !progress.isFinished && (
          <button
            onClick={handlePauseGame}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center"
            aria-label="Pause"
          >
            <FaPause className="mr-1" />
            Pause
          </button>
        )}
      </div>

      {/* Settings Modal */}
      {progress.showSettingsModal && (
        <GameSettings
          gameType="note-recognition"
          isModal={true}
          onStart={handleRestartGame}
          onCancel={handleResumeGame}
          onChange={handleSettingsChange}
          initialClef={settings.clef}
          initialSelectedNotes={settings.selectedNotes}
          initialTimedMode={settings.timedMode}
          initialDifficulty={settings.difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          noteOptions={settings.selectedNotes}
        />
      )}
    </div>
  );
}
