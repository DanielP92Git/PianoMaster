import React, { useState, useEffect } from "react";
import { useScores } from "../../../features/userData/useScores";
import doImage from "../../../assets/noteImages/do.jpg";
import reImage from "../../../assets/noteImages/re.jpg";
import miImage from "../../../assets/noteImages/mi.jpg";
import faImage from "../../../assets/noteImages/fa.jpg";
import solImage from "../../../assets/noteImages/sol.jpg";
import laImage from "../../../assets/noteImages/la.jpg";
import siImage from "../../../assets/noteImages/si.jpg";
import BackButton from "../../BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";

const notes = [
  { note: "Do", image: doImage },
  { note: "Re", image: reImage },
  { note: "Mi", image: miImage },
  { note: "Fa", image: faImage },
  { note: "Sol", image: solImage },
  { note: "La", image: laImage },
  { note: "Si", image: siImage },
];

const noteNames = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];

const GRID_SIZES = {
  "3 X 2": 6,
  "4 x 3": 12,
  "4 x 4": 16,
  "6 x 6": 36,
  "8 x 8": 64,
};

export function MemoryGame() {
  const [gridSize, setGridSize] = useState("4 x 3");
  const [clef, setClef] = useState("Treble");
  const [cards, setCards] = useState([]);
  const [flippedIndexes, setFlippedIndexes] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [score, setScore] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [showMatchFirework, setShowMatchFirework] = useState(false);
  const [matchPosition, setMatchPosition] = useState({ x: 0, y: 0 });
  const [gameFinished, setGameFinished] = useState(false);
  const { updateScore } = useScores();

  useEffect(() => {
    initializeGame();
  }, [gridSize, clef]);

  const initializeGame = () => {
    const totalCards = GRID_SIZES[gridSize];
    const pairs = totalCards / 2;

    // Select random notes for the game
    const selectedNotes = [...notes]
      .sort(() => Math.random() - 0.5)
      .slice(0, pairs);

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
    const allCards = [...noteCards, ...nameCards]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, index }));

    setCards(allCards);
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

  const handleReset = () => {
    initializeGame();
  };

  const getGridClassName = () => {
    const size = gridSize.split("x")[0].trim();
    return `grid gap-4 ${
      size === "3"
        ? "grid-cols-3"
        : size === "4"
        ? "grid-cols-4"
        : size === "6"
        ? "grid-cols-6"
        : "grid-cols-8"
    }`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <BackButton 
        to="/note-recognition-mode" 
        name="Note Recognition" 
        className="text-white/80 hover:text-white"
      />
      {showFireworks && <Firework />}
      {showMatchFirework && (
        <div className="fixed" style={{ left: matchPosition.x, top: matchPosition.y, zIndex: 50 }}>
          <Firework scale={0.5} />
        </div>
      )}

      {gameFinished ? (
        <VictoryScreen
          score={score}
          totalPossibleScore={cards.length * 5}
          onReset={handleReset}
        />
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Grid Size
                </label>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(e.target.value)}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(GRID_SIZES).map((size) => (
                    <option key={size} value={size} className="bg-gray-800">
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Clef
                </label>
                <select
                  value={clef}
                  onChange={(e) => setClef(e.target.value)}
                  className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option className="bg-gray-800">Treble</option>
                  <option className="bg-gray-800">Bass</option>
                </select>
              </div>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-white">Score: {score}</p>
              <button
                onClick={initializeGame}
                className="mt-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                New Game
              </button>
            </div>
          </div>

          <div className={getGridClassName()}>
            {cards.map((card, index) => (
              <div
                key={index}
                id={`card-${index}`}
                onClick={() => handleCardClick(index)}
                className={`aspect-square bg-white/10 backdrop-blur-md rounded-xl border border-white/20 cursor-pointer transform transition-all duration-300 ${
                  matchedPairs.includes(card.id)
                    ? "opacity-0 pointer-events-none"
                    : "hover:scale-105"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center p-4">
                  {flippedIndexes.includes(index) ||
                  matchedPairs.includes(card.id) ? (
                    card.type === "note" ? (
                      <img
                        src={card.image}
                        alt={`Musical Note ${card.value}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-medium text-white">
                        {card.name}
                      </span>
                    )
                  ) : (
                    <span className="text-4xl text-white/80">?</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
