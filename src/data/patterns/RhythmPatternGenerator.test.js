import { describe, it, expect } from "vitest";
import {
  resolveByTags,
  resolveByAnyTag,
  resolveByIds,
  binaryToVexDurations,
  durationsIncludeRests,
} from "./RhythmPatternGenerator";

// Duration slot sizes (sixteenth-note units)
const DURATION_SLOTS = {
  w: 16,
  h: 8,
  q: 4,
  8: 2,
  16: 1,
  hd: 12,
  qd: 6,
  wr: 16,
  hr: 8,
  qr: 4,
  "8r": 2,
  "16r": 1,
};

function sumSlots(vexDurations) {
  return vexDurations.reduce((sum, d) => sum + (DURATION_SLOTS[d] ?? 0), 0);
}

describe("binaryToVexDurations", () => {
  it("renders four quarters with only q allowed", () => {
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      ["q"]
    );
    expect(result).toEqual(["q", "q", "q", "q"]);
  });

  it("greedy longest-fit prefers half over two quarters (D-07)", () => {
    // Two onsets at 0 and 8, gap of 8 each -> should render as h, h
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      ["q", "h"]
    );
    expect(result).toEqual(["h", "h"]);
  });

  it("fills gap with rests when only q is available and gap > 4", () => {
    // Onset at 0 and 8. Gap of 8 at position 0 but only q=4 available -> q then qr
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
      ["q"]
    );
    expect(result).toEqual(["q", "qr", "q", "qr"]);
    expect(sumSlots(result)).toBe(16);
  });

  it("uses whole note when w is available and onset fills entire measure", () => {
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["q", "h", "w"]
    );
    expect(result).toEqual(["w"]);
    expect(sumSlots(result)).toBe(16);
  });

  it("uses half then half-rest when only h is available and onset fills 8 of 16 slots", () => {
    // Single onset at 0, gap = 8. After h, remaining 8 slots = hr
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ["q", "h"]
    );
    expect(result).toEqual(["h", "hr"]);
    expect(sumSlots(result)).toBe(16);
  });

  it("renders eighth notes when only 8 is available", () => {
    // All 8 onsets at even slots
    const result = binaryToVexDurations(
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      ["8"]
    );
    expect(result).toHaveLength(8);
    expect(result.every((d) => d === "8")).toBe(true);
    expect(sumSlots(result)).toBe(16);
  });

  it("slot sum invariant: all durations sum to pattern length", () => {
    const binary = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    const result = binaryToVexDurations(binary, ["q", "h", "w"]);
    expect(sumSlots(result)).toBe(16);
  });

  it("handles 3/4 pattern (12 slots) with quarter and half", () => {
    // Two onsets at 0 and 8 in a 12-slot pattern: onset 0->gap 8 (h), onset 8->gap 4 (q)
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      ["q", "h"]
    );
    expect(sumSlots(result)).toBe(12);
    expect(result[0]).toBe("h");
    expect(result[1]).toBe("q");
  });

  it("handles 6/8 pattern with dotted quarter", () => {
    // Two onsets at 0 and 6 in a 12-slot 6/8 pattern -> qd qd
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      ["qd"]
    );
    expect(result).toEqual(["qd", "qd"]);
    expect(sumSlots(result)).toBe(12);
  });

  it("handles leading rest (binary starts with 0)", () => {
    // Onset at position 4 (beat 2), gap from 0 to 4 -> qr first
    const result = binaryToVexDurations(
      [0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      ["q"]
    );
    expect(result[0]).toBe("qr");
    expect(sumSlots(result)).toBe(16);
  });

  it("vexDurations use only allowed duration codes (plus rest equivalents)", () => {
    const allowedDurations = new Set(["q", "h"]);
    const allowedRests = new Set(["qr", "hr"]);
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      ["q", "h"]
    );
    result.forEach((d) => {
      expect(allowedDurations.has(d) || allowedRests.has(d)).toBe(true);
    });
  });

  it("renders dotted quarter when qd is in duration set", () => {
    // Onset at 0, gap = 6 slots -> qd
    const result = binaryToVexDurations(
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      ["qd"]
    );
    expect(result[0]).toBe("qd");
  });
});

