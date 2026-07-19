import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TopBarProgress } from "./TopBarProgress";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, style }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, opts) => {
      if (key === "games.topBar.questionProgress")
        return `Question ${opts.current} of ${opts.total}`;
      if (key === "games.topBar.progressCompact")
        return `${opts.current}/${opts.total}`;
      if (key === "games.topBar.percentComplete") return `${opts.value}%`;
      if (key === "games.topBar.progressAria") return `${opts.value}% complete`;
      return key;
    },
  })),
}));

// useMotionTokens lives 5 levels up from hud/topbar/
vi.mock("../../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

describe("TopBarProgress", () => {
  it("renders the counter without a redundant percent readout", () => {
    // "Question 5 of 10" and "40%" say the same thing twice. The percentage
    // is still exposed to assistive tech via the progressbar below.
    render(<TopBarProgress current={4} total={10} />);
    expect(screen.getByText("Question 5 of 10")).toBeInTheDocument();
    expect(screen.queryByText("40%")).not.toBeInTheDocument();
  });

  it("exposes progressbar semantics with the current percentage", () => {
    render(<TopBarProgress current={4} total={10} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("renders 0% rather than NaN when total is 0", () => {
    const { container } = render(<TopBarProgress current={0} total={0} />);
    expect(container.textContent).not.toContain("NaN");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
  });

  it("renders 0% rather than NaN when total is undefined", () => {
    const { container } = render(<TopBarProgress current={3} />);
    expect(container.textContent).not.toContain("NaN");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0"
    );
  });

  it("clamps to 100% when current exceeds total", () => {
    render(<TopBarProgress current={99} total={10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
    // The counter is clamped to the total too, never "Question 100 of 10".
    expect(screen.getByText("Question 10 of 10")).toBeInTheDocument();
  });

  it("uses the compact counter format when compact", () => {
    render(<TopBarProgress current={4} total={10} compact />);
    expect(screen.getByText("5/10")).toBeInTheDocument();
    expect(screen.queryByText("Question 5 of 10")).not.toBeInTheDocument();
  });

  it("prefers an explicit label over the generated counter", () => {
    render(<TopBarProgress current={4} total={10} label="Drill 2" />);
    expect(screen.getByText("Drill 2")).toBeInTheDocument();
    expect(screen.queryByText("Question 5 of 10")).not.toBeInTheDocument();
  });
});
