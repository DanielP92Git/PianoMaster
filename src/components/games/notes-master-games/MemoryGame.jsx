import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getNodeById, EXERCISE_TYPES } from "../../../data/skillTrail";
import { useScores } from "../../../features/userData/useScores";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  TREBLE_NOTES,
  BASS_NOTES,
} from "../sight-reading-game/constants/gameSettings";
import BackButton from "../../ui/BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";
import { UnifiedGameSettings } from "../shared/UnifiedGameSettings";
import { useGameTimer } from "../../../features/games/hooks/useGameTimer";
import GameOverScreen from "../GameOverScreen";
import { useTranslation } from "react-i18next";
import { normalizeSelectedNotes } from "../shared/noteSelectionUtils";

const trebleNotes = TREBLE_NOTES;
const bassNotes = BASS_NOTES;

const getAllNotesForClef = (clef) => {
  if (clef === "Both" || String(clef || "").toLowerCase() === "both") {
    return [...trebleNotes, ...bassNotes].map((note) => note.pitch).filter(Boolean);
  }
  return (clef === "Bass" ? bassNotes : trebleNotes)
    .map((note) => note.pitch)
    .filter(Boolean);
};

const GRID_SIZES = {
  "3 X 4": 12, // 3x4 grid = 12 cards (6 pairs)
  "3 X 6": 18, // 3x6 grid = 18 cards (9 pairs)
  "3 X 8": 24, // 3x8 grid = 24 cards (12 pairs)
};

const DIFFICULTIES = {
  Easy: "3 X 4", // 6 pairs = 12 cards (4 columns x 3 rows)
  Medium: "3 X 6", // 9 pairs = 18 cards (6 columns x 3 rows)
  Hard: "3 X 8", // 12 pairs = 24 cards (8 columns x 3 rows)
};

const GRID_SIZE_TO_DIFFICULTY = Object.fromEntries(
  Object.entries(DIFFICULTIES).map(([level, grid]) => [grid, level])
);

const TIME_DIFFICULTY_LIMITS = {
  Easy: 90,
  Medium: 75,
  Hard: 60,
};

const NOTE_LABEL_FONT_STACK =
  "'Heebo', 'Assistant', 'Noto Sans Hebrew', 'Arial', sans-serif";

