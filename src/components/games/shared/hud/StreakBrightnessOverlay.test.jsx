import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StreakBrightnessOverlay } from "./StreakBrightnessOverlay";

// Hooks live 4 levels up from hud/
const reduceMock = vi.fn(() => false);
const reducedMotionMock = vi.fn(() => false);

vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ reduce: reduceMock() })),
}));

vi.mock("../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: reducedMotionMock() })),
}));

describe("StreakBrightnessOverlay", () => {
  it("is fully transparent (dark) at combo 0", () => {
    render(<StreakBrightnessOverlay combo={0} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(el.style.opacity).toBe("0");
  });

  it("brightens as combo increases", () => {
    const { rerender } = render(<StreakBrightnessOverlay combo={1} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    const o1 = parseFloat(el.style.opacity);
    rerender(<StreakBrightnessOverlay combo={4} />);
    const o4 = parseFloat(el.style.opacity);
    expect(o4).toBeGreaterThan(o1);
  });

  it("caps opacity at maxOpacity for contrast (does not wash out)", () => {
    render(<StreakBrightnessOverlay combo={999} maxOpacity={0.2} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0.2, 5);
  });

  it("snaps back to transparent when the streak resets to 0", () => {
    const { rerender } = render(<StreakBrightnessOverlay combo={6} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(parseFloat(el.style.opacity)).toBeGreaterThan(0);
    rerender(<StreakBrightnessOverlay combo={0} />);
    expect(el.style.opacity).toBe("0");
  });

  it("never intercepts pointer events", () => {
    render(<StreakBrightnessOverlay combo={3} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(el.className).toContain("pointer-events-none");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("animates the fade when motion is allowed", () => {
    reduceMock.mockReturnValueOnce(false);
    reducedMotionMock.mockReturnValueOnce(false);
    render(<StreakBrightnessOverlay combo={3} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(el.style.transition).toContain("opacity");
  });

  it("suppresses the fade (instant) under reduced motion", () => {
    reduceMock.mockReturnValueOnce(true);
    render(<StreakBrightnessOverlay combo={3} />);
    const el = screen.getByTestId("streak-brightness-overlay");
    expect(el.style.transition).toBe("none");
  });
});
