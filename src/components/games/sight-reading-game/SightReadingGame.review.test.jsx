import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "./SightReadingGame";
import { updateStudentScore } from "../../../services/apiScores";

// ---- Shared spies + capture points (mirrors SightReadingGame.combo.test.jsx's pattern) ----
const incrementComboSpy = vi.hoisted(() => vi.fn());
const resetComboSpy = vi.hoisted(() => vi.fn());
const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
const pauseTimerSpy = vi.hoisted(() => vi.fn());
const resumeTimerSpy = vi.hoisted(() => vi.fn());
// Controllable useRhythmPlayback fake: records every play() call's (pattern, onBeat, onComplete)
// so the comparison-playback test can drive the two-pass chain by hand, without real audio/timers.
// This is the exact seam the label regression lived in — the old inert `play: vi.fn()` stub never
// invoked the callbacks, so the -1-as-end-of-pattern bug was invisible to tests.
const rhythmPlayCalls = vi.hoisted(() => []);

let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.combo.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.controls.compare": "Hear yours vs correct",
        "sightReading.compare.yours": "Yours",
        "sightReading.compare.correct": "Correct",
        "sightReading.controls.review": "Review mistakes",
        "sightReading.review.title": "Review Your Mistakes",
        "sightReading.review.instruction": "Play the note shown.",
        "sightReading.review.playIt": "Play it",
        "sightReading.review.skip": "Skip",
        "sightReading.review.done": "Great job! You reviewed every mistake.",
        "sightReading.review.exit": "Back to Feedback",
        "games.engagement.combo": "Combo",
        "games.engagement.onFire": "ON FIRE!",
      };
      if (key === "sightReading.review.progress") {
        return `${opts?.current ?? "?"} of ${opts?.total ?? "?"}`;
      }
      return translations[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn(), language: "en", dir: () => "ltr" },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("../../ui/BackButton", () => ({
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

vi.mock("../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: null, isStudent: false }),
}));

vi.mock("../../../services/apiScores", () => ({
  updateStudentScore: vi.fn(() => Promise.resolve({})),
}));

vi.mock("../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// REVIEW is required to be part of the session-timeout active-phase set (Pitfall 4) — spy on
// pauseTimer/resumeTimer so tests can assert the effect fires correctly on phase transitions.
vi.mock("../../../contexts/SessionTimeoutContext", () => ({
  useSessionTimeout: () => ({
    pauseTimer: pauseTimerSpy,
    resumeTimer: resumeTimerSpy,
  }),
}));

// Stateful mock: real React state, matching the combo test's convention.
vi.mock("../../../contexts/SightReadingSessionContext", () => ({
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

    return {
      totalExercises: 3,
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
    };
  },
}));

vi.mock("./components/VexFlowStaffDisplay", () => ({
  VexFlowStaffDisplay: () => <div data-testid="staff" />,
}));

vi.mock("./components/KlavierKeyboard", () => ({
  KlavierKeyboard: () => <div data-testid="keyboard" />,
}));

vi.mock("../rhythm-games/components/MetronomeDisplay", () => ({
  MetronomeDisplay: () => <div data-testid="metronome" />,
}));

vi.mock("./components/PreGameSetup", () => ({
  PreGameSetup: ({ onStart }) => (
    <button type="button" onClick={() => onStart()} aria-label="Start">
      Start
    </button>
  ),
}));

const startListeningSpy = vi.fn(() => Promise.resolve());
const stopListeningSpy = vi.fn();

vi.mock("../../../hooks/useMicNoteInput", () => ({
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

vi.mock("../../../contexts/AudioContextProvider", () => ({
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

vi.mock("../../../hooks/useAudioEngine", () => {
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

vi.mock("./hooks/useRhythmPlayback", () => ({
  useRhythmPlayback: () => ({
    play: vi.fn((pattern, onBeat, onComplete) => {
      rhythmPlayCalls.push({ pattern, onBeat, onComplete });
      return true; // mirror the real hook's "started" return so playPass doesn't bail
    }),
    stop: vi.fn(),
  }),
}));

vi.mock("./hooks/usePatternGeneration", () => ({
  usePatternGeneration: () => ({
    generatePattern: vi.fn(async () => ({
      tempo: 80,
      totalDuration: 1,
      // Single 1s note — one mistake max, so the drill completes on a single match.
      notes: [
        {
          type: "note",
          pitch: "C4",
          startTime: 0,
          endTime: 1,
          duration: 1,
        },
      ],
    })),
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
  await renderGame();

  const startPlayingButtons = screen.getAllByRole("button", {
    name: /Start Playing/i,
  });
  await act(async () => {
    fireEvent.click(startPlayingButtons[0]);
  });

  // Advance through count-in (~3s) into performance, without yet closing the note's
  // timing window (windowEnd ~= 1300ms after entering performance).
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3200);
  });
}

/** Reach FEEDBACK with a clean run (the single note scored correctly — no mistakes). */
async function reachCleanFeedback() {
  await startPerformance();

  await act(async () => {
    capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
}

/** Reach FEEDBACK with exactly one mistake (the note is never played, so it's recorded
 * "missed" by the RAF miss-sweep once its timing window closes). */
async function reachFeedbackWithOneMistake() {
  await startPerformance();

  // Never fire a note event — let the miss-sweep + completion path run.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
}

describe("SightReadingGame (review-mistakes drill)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    incrementComboSpy.mockClear();
    resetComboSpy.mockClear();
    pauseTimerSpy.mockClear();
    resumeTimerSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
    updateStudentScore.mockClear();
    rhythmPlayCalls.length = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Review button is absent on a clean run (D-20)", async () => {
    await reachCleanFeedback();

    expect(
      screen.queryByRole("button", { name: "Review mistakes" })
    ).not.toBeInTheDocument();
  });

  test("Review button is present with a mistake, and clicking it enters REVIEW (renders ReviewDrillPanel)", async () => {
    await reachFeedbackWithOneMistake();

    const reviewButton = screen.getByRole("button", {
      name: "Review mistakes",
    });
    await act(async () => {
      fireEvent.click(reviewButton);
      // Flush the async startListeningSync() promise chain (mic mode).
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Review Your Mistakes")).toBeInTheDocument();
    expect(screen.getByText("1 of 1")).toBeInTheDocument();
  });

  test("review input advances the drill and does NOT touch combo or persist a score", async () => {
    await reachFeedbackWithOneMistake();

    const reviewButton = screen.getByRole("button", {
      name: "Review mistakes",
    });
    await act(async () => {
      fireEvent.click(reviewButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("Review Your Mistakes")).toBeInTheDocument();

    // Clear past-the-audition-guard (500ms) so the note event below is actually routed
    // to the drill instead of being ignored as a possible audition self-detection.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    // Reset call counts right before the review input so only THIS input is asserted.
    incrementComboSpy.mockClear();
    resetComboSpy.mockClear();
    updateStudentScore.mockClear();

    await act(async () => {
      capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
    });

    expect(incrementComboSpy).not.toHaveBeenCalled();
    expect(resetComboSpy).not.toHaveBeenCalled();
    expect(updateStudentScore).not.toHaveBeenCalled();

    // The single mistake is now resolved -> the drill auto-exits back to FEEDBACK.
    expect(screen.queryByText("Review Your Mistakes")).not.toBeInTheDocument();
  });

  test("REVIEW is part of the session-timeout active-phase set (pauseTimer fires on entry)", async () => {
    await reachFeedbackWithOneMistake();

    const reviewButton = screen.getByRole("button", {
      name: "Review mistakes",
    });

    pauseTimerSpy.mockClear();
    resumeTimerSpy.mockClear();

    await act(async () => {
      fireEvent.click(reviewButton);
      await Promise.resolve();
      await Promise.resolve();
    });

    // If REVIEW were NOT in the session-timeout activePhases list, entering it would call
    // resumeTimer() instead (isGameActive would evaluate false for the "review" phase).
    expect(pauseTimerSpy).toHaveBeenCalled();
  });

  test("comparison playback: 'Yours' label persists through onBeat(-1) and only flips to 'Correct' on onComplete (PRAC-02 regression)", async () => {
    // Clean run so the reconstructed 'yours' rendition is non-empty (C4 played correctly).
    await reachCleanFeedback();

    const compareButton = screen.getByRole("button", {
      name: "Hear yours vs correct",
    });
    await act(async () => {
      fireEvent.click(compareButton);
      // Flush startComparison's `await resumeAudioContext()` before pass 1 is scheduled.
      await Promise.resolve();
      await Promise.resolve();
    });

    // Pass 1 (yours) started: label shows "Yours", not yet "Correct".
    expect(rhythmPlayCalls).toHaveLength(1);
    expect(screen.getByText("Yours")).toBeInTheDocument();
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();

    // The exact regression: onBeat(-1) fires during the scheduling lead-in / rests. It must NOT
    // be treated as end-of-pattern — the label must stay "Yours" and no second pass may start.
    await act(async () => {
      rhythmPlayCalls[0].onBeat(-1);
    });
    expect(screen.getByText("Yours")).toBeInTheDocument();
    expect(rhythmPlayCalls).toHaveLength(1);

    // onComplete is the real end-of-pattern signal: it chains the correct pass.
    await act(async () => {
      rhythmPlayCalls[0].onComplete();
    });
    expect(rhythmPlayCalls).toHaveLength(2);
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.queryByText("Yours")).not.toBeInTheDocument();
  });
});
