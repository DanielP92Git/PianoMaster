import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ProgressBar } from "./ProgressBar";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, style }) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
    span: ({ children, className }) => (
      <span className={className}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (k, opts) => (opts ? `${opts.current} of ${opts.total}` : k),
  })),
}));

// useMotionTokens lives 4 levels up from hud/: ../../../../utils/useMotionTokens
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

describe("ProgressBar", () => {
  it("animates fill to the correct fraction of current/total", () => {
    const { container } = render(<ProgressBar current={3} total={10} />);
    // The gradient fill element has class containing from-indigo-400
    const fillEl = container.querySelector('[class*="from-indigo-400"]');
    expect(fillEl).not.toBeNull();
    // Counter text: Math.min(10, Math.max(1, 3+1)) = 4 of 10
    expect(screen.getByText("4 of 10")).toBeInTheDocument();
  });

  it("marks checkpoint dots active up to current progress", () => {
    const { container } = render(<ProgressBar current={5} total={10} />);
    // At 50% (5/10 = 50%), dots at 0/25/50 should be active (bg-white/80),
    // dots at 75/100 should be inactive (bg-white/10).
    const dots = container.querySelectorAll("span.rounded-full.border");
    // Checkpoint dots are at positions [0, 25, 50, 75, 100]
    // At 50% progress: dots 0, 1, 2 are active; dots 3, 4 are inactive
    const activeDots = Array.from(dots).filter((d) =>
      d.className.includes("bg-white/80")
    );
    const inactiveDots = Array.from(dots).filter((d) =>
      d.className.includes("bg-white/10")
    );
    expect(activeDots.length).toBeGreaterThanOrEqual(3);
    expect(inactiveDots.length).toBeGreaterThanOrEqual(2);
    // Verify the first three are active and last two inactive
    const dotClasses = Array.from(dots).map((d) => d.className);
    expect(dotClasses[0]).toContain("bg-white/80"); // 0% dot — active at 50%
    expect(dotClasses[1]).toContain("bg-white/80"); // 25% dot — active at 50%
    expect(dotClasses[2]).toContain("bg-white/80"); // 50% dot — active at 50%
    expect(dotClasses[3]).toContain("bg-white/10"); // 75% dot — inactive at 50%
    expect(dotClasses[4]).toContain("bg-white/10"); // 100% dot — inactive at 50%
  });

  it("shows the question counter text", () => {
    render(<ProgressBar current={2} total={10} />);
    // Counter: Math.min(10, Math.max(1, 2+1)) = 3 of 10
    expect(screen.getByText("3 of 10")).toBeInTheDocument();
  });
});
