# Technology Stack: v2.9 Game Variety & Ear Training

**Project:** PianoApp2 (PianoMaster)
**Researched:** 2026-03-26
**Milestone:** v2.9 — Rhythm game variants (tap-along, dictation, arcade) + Ear Training trail path
**Overall confidence:** MEDIUM-HIGH

---

## What This Document Covers

Only NEW capabilities required by v2.9. The following are confirmed working and must NOT be re-researched or re-added:

- React 18, Vite 6, React Router v7
- Web Audio API (AudioContext, OscillatorNode, AudioBufferSourceNode, AnalyserNode)
- `useAudioEngine` — metronome, lookahead beat scheduler, piano pitch-shift from G4.mp3 via playbackRate
- `AudioContextProvider` — singleton shared AudioContext, iOS interruption recovery (`isInterrupted` state), suspend/resume lifecycle
- `useSounds` — one-shot game sounds (correct.mp3, wrong.mp3, drum-stick.mp3)
- `pitchy` — McLeod pitch detection for mic input
- `klavier` — keyboard input
- `framer-motion` v12 (currently imported as `framer-motion`)
- VexFlow v5 — SVG music notation with `RhythmPatternGenerator.js`
- Tailwind CSS 3, `lucide-react`, `react-confetti`, `react-hot-toast`
- `MetronomeTrainer` timing model (`BASE_TIMING_THRESHOLDS`, `calculateTimingThresholds`, `SCORING`)

---

## Recommended Stack Additions

### 1. Instrument Samples: `smplr`

**Install:** `npm install smplr`
**Version:** `^0.16.4` (latest as of March 2026; published approximately 1 month prior)
**Confidence:** MEDIUM — API confirmed via npm docs and GitHub README; AudioContext pass-through confirmed; exact gzipped JS bundle size not independently verified.

**Why smplr:**

The app needs realistic multi-instrument playback for ear training (note comparison, instrument recognition, interval identification) and rhythm dictation (play the pattern the student must notate or identify). The existing `useAudioEngine` can only play the G4.mp3 piano sample with pitch-shift via `playbackRate` — adequate for rhythm games, but insufficient for multi-instrument ear training.

Three options were evaluated:

