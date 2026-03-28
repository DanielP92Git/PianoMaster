# Phase 9: Ear Training Games - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 09-ear-training-games
**Areas discussed:** Piano Keyboard Reveal, Higher/Lower Interaction, Step/Skip/Leap Teaching, Difficulty Progression

---

## Piano Keyboard Reveal

### Keyboard Size

| Option | Description | Selected |
|--------|-------------|----------|
| 1 octave context | Show ~1 octave centered around played notes, shifts to follow | ✓ |
| Full 2-octave range | Show entire C3-B4 range, notes highlighted wherever they fall | |
| Dynamic zoom | Show 2 octaves but zoom/highlight the region around played notes | |

**User's choice:** 1 octave context (Recommended)
**Notes:** Keeps it simple and large enough for small screens

### Highlight Style

| Option | Description | Selected |
|--------|-------------|----------|
| Color + label | Blue glow (note 1), orange glow (note 2), note name labels, direction arrow | ✓ |
| Animated sequential | Notes light up one at a time in play order | |
| Color only (minimal) | Just color the keys, no labels or arrows | |

**User's choice:** Color + label (Recommended)
**Notes:** Educational value — child sees note names and direction

---

## Higher/Lower Interaction

### Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Two big buttons | Large HIGHER/LOWER buttons side by side, arrow icons + text, glass card style | ✓ |
| Vertical stack | HIGHER on top, LOWER on bottom — spatial position matches meaning | |
| Swipe gesture | Swipe up/down — fun but less discoverable for 8-year-old | |

**User's choice:** Two big buttons (Recommended)
**Notes:** Simple, obvious, accessible, works in landscape

### Animated Direction Reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Arrow animation + keyboard | Button glows, keyboard slides in, notes highlight, animated arrow shows direction | ✓ |
| Floating text + color flash | Big floating direction text, button flash, no keyboard on this screen | |
| You decide | Claude picks based on keyboard reveal decision | |

**User's choice:** Arrow animation + keyboard
**Notes:** Connects the answer to the piano keyboard visual for educational reinforcement

---

## Step/Skip/Leap Teaching

### Teaching Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Inline hints on buttons | Term + visual hint permanently on each button (next door, jump one, far apart) | ✓ |
| Brief intro tutorial | 3-screen animated tutorial before first session, shown once, skippable | |
| Progressive reveal | Start with Step vs Leap only, introduce Skip after mastery | |

**User's choice:** Inline hints on buttons (Recommended)
**Notes:** No tutorial needed — learning happens by playing

### Button Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stack | Three full-width buttons stacked vertically, same as RhythmDictation pattern | ✓ |
| Horizontal row | Three buttons in a row, works in landscape but tight on portrait | |
| You decide | Claude picks based on layout and existing patterns | |

**User's choice:** Vertical stack (Recommended)
**Notes:** Matches RhythmDictationGame choice card pattern

### Interval Keyboard Reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Keyboard + interval label | Blue/orange highlights + dim in-between keys + interval name + sublabel explaining skipped notes | ✓ |
| Keyboard only (same as NoteComparison) | Identical reveal, no extra labeling | |
| You decide | Claude picks based on educational value and code reuse | |

**User's choice:** Keyboard + interval label (Recommended)
**Notes:** Reinforces what Step/Skip/Leap looks like on a keyboard

---

## Difficulty Progression

### NoteComparison Narrowing

| Option | Description | Selected |
|--------|-------------|----------|
| Tiered bands | Q1-3 wide (octave/7th/6th), Q4-7 medium (5th/4th/3rd), Q8-10 close (2nd/minor 2nd) | ✓ |
| Smooth random narrowing | Random within shrinking range, less predictable | |
| Adaptive (performance-based) | Narrow faster on streaks, widen on misses | |

**User's choice:** Tiered bands (Recommended)
**Notes:** Predictable difficulty curve, easy to tune per trail node

### IntervalGame Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Ascending-first split | First ~60% ascending only, last ~40% mixed ascending + descending | ✓ |
| Separate phases | First half all ascending, second half all descending | |
| Trail-node controlled | Each node explicitly configures direction | |

**User's choice:** Ascending-first split (Recommended)
**Notes:** Trail nodes can override to be all-descending for advanced nodes

### Session Length

| Option | Description | Selected |
|--------|-------------|----------|
| 10 questions | Matches all other game modes (~2-3 min per session) | ✓ |
| 8 questions | Shorter for mentally taxing ear training | |
| You decide | Claude picks based on existing patterns | |

**User's choice:** 10 questions (Recommended)
**Notes:** Consistent with NotesRecognition, SightReading, MetronomeTrainer

---

## Claude's Discretion

- SVG keyboard rendering approach
- Piano key dimensions and exact colors
- Arrow animation timing and easing
- Note pair selection algorithm within tiers
- Replay button placement
- Landscape layout adjustments
- Sound effects integration

## Deferred Ideas

None — discussion stayed within phase scope
