import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../ui/BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";
import GameOverScreen from "../GameOverScreen";
import {
  FaPlay,
  FaPause,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import { GameSettings } from "../shared/UnifiedGameSettings";
import { useGameSettings } from "../../../features/games/hooks/useGameSettings";
import { useGameProgress } from "../../../features/games/hooks/useGameProgress";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  TREBLE_NOTES,
  BASS_NOTES,
} from "../sight-reading-game/constants/gameSettings";
import { useTranslation } from "react-i18next";

const TREBLE_RANGE_ORDER = [
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  "E5",
  "F5",
  "G5",
  "A5",
  "B5",
  "C6",
];

const BASS_RANGE_ORDER = [
  "B1",
  "C2",
  "D2",
  "E2",
  "F2",
  "G2",
  "A2",
  "B2",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
];

const buildOrderedNotes = (sourceNotes, order) => {
  const orderMap = new Map(order.map((pitch, index) => [pitch, index]));
  return sourceNotes
    .filter((note) => orderMap.has(note.englishName))
    .sort((a, b) => orderMap.get(a.englishName) - orderMap.get(b.englishName));
};

const trebleNotes = buildOrderedNotes(TREBLE_NOTES, TREBLE_RANGE_ORDER);
const bassNotes = buildOrderedNotes(BASS_NOTES, BASS_RANGE_ORDER);

const getClefNotes = (clef) => (clef === "Bass" ? bassNotes : trebleNotes);
const normalizeSelectedNotes = (selectedNotes, clef) => {
  const clefNotes = getClefNotes(clef);
  if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) {
    return [];
  }

  const pitchSet = new Set(clefNotes.map((note) => note.pitch));
  const nameToPitch = new Map(clefNotes.map((note) => [note.note, note.pitch]));

  const normalized = selectedNotes
    .map((value) => {
      if (pitchSet.has(value)) return value;
      return nameToPitch.get(value);
    })
    .filter(Boolean);

  return normalized.length > 0 ? normalized : defaultSelection;
};

