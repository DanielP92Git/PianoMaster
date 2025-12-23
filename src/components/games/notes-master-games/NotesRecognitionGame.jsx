import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Coins, Clock3, Loader2 } from "lucide-react";
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

// Use comprehensive note definitions from Sight Reading game
const trebleNotes = TREBLE_NOTES;
const bassNotes = BASS_NOTES;

// Audio level threshold for note release detection (percentage)
const RELEASE_THRESHOLD = 1.5; // 1.5% - low enough to catch release, high enough to avoid background noise

const NOTE_FREQUENCIES = {
  דו: [130.81, 261.63, 523.25, 1046.5], // C3, C4, C5, C6
  רה: [146.83, 293.66, 587.33, 1174.66], // D3, D4, D5, D6
  מי: [164.81, 329.63, 659.25, 1318.51], // E3, E4, E5, E6
  פה: [174.61, 349.23, 698.46, 1396.91], // F3, F4, F5, F6
  סול: [196.0, 392.0, 783.99, 1567.98], // G3, G4, G5, G6
  לה: [220.0, 440.0, 880.0, 1760.0], // A3, A4, A5, A6
  סי: [246.94, 493.88, 987.77, 1975.53], // B3, B4, B5, B6
};

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

const HudPill = ({ icon: Icon, label, value, className = "" }) => (
  <div
    className={`flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md ${className}`}
  >
    {Icon && <Icon className="h-4 w-4 text-white/80" />}
    <span className="text-xs font-semibold text-white/80 sm:text-sm">
      {label}
    </span>
    {value !== undefined && value !== null && (
      <span className="font-mono text-sm font-bold tracking-wide sm:text-base">
        {value}
      </span>
    )}
  </div>
);

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
  const { soft, reduce } = useMotionTokens();
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

        {/* Traveling note */}
        {(() => {
          const isStart = progressPercent <= 0.5;
          const isEnd = progressPercent >= 99.5;
          const xClass = isStart
            ? "translate-x-0"
            : isEnd
              ? "-translate-x-full"
              : "-translate-x-1/2";

          return (
            <motion.span
              className={`pointer-events-none absolute top-1/2 ${xClass} -translate-y-1/2 text-white/90 drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]`}
              animate={
                reduce
                  ? undefined
                  : {
                      left: isStart
                        ? "0%"
                        : isEnd
                          ? "100%"
                          : `${progressPercent}%`,
                    }
              }
              style={{
                left: isStart ? "0%" : isEnd ? "100%" : `${progressPercent}%`,
                willChange: "left",
              }}
              transition={soft}
            >
              ♪
            </motion.span>
          );
        })()}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-white/75">
        <span>
          {Math.min(total, Math.max(1, current + 1))}/{total}
        </span>
        <span className="hidden sm:inline">
          Question {Math.min(total, Math.max(1, current + 1))} of {total}
        </span>
      </div>
    </div>
  );
};

