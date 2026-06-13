import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ComboPill } from "./ComboPill";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, animate, transition }) => (
      <div className={className}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

// useMotionTokens lives 4 levels up from hud/: ../../../../utils/useMotionTokens
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

// Mock lucide-react with distinguishable test ids for Zap vs Flame
vi.mock("lucide-react", () => ({
  Zap: () => <span data-testid="zap" />,
  Flame: () => <span data-testid="flame" />,
  Heart: () => <span data-testid="heart" />,
}));

describe("ComboPill", () => {
  it("renders the combo count", () => {
    render(<ComboPill combo={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("applies tier tint classes", () => {
    // Tier 0 (combo 1): neutral glass
    const { container: c0, unmount: u0 } = render(<ComboPill combo={1} />);
    const pill0 = c0.querySelector(".rounded-full.border");
    expect(pill0.className).toContain("border-white/20");
    u0();

    // Tier 1 (combo 4, >= 3): amber tint
    const { container: c1, unmount: u1 } = render(<ComboPill combo={4} />);
    const pill1 = c1.querySelector(".rounded-full.border");
    expect(pill1.className).toContain("border-amber-400/30");
    u1();

    // Tier 2 (combo 9, >= 8): yellow tint
    const { container: c2 } = render(<ComboPill combo={9} />);
    const pill2 = c2.querySelector(".rounded-full.border");
    expect(pill2.className).toContain("border-yellow-400/40");
  });

  it("shows the Flame icon instead of Zap when isOnFire", () => {
    render(<ComboPill combo={6} isOnFire />);
    expect(screen.getByTestId("flame")).toBeInTheDocument();
    expect(screen.queryByTestId("zap")).not.toBeInTheDocument();
  });
});
