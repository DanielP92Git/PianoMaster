import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "./SightReadingGame";
import { updateStudentScore } from "../../../services/apiScores";

// ---- Shared spies + capture points (mirrors SightReadingGame.combo.test.jsx's harness) ----
const lockModeSpy = vi.hoisted(() => vi.fn());
const unlockModeSpy = vi.hoisted(() => vi.fn());
// Mutable initial grading mode, read once at mount by the mocked useSightReadingSession
// hook below — lets individual tests render the game already in Practice mode without
// needing to click the (locked-after-COUNT_IN) pill mid-test.
const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));

// Populated by the mocked useMicNoteInput hook so tests can simulate a detected note.
let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.combo.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.changeSettings": "Settings",
        "sightReading.controls.modePractice": "Practice",
        "sightReading.controls.modeTest": "Test",
        "sightReading.controls.modeToggleLabel": "Grading mode",
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

// Student + studentId present so the updateStudentScore effect actually reaches the
// grading-mode guard (rather than short-circuiting on the "not a student" early-exit).
vi.mock("../../../features/authentication/useUser", () => ({
  useUser: () => ({ user: { id: "test-student-id" }, isStudent: true }),
}));

const updateStudentScoreSpy = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ newScore: { id: "score-1" } }))
);
vi.mock("../../../services/apiScores", () => ({
  updateStudentScore: updateStudentScoreSpy,
}));

vi.mock("../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

// Stateful mock: uses REAL React state internally (this hook runs inside
// SightReadingGame's render, so calling useState/useCallback here is valid) so the
// mode-lock/pill behavior in SightReadingGame.jsx exercises genuinely, not a stub —
// same pattern as SightReadingGame.combo.test.jsx's harness.
vi.mock("../../../contexts/SightReadingSessionContext", () => ({
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
    const lockMode = useCallback(() => {
      lockModeSpy();
      setIsModeLocked(true);
    }, []);
    const unlockMode = useCallback(() => {
      unlockModeSpy();
      setIsModeLocked(false);
    }, []);

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
      // lands comfortably inside the scoring window, short enough that the
      // miss/completion path resolves quickly in fake-timer tests.
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
  // timing window.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3200);
  });
}

async function startPerformanceAndReachFeedback() {
  await startPerformance();

  // Score the note correctly so no pending note is left to miss.
  await act(async () => {
    capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
  });

  // Let the exercise complete (already-scored note, no miss) to reach FEEDBACK.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
}

describe("SightReadingGame (Practice/Test grading mode)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.clear();
    localStorage.setItem("sightReadingInputMode", "mic");
    lockModeSpy.mockClear();
    unlockModeSpy.mockClear();
    updateStudentScoreSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("Practice mode: updateStudentScore is NOT called at FEEDBACK", async () => {
    mockInitialGradingModeBox.current = "practice";

    await startPerformanceAndReachFeedback();

    expect(updateStudentScoreSpy).not.toHaveBeenCalled();
    expect(updateStudentScore).not.toHaveBeenCalled();
  });

  test("Test mode (default): updateStudentScore IS called at FEEDBACK", async () => {
    await startPerformanceAndReachFeedback();

    // Flush the async submitScore() promise chain inside the effect.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(updateStudentScoreSpy).toHaveBeenCalledTimes(1);
  });

  test("Mode locks at first COUNT_IN", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      await Promise.resolve();
    });

    // Before COUNT_IN: pill is enabled (not locked).
    const pillBeforeCountIn = screen.getByRole("button", {
      name: "Grading mode",
    });
    expect(pillBeforeCountIn).not.toBeDisabled();

    const startPlayingButtons = screen.getAllByRole("button", {
      name: /Start Playing/i,
    });
    await act(async () => {
      fireEvent.click(startPlayingButtons[0]);
    });

    expect(lockModeSpy).toHaveBeenCalled();

    const pillDuringCountIn = screen.getByRole("button", {
      name: "Grading mode",
    });
    expect(pillDuringCountIn).toBeDisabled();
  });

  test("Mode persists to localStorage (sightReadingGradingMode)", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      await Promise.resolve();
    });

    const pill = screen.getByRole("button", { name: "Grading mode" });
    // Toggle Test -> Practice (mode is not yet locked pre-COUNT_IN).
    await act(async () => {
      fireEvent.click(pill);
    });

    expect(localStorage.getItem("sightReadingGradingMode")).toBe("practice");
  });

  test("unlockMode is invoked via returnToSetup (session boundary)", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/", state: null }]}>
        <SightReadingGame />
      </MemoryRouter>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      await Promise.resolve();
    });

    // returnToSetup path: the header settings/gear button (no nodeConfig -> returnToSetup).
    const settingsButton = screen.getByTitle("Settings");
    await act(async () => {
      fireEvent.click(settingsButton);
    });
    expect(unlockModeSpy).toHaveBeenCalledTimes(1);
  });

  test("unlockMode is NOT invoked by the mid-exercise Try Again (replayPattern)", async () => {
    await startPerformanceAndReachFeedback();

    const tryAgainButton = screen.getByRole("button", { name: "Try Again" });
    await act(async () => {
      fireEvent.click(tryAgainButton);
    });

    // Mid-exercise Try Again (replayPattern) must NOT unlock the mode (D-05).
    expect(unlockModeSpy).not.toHaveBeenCalled();
  });
});
