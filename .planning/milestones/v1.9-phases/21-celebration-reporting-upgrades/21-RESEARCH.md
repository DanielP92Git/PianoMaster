# Phase 21: Pattern Library Construction - Research

**Researched:** 2026-04-11
**Domain:** Rhythm pattern data authoring, VexFlow duration model, synchronous ES module design
**Confidence:** HIGH

---

## Summary

Phase 21 creates `src/data/patterns/rhythmPatterns.js` — a plain synchronous ES module containing ~120+ hand-crafted rhythm patterns, each tagged by the duration set it belongs to. This file is a pure data artefact (no imports from VexFlow, React, or any async dependencies) and will be consumed in Phase 22 by the new `getPattern()` synchronous API.

The existing `RhythmPatternGenerator.js` uses a binary array format (`[1,0,0,0,1,0,0,0,...]` where each slot is one sixteenth-note unit) for playback and a schema format (`[{duration:'quarter', note:true}, ...]`) for storage. The new pattern library must emit binary arrays compatible with the games' current consumption model — specifically the `pattern.pattern` field that `RhythmTapQuestion.jsx` and `ArcadeRhythmGame.jsx` read directly.

The curriculum audit (Phase 20) locked the complete duration vocabulary across 8 units and 4 time signatures. Patterns must be authored for all duration sets that appear in unit `rhythmConfig.durations` arrays, covering: quarter-only, quarter-half, quarter-half-whole, quarter-eighth, rests (q/h/w rests), dotted notes (hd, qd), 3/4 meter, 6/8 meter, and syncopation patterns.

**Primary recommendation:** Author patterns as binary arrays in 4/4 (16 slots), 3/4 (12 slots), and 6/8 (12 slots). Tag each pattern with one or more duration-set strings derived from the curriculum's `rhythmConfig.durations` vocabulary. Store everything in a single flat export array. The file must be Node-safe (no VexFlow import) for the build-time validator added in Phase 22.

---

## Project Constraints (from CLAUDE.md)

- **SVG imports:** Use `?react` suffix — not relevant for this phase (data-only file)
- **Build hook:** `scripts/validateTrail.mjs` runs as prebuild — Phase 22 will extend it; Phase 21 must not break it
- **Vitest:** Test files as `*.test.{js,jsx}` siblings — a companion test file is needed for the new module
- **Node-safe modules:** `src/components/games/rhythm-games/utils/durationInfo.js` is already Node-safe; the same constraint applies to `src/data/patterns/rhythmPatterns.js` because validateTrail.mjs imports it in Phase 22
- **VexFlow duration codes:** `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'qr'` (r = rest); dotted via `Dot.buildAndAttach`
- **Design System:** Not applicable (data file, no UI)

---

<phase_requirements>

## Phase Requirements

| ID     | Description                                                                                              | Research Support                                                                                                                                       |
| ------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PAT-01 | Curated pattern library exists at `src/data/patterns/rhythmPatterns.js` with ~120+ hand-crafted patterns | Binary-array format verified from RhythmTapQuestion.jsx and ArcadeRhythmGame.jsx; file location and module format determined from codebase conventions |
| PAT-02 | Each pattern is tagged by duration set (e.g. `quarter-only`, `quarter-half`, `quarter-eighth`)           | Tag taxonomy derived from all 8 units' `rhythmConfig.durations` arrays and curriculum audit duration vocabulary                                        |

</phase_requirements>

---

## Standard Stack

### Core

| Component                   | Details                                                | Why                                                                         |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- |
| Plain ES module             | `export const RHYTHM_PATTERNS = [...]`                 | PAT-04 (Phase 22 req) requires synchronous import — no async fetch, no JSON |
| Binary array pattern format | `number[]` of 0/1, length = measure in sixteenth units | Direct match to existing game consumer interface                            |
| Duration-set tags           | `string[]` on each pattern object                      | Enables Phase 22 tag-based pattern lookup                                   |

### No New Dependencies

This phase introduces no npm packages. The output file is pure data with no imports.

**Installation:** None required.

---

## Architecture Patterns

### Pattern Object Shape

Each entry in the `RHYTHM_PATTERNS` export array must have:

```javascript
// [VERIFIED: RhythmTapQuestion.jsx line 406, ArcadeRhythmGame.jsx — consumes pattern.pattern]
{
  id: 'q_4_4_001',           // Unique string ID for Phase 22 patternIds lookups
  timeSignature: '4/4',      // '4/4' | '3/4' | '6/8'
  tags: ['quarter-only'],    // One or more duration-set tags
  pattern: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],  // Binary array, length per time sig
  measures: 1,               // 1 for Discovery, 2 for Practice, 4 for Boss
}
```

