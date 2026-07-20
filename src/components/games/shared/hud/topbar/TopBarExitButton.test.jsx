import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TopBarExitButton } from "./TopBarExitButton";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateSpy,
}));

describe("TopBarExitButton", () => {
  beforeEach(() => {
    navigateSpy.mockClear();
  });

  it("navigates to the supplied route", () => {
    render(<TopBarExitButton to="/trail?path=treble" label="Back to Trail" />);
    fireEvent.click(screen.getByRole("button", { name: "Back to Trail" }));
    expect(navigateSpy).toHaveBeenCalledWith("/trail?path=treble", {
      replace: false,
    });
  });

  it("falls back to history-back when no route is given", () => {
    render(<TopBarExitButton label="Back" />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(navigateSpy).toHaveBeenCalledWith(-1);
  });

  it("prefers an explicit onClick over navigation", () => {
    const onClick = vi.fn();
    render(<TopBarExitButton to="/trail" label="Back" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onClick).toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
