import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "../SightReadingGame";

// ============================================================================
// WR-02 regression (03-REVIEW.md): a mid-session gear-icon settings change
// (trail mode only — the settings overlay opened via openSettingsModal) is
// USER-initiated and must re-baseline baseAdaptiveSettingsRef.current, or the
// very next adaptive-tier computation silently reverts the tempo the user just
// chose (it was recomputing from the STALE session-start baseline + tier
// delta). This file mirrors the trail-mode setup from
// SightReadingGame.mastery.test.jsx (Task 2) and the tier-escalation-via-
// success-streak pattern from SightReadingGame.adaptive.test.jsx.
// ============================================================================

const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
const mockUserBox = vi.hoisted(() => ({
  current: { user: { id: "student-1" }, isStudent: true },
}));
const mockLocationStateBox = vi.hoisted(() => ({ current: null }));
const mockTotalExercisesBox = vi.hoisted(() => ({ current: 5 }));

const generatePatternSpy = vi.hoisted(() => vi.fn());
const patternNotesBox = vi.hoisted(() => ({
  current: [
    { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
  ],
}));

const getNodeProgressSpy = vi.hoisted(() =>
  vi.fn(async () => ({ exercise_progress: [], note_mastery: {} }))
);

let capturedOnNoteEvent = null;
// UnifiedGameSettings is mocked as a single button that immediately applies a fixed
// "user chose a different tempo" settings object via onStart (== handleApplySettings).
// Deliberately FASTER than the node's baseline (not slower): the count-in/note-timing-window
// helpers below use fixed real-ms `advanceTimersByTimeAsync` durations tuned for the baseline
// tempo — a faster tempo only shortens those windows, so the fixed advances stay comfortably
// sufficient (a slower tempo would need proportionally longer advances).
const NEW_USER_TEMPO = 130;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.changeSettings": "Change Settings",
      };
      return translations[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn(), language: "en", dir: () => "ltr" },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("../../../ui/BackButton", () => ({
  default: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: mockLocationStateBox.current, pathname: "/" }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useQuery: () => ({ data: undefined }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: { error: vi.fn(), success: vi.fn() },
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../../../../features/authentication/useUser", () => ({
  useUser: () => mockUserBox.current,
}));

vi.mock("../../../../services/apiScores", () => ({
  updateStudentScore: vi.fn(),
}));

