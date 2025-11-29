import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { UnifiedGameSettings } from "../shared/UnifiedGameSettings";
import { useGameSettings } from "../../../features/games/hooks/useGameSettings";
import { useGameProgress } from "../../../features/games/hooks/useGameProgress";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  TREBLE_NOTES,
  BASS_NOTES,
} from "../sight-reading-game/constants/gameSettings";

// Use comprehensive note definitions from Sight Reading game
const trebleNotes = TREBLE_NOTES;
const bassNotes = BASS_NOTES;

// Audio level threshold for note release detection (percentage)
const RELEASE_THRESHOLD = 1.5; // 1.5% - low enough to catch release, high enough to avoid background noise

// Map Hebrew notes to piano sound files based on clef
const noteSoundFiles = {
  treble: {
    דו: () => import("../../../assets/sounds/piano/C4.mp3"),
    רה: () => import("../../../assets/sounds/piano/D4.mp3"),
    מי: () => import("../../../assets/sounds/piano/E4.mp3"),
    פה: () => import("../../../assets/sounds/piano/F4.mp3"),
    סול: () => import("../../../assets/sounds/piano/G4.mp3"),
    לה: () => import("../../../assets/sounds/piano/A4.mp3"),
    סי: () => import("../../../assets/sounds/piano/B4.mp3"),
  },
  bass: {
    דו: () => import("../../../assets/sounds/piano/C3.mp3"),
    רה: () => import("../../../assets/sounds/piano/D3.mp3"),
    מי: () => import("../../../assets/sounds/piano/E3.mp3"),
    פה: () => import("../../../assets/sounds/piano/F3.mp3"),
    סול: () => import("../../../assets/sounds/piano/G3.mp3"),
    לה: () => import("../../../assets/sounds/piano/A3.mp3"),
    סי: () => import("../../../assets/sounds/piano/B3.mp3"),
  },
};

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

