import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  SightReadingSessionProvider,
  useSightReadingSession,
} from "./SightReadingSessionContext";

function Probe() {
  const {
    combo,
    isOnFire,
    incrementCombo,
    resetCombo,
    startSession,
    resetSession,
    goToNextExercise,
  } = useSightReadingSession();

  return (
    <div>
      <span data-testid="combo">{combo}</span>
      <span data-testid="onfire">{String(isOnFire)}</span>
      <button onClick={incrementCombo}>increment</button>
      <button onClick={resetCombo}>reset-combo</button>
      <button onClick={startSession}>start-session</button>
      <button onClick={resetSession}>reset-session</button>
      <button onClick={goToNextExercise}>next-exercise</button>
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