vi.mock("../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// Stateful mock (mirrors SightReadingGame.adaptive.test.jsx): real successStreakRef/
// adaptiveTierIndexRef so tier escalation genuinely drives the next generatePattern call.
vi.mock("../../../../contexts/SightReadingSessionContext", () => ({
  SIGHT_READING_SESSION_CONSTANTS: { DEFAULT_MAX_SCORE_PER_EXERCISE: 1000 },
  useSightReadingSession: () => {
    const [combo, setCombo] = useState(0);
    const [isOnFire, setIsOnFire] = useState(false);
    const incrementCombo = useCallback(() => {
      setCombo((c) => {
        const next = c + 1;
        if (next >= 5) setIsOnFire(true);
        return next;
      });
    }, []);
    const resetCombo = useCallback(() => {
      setCombo(0);
      setIsOnFire(false);
    }, []);

    const [gradingMode, setGradingModeState] = useState(
      mockInitialGradingModeBox.current
    );
    const [isModeLocked, setIsModeLocked] = useState(false);
    const gradingModeRef = useRef(mockInitialGradingModeBox.current);
    const setGradingMode = useCallback(
      (mode) => {
        if (isModeLocked) return;
        gradingModeRef.current = mode;
        setGradingModeState(mode);
      },
      [isModeLocked]
    );
    const lockMode = useCallback(() => setIsModeLocked(true), []);
    const unlockMode = useCallback(() => setIsModeLocked(false), []);

    const successStreakRef = useRef(0);
    const adaptiveTierIndexRef = useRef(0);
    const setSuccessStreak = useCallback((n) => {
      successStreakRef.current = n;
    }, []);
    const setAdaptiveTierIndex = useCallback((n) => {
      adaptiveTierIndexRef.current = n;
    }, []);

    return {
      totalExercises: mockTotalExercisesBox.current,
      currentExerciseNumber: 1,
      isSessionComplete: false,
      isVictory: false,
      percentage: 0,
      totalScore: 0,
      maxPossibleScore: 0,
      status: "idle",
      startSession: vi.fn(),
      resetSession: vi.fn(),
      recordExerciseResult: vi.fn(),
      goToNextExercise: vi.fn(),
      combo,
      isOnFire,
      incrementCombo,
      resetCombo,
      gradingMode,
      gradingModeRef,
      isModeLocked,
      setGradingMode,
      lockMode,
      unlockMode,
      successStreakRef,
      setSuccessStreak,
      adaptiveTierIndexRef,
      setAdaptiveTierIndex,
    };
  },
}));

vi.mock("../components/VexFlowStaffDisplay", () => ({
  VexFlowStaffDisplay: () => <div data-testid="staff" />,
}));

vi.mock("../components/KlavierKeyboard", () => ({
  KlavierKeyboard: () => <div data-testid="keyboard" />,
}));

vi.mock("../../rhythm-games/components/MetronomeDisplay", () => ({
  MetronomeDisplay: () => <div data-testid="metronome" />,
}));

vi.mock("../components/PreGameSetup", () => ({
  PreGameSetup: ({ onStart }) => (
    <button type="button" onClick={() => onStart()} aria-label="Start">
      Start
    </button>
  ),
}));

// The gear-icon settings overlay itself — mocked as a single "apply" button so this test
// can drive handleApplySettings directly without standing up UnifiedGameSettings' full
// step-wizard dependency tree.
vi.mock("../../shared/UnifiedGameSettings", () => ({
  UnifiedGameSettings: ({ onStart }) => (
    <button
      type="button"
      aria-label="Apply New Tempo"
      onClick={() =>
        onStart({
          difficulty: "beginner",
          timeSignature: { name: "4/4", beats: 4, unitsPerBeat: 4 },
          tempo: NEW_USER_TEMPO,
          selectedNotes: ["C4", "D4"],
          clef: "treble",
          measuresPerPattern: 1,
          rhythmSettings: { allowRests: false, allowedNoteDurations: ["q"] },
          rhythmComplexity: "simple",
          keySignature: null,
        })
      }
    >
      Apply New Tempo
    </button>
  ),
}));

vi.mock("../hooks/useRhythmPlayback", () => ({
  useRhythmPlayback: () => ({ play: vi.fn(), stop: vi.fn() }),
}));

const startListeningSpy = vi.fn(() => Promise.resolve());
const stopListeningSpy = vi.fn();

vi.mock("../../../../hooks/useMicNoteInput", () => ({
  useMicNoteInput: (opts) => {
    capturedOnNoteEvent = opts?.onNoteEvent ?? null;
    return {
      audioLevel: 0,
      isListening: false,
      startListening: startListeningSpy,
      stopListening: stopListeningSpy,
      debug: {},
    };
  },
}));

vi.mock("../../../../contexts/AudioContextProvider", () => ({
  useAudioContext: () => ({
    audioContextRef: {
      current: { state: "running", resume: vi.fn(async () => {}) },
    },
    analyserRef: { current: null },
    streamRef: { current: null },
    isReady: true,
    isInterrupted: false,
    micPermission: "granted",
    requestMic: vi.fn(async () => ({
      analyser: null,
      audioContext: { state: "running", sampleRate: 44100 },
    })),
    releaseMic: vi.fn(),
    suspendAudio: vi.fn(async () => {}),
    resumeAudio: vi.fn(async () => {}),
    handleTapToResume: vi.fn(),
    getOrCreateAudioContext: vi.fn(() => ({ state: "running" })),
  }),
}));

vi.mock("../../../../hooks/useAudioEngine", () => {
  const makeEngine = () => ({
    isInitialized: true,
    audioSupported: true,
    audioContextRef: { current: { state: "running" } },
    gainNodeRef: { current: {} },
    resumeAudioContext: vi.fn(async () => true),
    isReady: vi.fn(() => true),
    getCurrentTime: vi.fn(() => Date.now() / 1000),
    stopScheduler: vi.fn(),
    createMetronomeClick: vi.fn(),
    playPianoSound: vi.fn(),
  });
  return { useAudioEngine: () => makeEngine() };
});

vi.mock("../hooks/usePatternGeneration", () => ({
  usePatternGeneration: () => ({
    generatePattern: (...args) => {
      generatePatternSpy(...args);
      return Promise.resolve({
        tempo: args[2],
        totalDuration: patternNotesBox.current.length,
        notes: patternNotesBox.current,
      });
    },
  }),
}));

vi.mock("../../../../services/skillProgressService", () => ({
  updateNodeProgress: vi.fn(async () => ({})),
  getNodeProgress: getNodeProgressSpy,
  updateExerciseProgress: vi.fn(async () => ({
    exercisesRemaining: 1,
    nodeComplete: false,
  })),
  calculateStarsFromPercentage: (pct) =>
    pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0,
}));

vi.mock("../../../../data/skillTrail", () => ({
  getNodeById: (id) =>
    id === "test-node"
      ? {
          id: "test-node",
          isBoss: false,
          nodeType: "practice",
          noteConfig: { notePool: ["C4", "D4"] },
          exercises: [{ type: "sight_reading" }],
        }
      : null,
  getTrailTabForNode: () => null,
}));

vi.mock("../../../../services/streakService", () => ({
  streakService: { getStreakState: vi.fn(async () => null) },
}));

vi.mock("../../../../utils/celebrationTiers", () => ({
  determineCelebrationTier: () => "minimal",
  getCelebrationConfig: () => ({ confetti: false }),
}));

vi.mock("../../../../utils/celebrationMessages", () => ({
  getCelebrationMessage: () => "",
}));

vi.mock("../../../../utils/levelUpTracking", () => ({
  hasLevelBeenCelebrated: () => false,
  markLevelCelebrated: vi.fn(),
}));

vi.mock("../../../../hooks/useStreakWithAchievements", () => ({
  useStreakWithAchievements: () => ({ mutate: vi.fn() }),
}));

vi.mock("../../../../hooks/useAccessories", () => ({
  useAccessoriesList: () => ({ data: [] }),
  usePointBalance: () => ({ data: { earned: 100 } }),
}));

vi.mock("../../../../hooks/useGamesPlayed", () => ({
  useGamesPlayed: () => ({ data: 5 }),
}));

vi.mock("../../../../hooks/useUserProfile", () => ({
  useUserProfile: () => ({
    data: { achievements: [], current_streak: 0, perfect_games: 0, level: 1 },
  }),
}));

vi.mock("../../../../hooks/useAccessoryUnlockDetection", () => ({
  useAccessoryUnlockDetection: () => [],
}));

vi.mock("../../../../hooks/useBossUnlockTracking", () => ({
  useBossUnlockTracking: () => ({ shouldShow: false, markAsShown: vi.fn() }),
}));

const trailLocationState = {
  nodeId: "test-node",
  nodeConfig: {
    notePool: ["C4", "D4"],
    clef: "treble",
    measuresPerPattern: 1,
    timeSignature: "4/4",
  },
};

async function renderTrailGameAndFlush() {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
      <SightReadingGame />
    </MemoryRouter>
  );

  // Flush the mastery-fetch IIFE (Promise.race against an 800ms timeout) and the
  // subsequent setTimeout(...,100) that calls startGame (mirrors
  // SightReadingGame.mastery.test.jsx's renderTrailGameAndFlush).
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(150);
  });
}

