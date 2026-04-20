/**
 * QuickStatsGrid Tests
 *
 * Requirements: D-08, REQ-04
 *
 * Verified behaviors:
 *   - Renders 4 stat cards with correct i18n label keys
 *   - Shows loading skeletons (animate-pulse) when isLoading=true
 *   - Shows em dash (—) for null/undefined values
 *   - Calculates totalStars (sum of p.stars) correctly from progressData
 *   - Calculates nodesCompleted (count where stars > 0) correctly
 *   - Formats nodes as "N/TOTAL" using SKILL_NODES.length
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QuickStatsGrid from "./QuickStatsGrid";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => "ltr" },
  }),
}));

// Minimal realistic data shapes matching the implementation contracts
const sampleXpData = {
  levelData: { level: 7 },
  totalXP: 2100,
};

const sampleProgressData = [
  { node_id: "treble_1_1", stars: 3 },
  { node_id: "treble_1_2", stars: 1 },
  { node_id: "treble_1_3", stars: 0 }, // not completed
  { node_id: "bass_1_1", stars: 2 },
];

const sampleStreakState = {
  streakCount: 14,
  weekendPassEnabled: false,
};

describe("QuickStatsGrid", () => {
  it("D-08/REQ-04: renders 4 stat label keys", () => {
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("parentPortal.statLevel")).toBeInTheDocument();
    expect(screen.getByText("parentPortal.statStars")).toBeInTheDocument();
    expect(screen.getByText("parentPortal.statNodes")).toBeInTheDocument();
    expect(screen.getByText("parentPortal.statStreak")).toBeInTheDocument();
  });

  it("D-08: shows loading skeletons when isLoading=true (no stat labels visible)", () => {
    const { container } = render(
      <QuickStatsGrid
        xpData={undefined}
        progressData={undefined}
        streakState={undefined}
        isLoading={true}
      />
    );
    // 4 skeleton divs with animate-pulse
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(4);
    // Label text should NOT appear when loading
    expect(
      screen.queryByText("parentPortal.statLevel")
    ).not.toBeInTheDocument();
  });

  it("D-08: shows em dash when xpData is undefined (null level)", () => {
    render(
      <QuickStatsGrid
        xpData={undefined}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    // Level card shows em dash
    const emDashes = screen.getAllByText("\u2014");
    expect(emDashes.length).toBeGreaterThanOrEqual(1);
  });

  it("D-08: shows em dash when progressData is undefined (null stars + nodes)", () => {
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={undefined}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    // Stars and Nodes cards show em dash
    const emDashes = screen.getAllByText("\u2014");
    expect(emDashes.length).toBeGreaterThanOrEqual(2);
  });

  it("REQ-04: calculates totalStars as sum of p.stars across progressData", () => {
    // 3 + 1 + 0 + 2 = 6
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("REQ-04: calculates nodesCompleted as count where stars > 0", () => {
    // 3 nodes with stars > 0 (stars: 3, 1, 2) — node with stars: 0 excluded
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("3/179")).toBeInTheDocument();
  });

  it('REQ-04: formats nodes as "N/179"', () => {
    const progressData = [
      { node_id: "treble_1_1", stars: 1 },
      { node_id: "treble_1_2", stars: 1 },
    ];
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={progressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("2/179")).toBeInTheDocument();
  });

  it("D-08: renders level value from xpData.levelData.level", () => {
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("D-08: renders streak value from streakState.streakCount", () => {
    render(
      <QuickStatsGrid
        xpData={sampleXpData}
        progressData={sampleProgressData}
        streakState={sampleStreakState}
        isLoading={false}
      />
    );
    expect(screen.getByText("14")).toBeInTheDocument();
  });
});
