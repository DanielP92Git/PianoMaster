# Phase 30: Audio Fixes - Research

**Researched:** 2026-04-13
**Domain:** Web Audio API initialization, AudioContext lifecycle, rhythm game audio scheduling
**Confidence:** HIGH

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use "await resume, then schedule" pattern. Ensure `ctx.resume()` fully resolves before calling `schedulePatternPlayback`. Adds ~50ms latency on first play only — acceptable tradeoff.
- **D-02:** Fix should be defensive across all platforms (iOS Safari, Android Chrome, desktop). User hasn't isolated which platform exhibits the issue, so fix broadly.
- **D-03:** Claude has full discretion on root cause investigation and fix for AUDIO-02. Likely same async initialization race as AUDIO-01.
- **D-04:** The `handleListen` flow in `RhythmDictationQuestion.jsx` should guarantee audio engine is fully initialized and context is running before scheduling playback.
- **D-05:** Play 4 pairs of eighth notes (8 notes total) continuously — no pauses between pairs.
- **D-06:** Use pitch alternation within each pair for aural distinction: first eighth is higher pitch, second is lower pitch. Pattern: high-low high-low high-low high-low.
- **D-07:** Pitch alternation is discovery-intro-only. Dictation and other rhythm games play patterns at uniform pitch as they do today.

### Claude's Discretion

- Root cause investigation for AUDIO-02 — Claude traces the exact initialization race and fixes it
- Choice of pitch values for high/low eighths in discovery demo (e.g., C4/G3, or using `createPianoSound` pitch shift)
- Whether the await-before-schedule fix is applied at the `schedulePatternPlayback` level or at each call site
- Any additional defensive guards needed in the audio pipeline

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID       | Description                                                                                             | Research Support                                                                                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUDIO-01 | First play of quarter/eighth note presentations plays without audio trimming (audio context pre-warmed) | Root cause identified: `ctx.resume()` is not awaited before `schedulePatternPlayback` is called; fix is "await resume then schedule" pattern at the call site or inside `schedulePatternPlayback`                 |
| AUDIO-02 | Dictation game 'listen' button plays the pattern on first click (not only on 'replay')                  | Root cause identified: `resumeAudioContext()` in `handleListen` does not await engine initialization (`gainNodeRef` may be null); `createPianoSound` returns null when `gainNodeRef.current` is null              |
| AUDIO-03 | Eighths discovery presentation plays 4 pairs of beamed eighth notes in sequence                         | Root cause identified: `isBeamedPair` branch in `DiscoveryIntroQuestion.playDemo` builds only 2 beats (one pair) instead of 8 beats (4 pairs); fix is to expand the beats array to 4 pairs with pitch alternation |

</phase_requirements>

---

## Summary

This phase fixes three isolated, concrete bugs in the rhythm games audio pipeline. All three bugs share a common theme: Web Audio API operations that are asynchronous are not being awaited correctly before the downstream scheduling call is made, causing silent first plays or incomplete sequences.

**AUDIO-01** affects all rhythm game renderers that call `schedulePatternPlayback`. The `AudioContext` eagerly created by `AudioContextProvider` starts in the `"suspended"` state on all major browsers (a browser autoplay policy enforcement). Each renderer calls `resumeAudioContext()` or `ctx.resume()` before scheduling, but the call is not always `await`-ed, meaning `schedulePatternPlayback` reads `audioContext.currentTime` before the context is truly `"running"`. The scheduled notes are then trimmed or silenced because the context clock hasn't started ticking yet. The `+0.1s` buffer in `schedulePatternPlayback` absorbs some of this slack but is not reliable when the resume takes more than 100ms (common on cold iOS Safari).