async function startPerformance() {
  const startPlayingButtons = screen.getAllByRole("button", {
    name: /Start Playing/i,
  });
  await act(async () => {
    fireEvent.click(startPlayingButtons[0]);
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3200);
  });
}

async function clickNextExercise() {
  const nextButton = screen.getByRole("button", { name: "Next Exercise" });
  await act(async () => {
    fireEvent.click(nextButton);
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function playOneSuccessExercise() {
  await startPerformance();
  await act(async () => {
    capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
  await clickNextExercise();
}

describe("SightReadingGame (WR-02 regression — mid-session gear-icon settings change survives tier escalation)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    generatePatternSpy.mockClear();
    getNodeProgressSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
    mockUserBox.current = { user: { id: "student-1" }, isStudent: true };
    mockLocationStateBox.current = trailLocationState;
    mockTotalExercisesBox.current = 5;
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("a tempo chosen via the gear icon survives the very next tier escalation instead of reverting to the session-start baseline", async () => {
    await renderTrailGameAndFlush();

    // Exercise 1: baseline tempo (DEFAULT_SETTINGS' authored tempo).
    expect(generatePatternSpy).toHaveBeenCalledTimes(1);
    const baselineTempo = generatePatternSpy.mock.calls[0][2];

    // Open the gear-icon settings overlay (trail mode -> openSettingsModal, not returnToSetup)
    // and apply a user-chosen tempo mid-session.
    const settingsButton = screen.getByRole("button", {
      name: "Change Settings",
    });
    await act(async () => {
      fireEvent.click(settingsButton);
    });

    const applyButton = screen.getByRole("button", {
      name: "Apply New Tempo",
    });
    await act(async () => {
      fireEvent.click(applyButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    // startGame(newSettings) regenerated the pattern immediately at the new tempo.
    expect(generatePatternSpy).toHaveBeenCalledTimes(2);
    expect(generatePatternSpy.mock.calls[1][2]).toBe(NEW_USER_TEMPO);
    expect(NEW_USER_TEMPO).not.toBe(baselineTempo);

    // Two consecutive successful exercises escalate one adaptive tier
    // (ESCALATE_SUCCESS_STREAK = 2), landing on the exercise right after the second success.
    await playOneSuccessExercise();
    await playOneSuccessExercise();

    expect(generatePatternSpy).toHaveBeenCalledTimes(4);
    // WR-02 regression: the escalated tier's tempo must be computed from the settings the
    // user just applied (NEW_USER_TEMPO + tier1's +12 delta, well within the 0.75x-1.25x clamp
    // of the new 130 baseline), NOT silently reverted to the stale session-start baseline +
    // tier delta.
    expect(generatePatternSpy.mock.calls[3][2]).toBe(NEW_USER_TEMPO + 12);
  });
});
