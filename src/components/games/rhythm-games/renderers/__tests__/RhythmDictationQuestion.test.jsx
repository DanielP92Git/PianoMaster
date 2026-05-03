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

// Mock useAudioEngine — exposes the surface that useEnsureAudioReady composes
// (resumeAudioContext, loadPianoSound, isReady, audioContextRef) plus the legacy
// initializeAudioContext for backward compatibility.
vi.mock("../../../../../hooks/useAudioEngine", () => ({
  useAudioEngine: vi.fn(() => ({
    audioContextRef: {
      current: {
        state: "running",
        currentTime: 0,
        createOscillator: vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        })),
        destination: {},
      },
    },
    gainNodeRef: { current: {} },
    getCurrentTime: vi.fn(() => 0),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    resumeAudioContext: vi.fn(() => Promise.resolve(true)),
    loadPianoSound: vi.fn(() => Promise.resolve(true)),
    isReady: vi.fn(() => true),
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

// Build a mock useAudioEngine return value that satisfies useEnsureAudioReady's
// post-conditions (isReady() === true, audioContextRef.current present with
// minimal WebAudio surface for the warmup oscillator).
function makeReadyMockEngine({ onResume, onLoadPiano } = {}) {
  return {
    audioContextRef: {
      current: {
        state: "running",
        currentTime: 0,
        createOscillator: vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        })),
        createGain: vi.fn(() => ({
          gain: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
        })),
        destination: {},
      },
    },
    gainNodeRef: { current: {} },
    getCurrentTime: vi.fn(() => 0),
    initializeAudioContext: vi.fn(() => Promise.resolve(true)),
    resumeAudioContext: vi.fn(() => {
      onResume?.();
      return Promise.resolve(true);
    }),
    loadPianoSound: vi.fn(() => {
      onLoadPiano?.();
      return Promise.resolve(true);
    }),
    isReady: vi.fn(() => true),
    createPianoSound: vi.fn(),
  };
}

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

  // D-13: handleListen now delegates to useEnsureAudioReady which calls
  // resumeAudioContext + loadPianoSound + warmup oscillator + isReady().
  // The legacy direct initializeAudioContext call has been removed.

  it("calls ensureAudioReady (resumeAudioContext) on first listen click", async () => {
    const mockEngine = makeReadyMockEngine();
    useAudioEngine.mockReturnValue(mockEngine);

    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(mockEngine.resumeAudioContext).toHaveBeenCalled();
  });

  it("awaits loadPianoSound before scheduling playback (D-13 prewarm)", async () => {
    const callOrder = [];
    const mockEngine = makeReadyMockEngine({
      onResume: () => callOrder.push("resumeAudioContext"),
      onLoadPiano: () => callOrder.push("loadPianoSound"),
    });
    useAudioEngine.mockReturnValue(mockEngine);

    render(
      <RhythmDictationQuestion question={mockQuestion} onComplete={vi.fn()} />
    );

    const listenButton = screen.getByText("Listen");
    await act(async () => {
      fireEvent.click(listenButton);
    });

    expect(mockEngine.resumeAudioContext).toHaveBeenCalled();
    expect(mockEngine.loadPianoSound).toHaveBeenCalled();
    // resumeAudioContext must have been called before loadPianoSound
    const resumeIdx = callOrder.indexOf("resumeAudioContext");
    const loadIdx = callOrder.indexOf("loadPianoSound");
    expect(resumeIdx).toBeGreaterThanOrEqual(0);
    expect(loadIdx).toBeGreaterThan(resumeIdx);
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
