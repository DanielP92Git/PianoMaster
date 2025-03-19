import React, { useCallback } from "react";
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
import { useGameTimer } from "../../../features/games/hooks/useGameTimer";

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

export function NoteRecognitionGame() {
  const { settings, updateSettings, resetSettings } = useGameSettings();

  const { progress, updateProgress, handleAnswer, finishGame, resetProgress } =
    useGameProgress();

  // Create refs for sound effects using direct URLs
  const correctSound = React.useRef(null);
  const wrongSound = React.useRef(null);
  const victorySound = React.useRef(null);
  const gameOverSound = React.useRef(null);

  // Create a Web Audio API context for fallback sounds
  const audioContext = React.useRef(null);

  // Initialize sounds on component mount
  React.useEffect(() => {
    try {
      console.log("Initializing sound effects...");

      // Attempt to load sounds from multiple possible locations
      const possibleCorrectPaths = [
        "/sounds/correct.mp3", // From public/sounds folder (preferred)
        "./sounds/correct.mp3", // Relative path
        "../sounds/correct.mp3", // One level up
        "../../sounds/correct.mp3", // Two levels up
        "/assets/sounds/correct.mp3", // Alternative location
        "correct.mp3", // Directly in public folder
      ];

      const possibleWrongPaths = [
        "/sounds/wrong.mp3", // From public/sounds folder (preferred)
        "./sounds/wrong.mp3", // Relative path
        "../sounds/wrong.mp3", // One level up
        "../../sounds/wrong.mp3", // Two levels up
        "/assets/sounds/wrong.mp3", // Alternative location
        "wrong.mp3", // Directly in public folder
      ];

      const possibleVictoryPaths = [
        "/sounds/success-fanfare-trumpets.mp3", // From public/sounds folder (preferred)
        "./sounds/success-fanfare-trumpets.mp3", // Relative path
        "../sounds/success-fanfare-trumpets.mp3", // One level up
        "../../sounds/success-fanfare-trumpets.mp3", // Two levels up
        "/assets/sounds/success-fanfare-trumpets.mp3", // Alternative location
        "success-fanfare-trumpets.mp3", // Directly in public folder
      ];

      const possibleGameOverPaths = [
        "/sounds/game-over.wav", // From public/sounds folder (preferred)
        "./sounds/game-over.wav", // Relative path
        "../sounds/game-over.wav", // One level up
        "../../sounds/game-over.wav", // Two levels up
        "/assets/sounds/game-over.wav", // Alternative location
        "game-over.wav", // Directly in public folder
      ];

      // Try each path until one works
      let correctSoundLoaded = false;
      for (const path of possibleCorrectPaths) {
        try {
          console.log(`Trying to load correct sound from: ${path}`);
          correctSound.current = new Audio(path);
          correctSound.current.volume = 0.7; // Set volume to 70%
          correctSound.current.load();
          correctSoundLoaded = true;
          console.log(`Successfully loaded correct sound from: ${path}`);
          break;
        } catch (e) {
          console.warn(`Failed to load correct sound from: ${path}`);
        }
      }

      let wrongSoundLoaded = false;
      for (const path of possibleWrongPaths) {
        try {
          console.log(`Trying to load wrong sound from: ${path}`);
          wrongSound.current = new Audio(path);
          wrongSound.current.volume = 0.7; // Set volume to 70%
          wrongSound.current.load();
          wrongSoundLoaded = true;
          console.log(`Successfully loaded wrong sound from: ${path}`);
          break;
        } catch (e) {
          console.warn(`Failed to load wrong sound from: ${path}`);
        }
      }

      let victorySoundLoaded = false;
      for (const path of possibleVictoryPaths) {
        try {
          console.log(`Trying to load victory sound from: ${path}`);
          victorySound.current = new Audio(path);
          victorySound.current.volume = 0.7; // Set volume to 70%
          victorySound.current.load();
          victorySoundLoaded = true;
          console.log(`Successfully loaded victory sound from: ${path}`);
          break;
        } catch (e) {
          console.warn(`Failed to load victory sound from: ${path}`);
        }
      }

      let gameOverSoundLoaded = false;
      for (const path of possibleGameOverPaths) {
        try {
          console.log(`Trying to load game over sound from: ${path}`);
          gameOverSound.current = new Audio(path);
          gameOverSound.current.volume = 0.7; // Set volume to 70%
          gameOverSound.current.load();
          gameOverSoundLoaded = true;
          console.log(`Successfully loaded game over sound from: ${path}`);
          break;
        } catch (e) {
          console.warn(`Failed to load game over sound from: ${path}`);
        }
      }

      if (!correctSoundLoaded) {
        console.error("Failed to load correct sound from any path");
      }
      if (!wrongSoundLoaded) {
        console.error("Failed to load wrong sound from any path");
      }
      if (!victorySoundLoaded) {
        console.error("Failed to load victory sound from any path");
      }
      if (!gameOverSoundLoaded) {
        console.error("Failed to load game over sound from any path");
      }
    } catch (error) {
      console.error("Error initializing sounds:", error);
    }
  }, []);

  // Initialize Web Audio API context for fallback sounds
  React.useEffect(() => {
    try {
      // Initialize Web Audio API for fallback sounds
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContext.current = new AudioContext();
        console.log("Audio context initialized for fallback sounds");
      }
    } catch (e) {
      console.error("Failed to initialize audio context:", e);
    }
  }, []);

  // Function to play a fallback sound using Web Audio API
  const playFallbackSound = (isCorrect) => {
    if (!audioContext.current) return;

    try {
      // Create oscillator for beep sound
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      // Configure sound parameters
      if (isCorrect) {
        // Correct answer: higher pitch, pleasant sound
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          880,
          audioContext.current.currentTime
        ); // A5 note

        // Create a "chirp" effect for correct answers
        oscillator.frequency.exponentialRampToValueAtTime(
          1760,
          audioContext.current.currentTime + 0.1
        );

        gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.current.currentTime + 0.3
        );
      } else {
        // Wrong answer: lower pitch, dissonant sound
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(
          220,
          audioContext.current.currentTime
        ); // A3 note

        // Create a descending effect for wrong answers
        oscillator.frequency.exponentialRampToValueAtTime(
          110,
          audioContext.current.currentTime + 0.2
        );

        gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.current.currentTime + 0.3
        );
      }

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      // Play sound
      oscillator.start();
      oscillator.stop(
        audioContext.current.currentTime + (isCorrect ? 0.3 : 0.3)
      );

      console.log(
        `Played fallback ${
          isCorrect ? "correct" : "wrong"
        } sound with Web Audio API`
      );
    } catch (e) {
      console.error("Failed to play fallback sound:", e);
    }
  };

  // Function to play sounds
  const playSound = (isCorrect) => {
    try {
      // Try to play MP3 files first
      const soundRef = isCorrect ? correctSound.current : wrongSound.current;

      if (soundRef) {
        console.log(
          `Attempting to play ${isCorrect ? "correct" : "wrong"} sound...`
        );

        // Stop any currently playing sounds
        if (correctSound.current) {
          correctSound.current.pause();
          correctSound.current.currentTime = 0;
        }
        if (wrongSound.current) {
          wrongSound.current.pause();
          wrongSound.current.currentTime = 0;
        }

        // Play the sound
        const playPromise = soundRef.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() =>
              console.log(
                `${isCorrect ? "Correct" : "Wrong"} sound played successfully`
              )
            )
            .catch((e) => {
              console.error(
                `Failed to play ${isCorrect ? "correct" : "wrong"} sound:`,
                e
              );
              // Use fallback sound
              playFallbackSound(isCorrect);
            });
        }
      } else {
        // No audio element available, use fallback
        console.log(
          `No ${
            isCorrect ? "correct" : "wrong"
          } sound available, using fallback`
        );
        playFallbackSound(isCorrect);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
      // Try to play fallback sound as last resort
      try {
        playFallbackSound(isCorrect);
      } catch (fallbackError) {
        console.error("Failed to play even fallback sound:", fallbackError);
      }
    }
  };

  // Create a ref to store the game over handler
  const gameOverHandlerRef = React.useRef();

  // Add a ref to track current time limit to avoid stale values in effects
  const currentTimeLimitRef = React.useRef(settings.timeLimit);

  React.useEffect(() => {
    // Update the ref when settings.timeLimit changes
    currentTimeLimitRef.current = settings.timeLimit;
  }, [settings.timeLimit]);

  // First initialize the timeRemaining with an empty handler
  const {
    timeRemaining,
    formattedTime,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useGameTimer(settings.timeLimit, () => {
    // This will call the current handler in the ref
    if (gameOverHandlerRef.current) {
      gameOverHandlerRef.current();
    }
  });

  // Function to play victory fanfare sound
  const playVictorySound = () => {
    try {
      if (victorySound.current) {
        console.log("Attempting to play victory fanfare sound...");

        // Stop any currently playing sounds
        if (correctSound.current) {
          correctSound.current.pause();
          correctSound.current.currentTime = 0;
        }
        if (wrongSound.current) {
          wrongSound.current.pause();
          wrongSound.current.currentTime = 0;
        }

        // Play the victory sound
        const playPromise = victorySound.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Victory sound played successfully"))
            .catch((e) => {
              console.error("Failed to play victory sound:", e);
              // Use fallback victory sound
              playVictoryFallbackSound();
            });
        }
      } else {
        // No audio element available, use fallback
        console.log("No victory sound available, using fallback");
        playVictoryFallbackSound();
      }
    } catch (error) {
      console.error("Error playing victory sound:", error);
      try {
        playVictoryFallbackSound();
      } catch (fallbackError) {
        console.error(
          "Failed to play even fallback victory sound:",
          fallbackError
        );
      }
    }
  };

  // Fallback victory sound using Web Audio API
  const playVictoryFallbackSound = () => {
    if (!audioContext.current) return;

    try {
      // Create a more complex victory fanfare with the Web Audio API
      const ctx = audioContext.current;
      const now = ctx.currentTime;

      // Create nodes
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);

      // Play a short fanfare
      const notes = [
        { freq: 523.25, start: 0.0, duration: 0.2 }, // C5
        { freq: 659.25, start: 0.2, duration: 0.2 }, // E5
        { freq: 783.99, start: 0.4, duration: 0.2 }, // G5
        { freq: 1046.5, start: 0.6, duration: 0.8 }, // C6 (longer)
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = note.freq;
        osc.type = "triangle";

        gain.gain.setValueAtTime(0.01, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.3, now + note.start + 0.05);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          now + note.start + note.duration
        );

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.1);
      });

      console.log("Played fallback victory sound with Web Audio API");
    } catch (e) {
      console.error("Failed to play fallback victory sound:", e);
    }
  };

  // Function to play game over sound
  const playGameOverSound = () => {
    try {
      if (gameOverSound.current) {
        console.log("Attempting to play game over sound...");

        // Stop any currently playing sounds
        if (correctSound.current) {
          correctSound.current.pause();
          correctSound.current.currentTime = 0;
        }
        if (wrongSound.current) {
          wrongSound.current.pause();
          wrongSound.current.currentTime = 0;
        }
        if (victorySound.current) {
          victorySound.current.pause();
          victorySound.current.currentTime = 0;
        }

        // Play the game over sound
        const playPromise = gameOverSound.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log("Game over sound played successfully"))
            .catch((e) => {
              console.error("Failed to play game over sound:", e);
              // Use fallback game over sound
              playGameOverFallbackSound();
            });
        }
      } else {
        // No audio element available, use fallback
        console.log("No game over sound available, using fallback");
        playGameOverFallbackSound();
      }
    } catch (error) {
      console.error("Error playing game over sound:", error);
      try {
        playGameOverFallbackSound();
      } catch (fallbackError) {
        console.error(
          "Failed to play even fallback game over sound:",
          fallbackError
        );
      }
    }
  };

  // Fallback game over sound using Web Audio API
  const playGameOverFallbackSound = () => {
    if (!audioContext.current) return;

    try {
      // Create a more dramatic game over sound with the Web Audio API
      const ctx = audioContext.current;
      const now = ctx.currentTime;

      // Create nodes
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);

      // Play a sad descending melody for game over
      const notes = [
        { freq: 440.0, start: 0.0, duration: 0.2, type: "sawtooth" }, // A4
        { freq: 349.23, start: 0.2, duration: 0.2, type: "sawtooth" }, // F4
        { freq: 293.66, start: 0.4, duration: 0.2, type: "sawtooth" }, // D4
        { freq: 261.63, start: 0.6, duration: 0.8, type: "sawtooth" }, // C4 (longer)
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.value = note.freq;
        osc.type = note.type;

        gain.gain.setValueAtTime(0.3, now + note.start);
        gain.gain.exponentialRampToValueAtTime(
          0.01,
          now + note.start + note.duration
        );

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.duration + 0.1);
      });

      console.log("Played fallback game over sound with Web Audio API");
    } catch (e) {
      console.error("Failed to play fallback game over sound:", e);
    }
  };

  // Then define and store the actual handleGameOver with access to timeRemaining
  const handleGameOver = useCallback(() => {
    // Calculate score percentage
    const scorePercentage =
      (progress.correctAnswers / Math.max(1, progress.totalQuestions)) * 100;

    // Game is lost if score is less than 50% or if time ran out in timed mode
    const isLost =
      scorePercentage < 50 || (settings.timedMode && timeRemaining === 0);

    // Determine if time ran out
    const timeRanOut = settings.timedMode && timeRemaining === 0;

    // Add a small delay before playing sound to ensure it's played after the UI updates
    setTimeout(() => {
      if (isLost) {
        // Play game over sound if the player lost
        console.log("Game lost! Playing game over sound...");
        playGameOverSound();
      } else {
        // Play victory sound if the player won
        console.log("Game won! Playing victory sound...");
        playVictorySound();
      }
    }, 300);

    finishGame(isLost, timeRanOut);
  }, [
    progress.correctAnswers,
    progress.totalQuestions,
    settings.timedMode,
    timeRemaining,
    finishGame,
    playVictorySound,
    playGameOverSound,
  ]);

  // Update the ref whenever handleGameOver changes
  React.useEffect(() => {
    gameOverHandlerRef.current = handleGameOver;
  }, [handleGameOver]);

  // Get random note based on current settings
  const getRandomNote = () => {
    // Use the current settings to determine which notes to use
    const notesArray = settings.clef === "Treble" ? trebleNotes : bassNotes;

    console.log("Current settings in getRandomNote:", {
      clef: settings.clef,
      selectedNotes: settings.selectedNotes,
    });

    // Ensure selectedNotes exists and has at least 2 notes
    let selectedNotes = settings.selectedNotes;
    if (!Array.isArray(selectedNotes) || selectedNotes.length < 2) {
      console.warn(
        "Less than 2 selected notes, using all notes for current clef"
      );
      selectedNotes = notesArray.map((note) => note.note);

      // Update settings to prevent future issues
      updateSettings({
        ...settings,
        selectedNotes: selectedNotes,
      });
    }

    // Filter notes based on selection
    const filteredNotes = notesArray.filter((note) =>
      selectedNotes.includes(note.note)
    );

    console.log(
      "Available filtered notes:",
      filteredNotes.map((n) => n.note)
    );

    if (filteredNotes.length === 0) {
      console.error("No notes available after filtering, using all notes");
      // If something went wrong with filtering, use all notes as a fallback
      const allNotes = notesArray;
      const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];
      console.log("Selected fallback random note:", randomNote.note);
      return randomNote;
    }

    const randomNote =
      filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
    console.log("Selected random note:", randomNote.note);
    return randomNote;
  };

  // Handle game settings from the GameSettings component
  const handleGameSettings = (newSettings) => {
    console.log("Received game settings:", newSettings);

    // Ensure all required properties exist
    if (!newSettings) {
      console.error("No settings provided");
      return;
    }

    // Ensure clef is valid
    const clef = newSettings.clef === "Bass" ? "Bass" : "Treble";

    // Ensure selectedNotes is an array
    let selectedNotes = Array.isArray(newSettings.selectedNotes)
      ? newSettings.selectedNotes
      : [];

    // If fewer than 2 notes are selected, use all notes for the selected clef
    if (selectedNotes.length < 2) {
      console.log(
        "Less than 2 notes selected, using all notes for the selected clef"
      );
      selectedNotes =
        clef === "Treble"
          ? trebleNotes.map((note) => note.note)
          : bassNotes.map((note) => note.note);
    }

    // Create a complete settings object with all required properties
    const completeSettings = {
      clef,
      selectedNotes,
      timedMode: !!newSettings.timedMode,
      difficulty: newSettings.difficulty || "Medium",
      timeLimit: newSettings.timeLimit || 45,
    };

    console.log("Prepared complete settings:", completeSettings);

    // First update the settings in our state
    updateSettings(completeSettings);

    // Start the game with a slight delay to ensure state updates are processed
    setTimeout(() => {
      startGame(completeSettings);
    }, 100);
  };

  // Start the game with current or new settings
  const startGame = (gameSettings = settings) => {
    console.log("Starting game with settings:", gameSettings);

    // Ensure we have valid selectedNotes before starting
    if (!gameSettings.selectedNotes || gameSettings.selectedNotes.length < 2) {
      console.log(
        "No selected notes in settings, using all notes for the current clef"
      );
      // Use all notes for the current clef
      gameSettings.selectedNotes =
        gameSettings.clef === "Treble"
          ? trebleNotes.map((note) => note.note)
          : bassNotes.map((note) => note.note);
    }

    // First update settings to ensure they're available when getting the initial note
    updateSettings(gameSettings);

    // Reset game state after settings are updated
    resetProgress();

    // Wait a tiny bit to ensure state updates have propagated
    setTimeout(() => {
      // Get initial note based on updated settings
      const firstNote = getRandomNote();
      console.log("Initial note:", firstNote);

      if (!firstNote) {
        console.error("Failed to get initial note");
        return;
      }

      // Update progress with the initial note
      updateProgress({
        currentNote: firstNote,
        isStarted: true,
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
      });

      // Start timer if in timed mode
      if (gameSettings.timedMode) {
        pauseTimer();
        setTimeout(() => {
          resetTimer(gameSettings.timeLimit);
          setTimeout(() => {
            startTimer();
          }, 20);
        }, 20);
      }
    }, 50);
  };

  // Update the effect to properly handle timeLimit changes
  React.useEffect(() => {
    // Only reset the timer if the game is active and the time limit has changed
    if (
      settings.timedMode &&
      isActive &&
      settings.timeLimit &&
      settings.timeLimit !== currentTimeLimitRef.current &&
      progress.isStarted &&
      !progress.isFinished
    ) {
      console.log(
        "Time limit changed, resetting timer to:",
        settings.timeLimit
      );
      // Pause the timer first
      pauseTimer();
      // Reset with the new time limit and restart
      setTimeout(() => {
        resetTimer(settings.timeLimit);
        // Start the timer after a small delay to ensure clean state
        setTimeout(() => {
          startTimer();
        }, 50);
      }, 50);
    }
  }, [
    settings.timeLimit,
    settings.timedMode,
    isActive,
    pauseTimer,
    resetTimer,
    startTimer,
    progress.isStarted,
    progress.isFinished,
  ]);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      pauseTimer();
    };
  }, [pauseTimer]);

  // Handle answer selection
  const handleAnswerSelect = (selectedAnswer) => {
    if (!progress.currentNote) return;

    const isCorrect = handleAnswer(selectedAnswer, progress.currentNote.note);

    // Play the appropriate sound
    playSound(isCorrect);

    // Check if game should end
    if (progress.totalQuestions >= 9) {
      handleGameOver();
      return;
    }

    // Set next note
    const nextNote = getRandomNote();
    console.log("Next note:", nextNote); // Debug log

    updateProgress({
      currentNote: nextNote,
    });
  };

  // Handle pause game
  const handlePauseGame = () => {
    if (settings.timedMode) {
      // In timed mode, always pause the timer and open settings
      pauseTimer();
      updateProgress({ showSettingsModal: true });
    } else {
      // For non-timed mode, just show settings modal
      updateProgress({ showSettingsModal: true });
    }
  };

  // Handle resume game from settings modal
  const handleResumeGame = () => {
    updateProgress({ showSettingsModal: false });
    // If in timed mode, resume the timer
    if (settings.timedMode) {
      startTimer();
    }
  };

  // Handle restart game from settings modal
  const handleRestartGame = (newSettings) => {
    updateProgress({ showSettingsModal: false });

    // Use the new settings passed from the modal
    console.log("Restarting game with new settings:", newSettings);

    // Make sure we have the selected notes
    if (!newSettings || !newSettings.selectedNotes) {
      console.error(
        "No selectedNotes in the new settings, using current settings"
      );
      newSettings = {
        clef: settings.clef,
        selectedNotes: settings.selectedNotes,
        timedMode: settings.timedMode,
        difficulty: settings.difficulty,
        timeLimit: settings.timeLimit,
      };
    } else {
      console.log("Selected notes from settings:", newSettings.selectedNotes);
    }

    // First update the game settings to reflect the new choices
    updateSettings(newSettings);

    // Then start the game with these settings
    setTimeout(() => {
      startGame(newSettings);
    }, 100);
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
          {/* Score at the top */}
          <div className="text-2xl font-bold text-white text-center mt-2 mb-4">
            Score: {progress.score}
            {settings.timedMode && (
              <span className="ml-8">Time: {formattedTime}</span>
            )}
          </div>

          {/* Main game area */}
          <div className="flex items-center justify-center pt-10">
            <div className="flex flex-col w-full max-w-3xl px-4">
              <div className="flex w-full">
                {/* Note Buttons on the left */}
                <div className="grid grid-cols-2 gap-2 w-1/2 mr-4">
                  {/* Show all notes with same styling */}
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
                          console.error("Error loading image:", e);
                          console.log(
                            "Image source:",
                            progress.currentNote.image
                          );
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
          <>
            {settings.timedMode ? (
              <button
                onClick={handlePauseGame}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center"
                aria-label="Pause"
              >
                <FaPause className="mr-1" />
                Pause
              </button>
            ) : (
              <button
                onClick={handlePauseGame}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                Settings
              </button>
            )}
          </>
        )}
      </div>

      {/* Settings Modal */}
      {progress.showSettingsModal && (
        <GameSettings
          gameType="note-recognition"
          isModal={true}
          onStart={handleRestartGame}
          onCancel={handleResumeGame}
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
