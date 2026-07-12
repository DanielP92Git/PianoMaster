import { useState, useCallback, useRef } from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  renderHook,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "../SightReadingGame";
import { useVictoryState } from "../../../../hooks/useVictoryState";
import { WEAK_NOTE_WEIGHT } from "../constants/adaptiveTiers";

// ============================================================================
// Phase 03 (ADAPT-03/ADAPT-04): per-note mastery accumulation + persistence.
//
// This file has two layers of coverage, matching the two places sessionMastery
// actually does work:
//
//   1. SightReadingGame-level: does the sessionMasteryRef accumulator merge
//      each exercise's perNoteAccuracy additively, and does the merged value
//      reach VictoryScreen's `sessionMastery` prop at session end (Task 1)?
//      -> VictoryScreen is mocked here (its own persistence internals are
//         exercised at layer 2), so we can assert the exact accumulated shape
//         without standing up VictoryScreen's full dependency tree.
//
//   2. useVictoryState-level (direct renderHook, real VictoryScreen dependency
//      chain mocked): does sessionMastery actually reach the service as the
//      trailing perNoteMastery arg in Test mode, and is it skipped entirely
//      in Practice mode (suppressPersistence's existing early-return)?
//
// Task 2 extends this file with a third layer: does SightReadingGame read
// persisted note_mastery on node start and bias exercise 1's note pool?
// ============================================================================

// ---- Shared spies + capture points (mirrors SightReadingGame.adaptive.test.jsx's pattern) ----
const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
const mockUserBox = vi.hoisted(() => ({
  current: { user: null, isStudent: false },
}));
const mockLocationStateBox = vi.hoisted(() => ({ current: null }));
const mockTotalExercisesBox = vi.hoisted(() => ({ current: 2 }));