export function MemoryGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation("common");

  // Get nodeId from trail navigation (if coming from trail)
  const nodeId = location.state?.nodeId || null;
  const nodeConfig = location.state?.nodeConfig || null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;

  const [difficulty, setDifficulty] = useState("Easy");
  const [gridSize, setGridSize] = useState(DIFFICULTIES["Easy"]);
  const [clef, setClef] = useState("Treble");
  const [timeDifficulty, setTimeDifficulty] = useState("Medium");
  const [selectedNotes, setSelectedNotes] = useState(() =>
    getAllNotesForClef("Treble")
  );
  const [enableSharps, setEnableSharps] = useState(false);
  const [enableFlats, setEnableFlats] = useState(false);
  const preparedSelectedNotes = useMemo(
    () => (selectedNotes.length > 0 ? selectedNotes : getAllNotesForClef(clef)),
    [selectedNotes, clef]
  );

  // Create cards based on grid size
  const createCards = (
    currentClef = clef,
    currentGridSize = gridSize,
    currentSelectedNotes = selectedNotes,
    currentEnableSharps = enableSharps,
    currentEnableFlats = enableFlats
  ) => {
    const totalCards = GRID_SIZES[currentGridSize];
    const pairs = totalCards / 2;

    // Select the appropriate notes based on clef
    const allNotesArray =
      currentClef === "Both" || String(currentClef || "").toLowerCase() === "both"
        ? [
            ...trebleNotes.map((n) => ({ ...n, __clef: "treble" })),
            ...bassNotes.map((n) => ({ ...n, __clef: "bass" })),
          ]
        : currentClef === "Treble"
          ? trebleNotes.map((n) => ({ ...n, __clef: "treble" }))
          : bassNotes.map((n) => ({ ...n, __clef: "bass" }));

    // Filter notes based on user selection, fallback to all notes if none selected
    const normalizedSelection = normalizeSelectedNotes({
      selectedNotes: currentSelectedNotes,
      clef: currentClef,
      trebleNotes,
      bassNotes,
      targetField: "pitch",
      enableSharps: currentEnableSharps,
      enableFlats: currentEnableFlats,
    });

    const isAccidentalPitch = (pitch) =>
      pitch ? String(pitch).includes("#") || String(pitch).includes("b") : false;
    const naturalBasePitch = (pitch) => {
      if (!pitch) return null;
      const raw = String(pitch).trim().replace(/\s+/g, "");
      const match = raw.match(/^([A-Ga-g])([#b]?)(\d)$/);
      if (!match) return raw;
      const [, letter, , octave] = match;
      return `${letter.toUpperCase()}${octave}`;
    };

    const filteredNotes =
      normalizedSelection.length > 0
        ? (() => {
            const clefKey = String(currentClef || "").toLowerCase();
            const selectedSet = new Set(normalizedSelection);
            return allNotesArray.filter((note) => {
              if (clefKey === "both") {
                const tag = note.__clef || "treble";
                const notePitch = note.pitch;
                const base = naturalBasePitch(notePitch);
                const allowAccidental =
                  isAccidentalPitch(notePitch) &&
                  ((String(notePitch).includes("#") && currentEnableSharps) ||
                    (String(notePitch).includes("b") && currentEnableFlats));
                return (
                  selectedSet.has(`${tag}:${notePitch}`) ||
                  (allowAccidental && selectedSet.has(`${tag}:${base}`))
                );
              }
              const notePitch = note.pitch;
              const base = naturalBasePitch(notePitch);
              const allowAccidental =
                isAccidentalPitch(notePitch) &&
                ((String(notePitch).includes("#") && currentEnableSharps) ||
                  (String(notePitch).includes("b") && currentEnableFlats));
              return selectedSet.has(notePitch) || (allowAccidental && selectedSet.has(base));
            });
          })()
        : allNotesArray;

    // Create a copy of the filtered notes array and shuffle it to randomize selection
    const availableNotes = [...filteredNotes];
    availableNotes.sort(() => Math.random() - 0.5);

    // Prepare the final array of notes we'll use (may include duplicates)
    let notesForCards = [];

    // If we need more pairs than unique notes available, we'll reuse notes
    if (pairs <= availableNotes.length) {
      // We have enough unique notes, just take what we need
      notesForCards = availableNotes.slice(0, pairs);
    } else {
      // We need more pairs than unique notes available
      // First, use all available unique notes
      notesForCards = [...availableNotes];

      // Then reuse notes as needed (cycle through them)
      while (notesForCards.length < pairs) {
        // Start from beginning of shuffled notes and add more until we have enough
        const notesToAdd = Math.min(
          pairs - notesForCards.length,
          availableNotes.length
        );
        notesForCards = [
          ...notesForCards,
          ...availableNotes.slice(0, notesToAdd),
        ];
      }
    }

    // Double-check we have exactly the right number of pairs
    if (notesForCards.length !== pairs) {
      notesForCards = notesForCards.slice(0, pairs);
    }

    // Create pairs of notes and their names
    const noteCards = notesForCards.map((note, index) => ({
      id: index,
      type: "note",
      value: note.note,
      ImageComponent: note.ImageComponent,
    }));

    const nameCards = notesForCards.map((note, index) => ({
      id: index,
      type: "name",
      value: note.note,
      name: note.note,
    }));

    // Double-check total card count
    const allCards = [...noteCards, ...nameCards];

    // CRITICAL: Verify we have the correct number of cards
    if (allCards.length !== totalCards) {
      console.error(
        `ERROR: Created ${allCards.length} cards but needed ${totalCards}!`
      );

      // Handle the edge case where we didn't create enough cards
      if (allCards.length < totalCards) {
        // We need to duplicate some cards to reach the required count
        // This can happen when we don't have enough unique notes
        let additionalCards = [];
        while (allCards.length + additionalCards.length < totalCards) {
          // Take cards from the beginning and add them until we have enough
          const neededCards =
            totalCards - (allCards.length + additionalCards.length);
          const cardsToAdd = allCards.slice(
            0,
            Math.min(neededCards, allCards.length)
          );
          additionalCards = [...additionalCards, ...cardsToAdd];
        }

        // Add the additional cards and re-shuffle
        const finalCards = [...allCards, ...additionalCards];

        // Return the fixed number of cards
        return finalCards
          .sort(() => Math.random() - 0.5)
          .map((card, index) => ({ ...card, index }));
      }
    }

    // Combine and shuffle
    return allCards
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, index }));
  };

  // Fix the initial cards creation to use the proper grid size
  const initialCards = useMemo(() => {
    return createCards(clef, DIFFICULTIES["Easy"], selectedNotes, enableSharps, enableFlats);
  }, [clef, selectedNotes, enableSharps, enableFlats]);

  const [cards, setCards] = useState(initialCards);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedIndexes, setMatchedIndexes] = useState([]);
  const [score, setScore] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showMatchFirework, setShowMatchFirework] = useState(false);
  const [matchPosition, setMatchPosition] = useState({ x: 0, y: 0 });
  const [gameFinished, setGameFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);
  const [isLost, setIsLost] = useState(false);
  const { updateScore } = useScores();
  const gridDifficulty =
    GRID_SIZE_TO_DIFFICULTY[gridSize] || difficulty || "Easy";

  // Track if we should auto-start from trail
  const hasAutoStartedRef = useRef(false);

  // Reset auto-start flag and game state when nodeId changes (navigating to a new node)
  useEffect(() => {
    hasAutoStartedRef.current = false;

    // Reset game state to prevent stuck UI from previous node
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    setShowMatchFirework(false);
    setGameFinished(false);
    setGameStarted(false);
    setIsLost(false);
  }, [nodeId]);

  // Auto-configure and auto-start from trail node
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;

      // Parse grid size from nodeConfig (e.g., "3x4" or "2x4")
      let parsedGridSize = "3 X 4"; // default
      if (nodeConfig.gridSize) {
        // Convert from formats like "3x4", "2x4" to "3 X 4", "3 X 6", etc.
        const gridStr = String(nodeConfig.gridSize).toUpperCase().replace(/X/g, ' X ');
        if (GRID_SIZES[gridStr]) {
          parsedGridSize = gridStr;
        }
      }

      // Build settings from node configuration
      const trailSettings = {
        clef: nodeConfig.clef || 'treble',
        selectedNotes: nodeConfig.notePool || [],
        gridSize: parsedGridSize,
        timedMode: nodeConfig.timeLimit !== null && nodeConfig.timeLimit !== undefined,
        timeLimit: nodeConfig.timeLimit || 90,
        enableSharps: false,
        enableFlats: false
      };

      // Apply settings and start the game
      applySettingsAndRestart(trailSettings, { closeModal: false });
    }
  }, [nodeConfig, nodeId]); // Run when nodeConfig OR nodeId changes

  // Handle navigation to next exercise in the trail node
  const handleNextExercise = useCallback(() => {
    if (nodeId && trailExerciseIndex !== null && trailTotalExercises !== null) {
      const nextIndex = trailExerciseIndex + 1;

      // If there's another exercise, navigate to it
      if (nextIndex < trailTotalExercises) {
        const node = getNodeById(nodeId);
        if (node && node.exercises && node.exercises[nextIndex]) {
          const nextExercise = node.exercises[nextIndex];

          const navState = {
            nodeId,
            nodeConfig: nextExercise.config,
            exerciseIndex: nextIndex,
            totalExercises: trailTotalExercises,
            exerciseType: nextExercise.type
          };

          // Navigate to the appropriate game based on exercise type
          switch (nextExercise.type) {
            case EXERCISE_TYPES.NOTE_RECOGNITION:
              navigate('/notes-master-mode/notes-recognition-game', { state: navState });
              break;
            case EXERCISE_TYPES.SIGHT_READING:
              navigate('/notes-master-mode/sight-reading-game', { state: navState });
              break;
            case EXERCISE_TYPES.MEMORY_GAME:
              navigate('/notes-master-mode/memory-game', { state: navState });
              break;
            case EXERCISE_TYPES.RHYTHM:
              navigate('/rhythm-mode/metronome-trainer', { state: navState });
              break;
            case EXERCISE_TYPES.BOSS_CHALLENGE:
              navigate('/notes-master-mode/sight-reading-game', { state: navState });
              break;
            default:
              console.warn('Unknown exercise type:', nextExercise.type);
              navigate('/trail');
          }
        }
      }
    }
  }, [nodeId, trailExerciseIndex, trailTotalExercises, navigate]);

  useEffect(() => {
    const derived = GRID_SIZE_TO_DIFFICULTY[gridSize];
    if (derived && derived !== difficulty) {
      setDifficulty(derived);
    }
  }, [gridSize, difficulty]);

  // Use the centralized sounds hook first so it's available to other functions
  const { playCorrectSound, playVictorySound, playGameOverSound } = useSounds();

  // Game over handler ref to avoid stale closures
  const gameOverHandlerRef = React.useRef();

  // Initialize the timer with a callback to handle game over
  const {
    timeRemaining,
    formattedTime,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
  } = useGameTimer(timeLimit, () => {
    // This will call the current handler in the ref
    if (gameOverHandlerRef.current) {
      gameOverHandlerRef.current();
    }
  });

  // Handle game over when time runs out
  const handleGameOver = useCallback(() => {
    pauseTimer();
    setGameFinished(true);
    setIsLost(true);

    // Play game over sound when time runs out (could add this to useSounds if available)
    if (playGameOverSound) {
      playGameOverSound();
    }
  }, [pauseTimer, playGameOverSound]);

  // Update the ref whenever handleGameOver changes
  useEffect(() => {
    gameOverHandlerRef.current = handleGameOver;
  }, [handleGameOver]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      pauseTimer();
    };
  }, [pauseTimer]);

  const applySettingsAndRestart = useCallback(
    (settings = {}, options = {}) => {
      const { closeModal = false } = options;

      if (closeModal) {
        setShowSettingsModal(false);
      }

      let newClef = settings.clef ?? clef;

      const fallbackNotes = getAllNotesForClef(newClef);
      let newSelectedNotes = selectedNotes.length
        ? selectedNotes
        : fallbackNotes;

      if (
        settings.selectedNotes !== undefined &&
        Array.isArray(settings.selectedNotes)
      ) {
        newSelectedNotes = normalizeSelectedNotes({
          selectedNotes: settings.selectedNotes,
          clef: newClef,
          trebleNotes,
          bassNotes,
          targetField: "pitch",
          enableSharps: settings.enableSharps ?? false,
          enableFlats: settings.enableFlats ?? false,
        });
        if (!newSelectedNotes.length) {
          newSelectedNotes = fallbackNotes;
        }
      }

      let newGridSize = gridSize;
      let gridExplicitlyProvided = false;
      if (settings.gridSize && GRID_SIZES[settings.gridSize]) {
        newGridSize = settings.gridSize;
        gridExplicitlyProvided = true;
      }
      if (
        !gridExplicitlyProvided &&
        settings.difficulty &&
        DIFFICULTIES[settings.difficulty] !== undefined
      ) {
        newGridSize = DIFFICULTIES[settings.difficulty];
      }

      const derivedDifficulty = gridExplicitlyProvided
        ? GRID_SIZE_TO_DIFFICULTY[newGridSize] || difficulty
        : (settings.difficulty ??
          GRID_SIZE_TO_DIFFICULTY[newGridSize] ??
          difficulty);

      const newTimeDifficulty = settings.timeDifficulty ?? timeDifficulty;
      const newTimedMode = settings.timedMode ?? timedMode;

      let newTimeLimit = timeLimit;
      if (settings.timeLimit !== undefined) {
        newTimeLimit = settings.timeLimit;
      } else if (newTimedMode) {
        newTimeLimit = TIME_DIFFICULTY_LIMITS[newTimeDifficulty] ?? timeLimit;
      }

      const newEnableSharps = settings.enableSharps ?? enableSharps;
      const newEnableFlats = settings.enableFlats ?? enableFlats;

      setClef(newClef);
      setSelectedNotes(newSelectedNotes);
      setGridSize(newGridSize);
      setDifficulty(derivedDifficulty);
      setTimeDifficulty(newTimeDifficulty);
      setTimedMode(newTimedMode);
      setTimeLimit(newTimeLimit);
      setEnableSharps(newEnableSharps);
      setEnableFlats(newEnableFlats);

      const newCards = createCards(newClef, newGridSize, newSelectedNotes, newEnableSharps, newEnableFlats);
      setCards(newCards);
      setFlippedIndexes([]);
      setMatchedIndexes([]);
      setScore(0);
      setShowFireworks(false);
      setShowMatchFirework(false);
      setIsLost(false);
      setGameFinished(false);
      setGameStarted(true);

      pauseTimer();
      resetTimer(newTimeLimit);

    },
    [
      clef,
      selectedNotes,
      gridSize,
      difficulty,
      timeDifficulty,
      timedMode,
      timeLimit,
      enableSharps,
      enableFlats,
      pauseTimer,
      resetTimer,
      setShowSettingsModal,
    ]
  );

  // Handle settings from the GameSettings component
  const handleGameSettings = (settings) => {
    console.info("[MemoryGame] handleGameSettings called", settings);
    applySettingsAndRestart(settings, { initial: true });
  };

  const handleStartGame = (
    currentClef = clef,
    newTimeLimit = timeLimit,
    newGridSize = gridSize,
    currentSelectedNotes = selectedNotes
  ) => {
    setGameStarted(true);
    setGameFinished(false);
    setIsLost(false);
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);

    const newCards = createCards(
      currentClef,
      newGridSize,
      currentSelectedNotes,
      enableSharps,
      enableFlats
    );
    setCards(newCards);

    pauseTimer();
    resetTimer(newTimeLimit);
  };

  const handlePauseGame = () => {
    if (timedMode) {
      pauseTimer();
    }
    setShowSettingsModal(true);
  };

  const handleRestartGame = (settings) => {
    console.info("[MemoryGame] handleRestartGame called", settings);
    applySettingsAndRestart(settings, { closeModal: true });
  };

  const handleResumeGame = () => {
    setShowSettingsModal(false);
    // Resume timer if in timed mode
    if (timedMode) {
      startTimer();
    }
  };

  const handleReset = () => {
    setGameStarted(false);

    const resetGridSize = gridSize;

    const newCards = createCards(clef, resetGridSize, selectedNotes, enableSharps, enableFlats);
    setCards(newCards);

    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
  };

  const handleCardClick = (index) => {
    if (
      flippedIndexes.length === 2 ||
      flippedIndexes.includes(index) ||
      matchedIndexes.includes(index)
    ) {
      return;
    }

    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);

    if (newFlippedIndexes.length === 2) {
      const firstCard = cards[newFlippedIndexes[0]];
      const secondCard = cards[index];

      // Get the clicked card's position for firework
      const cardElement = document.getElementById(`card-${index}`);
      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setMatchPosition({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        });
      }

      // Match ONLY when it's a note-name card + a staff-note card of the same note value.
      // Prevents name+name or note+note from matching.
      const isMatchingPair =
        firstCard.value === secondCard.value && firstCard.type !== secondCard.type;

      if (isMatchingPair) {
        // Match found - show firework and delay disappearance
        setShowMatchFirework(true);
        playCorrectSound(); // Play sound for correct match

        // First add to matches (this will start the fade out)
        setTimeout(() => {
          setMatchedIndexes((prev) => [...prev, ...newFlippedIndexes]);
        }, 500);

        // Then clear flipped and update score after cards start disappearing
        setTimeout(() => {
          setShowMatchFirework(false);
          setScore((prev) => prev + 10);
          setFlippedIndexes([]);

          // Check if game is complete
          if (matchedIndexes.length + 2 === cards.length) {
            updateScore({ score: score + 10, gameType: "memory" });
            setShowFireworks(true);
            playVictorySound(); // Play victory sound when all pairs are matched
            setGameFinished(true);
            setTimeout(() => setShowFireworks(false), 1000);
          }
        }, 1000);
      } else {
        // No match - wait a second before hiding both cards
        setTimeout(() => {
          setFlippedIndexes([]);
        }, 1000);
      }
    }
  };

  const getGridClassName = () => {
    switch (gridSize) {
      case "3 X 4":
        return "grid grid-cols-4 gap-3 md:gap-4 w-full max-w-2xl mx-auto place-items-stretch";
      case "3 X 6":
        return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 w-full max-w-5xl mx-auto place-items-stretch";
      case "3 X 8":
        // Keep cards larger on tablets (incl. large iPad landscape) by staying at 6 columns up to 2xl.
        // Switch to 8 columns only on very large screens.
        return "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 2xl:grid-cols-8 gap-2 md:gap-3 w-full max-w-7xl mx-auto place-items-stretch";
      default:
        return "grid grid-cols-4 gap-3 md:gap-4 w-full max-w-2xl mx-auto place-items-stretch";
    }
  };

  // Check if the game is won when matchedIndexes changes
  useEffect(() => {
    if (
      gameStarted &&
      !gameFinished &&
      matchedIndexes.length > 0 &&
      matchedIndexes.length === cards.length
    ) {
      // Pause timer if it's running
      if (timedMode) {
        pauseTimer();
      }

      setTimeout(() => {
        setGameFinished(true);
        setShowFireworks(true);
        // Update the user's score in the database
        updateScore("memory", score);
      }, 500);
    }
  }, [
    matchedIndexes,
    cards.length,
    gameStarted,
    gameFinished,
    score,
    updateScore,
    timedMode,
    pauseTimer,
  ]);

  // Update match position when a new card is matched
  useEffect(() => {
    // Check if new matches have been added
    if (matchedIndexes.length > 0) {
      // Get the last matched card index
      const lastMatchedIndex = matchedIndexes[matchedIndexes.length - 1];
      const cardElement = document.getElementById(`card-${lastMatchedIndex}`);

      if (cardElement) {
        const rect = cardElement.getBoundingClientRect();
        setMatchPosition({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        });
      }
    }
  }, [matchedIndexes]);

  // Effect to monitor when the timer should start/end the game
  useEffect(() => {
    // Start conditions - if game has started, isn't finished, and we're in timed mode
    if (
      gameStarted &&
      !gameFinished &&
      timedMode &&
      !isActive &&
      timeRemaining > 0
    ) {
      startTimer();
    }

    // End condition - if timer has reached 0 in timed mode
    if (gameStarted && !gameFinished && timedMode && timeRemaining === 0) {
      handleGameOver();
    }
  }, [
    gameStarted,
    gameFinished,
    timedMode,
    isActive,
    timeRemaining,
    startTimer,
    handleGameOver,
  ]);

  // Add this useEffect to monitor card count and grid size
  useEffect(() => {
    // Alert if there's a mismatch
    if (cards.length > GRID_SIZES[gridSize]) {
      console.warn(
        `Card count mismatch! Expected ${GRID_SIZES[gridSize]} but got ${cards.length}`
      );
    }
  }, [cards, gridSize]);

  // Add a ref to track gridSize changes
  const prevGridSizeRef = useRef(gridSize);

  // Add this effect to recreate cards when gridSize changes
  useEffect(() => {
    // Only run this effect if gridSize has changed and game has started
    if (prevGridSizeRef.current !== gridSize && gameStarted) {
      // Create new cards with the updated grid size
      const newCards = createCards(clef, gridSize, selectedNotes, enableSharps, enableFlats);

      // Update cards state
      setCards(newCards);

      // Reset game state for the new card set
      setFlippedIndexes([]);
      setMatchedIndexes([]);
      setScore(0);
    }

    // Update ref to current gridSize
    prevGridSizeRef.current = gridSize;
  }, [gridSize, clef, gameStarted, selectedNotes, enableSharps, enableFlats]);

  useEffect(() => {
    if (!gameStarted) return;
    const expectedCount = GRID_SIZES[gridSize];
    if (!expectedCount) return;
    if (cards.length !== expectedCount) {
      const refreshedCards = createCards(clef, gridSize, selectedNotes, enableSharps, enableFlats);
      setCards(refreshedCards);
    }
  }, [gameStarted, gridSize, cards.length, clef, selectedNotes, enableSharps, enableFlats]);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between gap-2 p-2 sm:p-3">
        {!gameFinished && gameStarted && (
          <BackButton
            to="/notes-master-mode"
            name={t("navigation.links.studentDashboard")}
            styling="text-white/80 hover:text-white text-xs sm:text-sm flex-shrink-0"
          />
        )}

        {/* Timer and Score Display - only show when game is started */}
        {gameStarted && !gameFinished && (
          <div className="flex flex-1 items-center justify-center gap-2 text-lg font-bold text-white sm:gap-3 sm:text-xl md:gap-4 md:text-2xl">
            {timedMode && (
              <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
                <span className="text-sm text-white/70 sm:text-base md:text-lg">
                  {t("games.time")}:
                </span>
                <span className="font-mono">{formattedTime}</span>
              </div>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2 py-1 backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5">
              <span className="text-sm text-white/70 sm:text-base md:text-lg">
                {t("games.score")}:
              </span>
              <span className="font-mono">{score}</span>
            </div>
          </div>
        )}

        {/* Settings Button */}
        {gameStarted && !gameFinished && (
          <button
            onClick={handlePauseGame}
            className="flex-shrink-0 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            {timedMode ? t("games.actions.pause") : t("pages.settings.title")}
          </button>
        )}
      </div>

      {showFireworks && <Firework />}
      {showMatchFirework && (
        <div
          className="fixed"
          style={{ left: matchPosition.x, top: matchPosition.y, zIndex: 50 }}
        >
          <Firework scale={0.5} />
        </div>
      )}

      {/* Show loading screen when coming from trail and waiting for auto-start */}
      {!gameStarted && nodeConfig ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            <p className="text-lg font-medium text-white/80">Loading Memory Game...</p>
          </div>
        </div>
      ) : !gameStarted ? (
        <UnifiedGameSettings
          gameType="memory"
          steps={[
            {
              id: "clef",
              title: "gameSettings.steps.labels.clef",
              component: "ClefSelection",
            },
            {
              id: "notes",
              title: "gameSettings.steps.labels.notes",
              component: "NoteSelection",
              config: {
                showImages: true,
                minNotes: 2,
                noteIdField: "pitch",
                selectAllByDefault: true,
              },
            },
            {
              id: "gridSize",
              title: "gameSettings.steps.labels.gridSize",
              component: "GridSizeSelection",
              config: {
                gridSizes: [
                  { value: "3 X 4", name: "3 × 4", pairs: 6 },
                  { value: "3 X 6", name: "3 × 6", pairs: 9 },
                  { value: "3 X 8", name: "3 × 8", pairs: 12 },
                ],
              },
            },
            {
              id: "timedMode",
              title: "gameSettings.steps.labels.gameMode",
              component: "TimedModeSelection",
            },
          ]}
          initialSettings={{
            clef,
            selectedNotes: preparedSelectedNotes,
            gridSize,
            timedMode,
            difficulty,
          }}
          initialSelectedNotes={preparedSelectedNotes}
          onStart={handleGameSettings}
          backRoute="/notes-master-mode"
          noteData={{
            trebleNotes,
            bassNotes,
          }}
        />
      ) : gameFinished ? (
        isLost ? (
          <GameOverScreen
            score={score}
            totalQuestions={cards.length / 2}
            timeRanOut={true}
            onReset={handleReset}
          />
        ) : (
          <VictoryScreen
            score={score}
            totalPossibleScore={cards.length * 10}
            onReset={handleReset}
            onExit={() => navigate(nodeId ? "/trail" : "/notes-master-mode")}
            nodeId={nodeId}
            exerciseIndex={trailExerciseIndex}
            totalExercises={trailTotalExercises}
            exerciseType={trailExerciseType}
            onNextExercise={handleNextExercise}
          />
        )
      ) : (
        <div className="flex flex-1 flex-col min-h-0">
          {/* Game grid - fits in viewport */}
          <div className="flex flex-1 items-start justify-center overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-4 sm:py-4 md:items-center">
            <div className={`${getGridClassName()} px-2 sm:px-4`}>
              {(() => {
                const expectedCardCount = GRID_SIZES[gridSize] || cards.length;
                return cards.slice(0, expectedCardCount);
              })().map((card, index) => {
                const isFlipped =
                  flippedIndexes.includes(index) ||
                  matchedIndexes.includes(index);

                const isMatched = matchedIndexes.includes(index);

                return (
                  <div
                    key={index}
                    id={`card-${index}`}
                    style={{
                      perspective: "1000px",
                      WebkitPerspective: "1000px",
                    }}
                    className={[
                      "relative w-full aspect-[4/3] select-none",
                      "cursor-pointer",
                      "transition-[transform,opacity,box-shadow] duration-200 ease-out",
                      "hover:shadow-2xl active:scale-95",
                      isMatched ? "opacity-0 scale-90 pointer-events-none" : "",
                    ].join(" ")}
                    onClick={() => handleCardClick(index)}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transition: "transform 0.6s",
                        transformStyle: "preserve-3d",
                        WebkitTransformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        WebkitTransform: isFlipped
                          ? "rotateY(180deg)"
                          : "rotateY(0deg)",
                        willChange: "transform",
                      }}
                    >
                      {/* Front face */}
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: "rotateY(0deg) translateZ(0px)",
                          WebkitTransform: "rotateY(0deg) translateZ(0px)",
                          background:
                            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
                          borderRadius: "1rem",
                          boxShadow:
                            "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)",
                          border: "3px solid rgba(255, 255, 255, 0.25)",
                          overflow: "hidden",
                        }}
                        className="front-face relative"
                      >
                        <div
                          style={{
                            color: "white",
                            fontSize: "3rem",
                            fontWeight: "bold",
                            position: "relative",
                            zIndex: 10,
                            textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                          }}
                        >
                          ?
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent"></div>
                      </div>

                      {/* Back face */}
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
                          borderRadius: "1rem",
                          boxShadow:
                            "0 10px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)",
                          transform: "rotateY(180deg)",
                          WebkitTransform: "rotateY(180deg)",
                          overflow: "hidden",
                          border: "3px solid rgba(99, 102, 241, 0.2)",
                        }}
                        className="back-face relative"
                      >
                        {card.type === "note" ? (
                          card.ImageComponent && (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                              }}
                            >
                              <card.ImageComponent
                                aria-label={card.value}
                                style={{
                                  width: "130%",
                                  height: "130%",
                                  maxWidth: "none",
                                  objectFit: "contain",
                                  position: "relative",
                                  zIndex: 10,
                                }}
                              />
                            </div>
                          )
                        ) : (
                          <div
                            style={{
                              color: "#1e293b",
                              fontSize:
                                gridDifficulty === "Hard"
                                  ? "clamp(1.8rem, 4vw, 2.8rem)"
                                  : gridDifficulty === "Medium"
                                    ? "clamp(2rem, 4.5vw, 3.2rem)"
                                    : "clamp(2.4rem, 5vw, 3.6rem)",
                              fontWeight: 700,
                              position: "relative",
                              zIndex: 10,
                              textShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
                              fontFamily: NOTE_LABEL_FONT_STACK,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {card.value}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/70 via-transparent to-purple-50/30 opacity-60"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <UnifiedGameSettings
          gameType="memory"
          isModal={true}
          steps={[
            {
              id: "clef",
              title: "gameSettings.steps.labels.clef",
              component: "ClefSelection",
            },
            {
              id: "notes",
              title: "gameSettings.steps.labels.notes",
              component: "NoteSelection",
              config: {
                showImages: true,
                minNotes: 2,
                noteIdField: "pitch",
                selectAllByDefault: true,
              },
            },
            {
              id: "gridSize",
              title: "gameSettings.steps.labels.gridSize",
              component: "GridSizeSelection",
              config: {
                gridSizes: [
                  { value: "3 X 4", name: "3 × 4", pairs: 6 },
                  { value: "3 X 6", name: "3 × 6", pairs: 9 },
                  { value: "3 X 8", name: "3 × 8", pairs: 12 },
                ],
              },
            },
            {
              id: "timedMode",
              title: "gameSettings.steps.labels.gameMode",
              component: "TimedModeSelection",
            },
          ]}
          initialSettings={{
            clef,
            selectedNotes: preparedSelectedNotes,
            gridSize,
            timedMode,
            difficulty,
          }}
          initialSelectedNotes={preparedSelectedNotes}
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
