import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, opts) => {
      if (key === "countSubdivision.prompt" && opts?.durationName)
        return `How many eighth notes make a ${opts.durationName}?`;
      const durMap = {
        "rhythm.duration.dottedQuarter": "Dotted Quarter Note",
        "rhythm.duration.quarter": "Quarter Note",
      };
      return durMap[key] || key;
    },
    i18n: { language: "en" },
  })),
}));

// Mock DurationCard — exposes the text-mode props and SVG_COMPONENTS map
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
    qd: (props) => <svg data-testid="target-icon" {...props} />,
  },
}));

import CountSubdivisionQuestion from "../CountSubdivisionQuestion";

describe("CountSubdivisionQuestion", () => {
  const defaultProps = {
    question: {
      correct: 3,
      choices: [3, 2, 4, 6],
      target: "qd",
      subdivision: "8",
    },
    cardStates: ["default", "default", "default", "default"],
    isLandscape: false,
    onSelect: vi.fn(),
    disabled: false,
  };

  beforeEach(() => {
    defaultProps.onSelect.mockClear();
  });

  it("renders the prompt with the target duration name", () => {
    render(<CountSubdivisionQuestion {...defaultProps} />);
    expect(
      screen.getByText("How many eighth notes make a Dotted Quarter Note?")
    ).toBeInTheDocument();
  });

  it("renders the target note's SVG icon", () => {
    render(<CountSubdivisionQuestion {...defaultProps} />);
    expect(screen.getByTestId("target-icon")).toBeInTheDocument();
  });

  it("renders 4 numeric DurationCard elements with type='text'", () => {
    render(<CountSubdivisionQuestion {...defaultProps} />);
    const expected = ["3", "2", "4", "6"];
    expected.forEach((value, i) => {
      const card = screen.getByTestId(`duration-card-${i}`);
      expect(card).toBeInTheDocument();
      expect(card.getAttribute("data-type")).toBe("text");
      expect(card.getAttribute("data-text")).toBe(value);
    });
  });

  it("calls onSelect with the card index when a card is clicked", () => {
    render(<CountSubdivisionQuestion {...defaultProps} />);
    fireEvent.click(screen.getByTestId("duration-card-1"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(1);
  });

  it("passes disabled prop through to DurationCard", () => {
    render(<CountSubdivisionQuestion {...defaultProps} disabled={true} />);
    for (let i = 0; i < 4; i++) {
      expect(
        screen.getByTestId(`duration-card-${i}`).getAttribute("data-disabled")
      ).toBe("true");
    }
  });

  it("passes card states to DurationCard", () => {
    const states = ["correct", "wrong", "dimmed", "default"];
    render(<CountSubdivisionQuestion {...defaultProps} cardStates={states} />);
    states.forEach((state, i) => {
      expect(
        screen.getByTestId(`duration-card-${i}`).getAttribute("data-state")
      ).toBe(state);
    });
  });
});