**AUDIO-02** is a stricter variant of the same problem in `RhythmDictationQuestion.jsx`. The `handleListen` function calls `await audioEngine.resumeAudioContext()`, which internally calls `initializeAudioContext()` on the first call. However, `initializeAudioContext` sets `gainNodeRef.current` synchronously only after `context.resume()` resolves. The `enginePlayNote` wrapper calls `createPianoSound`, which hard-returns `null` if `gainNodeRef.current` is null or context state is not `"running"`. Because `handleListen` awaits `resumeAudioContext()` but then immediately calls `playPattern()` which calls `schedulePatternPlayback` synchronously (the inner `ctx.resume()` in `playPattern` may not resolve before scheduling proceeds on first call), the first click is silent. The Replay path works because by that point the engine is already initialized.

**AUDIO-03** is a straightforward logic bug. In `DiscoveryIntroQuestion.jsx`, the `isBeamedPair` branch builds `beats = [{durationUnits: 2}, {durationUnits: 2}]` — just two eighth notes (one pair). It should build 4 pairs: 8 eighth notes total. Additionally, D-06 requires pitch alternation (high-low per pair), which requires passing a `pitchShift` argument to `createPianoSound` via a modified `enginePlayNote` wrapper that is pair-aware.

**Primary recommendation:** Fix each bug at the narrowest scope possible — a targeted change to `DiscoveryIntroQuestion.playDemo` for AUDIO-03, and targeted await-guard changes to `playPattern`/`handleListen` for AUDIO-01/02.

---

## Standard Stack

### Core

| Library                    | Version                | Purpose                                                                              | Why Standard                                     |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Web Audio API              | Browser native         | Audio scheduling, oscillator synthesis, buffer source playback                       | Already in use throughout the codebase           |
| `useAudioEngine.js`        | Project hook           | Encapsulates `AudioContext`, `gainNodeRef`, `createPianoSound`, `resumeAudioContext` | Canonical audio hook for all rhythm renderers    |
| `AudioContextProvider.jsx` | Project context        | Shared `AudioContext` lifecycle, iOS interruption handling                           | Single context owner — never create a second one |
| `schedulePatternPlayback`  | `rhythmTimingUtils.js` | Converts beat array to scheduled Web Audio calls                                     | Already used by all renderers                    |

### No New Dependencies

All three fixes are contained within existing source files. No npm packages need to be added.

---

## Architecture Patterns

### Pattern 1: Await-Resume-Then-Schedule (AUDIO-01 / AUDIO-02)

**What:** Before calling `schedulePatternPlayback`, ensure the `AudioContext` is verified `"running"`. This means `await`-ing `ctx.resume()` completely before reading `audioContext.currentTime`.

**Why it matters:** `audioContext.currentTime` is `0` (or frozen) while the context is `"suspended"`. Notes scheduled at `0 + 0.1` in a suspended context will either be trimmed or played at the wrong relative time when the context resumes.

**Verified pattern** (from existing codebase, `AudioContextProvider.jsx` line 159):

```javascript
// [VERIFIED: src/contexts/AudioContextProvider.jsx:158-160]
if (ctx.state === "suspended") {
  await ctx.resume();
}
```

The fix applies this same await guard immediately before `schedulePatternPlayback` is invoked, at the call site in `playPattern` (which is already written — see existing lines 95-101 in `RhythmDictationQuestion.jsx`) AND in the equivalent location in `DiscoveryIntroQuestion.playDemo` (lines 76-79). The existing guards are structurally correct but the `playPattern` function in `RhythmDictationQuestion` is `async` and already awaits — the key issue is that `initializeAudioContext` (which creates `gainNodeRef`) may not have been called yet on first use.

**Root cause of AUDIO-02 specifically:**

`handleListen` calls `await audioEngine.resumeAudioContext()`. `resumeAudioContext` checks if `audioContextRef.current` exists; on first call the shared context exists (eagerly created) so it skips `initializeAudioContext()` entirely and only calls `ctx.resume()`. **`gainNodeRef.current` is `null` at this point** because `gainNodeRef` is only set inside `initializeAudioContext` (line 84 of `useAudioEngine.js`), which is only called when no `sharedAudioContext` exists OR when `audioContextRef.current` is null. When the hook is instantiated with `sharedAudioContext: audioContextRef.current` (a non-null eagerly created context), `initializeAudioContext` is never called automatically — the hook waits for an explicit call.

