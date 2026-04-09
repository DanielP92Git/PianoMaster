import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: vi.fn(() => ({
    state: {
      nodeId: "rhythm_1_1",
      nodeConfig: { questionCount: 5 },
      exerciseIndex: 1,
      totalExercises: 3,
      exerciseType: "visual_recognition",
    },
  })),
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, opts) => {
      if (key === "visualRecognition.prompt" && opts?.durationName)
        return `Which one is a ${opts.durationName}?`;
      const durMap = {
        "rhythm.duration.quarter": "quarter note",
        "rhythm.duration.half": "half note",
        "rhythm.duration.whole": "whole note",
        "rhythm.duration.eighth": "eighth note",
        "rhythm.duration.sixteenth": "sixteenth note",
        "rhythm.duration.dottedQuarter": "dotted quarter note",
        "rhythm.duration.dottedHalf": "dotted half note",
        "rhythm.duration.quarterRest": "quarter rest",
        "rhythm.duration.halfRest": "half rest",
        "rhythm.duration.wholeRest": "whole rest",
      };
      if (durMap[key]) return durMap[key];
      if (key === "game.feedback.correct") return "Correct!";
      if (key === "game.feedback.wrong") return "Not quite";
      if (key === "game.error.generic") return "Something went wrong";
      return key;
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
      durations: ["q", "h"],
      focusDurations: ["q"],
      contextDurations: ["h"],
    },
  })),
}));

vi.mock("../utils/durationInfo", async () => {
  const actual = await vi.importActual("../utils/durationInfo");
  return {
    ...actual,
    generateQuestions: vi.fn(() => [
      { correct: "q", choices: ["q", "h", "w", "8"] },
      { correct: "h", choices: ["h", "q", "w", "8"] },
      { correct: "q", choices: ["q", "16", "h", "w"] },
      { correct: "h", choices: ["w", "h", "8", "q"] },
      { correct: "q", choices: ["8", "w", "q", "16"] },
    ]),
  };
});

// SVG component mocks
vi.mock("../../../../assets/icons/rhythm/quarter-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-quarter-note" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/half-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-half-note" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/whole-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-whole-note" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/eighth-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-eighth-note" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/sixteenth-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-sixteenth-note" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/dotted-quarter.svg?react", () => ({
  default: (props) => <svg data-testid="svg-dotted-quarter" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/dotted-half.svg?react", () => ({
  default: (props) => <svg data-testid="svg-dotted-half" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/quarter-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-quarter-rest" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/half-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-half-rest" {...props} />,
}));
vi.mock("../../../../assets/icons/rhythm/whole-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-whole-rest" {...props} />,
}));

import VisualRecognitionGame from "../VisualRecognitionGame";

/** Helper: get only the 4 answer cards (exclude back button) */
function getAnswerCards() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.getAttribute("data-testid") !== "back-button");
}

/** Helper: click a card and wait for auto-advance */
async function clickCardAndWait(index) {
  const cards = getAnswerCards();
  fireEvent.click(cards[index]);
  // Wait long enough for the auto-advance timeout (max 1200ms)
  await waitFor(
    () => {
      // After auto-advance, card states reset to default OR we're at VictoryScreen
      const btns = screen.queryAllByRole("button");
      const answerCards = btns.filter(
        (b) => b.getAttribute("data-testid") !== "back-button"
      );
      // Either VictoryScreen is showing, or cards have reset to default state
      const isVictory = screen.queryByTestId("victory-screen");
      const hasDefault = answerCards.some((c) =>
        c.className.includes("hover:bg-white/20")
      );
      if (!isVictory && !hasDefault) throw new Error("Still in feedback state");
    },
    { timeout: 2000 }
  );
}

