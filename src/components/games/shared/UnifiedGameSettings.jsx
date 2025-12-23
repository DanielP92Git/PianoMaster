import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import { useTranslation } from "react-i18next";
import BackButton from "../../ui/BackButton";
import trebleClefImage from "../../../assets/noteImages/treble/treble-clef.svg";
import bassClefImage from "../../../assets/noteImages/bass/bass-clef.svg";
import VictoryScreen from "../VictoryScreen";

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
  const { soft, fade, reduce } = useMotionTokens();
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

  const minNotesModal = (
    <AnimatePresence>
      {showMinNotesModal ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <motion.div
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            transition={soft}
          >
            <h3 className="text-xl font-bold text-gray-900">
              {t("gameSettings.noteSelection.minNotesTitle", {
                defaultValue: "Pick at least {{count}} notes",
                count: minNotesRequirement,
              })}
            </h3>
            <p className="text-sm text-gray-600">
              {t("gameSettings.noteSelection.minNotesDescription", {
                defaultValue:
                  "Select {{count}} or more notes to practice before continuing.",
                count: minNotesRequirement,
              })}
            </p>
            <button
              onClick={() => setShowMinNotesModal(false)}
              className="w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {t("gameSettings.buttons.gotIt", { defaultValue: "Got it" })}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

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
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <motion.div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            initial={reduce ? false : { opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={soft}
          >
            <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
              <div className="flex h-full w-full flex-row items-stretch gap-3">
                {/* Settings Container */}
                <div className="flex flex-1 items-center overflow-hidden">
                  <div className="flex h-full w-full flex-col rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md sm:p-3">
                    <h2 className="mb-1.5 flex-shrink-0 text-center text-base font-bold text-white sm:text-lg">
                      {t("gameSettings.steps.progress", {
                        current: currentStep,
                        total: steps.length,
                        title: translatedStepTitle,
                      })}
                    </h2>
                    <div className="flex flex-1 flex-col justify-center overflow-hidden">
                      {renderStepComponent()}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex min-w-[160px] flex-col justify-center gap-3 sm:min-w-[180px]">
                  {onCancel && (
                    <button
                      onClick={onCancel}
                      className="w-full rounded-xl bg-gray-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-lg"
                    >
                      {t("gameSettings.buttons.cancel")}
                    </button>
                  )}
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="w-full rounded-xl bg-gray-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-lg"
                    >
                      {t("gameSettings.buttons.back")}
                    </button>
                  )}
                  {currentStep < steps.length ? (
                    <button
                      onClick={handleNextStep}
                      className={`w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-lg ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "cursor-not-allowed opacity-50"
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
                      className={`w-full touch-manipulation rounded-xl bg-green-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-green-700 sm:px-6 sm:py-3 sm:text-lg ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "cursor-not-allowed opacity-50"
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
          </motion.div>
        </motion.div>
        {minNotesModal}
      </>
    );
  }

  // Regular full-screen mode
  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white">
        <div className="flex-shrink-0 p-2">
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
        <div className="flex flex-1 items-center justify-center overflow-hidden px-2 py-1">
          <div
            className="flex w-full max-w-5xl flex-row items-stretch gap-3"
            style={{ height: "calc(100vh - 80px)", maxHeight: "650px" }}
          >
            {/* Settings Container */}
            <div className="flex flex-1 items-center overflow-hidden">
              <div className="flex h-full w-full flex-col rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md sm:p-3">
                <h2 className="mb-1.5 flex-shrink-0 text-center text-base font-bold text-white sm:text-lg">
                  {t("gameSettings.steps.progress", {
                    current: currentStep,
                    total: steps.length,
                    title: translatedStepTitle,
                  })}
                </h2>
                <div className="flex flex-1 flex-col justify-center overflow-hidden">
                  {renderStepComponent()}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex min-w-[160px] flex-col justify-center gap-3 sm:min-w-[180px]">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="w-full rounded-xl bg-gray-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-lg"
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
                  className={`w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-lg ${
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                      ? "cursor-not-allowed opacity-50"
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
                  className={`w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 sm:px-6 sm:py-3 sm:text-lg ${
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                      ? "cursor-not-allowed opacity-50"
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
      images: [trebleClefImage],
    },
    {
      value: "Bass",
      label: t("gameSettings.clefs.bass.label"),
      alt: t("gameSettings.clefs.bass.alt"),
      images: [bassClefImage],
    },
    {
      value: "Both",
      label: t("gameSettings.clefs.both.label", { defaultValue: "Both" }),
      alt: t("gameSettings.clefs.both.alt", {
        defaultValue: "Treble and Bass Clefs",
      }),
      images: [trebleClefImage, bassClefImage],
    },
  ];

  const handleClefChange = (clef) => {
    updateSetting("clef", clef);
    updateSetting("selectedNotes", null);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {clefOptions.map((clef) => (
          <button
            key={clef.value}
            onClick={() => handleClefChange(clef.value)}
            className={`rounded-lg p-4 transition-colors sm:p-6 ${
              settings.clef === clef.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-2">
                {clef.images.map((imgSrc, idx) => (
                  <img
                    key={`${clef.value}-${idx}`}
                    src={imgSrc}
                    alt={clef.alt}
                    className="h-12 w-12 object-contain sm:h-16 sm:w-16"
                    style={{
                      filter:
                        settings.clef === clef.value
                          ? "brightness(0) invert(1)"
                          : "brightness(0) invert(0.9)",
                    }}
                  />
                ))}
              </div>
              <div className="text-sm font-semibold sm:text-base">
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
  const { t, i18n } = useTranslation("common");
  const {
    showImages = false,
    minNotes = 2,
    noteIdField = "pitch",
    selectAllByDefault = false,
  } = config;
  const clefKey = String(settings.clef || "Treble").toLowerCase();
  const isBothClefs = clefKey === "both";
  const enableSharps = !!settings.enableSharps;
  const enableFlats = !!settings.enableFlats;
  const makeClefQualifiedId = useCallback(
    (rowKey, baseId) => {
      if (!baseId) return null;
      return isBothClefs ? `${rowKey}:${baseId}` : baseId;
    },
    [isBothClefs]
  );
  // Note-selection UI should always show *natural notes only*.
  // Sharps/flats toggles affect gameplay only (not which cards are shown here).
  const shouldIncludePitch = useCallback((pitch) => {
    if (!pitch) return false;
    const p = String(pitch);
    return !p.includes("#") && !p.includes("b");
  }, []);

  const dedupeByPitch = useCallback((items = []) => {
    const byPitch = new Map();
    items.forEach((note) => {
      const pitch = note?.pitch || note?.note;
      if (!pitch) return;
      if (!byPitch.has(pitch)) {
        byPitch.set(pitch, note);
      }
    });
    return Array.from(byPitch.values());
  }, []);

  const trebleNotesList = useMemo(() => {
    const filtered = (
      Array.isArray(noteData.trebleNotes) ? noteData.trebleNotes : []
    ).filter((n) => shouldIncludePitch(n?.pitch || n?.note));
    return dedupeByPitch(filtered);
  }, [dedupeByPitch, noteData.trebleNotes, shouldIncludePitch]);
  const bassNotesList = useMemo(() => {
    const filtered = (
      Array.isArray(noteData.bassNotes) ? noteData.bassNotes : []
    ).filter((n) => shouldIncludePitch(n?.pitch || n?.note));
    return dedupeByPitch(filtered);
  }, [dedupeByPitch, noteData.bassNotes, shouldIncludePitch]);

  const notes = useMemo(() => {
    if (clefKey === "bass") return bassNotesList;
    if (isBothClefs) return [...trebleNotesList, ...bassNotesList];
    return trebleNotesList;
  }, [bassNotesList, clefKey, isBothClefs, trebleNotesList]);

  const scrollContainerRef = useRef(null);
  const trebleScrollContainerRef = useRef(null);
  const bassScrollContainerRef = useRef(null);
  const hasScrolledToC4Ref = useRef(false);
  const selectedCount = settings.selectedNotes?.length || 0;
  const getNoteId = (note) =>
    noteIdField === "note" ? note.note || note.pitch : note.pitch || note.note;
  const noteCards = useMemo(() => notes, [notes]);

  // Scroll to C4 when bass clef is selected (also applies for "both" => bass row)
  useEffect(() => {
    if (
      (clefKey === "bass" || clefKey === "both") &&
      (clefKey === "bass"
        ? scrollContainerRef.current
        : bassScrollContainerRef.current) &&
      !hasScrolledToC4Ref.current
    ) {
      const listToScroll = clefKey === "bass" ? noteCards : bassNotesList;
      const targetContainer =
        clefKey === "bass"
          ? scrollContainerRef.current
          : bassScrollContainerRef.current;

      // Find the index of C4 in the list
      const c4Index = listToScroll.findIndex((note) => note.pitch === "C4");
      if (c4Index !== -1) {
        // Wait for next frame to ensure DOM is ready
        requestAnimationFrame(() => {
          const container = targetContainer;
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
    if (clefKey !== "bass") {
      hasScrolledToC4Ref.current = false;
    }
  }, [bassNotesList, clefKey, noteCards]);

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

  const allCardsForSelection = useMemo(() => {
    if (!isBothClefs) return noteCards;
    // For both clefs, treat treble and bass rows as independent selections.
    return [
      ...trebleNotesList.map((note) => ({
        ...note,
        __selectionRowKey: "treble",
      })),
      ...bassNotesList.map((note) => ({
        ...note,
        __selectionRowKey: "bass",
      })),
    ];
  }, [bassNotesList, isBothClefs, noteCards, trebleNotesList]);

  const getAllNoteIds = useCallback(() => {
    return allCardsForSelection
      .map((note) => {
        const baseId =
          noteIdField === "note"
            ? note.note || note.pitch
            : note.pitch || note.note;
        const rowKey = note?.__selectionRowKey;
        return rowKey ? makeClefQualifiedId(rowKey, baseId) : baseId;
      })
      .filter(Boolean);
  }, [allCardsForSelection, makeClefQualifiedId, noteIdField]);

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

  const pruneSelectionForAccidentals = useCallback(
    (selected = []) => {
      return selected.filter((rawId) => {
        const id = String(rawId || "");
        const base = id.includes(":") ? id.split(":")[1] : id;
        if (base.includes("#")) return enableSharps;
        if (base.includes("b")) return enableFlats;
        return true;
      });
    },
    [enableFlats, enableSharps]
  );

  const toggleSharps = () => {
    const next = !enableSharps;
    updateSetting("enableSharps", next);
    if (!next) {
      updateSetting(
        "selectedNotes",
        pruneSelectionForAccidentals(settings.selectedNotes || [])
      );
    }
  };

  const toggleFlats = () => {
    const next = !enableFlats;
    updateSetting("enableFlats", next);
    if (!next) {
      updateSetting(
        "selectedNotes",
        pruneSelectionForAccidentals(settings.selectedNotes || [])
      );
    }
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header with filter buttons - always visible, never cropped */}
      <div className="mb-2 flex flex-shrink-0 flex-wrap items-center justify-end gap-2 text-xs text-white/80 sm:text-sm">
        <div className="flex items-center gap-2">
          {/* Accidentals toggles (do not show accidental cards unless enabled) */}
          <button
            type="button"
            onClick={toggleSharps}
            aria-pressed={enableSharps}
            className={`rounded-full border border-white/30 px-3 py-1 font-semibold transition-colors ${
              enableSharps
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            ♯{" "}
            {t("gameSettings.noteSelection.sharps", { defaultValue: "Sharps" })}
          </button>
          <button
            type="button"
            onClick={toggleFlats}
            aria-pressed={enableFlats}
            className={`rounded-full border border-white/30 px-3 py-1 font-semibold transition-colors ${
              enableFlats
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            ♭ {t("gameSettings.noteSelection.flats", { defaultValue: "Flats" })}
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
            }
            className={`rounded-full border border-white/30 bg-emerald-600 px-3 py-1 font-semibold text-white/90 transition-opacity ${
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
                ? "cursor-not-allowed opacity-40"
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
            className={`rounded-full border border-white/30 bg-indigo-600 px-3 py-1 font-semibold text-white/90 transition-opacity ${
              selectedCount === 0
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            }`}
          >
            {t("gameSettings.noteSelection.deselectAll", {
              defaultValue: "Deselect all",
            })}
          </button>
        </div>
      </div>

      {/* Scrollable note cards container */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm">
        {(() => {
          const isHebrew = i18n.language === "he";

          const renderRow = (rowNotes, { rowKey, rowRef }) => (
            <div className="min-h-0 flex-1 overflow-hidden">
              <div
                ref={rowRef}
                className={`scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent flex h-full snap-x snap-mandatory items-center overflow-x-auto overflow-y-hidden ${
                  isBothClefs
                    ? "gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2 lg:gap-3"
                    : "gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3 lg:gap-4"
                }`}
              >
                {rowNotes.map((note, idx) => {
                  const baseId = getNoteId(note);
                  // Safety: never render accidental cards in the selection UI.
                  // Accidentals are enabled via toggles for gameplay only.
                  if (
                    baseId &&
                    (String(baseId).includes("#") ||
                      String(baseId).includes("b") ||
                      String(baseId).includes("♭") ||
                      String(baseId).includes("♯"))
                  ) {
                    return null;
                  }
                  const noteId = makeClefQualifiedId(rowKey, baseId);
                  if (!noteId) return null;

                  const displayName = isHebrew ? note.note : note.englishName;
                  const displayPitch = isHebrew ? null : note.pitch;
                  const isSelected = settings.selectedNotes?.includes(noteId);

                  return (
                    <button
                      key={`${rowKey}-${noteId}-${idx}`}
                      onClick={() => handleNoteToggle(noteId)}
                      className={`${isBothClefs ? "note-card-two-row" : "note-card-responsive"} relative flex snap-center flex-col items-center justify-between overflow-hidden rounded-xl transition-all duration-200 lg:rounded-2xl ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-2 ring-white/50"
                          : "bg-white/10 text-white/90 hover:bg-white/20 hover:ring-1 hover:ring-white/30"
                      }`}
                    >
                      {/* Image area */}
                      {showImages && note.ImageComponent ? (
                        <div
                          className={`flex w-full flex-1 items-center justify-center overflow-hidden ${
                            isBothClefs
                              ? "p-0.5 sm:p-1 lg:p-1.5"
                              : "p-1 sm:p-1.5 lg:p-2"
                          }`}
                        >
                          <note.ImageComponent
                            className="h-full max-h-full w-auto rounded-lg object-contain lg:rounded-xl"
                            style={{
                              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                            }}
                            aria-label={displayName}
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex flex-1 items-center justify-center font-bold ${
                            isBothClefs
                              ? "text-sm sm:text-base lg:text-lg"
                              : "text-lg sm:text-xl lg:text-2xl"
                          }`}
                        >
                          {note.englishName}
                        </div>
                      )}
                      {/* Label area */}
                      <div
                        className={`w-full flex-shrink-0 text-center font-medium ${
                          isBothClefs
                            ? "py-0.5 text-[9px] sm:py-1 sm:text-[10px] lg:py-1 lg:text-[11px]"
                            : "py-1 text-[10px] sm:py-1.5 sm:text-[11px] lg:py-2 lg:text-xs"
                        } ${isSelected ? "bg-black/10" : "bg-black/5"}`}
                      >
                        {displayName}
                        {displayPitch ? (
                          <span
                            className={`ml-1 opacity-70 ${
                              isBothClefs
                                ? "text-[8px] sm:text-[9px]"
                                : "text-[9px] sm:text-[10px]"
                            }`}
                          >
                            {displayPitch}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );

          if (!isBothClefs) {
            return renderRow(noteCards, {
              rowKey: "single",
              rowRef: scrollContainerRef,
            });
          }

          return (
            <div className="flex h-full min-h-0 flex-col gap-1 p-0 sm:gap-1.5">
              {renderRow(trebleNotesList, {
                rowKey: "treble",
                rowRef: trebleScrollContainerRef,
              })}
              <div className="mx-2 h-px bg-white/15 sm:mx-3" />
              {renderRow(bassNotesList, {
                rowKey: "bass",
                rowRef: bassScrollContainerRef,
              })}
            </div>
          );
        })()}
      </div>

      {/* Footer - selected count - always visible */}
      <p className="mt-2 flex-shrink-0 text-xs text-white/80 sm:text-sm">
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
            className={`rounded-lg p-2 transition-colors sm:p-3 ${
              currentValue === diff.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="text-sm font-semibold sm:text-base">
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
            className={`rounded-lg p-2 text-sm transition-colors sm:p-3 sm:text-base ${
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
      <label className="mb-2 block text-center text-sm font-medium text-white sm:text-base">
        {t("gameSettings.tempo.label", { tempo: currentTempo })}
      </label>
      {/* Force LTR for slider to prevent RTL mismatch between fill and thumb */}
      <div dir="ltr">
        <input
          type="range"
          min={minTempo}
          max={maxTempo}
          value={currentTempo}
          onChange={(e) => updateSetting("tempo", parseInt(e.target.value, 10))}
          className="slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
          style={{
            background: `linear-gradient(to right, #4F46E5 0%, #4F46E5 ${normalized}%, rgba(255,255,255,0.2) ${normalized}%, rgba(255,255,255,0.2) 100%)`,
          }}
        />
        <div className="mt-2 flex justify-between text-xs text-white/70">
          <span>{t("gameSettings.tempo.min", { value: minTempo })}</span>
          <span>{t("gameSettings.tempo.max", { value: maxTempo })}</span>
        </div>
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
          className={`rounded-lg p-4 transition-colors ${
            !settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="text-sm font-semibold sm:text-base">
            {t("gameSettings.modes.untimed.label")}
          </div>
          <div className="text-xs opacity-75">
            {t("gameSettings.modes.untimed.description")}
          </div>
        </button>
        <button
          onClick={() => handleTimedModeChange(true)}
          className={`rounded-lg p-4 transition-colors ${
            settings.timedMode
              ? "bg-indigo-600 text-white"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
        >
          <div className="text-sm font-semibold sm:text-base">
            {t("gameSettings.modes.timed.label")}
          </div>
          <div className="text-xs opacity-75">
            {t("gameSettings.modes.timed.description")}
          </div>
        </button>
      </div>

      {settings.timedMode && (
        <div className="space-y-2">
          <p className="text-center text-xs uppercase tracking-wide text-white/80">
            {t("gameSettings.modes.timed.durationLabel", {
              defaultValue: "Select timer length",
            })}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {timerOptions.map((seconds) => (
              <button
                key={seconds}
                onClick={() => updateSetting("timeLimit", seconds)}
                className={`rounded-xl border p-3 transition-all duration-150 ${
                  selectedTimeLimit === seconds
                    ? "scale-[1.02] border-white bg-white text-indigo-700 shadow-[0_2px_12px_rgba(0,0,0,0.08)]"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
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
            className={`rounded-lg p-3 transition-colors ${
              settings.gridSize === grid.value
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            <div className="text-base font-semibold">{grid.name}</div>
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
