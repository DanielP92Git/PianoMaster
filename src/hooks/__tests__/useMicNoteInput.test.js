/**
 * Tests for useMicNoteInput's voice-rejection gates (maxCentsDrift +
 * getMinStableMs). usePitchDetection is mocked so we can drive the FSM
 * frame-by-frame with synthetic (note, frequency) pairs and a fake clock.
 */

import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useMicNoteInput } from "../useMicNoteInput";
import { frequencyToNote } from "../usePitchDetection";

let captured = {};

vi.mock("../usePitchDetection", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    usePitchDetection: (opts) => {
      captured = opts;
      return {
        isListening: false,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        subscribe: vi.fn(),
      };
    },
  };
});

const FRAME_MS = 16.7;
let clock = 0;

/** Feed one detect-loop frame at `hz` and advance the fake clock. */
function frame(hz) {
  clock += FRAME_MS;
  captured.onPitchDetected(frequencyToNote(hz), hz);
  captured.onLevelChange(0.05);
}

/** Feed `count` frames whose frequency comes from `hzAt(i)`. */
function frames(count, hzAt) {
  for (let i = 0; i < count; i++) frame(hzAt(i));
}

function setup(options = {}) {
  const onNoteEvent = vi.fn();
  renderHook(() =>
    useMicNoteInput({ onFrames: 6, changeFrames: 7, onNoteEvent, ...options })
  );
  const noteOns = () =>
    onNoteEvent.mock.calls
      .map(([e]) => e)
      .filter((e) => e.type === "noteOn")
      .map((e) => e.pitch);
  return { noteOns };
}

const C4 = 261.63;
const E4 = 329.63;

beforeEach(() => {
  clock = 1000;
  vi.spyOn(performance, "now").mockImplementation(() => clock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMicNoteInput — legacy behaviour (gates disabled)", () => {
  it("emits noteOn after onFrames of a steady pitch", () => {
    const { noteOns } = setup();
    frames(10, () => C4);
    expect(noteOns()).toEqual(["C4"]);
  });

  it("still emits for a gliding pitch when maxCentsDrift is not set", () => {
    const { noteOns } = setup();
    // 255 → 268 Hz: always rounds to C4 but drifts ~84 cents.
    frames(10, (i) => 255 + (13 * i) / 9);
    expect(noteOns()).toEqual(["C4"]);
  });
});

describe("useMicNoteInput — maxCentsDrift (voice rejection)", () => {
  it("emits for a steady piano-like pitch with small jitter", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    // ±~3 cents jitter
    frames(10, (i) => C4 * (i % 2 ? 1.002 : 0.998));
    expect(noteOns()).toEqual(["C4"]);
  });

  it("never emits for a gliding (speech-like) pitch inside one semitone", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    frames(30, (i) => 255 + (13 * (i % 10)) / 9);
    expect(noteOns()).toEqual([]);
  });

  it("rejects a pitch that keeps wobbling across a wide range", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    // Vibrato-like ±40 cents wobble around C4
    frames(40, (i) => C4 * 2 ** ((40 * Math.sin(i / 2)) / 1200));
    expect(noteOns()).toEqual([]);
  });
});

describe("useMicNoteInput — getMinStableMs (asymmetric confirmation)", () => {
  const getMinStableMs = (note) => (note === "C4" ? 90 : 220);

  it("credits the expected note quickly", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    frames(7, () => C4); // ~100ms after the first frame
    expect(noteOns()).toEqual(["C4"]);
  });

  it("does not emit a wrong note held for only ~150ms", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    frames(10, () => E4);
    expect(noteOns()).toEqual([]);
  });

  it("emits a wrong note once it is held steadily for >220ms", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    frames(16, () => E4);
    expect(noteOns()).toEqual(["E4"]);
  });

  it("restarts the stable timer when the pitch drifts", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    frames(10, () => E4);
    frame(E4 * 2 ** (30 / 1200)); // +30 cents jump → candidate restarts
    frames(8, () => E4 * 2 ** (30 / 1200));
    expect(noteOns()).toEqual([]);
  });
});

describe("useMicNoteInput — drift gate tolerates real-piano artefacts", () => {
  const getMinStableMs = (note) => (note === "C4" ? 90 : 220);
  const cents = (hz, c) => hz * 2 ** (c / 1200);

  it("an isolated octave-error frame does not reset a held wrong note", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    // A strong 2nd harmonic makes pitchy report E5 for one frame now and then.
    frames(18, (i) => (i % 6 === 3 ? E4 * 2 : E4));
    expect(noteOns()).toEqual(["E4"]);
  });

  it("a mistuned attack frame does not delay the correct note", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    frame(cents(C4, 40)); // hammer attack reads sharp
    frames(7, () => C4);
    expect(noteOns()).toEqual(["C4"]);
  });

  it("confirms an out-of-tune piano note whose name flickers", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    // ~50 cents sharp: rounds to C4 on some frames and C#4 on others.
    frames(12, (i) => cents(C4, i % 2 ? 52 : 47));
    expect(noteOns()).toHaveLength(1);
  });

  it("keeps the held note while its name flickers (no repeat noteOn)", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    frames(30, (i) => cents(C4, i % 3 ? 47 : 53));
    expect(noteOns()).toHaveLength(1);
  });

  it("still detects a genuine note change while a note is held", () => {
    const { noteOns } = setup({ maxCentsDrift: 25 });
    frames(10, () => C4);
    frames(10, () => E4);
    expect(noteOns()).toEqual(["C4", "E4"]);
  });

  it("does not let tolerated outliers rescue a speech-like glide", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    // Slow-ish glide around E4 (~6 cents/frame) with the occasional spike.
    frames(40, (i) => (i % 7 === 0 ? E4 * 2 : cents(E4, -40 + ((6 * i) % 80))));
    expect(noteOns()).toEqual([]);
  });
});

describe("useMicNoteInput — held note with sporadic octave errors", () => {
  const getMinStableMs = (note) => (note === "C4" ? 90 : 220);

  it("does not slowly accumulate the octave error into a phantom noteOn", () => {
    const { noteOns } = setup({ maxCentsDrift: 25, getMinStableMs });
    // A long sustained C4; pitchy reports C5 on every 6th frame (~1s total).
    frames(60, (i) => (i % 6 === 5 ? C4 * 2 : C4));
    expect(noteOns()).toEqual(["C4"]);
  });
});
