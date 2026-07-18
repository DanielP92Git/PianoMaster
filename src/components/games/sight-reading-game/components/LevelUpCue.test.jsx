import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { LevelUpCue } from "./LevelUpCue";

// Return the key so assertions can target the rendered i18n keys directly
// without a live i18n instance (mirrors FeedbackSummary.test.jsx).
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => key,
  })),
}));

// Capture the `animate` prop passed to motion.div so reduced-motion branching
// can be asserted without a live framer-motion animation engine.
let lastAnimateProp;
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, animate, ...rest }) => {
      lastAnimateProp = animate;
      return (
        <div className={className} {...rest}>
          {children}
        </div>
      );
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const reduceMock = vi.fn(() => false);
// Hooks live 4 levels up from sight-reading-game/components/, same depth as hud/.
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ reduce: reduceMock() })),
}));

vi.mock("lucide-react", () => ({
  ArrowUp: () => <span data-testid="arrow-up" />,
  Check: () => <span data-testid="check" />,
}));

describe("LevelUpCue", () => {
  it("renders the localized levelUp text when show is true", () => {
    reduceMock.mockReturnValueOnce(false);
    render(<LevelUpCue show />);
    expect(
      screen.getByText("sightReading.adaptive.levelUp")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sightReading.adaptive.levelUpSubtitle")
    ).toBeInTheDocument();
  });

  it("renders nothing when show is false", () => {
    reduceMock.mockReturnValueOnce(false);
    render(<LevelUpCue show={false} />);
    expect(
      screen.queryByText("sightReading.adaptive.levelUp")
    ).not.toBeInTheDocument();
  });

  it("uses the opacity-only animate branch under reduced motion", () => {
    reduceMock.mockReturnValueOnce(true);
    render(<LevelUpCue show />);
    expect(lastAnimateProp).toEqual({ opacity: 1 });
    expect(Array.isArray(lastAnimateProp.scale)).toBe(false);
  });

  it("uses the scale-keyframe animate branch when motion is allowed", () => {
    reduceMock.mockReturnValueOnce(false);
    render(<LevelUpCue show />);
    expect(lastAnimateProp.opacity).toBe(1);
    expect(lastAnimateProp.scale).toEqual([1, 1.15, 1]);
  });

  it("fires onDismiss when the dismiss button is clicked", () => {
    reduceMock.mockReturnValueOnce(false);
    const onDismiss = vi.fn();
    render(<LevelUpCue show onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText("sightReading.adaptive.levelUpDismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
