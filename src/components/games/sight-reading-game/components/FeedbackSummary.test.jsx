import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FeedbackSummary } from "./FeedbackSummary";

// Return the key (plus interpolation values) so assertions can target the
// rendered i18n keys / numeric values without a live i18n instance.
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, opts) => {
      if (!opts) return key;
      if (opts.defaultValue && Object.keys(opts).length === 1) {
        return opts.defaultValue;
      }
      const params = Object.entries(opts)
        .filter(([k]) => k !== "defaultValue")
        .map(([k, v]) => `${k}=${v}`)
        .join(",");
      return params ? `${key}(${params})` : key;
    },
  })),
}));

// Two correct, one rushed, one dragged, one missed, one wrong pitch.
const performanceResults = [
  {
    noteIndex: 0,
    isCorrect: true,
    timingStatus: "perfect",
    timing: { score: 1 },
  },
  {
    noteIndex: 1,
    isCorrect: true,
    timingStatus: "good",
    timing: { score: 0.8 },
  },
  {
    noteIndex: 2,
    isCorrect: true,
    timingStatus: "early",
    timing: { score: 0.3 },
  },
  {
    noteIndex: 3,
    isCorrect: true,
    timingStatus: "late",
    timing: { score: 0.3 },
  },
  { noteIndex: 4, isCorrect: false, timingStatus: "missed" },
  { noteIndex: 5, isCorrect: false, timingStatus: "wrong_pitch" },
];

const summaryStats = {
  pitchAccuracy: 83,
  rhythmAccuracy: 70,
  overallScore: 80,
};

describe("FeedbackSummary (Phase C feedback wiring)", () => {
  it("renders pitch and rhythm accuracy bars with rounded percentages", () => {
    render(
      <FeedbackSummary
        performanceResults={performanceResults}
        summaryStats={summaryStats}
        onTryAgain={() => {}}
        onNextPattern={() => {}}
      />
    );
    expect(screen.getByText("sightReading.summary.pitch")).toBeInTheDocument();
    expect(screen.getByText("sightReading.summary.rhythm")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("renders a breakdown chip only for statuses that occurred", () => {
    render(
      <FeedbackSummary
        performanceResults={performanceResults}
        summaryStats={summaryStats}
        onTryAgain={() => {}}
        onNextPattern={() => {}}
      />
    );
    // correct=2, tooEarly=1, tooLate=1, missed=1, wrongNotes=1
    expect(
      screen.getByText("sightReading.summary.correct")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sightReading.summary.tooEarly")
    ).toBeInTheDocument();
    expect(
      screen.getByText("sightReading.summary.tooLate")
    ).toBeInTheDocument();
    expect(screen.getByText("sightReading.summary.missed")).toBeInTheDocument();
    expect(
      screen.getByText("sightReading.summary.wrongNotes")
    ).toBeInTheDocument();
    // The "correct" chip shows a count of 2.
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