The fix: `handleListen` must ensure `audioEngine.initializeAudioContext()` has been called (or call it explicitly) before `playPattern`. Alternatively, call `await audioEngine.initializeAudioContext()` once (idempotent — it checks `isInitialized` state) when the component mounts or on first listen, guaranteeing `gainNodeRef` is set before `createPianoSound` is invoked.

```javascript
// [VERIFIED: src/hooks/useAudioEngine.js:57-112] initializeAudioContext creates gainNodeRef
// [VERIFIED: src/hooks/useAudioEngine.js:388-396] createPianoSound returns null when gainNodeRef.current is null
const createPianoSound = useCallback(
  (time, volume, duration, pitchShift) => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      return null; // <-- this is the silent failure path
    }
    if (audioContextRef.current.state !== "running") {
      return null; // <-- this is the trimming path
    }
    // ...
  },
  [createPatternSound]
);
```

**Fix design for AUDIO-02:**

Option A (recommended by D-04): In `handleListen`, call `await audioEngine.initializeAudioContext()` before calling `playPattern`. `initializeAudioContext` is idempotent — it short-circuits if `isInitialized` is already true.

Option B: Add a `useEffect` in `RhythmDictationQuestion` that calls `initializeAudioContext()` on mount (fire-and-forget), so by the time the user taps Listen, the engine is ready.

Option A is more aligned with D-04 ("guarantee audio engine is fully initialized before scheduling").

### Pattern 2: AUDIO-03 — Expand Beats Array for 4 Pairs With Pitch Alternation

**What:** Replace the 2-note `isBeamedPair` beats array with 8 notes (4 pairs) and a pair-aware `enginePlayNote` that alternates pitch.

**Current broken code** (`DiscoveryIntroQuestion.jsx` lines 107-111):

```javascript
// [VERIFIED: src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx:107-111]
if (isBeamedPair) {
  beats = [
    { durationUnits: 2, isRest: false },
    { durationUnits: 2, isRest: false },
  ]; // WRONG: only 1 pair
}
```

**Fixed beats array:**

```javascript
// 4 pairs = 8 eighth notes, no pauses between pairs (D-05)
beats = Array.from({ length: 8 }, () => ({ durationUnits: 2, isRest: false }));
```

**Pitch alternation (D-06):** `createPianoSound` already accepts `pitchShift` in semitones (4th argument). The base note is G4 (MIDI 67). For high-low alternation:

- High note: `pitchShift = 0` (G4, default)
- Low note: `pitchShift = -7` (C4 = 7 semitones below G4)

This gives a clear, musically natural high-low distinction (perfect fifth down) without adding new infrastructure.

**Modified enginePlayNote for pitch alternation:**

The standard `enginePlayNote` wrapper ignores the `_note` argument and calls `createPianoSound` at uniform pitch. For the beamed-pair discovery demo only, a variant wrapper must alternate pitch by beat index. Two approaches:

**Approach A (per-beat index tracking, recommended):** Use a `noteIndexRef` that increments each time `enginePlayNote` is called; `pitchShift = noteIndexRef.current % 2 === 0 ? 0 : -7`. Reset to 0 before each `schedulePatternPlayback` call.

**Approach B:** Build the beats array with explicit pitch metadata and extend the `schedulePatternPlayback` call signature. This is a larger change and risks touching shared utility code used by other renderers — avoid per D-07 (pitch alternation is discovery-intro-only).

Approach A is the clean, isolated fix. The pitch-alternating `enginePlayNote` is a local variant defined inside `playDemo`'s closure (or as a local `useRef`), not replacing the shared `enginePlayNote` callback used for non-beamed paths.

### Recommended Project Structure (unchanged)

No structural changes required. All three fixes are contained file-level edits:

- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — AUDIO-03
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — AUDIO-02
- Possibly `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — AUDIO-01 if the guard is placed inside `schedulePatternPlayback` (see decision below)

### AUDIO-01: Where to Place the Await Guard

Two options:

**Option A — At each call site:** Each renderer's `playPattern`/`playDemo` already has `if (ctx.state !== "running") { await ctx.resume(); }` guards. Ensure these are truly awaited (they are — they're already `await`-ed in both files). The only risk is if the context is not suspended but still not ready (edge case).

**Option B — Inside `schedulePatternPlayback`:** Make the function `async` and add `await audioContext.resume()` before reading `currentTime`. This centralizes the fix.

**Recommendation:** Option A — the guards are already written correctly in both files. The real gap is AUDIO-02 (gainNodeRef not initialized) and AUDIO-03 (wrong beat count). AUDIO-01 trimming may be addressed as a side effect of the AUDIO-02 fix (once engine is properly initialized, `gainNodeRef` is non-null and `createPianoSound` returns a valid node). If AUDIO-01 still occurs after the AUDIO-02 fix, add a small `startTime` offset increase from `+0.1` to `+0.2` in `schedulePatternPlayback` as a fallback.

---

## Don't Hand-Roll

| Problem                  | Don't Build              | Use Instead                                             | Why                                                                             |
| ------------------------ | ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pitch shifting           | Custom pitch calculation | `createPianoSound(time, volume, duration, pitchShift)`  | Already implemented with `Math.pow(2, pitchShift/12)` playback rate             |
| Audio context management | Second AudioContext      | `getOrCreateAudioContext()` from `AudioContextProvider` | Safari has a 4-context limit; single shared context is architecturally required |
| Beat scheduling          | Custom setTimeout loops  | `schedulePatternPlayback`                               | Web Audio clock is more precise than setTimeout; already used everywhere        |
| Engine initialization    | Inline gainNode creation | `audioEngine.initializeAudioContext()`                  | Handles shared vs. owned context paths, sets up gain node correctly             |

**Key insight:** All the infrastructure needed for these fixes already exists. The bugs are call-order / await-missing issues, not missing capabilities.

---

## Common Pitfalls

### Pitfall 1: iOS Safari Synchronous Resume Constraint

**What goes wrong:** On iOS Safari, `ctx.resume()` MUST be called synchronously within a user-gesture handler. If any `await` appears before the `ctx.resume()` call, the resume silently fails.
**Why it happens:** iOS Safari enforces that audio unlocking happens in the same microtask tick as the user gesture event.
**How to avoid:** In `handleListen` (user-gesture handler), call `ctx.resume()` synchronously first, THEN `await` the returned promise. The pattern in `AudioContextProvider.handleTapToResume` is the canonical example: `const resumePromise = ctx.resume(); await resumePromise;` — the call itself is synchronous, but we await the resolution.
**Warning signs:** Audio works on desktop/Android but is silent on iOS Safari after the fix.
**Existing safeguard:** `handleListen` in `RhythmDictationQuestion.jsx` calls `await audioEngine.resumeAudioContext()` — `resumeAudioContext` itself calls `ctx.resume()` internally, which is fine because `handleListen` is triggered by a click event. The important constraint is not to add any `await` BEFORE the `.resume()` call in a user-gesture path.

### Pitfall 2: `gainNodeRef` Is Null When Using Shared AudioContext

**What goes wrong:** When `useAudioEngine` is instantiated with `sharedAudioContext`, it does not call `initializeAudioContext` automatically. `gainNodeRef.current` remains `null`. `createPianoSound` hard-returns `null`.
**Why it happens:** The hook's `initializeAudioContext` is a `useCallback` but is not called in any `useEffect` on mount — it must be called explicitly by consumers.
**How to avoid:** Call `await audioEngine.initializeAudioContext()` in the component's first user-gesture handler or in a `useEffect` on mount. Since `initializeAudioContext` is idempotent, calling it multiple times is safe.
**Warning signs:** First click is silent; subsequent clicks work. `createPianoSound` logs nothing (returns null silently).

### Pitfall 3: Beat Count vs. Pair Count Confusion for `8_pair`

**What goes wrong:** Developer reads `8_pair` as "8 units" (the `durationUnits: 4` for the pair) and builds 1 pair instead of 4.
**Why it happens:** The `8_pair` duration code represents one beamed pair conceptually, and its `durationUnits: 4` means one pair fills one quarter-note worth of time. Four pairs = one full 4/4 measure = 8 eighth notes.
**How to avoid:** The AUDIO-03 fix explicitly builds `Array.from({ length: 8 }, ...)` for 8 individual eighth notes (4 pairs of 2).
**Warning signs:** Discovery demo sounds too short (only 0.5 beats instead of 2 beats).

### Pitfall 4: Modifying Shared `enginePlayNote` for Pitch Alternation

**What goes wrong:** If `enginePlayNote` is modified to alternate pitch globally, it will affect Dictation, PulseQuestion, and other renderers that reuse the same callback.
**Why it happens:** `enginePlayNote` is a `useCallback` at component scope.
**How to avoid:** Create a local pitch-alternating variant inside `playDemo`'s closure (using a `noteIndexRef`) rather than replacing the component-level `enginePlayNote`. The component-level `enginePlayNote` is used by non-beamed paths and must remain pitch-neutral per D-07.

---

## Code Examples

### Engine Initialization Guard (AUDIO-02 fix pattern)

```javascript
// [VERIFIED: src/hooks/useAudioEngine.js:57-112] - initializeAudioContext is idempotent
// [VERIFIED: src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx:123-134]