export function NotesRecognitionGame() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [preloadedSounds, setPreloadedSounds] = useState({});
  const currentAudioRef = useRef(null);

  // Game settings with defaults
  const { settings, updateSettings, resetSettings } = useGameSettings({
    timedMode: false,
    timeLimit: 45,
    selectedNotes: ["דו", "רה", "מי", "פה", "סול"], // Default to 5 notes like sight reading
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

  // Audio input state
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false); // Ref for immediate access in closures
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [detectedNote, setDetectedNote] = useState(null);
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const lastMatchTimeRef = useRef(0); // Use ref instead of state for immediate updates
  const animationFrameRef = useRef(null);
  const stopAudioInputRef = useRef(null);

  // State for button highlighting feedback
  const [answerFeedback, setAnswerFeedback] = useState({
    selectedNote: null,
    correctNote: null,
    isCorrect: null,
  });

  // State for note release detection in Listen mode
  const [waitingForRelease, setWaitingForRelease] = useState(false);
  const [pendingNextNote, setPendingNextNote] = useState(null);

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

  // Preload piano sounds for instant playback
  useEffect(() => {
    const preloadSounds = async () => {
      const clefType = settings.clef === "Treble" ? "treble" : "bass";
      const soundsToLoad = noteSoundFiles[clefType];
      const loadedSounds = {};

      for (const [noteName, importFunc] of Object.entries(soundsToLoad)) {
        try {
          const soundModule = await importFunc();
          const audio = new Audio(soundModule.default);
          audio.volume = 1.0;
          audio.load(); // Preload the audio
          loadedSounds[noteName] = audio;
        } catch (error) {
          console.warn(`Failed to preload sound for ${noteName}:`, error);
        }
      }

      setPreloadedSounds(loadedSounds);
    };

    preloadSounds();
  }, [settings.clef]);

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

    // Allow the piano note to play briefly before stopping it for victory/game over sound
    setTimeout(() => {
      // Stop any currently playing piano note before playing victory/game over sound
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    }, 200);

    setTimeout(() => {
      if (isLost) {
        playGameOverSound();
      } else {
        playVictorySound();
      }
    }, 400);

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
    // Only use all notes as fallback if no notes are selected at all
    if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) {
      selectedNotes = notesArray.map((note) => note.note);
      // Don't call updateSettings here as it causes re-renders and overrides
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

    // Only use all notes as fallback if no notes are selected at all
    if (selectedNotes.length === 0) {
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
    // Only use all notes as fallback if no notes are selected at all
    if (
      !gameSettings.selectedNotes ||
      gameSettings.selectedNotes.length === 0
    ) {
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

    // Generate first note using the passed gameSettings instead of global settings
    const notesArray = gameSettings.clef === "Treble" ? trebleNotes : bassNotes;
    let selectedNotes = gameSettings.selectedNotes;

    // Only use all notes as fallback if no notes are selected at all
    if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) {
      selectedNotes = notesArray.map((note) => note.note);
    }

    const filteredNotes = notesArray.filter((note) =>
      selectedNotes.includes(note.note)
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
    console.log(
      `📝 [ANSWER SELECT] Called with: "${selectedAnswer}" | isListening: ${isListening} | Current target: "${progress.currentNote?.note}"`
    );

    if (!progress.currentNote) return;

    const isCorrect = handleAnswer(selectedAnswer, progress.currentNote.note);

    // Set feedback state to highlight the buttons
    setAnswerFeedback({
      selectedNote: selectedAnswer,
      correctNote: progress.currentNote.note,
      isCorrect: isCorrect,
    });

    playSound(isCorrect, progress.currentNote.note);

    // Note: totalQuestions is incremented in handleAnswer, so we check the new value
    const newTotalQuestions = progress.totalQuestions + 1;

    // In Listen mode, check game completion BEFORE setting up next note
    if (isListening) {
      // Check for game completion based on mode
      if (settings.timedMode && newTotalQuestions >= 10) {
        // Timed mode: end after 10 questions (don't wait for release)
        handleGameOver();
        return;
      } else if (!settings.timedMode && newTotalQuestions >= 20) {
        // Practice mode: end after 20 questions (don't wait for release)
        handleGameOver();
        return;
      }

      // Game not finished, wait for note release before advancing
      const nextNote = getRandomNote();
      setPendingNextNote(nextNote);
      setWaitingForRelease(true);
      console.log(
        `🎵 [WAITING FOR RELEASE] Next note ready: "${nextNote.note}" - waiting for audio level to drop below ${RELEASE_THRESHOLD}%`
      );
    } else {
      // Normal mode: check for game completion
      if (settings.timedMode && newTotalQuestions >= 10) {
        // Timed mode: end after 10 questions
        handleGameOver();
        return;
      } else if (!settings.timedMode && newTotalQuestions >= 20) {
        // Practice mode: end after 20 questions
        handleGameOver();
        return;
      }

      // Normal mode: clear feedback and move to next question after a brief delay
      setTimeout(() => {
        setAnswerFeedback({
          selectedNote: null,
          correctNote: null,
          isCorrect: null,
        });

        updateProgress({
          currentNote: getRandomNote(),
        });
      }, 800); // 800ms delay to show the feedback
    }
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

  // Function to play sounds based on answer correctness
  const playSound = useCallback(
    (isCorrect, noteName) => {
      // Don't play audio during pitch detection to avoid conflicts
      if (isListeningRef.current) {
        console.log(
          `🔇 [AUDIO MUTED] Skipping playback during Listen mode (note: ${noteName})`
        );
        return;
      }

      if (isCorrect && noteName) {
        // Stop any currently playing piano note
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }

        // Play the preloaded piano note for instant playback
        const audio = preloadedSounds[noteName];
        if (audio) {
          // Reset audio to beginning in case it was played before
          audio.currentTime = 0;
          currentAudioRef.current = audio; // Track this audio
          audio.play().catch((err) => console.warn("Audio play failed:", err));
        } else {
          // Fallback to correct sound if preloaded audio not available
          console.warn("Preloaded sound not available for:", noteName);
          playCorrectSound();
        }
      } else {
        // Stop piano note before playing wrong sound
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current = null;
        }
        // Play wrong sound for incorrect answers
        playWrongSound();
      }
    },
    [preloadedSounds, playCorrectSound, playWrongSound]
  );

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
    דו: [130.81, 261.63, 523.25, 1046.5], // C3, C4, C5, C6
    רה: [146.83, 293.66, 587.33, 1174.66], // D3, D4, D5, D6
    מי: [164.81, 329.63, 659.25, 1318.51], // E3, E4, E5, E6
    פה: [174.61, 349.23, 698.46, 1396.91], // F3, F4, F5, F6
    סול: [196.0, 392.0, 783.99, 1567.98], // G3, G4, G5, G6
    לה: [220.0, 440.0, 880.0, 1760.0], // A3, A4, A5, A6
    סי: [246.94, 493.88, 987.77, 1975.53], // B3, B4, B5, B6
  };

  // Pitch detection using autocorrelation
  const detectPitch = useCallback((buffer, sampleRate) => {
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
      return sampleRate / bestOffset;
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
        const tolerance = freq * 0.05; // 5% tolerance - reduces false fluctuations during note decay
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
      console.log("🎤 [PITCH DETECTION] Starting audio input...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;

      source.connect(analyserNode);

      console.log(
        `🎤 [PITCH DETECTION] Audio context created with sample rate: ${context.sampleRate} Hz`
      );
      console.log(
        `🎤 [PITCH DETECTION] Analyser FFT size: ${analyserNode.fftSize}`
      );

      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(stream);
      // Note: setIsListening(true) is now called in toggleAudioInput BEFORE this function

      // Start pitch detection loop
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      const sampleRate = context.sampleRate;
      let frameCount = 0;

      const detectLoop = () => {
        analyserNode.getFloatTimeDomainData(dataArray);

        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const level = Math.sqrt(sum / bufferLength);
        const levelPercent = level * 100;
        setAudioInputLevel(level);

        // Check if we're waiting for note release
        if (waitingForRelease) {
          if (levelPercent < RELEASE_THRESHOLD) {
            console.log(
              `🎹 [NOTE RELEASED] Audio level dropped to ${levelPercent.toFixed(2)}% - Moving to next question`
            );
            setWaitingForRelease(false);
            setAnswerFeedback({
              selectedNote: null,
              correctNote: null,
              isCorrect: null,
            });
            updateProgress({ currentNote: pendingNextNote });
            setPendingNextNote(null);
          }
          // Skip normal match detection while waiting for release
          animationFrameRef.current = requestAnimationFrame(detectLoop);
          return;
        }

        // Detect pitch with correct sample rate
        const pitch = detectPitch(dataArray, sampleRate);
        const note = frequencyToNote(pitch);
        setDetectedNote(note);

        // Log every 30 frames (~0.5 seconds at 60fps)
        frameCount++;
        if (frameCount % 30 === 0) {
          console.log(
            `🎵 [PITCH DETECTION] Level: ${levelPercent.toFixed(2)}% | Pitch: ${pitch > 0 ? pitch.toFixed(2) + " Hz" : "N/A"} | Note: ${note || "None"} | Target: ${progress.currentNote?.note || "N/A"}`
          );
        }

        // Check if detected note matches current note
        if (
          note &&
          progress.currentNote &&
          note === progress.currentNote.note
        ) {
          const now = Date.now();
          const timeSinceLastMatch =
            lastMatchTimeRef.current === 0
              ? 1000
              : now - lastMatchTimeRef.current;

          console.log(
            `🎯 [MATCH CHECK] Detected: "${note}" | Target: "${progress.currentNote.note}" | Time since last: ${timeSinceLastMatch}ms | isListening: ${isListeningRef.current}`
          );

          // Debounce: only process match if 1000ms has passed since last match
          if (timeSinceLastMatch >= 1000) {
            console.log(
              `✅ [MATCH PROCESSED] Calling handleAnswerSelect for "${note}"`
            );
            lastMatchTimeRef.current = now; // Update ref immediately
            handleAnswerSelect(note);
          } else {
            console.log(
              `⏸️ [MATCH BLOCKED] Cooldown active (${timeSinceLastMatch}ms < 1000ms)`
            );
          }
        }

        // Store animation frame ID so it can be cancelled
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      };

      console.log("🎤 [PITCH DETECTION] Starting detection loop...");
      detectLoop();
    } catch (error) {
      console.error("❌ [PITCH DETECTION] Error accessing microphone:", error);
      setIsListening(false);
    }
  }, [
    detectPitch,
    frequencyToNote,
    progress.currentNote,
    handleAnswerSelect,
    isListening,
  ]);

  // Stop audio input
  const stopAudioInput = useCallback(() => {
    console.log("🛑 [PITCH DETECTION] Stopping audio input...");
    lastMatchTimeRef.current = 0; // Reset cooldown when stopping
    isListeningRef.current = false; // Reset ref
    setWaitingForRelease(false); // Reset note release state
    setPendingNextNote(null); // Clear pending note
    // Cancel the animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log("🛑 [PITCH DETECTION] Animation frame cancelled");
    }
    if (microphone) {
      microphone.getTracks().forEach((track) => track.stop());
      console.log("🛑 [PITCH DETECTION] Microphone tracks stopped");
    }
    if (audioContext) {
      // Close audio context asynchronously to avoid blocking navigation
      audioContext.close().catch((err) => {
        console.warn("⚠️ [PITCH DETECTION] Error closing audio context:", err);
      });
      console.log("🛑 [PITCH DETECTION] Audio context closed");
    }
    setIsListening(false);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
    setDetectedNote(null);
    setAudioInputLevel(0);
    console.log("🛑 [PITCH DETECTION] Audio input stopped successfully");
  }, [microphone, audioContext]);

  // Store the stopAudioInput function in a ref for cleanup useEffects
  useEffect(() => {
    stopAudioInputRef.current = stopAudioInput;
  }, [stopAudioInput]);

  // Toggle audio input
  const toggleAudioInput = useCallback(() => {
    if (isListening) {
      stopAudioInput();
    } else {
      setIsListening(true); // Update state for UI
      isListeningRef.current = true; // Update ref immediately for closures
      startAudioInput();
    }
  }, [isListening, stopAudioInput, startAudioInput]);

  // Cleanup audio input on unmount or game end
  useEffect(() => {
    return () => {
      // Defer cleanup to not block navigation - run asynchronously
      setTimeout(() => {
        if (stopAudioInputRef.current) {
          stopAudioInputRef.current();
        }
      }, 0);
    };
  }, []); // No dependencies - uses ref to avoid re-running cleanup

  // Stop audio input when game finishes
  useEffect(() => {
    if (progress.isFinished && stopAudioInputRef.current) {
      stopAudioInputRef.current();
    }
  }, [progress.isFinished]); // No stopAudioInput dependency - uses ref

  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Fallback timeout: force next question if note release is never detected
  useEffect(() => {
    if (waitingForRelease && pendingNextNote) {
      const fallbackTimer = setTimeout(() => {
        console.log(
          "⏰ [FALLBACK] Release not detected after 5s - forcing next question"
        );
        setWaitingForRelease(false);
        setAnswerFeedback({
          selectedNote: null,
          correctNote: null,
          isCorrect: null,
        });
        updateProgress({ currentNote: pendingNextNote });
        setPendingNextNote(null);
      }, 5000); // 5 second fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [waitingForRelease, pendingNextNote, updateProgress]);

  // Handle back navigation with immediate loading feedback
  const handleBackNavigation = useCallback(() => {
    setIsNavigating(true);
    // Let React render the loading state, then navigate
    setTimeout(() => {
      navigate("/notes-master-mode");
    }, 50);
  }, [navigate]);

  // Show loading screen during navigation
  if (isNavigating) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Only show back button during gameplay (not during settings or on victory/game-over screens) */}
      {!progress.isFinished && progress.isStarted && (
        <div className="p-2 flex-shrink-0">
          <button
            onClick={handleBackNavigation}
            className="flex items-center text-white/80 hover:text-white text-sm relative z-50 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Notes Reading
          </button>
        </div>
      )}

      {progress.showFireworks && <Firework />}

      {!progress.isStarted ? (
        <UnifiedGameSettings
          gameType="note-recognition"
          steps={[
            {
              id: "clef",
              title: "Choose Clef",
              component: "ClefSelection",
            },
            {
              id: "notes",
              title: "Select Notes",
              component: "NoteSelection",
              config: { showImages: true, minNotes: 2 },
            },
            {
              id: "timedMode",
              title: "Game Mode",
              component: "TimedModeSelection",
            },
          ]}
          initialSettings={{
            clef: settings.clef,
            selectedNotes: settings.selectedNotes,
            timedMode: settings.timedMode,
            difficulty: settings.difficulty,
          }}
          onStart={handleGameSettings}
          backRoute="/notes-master-mode"
          noteData={{
            trebleNotes,
            bassNotes,
          }}
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
            onExit={() => navigate("/notes-master-mode")}
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

                {/* Detected Note - Always visible to prevent layout shifts */}
                <div className="text-lg font-bold text-yellow-300 text-center">
                  זיהיתי: {detectedNote || "—"}
                </div>
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
                            settings.selectedNotes.includes(note.note)
                          )
                        : allNotes;

                    const uniqueNotes = [];
                    const seenNotes = new Set();
                    for (const note of filteredNotes) {
                      if (!note?.note) continue;
                      if (seenNotes.has(note.note)) continue;
                      seenNotes.add(note.note);
                      uniqueNotes.push(note);
                    }

                    return uniqueNotes;
                  })().map((note) => {
                    // Determine button styling based on feedback
                    let buttonClass =
                      "px-3 py-1.5 backdrop-blur-sm border rounded-lg transition-all duration-300 ";

                    if (
                      answerFeedback.selectedNote &&
                      answerFeedback.correctNote
                    ) {
                      // If this button was the selected wrong answer
                      if (
                        note.note === answerFeedback.selectedNote &&
                        !answerFeedback.isCorrect
                      ) {
                        buttonClass +=
                          "bg-red-500/80 border-red-600 text-white shadow-lg shadow-red-500/50";
                      }
                      // If this button is the correct answer
                      else if (note.note === answerFeedback.correctNote) {
                        buttonClass +=
                          "bg-green-500/80 border-green-600 text-white shadow-lg shadow-green-500/50 animate-pulse";
                      }
                      // Other buttons remain neutral
                      else {
                        buttonClass +=
                          "bg-white/20 border-white/30 text-white opacity-50";
                      }
                    } else {
                      // Default state when no feedback
                      buttonClass +=
                        "bg-white/20 border-white/30 text-white hover:bg-white/30";
                    }

                    return (
                      <button
                        key={note.note}
                        onClick={() => handleAnswerSelect(note.note)}
                        className={buttonClass}
                        disabled={answerFeedback.selectedNote !== null} // Disable buttons during feedback
                      >
                        {note.note}
                      </button>
                    );
                  })}
                </div>

                {/* Current Note on the right */}
                <div className="w-1/2 flex justify-center">
                  {progress.currentNote ? (
                    <div className="bg-white rounded-xl p-2 w-48 h-48 flex items-center justify-center">
                      {progress.currentNote.ImageComponent && (
                        <progress.currentNote.ImageComponent
                          className="w-full h-full object-contain"
                          aria-label={`Musical Note: ${progress.currentNote.note}`}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-2 w-48 h-48 flex items-center justify-center">
                      <span className="text-red-500">Note Image</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback is now shown via button highlighting instead of banner */}
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
              className={`px-3 py-1.5 backdrop-blur-md border border-white/20 text-white rounded-lg transition-colors flex items-center ${
                isListening
                  ? "bg-red-600/80 hover:bg-red-700/80"
                  : "bg-green-600/80 hover:bg-green-700/80"
              }`}
              aria-label={isListening ? "Stop Listening" : "Start Listening"}
            >
              {isListening ? (
                <FaMicrophoneSlash className="mr-1" />
              ) : (
                <FaMicrophone className="mr-1" />
              )}
              {isListening ? "Stop" : "Listen"}
            </button>
            <button
              onClick={handlePauseGame}
              className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center"
              aria-label="Pause"
            >
              <FaPause className="mr-1" />
              Pause
            </button>
          </>
        )}
      </div>

      {/* Settings Modal */}
      {progress.showSettingsModal && (
        <UnifiedGameSettings
          gameType="note-recognition"
          isModal={true}
          steps={[
            {
              id: "clef",
              title: "Choose Clef",
              component: "ClefSelection",
            },
            {
              id: "notes",
              title: "Select Notes",
              component: "NoteSelection",
              config: { showImages: true, minNotes: 2 },
            },
            {
              id: "timedMode",
              title: "Game Mode",
              component: "TimedModeSelection",
            },
          ]}
          initialSettings={{
            clef: settings.clef,
            selectedNotes: settings.selectedNotes,
            timedMode: settings.timedMode,
            difficulty: settings.difficulty,
          }}
          onStart={handleRestartGame}
          onCancel={handleResumeGame}
          backRoute="/notes-master-mode"
          noteData={{
            trebleNotes,
            bassNotes,
          }}
        />
      )}
    </div>
  );
}
