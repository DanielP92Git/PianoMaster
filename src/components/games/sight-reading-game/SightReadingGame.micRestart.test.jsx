import { render, screen, act, fireEvent } from "@testing-library/react";

import { SightReadingGame } from "./SightReadingGame";

// ---- Mocks (keep the test focused on mic lifecycle, not rendering/VexFlow/etc.) ----
vi.mock("../../ui/BackButton", () => ({
  default: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
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

vi.mock("../../../contexts/SightReadingSessionContext", () => ({
  SIGHT_READING_SESSION_CONSTANTS: { DEFAULT_MAX_SCORE_PER_EXERCISE: 1000 },
  useSightReadingSession: () => ({
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
  }),
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
  useMicNoteInput: () => ({
    audioLevel: 0,
    isListening: false,
    startListening: startListeningSpy,
    stopListening: stopListeningSpy,
    debug: {},
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
      totalDuration: 0.25,
      // Minimal, short pattern so the timeline completes quickly in tests.
      notes: [
        {
          type: "note",
          pitch: "C4",
          startTime: 0,
          endTime: 0.25,
          duration: 0.25,
        },
      ],
    })),
  }),
}));

describe("SightReadingGame (mic)", () => {
  beforeEach(() => {
    startListeningSpy.mockClear();
    stopListeningSpy.mockClear();
    localStorage.setItem("sightReadingInputMode", "mic");
  });

  test("restarting a performance calls startListening again (regression: mic flag not reset)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    render(<SightReadingGame />);

    // Start -> DISPLAY
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Start" }));
      // Flush the async startGame() promise chain (pattern generation + flushSync).
      await Promise.resolve();
    });
    const startPlayingButtons1 = screen.getAllByRole("button", {
      name: /Start Playing/i,
    });

    // Start first performance
    await act(async () => {
      fireEvent.click(startPlayingButtons1[0]);
    });

    // Advance through count-in (~3s), into performance, and past completion.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(startListeningSpy).toHaveBeenCalledTimes(1);

    // Back to DISPLAY via Try Again, then start again.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Try Again/i }));
      await Promise.resolve();
    });
    const startPlayingButtons2 = screen.getAllByRole("button", {
      name: /Start Playing/i,
    });
    await act(async () => {
      fireEvent.click(startPlayingButtons2[0]);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });

    expect(startListeningSpy).toHaveBeenCalledTimes(2);
  });
});