const generatePatternSpy = vi.hoisted(() => vi.fn());
const patternNotesBox = vi.hoisted(() => ({
  current: [
    { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
  ],
}));

const victoryScreenPropsSpy = vi.hoisted(() => vi.fn());

// ---- skillProgressService: shared by SightReadingGame.jsx's own getNodeProgress import
// (added in Task 2) AND useVictoryState.js's import (updateNodeProgress/getNodeProgress/
// updateExerciseProgress/calculateStarsFromPercentage) — same absolute module either way.
const updateExerciseProgressSpy = vi.hoisted(() =>
  vi.fn(async () => ({ exercisesRemaining: 1, nodeComplete: false }))
);
const updateNodeProgressSpy = vi.hoisted(() => vi.fn(async () => ({})));
const getNodeProgressSpy = vi.hoisted(() =>
  vi.fn(async () => ({ exercise_progress: [], note_mastery: {} }))
);

let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.adaptive.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
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

// Stateful mock: real React state, matching the sibling tests' convention. `totalExercises` is
// read from a mutable box so different tests can complete a session after 1 or 2 exercises.
// isSessionComplete/isVictory derive from an internal completedCount, so clicking "Next Exercise"
// enough times genuinely flips SightReadingGame into the showVictoryScreen branch.
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
      isVictory: isSessionComplete,
      percentage: isSessionComplete ? 100 : 0,
      totalScore: 0,
      maxPossibleScore: 0,
      status: "idle",
      // Both startSession/resetSession must be REFERENTIALLY STABLE (useCallback, not a fresh
      // vi.fn() per render): SightReadingGame.jsx's mount effect depends on both
      // (`useEffect(() => { startSession(); return () => resetSession(); }, [startSession,
      // resetSession])`), so an unstable identity re-fires the cleanup+effect on every render.
      // That was harmless while resetSession was a no-op stub, but now that it actually resets
      // completedCount (needed for the CR-02 "Play Again" regression test below to start a
      // genuine second session), an unstable identity would silently reset completedCount to 0
      // on every re-render and isSessionComplete would never flip true.
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

// VictoryScreen is mocked ONLY for the SightReadingGame-level layer (below) — this captures
// the exact props SightReadingGame computes (sessionMastery, suppressPersistence) without
// needing to stand up VictoryScreen's full dependency tree (streak/accessories/XP/etc.).
vi.mock("../../VictoryScreen", () => ({
  default: (props) => {
    victoryScreenPropsSpy(props);
    return <div data-testid="victory-screen" />;
  },
}));

// ---- Layer-2 mocks: useVictoryState's own dependency tree (data/skillTrail is shared with
// SightReadingGame.jsx's own getNodeProgress import added in Task 2 — same absolute module). ----
vi.mock("../../../../services/skillProgressService", () => ({
  updateNodeProgress: updateNodeProgressSpy,
  getNodeProgress: getNodeProgressSpy,
  updateExerciseProgress: updateExerciseProgressSpy,
  calculateStarsFromPercentage: (pct) =>
    pct >= 95 ? 3 : pct >= 80 ? 2 : pct >= 60 ? 1 : 0,
}));

vi.mock("../../../../utils/xpSystem", () => ({
  awardXP: vi.fn(async () => ({ newTotalXP: 0, leveledUp: false })),
  calculateSessionXP: () => ({ totalXP: 0 }),
  calculateFreePlayXP: () => 0,
  getLevelProgress: () => null,
  PRESTIGE_XP_PER_TIER: 3000,
}));

vi.mock("../../../../data/skillTrail", () => ({
  getNodeById: (id) =>
    id === "test-node"
      ? {
          id: "test-node",
          isBoss: false,
          nodeType: "practice",
          noteConfig: { notePool: ["C4", "D4", "E4"] },
          exercises: [{ type: "sight_reading" }, { type: "sight_reading" }],
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

async function renderGame() {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
      <SightReadingGame />
    </MemoryRouter>
  );

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await Promise.resolve();
  });
}

async function startPerformance() {
  const startPlayingButtons = screen.getAllByRole("button", {
    name: /Start Playing/i,
  });
  await act(async () => {
    fireEvent.click(startPlayingButtons[0]);
  });

  // Advance through count-in (~3s) into performance.
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

// Plays the CURRENT exercise's single note correctly (accuracy 100%, 0 misses) but does NOT
// click "Next Exercise" — callers must swap patternNotesBox.current for the NEXT exercise
// BEFORE clicking Next (loadExercisePattern reads the box at click time).
async function playCurrentNoteSuccessfully() {
  await startPerformance();
  await act(async () => {
    capturedOnNoteEvent({
      type: "noteOn",
      pitch: patternNotesBox.current[0].pitch,
      frequency: 261.6,
    });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
}

// One correct note, played on time, then advances to the next exercise.
async function playOneSuccessExercise() {
  await playCurrentNoteSuccessfully();
  await clickNextExercise();
}

// No note events fired at all -> the single note in the pattern is recorded "missed" by the
// real timeline loop once its timing window closes. Does NOT click "Next Exercise" — see
// playCurrentNoteSuccessfully's note above about swapping patternNotesBox.current beforehand.
async function missCurrentNote() {
  await startPerformance();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
}

describe("SightReadingGame session mastery accumulation (ADAPT-03, Task 1)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    generatePatternSpy.mockClear();
    victoryScreenPropsSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
    mockUserBox.current = { user: null, isStudent: false };
    mockLocationStateBox.current = null;
    mockTotalExercisesBox.current = 2;
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("merges two exercises' perNoteAccuracy additively into sessionMasteryRef, reaching VictoryScreen's sessionMastery prop at session end (Test mode)", async () => {
    await renderGame();

    // Exercise 1: single note C4, played correctly -> {correct:1,total:1}.
    await playCurrentNoteSuccessfully();

    // Swap the pattern BEFORE clicking Next (loadExercisePattern reads the box at click time),
    // so exercise 2 generates from a D4-only pattern.
    patternNotesBox.current = [
      { type: "note", pitch: "D4", startTime: 0, endTime: 1, duration: 1 },
    ];
    await clickNextExercise();

    // Exercise 2: single note D4, never played -> missed -> {correct:0,total:1}. This click
    // completes the (mocked) 2-exercise session, flipping isSessionComplete/isVictory to true.
    await missCurrentNote();
    await clickNextExercise();

    expect(victoryScreenPropsSpy).toHaveBeenCalled();
    const lastProps = victoryScreenPropsSpy.mock.calls.at(-1)[0];
    expect(lastProps.sessionMastery).toEqual({
      C4: { correct: 1, total: 1 },
      D4: { correct: 0, total: 1 },
    });
    expect(lastProps.suppressPersistence).toBe(false);
  });

  test("Practice mode: sessionMastery is still computed and passed (relay only) but suppressPersistence is true", async () => {
    mockInitialGradingModeBox.current = "practice";
    mockTotalExercisesBox.current = 1;

    await renderGame();
    await playOneSuccessExercise();

    expect(victoryScreenPropsSpy).toHaveBeenCalled();
    const lastProps = victoryScreenPropsSpy.mock.calls.at(-1)[0];
    expect(lastProps.suppressPersistence).toBe(true);
    expect(lastProps.sessionMastery).toEqual({ C4: { correct: 1, total: 1 } });
  });

  // CR-02 regression (03-REVIEW.md): "Play Again" (VictoryScreen's onReset, wired to
  // handleStartNewSession) must NOT leak the just-finished session's sessionMasteryRef/
  // baseAdaptiveSettingsRef into the new session — otherwise session 1's already-persisted
  // mastery counts get silently re-merged into session 2's payload, double-counting
  // note_mastery.total/.correct server-side.
  test("Play Again (onReset) does not leak session 1's sessionMastery counts into session 2's persisted payload", async () => {
    await renderGame();

    // ---- Session 1: C4 correct, D4 missed -> completes the (mocked) 2-exercise session. ----
    await playCurrentNoteSuccessfully();
    patternNotesBox.current = [
      { type: "note", pitch: "D4", startTime: 0, endTime: 1, duration: 1 },
    ];
    await clickNextExercise();
    await missCurrentNote();
    await clickNextExercise();

    expect(victoryScreenPropsSpy).toHaveBeenCalled();
    const session1Props = victoryScreenPropsSpy.mock.calls.at(-1)[0];
    expect(session1Props.sessionMastery).toEqual({
      C4: { correct: 1, total: 1 },
      D4: { correct: 0, total: 1 },
    });

    // ---- "Play Again": invoke the captured onReset (VictoryScreen is mocked, so we call the
    // prop directly rather than clicking a rendered button — mirrors how this file already
    // asserts on captured props elsewhere). ----
    patternNotesBox.current = [
      { type: "note", pitch: "E4", startTime: 0, endTime: 1, duration: 1 },
    ];
    await act(async () => {
      session1Props.onReset();
      await Promise.resolve();
      await Promise.resolve();
    });

    // ---- Session 2: E4 correct, F4 missed -> completes the session again. ----
    await playCurrentNoteSuccessfully();
    patternNotesBox.current = [
      { type: "note", pitch: "F4", startTime: 0, endTime: 1, duration: 1 },
    ];
    await clickNextExercise();
    await missCurrentNote();
    await clickNextExercise();

    const session2Props = victoryScreenPropsSpy.mock.calls.at(-1)[0];
    expect(session2Props.sessionMastery).toEqual({
      E4: { correct: 1, total: 1 },
      F4: { correct: 0, total: 1 },
    });
    // The regression this guards against: session 1's C4/D4 counts must NOT reappear.
    expect(session2Props.sessionMastery).not.toHaveProperty("C4");
    expect(session2Props.sessionMastery).not.toHaveProperty("D4");
  });
});

describe("useVictoryState session mastery persistence plumbing (ADAPT-03, Task 1)", () => {
  const sessionMastery = {
    C4: { correct: 5, total: 6 },
    D4: { correct: 1, total: 4 },
  };

  beforeEach(() => {
    updateExerciseProgressSpy.mockClear();
    updateNodeProgressSpy.mockClear();
    getNodeProgressSpy.mockClear();
    getNodeProgressSpy.mockResolvedValue({
      exercise_progress: [],
      note_mastery: {},
    });
    // useVictoryState's own useUser() call needs a real user.id — the SightReadingGame-level
    // describe above leaves mockUserBox at { user: null } (free-play tests), which would
    // otherwise make useVictoryState's processTrailCompletion bail before calling anything.
    mockUserBox.current = { user: { id: "student-1" }, isTeacher: false };
  });

  test("Test mode, exercise-level progress: updateExerciseProgress receives sessionMastery as the trailing perNoteMastery arg", async () => {
    renderHook(() =>
      useVictoryState({
        score: 900,
        totalPossibleScore: 1000,
        onReset: vi.fn(),
        timedMode: false,
        timeRemaining: 0,
        initialTime: 0,
        onExit: vi.fn(),
        nodeId: "test-node",
        exerciseIndex: 0,
        totalExercises: 2,
        exerciseType: "sight_reading",
        onNextExercise: vi.fn(),
        suppressPersistence: false,
        sessionMastery,
      })
    );

    await waitFor(() => expect(updateExerciseProgressSpy).toHaveBeenCalled());

    const call = updateExerciseProgressSpy.mock.calls[0];
    expect(call.at(-1)).toEqual(sessionMastery);
  });

  test("Test mode, legacy node-level progress: updateNodeProgress receives sessionMastery as the trailing perNoteMastery arg", async () => {
    renderHook(() =>
      useVictoryState({
        score: 900,
        totalPossibleScore: 1000,
        onReset: vi.fn(),
        timedMode: false,
        timeRemaining: 0,
        initialTime: 0,
        onExit: vi.fn(),
        nodeId: "test-node",
        exerciseIndex: null,
        totalExercises: null,
        exerciseType: null,
        onNextExercise: vi.fn(),
        suppressPersistence: false,
        sessionMastery,
      })
    );

    await waitFor(() => expect(updateNodeProgressSpy).toHaveBeenCalled());

    const call = updateNodeProgressSpy.mock.calls[0];
    expect(call.at(-1)).toEqual(sessionMastery);
  });

  test("Practice mode (suppressPersistence): neither service function is called at all — mastery write skipped for free", async () => {
    renderHook(() =>
      useVictoryState({
        score: 900,
        totalPossibleScore: 1000,
        onReset: vi.fn(),
        timedMode: false,
        timeRemaining: 0,
        initialTime: 0,
        onExit: vi.fn(),
        nodeId: "test-node",
        exerciseIndex: 0,
        totalExercises: 2,
        exerciseType: "sight_reading",
        onNextExercise: vi.fn(),
        suppressPersistence: true,
        sessionMastery,
      })
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(updateExerciseProgressSpy).not.toHaveBeenCalled();
    expect(updateNodeProgressSpy).not.toHaveBeenCalled();
  });
});

describe("SightReadingGame reads persisted mastery + biases weak-note selection (ADAPT-03, Task 2)", () => {
  const trailLocationState = {
    nodeId: "test-node",
    nodeConfig: {
      notePool: ["C4", "D4"],
      clef: "treble",
      measuresPerPattern: 1,
      timeSignature: "4/4",
    },
  };

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
    mockTotalExercisesBox.current = 2;
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderTrailGameAndFlush() {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );

    // Flush the mastery-fetch IIFE (Promise.race against an 800ms timeout — the mocked
    // getNodeProgress resolves on a microtask, so it wins the race well before the timer
    // would fire) and the subsequent setTimeout(...,100) that calls startGame.
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

  test("a historically-weak pitch (>= MASTERY_MIN_ATTEMPTS attempts, < WEAK_ACCURACY_THRESHOLD) gets a higher weight in exercise 1's noteWeights map (CR-01 fix — weight map, not array duplication)", async () => {
    getNodeProgressSpy.mockResolvedValueOnce({
      note_mastery: { C4: { correct: 1, total: 6 } },
    });

    await renderTrailGameAndFlush();

    expect(getNodeProgressSpy).toHaveBeenCalledWith("student-1", "test-node");
    expect(generatePatternSpy).toHaveBeenCalledTimes(1);
    // CR-01 (03-REVIEW.md): duplicating pitches in `selectedNotes` (arg index 3) was
    // silently discarded by patternBuilder.js's dedup step, so the pool itself must stay
    // exactly the node's authored set...
    const selectedNotesArg = generatePatternSpy.mock.calls[0][3];
    expect(selectedNotesArg).toEqual(["C4", "D4"]);
    // ...and the bias is instead carried via the new `noteWeights` positional arg (index 9),
    // which patternBuilder.js's weighted random pick actually consumes.
    const noteWeightsArg = generatePatternSpy.mock.calls[0][9];
    expect(noteWeightsArg).toEqual({ C4: WEAK_NOTE_WEIGHT, D4: 1 });
  });

  test("cold start (no qualifying pitch): the baseline pool is used unchanged and noteWeights is uniform (all 1s)", async () => {
    getNodeProgressSpy.mockResolvedValueOnce({ note_mastery: {} });

    await renderTrailGameAndFlush();

    expect(generatePatternSpy).toHaveBeenCalledTimes(1);
    const selectedNotesArg = generatePatternSpy.mock.calls[0][3];
    expect(selectedNotesArg).toEqual(["C4", "D4"]);
    const noteWeightsArg = generatePatternSpy.mock.calls[0][9];
    expect(noteWeightsArg).toEqual({ C4: 1, D4: 1 });
  });

  test("free play (no nodeId/studentId pairing needed): the mastery fetch is never attempted", async () => {
    mockLocationStateBox.current = null; // no nodeConfig -> trail auto-start effect never runs

    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      await Promise.resolve();
    });

    expect(getNodeProgressSpy).not.toHaveBeenCalled();
  });
});
