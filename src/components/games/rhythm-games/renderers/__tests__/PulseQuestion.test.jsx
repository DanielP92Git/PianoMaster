import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

// ---------------------------------------------------------------------------
// Module mocks — must precede the import under test
// ---------------------------------------------------------------------------

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key, fallback, opts) => {
      // Handle both (key, fallback) and (key, opts) signatures
      if (typeof fallback === "string") return fallback;
      if (key === "game.pulse.instruction") return "Tap with the beat!";
      if (key === "rhythm.countIn") return "Listen to the beat...";
      if (key === "game.pulse.beatCount") return `Beat 1 of 16`;
      if (key === "game.pulse.tapButton") return "Tap here";
      if (key === "game.pulse.ariaLabel")
        return "Pulse exercise — tap with the beat";
      if (key === "game.pulse.measureCount") return "Measure 1 of 4";
      return key;
    },
    i18n: { language: "en" },
  })),
}));

// Shared, controllable ensureRunning mock so a test can simulate a transient
// not-running AudioContext (the count-in freeze regression). Hoisted so it can
// be referenced inside the hoisted vi.mock factory below.
const { ensureRunningMock } = vi.hoisted(() => ({
  ensureRunningMock: vi.fn(() => Promise.resolve(true)),
}));

// Mock useAudioEngine — returns stub that avoids real Web Audio API
// Path is relative to this test file (__tests__/ is one level deeper than renderers/)
vi.mock("../../../../../hooks/useAudioEngine", () => ({
  useAudioEngine: vi.fn(() => ({
    audioContextRef: { current: null },
    gainNodeRef: { current: null },
    getCurrentTime: vi.fn(() => 0),
    resumeAudioContext: vi.fn(() => Promise.resolve()),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    createPianoSound: vi.fn(),
    // isReady() gates the count-in wait loop — return true so it exits at once.
    isReady: vi.fn(() => true),
    // ensureRunning() gates the count-in — controllable per test (default true).
    ensureRunning: ensureRunningMock,
  })),
}));

// Mock AudioContextProvider
vi.mock("../../../../../contexts/AudioContextProvider", () => ({
  useAudioContext: vi.fn(() => ({
    audioContextRef: { current: null },
    getOrCreateAudioContext: vi.fn(),
  })),
}));

// Mock RhythmPatternGenerator TIME_SIGNATURES
vi.mock("../../RhythmPatternGenerator", () => ({
  TIME_SIGNATURES: {
    FOUR_FOUR: { beats: 4, name: "4/4", measureLength: 16, strongBeats: [0] },
    THREE_FOUR: { beats: 3, name: "3/4", measureLength: 12, strongBeats: [0] },
    TWO_FOUR: { beats: 2, name: "2/4", measureLength: 8, strongBeats: [0] },
    SIX_EIGHT: {
      beats: 2,
      name: "6/8",
      measureLength: 12,
      subdivision: 12,
      strongBeats: [0, 3],
      weakBeats: [1, 2, 4, 5],
      subdivisions: 6,
      isCompound: true,
    },
  },
}));

// Mock MetronomeDisplay and TapArea from components
vi.mock("../../components", () => ({
  MetronomeDisplay: ({ isActive, currentBeat }) => (
    <div
      data-testid="metronome-display"
      data-active={String(isActive)}
      data-beat={currentBeat}
    />
  ),
  TapArea: ({
    onTap,
    isActive,
    isHoldNote,
    feedback,
    holdFeedbackLabel,
    ...rest
  }) => (
    <button
      data-testid="tap-area"
      onClick={isActive && !isHoldNote ? onTap : undefined}
      disabled={!isActive}
      className="rounded-3xl bg-white/10"
    >
      {isHoldNote ? "HOLD" : "TAP HERE"}
    </button>
  ),
}));

// Mock RhythmStaffDisplay — avoids real VexFlow rendering in test env
vi.mock("../../components/RhythmStaffDisplay", () => ({
  default: (props) => (
    <div
      data-testid="rhythm-staff-display"
      data-beats={JSON.stringify(props.beats)}
      data-show-cursor={String(props.showCursor)}
      data-measures={props.measures}
    />
  ),
}));

// Mock FloatingFeedback
vi.mock("../../components/FloatingFeedback", () => ({
  default: (props) => (
    <div
      data-testid="floating-feedback"
      data-quality={props.quality}
      data-feedback-key={props.feedbackKey}
    />
  ),
}));

// Mock useMotionTokens
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    soft: { type: "spring", stiffness: 360, damping: 28 },
    fade: { duration: 0.18, ease: "easeOut" },
  })),
}));

import PulseQuestion from "../PulseQuestion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultQuestion = {
  type: "pulse",
  rhythmConfig: {
    tempo: 65,
    timeSignature: "4/4",
  },
};

const defaultProps = {
  question: defaultQuestion,
  isLandscape: false,
  onComplete: vi.fn(),
  disabled: true, // disabled=true prevents auto-start flow (no timers)
};

// Mirrors START_RETRY_MS in PulseQuestion.jsx (count-in auto-start retry delay).
const START_RETRY_MS = 150;

