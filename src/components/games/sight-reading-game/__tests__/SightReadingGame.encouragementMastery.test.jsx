import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "../SightReadingGame";

// ============================================================================
// WR-01 regression (03-REVIEW.md): a session that falls below the 70% victory
// threshold never renders VictoryScreen, so updateNodeProgress/
// updateExerciseProgress (and their note_mastery merge) never run — the
// struggling session's per-note telemetry was silently discarded. This file
// exercises the encouragement-screen fire-and-forget persistence path
// (mergeNoteMasteryOnly) added to fix that gap. Mirrors the trail-mode setup
// from SightReadingGame.mastery.test.jsx (Task 2), with an added
// `mockForceEncouragementBox` so isSessionComplete can flip true while
// isVictory stays false (neither sibling mock file supports this — they
// always tie isVictory === isSessionComplete).
// ============================================================================

const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
const mockUserBox = vi.hoisted(() => ({
  current: { user: { id: "student-1" }, isStudent: true },
}));
const mockLocationStateBox = vi.hoisted(() => ({ current: null }));
const mockTotalExercisesBox = vi.hoisted(() => ({ current: 1 }));
// When true, a completed session renders the encouragement screen (isVictory forced false)
// instead of VictoryScreen — independent of isSessionComplete, which the sibling mock files
// don't support (they always tie isVictory === isSessionComplete).
const mockForceEncouragementBox = vi.hoisted(() => ({ current: true }));

const generatePatternSpy = vi.hoisted(() => vi.fn());
const patternNotesBox = vi.hoisted(() => ({
  current: [
    { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
  ],
}));

const getNodeProgressSpy = vi.hoisted(() =>
  vi.fn(async () => ({ exercise_progress: [], note_mastery: {} }))
);
const mergeNoteMasteryOnlySpy = vi.hoisted(() => vi.fn(async () => ({})));

let capturedOnNoteEvent = null;

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.finishSession": "All Done!",
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

// Stateful mock: real completedCount drives isSessionComplete, but isVictory is additionally
// gated by mockForceEncouragementBox so this file can reach showEncouragementScreen (neither
// sibling mock file supports isVictory !== isSessionComplete).
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

    const [completedCount, setCompletedCount] = useState(0);
    const total = mockTotalExercisesBox.current;
    const isSessionComplete = completedCount >= total;
    const isVictory = isSessionComplete && !mockForceEncouragementBox.current;

    const successStreakRef = useRef(0);
    const adaptiveTierIndexRef = useRef(0);
    const setSuccessStreak = useCallback((n) => {
      successStreakRef.current = n;
    }, []);
    const setAdaptiveTierIndex = useCallback((n) => {
      adaptiveTierIndexRef.current = n;
    }, []);

    return {
      totalExercises: total,
      currentExerciseNumber: completedCount + 1,
      isSessionComplete,
      isVictory,
      percentage: isSessionComplete ? (isVictory ? 100 : 40) : 0,
      totalScore: 0,
      maxPossibleScore: 0,
      status: "idle",
      startSession: useCallback(() => {}, []),
      resetSession: useCallback(() => setCompletedCount(0), []),
      recordExerciseResult: useCallback(() => {
        setCompletedCount((c) => c + 1);
      }, []),
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
    exercisesRemaining: 0,
    nodeComplete: true,
  })),
  mergeNoteMasteryOnly: mergeNoteMasteryOnlySpy,
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

// No note events fired -> the note is recorded "missed" once its timing window closes.
async function missCurrentNote() {
  await startPerformance();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
}

async function clickNextExercise() {
  // The advance button reads "Next Exercise" mid-session and the kid-friendly finish label
  // ("All Done!") on the final exercise — accept either so full-session drives keep working.
  const nextButton = screen.getByRole("button", {
    name: /^(Next Exercise|All Done!)$/,
  });
  await act(async () => {
    fireEvent.click(nextButton);
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("SightReadingGame encouragement-screen mastery persistence (WR-01, 03-REVIEW.md)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    generatePatternSpy.mockClear();
    getNodeProgressSpy.mockClear();
    mergeNoteMasteryOnlySpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
    mockUserBox.current = { user: { id: "student-1" }, isStudent: true };
    mockLocationStateBox.current = trailLocationState;
    mockTotalExercisesBox.current = 1;
    mockForceEncouragementBox.current = true;
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("a sub-70% session persists sessionMastery via mergeNoteMasteryOnly on the encouragement screen (Test mode)", async () => {
    await renderTrailGameAndFlush();

    // Single-exercise session: C4 missed -> {correct:0,total:1}. Completing it lands on the
    // encouragement screen (mockForceEncouragementBox forces isVictory=false).
    await missCurrentNote();
    await clickNextExercise();

    expect(
      screen.getByText("sightReading.session.keepGoing")
    ).toBeInTheDocument();
    expect(mergeNoteMasteryOnlySpy).toHaveBeenCalledTimes(1);
    expect(mergeNoteMasteryOnlySpy).toHaveBeenCalledWith(
      "student-1",
      "test-node",
      {
        C4: { correct: 0, total: 1 },
      }
    );
  });

  test("Practice mode: the encouragement screen does NOT persist mastery (matches VictoryScreen's suppressPersistence contract)", async () => {
    mockInitialGradingModeBox.current = "practice";

    await renderTrailGameAndFlush();
    await missCurrentNote();
    await clickNextExercise();

    expect(
      screen.getByText("sightReading.session.keepGoing")
    ).toBeInTheDocument();
    expect(mergeNoteMasteryOnlySpy).not.toHaveBeenCalled();
  });

  test("free play (no nodeId/studentId pairing): the encouragement screen does NOT attempt to persist mastery", async () => {
    mockLocationStateBox.current = null; // no nodeConfig -> free play, no trail auto-start

    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      await Promise.resolve();
    });

    await missCurrentNote();
    await clickNextExercise();

    expect(
      screen.getByText("sightReading.session.keepGoing")
    ).toBeInTheDocument();
    expect(mergeNoteMasteryOnlySpy).not.toHaveBeenCalled();
  });
});
