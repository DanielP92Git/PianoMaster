import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../i18n";
import { AgeGate } from "./AgeGate";

/**
 * Computes DOB parts for someone who is exactly `years` old today
 * (birthday already occurred this year), so isUnder18's month/day
 * comparison is deterministic regardless of when the test runs.
 */
function dobPartsForAge(years) {
  const today = new Date();
  return {
    month: today.getMonth() + 1, // Date months are 0-indexed; DOB parts are 1-12
    day: today.getDate(),
    year: today.getFullYear() - years,
  };
}

describe("AgeGate", () => {
  it("renders three labelled date-of-birth fields", () => {
    render(<AgeGate onSubmit={vi.fn()} onUnder18={vi.fn()} />);
    expect(screen.getByLabelText("Month").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Day").tagName).toBe("INPUT");
    expect(screen.getByLabelText("Year").tagName).toBe("INPUT");
  });

  it("submits an 18+ DOB via onSubmit and never calls onUnder18", () => {
    const onSubmit = vi.fn();
    const onUnder18 = vi.fn();
    const adultDob = dobPartsForAge(30);

    render(<AgeGate onSubmit={onSubmit} onUnder18={onUnder18} />);
    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: String(adultDob.month) },
    });
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: String(adultDob.day) },
    });
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: String(adultDob.year) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(adultDob);
    expect(onUnder18).not.toHaveBeenCalled();
  });

  it("routes an under-18 DOB to onUnder18 and never calls onSubmit", () => {
    const onSubmit = vi.fn();
    const onUnder18 = vi.fn();
    const minorDob = dobPartsForAge(17);

    render(<AgeGate onSubmit={onSubmit} onUnder18={onUnder18} />);
    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: String(minorDob.month) },
    });
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: String(minorDob.day) },
    });
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: String(minorDob.year) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(onUnder18).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the error banner for an invalid DOB and calls neither callback", () => {
    const onSubmit = vi.fn();
    const onUnder18 = vi.fn();

    render(<AgeGate onSubmit={onSubmit} onUnder18={onUnder18} />);
    // All three fields are filled (satisfies native `required`) but the
    // resulting date is more than 120 years ago, so isValidDOB rejects it.
    fireEvent.change(screen.getByLabelText("Month"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Day"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: "1800" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByText("Please select a valid birth year")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onUnder18).not.toHaveBeenCalled();
  });
});
