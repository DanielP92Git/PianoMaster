import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { StreakHero } from "./StreakHero";
import { useMotionTokens } from "../../../../../utils/useMotionTokens";
import { useAccessibility } from "../../../../../contexts/AccessibilityContext";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...rest }) => (
      <div
        className={className}
        role={rest.role}
        aria-label={rest["aria-label"]}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => {
      if (key === "games.engagement.combo") return "Combo";
      if (key === "games.engagement.onFire") return "ON FIRE!";
      if (key === "games.topBar.streakLabel") return "Streak";
      return key;
    },
  })),
}));

vi.mock("../../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

vi.mock("../../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

describe("StreakHero", () => {
  beforeEach(() => {
    vi.mocked(useMotionTokens).mockReturnValue({
      soft: { duration: 0 },
      reduce: false,
    });
    vi.mocked(useAccessibility).mockReturnValue({ reducedMotion: false });
  });

  it("preserves the combo status contract the game tests rely on", () => {
    render(<StreakHero value={5} />);
    const status = screen.getByRole("status", { name: "Combo" });
    expect(status).toHaveTextContent("5");
  });

  it("stays mounted at a dormant streak so the bar does not reflow", () => {
    render(<StreakHero value={0} />);
    // Present in the DOM, but without the lit gradient treatment.
    const status = screen.getByRole("status", { name: "Combo" });
    expect(status).toHaveTextContent("0");
    expect(status.className).not.toContain("from-orange-400");
    expect(status.className).not.toContain("animate-streakGlow");
  });

  it("lights up once the streak reaches the threshold", () => {
    render(<StreakHero value={2} />);
    const status = screen.getByRole("status", { name: "Combo" });
    expect(status.className).toContain("from-orange-400");
    expect(status.className).toContain("animate-streakGlow");
  });

  it("respects a custom lit threshold", () => {
    render(<StreakHero value={2} min={5} />);
    expect(
      screen.getByRole("status", { name: "Combo" }).className
    ).not.toContain("animate-streakGlow");
  });

  it("exposes the on-fire label when active", () => {
    render(<StreakHero value={5} active />);
    expect(screen.getByLabelText("ON FIRE!")).toBeInTheDocument();
  });

  it("suppresses animation when the OS reduced-motion preference is set", () => {
    vi.mocked(useMotionTokens).mockReturnValue({
      soft: { duration: 0 },
      reduce: true,
    });
    render(<StreakHero value={5} active />);
    const status = screen.getByRole("status", { name: "Combo" });
    expect(status.className).not.toContain("animate-streakGlow");
    expect(screen.getByLabelText("ON FIRE!").className).not.toContain(
      "animate-flameFlicker"
    );
  });

  it("suppresses animation when the in-app reduced-motion toggle is set", () => {
    // Independent of the OS preference — either source must win.
    vi.mocked(useAccessibility).mockReturnValue({ reducedMotion: true });
    render(<StreakHero value={5} active />);
    const status = screen.getByRole("status", { name: "Combo" });
    expect(status.className).not.toContain("animate-streakGlow");
    expect(screen.getByLabelText("ON FIRE!").className).not.toContain(
      "animate-flameFlicker"
    );
  });

  it("renders without an AccessibilityProvider and allows motion", () => {
    // useAccessibility() throws outside a provider. The bar is shared across
    // games and always mounted, so it must degrade instead of taking the
    // whole game screen down with it.
    vi.mocked(useAccessibility).mockImplementation(() => {
      throw new Error(
        "useAccessibility must be used within an AccessibilityProvider"
      );
    });
    expect(() => render(<StreakHero value={5} active />)).not.toThrow();
    expect(screen.getByRole("status", { name: "Combo" }).className).toContain(
      "animate-streakGlow"
    );
  });
});
