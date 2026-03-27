# Phase 8: Audio Infrastructure + Rhythm Games - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 08-audio-infrastructure-rhythm-games
**Areas discussed:** Scrolling cursor mechanic, Rhythm audio sound, Dictation card layout, Piano sample scope

---

## Scrolling Cursor Mechanic

| Option | Description | Selected |
|--------|-------------|----------|
| Moving highlight | Staff stays fixed, glowing vertical line sweeps left-to-right across notes in sync with tempo | ✓ |
| Scrolling staff | Staff scrolls left while a fixed hit zone stays centered (Guitar Hero style) | |
| Hybrid | Static for 1-bar, scrolling for 3+ bars | |

**User's choice:** Moving highlight (Recommended)
**Notes:** Child sees full pattern at once. Simpler to build. Works well for 1-2 measure patterns.

### Follow-up: Measures visible

| Option | Description | Selected |
|--------|-------------|----------|
| 1 measure | One bar at a time, 10 exercises per session | ✓ |
| 2 measures | Two bars visible side by side | |

**User's choice:** 1 measure (Recommended)

### Follow-up: Count-in style

| Option | Description | Selected |
|--------|-------------|----------|
| Both audio + visual | Metronome clicks + "3, 2, 1, GO!" countdown numbers | ✓ |
| Audio + metronome dots | Clicks with small dot indicators (like MetronomeTrainer) | |
| You decide | Claude picks | |

**User's choice:** Both audio + visual (Recommended)

### Follow-up: Tap feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Floating text + note color | Text floats up, note changes color (green/yellow/red) | ✓ |
| Bottom judgment bar | Judgment display at bottom of screen | |
| You decide | Claude picks | |

**User's choice:** Floating text + note color (Recommended)

---

## Rhythm Audio Sound

| Option | Description | Selected |
|--------|-------------|----------|
| Metronome click | Reuse existing useAudioEngine metronome click | |
| Drum hit | Use drum-stick.mp3 sample | |
| Piano single pitch | Play a piano note (e.g., C4) for each beat | ✓ |
| You decide | Claude picks | |

**User's choice:** Piano single pitch
**Notes:** More musical feel. Requires usePianoSampler to be built first.

### Follow-up: Tap audio feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, tap sound | Soft click/pop on each tap, separate from pattern audio | ✓ |
| No separate tap sound | Tapping is silent, feedback is visual only | |
| You decide | Claude picks | |

**User's choice:** Yes, tap sound (Recommended)

### Follow-up: Dictation autoplay

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-play + replay button | Pattern plays automatically, replay button available | ✓ |
| Play button first | Child must press Play to hear the pattern | |
| You decide | Claude picks | |

**User's choice:** Auto-play + replay button (Recommended)

---

## Dictation Card Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stack | Full-width cards stacked vertically | ✓ |
| 2x2 grid | Four cards in a 2x2 grid | |
| Horizontal row | Cards side by side in a horizontal row | |

**User's choice:** Vertical stack (Recommended)

### Follow-up: Number of choices

| Option | Description | Selected |
|--------|-------------|----------|
| 3 choices | 1 correct + 2 distractors (33% chance) | ✓ |
| 4 choices | 1 correct + 3 distractors (25% chance) | |
| Progressive (3→4) | Start with 3, increase to 4 for harder patterns | |

**User's choice:** 3 choices (Recommended)

### Follow-up: Correct/wrong feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight + replay correct | Correct card glows green, wrong dims, correct pattern replays | ✓ |
| Simple highlight only | Green/red highlight, no replay | |
| You decide | Claude picks | |

**User's choice:** Highlight + replay correct (Recommended)

---

## Piano Sample Scope

| Option | Description | Selected |
|--------|-------------|----------|
| 2 octaves C3-B4 | 24 chromatic notes, covers bass and treble | ✓ |
| 3 octaves C3-B5 | 36 chromatic notes, wider range | |
| 1 octave C4-B4 | 12 notes, minimal | |
| You decide | Claude picks | |

**User's choice:** 2 octaves C3-B4 (Recommended)

### Follow-up: Sample source

| Option | Description | Selected |
|--------|-------------|----------|
| Generate via Web Audio | Synthesize piano-like tones with oscillator + harmonics | ✓ |
| Pre-recorded MP3 samples | Source royalty-free real piano samples | |
| You decide | Claude picks | |

**User's choice:** Generate via Web Audio (Recommended)

### Follow-up: Loading strategy

| Option | Description | Selected |
|--------|-------------|----------|
| On-demand synthesis | Create oscillator each time playNote() is called | ✓ |
| Pre-generate + cache | Render all 24 notes to AudioBuffers on first call | |
| You decide | Claude picks | |

**User's choice:** On-demand synthesis (Recommended)

---

## Claude's Discretion

- ADSR envelope shape for synthesized piano tones
- Harmonic ratios for piano-like timbre
- Tap click sound design
- VexFlow rendering approach for notation cards
- Distractor generation algorithm
- Floating text animation details
- Cursor glow visual style
- i18n key naming convention

## Deferred Ideas

None — discussion stayed within phase scope