**Pattern array lengths by time signature:** [VERIFIED: RhythmPatternGenerator.js TIME_SIGNATURES object]

- `4/4` → 16 slots (4 beats x 4 sixteenth subdivisions)
- `3/4` → 12 slots (3 beats x 4 sixteenth subdivisions)
- `6/8` → 12 slots (6 eighth-note positions x 2 sixteenth subdivisions)

**Note:** `pattern[i] === 1` marks a note onset; `pattern[i] === 0` marks sustain or silence. This is the exact format that `RhythmTapQuestion.jsx` reads when it calls `pattern.pattern.forEach((beat, index) => { if (beat === 1) ... })`. [VERIFIED: RhythmTapQuestion.jsx lines 412-414, 218-222]

### Recommended Project Structure

```
src/data/patterns/
└── rhythmPatterns.js    # Single file: ~120+ patterns, one export
```

No subdirectories. Keep it one flat file — Phase 22 imports it directly as `import { RHYTHM_PATTERNS } from '../data/patterns/rhythmPatterns.js'`.

### Tag Taxonomy

Derived from all 8 rhythm units' `rhythmConfig.durations` and `rhythmConfig.timeSignature` fields. [VERIFIED: rhythmUnit1Redesigned.js through rhythmUnit8Redesigned.js]

| Tag                         | Durations Covered        | VexFlow codes        | Units          |
| --------------------------- | ------------------------ | -------------------- | -------------- |
| `quarter-only`              | Quarter note             | `q`                  | U1 N1-2        |
| `quarter-half`              | Quarter + Half           | `q`, `h`             | U1 N3-7, U2 N1 |
| `quarter-half-whole`        | Quarter + Half + Whole   | `q`, `h`, `w`        | U2             |
| `quarter-eighth`            | Quarter + Eighth         | `q`, `8`             | U3             |
| `quarter-half-whole-eighth` | All basic notes          | `q`, `h`, `w`, `8`   | U3 Mix-Up      |
| `quarter-rest`              | Quarter + Quarter rest   | `q`, `qr`            | U4 N1-2        |
| `half-rest`                 | + Half rest              | `qr`, `hr`           | U4 N3-4        |
| `whole-rest`                | + Whole rest             | `qr`, `hr`, `wr`     | U4 N5-7        |
| `dotted-half`               | + Dotted half            | `q`, `h`, `hd`       | U5 N1-2        |
| `three-four`                | 3/4 dotted half + others | `hd`, `q` in 3/4     | U5 N3          |
| `dotted-quarter`            | + Dotted quarter         | `qd`, `8`            | U5 N4-7        |
| `sixteenth`                 | + Sixteenth              | `q`, `8`, `16`       | U6             |
| `six-eight`                 | 6/8 compound meter       | `qd`, `8` in 6/8     | U7             |
| `syncopation`               | Eighth-quarter-eighth    | `8`, `q` syncopated  | U8             |
| `dotted-syncopation`        | Dotted quarter-eighth    | `qd`, `8` syncopated | U8 N3+         |

### Pattern Count Distribution

To reach 120+ total, distribute across tags and measure lengths: [ASSUMED]

| Category        | Tags                                                           | 1-measure | 2-measure | Total    |
| --------------- | -------------------------------------------------------------- | --------- | --------- | -------- |
| Basic (U1-3)    | quarter-only, quarter-half, quarter-half-whole, quarter-eighth | 8 each    | 4 each    | ~48      |
| Rests (U4)      | quarter-rest, half-rest, whole-rest                            | 6 each    | 4 each    | ~30      |
| Dotted/3/4 (U5) | dotted-half, three-four, dotted-quarter                        | 6 each    | 4 each    | ~30      |
| Advanced (U6-8) | sixteenth, six-eight, syncopation, dotted-syncopation          | 4 each    | 4 each    | ~32      |
| **Total**       |                                                                |           |           | **~140** |

This gives ~15% buffer over the 120 minimum.

### Anti-Patterns to Avoid