const NOTE_RECOGNITION_STEPS = [
  {
    id: "clef",
    title: "gameSettings.steps.labels.clef",
    component: "ClefSelection",
  },
  {
    id: "notes",
    title: "gameSettings.steps.labels.notes",
    component: "NoteSelection",
    config: { showImages: true, minNotes: 2, noteIdField: "pitch" },
  },
  {
    id: "timedMode",
    title: "gameSettings.steps.labels.gameMode",
    component: "TimedModeSelection",
  },
];

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
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Game settings with defaults
  const { settings, updateSettings, resetSettings } = useGameSettings({
    timedMode: false,
    timeLimit: 45,
    selectedNotes: [],
  });
  const normalizedSelectedNotes = normalizeSelectedNotes(
    settings.selectedNotes,
    settings.clef
  );

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

  // Audio input state
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [detectedNote, setDetectedNote] = useState(null);
  const [audioInputLevel, setAudioInputLevel] = useState(0);

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

  // Reset game state when component mounts to ensure clean state
  useEffect(() => {
    resetProgress();
    // Don't reset settings on mount as it causes issues with GameSettings component
    setGameOver(false);
    resetTimer();
    setIsListening(false);
    setDetectedNote(null);
    setAudioInputLevel(0);
  }, [resetProgress, resetTimer]);

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
    const clefNotes = getClefNotes(settings.clef);
    const filteredNotes = clefNotes.filter((note) =>
      normalizedSelectedNotes.includes(note.pitch)
    );

    if (filteredNotes.length === 0) {
      return clefNotes[Math.floor(Math.random() * clefNotes.length)];
    }

    return filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
  };

  // Handle game settings from the GameSettings component
  const handleGameSettings = (newSettings) => {
    if (!newSettings) return;

    const clef = newSettings.clef === "Bass" ? "Bass" : "Treble";
    const selectedNotes = normalizeSelectedNotes(
      newSettings.selectedNotes,
      clef
    );

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
    const resolvedSelectedNotes = normalizeSelectedNotes(
      gameSettings.selectedNotes,
      gameSettings.clef
    );

    // Make sure we capture the timedMode correctly
    const timedMode =
      gameSettings.timedMode !== undefined ? gameSettings.timedMode : false;

    const updatedSettings = {
      ...gameSettings,
      selectedNotes: resolvedSelectedNotes,
      timedMode, // Ensure timedMode is explicitly set
    };

    updateSettings(updatedSettings);
    resetProgress();
    setGameOver(false);

    const timeLimit = updatedSettings.timeLimit || 45;
    pauseTimer();
    resetTimer(timeLimit);

    // Generate first note using the passed gameSettings instead of global settings
    const notesArray = getClefNotes(gameSettings.clef);
    const filteredNotes = notesArray.filter((note) =>
      resolvedSelectedNotes.includes(note.pitch)
    );

    const firstNote =
      filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
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

    // Check for game completion based on mode
    // Note: totalQuestions is incremented in handleAnswer, so we check the new value
    const newTotalQuestions = progress.totalQuestions + 1;

    if (settings.timedMode && newTotalQuestions >= 10) {
      // Timed mode: end after 10 questions
      handleGameOver();
      return;
    } else if (!settings.timedMode && newTotalQuestions >= 20) {
      // Practice mode: end after 20 questions
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

  // Note frequency mapping (A4 = 440Hz)
  const noteFrequencies = {
    דו: [261.63, 523.25, 1046.5], // C4, C5, C6
    רה: [293.66, 587.33, 1174.66], // D4, D5, D6
    מי: [329.63, 659.25, 1318.51], // E4, E5, E6
    פה: [349.23, 698.46, 1396.91], // F4, F5, F6
    סול: [392.0, 783.99, 1567.98], // G4, G5, G6
    לה: [440.0, 880.0, 1760.0], // A4, A5, A6
    סי: [493.88, 987.77, 1975.53], // B4, B5, B6
  };

  // Pitch detection using autocorrelation
  const detectPitch = useCallback((buffer) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    const GOOD_ENOUGH_CORRELATION = 0.9;

    // Calculate RMS
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Not enough signal
    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;

      if (
        correlation > GOOD_ENOUGH_CORRELATION &&
        correlation > lastCorrelation
      ) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        break;
      }
      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.01) {
      return 44100 / bestOffset;
    }
    return -1;
  }, []);

  // Convert frequency to note name
  const frequencyToNote = useCallback((frequency) => {
    if (frequency <= 0) return null;

    let closestNote = null;
    let minDifference = Infinity;

    Object.entries(noteFrequencies).forEach(([note, frequencies]) => {
      frequencies.forEach((freq) => {
        const difference = Math.abs(frequency - freq);
        const tolerance = freq * 0.05; // 5% tolerance
        if (difference < tolerance && difference < minDifference) {
          minDifference = difference;
          closestNote = note;
        }
      });
    });

    return closestNote;
  }, []);

  // Start audio input
  const startAudioInput = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;

      source.connect(analyserNode);

      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(stream);
      setIsListening(true);

      // Start pitch detection loop
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);

      const detectLoop = () => {
        if (!analyserNode) return;

        analyserNode.getFloatTimeDomainData(dataArray);

        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const level = Math.sqrt(sum / bufferLength);
        setAudioInputLevel(level);

        // Detect pitch
        const pitch = detectPitch(dataArray);
        const note = frequencyToNote(pitch);
        setDetectedNote(note);

        // Check if detected note matches current note
        if (
          note &&
          progress.currentNote &&
          note === progress.currentNote.note
        ) {
          handleAnswerSelect(note);
        }

        requestAnimationFrame(detectLoop);
      };

      detectLoop();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [detectPitch, frequencyToNote, progress.currentNote, handleAnswerSelect]);

  // Stop audio input
  const stopAudioInput = useCallback(() => {
    if (microphone) {
      microphone.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsListening(false);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
    setDetectedNote(null);
    setAudioInputLevel(0);
  }, [microphone, audioContext]);

  // Toggle audio input
  const toggleAudioInput = useCallback(() => {
    if (isListening) {
      stopAudioInput();
    } else {
      startAudioInput();
    }
  }, [isListening, stopAudioInput, startAudioInput]);

  // Cleanup audio input on unmount or game end
  useEffect(() => {
    return () => {
      stopAudioInput();
    };
  }, [stopAudioInput]);

  // Stop audio input when game finishes
  useEffect(() => {
    if (progress.isFinished) {
      stopAudioInput();
    }
  }, [progress.isFinished, stopAudioInput]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Only show back button during settings and gameplay (not on victory/game-over screens) */}
      {!progress.isFinished && (
        <div className="p-2 flex-shrink-0">
          <BackButton
            to="/practice-modes"
            name={t("games.backToModes")}
            styling="text-white/80 hover:text-white text-sm"
          />
        </div>
      )}

      {progress.showFireworks && <Firework />}

      {!progress.isStarted ? (
        <GameSettings
          gameType="note-recognition"
          steps={NOTE_RECOGNITION_STEPS}
          onStart={handleGameSettings}
          onChange={handleSettingsChange}
          initialClef={settings.clef}
          initialSelectedNotes={settings.selectedNotes}
          initialTimedMode={settings.timedMode}
          initialDifficulty={settings.difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          noteOptions={settings.selectedNotes}
          noteData={{ trebleNotes, bassNotes }}
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
            onExit={() => navigate("/practice-modes")}
          />
        )
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Score and Timer at the top */}
          <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mt-2 mb-3 flex justify-center items-center gap-2 sm:gap-3 md:gap-4 px-2">
            <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/20 flex items-center gap-1 sm:gap-2">
              <span className="text-white/70 text-sm sm:text-base md:text-lg">
                {t("games.score")}:
            </span>
              <span className="font-mono">{progress.score}</span>
            </div>

            {settings.timedMode ? (
              <div className="bg-white/10 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/20 flex items-center gap-1 sm:gap-2">
                <span className="text-white/70 text-sm sm:text-base md:text-lg">
                  {t("games.time")}:
              </span>
                <span className="font-mono">{formattedTime || "00:00"}</span>
              </div>
            ) : (
              <div className="bg-green-600/80 backdrop-blur-sm text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-green-400/30 text-sm sm:text-base md:text-lg flex items-center gap-1 sm:gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
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
                <span>{t("games.labels.practiceMode")}</span>
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

          {/* Audio Input Status */}
          {isListening && (
            <div className="w-full max-w-3xl mx-auto px-6 mb-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3">
                <div className="text-white/80 text-sm mb-2 text-center">
                  🎤 מאזין לנגינה
                </div>

                {/* Audio Level Meter */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-100"
                    style={{
                      width: `${Math.min(audioInputLevel * 1000, 100)}%`,
                    }}
                  />
                </div>

                {/* Detected Note */}
                {detectedNote && (
                  <div className="text-lg font-bold text-yellow-300 text-center">
                    זיהיתי: {detectedNote}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main game area */}
          <div className="flex items-center justify-center pt-5">
            <div className="flex flex-col w-full max-w-3xl px-4">
              <div className="flex w-full">
                {/* Note Buttons on the left */}
                <div className="grid grid-cols-2 gap-2 w-1/2 mr-4">
                  {(() => {
                    const allNotes =
                      settings.clef === "Treble" ? trebleNotes : bassNotes;
                    const filteredNotes =
                      Array.isArray(settings.selectedNotes) &&
                      settings.selectedNotes.length > 0
                        ? allNotes.filter((note) =>
                            settings.selectedNotes.includes(note.pitch)
                          )
                        : allNotes;

                    return filteredNotes;
                  })().map((note) => (
                    <button
                      key={note.note}
                      onClick={() => handleAnswerSelect(note.note)}
                      className="px-3 py-1.5 backdrop-blur-sm border rounded-lg transition-colors bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      {note.note}
                    </button>
                  ))}
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

      {/* Control Buttons */}
      <div className="absolute top-2 right-2 flex gap-2">
        {progress.isStarted && !progress.isFinished && (
          <>
            <button
              onClick={toggleAudioInput}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 backdrop-blur-md border border-white/20 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-medium ${
                isListening
                  ? "bg-red-600/80 hover:bg-red-700/80"
                  : "bg-green-600/80 hover:bg-green-700/80"
              }`}
              aria-label={
                isListening
                  ? t("games.actions.stopListening")
                  : t("games.actions.listen")
              }
            >
              {isListening ? (
                <FaMicrophoneSlash className="flex-shrink-0" />
              ) : (
                <FaMicrophone className="flex-shrink-0" />
              )}
              <span>
              {isListening
                  ? t("games.actions.stop")
                  : t("games.actions.listen")}
              </span>
            </button>
            <button
              onClick={handlePauseGame}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base font-medium"
              aria-label={t("games.actions.pause")}
            >
              <FaPause className="flex-shrink-0" />
              <span>{t("games.actions.pause")}</span>
            </button>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {progress.showSettingsModal && (
        <GameSettings
          gameType="note-recognition"
          steps={NOTE_RECOGNITION_STEPS}
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
          noteData={{ trebleNotes, bassNotes }}
        />
      )}
    </div>
  );
}
