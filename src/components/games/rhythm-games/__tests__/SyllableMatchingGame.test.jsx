import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
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
      exerciseIndex: 2,
      totalExercises: 3,
      exerciseType: "syllable_matching",
    },
  })),
  useNavigate: vi.fn(() => mockNavigate),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => {
      if (key === "syllableMatching.prompt") return "What syllable is this?";
      if (key === "game.feedback.correct") return "Correct!";
      if (key === "game.feedback.wrong") return "Not quite";
      if (key === "game.error.generic") return "Something went wrong";
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
      return durMap[key] || key;
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
    generateQuestions: vi.fn((_pool, _dist, _count, opts) => {
      // Verify dedupSyllables is passed
      if (opts?.dedupSyllables !== true) {
        throw new Error("dedupSyllables option not passed");
      }
      return [
        { correct: "q", choices: ["q", "h", "w", "8"] },
        { correct: "h", choices: ["h", "q", "w", "qr"] },
        { correct: "q", choices: ["q", "16", "h", "w"] },
        { correct: "h", choices: ["w", "h", "8", "q"] },
        { correct: "q", choices: ["8", "w", "q", "16"] },
      ];
    }),
  };
});

// SVG component mocks (musicSymbols paths)
vi.mock("../../../../assets/musicSymbols/quarter-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-quarter-note" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/half-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-half-note" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/whole-note-head.svg?react", () => ({
  default: (props) => <svg data-testid="svg-whole-note" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/eighth-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-eighth-note" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/sixteenth-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-sixteenth-note" {...props} />,
}));
vi.mock(
  "../../../../assets/musicSymbols/dotted-quarter-note.svg?react",
  () => ({
    default: (props) => <svg data-testid="svg-dotted-quarter" {...props} />,
  })
);
vi.mock("../../../../assets/musicSymbols/dotted-half-note.svg?react", () => ({
  default: (props) => <svg data-testid="svg-dotted-half" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/quarter-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-quarter-rest" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/half-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-half-rest" {...props} />,
}));
vi.mock("../../../../assets/musicSymbols/whole-rest.svg?react", () => ({
  default: (props) => <svg data-testid="svg-whole-rest" {...props} />,
}));

vi.mock("../utils/rhythmVexflowHelpers", () => ({
  SYLLABLE_MAP_EN: {
    16: "ta-a-a-a",
    12: "ta-a-a",
    8: "ta-a",
    6: "ta-a",
    4: "ta",
    2: "ti",
    1: "ti-ka",
  },
  SYLLABLE_MAP_HE: {
    16: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4",
    12: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4-\u05D0\u05B8\u05D4",
    8: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4",
    6: "\u05D8\u05B8\u05D4-\u05D0\u05B8\u05D4",
    4: "\u05D8\u05B8\u05D4",
    2: "\u05D8\u05B4\u05D9",
    1: "\u05D8\u05B4\u05D9-\u05DB\u05BC\u05B8\u05D4",
  },
  REST_SYLLABLE_EN: "sh",
  REST_SYLLABLE_HE: "\u05D4\u05B8\u05E1",
}));

import SyllableMatchingGame from "../SyllableMatchingGame";

/** Helper: get answer cards only (exclude back button) */
function getAnswerCards() {
  return screen
    .getAllByRole("button")
    .filter((b) => b.getAttribute("data-testid") !== "back-button");
}

/** Helper: click a card and wait for auto-advance */
async function clickCardAndWait(index) {
  const cards = getAnswerCards();
  fireEvent.click(cards[index]);
  await waitFor(
    () => {
      const btns = screen.queryAllByRole("button");
      const answerCards = btns.filter(
        (b) => b.getAttribute("data-testid") !== "back-button"
      );
      const isVictory = screen.queryByTestId("victory-screen");
      const hasDefault = answerCards.some((c) =>
        c.className.includes("hover:bg-white/20")
      );
      if (!isVictory && !hasDefault) throw new Error("Still in feedback state");
    },
    { timeout: 2000 }
  );
}

