import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";
import BackButton from "../../ui/BackButton";
import trebleClefImage from "../../../assets/noteImages/treble-clef.svg";
import bassClefImage from "../../../assets/noteImages/bass-clef.svg";

const DEFAULT_TIMER_OPTIONS = Object.freeze([60, 45, 30]);

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
  // Support individual initial props for backwards compatibility
  initialClef,
  initialSelectedNotes,
  initialTimedMode,
  initialDifficulty,
  initialTimeLimit,
  onStart,
  backRoute = "/practice-modes",
  noteData,
  trebleNotes,
  bassNotes,
  isModal = false,
  onCancel,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showMinNotesModal, setShowMinNotesModal] = useState(false);
  const mergedInitialSettings = useMemo(
    () => ({
      ...initialSettings,
      ...(initialClef !== undefined && { clef: initialClef }),
      ...(initialSelectedNotes !== undefined && {
        selectedNotes: initialSelectedNotes,
      }),
      ...(initialTimedMode !== undefined && { timedMode: initialTimedMode }),
      ...(initialDifficulty !== undefined && { difficulty: initialDifficulty }),
      ...(initialTimeLimit !== undefined && { timeLimit: initialTimeLimit }),
    }),
    [
      initialSettings,
      initialClef,
      initialSelectedNotes,
      initialTimedMode,
      initialDifficulty,
      initialTimeLimit,
    ]
  );

  const [settings, setSettings] = useState(mergedInitialSettings);
  const { t } = useTranslation("common");
  const noteSelectionStepConfig = useMemo(
    () => steps.find((step) => step.component === "NoteSelection"),
    [steps]
  );
  const minNotesRequirement = noteSelectionStepConfig?.config?.minNotes || 2;

  // Support both noteData object and separate trebleNotes/bassNotes props
  const actualNoteData = noteData || {
    trebleNotes: trebleNotes || [],
    bassNotes: bassNotes || [],
  };

  useEffect(() => {
    setSettings((prev) => {
      if (prev === mergedInitialSettings) return prev;
      const hasChanged = Object.keys(mergedInitialSettings).some(
        (key) => mergedInitialSettings[key] !== prev[key]
      );
      return hasChanged ? mergedInitialSettings : prev;
    });
  }, [mergedInitialSettings]);

  const ensureMinNotesSelected = () => {
    if (!noteSelectionStepConfig) return true;
    const selectedCount = settings.selectedNotes?.length || 0;
    if (selectedCount >= minNotesRequirement) {
      return true;
    }
    setShowMinNotesModal(true);
    return false;
  };

  const minNotesModal = showMinNotesModal ? (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
        <h3 className="text-xl font-bold text-gray-900">
          {t("gameSettings.noteSelection.minNotesTitle", {
            defaultValue: "Pick at least {{count}} notes",
            count: minNotesRequirement,
          })}
        </h3>
        <p className="text-gray-600 text-sm">
          {t("gameSettings.noteSelection.minNotesDescription", {
            defaultValue:
              "Select {{count}} or more notes to practice before continuing.",
            count: minNotesRequirement,
          })}
        </p>
        <button
          onClick={() => setShowMinNotesModal(false)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors w-full"
        >
          {t("gameSettings.buttons.gotIt", { defaultValue: "Got it" })}
        </button>
      </div>
    </div>
  ) : null;

  const handleNextStep = () => {
    if (
      currentStepConfig?.component === "NoteSelection" &&
      !ensureMinNotesSelected()
    ) {
      return;
    }
    if (currentStepConfig?.component !== "NoteSelection" && !isStepValid()) {
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStart = () => {
    if (!ensureMinNotesSelected()) {
      return;
    }
    onStart(settings);
  };

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Get current step configuration
  const currentStepConfig = steps[currentStep - 1];
  const translatedStepTitle = currentStepConfig?.title
    ? t(currentStepConfig.title, {
        defaultValue: currentStepConfig.title,
      })
    : "";

  // Render the appropriate step component based on configuration
  const renderStepComponent = () => {
    if (!currentStepConfig) return null;

    const { component, config = {} } = currentStepConfig;

    switch (component) {
      case "ClefSelection":
        return (
          <ClefSelection settings={settings} updateSetting={updateSetting} />
        );

      case "NoteSelection":
        return (
          <NoteSelection
            settings={settings}
            updateSetting={updateSetting}
            noteData={actualNoteData}
            config={config}
            gameType={gameType}
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
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
              <div className="flex flex-row gap-3 w-full items-stretch h-full">
                {/* Settings Container */}
                <div className="flex-1 flex items-center overflow-hidden">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 h-full flex flex-col p-2.5 sm:p-3 w-full">
                    <h2 className="text-base sm:text-lg font-bold text-white mb-1.5 text-center flex-shrink-0">
                      {t("gameSettings.steps.progress", {
                        current: currentStep,
                        total: steps.length,
                        title: translatedStepTitle,
                      })}
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
                      {t("gameSettings.buttons.cancel")}
                    </button>
                  )}
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold shadow-lg"
                    >
                      {t("gameSettings.buttons.back")}
                    </button>
                  )}
                  {currentStep < steps.length ? (
                    <button
                      onClick={handleNextStep}
                      className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                      }
                    >
                      {t("gameSettings.buttons.next")}
                    </button>
                  ) : (
                    <button
                      onClick={handleStart}
                      className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-lg ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                      }
                    >
                      {t("gameSettings.buttons.startGame")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {minNotesModal}
      </>
    );
  }

  // Regular full-screen mode
  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white">
        <div className="p-2 flex-shrink-0">
          <BackButton
            to={backRoute}
            name={
              backRoute.includes("notes-master")
                ? t("pages.notesMaster")
                : backRoute.includes("rhythm")
                  ? t("pages.rhythmMaster")
                  : t("pages.gameModes")
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
                  {t("gameSettings.steps.progress", {
                    current: currentStep,
                    total: steps.length,
                    title: translatedStepTitle,
                  })}
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
                  {t("gameSettings.buttons.back")}
                </button>
              )}
              {currentStep < steps.length ? (
                <button
                  onClick={handleNextStep}
                  disabled={
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                  }
                  className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg ${
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {t("gameSettings.buttons.next")}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                  }
                  className={`w-full px-4 sm:px-6 py-2.5 sm:py-3 text-base sm:text-lg bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg ${
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {t("gameSettings.buttons.startGame")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {minNotesModal}
    </>
  );
}

// Step Component: Clef Selection
function ClefSelection({ settings, updateSetting }) {
  const { t } = useTranslation("common");
  const clefOptions = [
    {
      value: "Treble",
      label: t("gameSettings.clefs.treble.label"),
      alt: t("gameSettings.clefs.treble.alt"),
      image: trebleClefImage,
    },
    {
      value: "Bass",
      label: t("gameSettings.clefs.bass.label"),
      alt: t("gameSettings.clefs.bass.alt"),
      image: bassClefImage,
    },
  ];

  const handleClefChange = (clef) => {
    updateSetting("clef", clef);
    updateSetting("selectedNotes", null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {clefOptions.map((clef) => (
          <button
            key={clef.value}
            onClick={() => handleClefChange(clef.value)}
            className={`p-4 sm:p-6 rounded-lg transition-colors ${
              settings.clef === clef.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <img
                src={clef.image}
                alt={clef.alt}
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                style={{
                  filter:
                    settings.clef === clef.value
                      ? "brightness(0) invert(1)"
                      : "brightness(0) invert(0.9)",
                }}
              />
              <div className="font-semibold text-sm sm:text-base">
                {clef.label}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step Component: Note Selection
function NoteSelection({
  settings,
  updateSetting,
  noteData,
  config,
  gameType,
}) {
  const { t } = useTranslation("common");
  const {
    showImages = false,
    minNotes = 2,
    noteIdField = "pitch",
    selectAllByDefault = false,
  } = config;
  const notes =
    settings.clef === "Treble" ? noteData.trebleNotes : noteData.bassNotes;
  const scrollContainerRef = useRef(null);
  const hasScrolledToC4Ref = useRef(false);
  const selectedCount = settings.selectedNotes?.length || 0;
  const getNoteId = (note) =>
    noteIdField === "note" ? note.note || note.pitch : note.pitch || note.note;
  const noteCards = useMemo(() => notes, [notes]);

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
      updateSetting(
        "selectedNotes",
        currentNotes.filter((n) => n !== pitch)
      );
    } else {
      updateSetting("selectedNotes", [...currentNotes, pitch]);
    }
  };

  const handleDeselectAll = () => {
    if (selectedCount === 0) return;
    updateSetting("selectedNotes", []);
  };

  const getAllNoteIds = useCallback(() => {
    return noteCards
      .map((note) =>
        noteIdField === "note"
          ? note.note || note.pitch
          : note.pitch || note.note
      )
      .filter(Boolean);
  }, [noteCards, noteIdField]);

  const handleSelectAll = () => {
    const allNoteIds = getAllNoteIds();
    if (allNoteIds.length === 0) return;
    if (
      settings.selectedNotes &&
      settings.selectedNotes.length === allNoteIds.length
    ) {
      return;
    }
    updateSetting("selectedNotes", allNoteIds);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const rows = noteCards.map((note, index) => {
      const id = getNoteId(note);
      return {
        index,
        hebrew: note.note,
        english: note.englishName,
        pitch: note.pitch,
        id,
        isSelected: settings.selectedNotes?.includes(id) || false,
      };
    });

    // eslint-disable-next-line no-console
    console.groupCollapsed(
      `[NoteSelection] game=${gameType || "unknown"} clef=${
        settings.clef || "Treble"
      }`
    );
    // eslint-disable-next-line no-console
    console.log("Config", {
      noteIdField,
      selectedNotes: settings.selectedNotes,
      totalNotes: noteCards.length,
    });
    // eslint-disable-next-line no-console
    console.table(rows);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }, [gameType, settings.clef, settings.selectedNotes, noteIdField, noteCards]);

  const totalSelectableNotes = useMemo(
    () => getAllNoteIds().length,
    [getAllNoteIds]
  );

  useEffect(() => {
    if (
      !selectAllByDefault ||
      (Array.isArray(settings.selectedNotes) &&
        settings.selectedNotes.length > 0)
    ) {
      return;
    }

    const selectionUnset =
      settings.selectedNotes === undefined || settings.selectedNotes === null;
    if (!selectionUnset) return;

    const allNoteIds = getAllNoteIds();
    if (allNoteIds.length === 0) return;
    updateSetting("selectedNotes", allNoteIds);
  }, [
    selectAllByDefault,
    getAllNoteIds,
    settings.selectedNotes,
    updateSetting,
  ]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-white/80 flex-shrink-0 mb-2">
        <p>{t("gameSettings.noteSelection.instruction")}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
            }
            className={`text-white/90 font-semibold px-3 py-1 rounded-full border bg-emerald-600 border-white/30 transition-opacity ${
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            }`}
          >
            {t("gameSettings.noteSelection.selectAll", {
              defaultValue: "Select all",
            })}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            className={`text-white/90 font-semibold px-3 py-1 rounded-full border bg-indigo-600 border-white/30 transition-opacity ${
              selectedCount === 0
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            }`}
          >
            {t("gameSettings.noteSelection.deselectAll", {
              defaultValue: "Deselect all",
            })}
          </button>
        </div>
      </div>

      <div className="w-full px-2 sm:px-3 flex-1 flex flex-col gap-3">
        <div className="relative h-[230px] w-full">
          <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[pulse_8s_ease-in-out_infinite]" />

            <div
              ref={scrollContainerRef}
              className="flex h-full gap-2 overflow-x-auto snap-x snap-mandatory px-4 py-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent"
            >
              {noteCards.map((note, idx) => {
                const noteId = getNoteId(note);
                if (!noteId) return null;
                return (
                  <button
                    key={`${noteId}-${idx}`}
                    onClick={() => handleNoteToggle(noteId)}
                    className={`relative flex flex-col items-center justify-between rounded-2xl min-w-[110px] max-w-[110px] h-full snap-center transition-all duration-300 ${
                      settings.selectedNotes?.includes(noteId)
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-white/80 flex-shrink-0 mt-2">
        {t("gameSettings.noteSelection.selectedCount", {
          count: selectedCount,
        })}
      </p>
    </div>
  );
}

// Step Component: Difficulty Selection
function DifficultySelection({ settings, updateSetting, config }) {
  const { t } = useTranslation("common");
  const difficulties = config.difficulties || [
    {
      value: "beginner",
      name: t("gameSettings.difficulty.levels.beginner.label"),
      description: t("gameSettings.difficulty.levels.beginner.summary"),
    },
    {
      value: "intermediate",
      name: t("gameSettings.difficulty.levels.intermediate.label"),
      description: t("gameSettings.difficulty.levels.intermediate.summary"),
    },
    {
      value: "advanced",
      name: t("gameSettings.difficulty.levels.advanced.label"),
      description: t("gameSettings.difficulty.levels.advanced.summary"),
    },
  ];
  const targetField = config.field || "difficulty";
  const currentValue = settings[targetField];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
        {difficulties.map((diff) => (
          <button
            key={diff.value}
            onClick={() => updateSetting(targetField, diff.value)}
            className={`p-2 sm:p-3 rounded-lg transition-colors ${
              currentValue === diff.value
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
  const { t } = useTranslation("common");
  const { minTempo = 60, maxTempo = 180 } = config;
  const currentTempo = settings.tempo ?? 80;
  const normalized =
    ((Math.max(minTempo, Math.min(maxTempo, currentTempo)) - minTempo) /
      (maxTempo - minTempo || 1)) *
    100;

  return (
    <div className="space-y-2">
      <label className="block text-sm sm:text-base font-medium text-white mb-2 text-center">
        {t("gameSettings.tempo.label", { tempo: currentTempo })}
      </label>
      <input
        type="range"
        min={minTempo}
        max={maxTempo}
        value={currentTempo}
        onChange={(e) => updateSetting("tempo", parseInt(e.target.value, 10))}
        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${normalized}%, rgba(255,255,255,0.2) ${normalized}%, rgba(255,255,255,0.2) 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-white/70 mt-2">
        <span>{t("gameSettings.tempo.min", { value: minTempo })}</span>
        <span>{t("gameSettings.tempo.max", { value: maxTempo })}</span>
      </div>
    </div>
  );
}

// Step Component: Timed Mode Selection
function TimedModeSelection({ settings, updateSetting, config }) {
  const { t } = useTranslation("common");
  const timerOptions =
    Array.isArray(config?.timerOptions) && config.timerOptions.length > 0
      ? config.timerOptions
      : DEFAULT_TIMER_OPTIONS;
  const fallbackTimeLimit =
    timerOptions.length > 0 ? timerOptions[0] : DEFAULT_TIMER_OPTIONS[0];

  useEffect(() => {
    if (!settings.timedMode) return;
    if (!fallbackTimeLimit) return;
    if (timerOptions.includes(settings.timeLimit)) return;
    updateSetting("timeLimit", fallbackTimeLimit);
  }, [
    settings.timedMode,
    settings.timeLimit,
    timerOptions,
    fallbackTimeLimit,
    updateSetting,
  ]);

  const handleTimedModeChange = (isTimed) => {
    updateSetting("timedMode", isTimed);
    if (
      isTimed &&
      fallbackTimeLimit &&
      !timerOptions.includes(settings.timeLimit)
    ) {
      updateSetting("timeLimit", fallbackTimeLimit);
    }
  };

  const selectedTimeLimit = timerOptions.includes(settings.timeLimit)
    ? settings.timeLimit
    : fallbackTimeLimit;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleTimedModeChange(false)}
          className={`p-4 rounded-lg transition-colors ${
            !settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="font-semibold text-sm sm:text-base">
            {t("gameSettings.modes.untimed.label")}
          </div>
          <div className="text-xs opacity-75">
            {t("gameSettings.modes.untimed.description")}
          </div>
        </button>
        <button
          onClick={() => handleTimedModeChange(true)}
          className={`p-4 rounded-lg transition-colors ${
            settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="font-semibold text-sm sm:text-base">
            {t("gameSettings.modes.timed.label")}
          </div>
          <div className="text-xs opacity-75">
            {t("gameSettings.modes.timed.description")}
          </div>
        </button>
      </div>

      {settings.timedMode && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-white/80 text-center">
            {t("gameSettings.modes.timed.durationLabel", {
              defaultValue: "Select timer length",
            })}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {timerOptions.map((seconds) => (
              <button
                key={seconds}
                onClick={() => updateSetting("timeLimit", seconds)}
                className={`p-3 rounded-xl border transition-all duration-150 ${
                  selectedTimeLimit === seconds
                    ? "bg-white text-indigo-700 border-white shadow-lg scale-[1.02]"
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
              >
                <div className="text-lg font-bold">
                  {t("gameSettings.modes.timed.seconds", {
                    value: seconds,
                    defaultValue: `${seconds}s`,
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step Component: Grid Size Selection (for memory game)
function GridSizeSelection({ settings, updateSetting, config }) {
  const { t } = useTranslation("common");
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
            <div className="text-xs opacity-75">
              {t("gameSettings.gridSize.pairs", { count: grid.pairs })}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default UnifiedGameSettings;
export { UnifiedGameSettings as GameSettings };
