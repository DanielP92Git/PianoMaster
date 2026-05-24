import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, fallback) => {
      if (typeof fallback === "string") return fallback;
      // Map a handful of keys to readable strings so tests can findByText.
      const STRINGS = {
        "compose.instruction": "Pick 2 tiles to build your rhythm",
        "compose.palette": "Your tiles",
        "compose.slot.empty": "Tap a tile",
        "compose.slot.filled": "Tap to remove",
        "compose.play": "Play your rhythm",
        "compose.done": "I'm done!",
      };
      return STRINGS[key] ?? key;
    },
    i18n: { language: "en" },
  })),
  Trans: ({ children, defaults, i18nKey }) => (
    <>{children || defaults || i18nKey}</>
  ),
}));

// Mock useAudioEngine
vi.mock("../../../../../hooks/useAudioEngine", () => ({
  useAudioEngine: vi.fn(() => ({
    audioContextRef: {
      current: {
        state: "running",
        currentTime: 0,
        resume: vi.fn(() => Promise.resolve()),
      },
    },
    gainNodeRef: { current: null },
    getCurrentTime: vi.fn(() => 0),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    resumeAudioContext: vi.fn(() => Promise.resolve(true)),
    createPianoSound: vi.fn(),
    isReady: vi.fn(() => true),
  })),
}));

// Mock AudioContextProvider
vi.mock("../../../../../contexts/AudioContextProvider", () => ({
  useAudioContext: vi.fn(() => ({
    audioContextRef: {
      current: {
        state: "running",
        currentTime: 0,
        resume: vi.fn(() => Promise.resolve()),
      },
    },
    getOrCreateAudioContext: vi.fn(() => ({
      state: "running",
      currentTime: 0,
      resume: vi.fn(() => Promise.resolve()),
    })),
  })),
}));

// Mock NeedsLandscapeContext (used by sibling renderers to declare orientation)
vi.mock("../../../../../contexts/NeedsLandscapeContext", () => ({
  useDeclareNeedsLandscape: vi.fn(),
}));

// Mock useMotionTokens
vi.mock("../../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
  })),
}));

// Mock schedulePatternPlayback so we can capture beats passed to it
vi.mock("../../utils/rhythmTimingUtils", () => ({
  schedulePatternPlayback: vi.fn(() => ({
    startTime: 0.1,
    totalDuration: 2.0,
  })),
}));

