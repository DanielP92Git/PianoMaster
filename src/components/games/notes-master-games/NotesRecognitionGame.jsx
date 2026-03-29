import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock3, Loader2, Heart, Zap } from "lucide-react";
import flameIcon from "../../../assets/icons/flame.png";
import { AnimatePresence, motion } from "framer-motion";
import BackButton from "../../ui/BackButton";
import { Firework } from "../../animations/Firework";
import VictoryScreen from "../VictoryScreen";
import GameOverScreen from "../GameOverScreen";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { UnifiedGameSettings } from "../shared/UnifiedGameSettings";
import { useGameSettings } from "../../../features/games/hooks/useGameSettings";
import { useGameProgress } from "../../../features/games/hooks/useGameProgress";
import { useSounds } from "../../../features/games/hooks/useSounds";
import {
  TREBLE_NOTES,
  BASS_NOTES,
} from "../sight-reading-game/constants/gameSettings";
import { normalizeSelectedNotes } from "../shared/noteSelectionUtils";
import { useTranslation } from "react-i18next";
import { NoteImageDisplay } from "./NoteImageDisplay";
import { useMotionTokens } from "../../../utils/useMotionTokens";
import { getNodeById } from "../../../data/skillTrail";
import { useSessionTimeout } from "../../../contexts/SessionTimeoutContext";
import { useLandscapeLock } from "../../../hooks/useLandscapeLock";
import { useRotatePrompt } from "../../../hooks/useRotatePrompt";
import { RotatePromptOverlay } from "../../orientation/RotatePromptOverlay";
import { useMicNoteInput } from "../../../hooks/useMicNoteInput";
import { calcMicTimingFromBpm } from "../../../hooks/micInputPresets";
import { useAudioContext } from "../../../contexts/AudioContextProvider";
import { useAccessibility } from "../../../contexts/AccessibilityContext";
import { AudioInterruptedOverlay } from "../shared/AudioInterruptedOverlay.jsx";

// Use comprehensive note definitions from Sight Reading game
const trebleNotes = TREBLE_NOTES;
const bassNotes = BASS_NOTES;

// Audio level threshold for note release detection (percentage)
const RELEASE_THRESHOLD = 1.5; // 1.5% - low enough to catch release, high enough to avoid background noise


const NOTE_AUDIO_LOADERS = {
  B0: () => import("../../../assets/sounds/piano/B0.wav"),
  C1: () => import("../../../assets/sounds/piano/C1.wav"),
  Db1: () => import("../../../assets/sounds/piano/Db1.wav"),
  D1: () => import("../../../assets/sounds/piano/D1.wav"),
  Eb1: () => import("../../../assets/sounds/piano/Eb1.wav"),
  E1: () => import("../../../assets/sounds/piano/E1.wav"),
  F1: () => import("../../../assets/sounds/piano/F1.wav"),
  Gb1: () => import("../../../assets/sounds/piano/Gb1.wav"),
  G1: () => import("../../../assets/sounds/piano/G1.wav"),
  Ab1: () => import("../../../assets/sounds/piano/Ab1.wav"),
  A1: () => import("../../../assets/sounds/piano/A1.wav"),
  Bb1: () => import("../../../assets/sounds/piano/Bb1.wav"),
  B1: () => import("../../../assets/sounds/piano/B1.wav"),
  C2: () => import("../../../assets/sounds/piano/C2.wav"),
  Db2: () => import("../../../assets/sounds/piano/Db2.wav"),
  D2: () => import("../../../assets/sounds/piano/D2.wav"),
  Eb2: () => import("../../../assets/sounds/piano/Eb2.wav"),
  E2: () => import("../../../assets/sounds/piano/E2.wav"),
  F2: () => import("../../../assets/sounds/piano/F2.wav"),
  Gb2: () => import("../../../assets/sounds/piano/Gb2.wav"),
  G2: () => import("../../../assets/sounds/piano/G2.wav"),
  Ab2: () => import("../../../assets/sounds/piano/Ab2.wav"),
  A2: () => import("../../../assets/sounds/piano/A2.wav"),
  Bb2: () => import("../../../assets/sounds/piano/Bb2.wav"),
  B2: () => import("../../../assets/sounds/piano/B2.wav"),
  C3: () => import("../../../assets/sounds/piano/C3.wav"),
  Db3: () => import("../../../assets/sounds/piano/Db3.wav"),
  D3: () => import("../../../assets/sounds/piano/D3.wav"),
  Eb3: () => import("../../../assets/sounds/piano/Eb3.wav"),
  E3: () => import("../../../assets/sounds/piano/E3.wav"),
  F3: () => import("../../../assets/sounds/piano/F3.wav"),
  Gb3: () => import("../../../assets/sounds/piano/Gb3.wav"),
  G3: () => import("../../../assets/sounds/piano/G3.wav"),
  Ab3: () => import("../../../assets/sounds/piano/Ab3.wav"),
  A3: () => import("../../../assets/sounds/piano/A3.wav"),
  Bb3: () => import("../../../assets/sounds/piano/Bb3.wav"),
  B3: () => import("../../../assets/sounds/piano/B3.wav"),
  C4: () => import("../../../assets/sounds/piano/C4.wav"),
  Db4: () => import("../../../assets/sounds/piano/Db4.wav"),
  D4: () => import("../../../assets/sounds/piano/D4.wav"),
  Eb4: () => import("../../../assets/sounds/piano/Eb4.wav"),
  E4: () => import("../../../assets/sounds/piano/E4.wav"),
  F4: () => import("../../../assets/sounds/piano/F4.wav"),
  Gb4: () => import("../../../assets/sounds/piano/Gb4.wav"),
  G4: () => import("../../../assets/sounds/piano/G4.wav"),
  Ab4: () => import("../../../assets/sounds/piano/Ab4.wav"),
  A4: () => import("../../../assets/sounds/piano/A4.wav"),
  Bb4: () => import("../../../assets/sounds/piano/Bb4.wav"),
  B4: () => import("../../../assets/sounds/piano/B4.wav"),
  C5: () => import("../../../assets/sounds/piano/C5.wav"),
  Db5: () => import("../../../assets/sounds/piano/Db5.wav"),
  D5: () => import("../../../assets/sounds/piano/D5.wav"),
  Eb5: () => import("../../../assets/sounds/piano/Eb5.wav"),
  E5: () => import("../../../assets/sounds/piano/E5.wav"),
  F5: () => import("../../../assets/sounds/piano/F5.wav"),
  Gb5: () => import("../../../assets/sounds/piano/Gb5.wav"),
  G5: () => import("../../../assets/sounds/piano/G5.wav"),
  Ab5: () => import("../../../assets/sounds/piano/Ab5.wav"),
  A5: () => import("../../../assets/sounds/piano/A5.wav"),
  Bb5: () => import("../../../assets/sounds/piano/Bb5.wav"),
  B5: () => import("../../../assets/sounds/piano/B5.wav"),
  C6: () => import("../../../assets/sounds/piano/C6.wav"),
  Db6: () => import("../../../assets/sounds/piano/Db6.wav"),
  D6: () => import("../../../assets/sounds/piano/D6.wav"),
  Eb6: () => import("../../../assets/sounds/piano/Eb6.wav"),
  E6: () => import("../../../assets/sounds/piano/E6.wav"),
  F6: () => import("../../../assets/sounds/piano/F6.wav"),
  Gb6: () => import("../../../assets/sounds/piano/Gb6.wav"),
  G6: () => import("../../../assets/sounds/piano/G6.wav"),
  Ab6: () => import("../../../assets/sounds/piano/Ab6.wav"),
  A6: () => import("../../../assets/sounds/piano/A6.wav"),
  Bb6: () => import("../../../assets/sounds/piano/Bb6.wav"),
  B6: () => import("../../../assets/sounds/piano/B6.wav"),
  C7: () => import("../../../assets/sounds/piano/C7.wav"),
  Db7: () => import("../../../assets/sounds/piano/Db7.wav"),
  D7: () => import("../../../assets/sounds/piano/D7.wav"),
  Eb7: () => import("../../../assets/sounds/piano/Eb7.wav"),
  E7: () => import("../../../assets/sounds/piano/E7.wav"),
  F7: () => import("../../../assets/sounds/piano/F7.wav"),
  Gb7: () => import("../../../assets/sounds/piano/Gb7.wav"),
  G7: () => import("../../../assets/sounds/piano/G7.wav"),
  Ab7: () => import("../../../assets/sounds/piano/Ab7.wav"),
  A7: () => import("../../../assets/sounds/piano/A7.wav"),
  Bb7: () => import("../../../assets/sounds/piano/Bb7.wav"),
  B7: () => import("../../../assets/sounds/piano/B7.wav"),
};

// Fallback Hebrew note mappings for environments missing pitch-specific samples
const FALLBACK_NOTE_AUDIO_LOADERS = {
  treble: {
    דו: () => import("../../../assets/sounds/piano/C4.wav"),
    רה: () => import("../../../assets/sounds/piano/D4.wav"),
    מי: () => import("../../../assets/sounds/piano/E4.wav"),
    פה: () => import("../../../assets/sounds/piano/F4.wav"),
    סול: () => import("../../../assets/sounds/piano/G4.wav"),
    לה: () => import("../../../assets/sounds/piano/A4.wav"),
    סי: () => import("../../../assets/sounds/piano/B4.wav"),
  },
  bass: {
    דו: () => import("../../../assets/sounds/piano/C2.wav"),
    רה: () => import("../../../assets/sounds/piano/D2.wav"),
    מי: () => import("../../../assets/sounds/piano/E2.wav"),
    פה: () => import("../../../assets/sounds/piano/F2.wav"),
    סול: () => import("../../../assets/sounds/piano/G2.wav"),
    לה: () => import("../../../assets/sounds/piano/A2.wav"),
    סי: () => import("../../../assets/sounds/piano/B2.wav"),
  },
};

// Normalize pitch strings to match NOTE_AUDIO_LOADERS keys (e.g. Db4, F#4).
const normalizePitchKey = (value) => {
  if (!value) return null;
  const raw = String(value).trim().replace(/\s+/g, "");
  const match = raw.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return raw;
  const [, letter, accidental, octave] = match;
  const acc = accidental === "b" ? "b" : accidental === "#" ? "#" : "";
  return `${letter.toUpperCase()}${acc}${octave}`;
};

const isAccidentalPitch = (pitch) => {
  if (!pitch) return false;
  const p = String(pitch);
  return p.includes("#") || p.includes("b");
};

const naturalBasePitch = (pitch) => {
  if (!pitch) return null;
  const raw = String(pitch).trim().replace(/\s+/g, "");
  // Eb4 -> E4, F#3 -> F3, C4 -> C4
  const match = raw.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return raw;
  const [, letter, , octave] = match;
  return `${letter.toUpperCase()}${octave}`;
};

const SHARP_TO_FLAT_MAP = {
  C: "Db",
  D: "Eb",
  F: "Gb",
  G: "Ab",
  A: "Bb",
};

