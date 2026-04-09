import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

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
      return durMap[key] || key;
    },
    i18n: { language: "en" },
  })),
}));

// Mock DurationCard as a simple div rendering key props
vi.mock("../../components/DurationCard", () => ({
  default: ({ type, durationCode, state, onSelect, disabled, cardIndex, ariaLabel }) => (
    <div
      data-testid={`duration-card-${cardIndex}`}
      data-type={type}
      data-duration-code={durationCode}
      data-state={state}
      data-disabled={String(disabled)}
      role="button"
      aria-label={ariaLabel}
      onClick={() => onSelect?.(cardIndex)}
    >
      {durationCode}
    </div>
  ),
}));

vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    soft: { type: "spring", stiffness: 360, damping: 28 },
    fade: { duration: 0.18, ease: "easeOut" },
  })),
}));

import VisualRecognitionQuestion from "../VisualRecognitionQuestion";

describe("VisualRecognitionQuestion", () => {
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

  it("renders prompt text containing the correct duration name", () => {
    render(<VisualRecognitionQuestion {...defaultProps} />);
    expect(
      screen.getByText("Which one is a quarter note?")
    ).toBeInTheDocument();
  });

  it("renders 4 DurationCard elements with type='icon'", () => {
    render(<VisualRecognitionQuestion {...defaultProps} />);
    for (let i = 0; i < 4; i++) {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card).toBeInTheDocument();
      expect(card.getAttribute("data-type")).toBe("icon");
    }
  });

  it("calls onSelect when a card is clicked", () => {
    render(<VisualRecognitionQuestion {...defaultProps} />);
    const card = screen.getByTestId("duration-card-2");
    fireEvent.click(card);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(2);
  });

  it("passes disabled prop through to DurationCard", () => {
    render(<VisualRecognitionQuestion {...defaultProps} disabled={true} />);
    for (let i = 0; i < 4; i++) {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card.getAttribute("data-disabled")).toBe("true");
    }
  });

  it("passes correct duration codes to each card", () => {
    render(<VisualRecognitionQuestion {...defaultProps} />);
    const codes = ["q", "h", "w", "8"];
    codes.forEach((code, i) => {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card.getAttribute("data-duration-code")).toBe(code);
    });
  });

  it("uses landscape grid class when isLandscape is true", () => {
    const { container } = render(
      <VisualRecognitionQuestion {...defaultProps} isLandscape={true} />
    );
    const grid = container.querySelector(".grid-cols-4");
    expect(grid).toBeTruthy();
  });

  it("uses portrait grid class when isLandscape is false", () => {
    const { container } = render(
      <VisualRecognitionQuestion {...defaultProps} isLandscape={false} />
    );
    const grid = container.querySelector(".grid-cols-2");
    expect(grid).toBeTruthy();
  });

  it("passes card states to DurationCard", () => {
    const states = ["correct", "wrong", "dimmed", "default"];
    render(
      <VisualRecognitionQuestion {...defaultProps} cardStates={states} />
    );
    states.forEach((state, i) => {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card.getAttribute("data-state")).toBe(state);
    });
  });
});
