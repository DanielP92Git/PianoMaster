import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../i18n";
import { AgeGate } from "./AgeGate";

describe("AgeGate", () => {
  // Guards the regression where the year select's only accessible name was a
  // hard-coded English `aria-label="Birth year"`, invisible to i18n.
  it("exposes the year select via its translated label", () => {
    render(<AgeGate onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Birth year").tagName).toBe("SELECT");
  });

  it("submits the selected year as an integer", () => {
    const onSubmit = vi.fn();
    render(<AgeGate onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Birth year"), {
      target: { value: "2016" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onSubmit).toHaveBeenCalledWith(2016);
  });
});
