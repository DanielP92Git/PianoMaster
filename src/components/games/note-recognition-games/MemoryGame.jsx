import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useScores } from "../../../features/userData/useScores";
import { useSounds } from "../../../features/games/hooks/useSounds";
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
import { GameSettings } from "../shared/GameSettings";
import { useGameTimer } from "../../../features/games/hooks/useGameTimer";
import GameOverScreen from "../GameOverScreen";

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
  { note: "רה", image: bassReImage },
  { note: "מי", image: bassMiImage },
  { note: "פה", image: bassFaImage },
  { note: "סול", image: bassSolImage },
  { note: "לה", image: bassLaImage },
  { note: "סי", image: bassSiImage },
];

const noteNames = ["דו", "רה", "מי", "פה", "סול", "לה", "סי"];

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

export function MemoryGame() {
  // CSS for card flipping
  const styles = {
    cardContainer: {
      perspective: "1000px",
      position: "relative",
    },
    cardInner: {
      position: "relative",
      width: "100%",
      height: "100%",
      transition: "transform 0.6s",
      transformStyle: "preserve-3d",
    },
    cardInnerFlipped: {
      transform: "rotateY(180deg)",
    },
    cardFace: {
      position: "absolute",
      width: "100%",
      height: "100%",
      backfaceVisibility: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cardBack: {
      transform: "rotateY(180deg)",
    },
  };

  const [difficulty, setDifficulty] = useState("Easy");
  const [gridSize, setGridSize] = useState(DIFFICULTIES["Easy"]);
  const [clef, setClef] = useState("Treble");

  // Create cards based on grid size
  const createCards = (currentClef = clef, currentGridSize = gridSize) => {
    const totalCards = GRID_SIZES[currentGridSize];
    const pairs = totalCards / 2;
    console.log(
      `Creating cards with totalCards=${totalCards}, pairs=${pairs}, gridSize=${currentGridSize}`
    );

    // Select the appropriate notes based on clef
    const selectedNotesArray =
      currentClef === "Treble" ? trebleNotes : bassNotes;

    // Create a copy of the notes array and shuffle it to randomize selection
    const availableNotes = [...selectedNotesArray];
    availableNotes.sort(() => Math.random() - 0.5);

    // Prepare the final array of notes we'll use (may include duplicates)
    let selectedNotes = [];

    // If we need more pairs than unique notes available, we'll reuse notes
    if (pairs <= availableNotes.length) {
      // We have enough unique notes, just take what we need
      selectedNotes = availableNotes.slice(0, pairs);
      console.log(
        `Using ${selectedNotes.length} unique notes for ${pairs} pairs`
      );
    } else {
      // We need more pairs than unique notes available
      // First, use all available unique notes
      selectedNotes = [...availableNotes];

      // Then reuse notes as needed (cycle through them)
      while (selectedNotes.length < pairs) {
        // Start from beginning of shuffled notes and add more until we have enough
        const notesToAdd = Math.min(
          pairs - selectedNotes.length,
          availableNotes.length
        );
        selectedNotes = [
          ...selectedNotes,
          ...availableNotes.slice(0, notesToAdd),
        ];
      }

      console.log(
        `Using ${availableNotes.length} unique notes (with ${
          selectedNotes.length - availableNotes.length
        } duplicates) for ${pairs} pairs`
      );
    }

    // Double-check we have exactly the right number of pairs
    if (selectedNotes.length !== pairs) {
      console.log(
        `Adjusting selected notes from ${selectedNotes.length} to ${pairs}`
      );
      selectedNotes = selectedNotes.slice(0, pairs);
    }

    // Create pairs of notes and their names
    const noteCards = selectedNotes.map((note, index) => ({
      id: index,
      type: "note",
      value: note.note,
      image: note.image,
    }));

    const nameCards = selectedNotes.map((note, index) => ({
      id: index,
      type: "name",
      value: note.note,
      name: note.note,
    }));

    // Double-check total card count
    const allCards = [...noteCards, ...nameCards];
    console.log(
      `Final card count: ${allCards.length} (should be ${totalCards})`
    );

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
        console.log(
          `Added ${additionalCards.length} extra cards to reach ${finalCards.length} total`
        );

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
    console.log(
      "Creating initial cards with clef:",
      clef,
      "grid size:",
      DIFFICULTIES["Easy"]
    );
    return createCards(clef, DIFFICULTIES["Easy"]);
  }, [clef]);

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
    console.log("Game over - time ran out!");
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

  // Handle settings from the GameSettings component
  const handleGameSettings = (settings) => {
    // ADD DETAILED LOGGING
    console.log("===== INITIAL GAME SETTINGS =====");
    console.log("Settings received:", JSON.stringify(settings));
    console.log("Current difficulty before update:", difficulty);
    console.log("Current gridSize before update:", gridSize);

    // Always update clef
    let newClef = clef;
    if (settings.clef !== undefined) {
      newClef = settings.clef;
      setClef(settings.clef);
    }

    // Update difficulty and grid size
    let newGridSize = gridSize;
    let newDifficulty = difficulty;
    if (settings.difficulty !== undefined) {
      newDifficulty = settings.difficulty;
      newGridSize = DIFFICULTIES[settings.difficulty];
      console.log(`Will set difficulty to: ${newDifficulty}`);
      console.log(
        `Will set gridSize to: ${newGridSize}, expected cards: ${GRID_SIZES[newGridSize]}`
      );

      // Create cards immediately with the new grid size
      const newCards = createCards(newClef, newGridSize);
      console.log(
        `Created ${newCards.length} cards immediately for ${newGridSize}`
      );

      // Update all states at once
      setDifficulty(settings.difficulty);
      setGridSize(newGridSize);
      setCards(newCards);
      console.log(`Set cards state with ${newCards.length} cards`);
    }

    // Handle timed mode
    let newTimedMode = timedMode;
    if (settings.timedMode !== undefined) {
      newTimedMode = settings.timedMode;
      setTimedMode(settings.timedMode);
    }

    // Handle time limit
    let newTimeLimit = timeLimit;
    if (settings.timeLimit !== undefined) {
      newTimeLimit = settings.timeLimit;
      setTimeLimit(settings.timeLimit);
    } else if (settings.timedMode && settings.difficulty) {
      // If timed mode with difficulty specified, set appropriate time limit
      const difficultyTimeMap = {
        Easy: 90,
        Medium: 75,
        Hard: 60,
      };
      newTimeLimit = difficultyTimeMap[settings.difficulty] || 60;
      setTimeLimit(newTimeLimit);
    }

    // Start game with a slight delay to ensure state updates
    setTimeout(() => {
      console.log(
        `Finalizing game with: difficulty=${newDifficulty}, clef=${newClef}, gridSize=${newGridSize}, cards=${GRID_SIZES[newGridSize]}, timedMode=${newTimedMode}, timeLimit=${newTimeLimit}`
      );

      // Set game started state
      setGameStarted(true);
      setGameFinished(false);
      setIsLost(false);
      setFlippedIndexes([]);
      setMatchedIndexes([]);
      setScore(0);
      setShowFireworks(false);

      // Only reset the timer, don't recreate cards
      pauseTimer();
      resetTimer(newTimeLimit);

      // Print final card count
      console.log(`Game starting with ${cards.length} cards`);
    }, 200);
  };

  const handleStartGame = (
    currentClef = clef,
    newTimeLimit = timeLimit,
    newGridSize = gridSize
  ) => {
    // Always verify grid size matches difficulty
    const expectedGridSize = DIFFICULTIES[difficulty];
    if (newGridSize !== expectedGridSize) {
      console.log(
        `Grid size mismatch: received ${newGridSize} but expected ${expectedGridSize} for difficulty ${difficulty}`
      );
      newGridSize = expectedGridSize;
    }

    console.log(
      `handleStartGame called with clef=${currentClef}, difficulty=${difficulty}, gridSize=${newGridSize}, expectedCards=${GRID_SIZES[newGridSize]}`
    );

    setGameStarted(true);
    setGameFinished(false);
    setIsLost(false);
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);

    // Create cards with explicit grid size to ensure correct count
    const newCards = createCards(currentClef, newGridSize);
    console.log(
      `Created ${newCards.length} cards for grid size ${newGridSize}`
    );

    setCards(newCards);
    console.log(`Updated cards state with ${newCards.length} cards`);

    // Properly reset the timer with the updated time limit
    pauseTimer();
    resetTimer(newTimeLimit);

    // Timer will auto-start via the useEffect if in timed mode
  };

  const handlePauseGame = () => {
    if (timedMode) {
      pauseTimer();
    }
    setShowSettingsModal(true);
  };

  const handleRestartGame = (settings) => {
    setShowSettingsModal(false);

    // ADD DETAILED LOGGING
    console.log("===== RESTART GAME SETTINGS =====");
    console.log("Settings received from modal:", JSON.stringify(settings));
    console.log("Current difficulty before update:", difficulty);
    console.log("Current gridSize before update:", gridSize);

    // Update clef and other settings
    const newClef = settings.clef !== undefined ? settings.clef : clef;
    const newDifficulty =
      settings.difficulty !== undefined ? settings.difficulty : difficulty;

    // Always get the grid size from the difficulty
    const newGridSize = DIFFICULTIES[newDifficulty];
    console.log(`Will set difficulty to: ${newDifficulty}`);
    console.log(`Will set gridSize to: ${newGridSize}`);

    // IMPORTANT: If difficulty changed, create new cards immediately
    if (
      settings.difficulty !== undefined &&
      settings.difficulty !== difficulty
    ) {
      console.log(
        `Difficulty changed, creating new cards immediately for ${newGridSize}`
      );

      // Create new cards with the new grid size
      const newCards = createCards(newClef, newGridSize);
      console.log(`Created ${newCards.length} cards for immediate update`);

      // Update all state values at once
      setDifficulty(settings.difficulty);
      setGridSize(newGridSize);
      setCards(newCards);
      console.log(`New cards set with ${newCards.length} cards`);
    } else if (settings.difficulty !== undefined) {
      // Same difficulty but explicitly set
      setDifficulty(settings.difficulty);
      setGridSize(newGridSize);
    }

    // Handle other settings
    if (settings.clef !== undefined) {
      setClef(settings.clef);
    }

    if (settings.timedMode !== undefined) {
      setTimedMode(settings.timedMode);
    }

    if (settings.timeLimit !== undefined) {
      setTimeLimit(settings.timeLimit);
    } else if (settings.timedMode && settings.difficulty) {
      const difficultyTimeMap = {
        Easy: 90,
        Medium: 75,
        Hard: 60,
      };
      setTimeLimit(difficultyTimeMap[newDifficulty] || 60);
    }

    // Restart game with explicit settings - ensure we use the right grid size
    // Use a longer timeout to ensure state updates have completed
    setTimeout(() => {
      const actualTimeLimit = settings.timeLimit || timeLimit;
      console.log(
        `Starting game with: clef=${newClef}, gridSize=${newGridSize}, totalCards=${GRID_SIZES[newGridSize]}, timeLimit=${actualTimeLimit}`
      );

      // Reset game state
      setGameStarted(true);
      setGameFinished(false);
      setIsLost(false);
      setFlippedIndexes([]);
      setMatchedIndexes([]);
      setScore(0);
      setShowFireworks(false);

      // Only create new cards if we didn't already do it
      if (
        settings.difficulty === undefined ||
        settings.difficulty === difficulty
      ) {
        const gameCards = createCards(newClef, newGridSize);
        console.log(
          `Created ${gameCards.length} cards for grid size ${newGridSize}`
        );
        setCards(gameCards);
      }

      // Reset timer
      pauseTimer();
      resetTimer(actualTimeLimit);
    }, 200);
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

    // Ensure we use the right grid size based on current difficulty
    const resetGridSize = DIFFICULTIES[difficulty];
    console.log(
      `Resetting game with difficulty ${difficulty}, grid size ${resetGridSize}`
    );

    // Create cards with explicit grid size
    const newCards = createCards(clef, resetGridSize);
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

      if (
        firstCard.type !== secondCard.type &&
        firstCard.value === secondCard.value
      ) {
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
    // Return appropriate grid layout based on current difficulty
    console.log("Current difficulty:", difficulty, "gridSize:", gridSize);

    // Always use the difficulty to determine the grid layout
    switch (difficulty) {
      case "Easy":
        return "grid grid-cols-4 gap-2 gap-x-10 max-w-xl place-content-center justify-center mb-2";
      case "Medium":
        return "grid max-w-3xl grid-cols-6 gap-2 gap-x-10 place-content-center justify-center mb-2";
      case "Hard":
        return "grid max-w-5xl grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 gap-x-10 place-content-center justify-center mb-2";
      default:
        return "grid grid-cols-4 gap-2 gap-x-10 place-content-center justify-center mb-2";
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
      console.log("Game won!");

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
      console.log("Starting timer automatically");
      startTimer();
    }

    // End condition - if timer has reached 0 in timed mode
    if (gameStarted && !gameFinished && timedMode && timeRemaining === 0) {
      console.log("Time's up - game over");
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
    console.log(
      `Current grid size: ${gridSize}, should have ${GRID_SIZES[gridSize]} cards`
    );
    console.log(`Actual card count: ${cards.length}`);

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
      console.log(
        `Grid size changed from ${prevGridSizeRef.current} to ${gridSize}, recreating cards`
      );

      // Create new cards with the updated grid size
      const newCards = createCards(clef, gridSize);
      console.log(
        `Created ${newCards.length} cards for new grid size ${gridSize}`
      );

      // Update cards state
      setCards(newCards);

      // Reset game state for the new card set
      setFlippedIndexes([]);
      setMatchedIndexes([]);
      setScore(0);
    }

    // Update ref to current gridSize
    prevGridSizeRef.current = gridSize;
  }, [gridSize, clef, gameStarted]);

  // Add this effect right after the other useEffects
  // Add useEffect to ensure gridSize is always in sync with difficulty
  useEffect(() => {
    // This ensures gridSize is always in sync with difficulty
    const newGridSize = DIFFICULTIES[difficulty];
    if (gridSize !== newGridSize) {
      console.log(
        `Syncing gridSize with difficulty: ${difficulty} -> ${newGridSize}`
      );
      setGridSize(newGridSize);
    }
  }, [difficulty]);

  return (
    <div className="flex flex-col h-screen">
      <div className="p-2 sm:p-3 flex justify-between items-center">
        <Link
          to="/note-recognition-mode"
          className="text-white/80 hover:text-white flex items-center text-xs sm:text-sm"
        >
          <FaArrowLeft className="mr-1" /> Back to Games
        </Link>

        {/* Timer and Score Display - only show when game is started */}
        {gameStarted && (
          <div className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2 sm:space-x-4">
            <span>Score: {score}</span>
            {timedMode && <span>Time: {formattedTime}</span>}
          </div>
        )}

        {/* Settings Button */}
        {gameStarted && !gameFinished && (
          <button
            onClick={handlePauseGame}
            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-xs sm:text-sm"
          >
            {timedMode ? "Pause" : "Settings"}
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

      {!gameStarted ? (
        <GameSettings
          gameType="memory"
          onStart={handleGameSettings}
          initialClef={clef}
          initialTimedMode={timedMode}
          initialDifficulty={difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
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
          />
        )
      ) : (
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Game grid - scrollable container that shows all cards */}
          <div className="flex-1 overflow-auto py-1  px-2 flex justify-center items-center">
            <div className={`${getGridClassName()}  w-full mx-auto px-10`}>
              {(() => {
                // Always use the current difficulty to determine how many cards to show
                const expectedGridSize = DIFFICULTIES[difficulty];
                const expectedCardCount = GRID_SIZES[expectedGridSize];

                console.log(
                  `Rendering cards for difficulty ${difficulty}: grid=${expectedGridSize}, expectedCards=${expectedCardCount}, available=${cards.length}`
                );

                // Create a debug message for the counts
                const debugCards = cards.slice(0, expectedCardCount);
                console.log(
                  `After slicing: showing ${debugCards.length} cards`
                );
                return debugCards;
              })().map((card, index) => {
                const isFlipped =
                  flippedIndexes.includes(index) ||
                  matchedIndexes.includes(index);

                // Calculate responsive card sizes based on difficulty
                const cardHeight = "min(125px, 16vh)";

                return (
                  <div
                    key={index}
                    id={`card-${index}`}
                    style={{
                      perspective: "1000px",
                      aspectRatio: "4/3",
                      cursor: "pointer",
                      transition:
                        "transform 0.2s, box-shadow 0.2s, opacity 0.5s, scale 0.5s",
                      opacity: matchedIndexes.includes(index) ? 0 : 1,
                      scale: matchedIndexes.includes(index) ? 0.8 : 1,
                      pointerEvents: matchedIndexes.includes(index)
                        ? "none"
                        : "auto",
                      height: cardHeight,
                      maxHeight: cardHeight,
                      minHeight: "40px",
                      margin: "0",
                    }}
                    className="hover:scale-105 hover:shadow-lg"
                    onClick={() => handleCardClick(index)}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        transition: "transform 0.6s",
                        transformStyle: "preserve-3d",
                        transform: isFlipped ? "rotateY(180deg)" : "",
                      }}
                    >
                      {/* Front face */}
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backfaceVisibility: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            "linear-gradient(135deg, #4f46e5, #7e22ce)",
                          borderRadius: "0.75rem",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                          overflow: "hidden",
                        }}
                        className="front-face relative"
                      >
                        <div
                          style={{
                            color: "white",
                            fontSize: "1.875rem",
                            fontWeight: "bold",
                            position: "relative",
                            zIndex: 10,
                          }}
                        >
                          ?
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-40 hover:opacity-70 transition-opacity duration-300"></div>
                      </div>

                      {/* Back face */}
                      <div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backfaceVisibility: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "white",
                          borderRadius: "0.75rem",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          transform: "rotateY(180deg)",
                          overflow: "hidden",
                        }}
                        className="back-face relative"
                      >
                        {card.type === "note" ? (
                          <img
                            src={card.image}
                            alt={card.value}
                            style={{
                              width: difficulty === "Hard" ? "70%" : "75%",
                              height: difficulty === "Hard" ? "70%" : "75%",
                              objectFit: "contain",
                              position: "relative",
                              zIndex: 10,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              color: "#111827",
                              fontSize:
                                difficulty === "Hard"
                                  ? "0.9rem"
                                  : difficulty === "Medium"
                                  ? "1.05rem"
                                  : "1.2rem",
                              fontWeight: "bold",
                              position: "relative",
                              zIndex: 10,
                            }}
                          >
                            {card.value}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/50 to-transparent opacity-40 hover:opacity-70 transition-opacity duration-300"></div>
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
        <GameSettings
          gameType="memory"
          isModal={true}
          onStart={handleRestartGame}
          onCancel={handleResumeGame}
          initialClef={clef}
          initialTimedMode={timedMode}
          initialDifficulty={difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
        />
      )}
    </div>
  );
}
