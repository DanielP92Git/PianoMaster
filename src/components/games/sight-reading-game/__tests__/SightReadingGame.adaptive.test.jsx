import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "../SightReadingGame";

// ---- Shared spies + capture points (mirrors SightReadingGame.replay.test.jsx's pattern) ----
const incrementComboSpy = vi.hoisted(() => vi.fn());
const resetComboSpy = vi.hoisted(() => vi.fn());
const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
const rhythmPlaySpy = vi.hoisted(() => vi.fn());
const rhythmStopSpy = vi.hoisted(() => vi.fn());

// Records every generatePattern(...) call's positional args so tests can assert exactly
// which tempo/selectedNotes were used for each successive exercise's pattern (the
// stale-closure regression this file exists to guard — Pitfall 2).
const generatePatternSpy = vi.hoisted(() => vi.fn());

// Mutable pattern shape returned by the mocked generatePattern. Default: a single note
// (mirrors the replay test's "one correct hit finishes the exercise" pattern). The EASE
// test overrides this to a multi-note pattern so a run of misses can be simulated via the
// real timeline-miss-recording loop (no note events fired at all).
const patternNotesBox = vi.hoisted(() => ({
  current: [
    { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
  ],
}));

let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.replay.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.controls.replay": "Hear it again",
        "sightReading.adaptive.levelUp": "Level Up!",
        "sightReading.adaptive.levelUpSubtitle": "Keep up the great work!",
        "games.engagement.combo": "Combo",
        "games.engagement.onFire": "ON FIRE!",
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
    useLocation: () => ({ state: null, pathname: "/" }),
  };
});

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: null, isStudent: false }),
}));

vi.mock("../../../../services/apiScores", () => ({
  updateStudentScore: vi.fn(),
}));

vi.mock("../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// Stateful mock: real React state, matching the sibling tests' convention. Includes the
// Phase 03 successStreakRef/adaptiveTierIndexRef ref-mirror fields SightReadingGame.jsx
// now reads/writes synchronously in handleNextExercise.
vi.mock("../../../../contexts/SightReadingSessionContext", () => ({
  SIGHT_READING_SESSION_CONSTANTS: { DEFAULT_MAX_SCORE_PER_EXERCISE: 1000 },
  useSightReadingSession: () => {
    const [combo, setCombo] = useState(0);
    const [isOnFire, setIsOnFire] = useState(false);

    const incrementCombo = useCallback(() => {
      incrementComboSpy();
      setCombo((c) => {
        const next = c + 1;
        if (next >= 5) setIsOnFire(true);
        return next;
      });
    }, []);

    const resetCombo = useCallback(() => {
      resetComboSpy();
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

    // Phase 03 (ADAPT-01/02): real ref-mirrored state (not a stub) so handleNextExercise's
    // successStreakRef.current reads see the value written by the PRIOR exercise boundary's
    // setSuccessStreak call within the same test run — exactly like the production context.
    const successStreakRef = useRef(0);
    const adaptiveTierIndexRef = useRef(0);
    const setSuccessStreak = useCallback((n) => {
      successStreakRef.current = n;
    }, []);
    const setAdaptiveTierIndex = useCallback((n) => {
      adaptiveTierIndexRef.current = n;
    }, []);

    return {
      totalExercises: 5,
      currentExerciseNumber: 1,
      progressFraction: 0,
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

vi.mock("../hooks/useRhythmPlayback", () => ({
  useRhythmPlayback: () => ({ play: rhythmPlaySpy, stop: rhythmStopSpy }),
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
    // Flush the async generatePattern() call inside loadExercisePattern so the new
    // pattern/DISPLAY-phase transition lands before the next assertion/action.
    await Promise.resolve();
    await Promise.resolve();
  });
}

// One correct note, played on time -> a "success" exercise (accuracy 100%, 0 misses).
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

// No note events fired at all -> every note in the pattern is recorded "missed" by the
// real timeline loop once each note's timing window closes (SightReadingGame.jsx's
// schedulePerformanceTimeline tick()), giving a genuine run-of-misses exercise.
async function missEveryNoteExercise() {
  await startPerformance();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6000);
  });
  await clickNextExercise();
}

describe("SightReadingGame (adaptive difficulty — ADAPT-01/02)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    incrementComboSpy.mockClear();
    resetComboSpy.mockClear();
    rhythmPlaySpy.mockClear();
    rhythmStopSpy.mockClear();
    generatePatternSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
    // Reset to the default single-note pattern before every test.
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
    ];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("STALE-CLOSURE GUARD: tier escalates after 2 consecutive successes and lands at exercise N+1 (not N+2) — Pitfall 2 regression", async () => {
    await renderGame();

    // Exercise 1's pattern (from startGame, no tier applied yet — baseline tempo).
    expect(generatePatternSpy).toHaveBeenCalledTimes(1);
    expect(generatePatternSpy.mock.calls[0][2]).toBe(80);

    // First success: successStreak 0 -> 1. Not yet escalated (ESCALATE_SUCCESS_STREAK = 2).
    await playOneSuccessExercise();
    expect(generatePatternSpy).toHaveBeenCalledTimes(2);
    expect(generatePatternSpy.mock.calls[1][2]).toBe(80);
    expect(screen.queryByText("Level Up!")).not.toBeInTheDocument();

    // Second consecutive success: successStreak 1 -> 2 -> escalates. The escalated tier
    // must be applied to the VERY NEXT exercise's pattern generation (call index 2, i.e.
    // exercise 3) — not delayed to exercise 4 (call index 3), which was the stale-closure bug.
    await playOneSuccessExercise();
    expect(generatePatternSpy).toHaveBeenCalledTimes(3);
    expect(generatePatternSpy.mock.calls[2][2]).toBe(92); // base 80 + tier1 tempoDeltaBpm 12
  });

  test("ESCALATE: shows the LevelUpCue on the escalating transition (positive-only, D-12)", async () => {
    await renderGame();

    await playOneSuccessExercise();
    await playOneSuccessExercise();

    // The escalation happened on this second "Next Exercise" click — the cue should be
    // visible immediately after (before its 1500ms auto-hide timer has fired).
    expect(screen.getByText("Level Up!")).toBeInTheDocument();
    expect(screen.getByText("Keep up the great work!")).toBeInTheDocument();
  });

  test("EASE: a run of >= EASE_MISS_RUN missed notes in one exercise lowers the tier/tempo and shows NO LevelUpCue", async () => {
    // Multi-note pattern so a genuine run of misses (3) can be recorded via the real
    // timeline-miss loop (a single-note pattern can only ever produce 1 miss).
    patternNotesBox.current = [
      { type: "note", pitch: "C4", startTime: 0, endTime: 1, duration: 1 },
      { type: "note", pitch: "D4", startTime: 1, endTime: 2, duration: 1 },
      { type: "note", pitch: "E4", startTime: 2, endTime: 3, duration: 1 },
    ];

    await renderGame();
    expect(generatePatternSpy.mock.calls[0][2]).toBe(80);

    await missEveryNoteExercise();

    expect(generatePatternSpy).toHaveBeenCalledTimes(2);
    // Eased one tier down: base 80 + tier(-1) tempoDeltaBpm -12 = 68.
    expect(generatePatternSpy.mock.calls[1][2]).toBe(68);
    expect(screen.queryByText("Level Up!")).not.toBeInTheDocument();
  });
});
