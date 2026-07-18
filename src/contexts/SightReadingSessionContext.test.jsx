import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  SightReadingSessionProvider,
  useSightReadingSession,
} from "./SightReadingSessionContext";
import { GRADING_MODES } from "../components/games/sight-reading-game/constants/gradingModes";

function Probe() {
  const {
    combo,
    isOnFire,
    incrementCombo,
    resetCombo,
    startSession,
    resetSession,
    goToNextExercise,
    gradingMode,
    isModeLocked,
    lockMode,
    setGradingMode,
  } = useSightReadingSession();

  return (
    <div>
      <span data-testid="combo">{combo}</span>
      <span data-testid="onfire">{String(isOnFire)}</span>
      <span data-testid="mode">{gradingMode}</span>
      <span data-testid="locked">{String(isModeLocked)}</span>
      <button onClick={incrementCombo}>increment</button>
      <button onClick={resetCombo}>reset-combo</button>
      <button onClick={startSession}>start-session</button>
      <button onClick={resetSession}>reset-session</button>
      <button onClick={goToNextExercise}>next-exercise</button>
      <button onClick={lockMode}>lock-mode</button>
      <button onClick={() => setGradingMode(GRADING_MODES.PRACTICE)}>
        set-practice
      </button>
    </div>
  );
}

function renderProbe() {
  render(
    <SightReadingSessionProvider>
      <Probe />
    </SightReadingSessionProvider>
  );
}

function clickIncrement(times) {
  const button = screen.getByText("increment");
  for (let i = 0; i < times; i += 1) {
    fireEvent.click(button);
  }
}

describe("SightReadingSessionContext combo lifecycle", () => {
  it("combo starts at 0 and isOnFire false", () => {
    renderProbe();
    expect(screen.getByTestId("combo").textContent).toBe("0");
    expect(screen.getByTestId("onfire").textContent).toBe("false");
  });

  it("incrementCombo raises combo by one", () => {
    renderProbe();
    clickIncrement(3);
    expect(screen.getByTestId("combo").textContent).toBe("3");
  });

  it("on-fire activates at threshold 5", () => {
    renderProbe();
    clickIncrement(4);
    expect(screen.getByTestId("onfire").textContent).toBe("false");
    clickIncrement(1);
    expect(screen.getByTestId("onfire").textContent).toBe("true");
  });

  it("resetCombo returns combo to 0 and clears on-fire", () => {
    renderProbe();
    clickIncrement(5);
    fireEvent.click(screen.getByText("reset-combo"));
    expect(screen.getByTestId("combo").textContent).toBe("0");
    expect(screen.getByTestId("onfire").textContent).toBe("false");
  });

  it("combo reset on session boundary", () => {
    renderProbe();
    clickIncrement(2);
    fireEvent.click(screen.getByText("start-session"));
    expect(screen.getByTestId("combo").textContent).toBe("0");

    clickIncrement(2);
    fireEvent.click(screen.getByText("reset-session"));
    expect(screen.getByTestId("combo").textContent).toBe("0");
  });

  it("combo persists across goToNextExercise (session-wide)", () => {
    renderProbe();
    clickIncrement(2);
    fireEvent.click(screen.getByText("next-exercise"));
    expect(screen.getByTestId("combo").textContent).toBe("2");
  });
});

describe("SightReadingSessionContext grading-mode lock lifecycle", () => {
  it("resetSession clears the mode lock (the leak that greyed the pill on re-entry)", () => {
    // Reproduces the on-device bug: lockMode fires at count-in, and because the provider lives at
    // the app root, the lock survived every route exit. resetSession runs in the game's unmount
    // cleanup, so clearing the lock here is what makes the pill toggleable again on re-entry.
    renderProbe();
    fireEvent.click(screen.getByText("lock-mode"));
    expect(screen.getByTestId("locked").textContent).toBe("true");
    fireEvent.click(screen.getByText("reset-session"));
    expect(screen.getByTestId("locked").textContent).toBe("false");
  });

  it("startSession clears the mode lock", () => {
    renderProbe();
    fireEvent.click(screen.getByText("lock-mode"));
    fireEvent.click(screen.getByText("start-session"));
    expect(screen.getByTestId("locked").textContent).toBe("false");
  });

  it("goToNextExercise keeps the lock (D-05: mode stays locked mid-session)", () => {
    renderProbe();
    fireEvent.click(screen.getByText("lock-mode"));
    fireEvent.click(screen.getByText("next-exercise"));
    expect(screen.getByTestId("locked").textContent).toBe("true");
  });

  it("setGradingMode is dropped while locked and honored after a session reset", () => {
    renderProbe();
    // Default is TEST.
    expect(screen.getByTestId("mode").textContent).toBe(GRADING_MODES.TEST);
    fireEvent.click(screen.getByText("lock-mode"));
    fireEvent.click(screen.getByText("set-practice"));
    // Guarded: locked switch is a no-op.
    expect(screen.getByTestId("mode").textContent).toBe(GRADING_MODES.TEST);
    fireEvent.click(screen.getByText("reset-session"));
    fireEvent.click(screen.getByText("set-practice"));
    expect(screen.getByTestId("mode").textContent).toBe(GRADING_MODES.PRACTICE);
  });
});
