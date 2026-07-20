import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { GameTopBar } from "./GameTopBar";

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
    t: (key, opts) => {
      if (key === "games.topBar.landmark") return "Game controls";
      if (key === "games.engagement.combo") return "Combo";
      if (key === "games.engagement.onFire") return "ON FIRE!";
      if (key === "games.topBar.streakLabel") return "Streak";
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

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({ soft: { duration: 0 }, reduce: false })),
}));

vi.mock("../../../../../contexts/AccessibilityContext", () => ({
  useAccessibility: vi.fn(() => ({ reducedMotion: false })),
}));

const TOOLS = [
  {
    id: "settings",
    priority: "primary",
    icon: <svg />,
    onClick: vi.fn(),
    title: "Change Settings",
  },
  {
    id: "metronome",
    icon: <svg />,
    onClick: vi.fn(),
    title: "Toggle metronome",
    active: true,
  },
];

describe("GameTopBar", () => {
  it("renders a labelled header landmark", () => {
    render(<GameTopBar progress={{ current: 0, total: 10 }} />);
    expect(
      screen.getByRole("banner", { name: "Game controls" })
    ).toBeInTheDocument();
  });

  it("omits every zone that was not supplied", () => {
    // This is the incremental-adoption guarantee: a game with only progress
    // and exit must not get an empty mode switch, stat chips, or streak hero.
    render(
      <GameTopBar
        progress={{ current: 2, total: 10 }}
        exit={{ to: "/trail", label: "Back to Trail" }}
      />
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Back to Trail" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    // The only button is the exit button — no tool cluster was rendered.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders each tool with its title as the accessible name", () => {
    render(<GameTopBar tools={TOOLS} />);
    expect(
      screen.getByRole("button", { name: "Change Settings" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle metronome" })
    ).toBeInTheDocument();
  });

  it("styles an active tool as pressed with the gradient treatment", () => {
    render(<GameTopBar tools={TOOLS} />);
    const metronome = screen.getByRole("button", { name: "Toggle metronome" });
    expect(metronome).toHaveAttribute("aria-pressed", "true");
    expect(metronome.className).toContain("from-blue-600");
  });

  it("does not invoke a disabled tool", () => {
    const onClick = vi.fn();
    render(
      <GameTopBar
        tools={[
          { id: "x", icon: <svg />, onClick, title: "Locked", disabled: true },
        ]}
      />
    );
    const button = screen.getByRole("button", { name: "Locked" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders stat chips with their labels and values", () => {
    render(
      <GameTopBar
        stats={[
          { id: "bpm", label: "BPM", value: 80, tone: "purple" },
          { id: "score", label: "Score", value: 120, tone: "gold" },
        ]}
      />
    );
    expect(screen.getByText("BPM")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("renders escape-hatch slots", () => {
    render(
      <GameTopBar
        leadingSlot={<span>lead</span>}
        statsSlot={<span>stats</span>}
        trailingSlot={<span>trail</span>}
      />
    );
    expect(screen.getByText("lead")).toBeInTheDocument();
    expect(screen.getByText("stats")).toBeInTheDocument();
    expect(screen.getByText("trail")).toBeInTheDocument();
  });

  it("uses only direction-agnostic layout utilities", () => {
    // The bar must mirror correctly in Hebrew (RTL). Physical-direction
    // utilities are the most likely regression, so guard against them wholesale.
    const { container } = render(
      <GameTopBar
        tools={TOOLS}
        modeSwitch={{
          value: "test",
          options: [
            { value: "practice", label: "Practice" },
            { value: "test", label: "Test" },
          ],
          onChange: vi.fn(),
          label: "Grading mode",
        }}
        stats={[{ id: "score", label: "Score", value: 10, tone: "gold" }]}
        streak={{ value: 3, active: true }}
        progress={{ current: 2, total: 10 }}
        exit={{ to: "/trail", label: "Back to Trail" }}
      />
    );
    const physicalDirectionUtility =
      /(?:^|["\s])(?:ml-|mr-|pl-|pr-|left-|right-|text-left|text-right)/;
    expect(container.innerHTML).not.toMatch(physicalDirectionUtility);
  });
});
