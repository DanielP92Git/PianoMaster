import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ScorePill } from "./ScorePill";

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

describe("ScorePill", () => {
  it("renders value and default XP label", () => {
    render(<ScorePill value={120} />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("XP")).toBeInTheDocument();
  });

  it("renders a custom label", () => {
    render(<ScorePill value={7} label="Score" />);
    expect(screen.getByText("Score")).toBeInTheDocument();
  });

  it("applies tint classes per comboTint tier", () => {
    // Tier 0: default glass
    const { container: c0, unmount: u0 } = render(
      <ScorePill value={5} comboTint={0} />
    );
    const pill0 = c0.querySelector(".rounded-full.border");
    expect(pill0.className).toContain("border-white/20");
    expect(pill0.className).toContain("bg-white/10");
    u0();

    // Tier 1: amber tint
    const { container: c1, unmount: u1 } = render(
      <ScorePill value={5} comboTint={1} />
    );
    const pill1 = c1.querySelector(".rounded-full.border");
    expect(pill1.className).toContain("border-amber-400/30");
    expect(pill1.className).toContain("bg-amber-500/15");
    u1();

    // Tier 2: yellow tint
    const { container: c2 } = render(<ScorePill value={5} comboTint={2} />);
    const pill2 = c2.querySelector(".rounded-full.border");
    expect(pill2.className).toContain("border-yellow-400/40");
    expect(pill2.className).toContain("bg-yellow-500/20");
  });

  it("shows the floating +score only when floatingScore is set", () => {
    // No float when floatingScore is null
    const { rerender } = render(<ScorePill value={5} floatingScore={null} />);
    const plusNodes = screen
      .queryAllByText(/^\+\d+$/)
      .filter((el) => el.textContent.startsWith("+"));
    expect(plusNodes).toHaveLength(0);

    // Shows +3 when floatingScore is 3
    rerender(<ScorePill value={5} floatingScore={3} floatingScoreKey={1} />);
    expect(screen.getByText("+3")).toBeInTheDocument();
  });
});
