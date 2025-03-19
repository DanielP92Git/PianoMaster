import React, { useState, useEffect } from "react";
import trebleClefImage from "../../../assets/noteImages/treble-clef.svg";
import bassClefImage from "../../../assets/noteImages/bass-clef.svg";

export function GameSettings({
  gameType = "note-recognition", // "note-recognition" or "memory"
  isModal = false,
  onStart,
  onCancel,
  onChange,
  initialClef = "Treble",
  initialSelectedNotes = [],
  initialTimedMode = false,
  initialDifficulty = "Medium",
  trebleNotes = [],
  bassNotes = [],
  noteOptions = [],
}) {
  const [setupStep, setSetupStep] = useState(1);
  const [clef, setClef] = useState(initialClef);

  // Ensure initialSelectedNotes is an array
  const initialNotesArray =
    Array.isArray(initialSelectedNotes) && initialSelectedNotes.length > 0
      ? initialSelectedNotes
      : clef === "Treble"
      ? trebleNotes.map((note) => note.note)
      : bassNotes.map((note) => note.note);

  const [selectedNotes, setSelectedNotes] = useState(initialNotesArray);

  // Update selected notes when clef changes to select all notes of the new clef
  useEffect(() => {
    if (clef === "Treble") {
      setSelectedNotes(trebleNotes.map((note) => note.note));
    } else {
      setSelectedNotes(bassNotes.map((note) => note.note));
    }
  }, [clef, trebleNotes, bassNotes]);

  const [timedMode, setTimedMode] = useState(initialTimedMode);
  // Ensure difficulty is properly capitalized
  const capitalizedInitialDifficulty =
    typeof initialDifficulty === "string"
      ? initialDifficulty.charAt(0).toUpperCase() +
        initialDifficulty.slice(1).toLowerCase()
      : "Medium";
  const [difficulty, setDifficulty] = useState(capitalizedInitialDifficulty);
  const [gridSize, setGridSize] = useState(
    gameType === "memory" ? "3 X 4" : null
  );

  // Memory game specific constants
  const GRID_SIZES = {
    "3 X 4": 12, // 3x4 grid = 12 cards (6 pairs)
    "3 X 6": 18, // 3x6 grid = 18 cards (9 pairs)
    "3 X 8": 24, // 3x8 grid = 24 cards (12 pairs)
  };

  const MEMORY_DIFFICULTIES = {
    Easy: "3 X 4", // 6 pairs
    Medium: "3 X 6", // 9 pairs
    Hard: "3 X 8", // 12 pairs
  };

  // Note recognition game specific constants
  const NOTE_RECOGNITION_TIME_LIMITS = {
    Easy: 60, // 60 seconds
    Medium: 45, // 45 seconds
    Hard: 30, // 30 seconds
  };

  // Add memory game time limits
  const MEMORY_GAME_TIME_LIMITS = {
    Easy: 90, // 90 seconds
    Medium: 75, // 75 seconds
    Hard: 60, // 60 seconds
  };

  // Update parent component when settings change
  useEffect(() => {
    if (onChange) {
      onChange({
        clef,
        selectedNotes,
        timedMode,
        difficulty,
        gridSize,
      });
    }
  }, [clef, selectedNotes, timedMode, difficulty, gridSize, onChange]);

  const handleNextStep = () => {
    setSetupStep(setupStep + 1);
  };

  const handlePrevStep = () => {
    setSetupStep(setupStep - 1);
  };

  const handleNoteToggle = (note) => {
    console.log("Toggling note:", note);

    setSelectedNotes((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];

      if (prevArray.includes(note)) {
        // Don't allow removing if it would result in fewer than 2 notes
        if (prevArray.length <= 2) {
          console.log("Cannot remove - minimum 2 notes required");
          return prevArray;
        }
        const newNotes = prevArray.filter((n) => n !== note);
        console.log("Removed note, new selection:", newNotes);
        return newNotes;
      } else {
        const newNotes = [...prevArray, note];
        console.log("Added note, new selection:", newNotes);
        return newNotes;
      }
    });
  };

  const handleMemoryDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setGridSize(MEMORY_DIFFICULTIES[newDifficulty]);
  };

  const handleStart = () => {
    // Ensure selectedNotes is an array and has at least one note
    const notesArray = Array.isArray(selectedNotes) ? selectedNotes : [];

    if (notesArray.length === 0) {
      console.error("No notes selected for the game");
      return;
    }

    console.log("Starting game with settings:", {
      clef,
      selectedNotes: notesArray,
      timedMode,
      difficulty,
      gridSize,
    });

    // Ensure difficulty is properly capitalized
    let capitalizedDifficulty = difficulty;
    if (typeof difficulty === "string") {
      capitalizedDifficulty =
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    }

    // Calculate the correct time limit based on difficulty and game type
    let timeLimit = 45; // Default Medium difficulty
    if (timedMode) {
      if (gameType === "note-recognition") {
        if (capitalizedDifficulty === "Easy") {
          timeLimit = 60;
        } else if (capitalizedDifficulty === "Medium") {
          timeLimit = 45;
        } else if (capitalizedDifficulty === "Hard") {
          timeLimit = 30;
        }
      } else if (gameType === "memory") {
        // For memory game
        if (capitalizedDifficulty === "Easy") {
          timeLimit = 90;
        } else if (capitalizedDifficulty === "Medium") {
          timeLimit = 75;
        } else if (capitalizedDifficulty === "Hard") {
          timeLimit = 60;
        }
      }
    }

    console.log("Setting time limit to:", timeLimit);

    // Call the onStart callback with the current settings
    onStart({
      clef,
      selectedNotes: notesArray,
      timedMode,
      difficulty: capitalizedDifficulty,
      gridSize,
      timeLimit: timeLimit, // Add the timeLimit property
    });
  };

  const displayNotes = clef === "Treble" ? trebleNotes : bassNotes;

  // Clef Selection Screen
  const ClefSelectionScreen = () => (
    <div className="flex flex-col items-center justify-center py-1">
      <h1 className="text-2xl font-bold text-white mb-2">
        {gameType === "note-recognition"
          ? "Note Recognition Game"
          : "Memory Game"}
      </h1>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md w-full mx-auto border border-white/20 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-3">
          Step 1: Choose a Clef
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setClef("Treble")}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                clef === "Treble"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              }`}
            >
              <div className="w-24 h-24 rounded-lg flex items-center justify-center p-2 mb-1">
                <img
                  src={trebleClefImage}
                  alt="Treble Clef"
                  className="w-full h-full object-contain invert"
                />
              </div>
              <span className="font-medium text-white/90">Treble Clef</span>
            </button>

            <button
              onClick={() => setClef("Bass")}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                clef === "Bass"
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              }`}
            >
              <div className="w-24 h-24 rounded-lg flex items-center justify-center p-2 mb-1">
                <img
                  src={bassClefImage}
                  alt="Bass Clef"
                  className="w-full h-full object-contain invert"
                />
              </div>
              <span className="font-medium text-white/90">Bass Clef</span>
            </button>
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Note Selection Screen
  const NoteSelectionScreen = () => {
    // Log current state for debugging
    console.log("Current state in note selection:", { clef, selectedNotes });

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-1">
        <h1 className="text-2xl font-bold text-white mb-2">
          {gameType === "note-recognition"
            ? "Note Recognition Game"
            : "Memory Game"}
        </h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md w-full mx-auto border border-white/20 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-3">
            Step 2: Choose Notes
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-white/80">
              Select which notes you want to practice with:
            </p>

            <div className="w-full overflow-x-auto">
              <div className="inline-flex gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-lg mb-1 border border-white/20">
                {displayNotes.map((note) => (
                  <button
                    key={note.note}
                    onClick={() => handleNoteToggle(note.note)}
                    className={`p-1 rounded-lg transition-colors flex flex-col items-center min-w-[50px] ${
                      selectedNotes.includes(note.note)
                        ? "bg-indigo-600 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <div className="w-10 h-10 bg-white/90 rounded-md flex items-center justify-center">
                      <img
                        src={note.image}
                        alt={note.note}
                        className="w-9 h-9 object-contain"
                      />
                    </div>
                    <span className="text-xs mt-1 font-medium">
                      {note.note}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-white/80">
              Selected: {selectedNotes.length} notes
            </p>

            <div className="flex justify-between mt-2">
              <button
                onClick={handlePrevStep}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/20 shadow-md"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={selectedNotes.length === 0}
                className={`px-3 py-1.5 ${
                  selectedNotes.length === 0
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white rounded-lg transition-colors font-medium shadow-md`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Game Mode Selection Screen for Note Recognition
  const NoteRecognitionModeScreen = () => {
    // Log current state for debugging
    console.log("Current state in mode screen:", {
      timedMode,
      difficulty,
      selectedNotes,
    });

    return (
      <div className="flex-1 flex flex-col items-center justify-center py-1">
        <h1 className="text-2xl font-bold text-white mb-2">
          Note Recognition Game
        </h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md w-full mx-auto border border-white/20 shadow-lg">
          <h2 className="text-lg font-bold text-white mb-3">
            Step 3: Choose Game Mode
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTimedMode(false)}
                className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                  !timedMode
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                }`}
              >
                <div className="w-16 h-16 bg-white/90 rounded-lg flex items-center justify-center p-2 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="font-medium">Practice Mode</span>
                <span className="text-xs text-white/80">No time limit</span>
              </button>

              <button
                onClick={() => setTimedMode(true)}
                className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                  timedMode
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                }`}
              >
                <div className="w-16 h-16 bg-white/90 rounded-lg flex items-center justify-center p-2 mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-indigo-600"
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
                </div>
                <span className="font-medium">Timed Mode</span>
                <span className="text-xs text-white/80">
                  Race against the clock
                </span>
              </button>
            </div>

            {timedMode && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-white mb-2">
                  Select Difficulty:
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDifficulty("Easy")}
                    className={`p-2 rounded-lg transition-colors ${
                      difficulty === "Easy" || difficulty === "easy"
                        ? "bg-green-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-center">
                      <span className="font-medium block">Easy</span>
                      <span className="text-xs">60 seconds</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDifficulty("Medium")}
                    className={`p-2 rounded-lg transition-colors ${
                      difficulty === "Medium" || difficulty === "medium"
                        ? "bg-yellow-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-center">
                      <span className="font-medium block">Medium</span>
                      <span className="text-xs">45 seconds</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setDifficulty("Hard")}
                    className={`p-2 rounded-lg transition-colors ${
                      difficulty === "Hard" || difficulty === "hard"
                        ? "bg-red-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    <div className="text-center">
                      <span className="font-medium block">Hard</span>
                      <span className="text-xs">30 seconds</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/20 shadow-md"
              >
                Back
              </button>
              <button
                onClick={handleStart}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Game Mode Selection Screen for Memory Game
  const MemoryGameModeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-1">
      <h1 className="text-2xl font-bold text-white mb-2">Memory Game</h1>
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md w-full mx-auto border border-white/20 shadow-lg">
        <h2 className="text-lg font-bold text-white mb-3">
          Step 3: Choose Game Mode
        </h2>
        <div className="space-y-4">
          {/* Game Mode Selection (Practice or Timed) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTimedMode(false)}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                !timedMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              }`}
            >
              <div className="w-16 h-16 bg-white/90 rounded-lg flex items-center justify-center p-2 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="font-medium">Practice Mode</span>
              <span className="text-xs text-white/80">No time limit</span>
            </button>

            <button
              onClick={() => setTimedMode(true)}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center ${
                timedMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
              }`}
            >
              <div className="w-16 h-16 bg-white/90 rounded-lg flex items-center justify-center p-2 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-indigo-600"
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
              </div>
              <span className="font-medium">Timed Mode</span>
              <span className="text-xs text-white/80">
                Race against the clock
              </span>
            </button>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Select Difficulty:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(MEMORY_DIFFICULTIES).map((diff) => (
                <button
                  key={diff}
                  onClick={() => handleMemoryDifficultyChange(diff)}
                  className={`p-2 rounded-lg transition-colors ${
                    difficulty === diff
                      ? diff === "Easy"
                        ? "bg-green-600 text-white"
                        : diff === "Medium"
                        ? "bg-yellow-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-white/10 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="text-center">
                    <span className="font-medium block">{diff}</span>
                    <span className="text-xs">
                      {GRID_SIZES[MEMORY_DIFFICULTIES[diff]] / 2} pairs
                      {timedMode && <br />}
                      {timedMode &&
                        (diff === "Easy"
                          ? "90 seconds"
                          : diff === "Medium"
                          ? "75 seconds"
                          : "60 seconds")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={handlePrevStep}
              className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors font-medium border border-white/20 shadow-md"
            >
              Back
            </button>
            <button
              onClick={handleStart}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // SettingsModal component for in-game settings
  const SettingsModal = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      ></div>
      <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-auto border border-white/20 shadow-lg z-10">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Game Settings</h2>

          {/* Clef Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Clef
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setClef("Treble")}
                className={`p-2 rounded-lg transition-colors ${
                  clef === "Treble"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                Treble Clef
              </button>
              <button
                onClick={() => setClef("Bass")}
                className={`p-2 rounded-lg transition-colors ${
                  clef === "Bass"
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                Bass Clef
              </button>
            </div>
          </div>

          {/* Note Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Notes
            </label>
            <div className="w-full overflow-x-auto">
              <div className="inline-flex gap-1 p-1 bg-white/10 backdrop-blur-sm rounded-lg mb-1 border border-white/20">
                {/* Display notes based on clef selection */}
                {(clef === "Treble" ? trebleNotes : bassNotes).map((note) => (
                  <button
                    key={note.note}
                    onClick={() => handleNoteToggle(note.note)}
                    className={`p-1 rounded-lg transition-colors flex flex-col items-center min-w-[50px] ${
                      selectedNotes.includes(note.note)
                        ? "bg-indigo-600 text-white"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}
                  >
                    <div className="w-10 h-10 bg-white/90 rounded-md flex items-center justify-center">
                      <img
                        src={note.image}
                        alt={note.note}
                        className="w-9 h-9 object-contain"
                      />
                    </div>
                    <span className="text-xs mt-1 font-medium">
                      {note.note}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-sm text-white/80">
              Selected: {selectedNotes.length} notes
            </p>
          </div>

          {/* Game mode for Note Recognition */}
          {gameType === "note-recognition" && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Game Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTimedMode(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      !timedMode
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    Practice Mode
                  </button>
                  <button
                    onClick={() => setTimedMode(true)}
                    className={`p-2 rounded-lg transition-colors ${
                      timedMode
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    Timed Mode
                  </button>
                </div>
              </div>

              {timedMode && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDifficulty("Easy")}
                      className={`p-2 rounded-lg transition-colors ${
                        difficulty === "Easy" || difficulty === "easy"
                          ? "bg-green-600 text-white"
                          : "bg-white/10 text-white/90 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-medium block">Easy</span>
                        <span className="text-xs">60 seconds</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setDifficulty("Medium")}
                      className={`p-2 rounded-lg transition-colors ${
                        difficulty === "Medium" || difficulty === "medium"
                          ? "bg-yellow-600 text-white"
                          : "bg-white/10 text-white/90 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-medium block">Medium</span>
                        <span className="text-xs">45 seconds</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setDifficulty("Hard")}
                      className={`p-2 rounded-lg transition-colors ${
                        difficulty === "Hard" || difficulty === "hard"
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-white/90 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-medium block">Hard</span>
                        <span className="text-xs">30 seconds</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {gameType === "memory" && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => handleMemoryDifficultyChange(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(MEMORY_DIFFICULTIES).map((diff) => (
                  <option key={diff} value={diff} className="bg-gray-800">
                    {diff} ({GRID_SIZES[MEMORY_DIFFICULTIES[diff]] / 2} pairs)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Resume
            </button>
            <button
              onClick={handleStart}
              className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Restart Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the appropriate screen based on the current step
  const renderScreen = () => {
    if (isModal) {
      return <SettingsModal />;
    }

    if (gameType === "note-recognition") {
      switch (setupStep) {
        case 1:
          return <ClefSelectionScreen />;
        case 2:
          return <NoteSelectionScreen />;
        case 3:
          return <NoteRecognitionModeScreen />;
        default:
          return <ClefSelectionScreen />;
      }
    } else if (gameType === "memory") {
      switch (setupStep) {
        case 1:
          return <ClefSelectionScreen />;
        case 2:
          return <NoteSelectionScreen />;
        case 3:
          return <MemoryGameModeScreen />;
        default:
          return <ClefSelectionScreen />;
      }
    }
  };

  return (
    <div className={`flex flex-col ${isModal ? "h-full" : ""} text-white p-4`}>
      {renderScreen()}
    </div>
  );
}