const toFlatEnharmonic = (pitchKey) => {
  if (!pitchKey || !pitchKey.includes("#")) return null;
  const match = pitchKey.match(/^([A-G])#(\d)$/);
  if (!match) return null;
  const [, letter, octave] = match;
  const flatRoot = SHARP_TO_FLAT_MAP[letter];
  return flatRoot ? `${flatRoot}${octave}` : null;
};

const getClefTypeForPitch = (pitch) => {
  if (!pitch) return "treble";
  const match = String(pitch).match(/([A-G])(\d+)/i);
  if (!match) return "treble";
  const octave = Number(match[2]);
  // Treat C4 and above as treble, below as bass.
  return octave >= 4 ? "treble" : "bass";
};

const getAudioConfigForNote = (note, clefType) => {
  if (!note) return null;

  let pitchKey = normalizePitchKey(note.englishName || note.pitch);

  // Handle special enharmonic sharps: E# → F, B# → C (next octave)
  // Visuals should remain E#/B# when enabled; audio must use available piano samples.
  if (pitchKey) {
    const sharpMatch = pitchKey.match(/^([A-G])#(\d)$/);
    if (sharpMatch) {
      const [, letter, octave] = sharpMatch;
      if (letter === "E") {
        pitchKey = `F${octave}`;
      } else if (letter === "B") {
        pitchKey = `C${parseInt(octave, 10) + 1}`;
      }
    }
  }

  // Handle special enharmonic cases: Cb → B, Fb → E
  if (pitchKey) {
    const match = pitchKey.match(/^([A-G])b(\d)$/);
    if (match) {
      const [, letter, octave] = match;
      if (letter === "C") {
        // Cb → B (previous octave)
        pitchKey = `B${parseInt(octave) - 1}`;
      } else if (letter === "F") {
        // Fb → E (same octave)
        pitchKey = `E${octave}`;
      }
    }
  }

  if (pitchKey && !NOTE_AUDIO_LOADERS[pitchKey] && pitchKey.includes("#")) {
    const enharmonic = toFlatEnharmonic(pitchKey);
    if (enharmonic && NOTE_AUDIO_LOADERS[enharmonic]) {
      pitchKey = enharmonic;
    }
  }

  if (pitchKey && NOTE_AUDIO_LOADERS[pitchKey]) {
    return { key: pitchKey, loader: NOTE_AUDIO_LOADERS[pitchKey] };
  }

  const fallbackLoader = FALLBACK_NOTE_AUDIO_LOADERS[clefType]?.[note.note];
  if (fallbackLoader) {
    return { key: `${clefType}-${note.note}`, loader: fallbackLoader };
  }

  return null;
};

const NOTE_ORDER_SEQUENCE = ["C", "D", "E", "F", "G", "A", "B"];

const getBaseLetterFromNote = (noteObj) => {
  if (!noteObj) return "";
  const normalized = normalizePitchKey(
    noteObj.pitch || noteObj.englishName || ""
  );
  if (!normalized) return "";
  const match = normalized.match(/^([A-G])/);
  return match ? match[1] : "";
};

const isAccidentalNote = (noteObj) => {
  if (!noteObj) return false;
  if (
    noteObj.note &&
    (noteObj.note.includes("♭") || noteObj.note.includes("♯"))
  ) {
    return true;
  }
  return isAccidentalPitch(noteObj.pitch || noteObj.englishName);
};

const stripAccidentalGlyphs = (value) => {
  if (!value) return "";
  return String(value).replace(/[♭♯]/g, "");
};

const accidentalRank = (noteObj) => {
  if (!noteObj) return 0;
  const label = String(noteObj.note || "");
  const pitch = String(noteObj.pitch || noteObj.englishName || "");
  if (label.includes("♭") || pitch.includes("b")) return 1;
  if (label.includes("♯") || pitch.includes("#")) return 2;
  return 0; // natural first
};

// Simple timer display component
const TimerDisplay = ({ formattedTime }) => {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
      <Clock3 className="h-4 w-4 text-white/80" />
      <span className="text-xs font-semibold text-white/80 sm:text-sm">
        {t("games.time")}
      </span>
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
        {formattedTime || "00:00"}
      </span>
    </div>
  );
};

const StageCard = ({ children, className = "" }) => (
  <div
    // NOTE: `backdrop-blur` + an extra "sheen" overlay can cause flickering/white banding
    // artifacts in some browsers/GPU combos. Keep this card simple and stable.
    className={`relative rounded-3xl border border-white/20 bg-white/10 p-4 shadow-none ${className}`}
  >
    <div className="relative">{children}</div>
  </div>
);

// Progress bar component to track answered questions
const ProgressBar = ({ current, total }) => {
  const { t } = useTranslation("common");
  const { soft } = useMotionTokens();
  const progressPercent = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/10 shadow-inner">
        <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/10" />
        <motion.div
          className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 shadow-[0_4px_16px_rgba(99,102,241,0.2)]"
          animate={{ scaleX: progressPercent / 100 }}
          initial={false}
          transition={soft}
          style={{ willChange: "transform" }}
        />

        {/* Checkpoints */}
        {[0, 25, 50, 75, 100].map((p) => {
          const isStart = p === 0;
          const isEnd = p === 100;
          const xClass = isStart
            ? "translate-x-0"
            : isEnd
              ? "-translate-x-full"
              : "-translate-x-1/2";

          return (
            <span
              key={p}
              className={`absolute top-1/2 h-2.5 w-2.5 ${xClass} -translate-y-1/2 rounded-full border ${
                progressPercent >= p
                  ? "border-white/40 bg-white/80"
                  : "border-white/20 bg-white/10"
              }`}
              style={{ left: isStart ? "0%" : isEnd ? "100%" : `${p}%` }}
            />
          );
        })}

      </div>

      <div className="mt-2 text-xs font-semibold text-white/75">
        <span>
          {t('noteRecognition.questionProgress', { current: Math.min(total, Math.max(1, current + 1)), total })}
        </span>
      </div>
    </div>
  );
};

// === Engagement constants (outside component to avoid re-creation) ===
const COMBO_TIERS = [
  { min: 0, multiplier: 1 },
  { min: 3, multiplier: 2 },
  { min: 8, multiplier: 3 },
];
const SPEED_BONUS_THRESHOLD_MS = 3000;
const BASE_XP = 5;
const INITIAL_LIVES = 3;
const ON_FIRE_THRESHOLD = 5;
const MAX_EXTRA_NOTES = 3;
const GROW_INTERVAL = 3; // Reveal next hidden note every 3-combo

/**
 * Build the initial visible note pool and hidden notes queue for trail auto-grow.
 * Discovery nodes (has focusNotes + contextNotes): start with contextNotes visible,
 * focusNotes hidden and revealed via combo milestones.
 * Practice nodes (empty focusNotes) or first-ever nodes (empty contextNotes):
 * start with full notePool, nothing hidden.
 *
 * @param {string} nodeId - Trail node ID
 * @returns {{ initialNotes: string[], hiddenNotes: string[] }}
 */
// eslint-disable-next-line react-refresh/only-export-components -- component and helper exports are co-located intentionally; HMR-only dev concern
export function buildInitialTrailPool(nodeId) {
  if (!nodeId) return { initialNotes: [], hiddenNotes: [] };

  const node = getNodeById(nodeId);
  if (!node?.noteConfig) return { initialNotes: [], hiddenNotes: [] };

  const { notePool = [], focusNotes = [], contextNotes = [] } = node.noteConfig;

  // Discovery nodes with both focus and context: start small, reveal new notes
  if (focusNotes.length > 0 && contextNotes.length > 0) {
    return { initialNotes: [...contextNotes], hiddenNotes: [...focusNotes] };
  }

  // Practice nodes or first-ever nodes: full pool, nothing to reveal
  return { initialNotes: [...notePool], hiddenNotes: [] };
}

