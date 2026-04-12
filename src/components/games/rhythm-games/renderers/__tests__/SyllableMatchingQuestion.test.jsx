import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => {
      if (key === "syllableMatching.prompt") return "What syllable is this?";
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

// Mock DurationCard — both default and named SVG_COMPONENTS export
vi.mock("../../components/DurationCard", () => ({
  default: ({
    type,
    text,
    state,
    onSelect,
    disabled,
    cardIndex,
    ariaLabel,
  }) => (
    <div
      data-testid={`duration-card-${cardIndex}`}
      data-type={type}
      data-text={text}
      data-state={state}
      data-disabled={String(disabled)}
      role="button"
      aria-label={ariaLabel}
      onClick={() => onSelect?.(cardIndex)}
    >
      {text}
    </div>
  ),
  SVG_COMPONENTS: {
    q: (props) => <svg data-testid="svg-quarter-note" {...props} />,
    h: (props) => <svg data-testid="svg-half-note" {...props} />,
    w: (props) => <svg data-testid="svg-whole-note" {...props} />,
    8: (props) => <svg data-testid="svg-eighth-note" {...props} />,
    16: (props) => <svg data-testid="svg-sixteenth-note" {...props} />,
    qd: (props) => <svg data-testid="svg-dotted-quarter" {...props} />,
    hd: (props) => <svg data-testid="svg-dotted-half" {...props} />,
    qr: (props) => <svg data-testid="svg-quarter-rest" {...props} />,
    hr: (props) => <svg data-testid="svg-half-rest" {...props} />,
    wr: (props) => <svg data-testid="svg-whole-rest" {...props} />,
  },
}));

vi.mock("../../utils/rhythmVexflowHelpers", () => ({
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

vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    soft: { type: "spring", stiffness: 360, damping: 28 },
    fade: { duration: 0.18, ease: "easeOut" },
  })),
}));

import SyllableMatchingQuestion from "../SyllableMatchingQuestion";

describe("SyllableMatchingQuestion", () => {
  const defaultProps = {
    question: { correct: "q", choices: ["q", "h", "w", "8"] },
    cardStates: ["default", "default", "default", "default"],
    isLandscape: false,
    onSelect: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    defaultProps.onSelect.mockClear();
  });

  it("renders SVG icon for the question.correct duration", () => {
    render(<SyllableMatchingQuestion {...defaultProps} />);
    expect(screen.getByTestId("svg-quarter-note")).toBeInTheDocument();
  });

  it("renders the prompt text", () => {
    render(<SyllableMatchingQuestion {...defaultProps} />);
    expect(screen.getByText("What syllable is this?")).toBeInTheDocument();
  });

  it("renders 4 DurationCard elements with type='text'", () => {
    render(<SyllableMatchingQuestion {...defaultProps} />);
    for (let i = 0; i < 4; i++) {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card).toBeInTheDocument();
      expect(card.getAttribute("data-type")).toBe("text");
    }
  });

  it("displays correct syllable text for each choice", () => {
    render(<SyllableMatchingQuestion {...defaultProps} />);
    // choices: q=ta, h=ta-a, w=ta-a-a-a, 8=ti
    expect(screen.getByText("ta")).toBeInTheDocument();
    expect(screen.getByText("ta-a")).toBeInTheDocument();
    expect(screen.getByText("ta-a-a-a")).toBeInTheDocument();
    expect(screen.getByText("ti")).toBeInTheDocument();
  });

  it("calls onSelect when a card is clicked", () => {
    render(<SyllableMatchingQuestion {...defaultProps} />);
    const card = screen.getByTestId("duration-card-1");
    fireEvent.click(card);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(1);
  });

  it("passes disabled prop through to DurationCard", () => {
    render(<SyllableMatchingQuestion {...defaultProps} disabled={true} />);
    for (let i = 0; i < 4; i++) {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card.getAttribute("data-disabled")).toBe("true");
    }
  });

  it("uses landscape grid class when isLandscape is true", () => {
    const { container } = render(
      <SyllableMatchingQuestion {...defaultProps} isLandscape={true} />
    );
    const grid = container.querySelector(".grid-cols-4");
    expect(grid).toBeTruthy();
  });

  it("uses portrait grid class when isLandscape is false", () => {
    const { container } = render(
      <SyllableMatchingQuestion {...defaultProps} isLandscape={false} />
    );
    const grid = container.querySelector(".grid-cols-2");
    expect(grid).toBeTruthy();
  });

  it("renders half-note SVG when question.correct is 'h'", () => {
    render(
      <SyllableMatchingQuestion
        {...defaultProps}
        question={{ correct: "h", choices: ["q", "h", "w", "8"] }}
      />
    );
    expect(screen.getByTestId("svg-half-note")).toBeInTheDocument();
  });

  it("passes card states to DurationCard", () => {
    const states = ["correct", "wrong", "dimmed", "default"];
    render(<SyllableMatchingQuestion {...defaultProps} cardStates={states} />);
    states.forEach((state, i) => {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card.getAttribute("data-state")).toBe(state);
    });
  });
});
