# Phase 30: Audio Fixes - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 3 audio playback bugs in rhythm games so sounds play reliably on first interaction: no trimming on first play, dictation listen works on first click, and eighths discovery plays all 4 pairs.

</domain>

<decisions>
## Implementation Decisions

### Audio Pre-Warming (AUDIO-01)

- **D-01:** Use "await resume, then schedule" pattern. Ensure `ctx.resume()` fully resolves before calling `schedulePatternPlayback`. Adds ~50ms latency on first play only — acceptable tradeoff.
- **D-02:** Fix should be defensive across all platforms (iOS Safari, Android Chrome, desktop). User hasn't isolated which platform exhibits the issue, so fix broadly.

### Dictation First-Click (AUDIO-02)

- **D-03:** Claude has full discretion on root cause investigation and fix. Likely same async initialization race as AUDIO-01 — `resumeAudioContext` may not fully initialize `gainNodeRef` before `createPianoSound` is called through `enginePlayNote` wrapper.
- **D-04:** The `handleListen` flow in `RhythmDictationQuestion.jsx` should guarantee audio engine is fully initialized and context is running before scheduling playback.

### Eighths Discovery Sequence (AUDIO-03)

- **D-05:** Play 4 pairs of eighth notes (8 notes total) continuously — no pauses between pairs.
- **D-06:** Use pitch alternation within each pair for aural distinction: first eighth is higher pitch, second is lower pitch. Pattern: high-low high-low high-low high-low.
- **D-07:** Pitch alternation is discovery-intro-only. Dictation and other rhythm games play patterns at uniform pitch as they do today.

### Claude's Discretion

- Root cause investigation for AUDIO-02 — Claude traces the exact initialization race and fixes it
- Choice of pitch values for high/low eighths in discovery demo (e.g., C4/G3, or using `createPianoSound` pitch shift)
- Whether the await-before-schedule fix is applied at the `schedulePatternPlayback` level or at each call site
- Any additional defensive guards needed in the audio pipeline

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements

- `.planning/REQUIREMENTS.md` -- AUDIO-01, AUDIO-02, AUDIO-03 definitions and acceptance criteria

### Audio Infrastructure

- `src/contexts/AudioContextProvider.jsx` -- Shared AudioContext lifecycle, eager creation, iOS interruption handling
- `src/hooks/useAudioEngine.js` -- Web Audio hook: `resumeAudioContext`, `createPianoSound`, `initializeAudioContext`, gain node setup
- `src/hooks/usePianoSampler.js` -- Oscillator-based note synthesis (NOT sample-based), `playNote` function
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` -- `schedulePatternPlayback` function (lines 359-382), uses `audioContext.currentTime + 0.1` buffer

### Bug Locations

- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` -- AUDIO-02: `handleListen` function (line ~123), `playPattern` function (line ~85), `enginePlayNote` wrapper
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` -- AUDIO-03: `playDemo` function (line ~59), `isBeamedPair` branch (line ~107) builds only 2 beats instead of 8

### Roadmap

- `.planning/ROADMAP.md` -- Phase 30 definition and success criteria (lines 225-237)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `schedulePatternPlayback(beats, tempo, ctx, playNote)` — central scheduling function, already handles beat arrays with `durationUnits` and `isRest` fields
- `AudioContextProvider` — eagerly creates AudioContext, provides `getOrCreateAudioContext()` fallback
- `useAudioEngine.resumeAudioContext()` — handles both initialization and resume, returns boolean success
- `createPianoSound(time, volume, duration, pitchShift)` — supports `pitchShift` parameter in semitones (can be used for high/low alternation in AUDIO-03)

### Established Patterns

- All rhythm renderers use the `enginePlayNote` wrapper pattern: wrap `createPianoSound` in a callback matching `usePianoSampler.playNote` signature, pass to `schedulePatternPlayback`
- AudioContext resume is called before scheduling in all game components, but not always awaited properly
- `createPianoSound` returns `null` when context state !== "running" or gainNode is null — this is the likely cause of silent first plays

### Integration Points

- `DiscoveryIntroQuestion.jsx` — only place that builds custom beat arrays for discovery demos; AUDIO-03 fix is isolated here
- `RhythmDictationQuestion.jsx` — self-contained FSM; AUDIO-02 fix is isolated here
- AUDIO-01 may need a cross-cutting fix in `schedulePatternPlayback` or `useAudioEngine` to ensure context is running before scheduling

</code_context>

<specifics>
## Specific Ideas

- User wants the 8_pair discovery demo to have **alternating pitch** (high-low pattern) so the child can hear each pair as distinct even without pauses. This is a pedagogical choice — it helps children perceive the beamed pair grouping aurally.
- The `createPianoSound` pitch shift parameter already exists and can be leveraged for this without building new audio infrastructure.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

_Phase: 30-audio-fixes_
_Context gathered: 2026-04-13_
