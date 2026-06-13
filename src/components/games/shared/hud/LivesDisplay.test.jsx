import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LivesDisplay } from "./LivesDisplay";

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

// useMotionTokens lives 4 levels up from hud/: ../../../../utils/useMotionTokens
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

// Heart mock passes className through so we can assert active vs spent styling
vi.mock("lucide-react", () => ({
  Heart: ({ className }) => <span data-testid="heart" className={className} />,
}));

describe("LivesDisplay", () => {
  it("renders totalLives hearts", () => {
    render(<LivesDisplay lives={2} totalLives={3} />);
    const hearts = screen.getAllByTestId("heart");
    expect(hearts).toHaveLength(3);
  });

  it("marks the correct number of hearts as active vs spent", () => {
    render(<LivesDisplay lives={1} totalLives={3} />);
    const hearts = screen.getAllByTestId("heart");
    const activeHearts = hearts.filter((h) =>
      h.className.includes("fill-red-400")
    );
    const spentHearts = hearts.filter((h) =>
      h.className.includes("text-white/30")
    );
    expect(activeHearts).toHaveLength(1);
    expect(spentHearts).toHaveLength(2);
  });

  it("exposes an aria-label with the remaining lives", () => {
    render(<LivesDisplay lives={2} totalLives={3} />);
    expect(screen.getByLabelText("2 lives remaining")).toBeInTheDocument();
  });
});
