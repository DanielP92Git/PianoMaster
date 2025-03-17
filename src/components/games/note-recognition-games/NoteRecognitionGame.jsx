import React, { useState, useEffect, useRef } from "react";
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
import { FaPlay, FaPause } from "react-icons/fa";
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
  { note: "סי", image: bassSiImage },
  { note: "לה", image: bassLaImage },
  { note: "סול", image: bassSolImage },
  { note: "פה", image: bassFaImage },
  { note: "מי", image: bassMiImage },
  { note: "רה", image: bassReImage },
];

const TIME_LIMITS = {
  Easy: 60, // 60 seconds
  Medium: 45, // 45 seconds
  Hard: 30, // 30 seconds
};

export function NoteRecognitionGame() {
  const [clef, setClef] = useState("Treble");
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMITS.Medium);
  const timerRef = useRef(null);
  const { updateScore } = useScores();

  // Get time limit based on difficulty
  const getTimeLimit = (difficulty) => {
    console.log("Getting time limit for difficulty:", difficulty);
    const TIME_LIMITS = {
      Easy: 60,
      Medium: 45,
      Hard: 30,
    };

    // Handle case sensitivity and default to Medium if not found
    if (typeof difficulty === "string") {
      const capitalizedDifficulty =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      console.log("Capitalized difficulty:", capitalizedDifficulty);
      return TIME_LIMITS[capitalizedDifficulty] || TIME_LIMITS.Medium;
    }

    return TIME_LIMITS.Medium; // Default to Medium if difficulty is not a string
  };

  // Start timer function
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          handleGameOver();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle game settings from the GameSettings component
  const handleGameSettings = (settings) => {
    console.log("Received game settings:", settings);

    // Extract settings
    const { clef, selectedNotes, timedMode, difficulty } = settings;

    // Ensure selectedNotes is an array
    const notesArray = Array.isArray(selectedNotes) ? selectedNotes : [];
    console.log("Selected notes for game:", notesArray);

    // Set state based on settings
    setClef(clef);
    setSelectedNotes(notesArray);
    setTimedMode(timedMode);
    setDifficulty(difficulty);

    // Set time limit for timed mode
    if (timedMode) {
      const timeLimit = getTimeLimit(difficulty);
      console.log(
        `Setting time limit to ${timeLimit} seconds for difficulty ${difficulty}`
      );
      setTimeRemaining(timeLimit);
    }

    // Start the game with a slight delay to ensure state updates are processed
    setTimeout(() => {
      console.log("Starting game with settings:", {
        clef,
        selectedNotes: notesArray,
        timedMode,
        difficulty,
      });
      startGame(clef, notesArray, timedMode, difficulty);
    }, 100);
  };

  // Separate function to start the game with explicit parameters
  const startGame = (gameClef, gameNotes, isTimedMode, gameDifficulty) => {
    console.log("Starting game with:", {
      gameClef,
      gameNotes,
      isTimedMode,
      gameDifficulty,
    });

    // Ensure gameNotes is an array
    const notesArray = Array.isArray(gameNotes) ? gameNotes : [];

    if (!notesArray || notesArray.length === 0) {
      console.error("No notes selected for the game");
      return;
    }

    setGameStarted(true);
    setShowSettingsModal(false);
    setScore(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    setGameFinished(false);

    // Get notes based on clef
    const clefNotes = gameClef === "Treble" ? trebleNotes : bassNotes;

    // Filter notes based on selection
    const filteredNotes = clefNotes.filter((note) =>
      notesArray.includes(note.note)
    );

    console.log("Filtered notes for game:", filteredNotes);

    // Set initial note
    if (filteredNotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredNotes.length);
      setCurrentNote(filteredNotes[randomIndex]);

      // Start timer if in timed mode
      if (isTimedMode) {
        const timeLimit = getTimeLimit(gameDifficulty);
        console.log(
          `Starting timer with ${timeLimit} seconds for ${gameDifficulty} difficulty`
        );
        setTimeRemaining(timeLimit);
        startTimer();
      }
    }
  };

  // Start the game (original function, now calls startGame)
  const handleStartGame = () => {
    startGame(clef, selectedNotes, timedMode, difficulty);
  };

  // Handle answer selection
  const handleAnswerSelect = (selectedAnswer) => {
    if (!currentNote) return;

    const isCorrect = selectedAnswer === currentNote.note;

    // Update score and stats
    setTotalQuestions((prev) => prev + 1);
    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
      setShowFireworks(true);
      setTimeout(() => setShowFireworks(false), 1000);
    }

    // Get next note
    const notesArray = clef === "Treble" ? trebleNotes : bassNotes;
    const filteredNotes = notesArray.filter((note) =>
      selectedNotes.includes(note.note)
    );

    // Check if all questions have been answered
    if (totalQuestions >= 9) {
      handleGameOver();
      return;
    }

    // Set next note
    const randomIndex = Math.floor(Math.random() * filteredNotes.length);
    setCurrentNote(filteredNotes[randomIndex]);
  };

  // Handle game over
  const handleGameOver = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate score percentage
    const scorePercentage =
      (correctAnswers / Math.max(1, totalQuestions)) * 100;

    // Determine if game was lost:
    // 1. If all 10 questions were answered but score is less than 50%
    // 2. If in timed mode and time ran out before answering all questions
    const isGameLost =
      (totalQuestions >= 10 && scorePercentage < 50) ||
      (timedMode && totalQuestions < 10 && timeRemaining <= 0);

    setGameLost(isGameLost);
    updateScore({ score, gameType: "note-recognition" });
    setGameFinished(true);
  };

  // Handle pause game
  const handlePauseGame = () => {
    if (timedMode && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowPauseModal(true);
  };

  // Handle resume game
  const handleResumeGame = () => {
    setShowPauseModal(false);
    if (timedMode && timeRemaining > 0) {
      startTimer();
    }
  };

  // Handle open settings
  const handleOpenSettings = () => {
    setShowPauseModal(false);
    setShowSettingsModal(true);
  };

  // Handle close settings modal
  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
    if (timedMode && timeRemaining > 0 && gameStarted && !gameFinished) {
      startTimer();
    }
  };

  // Handle restart game
  const handleRestartGame = () => {
    setShowSettingsModal(false);
    setShowPauseModal(false);
    setGameLost(false);

    // Use the same startGame function for consistency
    startGame(clef, selectedNotes, timedMode, difficulty);
  };

  // Handle reset game
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setGameStarted(false);
    setGameFinished(false);
    setGameLost(false);
    setScore(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    setCurrentNote(null);
    setTimeRemaining(getTimeLimit(difficulty));
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Initialize the game with default settings if needed
  useEffect(() => {
    // If no notes are selected, set default notes
    if (selectedNotes.length === 0) {
      console.log("No notes selected, setting default notes");
      const defaultNotes =
        clef === "Treble"
          ? trebleNotes.slice(0, 3).map((note) => note.note)
          : bassNotes.slice(0, 3).map((note) => note.note);
      setSelectedNotes(defaultNotes);
    }
  }, [clef]);

  // Game screen component
  const GameScreen = () => (
    <div className="flex-1 flex flex-col items-center">
      {showFireworks && <Firework />}

      <div className="absolute top-1 right-2 flex gap-1">
        {timedMode && (
          <div
            className={`px-2 py-0.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg ${
              timeRemaining <= 10
                ? "text-red-500 animate-pulse font-bold"
                : "text-white"
            } text-sm`}
          >
            {formatTime(timeRemaining)}
          </div>
        )}
        <button
          onClick={handlePauseGame}
          className="p-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
        >
          <FaPause size={14} />
        </button>
      </div>

      <div className="text-center mb-1 mt-1">
        <p className="text-lg font-bold text-white">Score: {score}</p>
        <p className="text-xs text-white/80">
          Question {totalQuestions + 1}/10
        </p>
      </div>

      {/* Horizontal layout container - further optimized for height */}
      <div className="flex flex-row w-full justify-center items-center gap-4 px-2">
        {/* Note display on the left - further reduced size */}
        <div className="bg-white rounded-xl p-3 w-48 h-48 flex items-center justify-center">
          {currentNote && (
            <img
              src={currentNote.image}
              alt="Musical Note"
              className="max-w-full max-h-full"
            />
          )}
        </div>

        {/* Answer buttons on the right - more compact layout */}
        <div className="grid grid-cols-3 gap-2 max-w-xl">
          {(clef === "Treble" ? trebleNotes : bassNotes)
            .filter((note) => selectedNotes.includes(note.note))
            .map((note) => (
              <button
                key={note.note}
                onClick={() => handleAnswerSelect(note.note)}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                {note.note}
              </button>
            ))}
        </div>
      </div>
    </div>
  );

  // Pause modal component
  const PauseModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-purple-700 rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          Game Paused
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleResumeGame}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <FaPlay /> Resume Game
          </button>
          <button
            onClick={handleRestartGame}
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Restart Game
          </button>
          <button
            onClick={() => (window.location.href = "/note-recognition-mode")}
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Exit Game
          </button>
          <button
            onClick={handleOpenSettings}
            className="w-full px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );

  // Game Over Screen component
  const GameOverScreen = () => {
    const scorePercentage = (score / 100) * 100;
    const timeUsed = timedMode
      ? getTimeLimit(difficulty) - timeRemaining
      : null;
    const reason = totalQuestions < 10 ? "Time's up!" : "Score too low";

    return (
      <div className="relative w-full max-w-md mx-auto p-8 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm font-outfit animate-floatUp">
        <div className="text-center mt-2 space-y-4">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-orange-600 animate-shimmer bg-[length:200%_auto]">
            Game Over
          </h2>

          <div className="flex items-center justify-center gap-2 text-gray-600">
            <p className="text-lg">Final Score: {score}/100</p>
          </div>

          <div className="py-3 px-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100">
            <p className="text-red-700 font-semibold">{reason}</p>
            {totalQuestions < 10 && timedMode && (
              <p className="text-gray-600 text-sm mt-1">
                You answered {totalQuestions} out of 10 questions
              </p>
            )}
            {totalQuestions === 10 && (
              <p className="text-gray-600 text-sm mt-1">
                You need at least 50% correct answers to win
              </p>
            )}
          </div>

          {timedMode && timeUsed !== null && (
            <div className="text-gray-600">
              <p>
                Time used: {Math.floor(timeUsed / 60)}:
                {(timeUsed % 60).toString().padStart(2, "0")}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleRestartGame}
              className="flex-1 py-3 px-6 text-lg font-semibold text-white rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/note-recognition-mode")}
              className="flex-1 py-3 px-6 text-lg font-semibold text-gray-700 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
            >
              Exit
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="p-1">
        <BackButton
          to="/note-recognition-mode"
          name="Note Recognition"
          styling="text-white/80 hover:text-white text-sm"
        />
      </div>

      <div className="flex-1 flex flex-col">
        {!gameStarted ? (
          <GameSettings
            gameType="note-recognition"
            onStart={handleGameSettings}
            initialClef={clef}
            initialSelectedNotes={selectedNotes}
            initialTimedMode={timedMode}
            initialDifficulty={difficulty}
            trebleNotes={trebleNotes}
            bassNotes={bassNotes}
          />
        ) : gameFinished ? (
          gameLost ? (
            <GameOverScreen />
          ) : (
            <VictoryScreen
              score={score}
              totalPossibleScore={100}
              onReset={handleReset}
              timedMode={timedMode}
              timeRemaining={timeRemaining}
              initialTime={getTimeLimit(difficulty)}
            />
          )
        ) : (
          <GameScreen />
        )}
      </div>

      {showPauseModal && <PauseModal />}

      {showSettingsModal && (
        <GameSettings
          gameType="note-recognition"
          isModal={true}
          onStart={handleRestartGame}
          onCancel={handleCloseSettingsModal}
          initialClef={clef}
          initialSelectedNotes={selectedNotes}
          initialTimedMode={timedMode}
          initialDifficulty={difficulty}
          trebleNotes={trebleNotes}
          bassNotes={bassNotes}
          onChange={(settings) => {
            setClef(settings.clef);
            setSelectedNotes(settings.selectedNotes);
            setTimedMode(settings.timedMode);
            setDifficulty(settings.difficulty);
            setTimeRemaining(getTimeLimit(settings.difficulty));
          }}
        />
      )}
    </div>
  );
}