describe("resolveByTags", () => {
  it("returns null for nonexistent tag", () => {
    const result = resolveByTags(["nonexistent-tag"], ["q"]);
    expect(result).toBeNull();
  });

  it("returns object with required shape for a known tag", () => {
    const result = resolveByTags(["quarter-only"], ["q"]);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("patternId");
    expect(result).toHaveProperty("binary");
    expect(result).toHaveProperty("timeSignature");
    expect(result).toHaveProperty("vexDurations");
    expect(result).toHaveProperty("tags");
  });

  it("vexDurations for quarter-only with [q] only contain q and qr", () => {
    const result = resolveByTags(["quarter-only"], ["q"]);
    expect(result).not.toBeNull();
    result.vexDurations.forEach((d) => {
      expect(["q", "qr"].includes(d)).toBe(true);
    });
  });

  it("vexDurations for quarter-half with [q, h] may contain q, h, qr, hr", () => {
    const result = resolveByTags(["quarter-half"], ["q", "h"]);
    expect(result).not.toBeNull();
    const allowed = new Set(["q", "h", "qr", "hr"]);
    result.vexDurations.forEach((d) => {
      expect(allowed.has(d)).toBe(true);
    });
  });

  it("slot sum invariant: vexDurations match binary pattern length", () => {
    const result = resolveByTags(["quarter-only"], ["q"]);
    expect(result).not.toBeNull();
    const total = sumSlots(result.vexDurations);
    expect(total).toBe(result.binary.length);
  });

  it("filters by timeSignature when options.timeSignature is provided", () => {
    const result = resolveByTags(["three-four"], ["q", "h"], {
      timeSignature: "3/4",
    });
    expect(result).not.toBeNull();
    expect(result.timeSignature).toBe("3/4");
  });

  it("filters by timeSignature 6/8", () => {
    const result = resolveByTags(["six-eight"], ["qd"], {
      timeSignature: "6/8",
    });
    expect(result).not.toBeNull();
    expect(result.timeSignature).toBe("6/8");
  });

  it("returns null when timeSignature filter excludes all matches", () => {
    // quarter-only patterns are all 4/4 — filtering by 3/4 should return null
    const result = resolveByTags(["quarter-only"], ["q"], {
      timeSignature: "3/4",
    });
    expect(result).toBeNull();
  });

  it("patternId matches a real id from RHYTHM_PATTERNS", () => {
    const result = resolveByTags(["quarter-only"], ["q"]);
    expect(result).not.toBeNull();
    expect(typeof result.patternId).toBe("string");
    expect(result.patternId.length).toBeGreaterThan(0);
  });

  it("binary array contains only 0s and 1s", () => {
    const result = resolveByTags(["quarter-half"], ["q", "h"]);
    expect(result).not.toBeNull();
    result.binary.forEach((v) => {
      expect(v === 0 || v === 1).toBe(true);
    });
  });
});

describe("resolveByTags — allowRests filtering (DATA-01, DATA-02)", () => {
  it("Test 1: quarter-only with allowRests:false never returns rest codes", () => {
    for (let i = 0; i < 100; i++) {
      const result = resolveByTags(["quarter-only"], ["q"], {
        allowRests: false,
      });
      if (result) {
        result.vexDurations.forEach((d) => {
          expect(d.endsWith("r")).toBe(false);
        });
      }
    }
  });

  it("Test 2: quarter-half with allowRests:false never returns rest codes", () => {
    for (let i = 0; i < 100; i++) {
      const result = resolveByTags(["quarter-half"], ["q", "h"], {
        allowRests: false,
      });
      if (result) {
        result.vexDurations.forEach((d) => {
          expect(d.endsWith("r")).toBe(false);
        });
      }
    }
  });

  it("Test 3: quarter-rest with allowRests:true can return qr codes", () => {
    let foundRest = false;
    for (let i = 0; i < 100; i++) {
      const result = resolveByTags(["quarter-rest"], ["q", "qr"], {
        allowRests: true,
      });
      if (result && result.vexDurations.some((d) => d.endsWith("r"))) {
        foundRest = true;
        break;
      }
    }
    expect(foundRest).toBe(true);
  });

  it("Test 4: allowRests defaults to false (backwards-compatible safety)", () => {
    for (let i = 0; i < 100; i++) {
      const result = resolveByTags(["quarter-only"], ["q"]);
      if (result) {
        result.vexDurations.forEach((d) => {
          expect(d.endsWith("r")).toBe(false);
        });
      }
    }
  });

  it("Test 5: quarter-only patterns with allowRests:false produce only quarter notes", () => {
    for (let i = 0; i < 100; i++) {
      const result = resolveByTags(["quarter-only"], ["q"], {
        allowRests: false,
      });
      if (result) {
        result.vexDurations.forEach((d) => {
          expect(d).toBe("q");
        });
        expect(result.vexDurations).toHaveLength(4); // 4 quarter notes in 4/4
      }
    }
  });
});

