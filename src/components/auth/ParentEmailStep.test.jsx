import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParentEmailStep } from "./ParentEmailStep";

describe("ParentEmailStep", () => {
  // One real test — confirms file runs and component renders an email input
  it("renders an email input", () => {
    render(
      <ParentEmailStep
        onSubmit={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText("parent@example.com")).toBeInTheDocument();
  });

  // Current behavior stubs (before Plan 02 updates)
  it.todo("calls onSubmit with email string when form submitted");
  it.todo("shows validation error for invalid email");

  // Post Plan-02 behavior stubs (D-07 — Skip button)
  it.todo("Skip button calls onSkip with no arguments");
  it.todo("displays optional messaging about weekly reports");
  it.todo("single email field — no confirm email field");
});