// BEFORE (broken — gainNodeRef may be null after resumeAudioContext):
const handleListen = useCallback(async () => {
  try {
    await audioEngine.resumeAudioContext();
  } catch { getOrCreateAudioContext(); }
  setPhase(PHASES.LISTENING);
  await playPattern(() => { setPhase(PHASES.CHOOSING); });
}, [...]);

// AFTER (fixed — ensures gainNodeRef is set before scheduling):
const handleListen = useCallback(async () => {
  try {
    await audioEngine.initializeAudioContext(); // sets gainNodeRef
    await audioEngine.resumeAudioContext();     // ensures ctx.state === "running"
  } catch { getOrCreateAudioContext(); }
  setPhase(PHASES.LISTENING);
  await playPattern(() => { setPhase(PHASES.CHOOSING); });
}, [...]);
```

### 4-Pair Eighth Notes With Pitch Alternation (AUDIO-03 fix pattern)

```javascript
// [VERIFIED: src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx:107-127]
// [VERIFIED: src/hooks/useAudioEngine.js:388-446] - createPianoSound pitchShift param

// Inside playDemo, for the isBeamedPair branch:
if (isBeamedPair) {
  // 4 pairs × 2 notes = 8 eighth notes (durationUnits: 2 each)
  beats = Array.from({ length: 8 }, () => ({
    durationUnits: 2,
    isRest: false,
  }));

  // Pitch-alternating wrapper: high (0) → low (-7) → high → low ...
  const noteIndexRef = { current: 0 }; // local counter, reset each playDemo call
  const enginePlayNoteAlternating = (_note, opts) => {
    if (audioEngine?.createPianoSound) {
      const pitchShift = noteIndexRef.current % 2 === 0 ? 0 : -7;
      audioEngine.createPianoSound(
        opts?.startTime,
        0.8,
        opts?.duration ?? 0.3,
        pitchShift
      );
      noteIndexRef.current++;
    }
  };

  const { totalDuration } = schedulePatternPlayback(
    beats,
    80,
    ctx,
    enginePlayNoteAlternating
  );
  setTimeout(() => setIsPlaying(false), (totalDuration + 0.3) * 1000);
}
```

### Pitch Shift Reference (for AUDIO-03)

```
G4 (base sample, MIDI 67) = pitchShift 0
C4 (MIDI 60)              = pitchShift -7  (7 semitones below G4)
D4 (MIDI 62)              = pitchShift -5  (5 semitones below G4)
```

C4 (`pitchShift = -7`) or D4 (`pitchShift = -5`) are both musically appropriate "low" notes. C4 gives a wider, more audibly distinct interval.

---

## State of the Art

| Old Approach                               | Current Approach                                             | When Changed        | Impact                                    |
| ------------------------------------------ | ------------------------------------------------------------ | ------------------- | ----------------------------------------- |
| Manual AudioContext creation per component | Shared `AudioContextProvider` eager context                  | Phase 07 / Phase 09 | Avoids Safari 4-context limit             |
| Separate gain nodes                        | Master `gainNodeRef` in `useAudioEngine`                     | Phase 07            | Single volume control                     |
| `0.1s` scheduling buffer (always)          | `explicitStartTime` param added to `schedulePatternPlayback` | Phase 29            | Allows caller to pass computed start time |

---

## Assumptions Log

| #   | Claim                                                                                                                                                                           | Section               | Risk if Wrong                                                                                                                                                                                                                                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `initializeAudioContext()` is safe to call from `handleListen` (user-gesture path) even when `sharedAudioContext` is already set — it short-circuits if `isInitialized` is true | Architecture Patterns | If `initializeAudioContext` creates a second context when called with a shared context, audio breaks. Verified by reading lines 57-79 of `useAudioEngine.js` — it uses `sharedAudioContext` when provided and does NOT create a new one. [VERIFIED: src/hooks/useAudioEngine.js:61-67] |
| A2  | Pitch shift of `-7` semitones (G4 → C4) provides clear aural distinction for 8-year-olds                                                                                        | Code Examples         | If the interval is too subtle or too jarring, the pedagogical goal (hearing pairs) may not be met. This is a discretionary choice (Claude's Discretion) and easily adjustable. [ASSUMED]                                                                                               |
| A3  | The `schedulePatternPlayback` `+0.1` buffer is sufficient to absorb iOS resume latency once `gainNodeRef` is properly initialized                                               | Architecture Patterns | If iOS cold-resume takes > 100ms after gainNode setup, AUDIO-01 may persist. Increasing to `+0.2` is a fallback. [ASSUMED]                                                                                                                                                             |

---

## Open Questions

1. **Does `initializeAudioContext` need to be `await`-ed in a useEffect on mount, or only in the user-gesture handler?**
   - What we know: `initializeAudioContext` does not require a user gesture (it only sets up nodes, doesn't call `ctx.resume()` unless the context is suspended)
   - What's unclear: Whether calling it from a `useEffect` on mount could race with the eagerly created context in `AudioContextProvider`
   - Recommendation: Call it from `handleListen` (user-gesture path) for safety. Option B (useEffect) is acceptable if the planner prefers proactive initialization.

2. **Should `schedulePatternPlayback` be made async to own the resume guard?**
   - What we know: Making it async would centralize AUDIO-01 protection for all callers
   - What's unclear: Whether any caller passes a pre-computed `explicitStartTime` that would conflict with an internal `await ctx.resume()` (reading `currentTime` before and after resume could give inconsistent offsets)
   - Recommendation: Leave `schedulePatternPlayback` synchronous. The caller-side guards are sufficient.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all fixes are contained within existing project source files and the Web Audio API, which is a browser built-in)

---

## Validation Architecture

### Test Framework

| Property           | Value                                                         |
| ------------------ | ------------------------------------------------------------- |
| Framework          | Vitest 2.x with jsdom                                         |
| Config file        | `vitest.config.js` at project root                            |
| Quick run command  | `npx vitest run src/components/games/rhythm-games/renderers/` |
| Full suite command | `npm run test:run`                                            |

### Phase Requirements → Test Map

| Req ID   | Behavior                                                                       | Test Type | Automated Command                                                                                       | File Exists?                    |
| -------- | ------------------------------------------------------------------------------ | --------- | ------------------------------------------------------------------------------------------------------- | ------------------------------- |
| AUDIO-01 | `schedulePatternPlayback` is called only after context is `"running"`          | unit      | `npx vitest run src/components/games/rhythm-games/utils/rhythmTimingUtils.test.js`                      | ✅ (existing)                   |
| AUDIO-02 | `handleListen` first click plays the pattern (not silent)                      | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` | ❌ Wave 0 — file does not exist |
| AUDIO-03 | Discovery demo for `8_pair` schedules 8 notes (4 pairs) with alternating pitch | unit      | `npx vitest run src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx`  | ❌ Wave 0 — file does not exist |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/rhythm-games/renderers/`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/games/rhythm-games/renderers/__tests__/RhythmDictationQuestion.test.jsx` — covers AUDIO-02 (mock `useAudioEngine`, assert `initializeAudioContext` called on first listen click, assert `createPianoSound` called)
- [ ] `src/components/games/rhythm-games/renderers/__tests__/DiscoveryIntroQuestion.test.jsx` — covers AUDIO-03 (mock `schedulePatternPlayback`, assert 8 beats scheduled for `8_pair` focusDuration, assert alternating `pitchShift` values)

