# Phase 07: Audio Architecture and Core Algorithm - Context

**Gathered:** 2026-02-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace naive autocorrelation with McLeod Pitch Method, consolidate three AudioContext instances into one shared provider, and fix audio chain configuration. The result: correct pitch identification (C4 registers as C4), reliable bass note detection, and noise rejection — without browser DSP corruption.

Game-layer scoring changes, metronome features, and MIDI input are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Noise & Environment
- Practice environment varies: sometimes quiet room, sometimes noisy living room
- Both acoustic piano and digital keyboard are used — mic must handle both signal types
- Missed real notes and false detections are **equally frustrating** — need to get both right
- Noise adaptation must be **automatic** — kid should never have to think about sensitivity settings
- No manual sensitivity toggle — the algorithm should adapt to ambient noise level on its own

### Detection Feedback (Sight Reading Game)
- **No visual pitch indicator** — just correct/incorrect. Keep it simple for an 8-year-old
- **SimplyPiano-style behavior for sight reading**: when wrong note or no note is played, pause the horizontal scroll progress and wait for the correct note. Accent on correct answers, not punishment for wrong notes. This is a real motivation problem, not nice-to-have.
- Applies to **sight reading game only** — Notes Recognition keeps its current behavior
- **Immediate resume** when correct note is played — no delay or "got it" animation
- **Just wait** on wrong note — no highlighting or hints. The notation already shows the note.
- **Infinite patience** — no help after N wrong attempts, no skip option. Must play correctly to proceed.
- **Scoring**: attempts matter — fewer attempts to get the right note = higher score. Encourages careful reading.
- Speed and accuracy balance for correct note feedback: **Claude's discretion**
- Uncertain/borderline note behavior: **Claude's discretion**

### Multi-note Handling
- Accidental double key presses happen **sometimes** (not frequent, not rare)
- Simultaneous note handling: **Claude's discretion** (kid-friendly approach)
- **Latest note wins** — if kid plays a note quickly after another, the most recent detection replaces the previous one. Allows self-correction.
- **Single notes only** for current games — chords may come in a future milestone
- **One detection per key press** — holding a note (sustain pedal or held key) counts as one event, never retriggered

### Session Continuity
- Kid follows the **trail** primarily, which switches between game types within one session
- Transition between trail nodes must feel **seamless** — no permission re-prompts, no mic restart delays
- **Release mic immediately** when leaving game pages (back to dashboard/trail) — no background listening
- **Ask mic permission again each game** if previously denied — fresh chance each time (kid may have accidentally denied)
- **Pause and resume** when app goes to background — detection picks up where it left off when kid returns (Phase 09 handles iOS-specific interruption recovery)
- Primary devices: **iPad (Safari) and Android tablet** — both platforms must work

### Claude's Discretion
- Speed vs accuracy balance for correct note feedback
- What happens when detection is uncertain/borderline
- Multi-note handling strategy (detect target vs detect loudest vs reject)
- Exact confidence threshold tuning
- Audio chain DSP configuration details
- McLeod Pitch Method parameter tuning

</decisions>

<specifics>
## Specific Ideas

- "Imitate SimplyPiano app behavior" — pause scroll on wrong note, resume immediately on correct note. This is the core UX reference for sight reading.
- Both acoustic piano and digital keyboard must work — the mic signal characteristics differ significantly between them.
- The kid practices on both iPad and Android tablet — cross-platform consistency matters.
- Wrong note handling is a real motivation problem — she gets discouraged when wrong notes feel punishing.

</specifics>

<deferred>
## Deferred Ideas

- **Metronome in sight reading game** — audible beat to help keep time during horizontal scroll. New capability, belongs in its own phase.
- **MIDI input support** — digital keyboard has MIDI available. Would be much more accurate than mic detection. New capability, future milestone.
- **Chord detection** — may be needed in a future milestone when exercises include chords. Not needed for current single-note exercises.
- **SimplyPiano scroll + scoring changes** — the pause-and-wait behavior and attempts-based scoring are game-layer changes that belong in Phase 08 (Detection Pipeline) rather than Phase 07 (audio architecture).

</deferred>

---

*Phase: 07-audio-architecture-core-algorithm*
*Context gathered: 2026-02-17*