- **Importing VexFlow in rhythmPatterns.js:** The file will be imported by `validateTrail.mjs` (Node.js). VexFlow requires a browser DOM. [VERIFIED: durationInfo.js comment — "CRITICAL: This file must be pure JS with NO imports from vexflow, SVG, or React"]
- **Using async/JSON fetch:** PAT-01 explicitly requires a "plain synchronous ES module import — no async fetch, no JSON file, no dynamic loading"
- **Using the old `rhythmPatterns` string allowlist format:** The unit files currently have `patterns: ['quarter', 'half']` string arrays — these are human labels, not the new tag system. The new library uses tag strings that match `patternTags` in Phase 22 node configs.
- **Mismatched array lengths:** A 4/4 pattern with 12 slots (not 16) will silently break the scoring math in RhythmTapQuestion — `unitsPerBeat = timeSignature.measureLength / timeSignature.beats` is calculated from the time signature, not the array.

---

## Don't Hand-Roll

| Problem                   | Don't Build           | Use Instead                                                 |
| ------------------------- | --------------------- | ----------------------------------------------------------- |
| Measure-length validation | Custom validator      | Simple `array.length === expectedLength` check in test file |
| Binary conversion         | Any runtime converter | Author directly as binary — no runtime cost                 |
| Pattern uniqueness check  | Fuzzy similarity algo | Simple Set of `JSON.stringify(pattern.pattern)` in test     |

**Key insight:** Pattern authoring is a one-time creative task, not a runtime problem. All correctness checks belong in the test file and the Phase 22 validator extension — not in `rhythmPatterns.js` itself.

---

## Duration Set Mapping (Complete)

Compiled from reading all 8 unit files. [VERIFIED: rhythmUnit1-8Redesigned.js]

### 4/4 Time Signature Patterns Needed

| Unit    | Duration codes active                                | Measure length |
| ------- | ---------------------------------------------------- | -------------- |
| U1 N1-2 | `q` only                                             | 16             |
| U1 N3-7 | `q`, `h`                                             | 16             |
| U2      | `q`, `h`, `w`                                        | 16             |
| U3      | `q`, `h`, `w`, `8`                                   | 16             |
| U4      | `q`, `h`, `w`, `8`, `qr`, `hr`, `wr` (progressively) | 16             |
| U5 N1-2 | adds `hd`                                            | 16             |
| U5 N4-7 | adds `qd` (paired with `8`)                          | 16             |
| U6      | adds `16`                                            | 16             |
| U8      | syncopation: `8-q-8` and `qd-8` patterns             | 16             |

### 3/4 Time Signature Patterns Needed

| Unit    | Duration codes active                       | Measure length |
| ------- | ------------------------------------------- | -------------- |
| U5 N3   | `hd`, `q` (dotted half fills a 3/4 measure) | 12             |
| U5 N5-7 | `hd`, `qd`, `q`, `8` in 3/4                 | 12             |

### 6/8 Time Signature Patterns Needed

| Unit    | Duration codes active         | Measure length |
| ------- | ----------------------------- | -------------- |
| U7 N1-2 | `qd` only (the 6/8 beat unit) | 12             |
| U7 N3-4 | `qd`, `q`                     | 12             |
| U7 N5-7 | `qd`, `8`, `q` mix            | 12             |
| U8      | 6/8 review in boss            | 12             |

---

## Common Pitfalls

### Pitfall 1: Dotted Note Binary Representation

**What goes wrong:** A dotted quarter (1.5 beats = 6 sixteenth slots) is represented as `[1,0,0,0,0,0]` — the 1 at index 0 followed by five 0s. The `binaryPatternToBeats()` function reads consecutive 0s after a 1 as sustain and computes `durationUnits = 6`, then maps to VexFlow `'qd'` via `DURATION_TO_VEX[6]`. If the author accidentally writes `[1,0,0,0,0,1,0]` (6 slots with a note on slot 5), the rendering breaks.

**Why it happens:** Authors mentally count beats rather than sixteenth positions.

**How to avoid:** Each pattern should have a comment showing the human-readable breakdown, e.g.:

```javascript
// qd | 8  = dotted-quarter (6) + eighth (2) = 8 sixteenths = 2 beats in 4/4
pattern: [1, 0, 0, 0, 0, 0, 1, 0];
```

**Warning signs:** Pattern length does not equal `measureLength` for the time signature.

### Pitfall 2: 6/8 Slot Counting

**What goes wrong:** 6/8 has `measureLength: 12` (12 sixteenth-note slots), with the primary beat unit being a dotted quarter (6 slots). Authors confuse "6 eighth notes" with "12 sixteenth notes".

**Why it happens:** The RhythmPatternGenerator uses sixteenth-note units throughout, even for compound time. [VERIFIED: TIME_SIGNATURES.SIX_EIGHT.measureLength = 12]