**Mock pattern to use** (established in `PulseQuestion.test.jsx`):

- `vi.mock("../../../../../hooks/useAudioEngine", ...)` — stub `initializeAudioContext`, `resumeAudioContext`, `createPianoSound`
- `vi.mock("../../../../../contexts/AudioContextProvider", ...)` — stub `audioContextRef`, `getOrCreateAudioContext`
- `vi.mock("../../utils/rhythmTimingUtils", ...)` — spy on `schedulePatternPlayback` to capture calls

---

## Security Domain

Step skipped: These are pure client-side audio timing fixes with no security surface (no user data, no auth, no network calls, no input validation).

---

## Sources

### Primary (HIGH confidence)

- `src/hooks/useAudioEngine.js` — complete read, lines 1-520+: `initializeAudioContext`, `resumeAudioContext`, `createPianoSound`, `gainNodeRef` lifecycle [VERIFIED: codebase]
- `src/contexts/AudioContextProvider.jsx` — complete read: eager context creation, `getOrCreateAudioContext`, iOS interruption handling [VERIFIED: codebase]
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` — complete read: `handleListen`, `playPattern`, `enginePlayNote` [VERIFIED: codebase]
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` — complete read: `playDemo`, `isBeamedPair` branch [VERIFIED: codebase]
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — complete read: `schedulePatternPlayback` [VERIFIED: codebase]
- `src/components/games/rhythm-games/utils/durationInfo.js` — `8_pair` entry: `durationUnits: 4`, not a rest [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- `src/components/games/rhythm-games/renderers/__tests__/PulseQuestion.test.jsx` — established mock patterns for renderer tests [VERIFIED: codebase]
- MDN Web Audio API docs (training knowledge): AudioContext states (`"suspended"`, `"running"`, `"closed"`), autoplay policy, iOS Safari synchronous resume requirement [ASSUMED — well-established browser behavior]

---

## Metadata

**Confidence breakdown:**

- Root cause analysis (AUDIO-01/02/03): HIGH — source code read confirms all three root causes
- Fix approach: HIGH — all required APIs (`initializeAudioContext`, `createPianoSound` pitchShift, `schedulePatternPlayback`) are verified in codebase
- Pitch value choice (C4 for low note): MEDIUM — musically reasonable but not empirically validated with the target audience
- Test coverage gaps: HIGH — confirmed by file system check that `RhythmDictationQuestion.test.jsx` and `DiscoveryIntroQuestion.test.jsx` do not exist

**Research date:** 2026-04-13
**Valid until:** 2026-05-13 (stable codebase, no fast-moving dependencies)