// Mock RhythmStaffDisplay — avoids real VexFlow rendering
vi.mock("../../components/RhythmStaffDisplay", () => ({
  default: (props) => (
    <div
      data-testid="rhythm-staff-display"
      data-beats={JSON.stringify(props.beats)}
      data-measures={props.measures}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Import mocks for capturing call arguments
// ---------------------------------------------------------------------------
import { schedulePatternPlayback } from "../../utils/rhythmTimingUtils";

// ---------------------------------------------------------------------------
// Import component under test
// ---------------------------------------------------------------------------
import ComposeRhythmQuestion from "../ComposeRhythmQuestion";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TILES = [
  // q q q q (4 onsets)
  {
    id: "tile_qqqq",
    binary: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "q q q q",
  },
  // q h q (3 onsets, half on beat 2 crosses beat 3)
  {
    id: "tile_qhq",
    binary: [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    label: "q h q",
  },
  // 8-q-8 q q
  {
    id: "tile_8q8qq",
    binary: [0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "8-q-8 q q",
  },
  // q 8-q-8 q (different shape)
  {
    id: "tile_q8q8q",
    binary: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    label: "q 8-q-8 q",
  },
];

const makeQuestion = (overrides = {}) => ({
  type: "compose_rhythm",
  tiles: TILES,
  slotCount: 2,
  tempo: 75,
  ...overrides,
});

const defaultProps = {
  question: makeQuestion(),
  isLandscape: false,
  onComplete: vi.fn(),
  disabled: false,
};

describe("ComposeRhythmQuestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps.onComplete.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders one tile preview per tile and the configured number of slots", () => {
    render(<ComposeRhythmQuestion {...defaultProps} />);

    TILES.forEach((tile) => {
      expect(screen.getByTestId(`tile-${tile.id}`)).toBeInTheDocument();
    });
    // 2 slot containers when slotCount=2
    expect(screen.getByTestId("slot-0")).toBeInTheDocument();
    expect(screen.getByTestId("slot-1")).toBeInTheDocument();
    expect(screen.queryByTestId("slot-2")).toBeNull();
  });

  it("fills the first empty slot when a tile is clicked", () => {
    render(<ComposeRhythmQuestion {...defaultProps} />);

    const slot0 = screen.getByTestId("slot-0");
    expect(slot0.getAttribute("data-tile-id")).toBe("");

    fireEvent.click(screen.getByTestId("tile-tile_qhq"));
    expect(slot0.getAttribute("data-tile-id")).toBe("tile_qhq");
    // Second slot should still be empty
    expect(screen.getByTestId("slot-1").getAttribute("data-tile-id")).toBe("");

    fireEvent.click(screen.getByTestId("tile-tile_qqqq"));
    expect(slot0.getAttribute("data-tile-id")).toBe("tile_qhq");
    expect(screen.getByTestId("slot-1").getAttribute("data-tile-id")).toBe(
      "tile_qqqq"
    );
  });

  it("empties a filled slot when the slot is clicked", () => {
    render(<ComposeRhythmQuestion {...defaultProps} />);
    const slot0 = screen.getByTestId("slot-0");

    fireEvent.click(screen.getByTestId("tile-tile_qhq"));
    expect(slot0.getAttribute("data-tile-id")).toBe("tile_qhq");

    // Clicking the filled slot empties it
    fireEvent.click(slot0);
    expect(slot0.getAttribute("data-tile-id")).toBe("");
  });

  it("disables Play until all slots are filled, then schedules concatenated beats once on press", async () => {
    render(<ComposeRhythmQuestion {...defaultProps} />);

    const playBtn = screen.getByRole("button", { name: /Play your rhythm/i });
    expect(playBtn).toBeDisabled();

    // Fill both slots: qhq then qqqq
    fireEvent.click(screen.getByTestId("tile-tile_qhq"));
    fireEvent.click(screen.getByTestId("tile-tile_qqqq"));

    expect(playBtn).not.toBeDisabled();
    await act(async () => {
      fireEvent.click(playBtn);
    });

    expect(schedulePatternPlayback).toHaveBeenCalledTimes(1);
    const [beatsArg, tempoArg] = schedulePatternPlayback.mock.calls[0];
    // qhq (3 beats) + qqqq (4 beats) = 7 onset beats total
    expect(Array.isArray(beatsArg)).toBe(true);
    expect(beatsArg.length).toBe(7);
    expect(tempoArg).toBe(75);
  });

  it("calls onComplete(slotCount, slotCount) exactly once when Done is pressed with all slots filled", () => {
    const onComplete = vi.fn();
    render(<ComposeRhythmQuestion {...defaultProps} onComplete={onComplete} />);

    // Done must be disabled until slots are filled
    const doneBtn = screen.getByRole("button", { name: /I'm done!/i });
    expect(doneBtn).toBeDisabled();

    fireEvent.click(screen.getByTestId("tile-tile_qhq"));
    fireEvent.click(screen.getByTestId("tile-tile_qqqq"));
    expect(doneBtn).not.toBeDisabled();

    fireEvent.click(doneBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(2, 2);

    // Pressing Done again should NOT re-fire onComplete
    fireEvent.click(doneBtn);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("respects the disabled prop and ignores tile/slot/play/done interactions", async () => {
    const onComplete = vi.fn();
    render(
      <ComposeRhythmQuestion
        {...defaultProps}
        disabled={true}
        onComplete={onComplete}
      />
    );

    fireEvent.click(screen.getByTestId("tile-tile_qhq"));
    expect(screen.getByTestId("slot-0").getAttribute("data-tile-id")).toBe("");

    const doneBtn = screen.getByRole("button", { name: /I'm done!/i });
    fireEvent.click(doneBtn);
    expect(onComplete).not.toHaveBeenCalled();

    const playBtn = screen.getByRole("button", { name: /Play your rhythm/i });
    fireEvent.click(playBtn);
    expect(schedulePatternPlayback).not.toHaveBeenCalled();
  });
});