**Tone.js** (v15.1.22, last published 10 months ago) is the most powerful Web Audio framework but creates its own AudioContext on module load. `Tone.setContext(ctx)` exists but must be called before any Tone.js nodes are created; nodes created before the context is set cannot connect to nodes created after (confirmed via Tone.js GitHub Issues #701, #1298). This creates a fragile initialization order dependency with `AudioContextProvider`. Tone.js also ships ~100KB gzipped for features (Transport, Synth, Effects chain, Sequencer) that this app does not need.

**Howler.js** (v2.x, 7KB gzipped) is lightweight and reliable for one-shot sound effects. It creates its own AudioContext. The app's `AudioContextProvider` handles iOS interruption recovery at the AudioContext level — a second AudioContext would bypass that recovery, creating a state divergence. Howler also has no built-in multi-octave pitch interpolation; each note would require its own pre-recorded file.

**smplr** (v0.16.4) is explicitly designed as the modern replacement for `soundfont-player` (by the same author, danigb). Its constructor signature is `new Instrument(audioContext, options)` — it accepts an existing `AudioContext` directly. The singleton from `AudioContextProvider` can be passed in and smplr will use it as-is, inheriting all iOS recovery and lifecycle management for free. smplr provides:
- `SplendidGrandPiano` — Steinway-quality multi-sampled piano (every note sampled, CDN-hosted)
- `Soundfont` — 128 General MIDI instruments (MusyngKite or FluidR3_GM) including violin, acoustic guitar, flute, trumpet
- `DrumMachine` — not needed for v2.9

Audio samples are CDN-streamed (not bundled), so the npm install cost is JS-only and small. Samples are cached via CacheStorage on second load.

**Use cases in v2.9:**

| Game | smplr Use |
|------|-----------|
| Rhythm tap-along | Not needed — existing `drum-stick.mp3` + `createMetronomeClick` covers tap feedback |
| Rhythm dictation | `SplendidGrandPiano` plays the rhythm pattern at pitch C4 (or a fixed pitch) |
| Ear training: note comparison (higher/lower) | `SplendidGrandPiano` plays two notes in sequence |
| Ear training: instrument recognition | `Soundfont` plays a single note across 4 instrument options |
| Ear training: interval identification | `SplendidGrandPiano` plays two notes as a harmonic or melodic interval |

**Integration pattern:**

```javascript
import { SplendidGrandPiano, Soundfont } from 'smplr';
import { useAudioContext } from '../contexts/AudioContextProvider';

// Inside a game component:
const { audioContextRef } = useAudioContext();
const pianoRef = useRef(null);

useEffect(() => {
  if (!audioContextRef.current) return;
  const piano = new SplendidGrandPiano(audioContextRef.current);
  piano.load().then(() => { pianoRef.current = piano; });
  return () => piano.stop?.();
}, []); // mount once; audioContextRef.current is stable after AudioContextProvider init

// Play a note (after load):
pianoRef.current?.start({ note: 'C4', velocity: 80 });
pianoRef.current?.stop({ note: 'C4', time: audioContextRef.current.currentTime + 1.5 });
```

**iOS note:** smplr uses the passed AudioContext, so `AudioContextProvider`'s `onstatechange` handler (covering iOS `interrupted` state) applies automatically. The `AudioInterruptedOverlay` pattern already in the app covers the user-gesture resume flow.

---

### 2. Timing: Extend `useAudioEngine` — No New Library

**Decision: add `scheduleBeatSequence` helper to existing `useAudioEngine`. Do not add WAAClock, Dilla, or Tone.js Transport.**

`useAudioEngine` already implements the canonical Web Audio lookahead scheduler (the "A Tale of Two Clocks" pattern from web.dev/audio-scheduling). It has:
- `audioContextRef.current.currentTime` for hardware-accurate timestamps
- `nextBeatTimeRef`, `schedulerIdRef` for beat sequencing
- `createMetronomeClick`, `createPatternSound`, `createPianoSound` with pitch control
- BPM-adaptive onset timing with `lookaheadTime` and `scheduleAheadTime`

What the new rhythm games need beyond this is a `scheduleBeatSequence(pattern, tempo, onBeat)` function: take a duration array, schedule audio events at each beat time via the existing scheduler, and fire a JS callback at each beat for UI state sync (highlight active beat, advance progress indicator). This is approximately 30 lines of code, not a new library.

The `MetronomeTrainer` timing model (`BASE_TIMING_THRESHOLDS`, `calculateTimingThresholds`, `SCORING`) is already the right pattern for tap scoring. Copy it into new game components; do not abstract until three or more games use identical logic.

**Why not Tone.js Transport:** Creates its own AudioContext (see rationale above). The Transport is excellent but not compatible with `AudioContextProvider`.

**Why not WAAClock:** Unmaintained (last GitHub commit 2018). Not an active npm package.

**Confidence:** HIGH — `useAudioEngine.js` source code is fully readable and the lookahead scheduler is textbook Web Audio API as documented by MDN and web.dev.

---

### 3. Arcade Rhythm Game Animation: CSS `transform` + `requestAnimationFrame` — No New Library

**Decision: Use Tailwind CSS `transform` classes on GPU-promoted elements, driven by a `requestAnimationFrame` game loop via `useRef`. Do NOT use framer-motion for the falling-note highway.**

The arcade rhythm game requires a continuous "note highway" — a vertical or horizontal lane where note tiles appear at the top and fall toward a tap zone. This is a frame-rate-sensitive continuous animation driven by elapsed time, not by React state transitions.

framer-motion (already installed) is the wrong tool for this specific animation:
- framer-motion animates React state/prop changes. A note highway requires frame-by-frame positional updates driven by a game clock, not React re-renders.
- Animating dozens of tiles through React state creates re-render overhead that can push frame timing past the 16ms budget, introducing jank visible in a rhythm game context.
- The app's performance benchmark from v1.7 was "85-95fps on Pixel 6" using direct Web Audio API. The same principle applies here: the game loop must not be mediated by React's render cycle.

The correct pattern is direct DOM mutation via refs within a `requestAnimationFrame` loop:

```javascript
const frameRef = useRef(null);
const noteTilesRef = useRef([]); // array of { el: DOMNode, spawnTime, targetTime }

const gameLoop = useCallback((timestamp) => {
  noteTilesRef.current.forEach((tile) => {
    const elapsed = timestamp - tile.spawnTime;
    const y = elapsed * FALL_SPEED_PX_PER_MS;
    tile.el.style.transform = `translateY(${y}px)`;
    // check hit zone vs audio time for scoring
  });
  frameRef.current = requestAnimationFrame(gameLoop);
}, []);

useEffect(() => {
  frameRef.current = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(frameRef.current);
}, [gameLoop]);
```

CSS `transform: translateY()` on elements with `will-change: transform` runs on the GPU compositor thread — the fastest animation path available in browsers, independent of JavaScript thread load. This is the same technique used by Guitar Hero web clones and the canonical approach per MDN's performance documentation.

**framer-motion is still used** for discrete event animations within the arcade game: score popup flyouts, combo burst effect, "on fire" badge entry/exit, game-over overlay — all React state-driven, not continuous.

**Confidence:** HIGH — `requestAnimationFrame` with direct DOM mutation via refs is standard web game loop technique per MDN game anatomy documentation. CSS compositor thread animation is well-established per MDN performance guides.

---

### 4. Rhythm Notation Display: VexFlow v5 (already installed) — No New Library

**Decision: Reuse VexFlow v5. Create a new `RhythmStaveRenderer` component for rhythm-only display.**

Rhythm dictation (hear-and-pick) needs to show 2-4 rhythm pattern choices as notation for the student to select from. The existing `SightReadingGame` already renders full staves with VexFlow; `RhythmPatternGenerator.js` already produces duration arrays compatible with VexFlow duration codes.

The only new capability needed is a **rhythm-only stave** (no pitch — all notes on middle line, stems forced UP). CLAUDE.md already documents this:
> "For rhythm-only displays, force `Stem.UP`; for pitch-based, let VexFlow calculate"

`RhythmStaveRenderer` is a thin component that maps a `RhythmPatternGenerator` output to VexFlow `StaveNote` objects with forced stem direction and a single pitch value. No new library needed.

**Confidence:** HIGH — VexFlow v5 source and guidelines are in the codebase.

---

### 5. Ear Training Audio Analysis: None Required

**Decision: No audio analysis library. Ear training games are listen-and-click, not microphone-analysis.**

All v2.9 ear training games follow a listen-and-respond model:
- Note comparison: two notes play sequentially; student taps "higher" or "lower" button
- Instrument recognition: one note plays; student picks the instrument name from four choices
- Interval identification: two notes play; student picks the interval name from choices

There is no microphone input in any ear training game. The student responds by tapping a button. This eliminates any need for Meyda, Essentia.js, TensorFlow.js, or any audio analysis library.

Frequency arithmetic for interval generation is pure math already implemented in `useAudioEngine.parseNoteToMidi` (MIDI note → frequency via `440 * 2^((midi - 69) / 12)`). Interval calculations are simple semitone arithmetic: a major third is +4 semitones, a perfect fifth is +7, etc.

**Confidence:** HIGH — game designs are confirmed listen-and-pick, requiring only audio playback and UI interaction.

---

## What NOT to Add

| Library | Reason to Exclude |
|---------|------------------|
| `tone` (Tone.js) | Creates its own AudioContext on import; `Tone.setContext()` has ordering constraints that conflict with `AudioContextProvider` singleton; 100+ KB gzipped for features not needed |
| `howler` | Creates its own AudioContext; bypasses iOS interruption recovery in `AudioContextProvider`; no multi-octave pitch interpolation |
| `@tonejs/piano` | Requires Tone.js as peer dep; last published 2023 (stale); same AudioContext conflict as Tone.js |
| `webaudiofont` | Wavetable approach adds complexity over smplr's sample approach; maintenance status unclear vs. smplr's recent 0.16.4 release |
| `soundfont-player` | Deprecated; smplr is the stated modern replacement by the same author (danigb) |
| `react-spring` | App already has framer-motion; two animation libraries is unnecessary bundle bloat |
| `WAAClock` / `Dilla` | Unmaintained; `useAudioEngine` already implements the identical lookahead scheduler pattern |
| `meyda` / `essentia.js` | Ear training games are listen-and-click; heavyweight DSP/ML not justified |
| `motion` (npm package) | `framer-motion` v12 is installed and working; migration to `motion/react` is a rename-only refactor with no v2.9 feature benefit |

---

## Summary of New Dependencies

| Package | Version | Purpose | Bundle Impact |
|---------|---------|---------|---------------|
| `smplr` | `^0.16.4` | Multi-instrument sample playback (SplendidGrandPiano, Soundfont with violin/guitar/flute/trumpet) | JS: small (library code only); audio samples are CDN-streamed, not bundled |

**Everything else is built using the existing stack.**

---

## Installation

```bash
npm install smplr
```

---

## Integration Points with Existing Architecture

### AudioContextProvider
All smplr instruments receive `audioContextRef.current` directly from `useAudioContext()`. The singleton guarantee, iOS `interrupted` state handler, and suspend/resume lifecycle apply without any modification to `AudioContextProvider`.

### useAudioEngine
Add `scheduleBeatSequence(pattern, tempo, onBeat)` for rhythm tap-along and dictation games. Existing `createPianoSound`, `createMetronomeClick`, and `createPatternSound` remain unchanged and are reused for tap/click feedback.

### VexFlow
Create `RhythmStaveRenderer` component using existing `DURATION_CONSTANTS` and `TIME_SIGNATURES` from `RhythmPatternGenerator.js`. Pattern: map duration array to VexFlow `StaveNote` objects with `Stem.UP` and a fixed pitch (e.g., `'b/4'` for middle-line display in treble clef).

### framer-motion
Use for discrete event animations in arcade game (score popups, combo bursts, on-fire badge). Do NOT use for the continuous note-highway falling animation — use `requestAnimationFrame` + `ref.style.transform` for that.

### Trail System
New exercise types (`RHYTHM_READING`, `RHYTHM_DICTATION`, `RHYTHM_ARCADE`, `EAR_NOTE_COMPARISON`, `EAR_INSTRUMENT_RECOGNITION`, `EAR_INTERVAL_ID`) follow the existing `EXERCISE_TYPES` constant pattern in `src/data/constants.js`. New game components accept trail state via `location.state` and follow the `hasAutoStartedRef` auto-start pattern established in `MetronomeTrainer`, `SightReadingGame`, and `MemoryGame`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|-----------|-------|
| smplr AudioContext pass-through API | MEDIUM | Confirmed from npm README and GitHub docs; not independently tested in this codebase |
| Lookahead scheduler extension | HIGH | `useAudioEngine.js` source fully readable; pattern is textbook Web Audio |
| requestAnimationFrame arcade loop | HIGH | Standard web game technique per MDN; no library dependency |
| VexFlow rhythm-only stave | HIGH | VexFlow v5 in codebase; CLAUDE.md documents the `Stem.UP` pattern |
| No audio analysis needed | HIGH | Game designs confirmed as listen-and-click |
| smplr instrument availability | MEDIUM | GM instrument names confirmed from soundfont-player INSTRUMENTS.md (same sample library); smplr's Soundfont class confirmed to support them |

---

## Sources

- [smplr npm package](https://www.npmjs.com/package/smplr) — v0.16.4, AudioContext constructor pattern
- [smplr GitHub (danigb/smplr)](https://github.com/danigb/smplr) — API: `new Instrument(context, options)`, `start({ note, velocity })`, instruments list
- [Tone.js AudioContext Wiki](https://github.com/Tonejs/Tone.js/wiki/AudioContext) — `setContext()` ordering constraint
- [Tone.js GitHub Issue #701](https://github.com/Tonejs/Tone.js/issues/701) — `setContext` not updating `Tone.context` reliably
- [A Tale of Two Clocks (web.dev)](https://web.dev/articles/audio-scheduling) — authoritative lookahead scheduler pattern
- [MDN Web Audio API Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — iOS autoplay/resume requirements
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — game loop timing
- [MDN CSS and JavaScript animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) — `will-change: transform` compositor thread
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide) — framer-motion → motion/react rename
- [Howler.js](https://howlerjs.com/) — 7KB, confirmed creates own AudioContext
- [Tone.js npm](https://www.npmjs.com/package/tone) — v15.1.22, last published 10 months ago
- [soundfont-player INSTRUMENTS.md](https://github.com/danigb/soundfont-player/blob/master/INSTRUMENTS.md) — GM instrument names available in MusyngKite/FluidR3_GM
- `C:/Development/PianoApp2/package.json` — installed dependencies (HIGH confidence — direct read)
- `C:/Development/PianoApp2/src/hooks/useAudioEngine.js` — scheduler, pitch-shift, `createPianoSound` (HIGH confidence — direct read)
- `C:/Development/PianoApp2/src/contexts/AudioContextProvider.jsx` — singleton pattern, iOS interruption handling (HIGH confidence — direct read)
- `C:/Development/PianoApp2/src/features/games/hooks/useSounds.js` — existing one-shot sound pattern (HIGH confidence — direct read)

---

*Stack research for: v2.9 Game Variety & Ear Training — PianoApp2*
*Researched: 2026-03-26*