**How to avoid:** In 6/8, the two main beats fall at positions 0 and 6 (dotted quarters), not 0 and 3. For eighth-note patterns, notes fall at 0, 2, 4, 6, 8, 10.

### Pitfall 3: Pattern Array Length Mismatch Causes Silent Scoring Failures

**What goes wrong:** `RhythmTapQuestion.jsx` computes `unitsPerBeat = timeSignature.measureLength / timeSignature.beats` (e.g. 16/4 = 4) then maps binary positions to beat positions. If the pattern has 15 slots instead of 16, the scoring math shifts silently — no error thrown.

**Why it happens:** Off-by-one when writing patterns manually.

**How to avoid:** The test file must assert `pattern.pattern.length === EXPECTED_LENGTHS[pattern.timeSignature]` for every pattern in the array.

### Pitfall 4: Whole Rest in 4/4

**What goes wrong:** A whole rest in 4/4 is `[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]` — all 16 slots are 0. But the games' scoring requires at least one note onset (`pattern[i] === 1`). A pattern with zero note onsets results in `expectedBeatPositions.length === 0` and the game auto-skips with `onComplete(0, 1)`. [VERIFIED: RhythmTapQuestion.jsx lines 223-225]

**Why it happens:** Whole rests are musically valid but mechanically unplayable in tap games.

**How to avoid:** Patterns tagged for rest practice must still have at least one note onset. A "whole rest practice" pattern might be: one measure with a half note + whole rest, not a fully silent measure.

### Pitfall 5: Tag Granularity vs. Pattern Selection

**What goes wrong:** If tags are too coarse (e.g. `'all-durations'`), Phase 22 cannot enforce that children only see patterns containing durations they have already learned. If tags are too fine (e.g. `'q-h-w-8-qr-hr-wr-hd-qd-16'`), tag matching becomes brittle.

**Why it happens:** Tags are designed at authoring time before the consumer (Phase 22 generator) is built.

**How to avoid:** Tags should match the exact key in the node's `patternTags` array from Phase 22. Use the curriculum-derived taxonomy above. A pattern can have multiple tags when it is appropriate for multiple unit levels (e.g. a simple `quarter-half` pattern could also carry `quarter-only` if it only uses quarters).

---

## Code Examples

### Pattern File Skeleton (verified against consumer interface)

```javascript
// src/data/patterns/rhythmPatterns.js
// [VERIFIED: consumer interface from RhythmTapQuestion.jsx lines 372-414]

/**
 * Curated rhythm pattern library.
 *
 * CRITICAL: This file must be Node-safe (no VexFlow, React, or browser imports).
 * It is consumed by validateTrail.mjs at build time.
 *
 * Pattern binary arrays use sixteenth-note units:
 *   4/4 → 16 slots   3/4 → 12 slots   6/8 → 12 slots
 *   1 = note onset   0 = sustain/rest
 */

export const RHYTHM_PATTERNS = [
  // ── Quarter only (4/4) ─────────────────────────────────────────────────

  {
    id: "q_4_4_001",
    timeSignature: "4/4",
    tags: ["quarter-only"],
    measures: 1,
    // q  q  q  q
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: "q_4_4_002",
    timeSignature: "4/4",
    tags: ["quarter-only"],
    measures: 1,
    // q  r  q  q  (quarter rest on beat 2)
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },

  // ── Quarter + Half (4/4) ────────────────────────────────────────────────

  {
    id: "qh_4_4_001",
    timeSignature: "4/4",
    tags: ["quarter-half"],
    measures: 1,
    // q  q  h
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "qh_4_4_002",
    timeSignature: "4/4",
    tags: ["quarter-half"],
    measures: 1,
    // h  q  q
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },

  // ── 6/8 dotted-quarter only ─────────────────────────────────────────────

  {
    id: "qd_6_8_001",
    timeSignature: "6/8",
    tags: ["six-eight"],
    measures: 1,
    // qd  qd  (two beats of 6/8)
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },

  // ... (120+ patterns total)
];
```

### Measure-Length Constants (for test file)

```javascript
// [VERIFIED: RhythmPatternGenerator.js TIME_SIGNATURES]
export const MEASURE_LENGTHS = {
  "4/4": 16,
  "3/4": 12,
  "6/8": 12,
};
```

### Test File Skeleton

