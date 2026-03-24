# Phase 1: Introductory Single-Note Game - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 01-introductory-single-note-game
**Areas discussed:** Game format, Visual presentation, Interaction & feedback, Scope & integration

---

## Game Format

### Core Mechanic

| Option | Description | Selected |
|--------|-------------|----------|
| Speed card | Note cards flash by at a pace. Child taps ONLY when target note appears. Wrong taps flash red, no punishment. Duolingo-kids vibes. | ✓ |
| Multiple-choice quiz | "Which of these is middle C?" — show 3-4 note options, child picks the right one. More traditional, lower energy. | |
| Both as phases | Start with quiz (teach), then speed card (test). Two mini-rounds in one session. | |

**User's choice:** Speed card
**Notes:** Recommended option accepted.

### Card Speed

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed speed, gets faster | Start at ~2 sec per card, gradually speed up as child scores more correct taps. | ✓ |
| Fixed speed throughout | Consistent ~1.5 sec per card for the whole session. | |
| You decide | Claude picks the best pacing approach. | |

**User's choice:** Fixed speed, gets faster
**Notes:** None

### Session Size

| Option | Description | Selected |
|--------|-------------|----------|
| 15 cards, ~40% target | 15 total cards, ~6 are middle C. Short, punchy. | |
| 20 cards, ~30% target | 20 total cards, ~6 are middle C. Longer session, more suspense. | |
| You decide | Claude picks based on age-appropriate attention span research. | ✓ |

**User's choice:** You decide
**Notes:** Claude's discretion for session sizing.

### Distractors

| Option | Description | Selected |
|--------|-------------|----------|
| Other real notes on the staff | Show D4, E4, F4, G4 etc. Child learns to distinguish C from nearby notes. | ✓ |
| Symbols/shapes (not notes) | Fun non-note images on staff lines. More playful, less educational. | |
| Mix of both | Some real notes, some silly shapes. | |

**User's choice:** Other real notes on the staff
**Notes:** Educational value prioritized.

---

## Visual Presentation

### Note Display

| Option | Description | Selected |
|--------|-------------|----------|
| Staff notation | Show note on treble clef staff. Consistent with other games. | ✓ |
| Flashcard style | Large colorful card with note name and small staff preview. | |
| Piano key highlight | Piano keyboard with relevant key highlighted. | |

**User's choice:** Staff notation
**Notes:** Recommended for consistency.

### Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Slide in from right | Cards slide right to left, conveyor belt feel. | ✓ |
| Flip/reveal | Card flips over to reveal note. More suspenseful. | |
| You decide | Claude picks smoothest animation for mobile. | |

**User's choice:** Slide in from right
**Notes:** None

---

## Interaction & Feedback

### Tap Mechanic

| Option | Description | Selected |
|--------|-------------|----------|
| Tap anywhere on screen | Big tap target. Easiest for 8-year-olds on mobile. | ✓ |
| Tap the card itself | Must tap directly on card. More precise. | |
| Dedicated 'Catch!' button | Large button at bottom. Clear affordance. | |

**User's choice:** Tap anywhere on screen
**Notes:** None

### Correct Tap Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Green flash + sound + score | Card flashes green, happy chime, score increments. | |
| Green flash + combo counter | Same + combo streak counter. Reuses NotesRecognition combo pattern. | ✓ |
| You decide | Claude picks best positive reinforcement. | |

**User's choice:** Green flash + combo counter
**Notes:** Reuse existing combo pattern.

### Wrong Tap Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Red flash, no penalty | Card flashes red, combo resets, no lives lost. As originally described. | ✓ |
| Red flash + gentle shake | Card flashes red AND screen shakes. Combo resets. | |
| Just skip to next card | Minimal feedback, card moves on faster. | |

**User's choice:** Red flash, no penalty
**Notes:** Recommended, matches original vision.

### Missed Target Note

| Option | Description | Selected |
|--------|-------------|----------|
| Card fades with a hint | Missed C card fades with "That was C!" label. Teaching moment. | |
| Just passes by silently | No indication. Lower stress. | |
| Brief highlight then fade | Card pulses as it exits, signaling missed opportunity. | |

**User's choice:** Other — "Decide based on game research what usually games use"
**Notes:** Claude's discretion based on common game patterns.

---

## Scope & Integration

### Node Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All single-note first nodes | Treble (C4), bass (C3), and rhythm first nodes. | |
| Only treble first node | Just treble_1_1 for now. | |
| All discovery nodes | Every NODE_TYPES.DISCOVERY node. | |

**User's choice:** Other — "treble and bass first nodes"
**Notes:** Treble_1_1 (C4) and bass first node (C3). Not rhythm.

### Integration Approach

| Option | Description | Selected |
|--------|-------------|----------|
| New exercise type | Add to EXERCISE_TYPES. New game component, new route. Clean separation. | ✓ |
| Variant of note_recognition | Add mode to existing config. Branch inside NotesRecognitionGame. | |
| You decide | Claude picks cleanest integration. | |

**User's choice:** New exercise type
**Notes:** Recommended for clean separation.

### Replace or Add

| Option | Description | Selected |
|--------|-------------|----------|
| Replace it | Speed card IS the first exercise. No more note_recognition on these nodes. | ✓ |
| Add before it | Speed card runs first, then note_recognition second. Two exercises per node. | |
| You decide | Claude picks based on research. | |

**User's choice:** Replace it
**Notes:** None

---

## Claude's Discretion

- Session card count and target-to-distractor ratio
- Missed note behavior (whether to hint, highlight, or silently pass)
- Speed ramp curve

## Deferred Ideas

- Speed card for rhythm first nodes (explicitly excluded)
- Multiple-choice quiz format (rejected in favor of speed card)
- Silly shapes as distractors (rejected for real notes)
- Adding as second exercise alongside note_recognition (rejected — replaces it)
