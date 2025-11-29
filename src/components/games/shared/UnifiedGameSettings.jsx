import React, { useState, useEffect, useRef } from "react";
import BackButton from "../../ui/BackButton";
import trebleClefImage from "../../../assets/noteImages/treble-clef.svg";
import bassClefImage from "../../../assets/noteImages/bass-clef.svg";

/**
 * Unified Game Settings Component
 * A flexible, configuration-driven pre-game settings screen for all games
 *
 * @param {Object} props
 * @param {string} props.gameType - Type of game ('sight-reading', 'note-recognition', 'memory', 'rhythm')
 * @param {Array} props.steps - Array of step configurations
 * @param {Object} props.initialSettings - Initial settings values
 * @param {Function} props.onStart - Callback when start button is clicked
 * @param {string} props.backRoute - Route to navigate back to
 * @param {Object} props.noteData - Object containing trebleNotes and bassNotes arrays with ImageComponent
 * @param {boolean} props.isModal - Whether to render as a modal overlay
 * @param {Function} props.onCancel - Callback when cancel button is clicked (modal mode only)
 */
export function UnifiedGameSettings({
  gameType = "sight-reading",
  steps = [],
  initialSettings = {},
  onStart,
  backRoute = "/practice-modes",
  noteData = { trebleNotes: [], bassNotes: [] },
  isModal = false,
  onCancel,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStart = () => {
    onStart(settings);
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Get current step configuration
  const currentStepConfig = steps[currentStep - 1];

  // Render the appropriate step component based on configuration
  const renderStepComponent = () => {
    if (!currentStepConfig) return null;

    const { component, config = {} } = currentStepConfig;

    switch (component) {
      case "ClefSelection":
        return (
          <ClefSelection
            settings={settings}
            updateSetting={updateSetting}
            noteData={noteData}
          />
        );

      case "NoteSelection":
        return (
          <NoteSelection
            settings={settings}
            updateSetting={updateSetting}
            noteData={noteData}
            config={config}
          />
        );

      case "DifficultySelection":
        return (
          <DifficultySelection
            settings={settings}
            updateSetting={updateSetting}
            config={config}
          />
        );

      case "TimeSignatureSelection":
        return (
          <TimeSignatureSelection
            settings={settings}
            updateSetting={updateSetting}
            config={config}
          />
        );

      case "TempoSelection":
        return (
          <TempoSelection
            settings={settings}
            updateSetting={updateSetting}
            config={config}
          />
        );

      case "TimedModeSelection":
        return (
          <TimedModeSelection
            settings={settings}
            updateSetting={updateSetting}
            config={config}
          />
        );

      case "GridSizeSelection":
        return (
          <GridSizeSelection
            settings={settings}
            updateSetting={updateSetting}
            config={config}
          />
        );

      default:
        return (
          <div className="text-white">Unknown step component: {component}</div>
        );
    }
  };

  // Validation for current step
  const isStepValid = () => {
    if (!currentStepConfig) return true;

    const { component, config = {} } = currentStepConfig;

    if (component === "NoteSelection") {
      const minNotes = config.minNotes || 2;
      return (
        settings.selectedNotes && settings.selectedNotes.length >= minNotes
      );
    }

    return true;
  };

  // Render modal overlay if isModal is true
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <div className="flex flex-row gap-3 w-full items-stretch h-full">
              {/* Settings Container */}
              <div className="flex-1 flex items-center overflow-hidden">
                <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
                  <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
                    Step {currentStep} of {steps.length}:{" "}
                    {currentStepConfig?.title || ""}
                  </h2>
                  <div className="flex-1 flex flex-col justify-center overflow-hidden">
                    {renderStepComponent()}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
                  >
                    Cancel
                  </button>
                )}
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
                  >
                    Back
                  </button>
                )}
                {currentStep < steps.length ? (
                  <button
                    onClick={handleNextStep}
                    disabled={!isStepValid()}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={!isStepValid()}
                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Game
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular full-screen mode
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white">
      <div className="p-2 flex-shrink-0">
        <BackButton
          to={backRoute}
          name={
            backRoute.includes("notes-master")
              ? "Notes Master"
              : backRoute.includes("rhythm")
                ? "Rhythm Mode"
                : "Game Modes"
          }
          styling="text-white/80 hover:text-white text-sm"
        />
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden px-2 py-1">
        <div
          className="flex flex-row gap-3 w-full max-w-5xl items-stretch"
          style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
        >
          {/* Settings Container */}
          <div className="flex-1 flex items-center overflow-hidden">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
              <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
                Step {currentStep} of {steps.length}:{" "}
                {currentStepConfig?.title || ""}
              </h2>
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                {renderStepComponent()}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-3 justify-center min-w-[160px] sm:min-w-[180px]">
            {currentStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
              >
                Back
              </button>
            )}
            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                disabled={!isStepValid()}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={!isStepValid()}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Game
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Component: Clef Selection
function ClefSelection({ settings, updateSetting, noteData }) {
  const handleClefChange = (clef) => {
    updateSetting("clef", clef);
    // Auto-select default notes when clef changes
    if (clef === "Treble") {
      // Pre-select C4, D4, E4 for treble clef
      updateSetting("selectedNotes", ["C4", "D4", "E4"]);
    } else {
      // Pre-select C4, B3, A3 for bass clef
      updateSetting("selectedNotes", ["C4", "B3", "A3"]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {["Treble", "Bass"].map((clef) => (
          <button
            key={clef}
            onClick={() => handleClefChange(clef)}
            className={`p-4 sm:p-6 rounded-lg transition-colors ${
              settings.clef === clef
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={clef === "Treble" ? trebleClefImage : bassClefImage}
                alt={`${clef} Clef`}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                style={{
                  filter:
                    settings.clef === clef
                      ? "brightness(0) invert(1)"
                      : "brightness(0) invert(0.9)",
                }}
              />
              <div className="font-semibold text-sm sm:text-base">{clef}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step Component: Note Selection
function NoteSelection({ settings, updateSetting, noteData, config }) {
  const { showImages = false, minNotes = 2 } = config;
  const notes =
    settings.clef === "Treble" ? noteData.trebleNotes : noteData.bassNotes;
  const scrollContainerRef = useRef(null);
  const hasScrolledToC4Ref = useRef(false);

  // Scroll to C4 when bass clef is selected
  useEffect(() => {
    if (
      settings.clef === "Bass" &&
      scrollContainerRef.current &&
      !hasScrolledToC4Ref.current
    ) {
      // Find the index of C4 in the notes array
      const c4Index = notes.findIndex((note) => note.pitch === "C4");
      if (c4Index !== -1) {
        // Wait for next frame to ensure DOM is ready
        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          if (container) {
            // Calculate scroll position: each card is 110px wide + 8px gap (0.5rem = 8px)
            const cardWidth = 110;
            const gap = 8;
            const scrollPosition =
              c4Index * (cardWidth + gap) -
              container.offsetWidth / 2 +
              cardWidth / 2;
            container.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: "smooth",
            });
            hasScrolledToC4Ref.current = true;
          }
        });
      }
    }
    // Reset scroll flag when clef changes
    if (settings.clef === "Treble") {
      hasScrolledToC4Ref.current = false;
    }
  }, [settings.clef, notes]);

  const handleNoteToggle = (pitch) => {
    const currentNotes = Array.isArray(settings.selectedNotes)
      ? settings.selectedNotes
      : [];

    if (currentNotes.includes(pitch)) {
      // Don't allow removing if it would result in fewer than minNotes
      if (currentNotes.length <= minNotes) {
        return;
      }
      updateSetting(
        "selectedNotes",
        currentNotes.filter((n) => n !== pitch)
      );
    } else {
      updateSetting("selectedNotes", [...currentNotes, pitch]);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <p className="text-xs sm:text-sm text-white/80 flex-shrink-0 mb-2">
        Select which notes you want to practice with:
      </p>

      <div className="w-full px-2 sm:px-3 flex-1 flex flex-col gap-3">
        <div className="relative h-[230px] w-full">
          <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_8s_ease-in-out_infinite]" />

            <div
              ref={scrollContainerRef}
              className="flex h-full gap-2 overflow-x-auto snap-x snap-mandatory px-4 py-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent"
            >
              {notes.map((note) => (
                <button
                  key={note.pitch || note.note}
                  onClick={() => handleNoteToggle(note.pitch || note.note)}
                  className={`relative flex flex-col items-center justify-between rounded-2xl min-w-[110px] max-w-[110px] h-full snap-center transition-all duration-300 ${
                    settings.selectedNotes?.includes(note.pitch || note.note)
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-purple-900/30 scale-[1.02]"
                      : "bg-white/15 text-white/80 hover:bg-white/25"
                  }`}
                >
                  <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/10" />
                  {showImages && note.ImageComponent ? (
                    <div className="flex-1 flex items-center justify-center w-full px-3 pt-6 pb-3">
                      <note.ImageComponent
                        className="w-full h-full object-contain  drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
                        aria-label={note.note}
                      />
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center pb-2 justify-center text-3xl font-bold">
                      {note.englishName}
                    </div>
                  )}
                  <div className="w-full text-center text-xs font-semibold tracking-wide py-2 border-t border-white/10">
                    {note.note}
                    {note.pitch ? (
                      <span className="block text-[10px] text-white/70 font-normal">
                        {note.pitch}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-white/80 flex-shrink-0 mt-2">
        Selected: {settings.selectedNotes?.length || 0} notes
      </p>
    </div>
  );
}

// Step Component: Difficulty Selection
function DifficultySelection({ settings, updateSetting, config }) {
  const difficulties = config.difficulties || [
    { value: "beginner", name: "Beginner", description: "Simple patterns" },
    {
      value: "intermediate",
      name: "Intermediate",
      description: "Moderate patterns",
    },
    { value: "advanced", name: "Advanced", description: "Complex patterns" },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff.value}
            onClick={() => updateSetting("difficulty", diff.value)}
            className={`p-2 sm:p-3 rounded-lg transition-colors ${
              settings.difficulty === diff.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="font-semibold text-sm sm:text-base">
              {diff.name}
            </div>
            <div className="text-xs opacity-75">{diff.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step Component: Time Signature Selection
function TimeSignatureSelection({ settings, updateSetting, config }) {
  const timeSignatures = config.timeSignatures || [
    { name: "4/4", beats: 4, subdivision: 16 },
    { name: "3/4", beats: 3, subdivision: 12 },
    { name: "2/4", beats: 2, subdivision: 8 },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {timeSignatures.map((timeSig) => (
          <button
            key={timeSig.name}
            onClick={() => updateSetting("timeSignature", timeSig)}
            className={`p-2 sm:p-3 rounded-lg transition-colors text-sm sm:text-base ${
              settings.timeSignature?.name === timeSig.name
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {timeSig.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Step Component: Tempo Selection
function TempoSelection({ settings, updateSetting, config }) {
  const { minTempo = 60, maxTempo = 180 } = config;

  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-medium text-white mb-2 text-center">
        Tempo: {settings.tempo || 80} BPM
      </label>
      <input
        type="range"
        min={minTempo}
        max={maxTempo}
        value={settings.tempo || 80}
        onChange={(e) => updateSetting("tempo", parseInt(e.target.value))}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${
            ((settings.tempo || 80 - minTempo) / (maxTempo - minTempo)) * 100
          }%, rgba(255,255,255,0.2) ${
            ((settings.tempo || 80 - minTempo) / (maxTempo - minTempo)) * 100
          }%, rgba(255,255,255,0.2) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-white/70 mt-2">
        <span>{minTempo} BPM</span>
        <span>{maxTempo} BPM</span>
      </div>
    </div>
  );
}

// Step Component: Timed Mode Selection
function TimedModeSelection({ settings, updateSetting, config }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => updateSetting("timedMode", false)}
          className={`p-4 rounded-lg transition-colors ${
            !settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="font-semibold text-sm sm:text-base">Untimed</div>
          <div className="text-xs opacity-75">Practice mode</div>
        </button>
        <button
          onClick={() => updateSetting("timedMode", true)}
          className={`p-4 rounded-lg transition-colors ${
            settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="font-semibold text-sm sm:text-base">Timed</div>
          <div className="text-xs opacity-75">Challenge mode</div>
        </button>
      </div>
    </div>
  );
}

// Step Component: Grid Size Selection (for memory game)
function GridSizeSelection({ settings, updateSetting, config }) {
  const gridSizes = config.gridSizes || [
    { value: "3 X 4", name: "3 × 4", pairs: 6 },
    { value: "3 X 6", name: "3 × 6", pairs: 9 },
    { value: "3 X 8", name: "3 × 8", pairs: 12 },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {gridSizes.map((grid) => (
          <button
            key={grid.value}
            onClick={() => updateSetting("gridSize", grid.value)}
            className={`p-3 rounded-lg transition-colors ${
              settings.gridSize === grid.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="font-semibold text-base">{grid.name}</div>
            <div className="text-xs opacity-75">{grid.pairs} pairs</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default UnifiedGameSettings;