export function NotesRecognitionGame() {
  const { soft, snappy, fade, reduce } = useMotionTokens();
  const { reducedMotion: appReducedMotion } = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation("common");

  // Android PWA: fullscreen + orientation lock
  useLandscapeLock();

  // iOS/non-PWA: rotate prompt overlay
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // Get nodeId from trail navigation (if coming from trail)
  const nodeId = location.state?.nodeId || null;
  const nodeConfig = location.state?.nodeConfig || null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType = location.state?.exerciseType ?? null;
  // Accidental flags derived from the node's notePool in TrailNodeModal (trail sessions only).
  // Defaults to false so free-play mode unaffected (location.state is null).
  const trailEnableSharps = location.state?.enableSharps ?? false;
  const trailEnableFlats = location.state?.enableFlats ?? false;
  // In trail mode, restrict accidentals to only those explicitly in the exercise's notePool.
  // Prevents enableSharps from leaking in unlearned notes (e.g. G#4 in "Meet F Sharp").
  const trailNotePoolSet = useMemo(() => {
    if (!nodeConfig?.notePool) return null;
    return new Set(nodeConfig.notePool);
  }, [nodeConfig]);
  // Daily challenge mode
  const challengeMode = location.state?.challengeMode ?? false;
  const challengeConfig = location.state?.challengeConfig ?? null;
  const challengeId = location.state?.challengeId ?? null;
  const challengeXpReward = location.state?.xpReward ?? null;
  const isRTL = i18n.language === "he";
  const useHebrewNoteLabels = i18n.language === "he";
  const SHOW_LISTEN_BUTTON = true;
  const [isNavigating] = useState(false);
  const [preloadedSounds, setPreloadedSounds] = useState({});
  const currentAudioRef = useRef(null);
  const [noteFlash, setNoteFlash] = useState(false);

  // Game settings with defaults
  const { settings, updateSettings, resetSettings } = useGameSettings({
    timedMode: false,
    timeLimit: 45,
    selectedNotes: [],
    enableSharps: false,
    enableFlats: false,
  });
  const normalizedSelectedNotes = useMemo(
    () =>
      normalizeSelectedNotes({
        selectedNotes: settings.selectedNotes,
        clef: settings.clef,
        trebleNotes,
        bassNotes,
        targetField: "pitch",
        enableSharps: settings.enableSharps,
        enableFlats: settings.enableFlats,
      }),
    [
      settings.selectedNotes,
      settings.clef,
      settings.enableSharps,
      settings.enableFlats,
    ]
  );

  // Ref for current note — keeps mic callback in sync with displayed question.
  // The callback chain (useMicNoteInput → usePitchDetection → rAF loop) can
  // hold stale closures, so we read from a ref instead of the closure value.
  const currentNoteRef = useRef(null);
  const totalQuestionsRef = useRef(0);

  const { progress, updateProgress, handleAnswer, finishGame, resetProgress } =
    useGameProgress();
  currentNoteRef.current = progress.currentNote;
  totalQuestionsRef.current = progress.totalQuestions;

  // Use the centralized sounds hook
  const {
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    playGameOverSound,
  } = useSounds();

  // Session timeout controls - pause timer during active gameplay
  let pauseTimer = useCallback(() => {}, []);
  let resumeTimer = useCallback(() => {}, []);
  try {
    const sessionTimeout = useSessionTimeout();
    pauseTimer = sessionTimeout.pauseTimer;
    resumeTimer = sessionTimeout.resumeTimer;
  } catch {
    // Not in SessionTimeoutProvider, timer controls are no-ops
  }

  // Pause/resume inactivity timer based on game state
  useEffect(() => {
    // Game is active when started and not finished
    const isGameActive = progress.isStarted && !progress.isFinished;
    if (isGameActive) {
      pauseTimer();
    } else {
      resumeTimer();
    }
    return () => resumeTimer(); // Always resume on unmount
  }, [progress.isStarted, progress.isFinished, pauseTimer, resumeTimer]);

  // Track if we should auto-start from trail
  const hasAutoStartedRef = useRef(false);

  // Reset auto-start flag and game state when nodeId changes (navigating to a new node)
  useEffect(() => {
    hasAutoStartedRef.current = false;

    // Reset game progress to prevent VictoryScreen from showing immediately
    // This is critical when navigating between trail nodes of the same game type
    resetProgress();

    // Reset game state to prevent stuck UI from previous node
    setGameOver(false);
    isGameEndingRef.current = false;
    setAnswerFeedback({
      selectedNote: null,
      correctNote: null,
      isCorrect: null,
    });
    setWaitingForRelease(false);
    setPendingNextNote(null);
    setVariantModal(null);
    setDetectedNote(null);
  }, [nodeId, resetProgress]);

  // Auto-configure and auto-start from trail node
  useEffect(() => {
    if (nodeConfig && !hasAutoStartedRef.current) {
      // IOS-02: If AudioContext needs a gesture to resume, defer to user tap
      const ctx = audioContextProviderRef?.current;
      if (ctx && (ctx.state === 'suspended' || ctx.state === 'interrupted')) {
        setNeedsGestureToStart(true);
        return; // Don't auto-start — show tap-to-start overlay
      }

      hasAutoStartedRef.current = true;

      // Build initial pool: discovery nodes start with context notes visible,
      // focus notes hidden and revealed progressively via combo milestones.
      const { initialNotes, hiddenNotes } = buildInitialTrailPool(nodeId);
      hiddenNodeNotesRef.current = hiddenNotes;

      const trailSettings = {
        clef: nodeConfig.clef || 'treble',
        selectedNotes: initialNotes.length > 0 ? initialNotes : (nodeConfig.notePool || []),
        timedMode: nodeConfig.timeLimit !== null && nodeConfig.timeLimit !== undefined,
        timeLimit: nodeConfig.timeLimit || 45,
        enableSharps: trailEnableSharps,
        enableFlats: trailEnableFlats,
      };

      // Update settings and hide settings modal
      updateSettings(trailSettings);
      updateProgress({ showSettingsModal: false });

      // Auto-start the game after a brief delay to ensure settings are applied
      setTimeout(() => {
        startGame(trailSettings);
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start effect guarded by hasAutoStartedRef; startGame, updateSettings, updateProgress, audioContextProviderRef, trailEnableFlats, trailEnableSharps intentionally omitted to prevent re-triggering; only nodeConfig/nodeId changes should re-evaluate
  }, [nodeConfig, nodeId]); // Run when nodeConfig OR nodeId changes

  // Auto-configure and auto-start from daily challenge
  useEffect(() => {
    if (challengeMode && challengeConfig && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;

      const challengeSettings = {
        clef: challengeConfig.clef || 'treble',
        selectedNotes: challengeConfig.notePool || [],
        timedMode: !!challengeConfig.timeLimit,
        timeLimit: challengeConfig.timeLimit || 60,
        enableSharps: false,
        enableFlats: false,
      };

      updateSettings(challengeSettings);
      updateProgress({ showSettingsModal: false });

      setTimeout(() => {
        startGame(challengeSettings);
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time auto-start effect guarded by hasAutoStartedRef; startGame, updateSettings, updateProgress intentionally omitted; only challengeMode/challengeConfig changes should re-evaluate
  }, [challengeMode, challengeConfig]);

  // Handle navigation to next exercise in the trail node
  const handleNextExercise = useCallback(() => {
    if (nodeId && trailExerciseIndex !== null && trailTotalExercises !== null) {
      const nextIndex = trailExerciseIndex + 1;

      if (nextIndex < trailTotalExercises) {
        const node = getNodeById(nodeId);

        if (node && node.exercises && node.exercises[nextIndex]) {
          const nextExercise = node.exercises[nextIndex];

          const navState = {
            nodeId,
            nodeConfig: nextExercise.config,
            exerciseIndex: nextIndex,
            totalExercises: trailTotalExercises,
            exerciseType: nextExercise.type
          };

          // Navigate based on exercise type
          switch (nextExercise.type) {
            case 'note_recognition':
              // State resets automatically via nodeId change effect
              navigate('/notes-master-mode/notes-recognition-game', { state: navState, replace: true });
              break;
            case 'sight_reading':
              navigate('/notes-master-mode/sight-reading-game', { state: navState });
              break;
            case 'memory_game':
              navigate('/notes-master-mode/memory-game', { state: navState });
              break;
            case 'rhythm':
              navigate('/rhythm-mode/metronome-trainer', { state: navState });
              break;
            case 'boss_challenge':
              navigate('/notes-master-mode/sight-reading-game', { state: { ...navState, isBoss: true } });
              break;
            case 'rhythm_reading':
              navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
              break;
            case 'rhythm_dictation':
              navigate('/rhythm-mode/rhythm-dictation-game', { state: navState });
              break;
            case 'pitch_comparison':
              navigate('/ear-training-mode/note-comparison-game', { state: navState });
              break;
            case 'interval_id':
              navigate('/ear-training-mode/interval-game', { state: navState });
              break;
            case 'arcade_rhythm':
              navigate('/rhythm-mode/arcade-rhythm-game', { state: navState });
              break;
            default:
              navigate('/trail');
          }
        }
      }
    }
  }, [navigate, nodeId, trailExerciseIndex, trailTotalExercises]);

  // Game state
  const [gameOver, setGameOver] = useState(false);

  // Audio input state — managed by shared audio pipeline hooks
  const [detectedNote, setDetectedNote] = useState(null);

  // Shared AudioContextProvider consumption
  const { requestMic, releaseMic, audioContextRef: audioContextProviderRef, isInterrupted, handleTapToResume } = useAudioContext();
  const [needsGestureToStart, setNeedsGestureToStart] = useState(false);

  // Ref to track mic listening state — avoids TDZ since useMicNoteInput
  // is called after playSound (which needs to check listening state)
  const isListeningRef = useRef(false);

  // State for button highlighting feedback
  const [answerFeedback, setAnswerFeedback] = useState({
    selectedNote: null,
    correctNote: null,
    isCorrect: null,
  });

  // State for note release detection in Listen mode
  const [waitingForRelease, setWaitingForRelease] = useState(false);
  const waitingForReleaseRef = useRef(false);
  const lastScoredRef = useRef({ pitch: null, time: 0 });
  waitingForReleaseRef.current = waitingForRelease;
  const isGameEndingRef = useRef(false);
  const [pendingNextNote, setPendingNextNote] = useState(null);
  const [variantModal, setVariantModal] = useState(null);
  const baseNotesRegionRef = useRef(null);
  const variantPopoverRef = useRef(null);

  // === Engagement: Combo, Lives, Speed ===
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const livesRef = useRef(INITIAL_LIVES);
  const [speedBonusKey, setSpeedBonusKey] = useState(0);
  const [showSpeedBonus, setShowSpeedBonus] = useState(false);
  const [comboShake, setComboShake] = useState(false);
  const questionStartTimeRef = useRef(null);
  const [tierUpMultiplier, setTierUpMultiplier] = useState(null);
  const [tierUpTarget, setTierUpTarget] = useState({ x: 0, y: '-45vh' });
  const prevTierRef = useRef(1);
  const comboPillRef = useRef(null);
  const scorePillRef = useRef(null);
  const [floatingScore, setFloatingScore] = useState(null);
  const [floatingScoreKey, setFloatingScoreKey] = useState(0);

  // === Engagement: On-fire mode + auto-grow note pool ===
  const [isOnFire, setIsOnFire] = useState(false);
  const isOnFireRef = useRef(false); // Mirror ref — read inside handleAnswerSelect to avoid stale closure
  const [showFireSplash, setShowFireSplash] = useState(false);
  const [sessionExtraNotes, setSessionExtraNotes] = useState([]);
  const sessionExtraNotesRef = useRef([]); // Read inside getRandomNote to avoid stale closure
  const hiddenNodeNotesRef = useRef([]); // Notes from current node's notePool not yet revealed
  const [showNewNoteBanner, setShowNewNoteBanner] = useState(false);
  const [newNoteBannerKey, setNewNoteBannerKey] = useState(0);

  // Fire activation sound — standalone Web Audio oscillator (does NOT use useSounds to avoid mutual-pause conflict)
  const playFireSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.3);
      // Close context after sound finishes to free resources
      setTimeout(() => audioCtx.close().catch(() => {}), 500);
    } catch {
      // Sound is non-critical — fail silently
    }
  }, []);

  // Timer implementation
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, [timeRemaining]);

  // Pause the game timer (distinct from session timeout pauseTimer)
  const pauseGameTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerActive(false);
    }
  }, []);

  // Reset the timer
  const resetTimer = useCallback((newTime = 45) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeRemaining(newTime);
    setIsTimerActive(false);
  }, []);

  // Preload piano sounds for instant playback
  useEffect(() => {
    let cancelled = false;

    const preloadSounds = async () => {
      const clefKey = String(settings.clef || "Treble").toLowerCase();
      const referenceNotes =
        clefKey === "bass"
          ? bassNotes.map((n) => ({ ...n, __clef: "bass" }))
          : clefKey === "both"
            ? [
                ...trebleNotes.map((n) => ({ ...n, __clef: "treble" })),
                ...bassNotes.map((n) => ({ ...n, __clef: "bass" })),
              ]
            : trebleNotes.map((n) => ({ ...n, __clef: "treble" }));

      const selectedSet =
        Array.isArray(normalizedSelectedNotes) &&
        normalizedSelectedNotes.length > 0
          ? new Set(normalizedSelectedNotes)
          : null;

      const activeNotes = selectedSet
        ? referenceNotes.filter((note) => {
            const tag =
              note.__clef ||
              getClefTypeForPitch(note.pitch || note.englishName);
            const notePitch = note.pitch;
            const base = naturalBasePitch(notePitch);
            const allowAccidental =
              isAccidentalPitch(notePitch) &&
              ((notePitch.includes("#") && settings.enableSharps) ||
                (notePitch.includes("b") && settings.enableFlats));

            return clefKey === "both"
              ? selectedSet.has(`${tag}:${notePitch}`) ||
                  (allowAccidental && selectedSet.has(`${tag}:${base}`))
              : selectedSet.has(notePitch) ||
                  (allowAccidental && selectedSet.has(base));
          })
        : referenceNotes;

      const loaders = new Map();
      activeNotes.forEach((note) => {
        const clefType =
          clefKey === "both"
            ? note.__clef || getClefTypeForPitch(note.pitch || note.englishName)
            : settings.clef === "Bass"
              ? "bass"
              : "treble";
        const config = getAudioConfigForNote(note, clefType);
        if (config && !loaders.has(config.key)) {
          loaders.set(config.key, config.loader);
        }
      });

      const loadedSounds = {};
      for (const [audioKey, importFunc] of loaders.entries()) {
        try {
          const soundModule = await importFunc();
          const audio = new Audio(soundModule.default);
          audio.volume = 1.0;
          audio.load();
          loadedSounds[audioKey] = audio;
        } catch (error) {
          console.warn(`Failed to preload sound for ${audioKey}:`, error);
        }
      }

      if (!cancelled) {
        setPreloadedSounds(loadedSounds);
      }
    };

    preloadSounds();

    return () => {
      cancelled = true;
    };
  }, [
    settings.clef,
    settings.enableFlats,
    settings.enableSharps,
    normalizedSelectedNotes,
  ]);

  // Reset game state when component mounts to ensure clean state
  useEffect(() => {
    resetProgress();
    // Don't reset settings on mount as it causes issues with GameSettings component
    setGameOver(false);
    isGameEndingRef.current = false;
    resetTimer();
    setDetectedNote(null);
  }, [resetProgress, resetTimer]);

  // Handle game over logic
  const handleGameOver = useCallback(() => {
    if (gameOver) return;
    isGameEndingRef.current = true;

    const scorePercentage =
      (progress.correctAnswers / Math.max(1, progress.totalQuestions)) * 100;

    // Only consider time running out as a loss condition if in timed mode
    const timeRanOut = settings.timedMode && timeRemaining <= 0;
    const livesLost = livesRef.current <= 0;
    const isLost = scorePercentage < 50 || timeRanOut || livesLost;

    // Note: Score saving is handled by useGameProgress.finishGame()
    // Switch UI immediately (don't wait for async score save) so we don't render an extra note
    // after the final answer.
    updateProgress({ isFinished: true, isLost, timeRanOut, livesLost });

    // Allow the piano note to play briefly before stopping it for victory/game over sound
    setTimeout(() => {
      // Stop any currently playing piano note before playing victory/game over sound
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    }, 200);

    setTimeout(() => {
      if (isLost) {
        playGameOverSound();
      } else {
        playVictorySound();
      }
    }, 400);

    pauseGameTimer();
    setGameOver(true);
    finishGame(isLost, timeRanOut);
  }, [
    gameOver,
    progress.correctAnswers,
    progress.totalQuestions,
    timeRemaining,
    updateProgress,
    pauseGameTimer,
    finishGame,
    settings.timedMode,
    playGameOverSound,
    playVictorySound,
  ]);

  // Start the timer
  const startTimer = useCallback(() => {
    // Don't start timer if game hasn't started or if already running or if not in timed mode
    if (!progress.isStarted || timerRef.current || !settings.timedMode) {
      return;
    }

    setIsTimerActive(true);

    timerRef.current = setInterval(() => {
      setTimeRemaining((time) => {
        if (time <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setIsTimerActive(false);

          setTimeout(() => handleGameOver(), 50);
          return 0;
        }
        return time - 1;
      });
    }, 1000);
  }, [progress.isStarted, handleGameOver, settings.timedMode]);

  // Helper: returns the next hidden note from the current node's pool.
  // Returns a note object from trebleNotes/bassNotes, or null if nothing left to reveal.
  const getNextHiddenNote = useCallback(() => {
    const hidden = hiddenNodeNotesRef.current;
    if (hidden.length === 0) return null;

    const nextPitch = hidden[0];
    const clefKey = String(settings.clef || 'Treble').toLowerCase();
    const allNotes = clefKey === 'bass' ? bassNotes : trebleNotes;
    return allNotes.find(n => n.pitch === nextPitch || n.englishName === nextPitch) ?? null;
  }, [settings.clef]);

  // Get random note based on current settings
  const getRandomNote = useCallback(() => {
    const clefKey = String(settings.clef || "Treble").toLowerCase();
    const notesArray =
      clefKey === "bass"
        ? bassNotes.map((n) => ({ ...n, __clef: "bass" }))
        : clefKey === "both"
          ? [
              ...trebleNotes.map((n) => ({ ...n, __clef: "treble" })),
              ...bassNotes.map((n) => ({ ...n, __clef: "bass" })),
            ]
          : trebleNotes.map((n) => ({ ...n, __clef: "treble" }));

    const selectedSet =
      Array.isArray(normalizedSelectedNotes) &&
      normalizedSelectedNotes.length > 0
        ? new Set(normalizedSelectedNotes)
        : null;

    const baseFiltered = selectedSet
      ? notesArray.filter((note) => {
          const tag =
            note.__clef || getClefTypeForPitch(note.pitch || note.englishName);
          const notePitch = note.pitch;
          const base = naturalBasePitch(notePitch);
          const allowAccidental =
            isAccidentalPitch(notePitch) &&
            ((notePitch.includes("#") && settings.enableSharps) ||
              (notePitch.includes("b") && settings.enableFlats));
          // Trail guard: accidentals must be in the exercise's notePool
          const trailAllowed = !trailNotePoolSet || !isAccidentalPitch(notePitch) || trailNotePoolSet.has(notePitch);

          return trailAllowed && (clefKey === "both"
            ? selectedSet.has(`${tag}:${notePitch}`) ||
                (allowAccidental && selectedSet.has(`${tag}:${base}`))
            : selectedSet.has(notePitch) ||
                (allowAccidental && selectedSet.has(base)));
        })
      : notesArray;

    // Include session extra notes (auto-grow) — read from ref to avoid stale closure in mic chain
    const filteredNotes = [...baseFiltered];
    const extras = sessionExtraNotesRef.current;
    if (extras.length > 0) {
      for (const extraNote of extras) {
        if (!filteredNotes.some(n => n.note === extraNote.note)) {
          filteredNotes.push({ ...extraNote, __clef: extraNote.__clef || clefKey });
        }
      }
    }

    return filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
  }, [
    normalizedSelectedNotes,
    settings.clef,
    settings.enableFlats,
    settings.enableSharps,
    trailNotePoolSet,
  ]);

  // Handle game settings from the GameSettings component
  const handleGameSettings = (newSettings) => {
    if (!newSettings) return;

    const clef =
      newSettings.clef === "Bass"
        ? "Bass"
        : newSettings.clef === "Both"
          ? "Both"
          : "Treble";

    const resolvedSelectedNotes = normalizeSelectedNotes({
      selectedNotes: newSettings.selectedNotes,
      clef,
      trebleNotes,
      bassNotes,
      targetField: "pitch",
      enableSharps: newSettings.enableSharps ?? settings.enableSharps,
      enableFlats: newSettings.enableFlats ?? settings.enableFlats,
    });

    // Make sure timedMode is explicitly set
    const timedMode =
      newSettings.timedMode !== undefined ? newSettings.timedMode : false;

    // Calculate time limit based on timedMode and difficulty
    const timeLimit = timedMode ? newSettings.timeLimit || 45 : 45;

    const completeSettings = {
      clef,
      selectedNotes: resolvedSelectedNotes,
      enableSharps: newSettings.enableSharps ?? settings.enableSharps,
      enableFlats: newSettings.enableFlats ?? settings.enableFlats,
      timedMode,
      difficulty: newSettings.difficulty || "Medium",
      timeLimit,
    };

    updateSettings(completeSettings);
    resetTimer(timeLimit);

    setTimeout(() => {
      startGame(completeSettings);
    }, 100);
  };

  // Start the game with current or new settings
  // eslint-disable-next-line react-hooks/exhaustive-deps -- startGame is a plain function that cannot be wrapped in useCallback without listing many state deps (risks infinite loops); handleGestureStart useCallback intentionally includes startGame to avoid stale closure
  const startGame = (gameSettings = settings) => {
    const resolvedSelectedNotes = normalizeSelectedNotes({
      selectedNotes: gameSettings.selectedNotes,
      clef: gameSettings.clef,
      trebleNotes,
      bassNotes,
      targetField: "pitch",
      enableSharps: gameSettings.enableSharps,
      enableFlats: gameSettings.enableFlats,
    });

    // Make sure we capture the timedMode correctly
    const timedMode =
      gameSettings.timedMode !== undefined ? gameSettings.timedMode : false;

    const updatedSettings = {
      ...gameSettings,
      selectedNotes: resolvedSelectedNotes,
      timedMode, // Ensure timedMode is explicitly set
    };

    updateSettings(updatedSettings);
    resetProgress();
    setGameOver(false);
    isGameEndingRef.current = false;
    setAnswerFeedback({ selectedNote: null, correctNote: null, isCorrect: null });
    setWaitingForRelease(false);
    setPendingNextNote(null);
    setDetectedNote(null);

    // Reset engagement state
    comboRef.current = 0;
    setCombo(0);
    prevTierRef.current = 1;
    setTierUpMultiplier(null);
    livesRef.current = INITIAL_LIVES;
    setLives(INITIAL_LIVES);
    setShowSpeedBonus(false);
    setComboShake(false);
    // Reset on-fire and auto-grow state
    isOnFireRef.current = false;
    setIsOnFire(false);
    setShowFireSplash(false);
    sessionExtraNotesRef.current = [];
    setSessionExtraNotes([]);
    // Note: hiddenNodeNotesRef is NOT reset here — it's set by the auto-start
    // paths (trail auto-start / iOS gesture start) before startGame is called.
    setShowNewNoteBanner(false);

    const timeLimit = updatedSettings.timeLimit || 45;
    pauseGameTimer();
    resetTimer(timeLimit);

    // Generate first note using the passed gameSettings instead of global settings
    const clefKey = String(gameSettings.clef || "Treble").toLowerCase();
    const notesArray =
      clefKey === "bass"
        ? bassNotes.map((n) => ({ ...n, __clef: "bass" }))
        : clefKey === "both"
          ? [
              ...trebleNotes.map((n) => ({ ...n, __clef: "treble" })),
              ...bassNotes.map((n) => ({ ...n, __clef: "bass" })),
            ]
          : trebleNotes.map((n) => ({ ...n, __clef: "treble" }));

    const filteredNotes =
      resolvedSelectedNotes.length > 0
        ? (() => {
            const selectedSet = new Set(resolvedSelectedNotes);
            return notesArray.filter((note) => {
              if (clefKey === "both") {
                const tag = note.__clef || "treble";
                const notePitch = note.pitch;
                const base = naturalBasePitch(notePitch);
                const allowAccidental =
                  isAccidentalPitch(notePitch) &&
                  ((notePitch.includes("#") && updatedSettings.enableSharps) ||
                    (notePitch.includes("b") && updatedSettings.enableFlats));
                return (
                  selectedSet.has(`${tag}:${notePitch}`) ||
                  (allowAccidental && selectedSet.has(`${tag}:${base}`))
                );
              }
              const notePitch = note.pitch;
              const base = naturalBasePitch(notePitch);
              const allowAccidental =
                isAccidentalPitch(notePitch) &&
                ((notePitch.includes("#") && updatedSettings.enableSharps) ||
                  (notePitch.includes("b") && updatedSettings.enableFlats));
              return (
                selectedSet.has(notePitch) ||
                (allowAccidental && selectedSet.has(base))
              );
            });
          })()
        : notesArray;

    const firstNote =
      filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
    if (!firstNote) {
      console.error("Failed to get initial note");
      return;
    }

    updateProgress({
      currentNote: firstNote,
      isStarted: true,
      totalQuestions: 0,
      correctAnswers: 0,
      score: 0,
    });

    // Clear any previous timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset timer regardless of mode
    setTimeRemaining(timeLimit);
    setIsTimerActive(false);

    // Only start timer if in timed mode
    if (updatedSettings.timedMode) {
      setTimeout(() => {
        startTimer();
      }, 300);
    }
  };

  // IOS-02: Handle user-gesture tap-to-start for trail auto-start when AudioContext was suspended
  const handleGestureStart = useCallback(async () => {
    const ctx = audioContextProviderRef?.current;
    if (ctx) {
      // resume() synchronously before any await — IOS-02 requirement
      const resumePromise = ctx.resume();
      await resumePromise;
    }
    setNeedsGestureToStart(false);
    hasAutoStartedRef.current = true;

    // Build initial pool same as main auto-start path
    const { initialNotes, hiddenNotes } = buildInitialTrailPool(nodeId);
    hiddenNodeNotesRef.current = hiddenNotes;

    const trailSettings = {
      clef: nodeConfig?.clef || 'treble',
      selectedNotes: initialNotes.length > 0 ? initialNotes : (nodeConfig?.notePool || []),
      timedMode: nodeConfig?.timeLimit !== null && nodeConfig?.timeLimit !== undefined,
      timeLimit: nodeConfig?.timeLimit || 45,
      enableSharps: trailEnableSharps,
      enableFlats: trailEnableFlats,
    };
    updateSettings(trailSettings);
    updateProgress({ showSettingsModal: false });
    setTimeout(() => startGame(trailSettings), 50);
  }, [audioContextProviderRef, nodeConfig, updateSettings, updateProgress, startGame]);

  // IOS-01/03: Freeze game timer when AudioContext is interrupted
  useEffect(() => {
    if (isInterrupted && progress.isStarted && !progress.isFinished) {
      pauseGameTimer();
    }
    // Note: we don't auto-resume since the user must tap the overlay to resume
  }, [isInterrupted]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatNoteLabel = useCallback(
    (noteObj) => {
      if (!noteObj) return "";
      if (useHebrewNoteLabels) return noteObj.note;

      const fromEnglishName = noteObj.englishName
        ? noteObj.englishName.replace(/\d+/g, "").toUpperCase()
        : "";
      if (fromEnglishName) return fromEnglishName;

      const fromPitch = noteObj.pitch
        ? noteObj.pitch.replace(/\d+/g, "").toUpperCase()
        : "";
      if (fromPitch) return fromPitch;

      return noteObj.note || "";
    },
    [useHebrewNoteLabels]
  );

  const availableNotes = useMemo(() => {
    const clefKey = String(settings.clef || "Treble").toLowerCase();
    const allNotes =
      clefKey === "bass"
        ? bassNotes.map((n) => ({ ...n, __clef: "bass" }))
        : clefKey === "both"
          ? [
              ...trebleNotes.map((n) => ({ ...n, __clef: "treble" })),
              ...bassNotes.map((n) => ({ ...n, __clef: "bass" })),
            ]
          : trebleNotes.map((n) => ({ ...n, __clef: "treble" }));

    const filteredNotes =
      normalizedSelectedNotes.length > 0
        ? (() => {
            const selectedSet = new Set(normalizedSelectedNotes);
            return allNotes.filter((note) => {
              const tag =
                note.__clef ||
                getClefTypeForPitch(note.pitch || note.englishName);
              const notePitch = note.pitch;
              const base = naturalBasePitch(notePitch);
              const allowAccidental =
                isAccidentalPitch(notePitch) &&
                ((notePitch.includes("#") && settings.enableSharps) ||
                  (notePitch.includes("b") && settings.enableFlats));
              // Trail guard: accidentals must be in the exercise's notePool
              const trailAllowed = !trailNotePoolSet || !isAccidentalPitch(notePitch) || trailNotePoolSet.has(notePitch);

              return trailAllowed && (clefKey === "both"
                ? selectedSet.has(`${tag}:${notePitch}`) ||
                    (allowAccidental && selectedSet.has(`${tag}:${base}`))
                : selectedSet.has(notePitch) ||
                    (allowAccidental && selectedSet.has(base)));
            });
          })()
        : allNotes;

    const uniqueNotes = [];
    const seenNotes = new Set();
    for (const note of filteredNotes) {
      if (!note?.note || seenNotes.has(note.note)) continue;
      seenNotes.add(note.note);
      uniqueNotes.push(note);
    }

    // Include session extra notes for answer button display (state, not ref — triggers re-render)
    for (const extra of sessionExtraNotes) {
      if (!extra?.note || seenNotes.has(extra.note)) continue;
      seenNotes.add(extra.note);
      uniqueNotes.push(extra);
    }

    return uniqueNotes;
  }, [
    settings.clef,
    settings.enableFlats,
    settings.enableSharps,
    normalizedSelectedNotes,
    sessionExtraNotes,
    trailNotePoolSet,
  ]);

  const { orderedNaturals, orderedAccidentals } = useMemo(() => {
    const naturals = [];
    const accidentals = [];

    availableNotes.forEach((note) => {
      if (isAccidentalNote(note)) {
        accidentals.push(note);
      } else {
        naturals.push(note);
      }
    });

    const getOrderIndex = (note) => {
      const letter = getBaseLetterFromNote(note);
      const index = NOTE_ORDER_SEQUENCE.indexOf(letter);
      return index === -1 ? NOTE_ORDER_SEQUENCE.length : index;
    };

    const sortNotes = (arr) =>
      arr.sort((a, b) => {
        const diff = getOrderIndex(a) - getOrderIndex(b);
        if (diff !== 0) return diff;
        return (a.note || "").localeCompare(b.note || "");
      });

    sortNotes(naturals);
    sortNotes(accidentals);

    return {
      orderedNaturals: naturals,
      orderedAccidentals: accidentals,
    };
  }, [availableNotes]);

  const groupedMobileNotes = useMemo(() => {
    const groups = new Map();

    for (const note of availableNotes) {
      const baseKey =
        getBaseLetterFromNote(note) || stripAccidentalGlyphs(note?.note);
      if (!baseKey) continue;

      if (!groups.has(baseKey)) {
        groups.set(baseKey, { baseKey, baseLabel: "", options: [] });
      }
      groups.get(baseKey).options.push(note);
    }

    const result = Array.from(groups.values()).map((group) => {
      const sortedOptions = [...group.options].sort((a, b) => {
        const diff = accidentalRank(a) - accidentalRank(b);
        if (diff !== 0) return diff;
        return (a.note || "").localeCompare(b.note || "");
      });

      const primary =
        sortedOptions.find((n) => !isAccidentalNote(n)) || sortedOptions[0];
      const primaryLabel = primary ? formatNoteLabel(primary) : "";
      const baseLabel = stripAccidentalGlyphs(primaryLabel);

      return {
        ...group,
        baseLabel,
        options: sortedOptions,
      };
    });

    return result.sort((a, b) => {
      const ai = NOTE_ORDER_SEQUENCE.indexOf(a.baseKey);
      const bi = NOTE_ORDER_SEQUENCE.indexOf(b.baseKey);
      const safeAi = ai === -1 ? NOTE_ORDER_SEQUENCE.length : ai;
      const safeBi = bi === -1 ? NOTE_ORDER_SEQUENCE.length : bi;
      if (safeAi !== safeBi) return safeAi - safeBi;
      return String(a.baseLabel || "").localeCompare(String(b.baseLabel || ""));
    });
  }, [availableNotes, formatNoteLabel]);

  const getAnswerButtonClass = useCallback(
    (noteValue) => {
      let buttonClass =
        "relative w-full min-h-[44px] px-4 py-3 rounded-2xl border text-base font-semibold tracking-wide shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-200 motion-reduce:transition-none active:scale-[0.98] ";

      if (answerFeedback.selectedNote && answerFeedback.correctNote) {
        if (
          noteValue === answerFeedback.selectedNote &&
          !answerFeedback.isCorrect
        ) {
          buttonClass +=
            "bg-rose-500/80 border-rose-300/40 text-white shadow-[0_6px_20px_rgba(244,63,94,0.25)]";
        } else if (noteValue === answerFeedback.correctNote) {
          buttonClass +=
            "bg-emerald-500/80 border-emerald-300/40 text-white shadow-[0_6px_20px_rgba(16,185,129,0.25)]";
        } else {
          buttonClass += "bg-white/8 border-white/10 text-white/80 opacity-70";
        }
      } else {
        buttonClass +=
          "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30";
      }

      return buttonClass;
    },
    [answerFeedback]
  );

  const renderNoteButton = (note) => {
    if (!note) return null;

    const isFeedbackActive =
      answerFeedback.selectedNote && answerFeedback.correctNote;
    const isSelected = note.note === answerFeedback.selectedNote;
    const isCorrect = note.note === answerFeedback.correctNote;
    const shouldShake =
      isFeedbackActive && isSelected && !answerFeedback.isCorrect;
    const shouldPop = isFeedbackActive && isCorrect;
    const keyframesTransition = reduce
      ? undefined
      : shouldShake
        ? { type: "tween", duration: 0.22, ease: "easeInOut" }
        : shouldPop
          ? { type: "tween", duration: 0.18, ease: "easeOut" }
          : snappy;

    return (
      <motion.button
        key={note.note}
        onClick={() => handleAnswerSelect(note.note)}
        className={getAnswerButtonClass(note.note)}
        disabled={answerFeedback.selectedNote !== null}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        transition={keyframesTransition}
        animate={
          reduce
            ? undefined
            : shouldShake
              ? { x: [0, -6, 6, -4, 4, 0] }
              : shouldPop
                ? { scale: [1, 1.06, 1] }
                : undefined
        }
      >
        {formatNoteLabel(note)}
      </motion.button>
    );
  };

  const renderMobileNoteGroup = (group) => {
    if (!group) return null;

    const hasVariants = group.options.length > 1;
    const disabled = answerFeedback.selectedNote !== null;
    const isModalOpenForGroup = variantModal?.baseKey === group.baseKey;

    const hasCorrectInGroup =
      !!answerFeedback.correctNote &&
      group.options.some((o) => o.note === answerFeedback.correctNote);
    const hasSelectedInGroup =
      !!answerFeedback.selectedNote &&
      group.options.some((o) => o.note === answerFeedback.selectedNote);

    // When the correct/selected answer is an accidental inside the group, we still want the
    // whole base button to fill green/red (not just a ring), to match the per-note buttons.
    const groupFeedbackExtra =
      answerFeedback.selectedNote && answerFeedback.correctNote
        ? hasCorrectInGroup
          ? "bg-emerald-500/80 border-emerald-300/40 text-white shadow-[0_6px_20px_rgba(16,185,129,0.25)] opacity-100"
          : hasSelectedInGroup && !answerFeedback.isCorrect
            ? "bg-rose-500/80 border-rose-300/40 text-white shadow-[0_6px_20px_rgba(244,63,94,0.25)] opacity-100"
            : ""
        : "";

    const baseExtra = groupFeedbackExtra
      ? groupFeedbackExtra
      : isModalOpenForGroup
        ? "ring-2 ring-white/30"
        : "";

    const handleBaseClick = (event) => {
      if (disabled) return;

      if (!hasVariants) {
        const only = group.options[0];
        if (only?.note) handleAnswerSelect(only.note);
        return;
      }

      const rect = event?.currentTarget?.getBoundingClientRect?.();
      const anchorRect = rect
        ? {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }
        : null;
      const regionRect = baseNotesRegionRef.current?.getBoundingClientRect?.();
      const baseNotesRect = regionRect
        ? {
            left: regionRect.left,
            top: regionRect.top,
            width: regionRect.width,
            height: regionRect.height,
          }
        : null;

      setVariantModal((prev) =>
        prev?.baseKey === group.baseKey
          ? null
          : {
              baseKey: group.baseKey,
              baseLabel: group.baseLabel,
              options: group.options,
              anchorRect,
              baseNotesRect,
            }
      );
    };

    return (
      <div key={group.baseKey} className="relative z-0" data-note-group="true">
        <motion.button
          type="button"
          onClick={handleBaseClick}
          className={`${getAnswerButtonClass(group.options[0]?.note)} relative w-full touch-manipulation active:scale-[0.98] ${baseExtra}`}
          disabled={disabled}
          aria-haspopup={hasVariants ? "dialog" : undefined}
          aria-expanded={hasVariants ? isModalOpenForGroup : undefined}
          aria-label={
            useHebrewNoteLabels && hasVariants
              ? `בחר ${group.baseLabel}, ${group.baseLabel} דיאז או ${group.baseLabel} במול`
              : undefined
          }
          whileTap={reduce || disabled ? undefined : { scale: 0.96 }}
          transition={snappy}
        >
          <span className="inline-flex items-center gap-2">
            <span className="text-base font-semibold">{group.baseLabel}</span>
            {hasVariants && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/90 transition-transform duration-300 ${isModalOpenForGroup ? "scale-105" : ""}`}
              >
                <span className="leading-none">♭♯</span>
              </span>
            )}
          </span>
        </motion.button>
      </div>
    );
  };

  // Function to play sounds based on answer correctness
  const playSound = useCallback(
    (isCorrect, noteObj) => {
      const noteLabel = noteObj?.note || noteObj?.englishName || "Unknown";

      // Don't play audio during pitch detection to avoid conflicts
      if (isListeningRef.current) {
        return;
      }

      if (isCorrect && noteObj) {
        const clefType =
          String(settings.clef || "Treble").toLowerCase() === "both"
            ? noteObj.__clef ||
              getClefTypeForPitch(noteObj.pitch || noteObj.englishName)
            : settings.clef === "Bass"
              ? "bass"
              : "treble";
        const audioConfig = getAudioConfigForNote(noteObj, clefType);
        const audioKey = audioConfig?.key;
        const audio = audioKey ? preloadedSounds[audioKey] : null;

        // Stop any currently playing piano note
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }

        if (audio) {
          audio.currentTime = 0;
          currentAudioRef.current = audio;
          audio.play().catch((err) => console.warn("Audio play failed:", err));
        } else {
          console.warn(
            "Preloaded sound not available for:",
            noteLabel,
            "| key:",
            audioKey
          );
          playCorrectSound();
        }
      } else {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
          currentAudioRef.current = null;
        }
        playWrongSound();
      }
    },
    [preloadedSounds, playCorrectSound, playWrongSound, settings.clef]
  );

  // Handle answer selection
  const handleAnswerSelect = useCallback(
    (selectedAnswer) => {
      // Read from refs to avoid stale closure through mic callback chain
      const curNote = currentNoteRef.current;
      const curTotalQuestions = totalQuestionsRef.current;

      if (!curNote || isGameEndingRef.current) return;

      const isCorrect = selectedAnswer === curNote.note;
      const questionLimit = settings.timedMode ? 10 : 20;
      // `curTotalQuestions` here is the count *before* this answer; `handleAnswer` increments it.
      const willEndGame = curTotalQuestions + 1 >= questionLimit;

      // === Engagement: Combo, Speed, Lives ===
      let earnedScore = 0;

      if (isCorrect) {
        // Increment combo (use ref to avoid stale closure)
        comboRef.current += 1;
        // Determine multiplier tier
        const tier = [...COMBO_TIERS].reverse().find((t) => comboRef.current >= t.min);
        const multiplier = tier?.multiplier ?? 1;
        // Check speed bonus
        const elapsed = performance.now() - (questionStartTimeRef.current ?? performance.now());
        const isSpeedBonus = elapsed <= SPEED_BONUS_THRESHOLD_MS;
        // Compute XP (flat per correct answer; combo + speed are visual-only engagement)
        earnedScore = BASE_XP;
        // Update combo state
        setCombo(comboRef.current);
        // Floating score animation
        setFloatingScoreKey((prev) => prev + 1);
        setFloatingScore(earnedScore);
        setTimeout(() => setFloatingScore(null), 600);
        // Show tier-up popup when multiplier increases
        if (multiplier > prevTierRef.current) {
          prevTierRef.current = multiplier;
          // Calculate target position relative to viewport center (fly to score pill)
          if (scorePillRef.current) {
            const rect = scorePillRef.current.getBoundingClientRect();
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            setTierUpTarget({
              x: rect.left + rect.width / 2 - cx,
              y: rect.top + rect.height / 2 - cy,
            });
          }
          setTierUpMultiplier(multiplier);
          setTimeout(() => setTierUpMultiplier(null), 1200);
        }
        // Show speed bonus flash
        if (isSpeedBonus) {
          setSpeedBonusKey((prev) => prev + 1);
          setShowSpeedBonus(true);
          setTimeout(() => setShowSpeedBonus(false), 800);
        }
        // On-fire activation — use ref to avoid stale closure in mic callback chain
        if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
          isOnFireRef.current = true;
          setIsOnFire(true);
          playFireSound();
          setShowFireSplash(true);
          setTimeout(() => setShowFireSplash(false), 1500);
        }
        // Auto-grow note pool (trail mode only — reveals hidden notes from current node's pool)
        if (nodeId && comboRef.current > 0 && hiddenNodeNotesRef.current.length > 0) {
          // Adaptive timing: reveal after 1 correct when only 1 note visible (avoids boring repetition),
          // otherwise use standard GROW_INTERVAL
          const visiblePoolSize = (normalizedSelectedNotes?.length || 0) + sessionExtraNotesRef.current.length;
          const shouldReveal = visiblePoolSize <= 1 || comboRef.current % GROW_INTERVAL === 0;

          if (shouldReveal) {
            const currentExtras = sessionExtraNotesRef.current;
            if (currentExtras.length < MAX_EXTRA_NOTES) {
              const nextNote = getNextHiddenNote();
              if (nextNote) {
                // Consume the revealed note from the hidden queue
                hiddenNodeNotesRef.current = hiddenNodeNotesRef.current.slice(1);
                const updated = [...currentExtras, nextNote];
                sessionExtraNotesRef.current = updated;
                setSessionExtraNotes(updated);
                setShowNewNoteBanner(true);
                setNewNoteBannerKey(prev => prev + 1);
                setTimeout(() => setShowNewNoteBanner(false), 2000);
              }
            }
          }
        }
      } else {
        // Wrong answer: shake combo, reset, deduct life
        if (comboRef.current > 0) {
          setComboShake(true);
          setTimeout(() => setComboShake(false), 300);
        }
        comboRef.current = 0;
        setCombo(0);
        prevTierRef.current = 1;
        livesRef.current -= 1;
        setLives(livesRef.current);
        earnedScore = 0;
        // On-fire deactivation — use ref to avoid stale closure in mic callback chain
        if (isOnFireRef.current) {
          isOnFireRef.current = false;
          setIsOnFire(false);
        }
        // If no lives left, mark game ending immediately (prevents next note flash)
        if (livesRef.current <= 0) {
          isGameEndingRef.current = true;
        }
      }

      // Call handleAnswer with scoreOverride for multiplied+speed score
      handleAnswer(selectedAnswer, curNote.note, isCorrect ? earnedScore : undefined);

      const willEndByLives = livesRef.current <= 0;

      // Set feedback state to highlight the buttons
      setAnswerFeedback({
        selectedNote: selectedAnswer,
        correctNote: curNote.note,
        isCorrect: isCorrect,
      });

      playSound(isCorrect, curNote);

      // Trigger lives-depletion game over
      if (willEndByLives) {
        setTimeout(() => handleGameOver(), 50);
        return;
      }

      // Game completion check is now handled by useEffect below
      // This ensures state updates are complete before checking

      // In Listen mode, wait for note release before advancing
      if (isListeningRef.current) {
        // If this was the last question, don't queue another note.
        if (!willEndGame) {
          const nextNote = getRandomNote();
          setPendingNextNote(nextNote);
          setWaitingForRelease(true);
        }
      } else {
        // Normal mode: if this was the last question, do NOT advance to another note.
        if (!willEndGame) {
          setTimeout(() => {
            // Avoid updating UI after the game has ended.
            if (isGameEndingRef.current) return;

            setAnswerFeedback({
              selectedNote: null,
              correctNote: null,
              isCorrect: null,
            });

            updateProgress({
              currentNote: getRandomNote(),
            });
          }, 800); // 800ms delay to show the feedback
        }
      }
    },
    [
      handleAnswer,
      handleGameOver,
      getRandomNote,
      playSound,
      playFireSound,
      getNextHiddenNote,
      nodeId,
      settings.timedMode,
      updateProgress,
    ]
  );

  // Close accidental picker modal when feedback begins (so UI never fights the grid)
  useEffect(() => {
    if (answerFeedback.selectedNote) {
      setVariantModal(null);
    }
  }, [answerFeedback.selectedNote]);

  // Flash the note card briefly on each new note (UI-only)
  useEffect(() => {
    if (!progress.currentNote) return;
    setNoteFlash(true);
    const tmr = setTimeout(() => setNoteFlash(false), 220);
    return () => clearTimeout(tmr);
  }, [
    progress.currentNote,
    progress.currentNote?.pitch,
    progress.currentNote?.englishName,
    progress.currentNote?.note,
  ]);

  // Reset question start time whenever a new note appears (for speed bonus measurement)
  useEffect(() => {
    if (progress.currentNote && progress.isStarted) {
      questionStartTimeRef.current = performance.now();
    }
  }, [progress.currentNote, progress.isStarted]);

  useEffect(() => {
    if (!variantModal) return;

    const onKeyDown = (event) => {
      if (event.key === "Escape") setVariantModal(null);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [variantModal]);

  // Click outside closes the variant popover without blocking the rest of the UI
  useEffect(() => {
    if (!variantModal) return;

    const onPointerDown = (event) => {
      const target = event.target;
      if (variantPopoverRef.current?.contains?.(target)) return;
      if (baseNotesRegionRef.current?.contains?.(target)) return;
      setVariantModal(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [variantModal]);

  // Check for game completion after state updates
  useEffect(() => {
    if (!progress.isStarted || gameOver || progress.totalQuestions === 0) {
      return;
    }

    const questionLimit = settings.timedMode ? 10 : 20;

    if (progress.totalQuestions >= questionLimit) {
      if (!isGameEndingRef.current) {
        isGameEndingRef.current = true;
      }
      handleGameOver();
    }
  }, [
    progress.totalQuestions,
    progress.isStarted,
    gameOver,
    settings.timedMode,
    handleGameOver,
  ]);

  // Handle pause game
  const handlePauseGame = () => {
    pauseGameTimer();
    updateProgress({ showSettingsModal: true });
  };

  // Handle resume game from settings modal
  const handleResumeGame = () => {
    updateProgress({ showSettingsModal: false });

    setTimeout(() => {
      // Only restart timer if in timed mode and there's time remaining
      if (settings.timedMode && timeRemaining > 0) {
        startTimer();
      } else if (timeRemaining === 0) {
        handleGameOver();
      }
    }, 100);
  };

  // Handle restart game from settings modal
  const handleRestartGame = (newSettings) => {
    updateProgress({ showSettingsModal: false });

    if (!newSettings || !newSettings.selectedNotes) {
      newSettings = {
        clef: settings.clef,
        // Keep restart defaults tied to the user's actual selection.
        // Using `normalizedSelectedNotes` expands an empty selection to the full pool.
        selectedNotes: settings.selectedNotes,
        timedMode: settings.timedMode,
        difficulty: settings.difficulty,
        timeLimit: settings.timeLimit,
      };
    }

    const restartSelectedNotes = normalizeSelectedNotes({
      selectedNotes: newSettings.selectedNotes,
      clef: newSettings.clef || settings.clef,
      trebleNotes,
      bassNotes,
      targetField: "pitch",
      enableSharps: newSettings.enableSharps ?? settings.enableSharps,
      enableFlats: newSettings.enableFlats ?? settings.enableFlats,
    });

    newSettings = {
      ...newSettings,
      selectedNotes: restartSelectedNotes,
    };

    updateSettings(newSettings);

    setTimeout(() => {
      startGame(newSettings);
    }, 100);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Effect to handle timer behavior
  useEffect(() => {
    // Start timer when game starts, but only if in timed mode
    if (
      progress.isStarted &&
      !gameOver &&
      !isTimerActive &&
      settings.timedMode
    ) {
      startTimer();
    }

    // End game when time runs out, but only if in timed mode
    if (
      progress.isStarted &&
      !gameOver &&
      settings.timedMode &&
      timeRemaining === 0
    ) {
      handleGameOver();
    }
  }, [
    progress.isStarted,
    gameOver,
    isTimerActive,
    timeRemaining,
    startTimer,
    handleGameOver,
    settings.timedMode,
  ]);

  const micTiming = useMemo(() => {
    // NotesRecognitionGame may not have BPM settings — use a moderate default
    const bpm = settings?.tempo || settings?.bpm || 90;
    return calcMicTimingFromBpm(bpm, 'q'); // Quarter note default for recognition
  }, [settings?.tempo, settings?.bpm]);

  // Callback for useMicNoteInput: handle incoming note events from shared audio pipeline.
  // Reads currentNote from ref to avoid stale closure — the callback chain through
  // useMicNoteInput → usePitchDetection → rAF loop can lag behind React re-renders.
  const handleMicNoteEvent = useCallback((event) => {
    if (event.type !== 'noteOn') return;

    const now = performance.now();
    const last = lastScoredRef.current;
    const minScoreInterval = micTiming.minInterOnMs || 80;
    if (last.pitch === event.pitch && now - last.time < minScoreInterval * 2) {
      return; // Block double-scoring same pitch
    }
    lastScoredRef.current = { pitch: event.pitch, time: now };

    const note = event.pitch;
    setDetectedNote(note);

    // Game-specific logic: if waiting for note release, ignore new note events
    if (waitingForReleaseRef.current) return;

    // Read from ref for latest value (avoids stale closure)
    const cur = currentNoteRef.current;

    // Check if detected note matches current question
    // event.pitch is English format ("C4"), match against .pitch or .englishName
    if (note && cur &&
        (note === cur.pitch || note === cur.englishName)) {
      handleAnswerSelect(cur.note);
    } else if (note && cur) {
      handleAnswerSelect(note); // Wrong note — triggers life deduction, combo reset, etc.
    }
  }, [handleAnswerSelect, micTiming]);

  // useMicNoteInput: shared audio pipeline with manual control (isActive: false)
  const {
    audioLevel,
    isListening,
    startListening: startMicListening,
    stopListening: stopMicListening,
  } = useMicNoteInput({
    isActive: false, // Manual control via startAudioInput / stopAudioInput
    onNoteEvent: handleMicNoteEvent,
    ...micTiming,
    // NOTE: analyserNode/sampleRate NOT passed here at render time.
    // They are null until requestMic() completes. Pass at call time instead (ARCH-04 race fix).
  });
  isListeningRef.current = isListening;

  // Start audio input — requests mic from shared provider, then starts detection
  const startAudioInput = useCallback(async () => {
    try {
      // IOS-02: resume() synchronously on gesture before any await (no-op when already running)
      audioContextProviderRef?.current?.resume();
      // requestMic() returns { audioContext, analyser } — pass directly at call time
      const { analyser, audioContext: ctx } = await requestMic();
      await startMicListening({ analyserNode: analyser, sampleRate: ctx.sampleRate });
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [requestMic, startMicListening, audioContextProviderRef]);

  // Stop audio input — stops detection and releases shared mic
  const stopAudioInput = useCallback(() => {
    stopMicListening();
    releaseMic();
    setWaitingForRelease(false);
    setPendingNextNote(null);
    setDetectedNote(null);
  }, [stopMicListening, releaseMic]);

  // Stop mic when navigating to a new trail node
  useEffect(() => {
    stopAudioInput();
  }, [nodeId, stopAudioInput]);

  // Toggle audio input (Listen mode button)
  const toggleAudioInput = useCallback(() => {
    if (isListening) {
      stopAudioInput();
    } else {
      startAudioInput();
    }
  }, [isListening, stopAudioInput, startAudioInput]);

  // Effect: watch audioLevel to detect note release after a correct answer
  // This replaces the rAF-loop level check from the old inline detectLoop
  useEffect(() => {
    if (waitingForRelease && audioLevel * 100 < RELEASE_THRESHOLD) {
      setWaitingForRelease(false);
      setAnswerFeedback({
        selectedNote: null,
        correctNote: null,
        isCorrect: null,
      });
      updateProgress({ currentNote: pendingNextNote });
      setPendingNextNote(null);
    }
  }, [waitingForRelease, audioLevel, pendingNextNote, updateProgress]);

  // Stop audio input when game finishes
  useEffect(() => {
    if (progress.isFinished) {
      stopAudioInput();
    }
  }, [progress.isFinished, stopAudioInput]);

  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  // Fallback timeout: force next question if note release is never detected
  useEffect(() => {
    if (waitingForRelease && pendingNextNote) {
      const fallbackTimer = setTimeout(() => {
        setWaitingForRelease(false);
        setAnswerFeedback({
          selectedNote: null,
          correctNote: null,
          isCorrect: null,
        });
        updateProgress({ currentNote: pendingNextNote });
        setPendingNextNote(null);
      }, 5000); // 5 second fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [waitingForRelease, pendingNextNote, updateProgress]);

  // Show loading screen during navigation
  if (isNavigating) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-white" />
          <p className="text-xl text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }


  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden supports-[height:100svh]:h-[100svh]"
      style={{
        background: isOnFire
          ? 'linear-gradient(to bottom right, #713f12, #854d0e, #713f12)'
          : 'linear-gradient(to bottom right, #312e81, #581c87, #4c1d95)',
        transition: 'background 0.6s ease-in-out',
      }}
    >
      {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
      {/* Stage background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>

      {/* On-fire activation splash — big flame icon */}
      <AnimatePresence>
        {showFireSplash && (
          <motion.div
            key="fire-splash"
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: [1, 1.15, 1] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
          >
            <img src={flameIcon} alt="" className="h-24 w-24 drop-shadow-[0_0_16px_rgba(251,146,60,0.6)] sm:h-28 sm:w-28" />
          </motion.div>
        )}
      </AnimatePresence>


      {progress.showFireworks && <Firework />}

      {/* Show loading screen when coming from trail and waiting for auto-start */}
      {!progress.isStarted && nodeConfig ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            <p className="text-lg font-medium text-white/80">{t('common.loading')}</p>
          </div>
        </div>
      ) : !progress.isStarted ? (
        <UnifiedGameSettings
          gameType="note-recognition"
          steps={[
            {
              id: "clef",
              title: "gameSettings.steps.labels.clef",
              component: "ClefSelection",
            },
            {
              id: "notes",
              title: "gameSettings.steps.labels.notes",
              component: "NoteSelection",
              config: { showImages: true, minNotes: 2, noteIdField: "pitch" },
            },
            {
              id: "timedMode",
              title: "gameSettings.steps.labels.gameMode",
              component: "TimedModeSelection",
            },
          ]}
          initialSettings={{
            clef: settings.clef,
            // IMPORTANT: Pass through the user's *actual* selection.
            // `normalizedSelectedNotes` expands an empty selection to the full default pool,
            // which can cause unexpected notes (e.g. F#4) to appear.
            selectedNotes: settings.selectedNotes,
            timedMode: settings.timedMode,
            difficulty: settings.difficulty,
          }}
          onStart={handleGameSettings}
          backRoute="/notes-master-mode"
          noteData={{
            trebleNotes,
            bassNotes,
          }}
        />
      ) : progress.isFinished ? (
        progress.isLost ? (
          <GameOverScreen
            score={progress.score}
            totalQuestions={progress.totalQuestions}
            timeRanOut={progress.timeRanOut}
            livesLost={progress.livesLost}
            correctAnswers={progress.correctAnswers}
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
          />
        ) : (
          <VictoryScreen
            score={progress.score}
            totalPossibleScore={progress.totalQuestions * BASE_XP}
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
            onExit={() => navigate(challengeMode ? "/" : "/notes-master-mode")}
            nodeId={nodeId}
            exerciseIndex={trailExerciseIndex}
            totalExercises={trailTotalExercises}
            exerciseType={trailExerciseType}
            onNextExercise={handleNextExercise}
            challengeMode={challengeMode}
            challengeId={challengeId}
            challengeXpReward={challengeXpReward}
          />
        )
      ) : (
        <>
          {/* HUD */}
          <div className="relative mx-auto w-full max-w-5xl px-3 pt-2 sm:px-6 sm:pt-3 landscape:pt-1">
            <StageCard className="px-3 py-2 sm:px-4 sm:py-2 landscape:py-1">
              <div className="flex items-center justify-between gap-2">
                {!progress.isFinished ? (
                  <BackButton
                    to={nodeId ? "/trail" : "/notes-master-mode"}
                    name={nodeId ? t("navigation.links.trail", "Trail") : t("navigation.links.studentDashboard")}
                    styling="text-white/85 hover:text-white text-xs sm:text-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-20" />
                )}

                <div className="flex flex-1 items-center justify-center gap-2">
                  {/* Score pill — glows when multiplier active */}
                  {(() => {
                    const tier = [...COMBO_TIERS].reverse().find((t) => combo >= t.min);
                    const mult = tier?.multiplier ?? 1;
                    const pillBorder = mult >= 3
                      ? "border-yellow-400/40"
                      : mult >= 2
                        ? "border-amber-400/30"
                        : "border-white/20";
                    const pillBg = mult >= 3
                      ? "bg-yellow-500/20"
                      : mult >= 2
                        ? "bg-amber-500/15"
                        : "bg-white/10";
                    return (
                      <div ref={scorePillRef} className="relative">
                        <div
                          className={`flex items-center gap-2 rounded-full border ${pillBorder} ${pillBg} px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none`}
                        >
                          <span className="text-xs font-semibold text-white/80 sm:text-sm">
                            XP
                          </span>
                          <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
                            {progress.score}
                          </span>
                        </div>
                        {/* Floating +score animation */}
                        <AnimatePresence>
                          {floatingScore !== null && (
                            <motion.span
                              key={floatingScoreKey}
                              initial={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                              animate={reduce ? { opacity: 0 } : { opacity: 0, y: -28 }}
                              transition={{ duration: 0.55 }}
                              className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-mono font-bold drop-shadow-md ${
                                (tier?.multiplier ?? 1) >= 3
                                  ? "text-base text-yellow-300 sm:text-lg"
                                  : (tier?.multiplier ?? 1) >= 2
                                    ? "text-sm text-amber-300 sm:text-base"
                                    : "text-sm text-white sm:text-base"
                              }`}
                            >
                              +{floatingScore}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  {/* On-fire badge — inline, left of streak pill */}
                  <AnimatePresence>
                    {isOnFire && (
                      <motion.div
                        key="fire-badge"
                        initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className={reduce || appReducedMotion ? '' : 'animate-pulse'}
                      >
                        <img src={flameIcon} alt="" className="h-10 w-10" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Streak counter — always visible, lightning bolt + number */}
                  <motion.div
                    ref={comboPillRef}
                    animate={
                      comboShake
                        ? { x: [0, -6, 6, -4, 4, 0] }
                        : combo > 0
                          ? { scale: [1, 1.18, 1] }
                          : undefined
                    }
                    transition={reduce ? undefined : { type: "tween", duration: 0.22, ease: "easeInOut" }}
                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-colors duration-300 motion-reduce:transition-none ${
                      combo >= 8
                        ? "border-yellow-400/40 bg-yellow-500/20"
                        : combo >= 3
                          ? "border-amber-400/30 bg-amber-500/15"
                          : "border-white/20 bg-white/10"
                    }`}
                  >
                    <Zap
                      className={`h-4 w-4 ${
                        combo >= 8
                          ? "fill-yellow-300 text-yellow-300"
                          : combo >= 3
                            ? "fill-amber-300 text-amber-300"
                            : "text-white/70"
                      }`}
                    />
                    <span className="font-mono text-sm font-bold tracking-wide text-white sm:text-base">
                      {combo}
                    </span>
                  </motion.div>

                  {settings.timedMode ? (
                    <TimerDisplay formattedTime={formattedTime} />
                  ) : null}
                </div>

                {!progress.isFinished && (
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {/* Lives hearts */}
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
                        <AnimatePresence key={i} mode="wait">
                          {i < lives ? (
                            <motion.div
                              key={`heart-${i}-alive`}
                              initial={false}
                              exit={reduce ? undefined : { scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
                              transition={{ duration: 0.3 }}
                            >
                              <Heart className="h-5 w-5 fill-red-400 text-red-400 sm:h-6 sm:w-6" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`heart-${i}-dead`}
                              initial={reduce ? undefined : { scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 0.3 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Heart className="h-5 w-5 text-white/30 sm:h-6 sm:w-6" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      ))}
                    </div>

                    <button
                      onClick={handlePauseGame}
                      className="touch-manipulation rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-[0.98] motion-reduce:transition-none sm:text-sm"
                    >
                      {settings.timedMode
                        ? t("games.actions.pause")
                        : t("pages.settings.title")}
                    </button>
                  </div>
                )}
              </div>
            </StageCard>
          </div>

          <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden px-3 pb-4 sm:px-6 sm:pb-6 landscape:pb-2">
            {/* Progress Bar */}
            <div className="mt-4">
              <ProgressBar
                current={progress.totalQuestions}
                total={settings.timedMode ? 10 : 20} // Set higher goal for non-timed mode
              />
            </div>

            {/* Speed bonus flash — centered below progress bar */}
            <div className="pointer-events-none flex h-7 items-center justify-center">
              <AnimatePresence>
                {showSpeedBonus && (
                  <motion.span
                    key={speedBonusKey}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-full bg-amber-400/20 px-4 py-1 text-sm font-bold text-amber-300 backdrop-blur-sm sm:text-base"
                  >
                    {t("games.engagement.fast")}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* New note unlocked banner (auto-grow, trail mode only) */}
            <AnimatePresence>
              {showNewNoteBanner && (
                <motion.div
                  key={newNoteBannerKey}
                  initial={{ opacity: 0, y: -30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-none absolute left-1/2 top-12 z-50 -translate-x-1/2"
                >
                  <span className="rounded-full bg-emerald-400/20 px-4 py-1.5 text-sm font-bold text-emerald-300 backdrop-blur-sm sm:text-base">
                    {t("games.engagement.newNote")}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tier-up popup — splash in center then shrink to score pill */}
            <AnimatePresence>
              {tierUpMultiplier && (
                <motion.div
                  key={`tier-${tierUpMultiplier}`}
                  initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5, x: 0, y: 0 }}
                  animate={reduce
                    ? { opacity: [1, 1, 0] }
                    : {
                        opacity: [0, 1, 1, 1],
                        scale: [0.5, 1, 1, 0.3],
                        x: [0, 0, 0, tierUpTarget.x],
                        y: [0, 0, 0, tierUpTarget.y],
                      }
                  }
                  transition={reduce
                    ? { duration: 1.2 }
                    : {
                        duration: 1.2,
                        times: [0, 0.15, 0.6, 1],
                        ease: 'easeInOut',
                      }
                  }
                  className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center"
                >
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/90 to-yellow-500/90 px-8 py-5 text-center shadow-2xl shadow-amber-500/30 backdrop-blur-sm">
                    <div className="text-3xl font-black text-white drop-shadow-lg sm:text-4xl">
                      {tierUpMultiplier >= 3
                        ? t("games.engagement.triplePoints")
                        : t("games.engagement.doublePoints")}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Input Status */}
            {isListening && (
              <div className="mx-auto mb-4 w-full max-w-3xl px-6">
                <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                  <div className="mb-2 text-center text-sm text-white/80">
                    🎤 מאזין לנגינה
                  </div>

                  {/* Audio Level Meter */}
                  <div className="mb-2 h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-100"
                      style={{
                        width: `${Math.min(audioLevel * 1000, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Detected Note - Always visible to prevent layout shifts */}
                  <div className="text-center text-lg font-bold text-yellow-300">
                    זיהיתי: {detectedNote || "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Main game area */}
            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:grid lg:flex-none lg:grid-cols-[0.95fr_1.05fr] lg:items-start landscape:mt-2 landscape:grid landscape:flex-none landscape:grid-cols-[0.95fr_1.05fr] landscape:items-start landscape:gap-2">
              {/* Note hero card */}
              <motion.div
                key={`${progress.currentNote?.pitch || progress.currentNote?.englishName || progress.currentNote?.note || "none"}`}
                initial={reduce ? false : { opacity: 0.9, y: 8, scale: 0.98 }}
                animate={
                  reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
                }
                transition={soft}
                style={{ willChange: "transform, opacity" }}
                className="shrink-0"
              >
                <StageCard className="p-3 sm:p-5">
                  <div
                    className={`rounded-3xl bg-white p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.75)] ring-1 ring-black/5 transition-all duration-200 motion-reduce:transition-none ${
                      noteFlash
                        ? "ring-4 ring-emerald-300/60"
                        : "ring-2 ring-white/20"
                    }`}
                  >
                    <div className="mx-auto flex h-[clamp(160px,26vh,280px)] w-full max-w-[520px] items-center justify-center sm:h-[clamp(220px,30vh,340px)] landscape:h-[clamp(150px,30vh,260px)]">
                      {progress.currentNote ? (
                        <NoteImageDisplay note={progress.currentNote} />
                      ) : (
                        <span className="text-red-500">Note Image</span>
                      )}
                    </div>
                  </div>
                </StageCard>
              </motion.div>

              {/* Answers */}
              <StageCard
                className={`flex min-h-0 flex-1 flex-col p-3 transition-all duration-200 sm:p-5 lg:flex-none landscape:flex-none ${variantModal ? "blur-[2px] brightness-50" : ""}`}
              >
                {/* Mobile / small screens: grouped grid */}
                <div
                  ref={baseNotesRegionRef}
                  className="relative grid min-h-0 flex-1 grid-cols-2 gap-1 overflow-y-auto overflow-x-visible pr-1 lg:hidden landscape:grid-cols-3 landscape:gap-1.5"
                >
                  {groupedMobileNotes.map((group) => renderMobileNoteGroup(group))}
                </div>

                {/* Desktop: split into naturals and accidentals */}
                <div className="hidden h-full gap-6 lg:flex" dir="ltr">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      {orderedNaturals.map((note) => renderNoteButton(note))}
                    </div>
                  </div>
                  {orderedAccidentals.length > 0 && (
                    <div className="flex-1 border-l border-white/10 pl-4">
                      <div className="grid grid-cols-2 gap-3">
                        {orderedAccidentals.map((note) => renderNoteButton(note))}
                      </div>
                    </div>
                  )}
                </div>
              </StageCard>
            </div>
          </div>

          {/* Listen Button (feature-flagged off for now) */}
          {SHOW_LISTEN_BUTTON && progress.isStarted && !progress.isFinished && (
            <div
              className={`fixed bottom-6 z-50 ${isRTL ? "left-6" : "right-6"}`}
            >
              <button
                onClick={toggleAudioInput}
                className={`flex touch-manipulation items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-4 py-3 text-base font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,0.1)] backdrop-blur-md transition-all duration-200 hover:bg-white/15 active:scale-[0.98] motion-reduce:transition-none sm:gap-3 sm:px-5 sm:py-4 sm:text-lg ${
                  isListening ? "animate-pulse" : ""
                }`}
                aria-label={
                  isListening
                    ? t("games.actions.stopListening")
                    : t("games.actions.listen")
                }
              >
                {isListening ? (
                  <FaMicrophoneSlash className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                ) : (
                  <FaMicrophone className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                )}
                <span>
                  {isListening
                    ? t("games.actions.stop")
                    : t("games.actions.listen")}
                </span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Accidentals picker (mobile): spotlight overlay anchored to the pressed base note */}
      <AnimatePresence>
        {variantModal && !answerFeedback.selectedNote ? (
          <motion.div
            className="fixed z-[80]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            onClick={() => setVariantModal(null)}
            style={
              variantModal.baseNotesRect
                ? {
                    left: variantModal.baseNotesRect.left,
                    top: variantModal.baseNotesRect.top,
                    width: variantModal.baseNotesRect.width,
                    height: variantModal.baseNotesRect.height,
                  }
                : { left: 0, top: 0, width: "100vw", height: "100vh" }
            }
          >
            {(() => {
              const r = variantModal.anchorRect;
              const viewportW =
                typeof window !== "undefined" ? window.innerWidth : 0;
              const viewportH =
                typeof window !== "undefined" ? window.innerHeight : 0;
              const cx = r ? r.left + r.width / 2 : viewportW / 2;
              const belowY = r ? r.top + r.height + 12 : viewportH / 2 + 24;
              const needsFlip =
                typeof window !== "undefined" &&
                window.innerHeight - belowY < 120;
              const baseCy = r ? r.top + r.height / 2 : viewportH / 2;
              const baseW = r?.width ?? 56;
              const baseH = r?.height ?? 56;
              const baseLeft = r?.left ?? cx - baseW / 2;
              const baseTop = r?.top ?? baseCy - baseH / 2;

              const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

              // Keep the accidental option "bubbles" compact and close to each other.
              // Use the smaller dimension so wide buttons don't push the radius too far out.
              const optionSize = 56; // matches h-14 w-14
              const baseMin = Math.min(baseW, baseH);
              const radius = clamp(Math.round(baseMin * 1.15), 52, 72);
              // Slight horizontal compression makes the cluster feel tighter without
              // risking overlap with the base button (vertical clearance stays the same).
              const radiusX = Math.round(radius * 0.78);
              const radiusY = radius;
              const angles =
                variantModal.options?.length >= 3
                  ? needsFlip
                    ? [150, 90, 30]
                    : [210, 270, 330]
                  : variantModal.options?.length === 2
                    ? needsFlip
                      ? [135, 45]
                      : [225, 315]
                    : needsFlip
                      ? [90]
                      : [270];

              return (
                <>
                  {/* Base note proxy (unblurred) */}
                  {r ? (
                    <motion.div
                      className="pointer-events-none fixed z-[90]"
                      initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={soft}
                      style={{
                        left: baseLeft,
                        top: baseTop,
                        width: baseW,
                        height: baseH,
                      }}
                    >
                      <div
                        className={`${getAnswerButtonClass(
                          variantModal.options?.[0]?.note
                        )} flex h-full w-full items-center justify-center ring-4 ring-white/30`}
                      >
                        <span className="text-base font-semibold">
                          {variantModal.baseLabel}
                        </span>
                      </div>
                    </motion.div>
                  ) : null}

                  {/* Floating option buttons around the base note */}
                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label={
                      useHebrewNoteLabels
                        ? `בחר גרסה עבור ${variantModal.baseLabel}`
                        : `Choose variant for ${variantModal.baseLabel}`
                    }
                    ref={variantPopoverRef}
                    className="fixed z-[95]"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fade}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {variantModal.options?.map((opt, idx) => {
                      const theta =
                        (angles[idx] ?? angles[angles.length - 1]) *
                        (Math.PI / 180);
                      const ox = cx + radiusX * Math.cos(theta);
                      const oy = baseCy + radiusY * Math.sin(theta);

                      const leftPx =
                        typeof window !== "undefined"
                          ? clamp(
                              ox - optionSize / 2,
                              10,
                              window.innerWidth - optionSize - 10
                            )
                          : ox - optionSize / 2;
                      const topPx =
                        typeof window !== "undefined"
                          ? clamp(
                              oy - optionSize / 2,
                              10,
                              window.innerHeight - optionSize - 10
                            )
                          : oy - optionSize / 2;

                      return (
                        <motion.button
                          key={opt.note || `variant-${idx}`}
                          type="button"
                          className="bg-white/12 h-14 w-14 rounded-full border border-white/20 text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md"
                          variants={{
                            hidden: reduce
                              ? { opacity: 1, scale: 1 }
                              : { opacity: 0, scale: 0.7, y: 10 },
                            show: {
                              opacity: 1,
                              scale: 1,
                              y: 0,
                              transition: reduce ? { duration: 0 } : snappy,
                            },
                          }}
                          initial="hidden"
                          animate="show"
                          transition={
                            reduce ? undefined : { delay: idx * 0.04 }
                          }
                          whileTap={reduce ? undefined : { scale: 0.94 }}
                          style={{
                            position: "fixed",
                            left: leftPx,
                            top: topPx,
                          }}
                          onClick={() => {
                            setVariantModal(null);
                            handleAnswerSelect(opt.note);
                          }}
                        >
                          <span className="text-base font-bold leading-none">
                            {formatNoteLabel(opt)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </>
              );
            })()}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Audio Interrupted Overlay — shown on iOS Safari after phone call, app switch, lock screen */}
      <AudioInterruptedOverlay
        isVisible={isInterrupted}
        onTapToResume={handleTapToResume}
        onRestartExercise={() => navigate('/notes-master-mode')}
      />

      {/* Trail gesture gate — shown when trail auto-start needs a user gesture to resume AudioContext */}
      {needsGestureToStart && (
        <AudioInterruptedOverlay
          isVisible={true}
          onTapToResume={handleGestureStart}
          onRestartExercise={() => navigate(-1)}
        />
      )}

      {/* Settings Modal (for free play mode) */}
      <AnimatePresence>
        {progress.showSettingsModal ? (
          <UnifiedGameSettings
            key="note-recognition-settings-modal"
            gameType="note-recognition"
            isModal={true}
            steps={[
              {
                id: "clef",
                title: "gameSettings.steps.labels.clef",
                component: "ClefSelection",
              },
              {
                id: "notes",
                title: "gameSettings.steps.labels.notes",
                component: "NoteSelection",
                config: { showImages: true, minNotes: 2, noteIdField: "pitch" },
              },
              {
                id: "timedMode",
                title: "gameSettings.steps.labels.gameMode",
                component: "TimedModeSelection",
              },
            ]}
            initialSettings={{
              clef: settings.clef,
              // Keep the modal synced to the user's actual selection (no implicit expansion).
              selectedNotes: settings.selectedNotes,
              timedMode: settings.timedMode,
              difficulty: settings.difficulty,
            }}
            onStart={handleRestartGame}
            onCancel={handleResumeGame}
            backRoute="/notes-master-mode"
            noteData={{
              trebleNotes,
              bassNotes,
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
