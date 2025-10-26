import React, { useState, useEffect, useRef } from "react";
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
  // Ref to track if we're in the middle of an update from props
  const isUpdatingFromProps = useRef(false);
  // Ref to skip the first render for onChange
  const isFirstRender = useRef(true);
  // Ref to track previous initialTimedMode to avoid unnecessary updates
  const prevInitialTimedMode = useRef(initialTimedMode);

  const [setupStep, setSetupStep] = useState(1);
  const [modalStep, setModalStep] = useState(1);
  const [clef, setClef] = useState(initialClef);
  const [timedMode, setTimedMode] = useState(initialTimedMode);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [timeDifficulty, setTimeDifficulty] = useState(initialDifficulty);
  const [gridSize, setGridSize] = useState(
    gameType === "memory" ? "3 X 4" : null
  );

  // Track when modal is opened to reset step
  const prevIsModalRef = useRef(false);

  useEffect(() => {
    // Reset modal step when modal is opened (not on every render)
    if (isModal && !prevIsModalRef.current) {
      setModalStep(1);
    }
    prevIsModalRef.current = isModal;
  }, [isModal]);
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

  // Update internal state ONLY when initialTimedMode prop changes from parent
  useEffect(() => {
    // Only update if the value actually changed to prevent loops
    if (prevInitialTimedMode.current !== initialTimedMode) {
      // Mark that we're updating from props so we don't trigger the onChange effect
      isUpdatingFromProps.current = true;

      // Update state with new value from props
      setTimedMode(initialTimedMode);

      // Update our ref for the next comparison
      prevInitialTimedMode.current = initialTimedMode;
    }
  }, [initialTimedMode]);

  // Call onChange when internal state changes, but not on first render and not when updating from props
  useEffect(() => {
    // Skip the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if we're currently updating from props
    if (isUpdatingFromProps.current) {
      isUpdatingFromProps.current = false; // Reset for next time
      return;
    }

    // Only call onChange if it exists and we're not updating from props
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

  const handleNextStep = () => {
    setSetupStep(setupStep + 1);
  };

  const handlePrevStep = () => {
    setSetupStep(setupStep - 1);
  };

  const handleModalNextStep = () => {
    setModalStep(modalStep + 1);
  };

  const handleModalPrevStep = () => {
    setModalStep(modalStep - 1);
  };

  const handleNoteToggle = (note) => {
    setSelectedNotes((prev) => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];

      if (prevArray.includes(note)) {
        // Don't allow removing if it would result in fewer than 2 notes
        if (prevArray.length <= 2) {
          return prevArray;
        }
        const newNotes = prevArray.filter((n) => n !== note);

        return newNotes;
      } else {
        const newNotes = [...prevArray, note];

        return newNotes;
      }
    });
  };

  const handleMemoryDifficultyChange = (newDifficulty) => {
    // Update difficulty for grid size only
    setDifficulty(newDifficulty);

    // Also update the grid size based on the new difficulty
    const newGridSize = MEMORY_DIFFICULTIES[newDifficulty];

    setGridSize(newGridSize);
  };

  const handleTimeMemoryDifficultyChange = (newTimeDifficulty) => {
    // Update time difficulty only
    setTimeDifficulty(newTimeDifficulty);
  };

  const handleTimedModeToggle = (newMode) => {
    // Only update if the value is actually changing
    if (timedMode !== newMode) {
      // Update state directly - the useEffect will handle notifying the parent
      setTimedMode(newMode);
      // We don't need to call onChange here as the useEffect will handle it
    }
  };

  const handleStart = () => {
    // Ensure selectedNotes is an array and has at least one note
    const notesArray = Array.isArray(selectedNotes) ? selectedNotes : [];

    if (notesArray.length === 0) {
      console.error("No notes selected for the game");
      return;
    }

    // Convert timedMode to boolean explicitly
    const isTimedMode = timedMode;

    // Calculate the correct time limit based on difficulty and game type
    let timeLimit = 45; // Default Medium difficulty
    if (isTimedMode) {
      if (gameType === "note-recognition") {
        timeLimit = NOTE_RECOGNITION_TIME_LIMITS[difficulty] || 45;
      } else if (gameType === "memory") {
        // Use timeDifficulty instead of difficulty for memory game time limits
        timeLimit = MEMORY_GAME_TIME_LIMITS[timeDifficulty] || 75;
      }
    }

    // For memory game, ensure gridSize matches the selected difficulty
    let gridSizeToSend = gridSize;
    if (gameType === "memory") {
      gridSizeToSend = MEMORY_DIFFICULTIES[difficulty];
    }

    // Call the onStart callback with the current settings
    onStart({
      clef,
      selectedNotes: notesArray,
      timedMode: isTimedMode,
      difficulty: difficulty, // Card count difficulty
      timeDifficulty: timeDifficulty, // Time difficulty
      gridSize: gridSizeToSend,
      timeLimit,
    });
  };

  // For bass clef, display notes starting with דו then descending: דו, סי, לה, סול, פה, מי, רה
  const displayNotes =
    clef === "Treble"
      ? trebleNotes
      : bassNotes.length > 0
        ? [
            bassNotes.find((note) => note.note === "דו"),
            ...bassNotes.filter((note) => note.note !== "דו").reverse(),
          ].filter(Boolean)
        : bassNotes;

  // Clef Selection Screen
  const ClefSelectionScreen = () => (
    <div className="flex-1 flex items-center justify-center overflow-hidden px-2 py-1">
      <div
        className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
        style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
      >
        {/* Settings Container */}
        <div className="flex-1 flex items-center overflow-hidden">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 w-full border border-white/20 shadow-lg h-full flex flex-col">
            <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
              Step 1: Choose a Clef
            </h2>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => setClef("Treble")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex flex-col items-center ${
                    clef === "Treble"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center p-2 mb-1">
                    <img
                      src={trebleClefImage}
                      alt="Treble Clef"
                      className="w-full h-full object-contain invert"
                    />
                  </div>
                  <span className="font-medium text-white/90 text-xs sm:text-sm">
                    Treble Clef
                  </span>
                </button>

                <button
                  onClick={() => setClef("Bass")}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex flex-col items-center ${
                    clef === "Bass"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center p-2 mb-1">
                    <img
                      src={bassClefImage}
                      alt="Bass Clef"
                      className="w-full h-full object-contain invert"
                    />
                  </div>
                  <span className="font-medium text-white/90 text-xs sm:text-sm">
                    Bass Clef
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Container - On the Right */}
        <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
          <button
            onClick={handleNextStep}
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  // Note Selection Screen
  const NoteSelectionScreen = () => {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden px-3 py-2">
        <div className="flex lg:flex-row gap-4 w-full max-w-5xl items-center lg:items-stretch h-[calc(100vh-600px)]">
          {/* Settings Container (Left/Top) */}
          <div className="flex-1 h-full overflow-y-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full border border-white/20 shadow-lg h-full flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-white mb-2 flex-shrink-0">
                Step 2: Choose Notes
              </h2>
              <div className="flex flex-col flex-1 min-h-0">
                <p className="text-sm text-white/80 flex-shrink-0 mb-2">
                  Select which notes you want to practice with:
                </p>

                <div className="w-full overflow-hidden px-2 sm:px-3 flex-1 md:flex-none md:h-[280px] flex items-center">
                  <div className="flex h-full gap-1 sm:gap-2 p-2 sm:p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 justify-center items-center w-full">
                    {displayNotes.map((note) => (
                      <button
                        key={note.note}
                        onClick={() => handleNoteToggle(note.note)}
                        className={` rounded-lg transition-colors flex flex-col items-center justify-between flex-1 h-full min-w-0 ${
                          selectedNotes.includes(note.note)
                            ? "bg-indigo-600 text-white"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                        style={{
                          maxWidth: "150px",
                        }}
                      >
                        <div className="w-full flex-1 bg-white rounded-md flex items-center justify-center mb-1">
                          {note.ImageComponent && (
                            <note.ImageComponent
                              className="w-[85%] h-[85%] object-contain"
                              aria-label={note.note}
                            />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center flex-shrink-0">
                          {note.note}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-white/80 flex-shrink-0 mt-2">
                  Selected: {selectedNotes.length} notes
                </p>
              </div>
            </div>
          </div>

          {/* Buttons Container (Right/Bottom) */}
          <div className="flex flex-col lg:flex-col gap-6 justify-center lg:justify-center">
            <button
              onClick={handlePrevStep}
              className="px-6 py-3 min-w-[120px] lg:min-w-[140px] text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              disabled={selectedNotes.length === 0}
              className={`px-6 py-3 min-w-[120px] lg:min-w-[140px] text-base ${
                selectedNotes.length === 0
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white rounded-lg transition-colors font-medium shadow-lg`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Game Mode Selection Screen for Note Recognition
  const NoteRecognitionModeScreen = () => {
    return (
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2 py-1">
        <div className="flex flex-row gap-3 w-full max-w-5xl items-stretch h-[calc(100vh-100px)] max-h-[600px]">
          {/* Settings Container */}
          <div className="flex-1 flex items-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 w-full border border-white/20 shadow-lg">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-3 text-center">
                Step 3: Choose Game Mode
              </h2>
              <div className="space-y-3">
                {/* Game Mode Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTimedModeToggle(false)}
                    className={`p-2 rounded-lg transition-colors flex flex-col items-center ${
                      !timedMode
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-lg flex items-center justify-center p-1 mb-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600"
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
                    <span className="text-xs sm:text-sm font-medium">
                      Practice Mode
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/80">
                      No time limit
                    </span>
                  </button>

                  <button
                    onClick={() => handleTimedModeToggle(true)}
                    className={`p-2 rounded-lg transition-colors flex flex-col items-center ${
                      timedMode
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 rounded-lg flex items-center justify-center p-1 mb-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600"
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
                    <span className="text-xs sm:text-sm font-medium">
                      Timed Mode
                    </span>
                    <span className="text-[10px] sm:text-xs text-white/80">
                      Race against the clock
                    </span>
                  </button>
                </div>

                {/* Difficulty Selection - only show if timed mode is active */}
                {timedMode && (
                  <div>
                    <label className="block text-xs sm:text-sm text-white/80 font-medium mb-1">
                      Select Difficulty:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Easy", "Medium", "Hard"].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={`py-1.5 px-2 rounded-lg transition-colors text-xs sm:text-sm ${
                            difficulty === level
                              ? level === "Easy"
                                ? "bg-emerald-500 text-white"
                                : level === "Medium"
                                  ? "bg-amber-500 text-white"
                                  : "bg-rose-500 text-white"
                              : "bg-white/10 text-white/90 hover:bg-white/20"
                          }`}
                        >
                          <div className="text-center">
                            <span className="font-medium block">{level}</span>
                            <span className="text-[10px] sm:text-xs">
                              {level === "Easy"
                                ? "60s"
                                : level === "Medium"
                                  ? "45s"
                                  : "30s"}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Buttons Container - On the Right */}
          <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
            <button
              onClick={handlePrevStep}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
            >
              Back
            </button>
            <button
              onClick={handleStart}
              className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Game Mode Selection Screen for Memory Game
  const MemoryGameModeScreen = () => (
    <div className="flex-1 flex items-center justify-center overflow-hidden px-2 py-1">
      <div
        className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
        style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
      >
        {/* Settings Container */}
        <div className="flex-1 flex items-center overflow-hidden">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 w-full border border-white/20 shadow-lg h-full flex flex-col">
            <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
              Step 3: Choose Game Settings
            </h2>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {/* Game Mode Selection (Practice or Timed) */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={() => setTimedMode(false)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex flex-col items-center ${
                    !timedMode
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-lg flex items-center justify-center p-1 mb-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600"
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
                  <span className="text-[10px] sm:text-xs font-medium">
                    Practice Mode
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-white/80">
                    No time limit
                  </span>
                </button>

                <button
                  onClick={() => setTimedMode(true)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors flex flex-col items-center ${
                    timedMode
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 rounded-lg flex items-center justify-center p-1 mb-0.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600"
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
                  <span className="text-[10px] sm:text-xs font-medium">
                    Timed Mode
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-white/80">
                    Race against the clock
                  </span>
                </button>
              </div>

              {/* Card Count / Difficulty Level */}
              <div className="flex-shrink-0">
                <label className="text-[10px] sm:text-xs text-white/80 font-medium block mb-0.5">
                  Card Count:
                </label>
                <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                  {Object.entries(MEMORY_DIFFICULTIES).map(([diff, size]) => (
                    <button
                      key={diff}
                      onClick={() => {
                        handleMemoryDifficultyChange(diff);
                      }}
                      className={`py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-lg transition-colors text-xs ${
                        difficulty === diff
                          ? diff === "Easy"
                            ? "bg-teal-500 text-white"
                            : diff === "Medium"
                              ? "bg-orange-500 text-white"
                              : "bg-red-500 text-white"
                          : "bg-white/10 text-white/90 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-center">
                        <span className="font-medium block text-[10px] sm:text-xs">
                          {diff}
                        </span>
                        <span className="text-[9px] sm:text-[10px] block">
                          {GRID_SIZES[size] / 2} pairs
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Difficulty Selection - only show if timed mode is active */}
              {timedMode && (
                <div className="flex-shrink-0">
                  <label className="text-[10px] sm:text-xs text-white/80 font-medium block mb-0.5">
                    Time Difficulty:
                  </label>
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                    {["Easy", "Medium", "Hard"].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleTimeMemoryDifficultyChange(level)}
                        className={`py-0.5 sm:py-1 px-1 sm:px-1.5 rounded-lg transition-colors text-xs ${
                          timeDifficulty === level
                            ? level === "Easy"
                              ? "bg-emerald-500 text-white"
                              : level === "Medium"
                                ? "bg-amber-500 text-white"
                                : "bg-rose-500 text-white"
                            : "bg-white/10 text-white/90 hover:bg-white/20"
                        }`}
                      >
                        <div className="text-center">
                          <span className="font-medium block text-[10px] sm:text-xs">
                            {level}
                          </span>
                          <span className="text-[9px] sm:text-[10px] block">
                            {level === "Easy"
                              ? "90s"
                              : level === "Medium"
                                ? "75s"
                                : "60s"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons Container - On the Right */}
        <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
          <button
            onClick={handlePrevStep}
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
          >
            Back
          </button>
          <button
            onClick={handleStart}
            className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile Modal Step Components
  const MobileModalClefStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-base sm:text-lg font-bold text-white mb-3 flex-shrink-0">
        Step 1 of 3: Choose Clef
      </h2>
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => setClef("Treble")}
            className={`p-4 rounded-lg transition-colors flex flex-col items-center ${
              clef === "Treble"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <div className="w-24 h-24 flex items-center justify-center mb-2">
              <img
                src={trebleClefImage}
                alt="Treble Clef"
                className="w-full h-full object-contain invert"
              />
            </div>
            <span className="text-sm font-medium">Treble Clef</span>
          </button>
          <button
            onClick={() => setClef("Bass")}
            className={`p-4 rounded-lg transition-colors flex flex-col items-center ${
              clef === "Bass"
                ? "bg-indigo-600 text-white"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <div className="w-24 h-24 flex items-center justify-center mb-2">
              <img
                src={bassClefImage}
                alt="Bass Clef"
                className="w-full h-full object-contain invert"
              />
            </div>
            <span className="text-sm font-medium">Bass Clef</span>
          </button>
        </div>
      </div>
      <div className="flex justify-end mt-4 flex-shrink-0">
        <button
          onClick={handleModalNextStep}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  const MobileModalNoteStep = () => (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <h2 className="text-base sm:text-lg font-bold text-white mb-2">
          Step 2 of 3: Choose Notes
        </h2>
        <p className="text-sm text-white/80 mb-3">
          Select which notes you want to practice with:
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
        <div
          className="w-full overflow-x-auto overflow-y-hidden pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:bg-indigo-600 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4F46E5 #1F2937",
          }}
        >
          <div className="flex gap-1.5 p-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 justify-start">
            {(() => {
              const notes =
                clef === "Treble"
                  ? trebleNotes
                  : bassNotes.length > 0
                    ? [
                        bassNotes.find((note) => note.note === "דו"),
                        ...bassNotes
                          .filter((note) => note.note !== "דו")
                          .reverse(),
                      ].filter(Boolean)
                    : bassNotes;
              return notes.map((note) => (
                <button
                  key={note.note}
                  onClick={() => handleNoteToggle(note.note)}
                  className={`p-1 rounded-lg transition-colors flex flex-col items-center flex-shrink-0 ${
                    selectedNotes.includes(note.note)
                      ? "bg-indigo-600 text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  style={{
                    width: "70px",
                    minWidth: "70px",
                  }}
                >
                  <div className="w-full aspect-square bg-white/90 rounded flex items-center justify-center p-0.5">
                    {note.ImageComponent && (
                      <note.ImageComponent
                        className="w-full h-full object-contain"
                        aria-label={note.note}
                      />
                    )}
                  </div>
                  <span className="text-[10px] mt-0.5 font-medium truncate w-full text-center">
                    {note.note}
                  </span>
                </button>
              ));
            })()}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0">
        <p className="text-sm text-white/80 mb-3">
          Selected: {selectedNotes.length} notes
        </p>
        <div className="flex justify-between gap-3">
          <button
            onClick={handleModalPrevStep}
            className="px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleModalNextStep}
            disabled={selectedNotes.length === 0}
            className={`px-4 py-2 text-sm font-medium ${
              selectedNotes.length === 0
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white rounded-lg transition-colors`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );

  const MobileModalGameSettingsStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-bold text-white mb-2 flex-shrink-0">
        Step 3 of 3: Game Settings
      </h2>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
        {/* Game Mode */}
        <div>
          <label className="block text-xs font-medium text-white/80 mb-1">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleTimedModeToggle(false)}
              className={`p-2 rounded-lg transition-colors text-xs ${
                !timedMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
            >
              Practice Mode
            </button>
            <button
              onClick={() => handleTimedModeToggle(true)}
              className={`p-2 rounded-lg transition-colors text-xs ${
                timedMode
                  ? "bg-indigo-600 text-white"
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
            >
              Timed Mode
            </button>
          </div>
        </div>

        {/* Difficulty/Card Count */}
        {gameType === "note-recognition" ? (
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-1.5 rounded-lg transition-colors text-xs ${
                    difficulty === level
                      ? level === "Easy"
                        ? "bg-emerald-500 text-white"
                        : level === "Medium"
                          ? "bg-amber-500 text-white"
                          : "bg-rose-500 text-white"
                      : "bg-white/10 text-white/90 hover:bg-white/20"
                  }`}
                >
                  <div className="text-center">
                    <span className="font-medium block text-[10px]">
                      {level}
                    </span>
                    <span className="text-[9px]">
                      {level === "Easy"
                        ? "60s"
                        : level === "Medium"
                          ? "45s"
                          : "30s"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">
                Card Count
              </label>
              <select
                value={difficulty}
                onChange={(e) => handleMemoryDifficultyChange(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(MEMORY_DIFFICULTIES).map((diff) => (
                  <option key={diff} value={diff} className="bg-gray-800">
                    {diff} ({GRID_SIZES[MEMORY_DIFFICULTIES[diff]] / 2} pairs)
                  </option>
                ))}
              </select>
            </div>

            {timedMode && (
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Time Difficulty
                </label>
                <select
                  value={timeDifficulty}
                  onChange={(e) =>
                    handleTimeMemoryDifficultyChange(e.target.value)
                  }
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.keys(MEMORY_GAME_TIME_LIMITS).map((diff) => (
                    <option key={diff} value={diff} className="bg-gray-800">
                      {diff} ({MEMORY_GAME_TIME_LIMITS[diff]} seconds)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-3 flex-shrink-0">
        <button
          onClick={handleStart}
          className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Restart Game
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleModalPrevStep}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );

  // Desktop Modal (original single-page design)
  const DesktopModal = () => (
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
        <div className="w-full overflow-hidden px-2 sm:px-3">
          <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-white/10 backdrop-blur-sm rounded-lg mb-1 border border-white/20 justify-center">
            {/* Display notes based on clef selection */}
            {(() => {
              const notes =
                clef === "Treble"
                  ? trebleNotes
                  : bassNotes.length > 0
                    ? [
                        bassNotes.find((note) => note.note === "דו"),
                        ...bassNotes
                          .filter((note) => note.note !== "דו")
                          .reverse(),
                      ].filter(Boolean)
                    : bassNotes;
              return notes.map((note) => (
                <button
                  key={note.note}
                  onClick={() => handleNoteToggle(note.note)}
                  className={`p-0.5 sm:p-1 rounded-lg transition-colors flex flex-col items-center flex-shrink-0 ${
                    selectedNotes.includes(note.note)
                      ? "bg-indigo-600 text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  style={{
                    width: `calc((100% - ${(notes.length - 1) * 2}px) / ${notes.length})`,
                    maxWidth: "60px",
                  }}
                >
                  <div className="w-full aspect-square bg-white/90 rounded-md flex items-center justify-center">
                    {note.ImageComponent && (
                      <note.ImageComponent
                        className="w-[85%] h-[85%] object-contain"
                        aria-label={note.note}
                      />
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-0.5 font-medium truncate w-full text-center">
                    {note.note}
                  </span>
                </button>
              ));
            })()}
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
                onClick={() => handleTimedModeToggle(false)}
                className={`p-2 rounded-lg transition-colors ${
                  !timedMode
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => handleTimedModeToggle(true)}
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

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDifficulty("Easy")}
                className={`p-2 rounded-lg transition-colors ${
                  difficulty === "Easy" || difficulty === "easy"
                    ? "bg-emerald-500 text-white"
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
                    ? "bg-amber-500 text-white"
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
                    ? "bg-rose-500 text-white"
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
        </>
      )}

      {/* Memory Game Settings in Modal */}
      {gameType === "memory" && (
        <>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Game Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTimedModeToggle(false)}
                className={`p-2 rounded-lg transition-colors ${
                  !timedMode
                    ? "bg-indigo-600 text-white"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                Practice Mode
              </button>
              <button
                onClick={() => handleTimedModeToggle(true)}
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

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Card Count
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
            <div className="flex gap-1 mt-1">
              <div className="h-1.5 w-4 rounded-full bg-teal-500"></div>
              <div className="h-1.5 w-4 rounded-full bg-orange-500"></div>
              <div className="h-1.5 w-4 rounded-full bg-red-500"></div>
            </div>
          </div>

          {timedMode && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Time Difficulty
              </label>
              <select
                value={timeDifficulty}
                onChange={(e) =>
                  handleTimeMemoryDifficultyChange(e.target.value)
                }
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.keys(MEMORY_GAME_TIME_LIMITS).map((diff) => (
                  <option key={diff} value={diff} className="bg-gray-800">
                    {diff} ({MEMORY_GAME_TIME_LIMITS[diff]} seconds)
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
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
  );

  // Main SettingsModal component that switches between mobile and desktop
  const SettingsModal = () => {
    // Detect mobile based on screen height (important for landscape mode)
    // Mobile devices in landscape typically have height < 500px
    const checkIsMobile = () => {
      if (typeof window === "undefined") return false;
      const height = window.innerHeight;
      const width = window.innerWidth;
      // Use height as primary indicator for landscape mobile devices
      // Also check if it's a touch device
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      return height < 500 || (isTouchDevice && width < 1024);
    };

    const [isMobile, setIsMobile] = useState(checkIsMobile());

    useEffect(() => {
      const handleResize = () => {
        const newIsMobile = checkIsMobile();
        setIsMobile(newIsMobile);
      };
      window.addEventListener("resize", handleResize);

      return () => window.removeEventListener("resize", handleResize);
    }, [isMobile]);

    const renderMobileModalStep = () => {
      switch (modalStep) {
        case 1:
          return <MobileModalClefStep />;
        case 2:
          return <MobileModalNoteStep />;
        case 3:
          return <MobileModalGameSettingsStep />;
        default:
          return <MobileModalClefStep />;
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        ></div>
        <div
          className={`bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-xl ${
            isMobile ? "p-4 h-[80vh] overflow-y-auto" : "p-6"
          } ${isMobile ? "max-w-2xl" : "max-w-md"} w-full mx-auto border border-white/20 shadow-lg z-10`}
        >
          {isMobile ? renderMobileModalStep() : <DesktopModal />}
        </div>
      </div>
    );
  };

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

    return null;
  };

  return (
    <div
      className={`flex flex-col ${isModal ? "h-full" : "flex-1 min-h-0"} text-white`}
    >
      {renderScreen()}
    </div>
  );
}