describe("SyllableMatchingGame", () => {
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

  it("renders large SVG note prompt and 4 syllable text cards", () => {
    render(<SyllableMatchingGame />);

    // Should show the SVG prompt icon for the current note (quarter note)
    expect(screen.getByTestId("svg-quarter-note")).toBeInTheDocument();

    // Should show the question text
    expect(screen.getByText("What syllable is this?")).toBeInTheDocument();

    // 4 answer cards
    const cards = getAnswerCards();
    expect(cards.length).toBe(4);

    // Cards should show syllable text
    expect(screen.getByText("ta")).toBeInTheDocument();
  });

  it("shows correct Kodaly syllable for each duration code", () => {
    render(<SyllableMatchingGame />);

    // First question: choices are ["q", "h", "w", "8"]
    // Syllables: ta, ta-a, ta-a-a-a, ti
    expect(screen.getByText("ta")).toBeInTheDocument();
    expect(screen.getByText("ta-a")).toBeInTheDocument();
    expect(screen.getByText("ta-a-a-a")).toBeInTheDocument();
    expect(screen.getByText("ti")).toBeInTheDocument();
  });

  it("marks correct card green and auto-advances after 800ms", async () => {
    render(<SyllableMatchingGame />);
    const cards = getAnswerCards();

    // Click the correct card (index 0 = "q" = "ta")
    fireEvent.click(cards[0]);

    // Correct card should show green
    expect(cards[0].className).toContain("bg-green-500/20");

    // Wait for auto-advance — SVG should change to half-note
    await waitFor(
      () => {
        expect(screen.getByTestId("svg-half-note")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("marks wrong card red, highlights correct card, auto-advances after 1200ms", async () => {
    render(<SyllableMatchingGame />);
    const cards = getAnswerCards();

    // Click a wrong card (index 1 = "h" = "ta-a", but correct is "q")
    fireEvent.click(cards[1]);

    // Wrong card should show red
    expect(cards[1].className).toContain("bg-red-500/20");
    // Correct card (index 0) should show green
    expect(cards[0].className).toContain("bg-green-500/20");

    // Wait for auto-advance
    await waitFor(
      () => {
        expect(screen.getByTestId("svg-half-note")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("shows VictoryScreen after 5 questions with correct score", async () => {
    vi.useFakeTimers();
    render(<SyllableMatchingGame />);

    // Answer all 5 questions
    for (let q = 0; q < 5; q++) {
      const cards = getAnswerCards();
      fireEvent.click(cards[0]);
      await act(() => vi.advanceTimersByTime(1500));
    }

    // VictoryScreen should appear
    expect(screen.getByTestId("victory-screen")).toBeInTheDocument();
    expect(screen.getByTestId("victory-score").textContent).toBe("3");
    expect(screen.getByTestId("victory-total").textContent).toBe("5");
    expect(screen.getByTestId("victory-node").textContent).toBe("rhythm_1_1");
    expect(screen.getByTestId("victory-exercise").textContent).toBe("2");

    vi.useRealTimers();
  });

  it("uses dedupSyllables option to avoid ambiguous distractors", () => {
    // The mock for generateQuestions throws if dedupSyllables is not true.
    // If this renders without error, dedupSyllables was correctly passed.
    expect(() => {
      render(<SyllableMatchingGame />);
    }).not.toThrow();
  });

  it("displays Hebrew syllables with Nikud when language is HE", async () => {
    // Override useTranslation mock for this test
    const { useTranslation } = await import("react-i18next");
    useTranslation.mockReturnValue({
      t: (key) => {
        if (key === "syllableMatching.prompt")
          return "?\u05D0\u05D9\u05D6\u05D5 \u05D4\u05D1\u05E8\u05D4 \u05D6\u05D5";
        if (key === "rhythm.duration.quarter")
          return "\u05EA\u05D5 \u05E8\u05D1\u05E2";
        return key;
      },
      i18n: { language: "he" },
    });

    render(<SyllableMatchingGame />);

    // Quarter note syllable in Hebrew: \u05D8\u05B8\u05D4
    expect(screen.getByText("\u05D8\u05B8\u05D4")).toBeInTheDocument();
  });
});
