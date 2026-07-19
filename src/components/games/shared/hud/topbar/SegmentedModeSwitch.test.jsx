import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { SegmentedModeSwitch } from "./SegmentedModeSwitch";

const OPTIONS = [
  { value: "practice", label: "Practice" },
  { value: "test", label: "Test" },
];

describe("SegmentedModeSwitch", () => {
  it("exposes radiogroup semantics with the active segment checked", () => {
    render(
      <SegmentedModeSwitch
        value="test"
        options={OPTIONS}
        onChange={vi.fn()}
        label="Grading mode"
      />
    );
    expect(
      screen.getByRole("radiogroup", { name: "Grading mode" })
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Test" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "Practice" })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("calls onChange with the newly selected value", () => {
    const onChange = vi.fn();
    render(
      <SegmentedModeSwitch
        value="test"
        options={OPTIONS}
        onChange={onChange}
        label="Grading mode"
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "Practice" }));
    expect(onChange).toHaveBeenCalledWith("practice");
  });

  it("does not fire onChange when the active segment is re-selected", () => {
    const onChange = vi.fn();
    render(
      <SegmentedModeSwitch
        value="test"
        options={OPTIONS}
        onChange={onChange}
        label="Grading mode"
      />
    );
    fireEvent.click(screen.getByRole("radio", { name: "Test" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks selection and marks the group disabled when locked", () => {
    const onChange = vi.fn();
    render(
      <SegmentedModeSwitch
        value="test"
        options={OPTIONS}
        onChange={onChange}
        label="Grading mode"
        disabled
      />
    );
    expect(
      screen.getByRole("radiogroup", { name: "Grading mode" })
    ).toHaveAttribute("aria-disabled", "true");
    const practice = screen.getByRole("radio", { name: "Practice" });
    expect(practice).toBeDisabled();
    fireEvent.click(practice);
    expect(onChange).not.toHaveBeenCalled();
  });
});
