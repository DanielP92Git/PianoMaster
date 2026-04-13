# Phase 31: Long-Press Sustain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 31-long-press-sustain
**Areas discussed:** Hold feedback UX, Release tolerance, Quarter note behavior, Tap area redesign

---

## Hold Feedback UX

| Option                 | Description                                                                                                       | Selected |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| Filling ring           | Circular progress ring fills around tap area as child holds — intuitive, works on mobile, clear completion signal | ✓        |
| Color fill from bottom | Tap area fills upward with color like a meter — simpler but less intuitive                                        |          |
| Pulsing glow only      | Tap area glows/pulses while held, no progress indicator                                                           |          |
| You decide             | Claude picks best visual approach                                                                                 |          |

**User's choice:** Filling ring
**Notes:** None

### Follow-up: Hold Audio

| Option               | Description                                                                                       | Selected |
| -------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Sustain sound        | Piano note rings for full hold duration — reinforces connection between hold and musical duration | ✓        |
| Short sound on press | Normal tap sound on press-down only                                                               |          |
| You decide           | Claude picks based on piano-like feel                                                             |          |

**User's choice:** Sustain sound
**Notes:** createPianoSound already supports duration parameter

---

## Release Tolerance

| Option      | Description                                                                             | Selected |
| ----------- | --------------------------------------------------------------------------------------- | -------- |
| 70% minimum | Must hold at least 70% of note duration. Half note at 120 BPM = 1.0s, so 0.7s is enough | ✓        |
| 50% minimum | Very forgiving — half the note duration is enough                                       |          |
| 85% minimum | Stricter — demands nearly full duration                                                 |          |
| You decide  | Claude picks threshold varying by node type                                             |          |

**User's choice:** 70% minimum
**Notes:** None

### Follow-up: Early Release

| Option           | Description                                                                  | Selected |
| ---------------- | ---------------------------------------------------------------------------- | -------- |
| Partial credit   | 40-69% = GOOD ("Almost!"), below 40% = MISS. Matches existing 3-tier scoring | ✓        |
| Binary pass/fail | Below 70% = MISS, above = PERFECT                                            |          |
| You decide       | Claude designs scoring tiers                                                 |          |

**User's choice:** Partial credit
**Notes:** Maps to existing PERFECT/GOOD/MISS categories

---

## Quarter Note Behavior

| Option                 | Description                                                                    | Selected |
| ---------------------- | ------------------------------------------------------------------------------ | -------- |
| Quarter = tap only     | Quarter notes stay as instant taps. Only half and whole require sustained hold | ✓        |
| All notes proportional | Every note requires proportional hold including quarters                       |          |
| You decide             | Claude decides based on learning experience                                    |          |

**User's choice:** Quarter = tap only
**Notes:** Creates clear pedagogical contrast between short and long notes

---

## Tap Area Redesign

| Option                   | Description                                                                        | Selected |
| ------------------------ | ---------------------------------------------------------------------------------- | -------- |
| Visual cue on hold notes | Tap area shows "HOLD" label + ring outline for hold notes, "TAP" for quarter notes | ✓        |
| Same area, ring appears  | Identical appearance, ring only shows on press-down                                |          |
| You decide               | Claude designs visual distinction                                                  |          |

**User's choice:** Visual cue on hold notes
**Notes:** Child knows what's expected before pressing

### Follow-up: Pulse Game Hold Signal

| Option                     | Description                                                              | Selected |
| -------------------------- | ------------------------------------------------------------------------ | -------- |
| Metronome cue changes      | Metronome visual stretches across multiple beat positions for hold notes | ✓        |
| Hold indicator on tap area | Tap area changes before hold beat arrives                                |          |
| You decide                 | Claude picks for pulse game design                                       |          |

**User's choice:** Metronome cue changes
**Notes:** Half note spans 2 beat positions visually — stretched indicator replaces single dot

---

## Claude's Discretion

- Ring animation implementation approach (CSS, SVG, canvas)
- Pointer event strategy
- How to determine next expected note in listen&tap
- Hold tolerance scaling by node type
- i18n keys for TAP/HOLD labels
- Dotted note hold behavior

## Deferred Ideas

None — discussion stayed within phase scope.
