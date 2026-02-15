import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import { prepareGameLandscape } from "../../../utils/pwa";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "../../../hooks/useIsMobile";
import trebleClefImage from "../../../assets/noteImages/treble/treble-clef.svg";
import bassClefImage from "../../../assets/noteImages/bass/bass-clef.svg";
import VictoryScreen from "../VictoryScreen";
import { RhythmPatternPreview } from "../sight-reading-game/components/RhythmPatternPreview";
import {
  SIMPLE_NOTE_PATTERNS,
  SIMPLE_REST_PATTERNS,
  COMPLEX_EXAMPLE_PATTERNS,
  getAllComplexPatternIds,
} from "../sight-reading-game/utils/rhythmPatterns";

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
  const navigate = useNavigate();
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
  const { t, i18n } = useTranslation("common");
  const isMobile = useIsMobile(768);
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

  const effectiveSteps = useMemo(() => {
    const originalSteps = Array.isArray(steps) ? steps : [];
    if (!isMobile) return originalSteps;

    const noteIdx = originalSteps.findIndex(
      (s) => s?.component === "NoteSelection"
    );
    if (noteIdx === -1) return originalSteps;

    const noteStep = originalSteps[noteIdx];
    const baseConfig = noteStep?.config || {};
    const clefKey = String(settings.clef || "Treble").toLowerCase();

    const isHebrew = i18n.language === "he";
    const trebleLabel = isHebrew ? "מפתח סול" : "Treble";
    const bassLabel = isHebrew ? "מפתח פה" : "Bass";

    const baseTitle = noteStep?.title
      ? t(noteStep.title, { defaultValue: noteStep.title })
      : "";

    const withFilter = (step, clefFilter, suffix) => ({
      ...step,
      id: `${step.id || "notes"}-${clefFilter}`,
      title: step.title,
      titleOverride: baseTitle ? `${baseTitle} • ${suffix}` : suffix,
      config: { ...baseConfig, clefFilter },
    });

    // If clef isn't both, keep a single NoteSelection step but filter it.
    if (clefKey !== "both") {
      const filter = clefKey === "bass" ? "bass" : "treble";
      const suffix = filter === "bass" ? bassLabel : trebleLabel;
      const next = [...originalSteps];
      next[noteIdx] = withFilter(noteStep, filter, suffix);
      return next;
    }

    // Both clefs on mobile => split into two steps.
    const trebleStep = withFilter(noteStep, "treble", trebleLabel);
    const bassStep = withFilter(noteStep, "bass", bassLabel);

    return [
      ...originalSteps.slice(0, noteIdx),
      trebleStep,
      bassStep,
      ...originalSteps.slice(noteIdx + 1),
    ];
  }, [i18n.language, isMobile, settings.clef, steps, t]);

  useEffect(() => {
    setCurrentStep((prev) =>
      Math.min(Math.max(prev, 1), Math.max(effectiveSteps.length, 1))
    );
  }, [effectiveSteps.length]);

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
    setCurrentStep((prev) => Math.min(prev + 1, effectiveSteps.length));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStart = () => {
    if (!ensureMinNotesSelected()) {
      return;
    }
    // Backup: attempt landscape lock from this user gesture as well.
    // This helps on browsers that require a user interaction for fullscreen/orientation APIs.
    prepareGameLandscape();
    onStart(settings);
  };

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Get current step configuration
  const currentStepConfig = effectiveSteps[currentStep - 1];
  const translatedStepTitle = currentStepConfig?.titleOverride
    ? currentStepConfig.titleOverride
    : currentStepConfig?.title
      ? t(currentStepConfig.title, { defaultValue: currentStepConfig.title })
      : "";

  // Determine if scrolling is needed (only for rhythm settings with rests enabled)
  const needsScrolling =
    currentStepConfig?.component === "TimeSignatureSelection" &&
    currentStepConfig?.config?.showRhythmOptions &&
    settings.rhythmSettings?.allowRests;

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
            hideHeader={true}
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

      case "BarsPerExerciseSelection":
        return (
          <BarsPerExerciseSelection
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

    if (component === "TimeSignatureSelection") {
      if (!settings.timeSignature) return false;
      if (!config?.showRhythmOptions) return true;

      const rhythmSettings = settings.rhythmSettings || {};
      const allowedNoteDurations = Array.isArray(
        rhythmSettings.allowedNoteDurations
      )
        ? rhythmSettings.allowedNoteDurations
        : [];

      if (allowedNoteDurations.length === 0) return false;

      if (rhythmSettings.allowRests) {
        const allowedRestDurations = Array.isArray(
          rhythmSettings.allowedRestDurations
        )
          ? rhythmSettings.allowedRestDurations
          : [];
        if (allowedRestDurations.length === 0) return false;
      }

      return true;
    }

    return true;
  };

  // Render modal overlay if isModal is true
  if (isModal) {
    return (
      <>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 landscape:p-3 backdrop-blur-sm"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <motion.div
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 shadow-[0_8px_32px_rgba(0,0,0,0.12)] landscape:max-w-5xl landscape:max-h-[85vh]"
            initial={reduce ? false : { opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            transition={soft}
          >
            <div className="flex flex-1 items-center justify-center overflow-hidden p-4 landscape:p-3">
              <div className="flex h-full w-full flex-col items-stretch gap-3 sm:flex-row">
                {/* Settings Container */}
                <div className="flex flex-1 items-center overflow-hidden">
                  <div className="flex h-full w-full flex-col rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md landscape:p-2 sm:p-3">
                    <h2 className="mb-1.5 flex-shrink-0 text-center text-base font-bold text-white landscape:mb-1 landscape:text-base sm:text-lg">
                      {t("gameSettings.steps.progress", {
                        current: currentStep,
                        total: effectiveSteps.length,
                        title: translatedStepTitle,
                      })}
                    </h2>
                    <div
                      className={`flex min-h-0 flex-1 flex-col overflow-x-hidden ${
                        needsScrolling
                          ? "settings-scrollbar overflow-y-auto"
                          : "overflow-y-visible"
                      }`}
                    >
                      {renderStepComponent()}
                    </div>

                    {/* Mobile Navigation Buttons (inside the main card) */}
                    <div className="mt-3 flex flex-shrink-0 flex-wrap items-center gap-2 sm:hidden sm:landscape:flex lg:landscape:hidden landscape:mt-1">
                      {currentStep < effectiveSteps.length ? (
                        <button
                          onClick={handleNextStep}
                          className={`min-w-[140px] flex-[2] touch-manipulation rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 ${
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
                          className={`min-w-[140px] flex-[2] touch-manipulation rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-green-700 ${
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

                      {onCancel ? (
                        <button
                          onClick={onCancel}
                          className="flex-1 whitespace-nowrap rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-white/15"
                        >
                          {t("gameSettings.buttons.cancel")}
                        </button>
                      ) : currentStep === 1 ? (
                        <button
                          onClick={() => navigate(backRoute)}
                          className="flex-1 whitespace-nowrap rounded-xl bg-red-600/80 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-red-600"
                        >
                          {t("gameSettings.buttons.exitGame", {
                            defaultValue: "Exit Game",
                          })}
                        </button>
                      ) : null}

                      {currentStep > 1 ? (
                        <button
                          onClick={handlePrevStep}
                          className="flex-1 whitespace-nowrap rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-white/15"
                        >
                          {t("gameSettings.buttons.back")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="hidden min-w-[160px] flex-col justify-center gap-3 sm:flex sm:min-w-[180px] sm:landscape:hidden lg:landscape:flex">
                  {currentStep < effectiveSteps.length ? (
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
                  {onCancel ? (
                    <button
                      onClick={onCancel}
                      className="w-full rounded-xl bg-gray-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-lg"
                    >
                      {t("gameSettings.buttons.cancel")}
                    </button>
                  ) : currentStep === 1 ? (
                    <button
                      onClick={() => navigate(backRoute)}
                      className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-red-700 sm:px-6 sm:py-3 sm:text-lg"
                    >
                      {t("gameSettings.buttons.exitGame", {
                        defaultValue: "Exit Game",
                      })}
                    </button>
                  ) : null}
                  {currentStep > 1 && (
                    <button
                      onClick={handlePrevStep}
                      className="w-full rounded-xl bg-gray-600 px-4 py-2.5 text-base font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-lg"
                    >
                      {t("gameSettings.buttons.back")}
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
      <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 text-white supports-[height:100svh]:h-[100svh] landscape:items-center landscape:justify-center">
        <div className="flex flex-1 items-center justify-center overflow-hidden p-2 landscape:p-3 sm:p-4">
          <div className="flex h-full min-h-0 w-full max-w-5xl flex-col items-stretch gap-3 landscape:max-w-6xl sm:flex-row">
            {/* Settings Container - Full width on mobile */}
            <div className="flex min-h-0 flex-1 items-center overflow-hidden">
              <div className="flex h-full w-full flex-col rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur-md landscape:p-2 sm:p-3">
                {/* Desktop: Back button, title, and NoteSelection controls in one line */}
                {currentStepConfig?.component === "NoteSelection" ? (
                  <NoteSelectionHeader
                    currentStep={currentStep}
                    settings={settings}
                    updateSetting={updateSetting}
                    noteData={actualNoteData}
                    config={currentStepConfig.config}
                    gameType={gameType}
                    backRoute={backRoute}
                    title={t("gameSettings.steps.progress", {
                      current: currentStep,
                      total: effectiveSteps.length,
                      title: translatedStepTitle,
                    })}
                    t={t}
                  />
                ) : (
                  <>
                    <div className="mb-1.5 hidden flex-shrink-0 items-center justify-between gap-2 sm:flex">
                      <div className="w-[110px] flex-shrink-0" />
                      <h2 className="flex-1 text-center text-base font-bold text-white sm:text-lg">
                        {t("gameSettings.steps.progress", {
                          current: currentStep,
                          total: effectiveSteps.length,
                          title: translatedStepTitle,
                        })}
                      </h2>
                      <div className="w-[110px] flex-shrink-0" />
                    </div>
                    <h2 className="mb-1.5 flex-shrink-0 text-center text-base font-bold text-white landscape:mb-1 landscape:text-base sm:hidden sm:text-lg">
                      {t("gameSettings.steps.progress", {
                        current: currentStep,
                        total: effectiveSteps.length,
                        title: translatedStepTitle,
                      })}
                    </h2>
                  </>
                )}
                <div
                  className={`flex min-h-0 flex-1 flex-col overflow-x-hidden ${
                    needsScrolling
                      ? "settings-scrollbar overflow-y-auto"
                      : "overflow-y-visible"
                  }`}
                >
                  {renderStepComponent()}
                </div>

                {/* Mobile Navigation Buttons (inside the main card) */}
                <div className="mt-3 flex flex-shrink-0 items-center gap-2 sm:hidden sm:landscape:flex lg:landscape:hidden landscape:mt-1">
                  {currentStep < effectiveSteps.length ? (
                    <button
                      onClick={handleNextStep}
                      disabled={
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                      }
                      className={`touch-manipulation rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      } flex-[2]`}
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
                      className={`touch-manipulation rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-green-700 ${
                        currentStepConfig?.component !== "NoteSelection" &&
                        !isStepValid()
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      } flex-[2]`}
                    >
                      {t("gameSettings.buttons.startGame")}
                    </button>
                  )}

                  {currentStep > 1 ? (
                    <button
                      onClick={handlePrevStep}
                      className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-white/15"
                    >
                      {t("gameSettings.buttons.back")}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(backRoute)}
                      className="flex-1 whitespace-nowrap rounded-xl bg-red-600/80 px-3 py-2 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors hover:bg-red-600"
                    >
                      {t("gameSettings.buttons.exitGame", {
                        defaultValue: "Exit Game",
                      })}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Navigation Buttons - Much smaller */}
            <div className="hidden min-w-[100px] flex-col justify-center gap-2 sm:flex lg:min-w-[120px] sm:landscape:hidden lg:landscape:flex">
              {currentStep < effectiveSteps.length ? (
                <button
                  onClick={handleNextStep}
                  disabled={
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                  }
                  className={`w-full touch-manipulation rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:bg-indigo-700 sm:px-3 sm:py-2 sm:text-sm ${
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
                  className={`w-full touch-manipulation rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:bg-green-700 sm:px-3 sm:py-2 sm:text-sm ${
                    currentStepConfig?.component !== "NoteSelection" &&
                    !isStepValid()
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                >
                  {t("gameSettings.buttons.startGame")}
                </button>
              )}
              {currentStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="w-full rounded-lg bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:bg-gray-700 sm:px-3 sm:py-2 sm:text-sm"
                >
                  {t("gameSettings.buttons.back")}
                </button>
              ) : (
                <button
                  onClick={() => navigate(backRoute)}
                  className="w-full whitespace-nowrap rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-colors hover:bg-red-700 sm:px-3 sm:py-2 sm:text-sm"
                >
                  {t("gameSettings.buttons.exitGame", {
                    defaultValue: "Exit Game",
                  })}
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

// NoteSelection Header Component (for inline rendering in title row)
function NoteSelectionHeader({
  currentStep,
  settings,
  updateSetting,
  noteData,
  config,
  gameType,
  backRoute,
  title,
  t,
}) {
  const { i18n } = useTranslation("common");
  const { noteIdField = "pitch", clefFilter } = config || {};
  const clefKey = String(settings.clef || "Treble").toLowerCase();
  const isBothClefs = clefKey === "both";
  const enableSharps = !!settings.enableSharps;
  const enableFlats = !!settings.enableFlats;

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

  const selectedCount = settings.selectedNotes?.length || 0;
  const getNoteId = (note) =>
    noteIdField === "note" ? note.note || note.pitch : note.pitch || note.note;

  const getAllNoteIds = useCallback(() => {
    if (clefFilter === "treble") {
      return isBothClefs
        ? trebleNotesList.map((n) => `treble:${getNoteId(n)}`)
        : trebleNotesList.map((n) => getNoteId(n));
    }
    if (clefFilter === "bass") {
      return isBothClefs
        ? bassNotesList.map((n) => `bass:${getNoteId(n)}`)
        : bassNotesList.map((n) => getNoteId(n));
    }
    if (isBothClefs) {
      const trebleIds = trebleNotesList.map((n) => `treble:${getNoteId(n)}`);
      const bassIds = bassNotesList.map((n) => `bass:${getNoteId(n)}`);
      return [...trebleIds, ...bassIds];
    }
    return notes.map((n) => getNoteId(n));
  }, [
    clefFilter,
    isBothClefs,
    trebleNotesList,
    bassNotesList,
    notes,
    getNoteId,
  ]);

  const totalSelectableNotes = getAllNoteIds().length;

  const pruneSelectionForAccidentals = useCallback((selected) => {
    return selected.filter((id) => {
      const baseId = String(id).split(":")[1] || String(id);
      return !baseId.includes("#") && !baseId.includes("b");
    });
  }, []);

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

  const handleSelectAll = () => {
    const allIds = getAllNoteIds();
    updateSetting("selectedNotes", allIds);
  };

  const handleDeselectAll = () => {
    updateSetting("selectedNotes", []);
  };

  return (
    <>
      {/* "Desktop-like" (>=sm): wrap-aware header so narrow landscape screens don't get cramped */}
      <div className="mb-1.5 hidden flex-shrink-0 flex-wrap items-center gap-2 sm:flex">
        {/* Spacer for alignment */}
        <div className="flex flex-shrink-0 max-[720px]:basis-full max-[720px]:justify-end">
          <div className="w-[110px]" />
        </div>

        {/* Title: centered; on narrow widths it becomes its own line */}
        <h2 className="min-w-0 flex-1 text-center text-sm font-bold text-white max-[720px]:order-2 max-[720px]:basis-full sm:text-base">
          {title}
        </h2>

        {/* Controls: on narrow widths, move under the title and center them */}
        <div className="flex flex-shrink-0 items-center gap-2 max-[720px]:order-3 max-[720px]:basis-full max-[720px]:justify-center">
          {/* Accidentals - symbols only */}
          <button
            type="button"
            onClick={toggleSharps}
            aria-pressed={enableSharps}
            className={`rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold transition-colors ${
              enableSharps
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
            title={t("gameSettings.noteSelection.sharps", {
              defaultValue: "Sharps",
            })}
          >
            ♯
          </button>
          <button
            type="button"
            onClick={toggleFlats}
            aria-pressed={enableFlats}
            className={`rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold transition-colors ${
              enableFlats
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
            title={t("gameSettings.noteSelection.flats", {
              defaultValue: "Flats",
            })}
          >
            ♭
          </button>
          {/* Selection actions */}
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
            }
            className={`rounded-full border border-white/30 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-opacity ${
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            }`}
            title={t("gameSettings.noteSelection.selectAll", {
              defaultValue: "Select all",
            })}
          >
            {t("gameSettings.noteSelection.selectAllShort", {
              defaultValue: "All",
            })}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            className={`rounded-full border border-white/30 bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-opacity ${
              selectedCount === 0
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            }`}
            title={t("gameSettings.noteSelection.deselectAll", {
              defaultValue: "Deselect all",
            })}
          >
            {t("gameSettings.noteSelection.deselectAllShort", {
              defaultValue: "Clear",
            })}
          </button>
        </div>
      </div>

      {/* Mobile: Title and Controls */}
      <div className="mb-1.5 flex flex-shrink-0 flex-col gap-1 sm:hidden">
        <h2 className="text-center text-sm font-bold text-white sm:text-base">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={toggleSharps}
            aria-pressed={enableSharps}
            className={`rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition-colors ${
              enableSharps
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            ♯
          </button>
          <button
            type="button"
            onClick={toggleFlats}
            aria-pressed={enableFlats}
            className={`rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition-colors ${
              enableFlats
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-white/80 hover:bg-white/15"
            }`}
          >
            ♭
          </button>
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
            }
            className={`rounded-full border border-white/30 bg-emerald-600 px-5 py-2 text-sm font-semibold text-white/90 transition-opacity ${
              totalSelectableNotes === 0 ||
              selectedCount === totalSelectableNotes
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/15"
            }`}
          >
            {t("gameSettings.noteSelection.selectAllShort", {
              defaultValue: "All",
            })}
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={selectedCount === 0}
            className={`rounded-full border border-white/30 bg-indigo-600 px-5 py-2 text-sm font-semibold text-white/90 transition-opacity ${
              selectedCount === 0
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/15"
            }`}
          >
            {t("gameSettings.noteSelection.deselectAllShort", {
              defaultValue: "Clear",
            })}
          </button>
        </div>
      </div>
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
  hideHeader = false,
}) {
  const { t, i18n } = useTranslation("common");
  const {
    showImages = false,
    minNotes = 2,
    noteIdField = "pitch",
    selectAllByDefault = false,
    clefFilter,
  } = config;
  const clefKey = String(settings.clef || "Treble").toLowerCase();
  const isBothClefsSelection = clefKey === "both";
  const isSplitClef = clefFilter === "treble" || clefFilter === "bass";
  const isBothClefsLayout = isBothClefsSelection && !isSplitClef;
  const enableSharps = !!settings.enableSharps;
  const enableFlats = !!settings.enableFlats;
  const makeClefQualifiedId = useCallback(
    (rowKey, baseId) => {
      if (!baseId) return null;
      return isBothClefsSelection ? `${rowKey}:${baseId}` : baseId;
    },
    [isBothClefsSelection]
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
    if (clefFilter === "treble") return trebleNotesList;
    if (clefFilter === "bass") return bassNotesList;
    if (clefKey === "bass") return bassNotesList;
    if (isBothClefsSelection) return [...trebleNotesList, ...bassNotesList];
    return trebleNotesList;
  }, [
    bassNotesList,
    clefFilter,
    clefKey,
    isBothClefsSelection,
    trebleNotesList,
  ]);

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
    const shouldScrollBass =
      clefFilter === "bass" ||
      clefKey === "bass" ||
      (clefKey === "both" && !clefFilter);

    if (
      shouldScrollBass &&
      (clefFilter
        ? scrollContainerRef.current
        : clefKey === "bass"
          ? scrollContainerRef.current
          : bassScrollContainerRef.current) &&
      !hasScrolledToC4Ref.current
    ) {
      const listToScroll =
        clefFilter === "bass"
          ? noteCards
          : clefKey === "bass"
            ? noteCards
            : bassNotesList;
      const targetContainer = clefFilter
        ? scrollContainerRef.current
        : clefKey === "bass"
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
    if (!shouldScrollBass) {
      hasScrolledToC4Ref.current = false;
    }
  }, [bassNotesList, clefFilter, clefKey, noteCards]);

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
    if (!isBothClefsSelection) return noteCards;
    if (clefFilter === "treble" || clefFilter === "bass") {
      // Split-step mode: still use clef-qualified IDs when the global clef is "both".
      return noteCards.map((note) => ({
        ...note,
        __selectionRowKey: clefFilter,
      }));
    }
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
  }, [
    bassNotesList,
    clefFilter,
    isBothClefsSelection,
    noteCards,
    trebleNotesList,
  ]);

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
      {/* Header (ultra-compact for mobile to maximize note card space) - hidden when controls are in title */}
      {!hideHeader && (
        <div className="mb-1.5 flex flex-shrink-0 flex-col gap-1">
          {/* Single row: Selected count + Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-white/80 sm:text-xs">
            {/* Selected count on left */}
            <p className="flex-shrink-0 text-[10px] font-medium text-white/80 sm:text-xs">
              {t("gameSettings.noteSelection.selectedCount", {
                count: selectedCount,
              })}
            </p>

            {/* Controls on right - compact buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Accidentals toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleSharps}
                  aria-pressed={enableSharps}
                  className={`rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold transition-colors ${
                    enableSharps
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }`}
                >
                  <span className="sm:hidden">♯</span>
                  <span className="hidden sm:inline">
                    ♯{" "}
                    {t("gameSettings.noteSelection.sharps", {
                      defaultValue: "Sharps",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={toggleFlats}
                  aria-pressed={enableFlats}
                  className={`rounded-full border border-white/30 px-3 py-1.5 text-xs font-semibold transition-colors ${
                    enableFlats
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-white/80 hover:bg-white/15"
                  }`}
                >
                  <span className="sm:hidden">♭</span>
                  <span className="hidden sm:inline">
                    ♭{" "}
                    {t("gameSettings.noteSelection.flats", {
                      defaultValue: "Flats",
                    })}
                  </span>
                </button>
              </div>

              {/* Selection actions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={
                    totalSelectableNotes === 0 ||
                    selectedCount === totalSelectableNotes
                  }
                  className={`rounded-full border border-white/30 bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-opacity ${
                    totalSelectableNotes === 0 ||
                    selectedCount === totalSelectableNotes
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
                  }`}
                >
                  <span className="sm:hidden">
                    {t("gameSettings.noteSelection.selectAllShort", {
                      defaultValue: "All",
                    })}
                  </span>
                  <span className="hidden sm:inline">
                    {t("gameSettings.noteSelection.selectAll", {
                      defaultValue: "Select all",
                    })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={selectedCount === 0}
                  className={`rounded-full border border-white/30 bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-opacity ${
                    selectedCount === 0
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
                  }`}
                >
                  <span className="sm:hidden">
                    {t("gameSettings.noteSelection.deselectAllShort", {
                      defaultValue: "Clear",
                    })}
                  </span>
                  <span className="hidden sm:inline">
                    {t("gameSettings.noteSelection.deselectAll", {
                      defaultValue: "Deselect all",
                    })}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable note cards container */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm">
        {(() => {
          const isHebrew = i18n.language === "he";

          const renderRow = (rowNotes, { rowKey, rowRef }) => (
            <div
              className={`min-h-0 flex-1 overflow-hidden ${
                clefFilter ? "note-selection-split-row" : ""
              }`}
            >
              <div
                ref={rowRef}
                className={`scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden ${
                  clefFilter ? "items-stretch" : "items-center"
                } ${
                  isBothClefsLayout
                    ? "gap-1.5 px-2 py-1 sm:gap-2 sm:px-3 sm:py-2 lg:gap-3"
                    : "gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-4 sm:py-3 lg:gap-4"
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
                      className={`${isBothClefsLayout ? "note-card-two-row" : "note-card-responsive"} relative flex snap-center flex-col items-center justify-between overflow-hidden rounded-xl transition-all duration-200 lg:rounded-2xl ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ring-2 ring-white/50"
                          : "bg-white/10 text-white/90 hover:bg-white/20 hover:ring-1 hover:ring-white/30"
                      }`}
                    >
                      {/* Image area */}
                      {showImages && note.ImageComponent ? (
                        <div
                          className={`flex w-full flex-1 items-center justify-center overflow-hidden ${
                            isBothClefsLayout
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
                            isBothClefsLayout
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
                          isBothClefsLayout
                            ? "py-0.5 text-[9px] sm:py-1 sm:text-[10px] lg:py-1 lg:text-[11px]"
                            : "py-1 text-[10px] sm:py-1.5 sm:text-[11px] lg:py-2 lg:text-xs"
                        } ${isSelected ? "bg-black/10" : "bg-black/5"}`}
                      >
                        {displayName}
                        {displayPitch ? (
                          <span
                            className={`ml-1 opacity-70 ${
                              isBothClefsLayout
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

          if (!isBothClefsLayout) {
            return renderRow(noteCards, {
              rowKey: clefFilter || "single",
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
  const { t } = useTranslation("common");
  const timeSignatures = config.timeSignatures || [
    { name: "4/4", beats: 4, subdivision: 16 },
    { name: "3/4", beats: 3, subdivision: 12 },
    { name: "2/4", beats: 2, subdivision: 8 },
  ];

  const showRhythmOptions = Boolean(config?.showRhythmOptions);
  const rhythmComplexity =
    settings.rhythmComplexity === "complex" ? "complex" : "simple";

  // Use rhythm pattern archetypes for visual notation-based selection
  const notePatternOptions = SIMPLE_NOTE_PATTERNS.map((pattern) => ({
    id: pattern.durationId,
    label: pattern.label,
    aria: pattern.label,
    events: pattern.events,
  }));

  const restPatternOptions = SIMPLE_REST_PATTERNS.map((pattern) => ({
    id: pattern.durationId,
    label: pattern.label,
    aria: pattern.label,
    events: pattern.events,
  }));

  const rhythmSettings = settings.rhythmSettings || {
    allowedNoteDurations: ["q", "8"],
    allowRests: false,
    allowedRestDurations: ["q", "8"],
    enabledComplexPatterns: getAllComplexPatternIds(),
  };

  const allowedNoteDurations = Array.isArray(
    rhythmSettings.allowedNoteDurations
  )
    ? rhythmSettings.allowedNoteDurations
    : [];
  const allowedRestDurations = Array.isArray(
    rhythmSettings.allowedRestDurations
  )
    ? rhythmSettings.allowedRestDurations
    : [];
  const allowRests = Boolean(rhythmSettings.allowRests);
  // For complex mode, track which complex patterns are enabled (default: all)
  const enabledComplexPatterns = Array.isArray(
    rhythmSettings.enabledComplexPatterns
  )
    ? rhythmSettings.enabledComplexPatterns
    : getAllComplexPatternIds();

  const updateRhythmSettings = (patch) => {
    updateSetting("rhythmSettings", { ...rhythmSettings, ...patch });
  };

  const toggleDuration = (list, id) => {
    const has = list.includes(id);
    return has ? list.filter((x) => x !== id) : [...list, id];
  };

  const toggleComplexPattern = (id) => {
    const has = enabledComplexPatterns.includes(id);
    return has
      ? enabledComplexPatterns.filter((x) => x !== id)
      : [...enabledComplexPatterns, id];
  };

  return (
    <div className={allowRests ? "space-y-2" : "space-y-1.5 sm:space-y-2"}>
      <div
        className={`grid grid-cols-3 ${allowRests ? "gap-1.5 sm:gap-2" : "gap-1 sm:gap-1.5"}`}
      >
        {timeSignatures.map((timeSig) => (
          <button
            key={timeSig.name}
            onClick={() => updateSetting("timeSignature", timeSig)}
            className={`rounded-lg transition-colors ${
              allowRests
                ? "p-2 text-sm sm:p-3 sm:text-base"
                : "p-1.5 text-xs sm:p-2 sm:text-sm md:p-3 md:text-base"
            } ${
              settings.timeSignature?.name === timeSig.name
                ? "bg-indigo-600 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {timeSig.name}
          </button>
        ))}
      </div>

      {showRhythmOptions ? (
        <div
          className={`mt-2 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm sm:mt-3 ${
            allowRests
              ? "space-y-3 p-3"
              : "space-y-1.5 p-2 sm:space-y-2 sm:p-2.5"
          }`}
        >
          <div className={allowRests ? "space-y-2" : "space-y-1"}>
            <div className="text-[11px] font-semibold text-white/80 sm:text-xs">
              {t("gameSettings.rhythmSettings.noteValuesLabel", {
                defaultValue: "Allowed note values",
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {notePatternOptions.map((opt) => {
                const selected = allowedNoteDurations.includes(opt.id);
                return (
                  <button
                    key={`note-${opt.id}`}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      updateRhythmSettings({
                        allowedNoteDurations: toggleDuration(
                          allowedNoteDurations,
                          opt.id
                        ),
                      })
                    }
                    className={`flex touch-manipulation items-center justify-center rounded-lg border transition-colors ${
                      allowRests
                        ? "min-h-[64px] min-w-[88px] p-2"
                        : "min-h-[58px] min-w-[80px] p-1.5 sm:min-h-[64px] sm:min-w-[88px] sm:p-2"
                    } ${
                      selected
                        ? "border-white/40 bg-indigo-600"
                        : "border-white/20 bg-white/10 hover:bg-white/15"
                    }`}
                    title={opt.aria}
                  >
                    <RhythmPatternPreview
                      events={opt.events}
                      width={allowRests ? 84 : 76}
                      height={allowRests ? 60 : 54}
                      noteColor={selected ? "#ffffff" : "rgba(255,255,255,0.9)"}
                      ariaLabel={opt.aria}
                    />
                  </button>
                );
              })}
            </div>
            {allowedNoteDurations.length === 0 ? (
              <div className="text-center text-[10px] font-medium text-amber-200 sm:text-xs">
                {t("gameSettings.rhythmSettings.noteValuesRequired", {
                  defaultValue: "Select at least one note value to continue.",
                })}
              </div>
            ) : null}
          </div>

          <div className={allowRests ? "space-y-2" : "space-y-1"}>
            <div className="text-center text-[11px] font-semibold text-white/80 sm:text-xs">
              {t("gameSettings.rhythmSettings.complexityLabel", {
                defaultValue: "Rhythm complexity",
              })}
            </div>
            <div className="flex justify-center">
              <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-white/10">
                <button
                  type="button"
                  aria-pressed={rhythmComplexity === "simple"}
                  onClick={() => updateSetting("rhythmComplexity", "simple")}
                  className={`touch-manipulation text-xs font-semibold transition-colors sm:text-sm ${
                    allowRests ? "px-4 py-2" : "px-3 py-1.5 sm:px-4 sm:py-2"
                  } ${
                    rhythmComplexity === "simple"
                      ? "bg-indigo-600 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {t("gameSettings.rhythmSettings.simpleLabel", {
                    defaultValue: "Simple rhythm",
                  })}
                </button>
                <button
                  type="button"
                  aria-pressed={rhythmComplexity === "complex"}
                  onClick={() => updateSetting("rhythmComplexity", "complex")}
                  className={`touch-manipulation text-xs font-semibold transition-colors sm:text-sm ${
                    allowRests ? "px-4 py-2" : "px-3 py-1.5 sm:px-4 sm:py-2"
                  } ${
                    rhythmComplexity === "complex"
                      ? "bg-indigo-600 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {t("gameSettings.rhythmSettings.complexLabel", {
                    defaultValue: "Complex rhythm",
                  })}
                </button>
              </div>
            </div>
            <div className="text-center text-[11px] font-medium text-white/60">
              {rhythmComplexity === "simple"
                ? t("gameSettings.rhythmSettings.simpleHint", {
                    defaultValue:
                      "Pairs eighth notes together (no syncopation).",
                  })
                : t("gameSettings.rhythmSettings.complexHint", {
                    defaultValue:
                      "Select which syncopated patterns to include:",
                  })}
            </div>
            {rhythmComplexity === "complex" ? (
              <div className="mt-1 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {COMPLEX_EXAMPLE_PATTERNS.map((pattern) => {
                  const selected = enabledComplexPatterns.includes(pattern.id);
                  return (
                    <button
                      key={pattern.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        updateRhythmSettings({
                          enabledComplexPatterns: toggleComplexPattern(
                            pattern.id
                          ),
                        })
                      }
                      className={`flex touch-manipulation items-center justify-center rounded-lg border p-1.5 transition-colors ${
                        selected
                          ? "border-white/40 bg-indigo-600"
                          : "border-white/20 bg-white/10 hover:bg-white/15"
                      }`}
                      title={pattern.label}
                    >
                      <RhythmPatternPreview
                        events={pattern.events}
                        width={pattern.totalUnits > 4 ? 110 : 84}
                        height={54}
                        noteColor={
                          selected ? "#ffffff" : "rgba(255,255,255,0.7)"
                        }
                        ariaLabel={pattern.label}
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
            {rhythmComplexity === "complex" &&
            enabledComplexPatterns.length === 0 ? (
              <div className="text-center text-[10px] font-medium text-amber-200 sm:text-xs">
                {t("gameSettings.rhythmSettings.complexPatternsRequired", {
                  defaultValue:
                    "Select at least one complex pattern to continue.",
                })}
              </div>
            ) : null}
          </div>

          <div className={allowRests ? "space-y-2" : "space-y-1"}>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="text-[11px] font-semibold text-white/80 sm:text-xs">
                {t("gameSettings.rhythmSettings.allowRestsLabel", {
                  defaultValue: "Allow rests",
                })}
              </span>
              <button
                type="button"
                aria-pressed={allowRests}
                onClick={() =>
                  updateRhythmSettings({
                    allowRests: !allowRests,
                    allowedRestDurations:
                      !allowRests && allowedRestDurations.length === 0
                        ? allowedNoteDurations.length > 0
                          ? allowedNoteDurations
                          : ["q", "8"]
                        : allowedRestDurations,
                  })
                }
                className={`touch-manipulation rounded-full border text-xs font-semibold transition-colors sm:text-sm ${
                  allowRests ? "px-4 py-2" : "px-3 py-1.5 sm:px-4 sm:py-2"
                } ${
                  allowRests
                    ? "border-white/40 bg-purple-600 text-white"
                    : "border-white/20 bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {allowRests
                  ? t("common.enabled", { defaultValue: "On" })
                  : t("common.disabled", { defaultValue: "Off" })}
              </button>
            </div>

            {allowRests ? (
              <div className="space-y-2">
                <div className="text-center text-xs font-semibold text-white/80">
                  {t("gameSettings.rhythmSettings.restValuesLabel", {
                    defaultValue: "Allowed rest values",
                  })}
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                  {restPatternOptions.map((opt) => {
                    const selected = allowedRestDurations.includes(opt.id);
                    return (
                      <button
                        key={`rest-${opt.id}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          updateRhythmSettings({
                            allowedRestDurations: toggleDuration(
                              allowedRestDurations,
                              opt.id
                            ),
                          })
                        }
                        className={`flex min-h-[64px] min-w-[88px] touch-manipulation items-center justify-center rounded-lg border p-2 transition-colors ${
                          selected
                            ? "border-white/40 bg-emerald-600"
                            : "border-white/20 bg-white/10 hover:bg-white/15"
                        }`}
                        title={opt.aria}
                      >
                        <RhythmPatternPreview
                          events={opt.events}
                          width={84}
                          height={60}
                          noteColor={
                            selected ? "#ffffff" : "rgba(255,255,255,0.9)"
                          }
                          ariaLabel={opt.aria}
                        />
                      </button>
                    );
                  })}
                </div>
                {allowedRestDurations.length === 0 ? (
                  <div className="text-center text-xs font-medium text-amber-200">
                    {t("gameSettings.rhythmSettings.restValuesRequired", {
                      defaultValue:
                        "Select at least one rest value (or disable rests) to continue.",
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Step Component: Bars Per Exercise Selection (Phase 2: 1/2/4/8 bars)
function BarsPerExerciseSelection({ settings, updateSetting, config }) {
  const { t } = useTranslation("common");
  const options = Array.isArray(config?.options) ? config.options : [1, 2, 4, 8];
  const enabled = Array.isArray(config?.enabledOptions)
    ? new Set(config.enabledOptions)
    : new Set([1, 2, 4, 8]);

  const currentValue = Number(settings.measuresPerPattern || 1);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-white">
          {t("gameSettings.barsPerExercise.title", {
            defaultValue: "How many bars?",
          })}
        </div>
        <div className="text-xs text-white/70">
          {t("gameSettings.barsPerExercise.subtitle", {
            defaultValue: "Choose how many bars to play in each exercise.",
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((value) => {
          const isEnabled = enabled.has(value);
          const isSelected = currentValue === value;
          return (
            <button
              key={value}
              type="button"
              disabled={!isEnabled}
              onClick={() => {
                if (!isEnabled) return;
                updateSetting("measuresPerPattern", value);
              }}
              className={`rounded-lg px-3 py-3 text-center text-sm font-semibold transition-colors ${
                !isEnabled
                  ? "cursor-not-allowed bg-white/10 text-white/40"
                  : isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <div>{value}</div>
              {!isEnabled ? (
                <div className="mt-1 text-[10px] font-normal text-white/40">
                  {t("gameSettings.barsPerExercise.comingSoon", {
                    defaultValue: "Coming soon",
                  })}
                </div>
              ) : null}
            </button>
          );
        })}
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
