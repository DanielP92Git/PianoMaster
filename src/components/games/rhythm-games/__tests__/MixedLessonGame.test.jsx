import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({
    state: {
      nodeId: "rhythm_1_1",
      nodeConfig: {
        questions: [
          { type: "visual_recognition" },
          { type: "syllable_matching" },
          { type: "visual_recognition" },
          { type: "syllable_matching" },
        ],
      },
      exerciseIndex: 0,
      totalExercises: 4,
      exerciseType: "mixed_lesson",
    },
  })),
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, fallback) => {
      const map = {
        "game.feedback.correct": "Correct!",
        "game.feedback.wrong": "Not quite",
        "game.error.generic": "Something went wrong",
        "mixedLesson.progressLabel": "Lesson progress",
      };
      return map[key] || fallback || key;
    },
    i18n: { language: "en" },
  })),
}));

vi.mock("../../../../features/games/hooks/useSounds", () => ({
  useSounds: vi.fn(() => ({
    playCorrectSound: vi.fn(),
    playWrongSound: vi.fn(),
    playVictorySound: vi.fn(),
    playGameOverSound: vi.fn(),
    playDrumStickSound: vi.fn(),
    soundRefs: {},
  })),
}));

vi.mock("../../../../contexts/AudioContextProvider", () => ({
  useAudioContext: vi.fn(() => ({
    audioContextRef: { current: null },
    isInterrupted: false,
    handleTapToResume: vi.fn(),
    getOrCreateAudioContext: vi.fn(),
  })),
}));

vi.mock("../../shared/AudioInterruptedOverlay.jsx", () => ({
  AudioInterruptedOverlay: () => null,
}));

vi.mock("../../../../contexts/SessionTimeoutContext", () => ({
  useSessionTimeout: vi.fn(() => ({
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
  })),
}));

vi.mock("../../../../hooks/useLandscapeLock", () => ({
  useLandscapeLock: vi.fn(),
}));

vi.mock("../../../../hooks/useRotatePrompt", () => ({
  useRotatePrompt: vi.fn(() => ({
    shouldShowPrompt: false,
    dismissPrompt: vi.fn(),
  })),
}));

vi.mock("../../../orientation/RotatePromptOverlay", () => ({
  RotatePromptOverlay: () => null,
}));

vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    soft: { type: "spring", stiffness: 360, damping: 28 },
    fade: { duration: 0.18, ease: "easeOut" },
  })),
}));