export function NotesRecognitionGame() {
  const { soft, snappy, fade, reduce } = useMotionTokens();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.language === "he";
  const useHebrewNoteLabels = i18n.language === "he";
  const SHOW_LISTEN_BUTTON = false;
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

  const { progress, updateProgress, handleAnswer, finishGame, resetProgress } =
    useGameProgress();

  // Use the centralized sounds hook
  const {
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    playGameOverSound,
  } = useSounds();

  // Game state
  const [gameOver, setGameOver] = useState(false);

  // Audio input state
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false); // Ref for immediate access in closures
  const [audioContext, setAudioContext] = useState(null);
  const [, setAnalyser] = useState(null);
  const [microphone, setMicrophone] = useState(null);
  const [detectedNote, setDetectedNote] = useState(null);
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const lastMatchTimeRef = useRef(0); // Use ref instead of state for immediate updates
  const animationFrameRef = useRef(null);
  const stopAudioInputRef = useRef(null);

  // State for button highlighting feedback
  const [answerFeedback, setAnswerFeedback] = useState({
    selectedNote: null,
    correctNote: null,
    isCorrect: null,
  });

  // State for note release detection in Listen mode
  const [waitingForRelease, setWaitingForRelease] = useState(false);
  const isGameEndingRef = useRef(false);
  const [pendingNextNote, setPendingNextNote] = useState(null);
  const [variantModal, setVariantModal] = useState(null);
  const baseNotesRegionRef = useRef(null);
  const variantPopoverRef = useRef(null);

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

  // Pause the timer
  const pauseTimer = useCallback(() => {
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
    setIsListening(false);
    setDetectedNote(null);
    setAudioInputLevel(0);
  }, [resetProgress, resetTimer]);

  // Handle game over logic
  const handleGameOver = useCallback(() => {
    if (gameOver) return;
    isGameEndingRef.current = true;

    const scorePercentage =
      (progress.correctAnswers / Math.max(1, progress.totalQuestions)) * 100;

    // Only consider time running out as a loss condition if in timed mode
    const timeRanOut = settings.timedMode && timeRemaining <= 0;
    const isLost = scorePercentage < 50 || timeRanOut;

    // Note: Score saving is handled by useGameProgress.finishGame()
    // Switch UI immediately (don't wait for async score save) so we don't render an extra note
    // after the final answer.
    updateProgress({ isFinished: true, isLost, timeRanOut });

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

    pauseTimer();
    setGameOver(true);
    finishGame(isLost, timeRanOut);
  }, [
    gameOver,
    progress.correctAnswers,
    progress.totalQuestions,
    timeRemaining,
    updateProgress,
    pauseTimer,
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

    const filteredNotes = selectedSet
      ? notesArray.filter((note) => {
          const tag =
            note.__clef || getClefTypeForPitch(note.pitch || note.englishName);
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
      : notesArray;

    return filteredNotes[Math.floor(Math.random() * filteredNotes.length)];
  }, [
    normalizedSelectedNotes,
    settings.clef,
    settings.enableFlats,
    settings.enableSharps,
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

    const timeLimit = updatedSettings.timeLimit || 45;
    pauseTimer();
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

              return clefKey === "both"
                ? selectedSet.has(`${tag}:${notePitch}`) ||
                    (allowAccidental && selectedSet.has(`${tag}:${base}`))
                : selectedSet.has(notePitch) ||
                    (allowAccidental && selectedSet.has(base));
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

    return uniqueNotes;
  }, [
    settings.clef,
    settings.enableFlats,
    settings.enableSharps,
    normalizedSelectedNotes,
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
        console.log(
          `🔇 [AUDIO MUTED] Skipping playback during Listen mode (note: ${noteLabel})`
        );
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
      if (!progress.currentNote || isGameEndingRef.current) return;

      const isCorrect = handleAnswer(selectedAnswer, progress.currentNote.note);
      const questionLimit = settings.timedMode ? 10 : 20;
      // `progress.totalQuestions` here is the count *before* this answer; `handleAnswer` increments it.
      const willEndGame = progress.totalQuestions + 1 >= questionLimit;

      // Set feedback state to highlight the buttons
      setAnswerFeedback({
        selectedNote: selectedAnswer,
        correctNote: progress.currentNote.note,
        isCorrect: isCorrect,
      });

      playSound(isCorrect, progress.currentNote);

      // Game completion check is now handled by useEffect below
      // This ensures state updates are complete before checking

      // In Listen mode, wait for note release before advancing
      if (isListening) {
        // If this was the last question, don't queue another note.
        if (!willEndGame) {
          const nextNote = getRandomNote();
          setPendingNextNote(nextNote);
          setWaitingForRelease(true);
          console.log(
            `🎵 [WAITING FOR RELEASE] Next note ready: "${nextNote.note}" - waiting for audio level to drop below ${RELEASE_THRESHOLD}%`
          );
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
      progress.currentNote,
      progress.totalQuestions,
      handleAnswer,
      isListening,
      getRandomNote,
      playSound,
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
    pauseTimer();
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

  // Pitch detection using autocorrelation
  const detectPitch = useCallback((buffer, sampleRate) => {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;
    let foundGoodCorrelation = false;
    const GOOD_ENOUGH_CORRELATION = 0.9;

    // Calculate RMS
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Not enough signal
    if (rms < 0.01) return -1;

    let lastCorrelation = 1;
    for (let offset = 1; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;

      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(buffer[i] - buffer[i + offset]);
      }
      correlation = 1 - correlation / MAX_SAMPLES;

      if (
        correlation > GOOD_ENOUGH_CORRELATION &&
        correlation > lastCorrelation
      ) {
        foundGoodCorrelation = true;
        if (correlation > bestCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      } else if (foundGoodCorrelation) {
        break;
      }
      lastCorrelation = correlation;
    }

    if (bestCorrelation > 0.01) {
      return sampleRate / bestOffset;
    }
    return -1;
  }, []);

  // Convert frequency to note name
  const frequencyToNote = useCallback((frequency) => {
    if (frequency <= 0) return null;

    let closestNote = null;
    let minDifference = Infinity;

    Object.entries(NOTE_FREQUENCIES).forEach(([note, frequencies]) => {
      frequencies.forEach((freq) => {
        const difference = Math.abs(frequency - freq);
        const tolerance = freq * 0.05; // 5% tolerance - reduces false fluctuations during note decay
        if (difference < tolerance && difference < minDifference) {
          minDifference = difference;
          closestNote = note;
        }
      });
    });

    return closestNote;
  }, []);

  // Start audio input
  const startAudioInput = useCallback(async () => {
    try {
      console.log("🎤 [PITCH DETECTION] Starting audio input...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      analyserNode.fftSize = 2048;
      analyserNode.smoothingTimeConstant = 0.8;

      source.connect(analyserNode);

      console.log(
        `🎤 [PITCH DETECTION] Audio context created with sample rate: ${context.sampleRate} Hz`
      );
      console.log(
        `🎤 [PITCH DETECTION] Analyser FFT size: ${analyserNode.fftSize}`
      );

      setAudioContext(context);
      setAnalyser(analyserNode);
      setMicrophone(stream);
      // Note: setIsListening(true) is now called in toggleAudioInput BEFORE this function

      // Start pitch detection loop
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      const sampleRate = context.sampleRate;
      let frameCount = 0;

      const detectLoop = () => {
        analyserNode.getFloatTimeDomainData(dataArray);

        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const level = Math.sqrt(sum / bufferLength);
        const levelPercent = level * 100;
        setAudioInputLevel(level);

        // Check if we're waiting for note release
        if (waitingForRelease) {
          if (levelPercent < RELEASE_THRESHOLD) {
            console.log(
              `🎹 [NOTE RELEASED] Audio level dropped to ${levelPercent.toFixed(2)}% - Moving to next question`
            );
            setWaitingForRelease(false);
            setAnswerFeedback({
              selectedNote: null,
              correctNote: null,
              isCorrect: null,
            });
            updateProgress({ currentNote: pendingNextNote });
            setPendingNextNote(null);
          }
          // Skip normal match detection while waiting for release
          animationFrameRef.current = requestAnimationFrame(detectLoop);
          return;
        }

        // Detect pitch with correct sample rate
        const pitch = detectPitch(dataArray, sampleRate);
        const note = frequencyToNote(pitch);
        setDetectedNote(note);

        // Log every 30 frames (~0.5 seconds at 60fps)
        frameCount++;
        if (frameCount % 30 === 0) {
          console.log(
            `🎵 [PITCH DETECTION] Level: ${levelPercent.toFixed(2)}% | Pitch: ${pitch > 0 ? pitch.toFixed(2) + " Hz" : "N/A"} | Note: ${note || "None"} | Target: ${progress.currentNote?.note || "N/A"}`
          );
        }

        // Check if detected note matches current note
        if (
          note &&
          progress.currentNote &&
          note === progress.currentNote.note
        ) {
          const now = Date.now();
          const timeSinceLastMatch =
            lastMatchTimeRef.current === 0
              ? 1000
              : now - lastMatchTimeRef.current;

          console.log(
            `🎯 [MATCH CHECK] Detected: "${note}" | Target: "${progress.currentNote.note}" | Time since last: ${timeSinceLastMatch}ms | isListening: ${isListeningRef.current}`
          );

          // Debounce: only process match if 1000ms has passed since last match
          if (timeSinceLastMatch >= 1000) {
            console.log(
              `✅ [MATCH PROCESSED] Calling handleAnswerSelect for "${note}"`
            );
            lastMatchTimeRef.current = now; // Update ref immediately
            handleAnswerSelect(note);
          } else {
            console.log(
              `⏸️ [MATCH BLOCKED] Cooldown active (${timeSinceLastMatch}ms < 1000ms)`
            );
          }
        }

        // Store animation frame ID so it can be cancelled
        animationFrameRef.current = requestAnimationFrame(detectLoop);
      };

      console.log("🎤 [PITCH DETECTION] Starting detection loop...");
      detectLoop();
    } catch (error) {
      console.error("❌ [PITCH DETECTION] Error accessing microphone:", error);
      setIsListening(false);
    }
  }, [
    detectPitch,
    frequencyToNote,
    pendingNextNote,
    progress.currentNote,
    handleAnswerSelect,
    updateProgress,
    waitingForRelease,
  ]);

  // Stop audio input
  const stopAudioInput = useCallback(() => {
    console.log("🛑 [PITCH DETECTION] Stopping audio input...");
    lastMatchTimeRef.current = 0; // Reset cooldown when stopping
    isListeningRef.current = false; // Reset ref
    setWaitingForRelease(false); // Reset note release state
    setPendingNextNote(null); // Clear pending note
    // Cancel the animation frame loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log("🛑 [PITCH DETECTION] Animation frame cancelled");
    }
    if (microphone) {
      microphone.getTracks().forEach((track) => track.stop());
      console.log("🛑 [PITCH DETECTION] Microphone tracks stopped");
    }
    if (audioContext) {
      // Close audio context asynchronously to avoid blocking navigation
      audioContext.close().catch((err) => {
        console.warn("⚠️ [PITCH DETECTION] Error closing audio context:", err);
      });
      console.log("🛑 [PITCH DETECTION] Audio context closed");
    }
    setIsListening(false);
    setAudioContext(null);
    setAnalyser(null);
    setMicrophone(null);
    setDetectedNote(null);
    setAudioInputLevel(0);
    console.log("🛑 [PITCH DETECTION] Audio input stopped successfully");
  }, [microphone, audioContext]);

  // Store the stopAudioInput function in a ref for cleanup useEffects
  useEffect(() => {
    stopAudioInputRef.current = stopAudioInput;
  }, [stopAudioInput]);

  // Toggle audio input
  const toggleAudioInput = useCallback(() => {
    if (isListening) {
      stopAudioInput();
    } else {
      setIsListening(true); // Update state for UI
      isListeningRef.current = true; // Update ref immediately for closures
      startAudioInput();
    }
  }, [isListening, stopAudioInput, startAudioInput]);

  // Cleanup audio input on unmount or game end
  useEffect(() => {
    return () => {
      // Defer cleanup to not block navigation - run asynchronously
      setTimeout(() => {
        if (stopAudioInputRef.current) {
          stopAudioInputRef.current();
        }
      }, 0);
    };
  }, []); // No dependencies - uses ref to avoid re-running cleanup

  // Stop audio input when game finishes
  useEffect(() => {
    if (progress.isFinished && stopAudioInputRef.current) {
      stopAudioInputRef.current();
    }
  }, [progress.isFinished]); // No stopAudioInput dependency - uses ref

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
        console.log(
          "⏰ [FALLBACK] Release not detected after 5s - forcing next question"
        );
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
          <p className="text-xl text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 supports-[height:100svh]:h-[100svh]">
      {/* Stage background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
      </div>
      {progress.showFireworks && <Firework />}

      {!progress.isStarted ? (
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
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
          />
        ) : (
          <VictoryScreen
            score={progress.score}
            totalPossibleScore={progress.totalQuestions * 10}
            onReset={() => {
              resetProgress();
              resetSettings();
            }}
            onExit={() => navigate("/notes-master-mode")}
          />
        )
      ) : (
        <>
          {/* HUD */}
          <div className="relative mx-auto w-full max-w-5xl px-3 pt-2 sm:px-6 sm:pt-3">
            <StageCard className="px-3 py-2 sm:px-4 sm:py-2">
              <div className="flex items-center justify-between gap-2">
                {!progress.isFinished ? (
                  <BackButton
                    to="/notes-master-mode"
                    name={t("navigation.links.studentDashboard")}
                    styling="text-white/85 hover:text-white text-xs sm:text-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-20" />
                )}

                <div className="flex flex-1 items-center justify-center gap-2">
                  <HudPill
                    icon={Coins}
                    label={t("games.score")}
                    value={progress.score}
                  />
                  {settings.timedMode ? (
                    <TimerDisplay formattedTime={formattedTime} />
                  ) : null}
                </div>

                {!progress.isFinished && (
                  <button
                    onClick={handlePauseGame}
                    className="flex-shrink-0 touch-manipulation rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-[0.98] motion-reduce:transition-none sm:text-sm"
                  >
                    {settings.timedMode
                      ? t("games.actions.pause")
                      : t("pages.settings.title")}
                  </button>
                )}
              </div>
            </StageCard>
          </div>

          <div className="relative mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden px-3 pb-4 sm:px-6 sm:pb-6">
            {/* Progress Bar */}
            <div className="mt-4">
              <ProgressBar
                current={progress.totalQuestions}
                total={settings.timedMode ? 10 : 20} // Set higher goal for non-timed mode
              />
            </div>

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
                        width: `${Math.min(audioInputLevel * 1000, 100)}%`,
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
            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:grid lg:flex-none lg:grid-cols-[0.95fr_1.05fr] lg:items-start landscape:grid landscape:flex-none landscape:grid-cols-[0.95fr_1.05fr] landscape:items-start">
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
                    className={`rounded-3xl bg-white/95 p-4 shadow-[inset_0_2px_0_rgba(255,255,255,0.75)] ring-1 ring-black/5 transition-all duration-200 motion-reduce:transition-none ${
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
                  {groupedMobileNotes.map(renderMobileNoteGroup)}
                </div>

                {/* Desktop: split into naturals and accidentals */}
                <div className="hidden h-full gap-6 lg:flex" dir="ltr">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      {orderedNaturals.map(renderNoteButton)}
                    </div>
                  </div>
                  {orderedAccidentals.length > 0 && (
                    <div className="flex-1 border-l border-white/10 pl-4">
                      <div className="grid grid-cols-2 gap-3">
                        {orderedAccidentals.map(renderNoteButton)}
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
                          key={opt.note}
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

      {/* Settings Modal */}
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