describe("VisualRecognitionGame", () => {
  beforeEach(() => {
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

  it("renders 4 icon cards when game starts", () => {
    render(<VisualRecognitionGame />);
    const cards = getAnswerCards();
    expect(cards.length).toBe(4);
  });

  it('shows "Which one is a [duration]?" prompt with correct duration name', () => {
    render(<VisualRecognitionGame />);
    expect(
      screen.getByText("Which one is a quarter note?")
    ).toBeInTheDocument();
  });

  it("marks correct card green and auto-advances after 800ms", async () => {
    render(<VisualRecognitionGame />);
    const cards = getAnswerCards();

    // Click the correct card (index 0 = "q")
    fireEvent.click(cards[0]);

    // The correct card should show green immediately
    expect(cards[0].className).toContain("bg-green-500/20");
    // Other cards should be dimmed
    expect(cards[1].className).toContain("opacity-40");

    // Wait for auto-advance to question 2
    await waitFor(
      () => {
        expect(screen.getByText("Which one is a half note?")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("marks wrong card red, highlights correct card, auto-advances after 1200ms", async () => {
    render(<VisualRecognitionGame />);
    const cards = getAnswerCards();

    // Click a wrong card (index 1 = "h")
    fireEvent.click(cards[1]);

    // Wrong card should show red
    expect(cards[1].className).toContain("bg-red-500/20");
    // Correct card (index 0) should show green highlight
    expect(cards[0].className).toContain("bg-green-500/20");

    // Wait for auto-advance to question 2
    await waitFor(
      () => {
        expect(screen.getByText("Which one is a half note?")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("shows VictoryScreen after 5 questions with correct score", async () => {
    vi.useFakeTimers();
    render(<VisualRecognitionGame />);

    // Answer all 5 questions by clicking index 0 each time:
    // q0: correct=q, choices[0]=q -> correct
    // q1: correct=h, choices[0]=h -> correct
    // q2: correct=q, choices[0]=q -> correct
    // q3: correct=h, choices[0]=w -> wrong
    // q4: correct=q, choices[0]=8 -> wrong
    for (let q = 0; q < 5; q++) {
      const cards = getAnswerCards();
      fireEvent.click(cards[0]);
      await act(() => vi.advanceTimersByTime(1500));
    }

    // VictoryScreen should be rendered with correct score
    expect(screen.getByTestId("victory-screen")).toBeInTheDocument();
    expect(screen.getByTestId("victory-score").textContent).toBe("3");
    expect(screen.getByTestId("victory-total").textContent).toBe("5");
    expect(screen.getByTestId("victory-node").textContent).toBe("rhythm_1_1");
    expect(screen.getByTestId("victory-exercise").textContent).toBe("1");

    vi.useRealTimers();
  });

  it("tracks progress dots (green=correct, red=wrong)", async () => {
    render(<VisualRecognitionGame />);

    const progressGroup = screen.getByRole("group", { name: "Progress" });
    const dots = progressGroup.querySelectorAll("div");
    expect(dots.length).toBe(5);

    // First dot should be current (white/60)
    expect(dots[0].className).toContain("bg-white/60");

    // Answer first question correctly then wait for advance
    await clickCardAndWait(0);

    // After advancing, first dot should be green
    const updatedDots = progressGroup.querySelectorAll("div");
    expect(updatedDots[0].className).toContain("bg-green-400");
    // Second dot should now be current
    expect(updatedDots[1].className).toContain("bg-white/60");
  });

  it("integrates with trail via location.state (nodeId, exerciseIndex)", async () => {
    vi.useFakeTimers();
    render(<VisualRecognitionGame />);

    // Verify game started via auto-start
    expect(
      screen.getByText("Which one is a quarter note?")
    ).toBeInTheDocument();

    // Complete all 5 questions
    for (let q = 0; q < 5; q++) {
      const cards = getAnswerCards();
      fireEvent.click(cards[0]);
      await act(() => vi.advanceTimersByTime(1500));
    }

    // VictoryScreen should receive trail props
    expect(screen.getByTestId("victory-node").textContent).toBe("rhythm_1_1");
    expect(screen.getByTestId("victory-exercise").textContent).toBe("1");

    vi.useRealTimers();
  });
});