```javascript
// src/data/patterns/rhythmPatterns.test.js
import { describe, it, expect } from "vitest";
import { RHYTHM_PATTERNS } from "./rhythmPatterns.js";

const MEASURE_LENGTHS = { "4/4": 16, "3/4": 12, "6/8": 12 };
const VALID_TIME_SIGS = new Set(["4/4", "3/4", "6/8"]);
const VALID_TAGS = new Set([
  "quarter-only",
  "quarter-half",
  "quarter-half-whole",
  "quarter-eighth",
  "quarter-half-whole-eighth",
  "quarter-rest",
  "half-rest",
  "whole-rest",
  "dotted-half",
  "three-four",
  "dotted-quarter",
  "sixteenth",
  "six-eight",
  "syncopation",
  "dotted-syncopation",
]);

describe("RHYTHM_PATTERNS", () => {
  it("contains at least 120 patterns", () => {
    expect(RHYTHM_PATTERNS.length).toBeGreaterThanOrEqual(120);
  });

  it("all IDs are unique", () => {
    const ids = RHYTHM_PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  RHYTHM_PATTERNS.forEach((p, i) => {
    describe(`pattern[${i}] id=${p.id}`, () => {
      it("has a valid timeSignature", () => {
        expect(VALID_TIME_SIGS.has(p.timeSignature)).toBe(true);
      });
      it("pattern array length matches time signature", () => {
        expect(p.pattern.length).toBe(MEASURE_LENGTHS[p.timeSignature]);
      });
      it("pattern contains only 0s and 1s", () => {
        expect(p.pattern.every((v) => v === 0 || v === 1)).toBe(true);
      });
      it("has at least one note onset", () => {
        expect(p.pattern.some((v) => v === 1)).toBe(true);
      });
      it("has at least one tag from valid taxonomy", () => {
        expect(p.tags.length).toBeGreaterThan(0);
        p.tags.forEach((tag) => {
          expect(VALID_TAGS.has(tag)).toBe(true);
        });
      });
    });
  });
});
```

---

## State of the Art

| Old Approach                                                           | Current Approach                                         | Impact                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `getPattern()` async fetch from `/data/4-4.json`                       | Synchronous ES module import (Phase 21+22)               | Eliminates network dependency, enables build-time validation |
| `allowedPatterns: ['quarter','half']` string filter on generative algo | `patternTags: ['quarter-half']` matching curated library | Pedagogy-controlled instead of algorithm-controlled          |
| `HybridPatternService` class with JSON loading                         | `RHYTHM_PATTERNS` flat array                             | Simpler, tree-shakeable, zero runtime overhead               |

**Deprecated:**

- `HybridPatternService.loadPatterns()` — async JSON fetch; replaced by Phase 22 synchronous `getPattern()` wrapper
- `rhythmConfig.patterns: ['quarter','half']` string arrays in unit files — replaced by `patternTags` in Phase 22

---

## Assumptions Log

| #   | Claim                                                                                                                                              | Section                                | Risk if Wrong                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A1  | 140 patterns (distributed as shown in count table) is a good target to hit 120+ minimum with buffer                                                | Standard Stack / Architecture Patterns | Low — could author fewer or more; 120 is the hard minimum from PAT-01                           |
| A2  | `id` field naming convention: `{tag}_{time-sig-slug}_{sequence}` e.g. `q_4_4_001`                                                                  | Architecture Patterns                  | Low — Phase 22 only needs uniqueness, not a specific format                                     |
| A3  | `measures` field value (1/2/4) will be used by Phase 22 generator to match pattern length to node type (Discovery=1, Practice=2, Boss=4) per UX-04 | Architecture Patterns                  | Medium — if Phase 22 uses a different mechanism, `measures` field is unused but harmless        |
| A4  | Multi-measure patterns (2 or 4 bars) concatenate the binary arrays (e.g. 2-bar 4/4 = 32 slots)                                                     | Architecture Patterns                  | Medium — Phase 22 may instead pick 2 separate 1-bar patterns; if so, only author 1-bar patterns |

**Note:** A3 and A4 concern design decisions that belong to Phase 22. The safest approach for Phase 21 is to author only 1-measure patterns (the minimum requirement for any game type) and let Phase 22 decide about multi-measure composition. This makes A3 and A4 moot.

---

## Open Questions

