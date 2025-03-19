import React, { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useScores } from "../../../features/userData/useScores";
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
  Easy: "3 X 4", // 6 pairs
  Medium: "3 X 6", // 9 pairs
  Hard: "3 X 8", // 12 pairs
};

export function MemoryGame() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [gridSize, setGridSize] = useState(DIFFICULTIES["Medium"]);
  const [clef, setClef] = useState("Treble");
  const [cards, setCards] = useState([]);
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
  }, [pauseTimer]);

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

  // Create cards based on grid size
  const createCards = (currentClef = clef) => {
    const totalCards = GRID_SIZES[gridSize];
    const pairs = totalCards / 2;

    // Select the appropriate notes based on clef
    const selectedNotesArray =
      currentClef === "Treble" ? trebleNotes : bassNotes;

    // Create an array of notes that can be duplicated to fill the required number of pairs
    let selectedNotes = [];
    while (selectedNotes.length < pairs) {
      const remainingPairs = pairs - selectedNotes.length;
      const availableNotes = [...selectedNotesArray];
      const numNotesToAdd = Math.min(remainingPairs, availableNotes.length);
      selectedNotes = [
        ...selectedNotes,
        ...availableNotes.slice(0, numNotesToAdd),
      ];
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

    // Combine and shuffle
    return [...noteCards, ...nameCards]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, index }));
  };

  // Initialize cards state with initial cards
  const [initialCards] = useState(createCards());

  // Handle settings from the GameSettings component
  const handleGameSettings = (settings) => {
    console.log("Received game settings:", settings);
    setClef(settings.clef);
    setDifficulty(settings.difficulty);
    setGridSize(DIFFICULTIES[settings.difficulty]);
    setTimedMode(settings.timedMode);
    setTimeLimit(settings.timeLimit || 60);

    // Start game with a slight delay to ensure state updates
    setTimeout(() => {
      handleStartGame(settings.clef);
    }, 100);
  };

  const handleStartGame = (currentClef = clef) => {
    setGameStarted(true);
    setGameFinished(false);
    setIsLost(false);
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    createCards(currentClef);

    // Start timer if in timed mode
    if (timedMode) {
      pauseTimer();
      setTimeout(() => {
        resetTimer(timeLimit);
        setTimeout(() => {
          startTimer();
        }, 50);
      }, 50);
    }
  };

  const handlePauseGame = () => {
    if (timedMode) {
      pauseTimer();
    }
    setShowSettingsModal(true);
  };

  const handleRestartGame = (settings) => {
    setShowSettingsModal(false);

    // Update settings
    setClef(settings.clef);
    setDifficulty(settings.difficulty);
    setGridSize(DIFFICULTIES[settings.difficulty]);
    setTimedMode(settings.timedMode);
    setTimeLimit(settings.timeLimit || 60);

    // Restart game with a slight delay
    setTimeout(() => {
      handleStartGame(settings.clef);
    }, 100);
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
    setCards(createCards(clef));
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
        setTimeout(() => {
          setShowMatchFirework(false);
          setMatchedIndexes((prev) => [...prev, ...newFlippedIndexes]);
          setScore((prev) => prev + 10);
          setFlippedIndexes([]);

          // Check if game is complete
          if (matchedIndexes.length + 2 === cards.length) {
            updateScore({ score: score + 10, gameType: "memory" });
            setShowFireworks(true);
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
    const [rows, cols] = gridSize.split("X").map((num) => num.trim());
    const gridCols =
      {
        3: "grid-cols-3",
        6: "grid-cols-6",
        8: "grid-cols-8",
      }[cols] || "grid-cols-4";

    const gridRows =
      {
        2: "grid-rows-2",
        3: "grid-rows-3",
        4: "grid-rows-4",
      }[rows] || "grid-rows-3";

    return `grid gap-2 ${gridCols} ${gridRows} max-w-7xl mx-auto max-h-screen`;
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

  return (
    <div className="flex flex-col h-screen">
      <div className="p-3 flex justify-between">
        <Link
          to="/note-recognition-mode"
          className="text-white/80 hover:text-white flex items-center text-sm"
        >
          <FaArrowLeft className="mr-1" /> Back to Games
        </Link>

        {/* Timer and Score Display */}
        <div className="text-2xl font-bold text-white flex items-center space-x-4">
          <span>Score: {score}</span>
          {timedMode && <span>Time: {formattedTime}</span>}
        </div>

        {/* Settings Button */}
        {gameStarted && !gameFinished && (
          <button
            onClick={handlePauseGame}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
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
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          {/* Game grid */}
          <div className={`mt-2 mb-6 ${getGridClassName()}`}>
            {cards.map((card, index) => (
              <div
                key={index}
                className={`relative perspective-500 transition-transform duration-300 ${
                  flippedIndexes.includes(index) ||
                  matchedIndexes.includes(index)
                    ? "rotate-y-180"
                    : ""
                }`}
                onClick={() => handleCardClick(index)}
                ref={(el) => {
                  if (el && matchedIndexes.includes(index)) {
                    const rect = el.getBoundingClientRect();
                    setMatchPosition({
                      x: rect.x + rect.width / 2,
                      y: rect.y + rect.height / 2,
                    });
                  }
                }}
              >
                {/* Front of card (hidden when flipped) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg border-2 border-white/20 transform ${
                    flippedIndexes.includes(index) ||
                    matchedIndexes.includes(index)
                      ? "rotate-y-180 opacity-0 pointer-events-none"
                      : ""
                  } transition-all duration-300 cursor-pointer hover:from-indigo-500 hover:to-purple-600`}
                >
                  <div className="text-white text-4xl font-bold">?</div>
                </div>

                {/* Back of card (visible when flipped) */}
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-white rounded-xl shadow-lg transform ${
                    flippedIndexes.includes(index) ||
                    matchedIndexes.includes(index)
                      ? ""
                      : "rotate-y-180 opacity-0 pointer-events-none"
                  } transition-all duration-300`}
                >
                  {card.type === "note" ? (
                    <img
                      src={card.image}
                      alt={card.value}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div className="text-gray-900 text-xl font-bold">
                      {card.value}
                    </div>
                  )}
                </div>
              </div>
            ))}
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