describe("durationsIncludeRests", () => {
  it("returns false for durations with no rest codes", () => {
    expect(durationsIncludeRests(["q"])).toBe(false);
    expect(durationsIncludeRests(["q", "h"])).toBe(false);
    expect(durationsIncludeRests(["q", "h", "w"])).toBe(false);
  });

  it("returns true when any duration code ends with r", () => {
    expect(durationsIncludeRests(["q", "qr"])).toBe(true);
    expect(durationsIncludeRests(["qr"])).toBe(true);
    expect(durationsIncludeRests(["q", "h", "hr"])).toBe(true);
  });

  it("returns false for empty array", () => {
    expect(durationsIncludeRests([])).toBe(false);
  });
});

describe("resolveByAnyTag", () => {
  it("returns patterns matching any tag (OR semantics)", () => {
    // "quarter-only" patterns exist and "quarter-half" patterns exist
    // OR query should return from either pool
    const result = resolveByAnyTag(["quarter-only", "quarter-half"], ["q", "h"]);
    expect(result).not.toBeNull();
    expect(result.vexDurations).toBeDefined();
  });

  it("returns null when no tags match", () => {
    const result = resolveByAnyTag(["nonexistent-tag"], ["q"]);
    expect(result).toBeNull();
  });

  it("returns object with same shape as resolveByTags", () => {
    const result = resolveByAnyTag(["quarter-only"], ["q"]);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("patternId");
    expect(result).toHaveProperty("binary");
    expect(result).toHaveProperty("timeSignature");
    expect(result).toHaveProperty("vexDurations");
    expect(result).toHaveProperty("tags");
  });

  it("filters by timeSignature option", () => {
    const result = resolveByAnyTag(["six-eight", "quarter-only"], ["qd", "q"], {
      timeSignature: "6/8",
    });
    if (result) {
      expect(result.timeSignature).toBe("6/8");
    }
  });

  it("wider pool: OR-mode returns patterns when AND-mode returns null for disjoint tags", () => {
    // AND requires BOTH tags on same pattern — "six-eight" and "quarter-only" never coexist
    const andResult = resolveByTags(
      ["six-eight", "quarter-only"],
      ["q", "qd"]
    );
    // OR requires any tag match — should find patterns from either pool
    const orResult = resolveByAnyTag(
      ["six-eight", "quarter-only"],
      ["q", "qd"]
    );
    // AND of two disjoint tags returns null; OR should return a pattern
    expect(andResult).toBeNull();
    expect(orResult).not.toBeNull();
  });
});

describe("resolveByIds", () => {
  it("returns the pattern with id q_44_001", () => {
    const result = resolveByIds(["q_44_001"], ["q"]);
    expect(result).not.toBeNull();
    expect(result.patternId).toBe("q_44_001");
  });

  it("returns null for a nonexistent id", () => {
    const result = resolveByIds(["nonexistent-id"], ["q"]);
    expect(result).toBeNull();
  });

  it("returns same shape as resolveByTags", () => {
    const result = resolveByIds(["q_44_001"], ["q"]);
    expect(result).not.toBeNull();
    expect(result).toHaveProperty("patternId");
    expect(result).toHaveProperty("binary");
    expect(result).toHaveProperty("timeSignature");
    expect(result).toHaveProperty("vexDurations");
    expect(result).toHaveProperty("tags");
  });

  it("vexDurations slot sum equals binary length for q_44_001 with [q]", () => {
    const result = resolveByIds(["q_44_001"], ["q"]);
    expect(result).not.toBeNull();
    // q_44_001 is [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] -> 4 quarters
    expect(result.vexDurations).toEqual(["q", "q", "q", "q"]);
    expect(sumSlots(result.vexDurations)).toBe(16);
  });

  it("renders q_44_001 with [q, h] as four quarters (onsets 4-slots apart, no sustain room for h)", () => {
    const result = resolveByIds(["q_44_001"], ["q", "h"]);
    expect(result).not.toBeNull();
    // Pattern: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0] -> onsets every 4 slots, gap=4 so only q fits
    expect(result.vexDurations).toEqual(["q", "q", "q", "q"]);
  });
});
