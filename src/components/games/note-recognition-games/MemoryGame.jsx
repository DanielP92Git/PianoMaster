import React, { useState, useEffect } from "react";
import { useScores } from "../../../features/userData/useScores";
import doImage from "../../../assets/noteImages/do.jpg";
import reImage from "../../../assets/noteImages/re.jpg";
import miImage from "../../../assets/noteImages/mi.jpg";
import faImage from "../../../assets/noteImages/fa.jpg";
import solImage from "../../../assets/noteImages/sol.jpg";
import laImage from "../../../assets/noteImages/la.jpg";
import siImage from "../../../assets/noteImages/si.jpg";
import BackButton from "../../ui/BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";

const notes = [
  { note: "דו", image: doImage },
  { note: "רה", image: reImage },
  { note: "מי", image: miImage },
  { note: "פה", image: faImage },
  { note: "סול", image: solImage },
  { note: "לה", image: laImage },
  { note: "סי", image: siImage },
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
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showMatchFirework, setShowMatchFirework] = useState(false);
  const [matchPosition, setMatchPosition] = useState({ x: 0, y: 0 });
  const [gameFinished, setGameFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { updateScore } = useScores();

  // Create cards based on grid size
  const createCards = () => {
    const totalCards = GRID_SIZES[gridSize];
    const pairs = totalCards / 2;

    // Create an array of notes that can be duplicated to fill the required number of pairs
    let selectedNotes = [];
    while (selectedNotes.length < pairs) {
      const remainingPairs = pairs - selectedNotes.length;
      const availableNotes = [...notes];
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

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setGridSize(DIFFICULTIES[newDifficulty]);
    setCards(createCards());
  };

  const handleStartGame = () => {
    setCards(createCards());
    setFlippedIndexes([]);
    setMatchedPairs([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
    setGameStarted(true);
  };

  const handlePauseGame = () => {
    setShowSettingsModal(true);
  };

  const handleRestartGame = () => {
    setShowSettingsModal(false);
    setCards(createCards());
    setFlippedIndexes([]);
    setMatchedPairs([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
  };

  const handleReset = () => {
    setGameStarted(false);
    setCards(createCards());
    setFlippedIndexes([]);
    setMatchedPairs([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
  };

  const handleCardClick = (index) => {
    if (
      flippedIndexes.length === 2 ||
      flippedIndexes.includes(index) ||
      matchedPairs.includes(cards[index].id)
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
        firstCard.id === secondCard.id &&
        firstCard.type !== secondCard.type &&
        firstCard.value === secondCard.value
      ) {
        // Match found - show firework and delay disappearance
        setShowMatchFirework(true);
        setTimeout(() => {
          setShowMatchFirework(false);
          setMatchedPairs((prev) => [...prev, firstCard.id]);
          setScore((prev) => prev + 10);
          setFlippedIndexes([]);

          // Check if game is complete
          if (matchedPairs.length + 1 === cards.length / 2) {
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

  const StartScreen = () => (
    <div className="flex-1 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-8">Memory Game</h1>
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Choose Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(DIFFICULTIES).map((diff) => (
                <option key={diff} value={diff} className="bg-gray-800">
                  {diff} ({GRID_SIZES[DIFFICULTIES[diff]] / 2} pairs)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Choose a Clef
            </label>
            <select
              value={clef}
              onChange={(e) => setClef(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Treble" className="bg-gray-800">
                Treble Clef
              </option>
              <option value="Bass" className="bg-gray-800">
                Bass Clef
              </option>
            </select>
          </div>
          <button
            onClick={handleStartGame}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Game Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.keys(DIFFICULTIES).map((diff) => (
                <option key={diff} value={diff} className="bg-gray-800">
                  {diff} ({GRID_SIZES[DIFFICULTIES[diff]] / 2} pairs)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Choose a Clef
            </label>
            <select
              value={clef}
              onChange={(e) => setClef(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Treble" className="bg-gray-800">
                Treble Clef
              </option>
              <option value="Bass" className="bg-gray-800">
                Bass Clef
              </option>
            </select>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="flex-1 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRestartGame}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Restart Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col p-8">
      <BackButton
        to="/note-recognition-mode"
        name="Note Recognition"
        styling="text-white/80 hover:text-white mb-2"
      />
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
        <StartScreen />
      ) : gameFinished ? (
        <VictoryScreen
          score={score}
          totalPossibleScore={cards.length * 5}
          onReset={handleReset}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="absolute top-4 right-4">
            <button
              onClick={handlePauseGame}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Settings
            </button>
          </div>
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-white">Score: {score}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className={getGridClassName()}>
              {cards.map((card, index) => (
                <div
                  key={index}
                  id={`card-${index}`}
                  onClick={() => handleCardClick(index)}
                  className={`w-32 h-32 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 cursor-pointer transform transition-all duration-300 ${
                    matchedPairs.includes(card.id)
                      ? "opacity-0 pointer-events-none"
                      : "hover:scale-105"
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center p-2">
                    {flippedIndexes.includes(index) ||
                    matchedPairs.includes(card.id) ? (
                      card.type === "note" ? (
                        <img
                          src={card.image}
                          alt={`Musical Note ${card.value}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-base font-medium text-white">
                          {card.name}
                        </span>
                      )
                    ) : (
                      <span className="text-2xl text-white/80">?</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {showSettingsModal && <SettingsModal />}
        </div>
      )}
    </div>
  );
}