1. **Multi-measure patterns: author or compose at runtime?**
   - What we know: UX-04 (deferred to Phase 23) requires Discovery=1 bar, Practice=2 bars, Boss=4 bars
   - What's unclear: Phase 22 may compose multiple 1-bar patterns into longer sequences, OR the library may contain explicit multi-bar patterns
   - Recommendation: Author only 1-bar patterns for Phase 21. Phase 22 can compose them. This minimizes Phase 21 scope and avoids a design decision that belongs to Phase 22.

2. **Syncopation patterns — binary representation of tied-across-barline notes**
   - What we know: `binaryPatternToBeats()` treats consecutive 0s after a 1 as sustain. An eighth-quarter-eighth syncopation `[0,0,1,0,1,0,0,0, 0,0,1,0,1,0,0,0]` renders correctly.
   - What's unclear: Whether the games need to explicitly mark "tie-across-beat" notes for visual rendering (VexFlow ties)
   - Recommendation: Binary format handles this implicitly. Author syncopation patterns normally; Phase 22 renderer handles VexFlow tie rendering if needed.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is a pure data/authoring task. No external tools, services, databases, or CLIs beyond the existing Node.js + Vitest infrastructure (already confirmed available in the project).

---

## Validation Architecture

### Test Framework

| Property           | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| Framework          | Vitest (from package.json `npm run test:run`)             |
| Config file        | `vite.config.js` (Vitest configured inline)               |
| Quick run command  | `npx vitest run src/data/patterns/rhythmPatterns.test.js` |
| Full suite command | `npm run test:run`                                        |

### Phase Requirements to Test Map

| Req ID | Behavior                                    | Test Type | Automated Command                                         | File Exists? |
| ------ | ------------------------------------------- | --------- | --------------------------------------------------------- | ------------ |
| PAT-01 | `RHYTHM_PATTERNS.length >= 120`             | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | Wave 0       |
| PAT-01 | All pattern IDs unique                      | unit      | same                                                      | Wave 0       |
| PAT-01 | Every pattern is a valid binary array       | unit      | same                                                      | Wave 0       |
| PAT-01 | Pattern array length matches time signature | unit      | same                                                      | Wave 0       |
| PAT-02 | Every pattern has `tags.length >= 1`        | unit      | same                                                      | Wave 0       |
| PAT-02 | All tags are from the valid taxonomy        | unit      | same                                                      | Wave 0       |
| PAT-01 | Every pattern has at least one note onset   | unit      | same                                                      | Wave 0       |

### Sampling Rate

- **Per task commit:** `npx vitest run src/data/patterns/rhythmPatterns.test.js`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green + `npm run verify:trail` before closing

### Wave 0 Gaps

- [ ] `src/data/patterns/rhythmPatterns.js` — the library itself (Wave 0 creates this empty stub or first batch)
- [ ] `src/data/patterns/rhythmPatterns.test.js` — covers PAT-01, PAT-02 (skeleton in Code Examples above)

---

## Security Domain

Not applicable. This phase creates a static data file with no authentication, user input, network calls, or cryptographic operations. `security_enforcement` remains enabled globally but no ASVS categories apply to a pure data module.

---

## Sources

### Primary (HIGH confidence)

- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — binary pattern format, TIME_SIGNATURES, DURATION_CONSTANTS
- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` — consumer interface: `pattern.pattern` binary array
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — second consumer of same binary pattern interface
- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` — DURATION_TO_VEX mapping, binaryPatternToBeats function
- `src/components/games/rhythm-games/utils/durationInfo.js` — Node-safe constraint comment, DURATION_INFO with all VexFlow codes
- `src/data/units/rhythmUnit1-8Redesigned.js` — all 56 nodes, duration vocabularies per unit
- `.planning/phases/20-curriculum-audit/20-CURRICULUM-AUDIT.md` — locked duration introduction order, unit narratives, time signatures

### Secondary (MEDIUM confidence)

- `scripts/validateTrail.mjs` — Node-safe import constraint for build-time validators

### Tertiary (LOW confidence)

- Pattern count distribution table (A1 in assumptions) — estimated from curriculum coverage analysis

---

## Metadata

**Confidence breakdown:**

- Pattern object shape: HIGH — directly verified from consumer code in RhythmTapQuestion.jsx and ArcadeRhythmGame.jsx
- Tag taxonomy: HIGH — derived from locked curriculum audit document (LOCKED status)
- Pattern count target: MEDIUM — 120 is the hard requirement; distribution is estimated
- Multi-measure authoring question: LOW — depends on Phase 22 design decisions

**Research date:** 2026-04-11
**Valid until:** Until Phase 22 design decisions are locked (tag format and multi-measure approach may refine the library structure)