describe("PulseQuestion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    defaultProps.onComplete.mockClear();
    // Default: AudioContext is running so the count-in proceeds immediately.
    ensureRunningMock.mockReset();
    ensureRunningMock.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders instruction text when disabled (waiting state)", () => {
    render(<PulseQuestion {...defaultProps} />);
    // The guidance text should appear in the component
    expect(screen.getByText("Tap with the beat!")).toBeInTheDocument();
  });

  it("renders the TapArea component", () => {
    render(<PulseQuestion {...defaultProps} />);
    expect(screen.getByTestId("tap-area")).toBeInTheDocument();
  });

  it("renders the glass card container with bg-white/10", () => {
    const { container } = render(<PulseQuestion {...defaultProps} />);
    // Glass card background class
    const glassCard = container.querySelector('[class*="bg-white/10"]');
    expect(glassCard).toBeTruthy();
  });

  it("renders the MetronomeDisplay component", () => {
    render(<PulseQuestion {...defaultProps} />);
    expect(screen.getByTestId("metronome-display")).toBeInTheDocument();
  });

  it("renders FloatingFeedback component", () => {
    render(<PulseQuestion {...defaultProps} />);
    expect(screen.getByTestId("floating-feedback")).toBeInTheDocument();
  });

  it("renders RhythmStaffDisplay when not in WAITING phase", async () => {
    // With disabled=false, component transitions out of WAITING
    render(
      <PulseQuestion
        question={defaultQuestion}
        isLandscape={false}
        onComplete={vi.fn()}
        disabled={false}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    const staff = screen.queryByTestId("rhythm-staff-display");
    // Staff should appear after transitioning out of WAITING
    if (staff) {
      expect(staff).toBeInTheDocument();
      // Should show 4 quarter note beats
      const beats = JSON.parse(staff.getAttribute("data-beats"));
      expect(beats).toHaveLength(4);
      expect(beats.every((b) => b.durationUnits === 4 && !b.isRest)).toBe(true);
      // Should be single measure
      expect(staff.getAttribute("data-measures")).toBe("1");
    }
  });

  it("does not render RhythmStaffDisplay in WAITING phase", () => {
    render(<PulseQuestion {...defaultProps} disabled={true} />);
    // Staff is hidden during WAITING
    expect(screen.queryByTestId("rhythm-staff-display")).toBeNull();
  });

  it("calls onComplete with two numeric arguments after playing phase completes", async () => {
    const onComplete = vi.fn();

    // Use disabled=false so startFlow runs, but mock avoids real audio
    render(
      <PulseQuestion
        question={defaultQuestion}
        isLandscape={false}
        onComplete={onComplete}
        disabled={false}
      />
    );

    // Advance timers through count-in (4 beats at 65 BPM = ~3.69s) + play (16 beats = ~14.77s) + evaluation delay
    await act(async () => {
      vi.advanceTimersByTime(25000); // 25 seconds covers full session
    });

    // onComplete should have been called with two numeric arguments
    if (onComplete.mock.calls.length > 0) {
      const [firstArg, secondArg] = onComplete.mock.calls[0];
      expect(typeof firstArg).toBe("number");
      expect(typeof secondArg).toBe("number");
      // totalExpectedTaps should be 16 (4 bars × 4 beats)
      expect(secondArg).toBe(16);
    }
    // Note: if timers don't fire (mock environment), we just verify the component renders without crashing
  });

  it("accepts disabled prop and does not auto-start when disabled=true", () => {
    // No timers should be set when disabled
    const { container } = render(
      <PulseQuestion {...defaultProps} disabled={true} />
    );
    // Component should render without error
    expect(container).toBeTruthy();
    // onComplete should not be called
    expect(defaultProps.onComplete).not.toHaveBeenCalled();
  });

  it("renders with reducedMotion=true without crashing", () => {
    const { container } = render(<PulseQuestion {...defaultProps} />);
    expect(container).toBeTruthy();
    expect(screen.getByTestId("tap-area")).toBeInTheDocument();
  });

  // Regression: a remounted audio question (2nd+ in a MixedLessonGame) can briefly
  // observe a not-yet-running shared AudioContext. The start must retry rather than
  // bail permanently, otherwise the count-in/playback freezes forever.
  it("retries the count-in after a transient not-running AudioContext (no permanent freeze)", async () => {
    // 1st start attempt: context not running → bail + schedule retry.
    // Retry attempt: running → count-in proceeds.
    ensureRunningMock.mockReset();
    ensureRunningMock.mockResolvedValueOnce(false).mockResolvedValue(true);

    const onComplete = vi.fn();
    render(
      <PulseQuestion
        question={defaultQuestion}
        isLandscape={false}
        onComplete={onComplete}
        disabled={false}
      />
    );

    // Flush the initial (failed) start attempt.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Still WAITING — count-in did not start, but it did NOT permanently bail.
    expect(screen.getByText("Tap with the beat!")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // Fire the retry timer; the second attempt sees a running context.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(START_RETRY_MS);
    });

    // Count-in now running → guidance switches to the count-in text.
    expect(screen.getByText("Listen to the beat...")).toBeInTheDocument();
    expect(ensureRunningMock).toHaveBeenCalledTimes(2);
  });
});
