import { useState, useCallback, useRef } from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SightReadingGame } from "./SightReadingGame";

// ---- Shared spies + capture points (mirrors SightReadingGame.combo.test.jsx's pattern) ----
const incrementComboSpy = vi.hoisted(() => vi.fn());
const resetComboSpy = vi.hoisted(() => vi.fn());
const mockInitialGradingModeBox = vi.hoisted(() => ({ current: "test" }));
// D-11 double-play guard assertion point: useRhythmPlayback's play/stop as spies so we can
// assert exact call counts without depending on real Web Audio oscillator internals.
const rhythmPlaySpy = vi.hoisted(() => vi.fn());
const rhythmStopSpy = vi.hoisted(() => vi.fn());

let capturedOnNoteEvent = null;

// ---- Mocks (mirrors SightReadingGame.combo.test.jsx's mocking conventions) ----
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        "sightReading.startPlaying": "Start Playing",
        "sightReading.tryAgain": "Try Again",
        "sightReading.nextExercise": "Next Exercise",
        "sightReading.controls.replay": "Hear it again",
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

    // Phase 03 (ADAPT-01/02): adaptive streak/tier ref-mirrored state, mirroring the real
    // context's pattern (successStreakRef.current is read synchronously in handleNextExercise).
    const successStreakRef = useRef(0);
    const adaptiveTierIndexRef = useRef(0);
    const setSuccessStreak = useCallback((n) => {
      successStreakRef.current = n;
    }, []);
    const setAdaptiveTierIndex = useCallback((n) => {
      adaptiveTierIndexRef.current = n;
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
      successStreakRef,
      setSuccessStreak,
      adaptiveTierIndexRef,
      setAdaptiveTierIndex,
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

// D-11/D-08: play/stop as spies so the double-play guard and unlimited-taps behavior can be
// asserted by call count without needing a real AudioContext/oscillator graph.
vi.mock("./hooks/useRhythmPlayback", () => ({
  useRhythmPlayback: () => ({ play: rhythmPlaySpy, stop: rhythmStopSpy }),
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

async function reachFeedbackAndGoNext() {
  await startPerformance();

  await act(async () => {
    capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
  });

  // Let the exercise complete (already-scored note, no miss) to reach FEEDBACK.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });

  const nextButton = screen.getByRole("button", { name: "Next Exercise" });
  await act(async () => {
    fireEvent.click(nextButton);
    // Flush the async generatePattern() call inside loadExercisePattern so the new
    // pattern/DISPLAY-phase transition (and its 500ms preview-play setTimeout) land.
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("SightReadingGame (replay + comparison playback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    localStorage.setItem("sightReadingInputMode", "mic");
    incrementComboSpy.mockClear();
    resetComboSpy.mockClear();
    rhythmPlaySpy.mockClear();
    rhythmStopSpy.mockClear();
    capturedOnNoteEvent = null;
    mockInitialGradingModeBox.current = "test";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("tapping replay before the pending 500ms auto-play timer fires calls play exactly once (D-11)", async () => {
    await reachFeedbackAndGoNext();

    // Now in DISPLAY for exercise 2, with loadExercisePattern's 500ms auto-play preview
    // still pending (not yet fired). Nothing should have called play() yet.
    expect(rhythmPlaySpy).not.toHaveBeenCalled();

    const replayButton = screen.getByRole("button", { name: "Hear it again" });
    await act(async () => {
      fireEvent.click(replayButton);
    });

    // Flush well past the original pending auto-play timeout.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(rhythmPlaySpy).toHaveBeenCalledTimes(1);
  });

  test("replay button is present in DISPLAY and absent outside DISPLAY", async () => {
    await renderGame();

    expect(
      screen.getByRole("button", { name: "Hear it again" })
    ).toBeInTheDocument();

    const startPlayingButtons = screen.getAllByRole("button", {
      name: /Start Playing/i,
    });
    await act(async () => {
      fireEvent.click(startPlayingButtons[0]);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3200);
    });
    await act(async () => {
      capturedOnNoteEvent({ type: "noteOn", pitch: "C4", frequency: 261.6 });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    // Now in FEEDBACK — the replay button must not be present.
    expect(
      screen.queryByRole("button", { name: "Hear it again" })
    ).not.toBeInTheDocument();
  });

  test("multiple replay taps each call play (unlimited, D-08)", async () => {
    await renderGame();

    const replayButton = screen.getByRole("button", { name: "Hear it again" });
    await act(async () => {
      fireEvent.click(replayButton);
    });
    await act(async () => {
      fireEvent.click(replayButton);
    });
    await act(async () => {
      fireEvent.click(replayButton);
    });

    expect(rhythmPlaySpy).toHaveBeenCalledTimes(3);
  });
});
