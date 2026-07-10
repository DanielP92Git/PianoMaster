import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "./SightReadingGame";

// ---- Shared spies + capture points (see vi.hoisted note below) ----
// vi.mock factories are hoisted above imports, so anything a factory closes over
// must itself be created via vi.hoisted (Vitest's documented pattern for this).
const incrementComboSpy = vi.hoisted(() => vi.fn());
const resetComboSpy = vi.hoisted(() => vi.fn());

// Populated by the mocked useSightReadingSession hook on every render so tests can
// drive combo state directly without re-running the full note-detection pipeline.
let capturedIncrementCombo = null;
// Populated by the mocked useMicNoteInput hook so tests can simulate a detected note.
let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.micRestart.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
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
  updateStudentScore: vi.fn(),
}));

vi.mock("../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// Stateful mock: uses REAL React state internally (this hook runs inside
// SightReadingGame's render, so calling useState/useCallback here is valid) so that
// incrementCombo/resetCombo behave exactly like the real context (Plan 01) and drive
// genuine re-renders — needed to exercise ComboPill/OnFireBadge's own
// combo-transition effects faithfully.
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

    capturedIncrementCombo = incrementCombo;

    // Grading-mode state (Plan 02-07, D-05) — stateful like combo/isOnFire above so the
    // real mode-lock/pill behavior in SightReadingGame.jsx exercises genuinely, not a stub.
    const [gradingMode, setGradingModeState] = useState("test");
    const [isModeLocked, setIsModeLocked] = useState(false);
    const gradingModeRef = useRef("test");
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

vi.mock("./hooks/usePatternGeneration", () => ({
  usePatternGeneration: () => ({
    generatePattern: vi.fn(async () => ({
      tempo: 80,
      totalDuration: 1,
      // Single 1s note — long enough that firing a note event right after count-in
      // lands comfortably inside the scoring window (windowEnd ~= 1300ms), but short
      // enough that the miss/completion path resolves quickly in fake-timer tests.
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

async function startPerformance() {
  render(
    <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
      <SightReadingGame />
    </MemoryRouter>
  );

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await Promise.resolve();
  });
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

describe("SightReadingGame (combo integration)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    incrementComboSpy.mockClear();
    resetComboSpy.mockClear();
    capturedIncrementCombo = null;
    capturedOnNoteEvent = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("increments combo on a correct note", async () => {
    await startPerformance();

    expect(capturedOnNoteEvent).toBeTypeOf("function");
    await act(async () => {
      capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
    });

    expect(incrementComboSpy).toHaveBeenCalled();
  });

  test("resets on miss when the timing window closes", async () => {
    await startPerformance();

    // Never play the note — let its timing window (and the exercise) fully close so
    // the RAF miss branch in schedulePerformanceTimeline fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(resetComboSpy).toHaveBeenCalled();
  });

  test("persists across exercises (not reset by goToNextExercise)", async () => {
    await startPerformance();

    // Score the note correctly (via the real detection pipeline, as in the first test)
    // so no pending note is left to miss when the exercise timeline completes below —
    // this test targets the next-exercise transition, not the miss/reset path.
    await act(async () => {
      capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
    });

    expect(screen.getByRole("status", { name: "Combo" })).toHaveTextContent(
      "1"
    );

    // Let the exercise complete (already-scored note, no miss) to reach FEEDBACK.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    const nextButton = screen.getByRole("button", { name: "Next Exercise" });
    await act(async () => {
      fireEvent.click(nextButton);
    });

    // goToNextExercise is a mocked no-op — combo must survive the advance (D-05).
    expect(screen.getByRole("status", { name: "Combo" })).toHaveTextContent(
      "1"
    );
  });

  test("renders ComboPill + OnFireBadge at combo >= 5 and on-fire", async () => {
    await startPerformance();

    await act(async () => {
      capturedIncrementCombo();
      capturedIncrementCombo();
      capturedIncrementCombo();
      capturedIncrementCombo();
      capturedIncrementCombo();
    });

    expect(screen.getByRole("status", { name: "Combo" })).toHaveTextContent(
      "5"
    );
    expect(screen.getByLabelText("ON FIRE!")).toBeInTheDocument();
  });
});
