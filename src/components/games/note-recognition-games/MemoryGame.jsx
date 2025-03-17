import React, { useState, useEffect } from "react";
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
  const { updateScore } = useScores();

  // Create cards based on grid size
  const createCards = () => {
    const totalCards = GRID_SIZES[gridSize];
    const pairs = totalCards / 2;

    // Select the appropriate notes based on clef
    const selectedNotesArray = clef === "Treble" ? trebleNotes : bassNotes;

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
    const {
      clef: newClef,
      difficulty: newDifficulty,
      gridSize: newGridSize,
    } = settings;

    // Update settings
    setClef(newClef);
    setDifficulty(newDifficulty);
    setGridSize(DIFFICULTIES[newDifficulty] || newGridSize);

    // Create new cards with the updated settings
    const newCards = createCards();
    setCards(newCards);
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
    setGameStarted(true);
  };

  const handleStartGame = () => {
    // Create new cards with current settings
    const newCards = createCards();
    setCards(newCards);
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
    setGameStarted(true);
  };

  const handlePauseGame = () => {
    setShowSettingsModal(true);
  };

  const handleRestartGame = (settings) => {
    setShowSettingsModal(false);
    // Update settings first
    if (settings) {
      setClef(settings.clef);
      setDifficulty(settings.difficulty);
      setGridSize(DIFFICULTIES[settings.difficulty] || settings.gridSize);
    }
    // Then create new cards with current settings
    setCards(createCards());
    setFlippedIndexes([]);
    setMatchedIndexes([]);
    setScore(0);
    setShowFireworks(false);
    setGameFinished(false);
  };

  const handleReset = () => {
    setGameStarted(false);
    setCards(createCards());
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
        <GameSettings
          gameType="memory"
          onStart={handleGameSettings}
          initialClef={clef}
          initialSelectedNotes={noteNames}
          initialDifficulty={difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          noteOptions={noteNames}
        />
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
                  className={`w-32 h-32 rounded-xl border cursor-pointer transform transition-all duration-300 ease-in-out relative overflow-hidden ${
                    matchedIndexes.includes(index)
                      ? "opacity-0 pointer-events-none"
                      : "hover:scale-105"
                  } ${
                    flippedIndexes.includes(index) ||
                    matchedIndexes.includes(index)
                      ? ""
                      : "bg-white/10 backdrop-blur-md border-white/20"
                  }`}
                >
                  {/* Card content when flipped */}
                  {(flippedIndexes.includes(index) ||
                    matchedIndexes.includes(index)) &&
                    (card.type === "note" ? (
                      <div className="absolute inset-0 bg-white">
                        <img
                          src={card.image}
                          alt={`Musical Note ${card.value}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-white flex items-center justify-center">
                        <span className="text-base font-medium text-black">
                          {card.name}
                        </span>
                      </div>
                    ))}

                  {/* Question mark when not flipped */}
                  {!(
                    flippedIndexes.includes(index) ||
                    matchedIndexes.includes(index)
                  ) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl text-white/80">?</span>
                    </div>
                  )}
                </div>
              ))}
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
          onCancel={() => setShowSettingsModal(false)}
          initialClef={clef}
          initialSelectedNotes={noteNames}
          initialDifficulty={difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          noteOptions={noteNames}
        />
      )}
    </div>
  );
}
