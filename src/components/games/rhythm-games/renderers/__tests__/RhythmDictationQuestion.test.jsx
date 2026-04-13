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
      return key;
    },
    i18n: { language: "en" },
  })),
}));

// Mock useAudioEngine — expose initializeAudioContext for assertion
vi.mock("../../../../../hooks/useAudioEngine", () => ({
  useAudioEngine: vi.fn(() => ({
    audioContextRef: { current: null },
    gainNodeRef: { current: null },
    getCurrentTime: vi.fn(() => 0),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    resumeAudioContext: vi.fn(() => Promise.resolve(true)),
    createPianoSound: vi.fn(),
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
    getOrCreateAudioContext: vi.fn(),
  })),
}));

// Mock useSounds
vi.mock("../../../../../features/games/hooks/useSounds", () => ({
  useSounds: vi.fn(() => ({
    playCorrectSound: vi.fn(),
    playWrongSound: vi.fn(),
  })),
}));

// Mock useMotionTokens
vi.mock("../../../../utils/useMotionTokens", () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
  })),
}));

// Mock schedulePatternPlayback
vi.mock("../../utils/rhythmTimingUtils", () => ({
  schedulePatternPlayback: vi.fn(() => ({
    startTime: 0.1,
    totalDuration: 2.0,
  })),
}));

// Mock DictationChoiceCard — simple button stub
vi.mock("../../components/DictationChoiceCard", () => ({
  DictationChoiceCard: ({ cardIndex, onSelect, disabled }) => (
    <button
      data-testid={`choice-${cardIndex}`}
      onClick={() => onSelect(cardIndex)}
      disabled={disabled}
    >
      Choice {cardIndex}
    </button>
  ),
}));

import RhythmDictationQuestion from "../RhythmDictationQuestion";
import { useAudioEngine } from "../../../../../hooks/useAudioEngine";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockQuestion = {
  rhythmConfig: { tempo: 80, timeSignature: "4/4" },
  correctBeats: [
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
    { durationUnits: 4, isRest: false },
  ],
  choices: [
    [{ durationUnits: 4 }],
    [{ durationUnits: 8 }],
    [{ durationUnits: 2 }],
  ],
  correctIndex: 0,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RhythmDictationQuestion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls initializeAudioContext before first listen click plays audio", async () => {
    const mockEngine = {
      audioContextRef: { current: null },
      gainNodeRef: { current: null },
      getCurrentTime: vi.fn(() => 0),
      initializeAudioContext: vi.fn(() => Promise.resolve(true)),
      resumeAudioContext: vi.fn(() => Promise.resolve(true)),
      createPianoSound: vi.fn(),
    };
    useAudioEngine.mockReturnValue(mockEngine);

    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(mockEngine.initializeAudioContext).toHaveBeenCalled();
  });

  it("calls resumeAudioContext after initializeAudioContext", async () => {
    const callOrder = [];
    const mockEngine = {
      audioContextRef: { current: null },
      gainNodeRef: { current: null },
      getCurrentTime: vi.fn(() => 0),
      initializeAudioContext: vi.fn(() => {
        callOrder.push("initializeAudioContext");
        return Promise.resolve(true);
      }),
      resumeAudioContext: vi.fn(() => {
        callOrder.push("resumeAudioContext");
        return Promise.resolve(true);
      }),
      createPianoSound: vi.fn(),
    };
    useAudioEngine.mockReturnValue(mockEngine);

    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(mockEngine.resumeAudioContext).toHaveBeenCalled();
    // initializeAudioContext must have been called before resumeAudioContext
    const initIdx = callOrder.indexOf("initializeAudioContext");
    const resumeIdx = callOrder.indexOf("resumeAudioContext");
    expect(initIdx).toBeGreaterThanOrEqual(0);
    expect(resumeIdx).toBeGreaterThan(initIdx);
  });

  it("renders Listen button in LISTEN_PROMPT phase", () => {
    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    expect(screen.getByText("Listen")).toBeInTheDocument();
  });

  it("shows Listening... instruction text when audio is playing after listen click", async () => {
    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    // After clicking Listen, the phase transitions to LISTENING which shows "Listening..." text
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });
});