vi.mock("../../../ui/BackButton", () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

vi.mock("../../VictoryScreen", () => ({
  default: ({ score, totalPossibleScore, nodeId, exerciseIndex }) => (
    <div data-testid="victory-screen">
      <span data-testid="victory-score">{score}</span>
      <span data-testid="victory-total">{totalPossibleScore}</span>
      <span data-testid="victory-node">{nodeId}</span>
      <span data-testid="victory-exercise">{exerciseIndex}</span>
    </div>
  ),
}));

vi.mock("../../../../data/skillTrail", () => ({
  getNodeById: vi.fn(() => ({
    id: "rhythm_1_1",
    rhythmConfig: {
      durations: ["q"],
      focusDurations: ["q"],
      contextDurations: [],
    },
  })),
}));

// Mock renderers — test engine integration without real DurationCard/SVGs
vi.mock("../renderers/VisualRecognitionQuestion", () => ({
  default: ({ question, cardStates, onSelect, disabled }) => (
    <div data-testid="visual-recognition-question">
      {question.choices.map((c, i) => (
        <button
          key={i}
          data-testid={`vr-card-${i}`}
          onClick={() => !disabled && onSelect(i)}
        >
          {c}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../renderers/SyllableMatchingQuestion", () => ({
  default: ({ question, cardStates, onSelect, disabled }) => (
    <div data-testid="syllable-matching-question">
      {question.choices.map((c, i) => (
        <button
          key={i}
          data-testid={`sm-card-${i}`}
          onClick={() => !disabled && onSelect(i)}
        >
          {c}
        </button>
      ))}
    </div>
  ),
}));

vi.mock("../utils/durationInfo", () => ({
  generateQuestions: vi.fn((pool) => {
    return [
      { correct: pool[0] || "q", choices: [pool[0] || "q", "h", "w", "8"] },
    ];
  }),
  ALL_DURATION_CODES: ["q", "h", "w", "8", "16"],
}));

import MixedLessonGame from "../MixedLessonGame";
import { useLocation } from "react-router-dom";

describe("MixedLessonGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockNavigate.mockClear();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders error state when nodeId is missing", () => {
    useLocation.mockReturnValueOnce({ state: null });
    render(<MixedLessonGame />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("auto-starts game on mount with nodeConfig", () => {
    render(<MixedLessonGame />);
    // First question is visual_recognition type
    expect(
      screen.getByTestId("visual-recognition-question")
    ).toBeInTheDocument();
  });

  it("renders progress bar with correct fraction", () => {
    render(<MixedLessonGame />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuemax", "4");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText("0/4")).toBeInTheDocument();
  });

  it("advances to next question on correct answer", async () => {
    render(<MixedLessonGame />);

    // Click the correct card (index 0 = pool[0] = "q", and choices[0] = "q")
    fireEvent.click(screen.getByTestId("vr-card-0"));

    // Advance past feedback delay
    await act(() => vi.advanceTimersByTime(800));

    // Should now show 1/4 in progress
    expect(screen.getByText("1/4")).toBeInTheDocument();
  });

  it("shows VictoryScreen after all questions answered", async () => {
    render(<MixedLessonGame />);

    // Answer all 4 questions (alternating VR and SM)
    // Q1: visual_recognition — click correct (index 0)
    fireEvent.click(screen.getByTestId("vr-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Q2: syllable_matching — click correct (index 0)
    fireEvent.click(screen.getByTestId("sm-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Q3: visual_recognition — click correct (index 0)
    fireEvent.click(screen.getByTestId("vr-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Q4: syllable_matching — click correct (index 0)
    fireEvent.click(screen.getByTestId("sm-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // VictoryScreen should be rendered
    expect(screen.getByTestId("victory-screen")).toBeInTheDocument();
    expect(screen.getByTestId("victory-score").textContent).toBe("4");
    expect(screen.getByTestId("victory-total").textContent).toBe("4");
    expect(screen.getByTestId("victory-node").textContent).toBe("rhythm_1_1");
    expect(screen.getByTestId("victory-exercise").textContent).toBe("0");
  });

  it("switches renderer type on question type change", async () => {
    render(<MixedLessonGame />);

    // First question is visual_recognition
    expect(
      screen.getByTestId("visual-recognition-question")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("syllable-matching-question")
    ).not.toBeInTheDocument();

    // Answer first question and advance
    fireEvent.click(screen.getByTestId("vr-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Second question is syllable_matching
    expect(
      screen.getByTestId("syllable-matching-question")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("visual-recognition-question")
    ).not.toBeInTheDocument();
  });

  it("tracks correct and wrong answers in score", async () => {
    render(<MixedLessonGame />);

    // Q1: correct (index 0)
    fireEvent.click(screen.getByTestId("vr-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Q2: wrong (index 1 = "h", but correct is "q")
    fireEvent.click(screen.getByTestId("sm-card-1"));
    await act(() => vi.advanceTimersByTime(1200));

    // Q3: correct (index 0)
    fireEvent.click(screen.getByTestId("vr-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // Q4: correct (index 0)
    fireEvent.click(screen.getByTestId("sm-card-0"));
    await act(() => vi.advanceTimersByTime(800));

    // VictoryScreen with 3 correct out of 4
    expect(screen.getByTestId("victory-screen")).toBeInTheDocument();
    expect(screen.getByTestId("victory-score").textContent).toBe("3");
    expect(screen.getByTestId("victory-total").textContent).toBe("4");
  });
});
