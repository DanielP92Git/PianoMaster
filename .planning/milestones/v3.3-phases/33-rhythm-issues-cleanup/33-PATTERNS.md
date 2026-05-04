# Phase 33: Rhythm Issues Cleanup — Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 9 work-streams (audio prewarm hook, central duration filter, ArcadeRhythmGame migration, variety rule, contingent boss UX, contingent speed-pool data, unit data audit, rate-limit migration deploy, eighths discovery contingency)
**Analogs found:** 9 / 9

This phase is heavy on **modifications** to existing files and one **new shared hook** (D-13). Most "files to be created/modified" are data audits in unit files, narrowly-scoped logic edits in the pattern generator, and one optional new component (boss intro overlay, contingent on D-18). Per the verify-first principle in CONTEXT.md, the pattern map is biased toward "copy from these existing analogs" rather than greenfield design.

## File Classification

| Work Item                                                                                             | Role                 | Data Flow                | Closest Analog                                                                                | Match Quality                                     |
| ----------------------------------------------------------------------------------------------------- | -------------------- | ------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `src/hooks/useEnsureAudioReady.js` (NEW, D-13)                                                        | hook / utility       | request-response (await) | `src/hooks/useAudioEngine.js` (`resumeAudioContext`, `isReady`)                               | role-match (hook composing existing engine)       |
| `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx` (MOD, D-13 integration)     | renderer / component | request-response         | self — `handleListen` already implements partial pattern (lines 122-135)                      | exact (extending in place)                        |
| `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` (MOD, D-13/D-15 integration) | renderer / component | request-response         | `RhythmDictationQuestion.jsx:122-135` (handleListen)                                          | exact                                             |
| `src/data/patterns/RhythmPatternGenerator.js` (MOD, D-09 filter, D-12 rest cleanup)                   | utility / pure       | transform                | self — `resolveByTags()` already filters via `patternNeedsRests` (lines 243-245)              | exact                                             |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` (MOD, D-09 + Stash Chunk A salvage)          | component / game     | event-driven (RAF)       | `MixedLessonGame.jsx:208-240` (resolveByTags integration)                                     | role-match (different host, same resolution call) |
| `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` variety rule (MOD, D-10)                     | component            | transform                | self — `lastPatternRef` + binary signature dedup (lines 195, 360-390)                         | exact (extending in place)                        |
| `src/components/games/rhythm-games/BossIntroOverlay.jsx` (NEW, D-18 contingent)                       | overlay / component  | one-shot                 | `src/components/orientation/RotatePromptOverlay.jsx` + `CountdownOverlay.jsx`                 | role-match (full-screen overlay w/ animated text) |
| `src/components/games/VictoryScreen.jsx` (MOD, D-18 boss VFX, contingent)                             | component            | event-driven             | self — already branches via `celebrationData.isBoss` (line 571) and renders `BossUnlockModal` | exact (existing branch point)                     |
| `src/data/units/rhythmUnit{1..8}Redesigned.js` (MOD, D-08/D-11/D-12)                                  | data / config        | static                   | `rhythmUnit1Redesigned.js:36-88` (rhythm_1_1 node template)                                   | exact                                             |
| Speed nodes cumulative tags (MOD, D-19 contingent)                                                    | data / config        | static                   | `rhythmUnit3Redesigned.js:316-372` (boss_rhythm_3 cumulative `patternTags`)                   | exact (data-shape copy)                           |
| Rate-limit migration deploy (D-07)                                                                    | ops / deploy         | one-shot                 | `package.json` scripts (no existing supabase script) → use `npx supabase db push` directly    | partial — no in-repo precedent                    |

---

## Pattern Assignments

### 1. `src/hooks/useEnsureAudioReady.js` — NEW shared prewarm hook (D-13)

**Role:** custom hook
**Data flow:** request-response (async, idempotent)

**Analogs:**

- `src/hooks/useAudioEngine.js:217-238` — `resumeAudioContext` (the wrappee)
- `src/hooks/useAudioEngine.js:251-257` — `isReady` (post-condition check)
- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx:548-573` — `startFlow` (the "good" caller pattern: await resume → warmup oscillator → schedule)
- `src/components/games/rhythm-games/renderers/RhythmDictationQuestion.jsx:122-135` — `handleListen` (the buggy caller pattern that needs replacement)

**Existing imports pattern in audio-using renderers** (RhythmDictationQuestion.jsx:13-21):

```javascript
import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioEngine } from "../../../../hooks/useAudioEngine";
import { useAudioContext } from "../../../../contexts/AudioContextProvider";
import { schedulePatternPlayback } from "../utils/rhythmTimingUtils";
```

**Wrappee — `useAudioEngine.resumeAudioContext`** (useAudioEngine.js:217-238):

```javascript
const resumeAudioContext = useCallback(async () => {
  if (!audioContextRef.current) {
    const initialized = await initializeAudioContext();
    if (!initialized) return false;
  }
  try {
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return true;
  } catch (err) {
    setError(`Failed to resume audio context: ${err.message}`);
    return false;
  }
}, [initializeAudioContext]);
```

**Wrappee — `useAudioEngine.isReady`** (useAudioEngine.js:251-257):

```javascript
const isReady = useCallback(() => {
  return (
    audioContextRef.current !== null &&
    gainNodeRef.current !== null &&
    audioContextRef.current.state === "running"
  );
}, []);
```

**Reference caller — PulseQuestion.startFlow** (PulseQuestion.jsx:548-573, the "good" pattern to formalize):

```javascript
const startFlow = useCallback(async () => {
  if (hasStartedRef.current) return;
  hasStartedRef.current = true;
  try {
    await audioEngine.resumeAudioContext();
  } catch {
    getOrCreateAudioContext();
  }
  // Prime the audio pipeline with a silent oscillator so the first
  // real click isn't swallowed by an uninitialized output buffer.
  try {
    const ctx = audioEngine.audioContextRef?.current;
    if (ctx) {
      const warmup = ctx.createOscillator();
      const silentGain = ctx.createGain();
      silentGain.gain.setValueAtTime(0, ctx.currentTime);
      warmup.connect(silentGain);
      silentGain.connect(ctx.destination);
      warmup.start(ctx.currentTime);
      warmup.stop(ctx.currentTime + 0.01);
    }
  } catch { /* Non-critical — first tick may still be quiet */ }
  // ... then schedule playback
}, [...]);
```

**What to copy:** the await-resume-then-warmup-oscillator sequence verbatim. Also wrap `loadPianoSound()` await (per RESEARCH §4 fix candidate (a)) so the buffer is decoded before scheduling. Final post-condition: `if (!audioEngine.isReady()) return false`.

**What to change:** package as a callable returned from a hook, not duplicated per-renderer. Suggested signature (Discretion):

```javascript
// useEnsureAudioReady.js — composes useAudioEngine internals
export function useEnsureAudioReady(audioEngine, getOrCreateAudioContext) {
  return useCallback(async () => {
    try {
      await audioEngine.resumeAudioContext();
      if (audioEngine.loadPianoSound) await audioEngine.loadPianoSound();
    } catch {
      getOrCreateAudioContext?.();
    }
    // Warmup oscillator (copy from PulseQuestion.startFlow lines 560-573)
    const ctx = audioEngine.audioContextRef?.current;
    if (ctx) {
      try {
        const w = ctx.createOscillator();
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        w.connect(g);
        g.connect(ctx.destination);
        w.start(ctx.currentTime);
        w.stop(ctx.currentTime + 0.01);
      } catch {
        /* noop */
      }
    }
    return audioEngine.isReady?.() ?? !!ctx;
  }, [audioEngine, getOrCreateAudioContext]);
}
```

**Note:** `useAudioEngine` does NOT currently expose `loadPianoSound` in its return object (line 1195+). The hook either needs `loadPianoSound` added to the returned API, OR the new hook calls `initializeAudioContext` (which fires `loadPianoSoundAsync` internally — fire-and-forget, doesn't help with the race). Per RESEARCH §4 (a), making the await blocking is the recommended fix; that requires either (i) exporting `loadPianoSound` or (ii) adding an `awaitPianoBuffer` flag to `initializeAudioContext`.

---

### 2. `RhythmDictationQuestion.jsx` — D-13 integration (MOD)

**Role:** renderer / component
**Data flow:** request-response (Listen click → audio playback → state transition)

**Self-analog — current `handleListen`** (RhythmDictationQuestion.jsx:122-135):

```javascript
const handleListen = useCallback(async () => {
  try {
    await audioEngine.initializeAudioContext(); // D-03/D-04: sets gainNodeRef before scheduling
    await audioEngine.resumeAudioContext(); // D-01: ensures ctx.state === "running"
  } catch {
    getOrCreateAudioContext();
  }
  setPhase(PHASES.LISTENING);
  await playPattern(() => {
    setPhase(PHASES.CHOOSING);
  });
}, [audioEngine, getOrCreateAudioContext, playPattern]);
```

**Replacement pattern (D-13):**

```javascript
const ensureAudioReady = useEnsureAudioReady(
  audioEngine,
  getOrCreateAudioContext
);

const handleListen = useCallback(async () => {
  const ready = await ensureAudioReady();
  if (!ready) {
    // Surface a fallback "audio unavailable" message OR retry once
    return;
  }
  setPhase(PHASES.LISTENING);
  await playPattern(() => setPhase(PHASES.CHOOSING));
}, [ensureAudioReady, playPattern]);
```

**What to copy from self:** `playPattern` body (lines 85-120) is unchanged — it already correctly awaits `ctx.resume()` defensively at lines 95-101.

**What to change:** swap the explicit `initializeAudioContext + resumeAudioContext` calls for the new hook. The hook covers both legs plus the warmup-oscillator and `loadPianoSound` await that the current code is missing.

---

### 3. `DiscoveryIntroQuestion.jsx` — D-13 / D-15 integration (MOD)

**Role:** renderer / component
**Data flow:** request-response (Listen click → demo playback)

**Analog:** same as #2 above. `playDemo` mirrors `handleListen` — same race surface (per RESEARCH §4 Issue 1/4 trace).

**What to copy:** same `useEnsureAudioReady()` integration. Apply at the entry of `playDemo()` (line ~59 per RESEARCH).

**What to change for D-15 (contingent eighths fix):** if user retest confirms `focusDuration: '8'` (Unit 8 node 8_1) trim, extend the existing `8_pair` branch (DiscoveryIntroQuestion.jsx:108-141 per RESEARCH) to either (a) reuse the same 4-pair-with-pitch-alternation for `'8'`, OR (b) add a `mode: 'pairs' | 'plain'` config flag. Preferred: option (a) by changing `rhythmUnit8Redesigned.js` node 8_1's `focusDurations` from `["8"]` to `["8_pair"]` — pure data edit.

---

### 4. `src/data/patterns/RhythmPatternGenerator.js` — D-09 central duration filter (MOD)

**Role:** utility / pure (Node-safe)
**Data flow:** transform (tags → pattern)

**Self-analog — existing rest filter inside `resolveByTags`** (RhythmPatternGenerator.js:231-263):

```javascript
export function resolveByTags(tags, durations, options = {}) {
  const { allowRests = false, timeSignature: tsFilter } = options;

  let matching = RHYTHM_PATTERNS.filter((p) =>
    tags.every((tag) => p.tags.includes(tag))
  );

  if (tsFilter) {
    matching = matching.filter((p) => p.timeSignature === tsFilter);
  }

  // When rests are not allowed, filter out patterns that would produce rest codes
  if (!allowRests) {
    matching = matching.filter((p) => !patternNeedsRests(p.pattern, durations));
  }

  if (matching.length === 0) return null;

  const selected = matching[Math.floor(Math.random() * matching.length)];
  const vexDurations = binaryToVexDurations(
    selected.pattern,
    durations,
    selected.timeSignature
  );

  return { patternId: selected.id, binary: selected.pattern, ... };
}
```

**Where the D-09 duration filter slots in:** between the rest-filter (line 243-245) and the random selection (line 249). Add a step that filters out patterns whose binary would resolve to a duration not in the node's allowed `durations`.

**Concrete insertion:**

```javascript
// D-09: Enforce node-allowed durations — drop any pattern whose vex resolution
// would emit a duration code outside the node's allowed set.
if (!allowRests) {
  matching = matching.filter((p) => !patternNeedsRests(p.pattern, durations));
}

// NEW (D-09): require the resolved vex output to be a subset of `durations`
matching = matching.filter((p) => {
  const vex = binaryToVexDurations(p.pattern, durations, p.timeSignature);
  return vex.every((code) => durations.includes(code));
});

if (matching.length === 0) return null;
```

**What to copy:** the existing pattern of "filter via helper, drop empties, then random-pick". Same structure for `resolveByAnyTag` (lines 279-310) — apply the identical filter there.

**What to change:** `binaryToVexDurations` is invoked twice per match in this approach (once for filter, once for return). Acceptable — pure function, small inputs. Alternative: cache the result. Per Discretion: "whether the filter goes inside `resolveByTags()` or wraps it" — recommend INSIDE, mirroring the rest-filter precedent.

**D-12 rest-pool cleanup is the data-side counterpart:** in `src/data/patterns/rhythmPatterns.js`, remove rest-bearing pattern variants from the `quarter-half`, `quarter-only`, and `dotted-half` tag pools (or remove the tag from those entries). Verify the audit list in RESEARCH §3 (e.g., `qh_44_002` onsets 2/3 — leading rest; `qh_44_003` onsets 1/2 — trailing rest).

---

### 5. `ArcadeRhythmGame.jsx` — Stash Chunk A salvage (D-09 integration via tag-based resolver)

**Role:** game component
**Data flow:** event-driven (per-pattern fetch on session advance)

**Analog — `MixedLessonGame.jsx` rhythm_dictation branch** (MixedLessonGame.jsx:26, 208-237):

Imports (line 26):

```javascript
import {
  resolveByTags,
  resolveByAnyTag,
} from "../../../data/patterns/RhythmPatternGenerator";
```

Resolution call (lines 208-217):

```javascript
const cfg = buildRhythmTapConfig();
const node = getNodeById(nodeId);
const rc = node?.rhythmConfig;
const resolver = rc?.patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
const result = resolver(rc?.patternTags || [], rc?.durations || ["q"], {
  timeSignature: rc?.timeSignature || "4/4",
});
if (result) {
  const beats = binaryPatternToBeats(result.binary);
  // ...
}
```

**Current ArcadeRhythmGame `fetchNewPattern`** (ArcadeRhythmGame.jsx:360-390):

```javascript
const fetchNewPattern = useCallback(async () => {
  const MAX_VARIETY_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_VARIETY_RETRIES; attempt++) {
    try {
      const result = await getPattern(
        timeSignatureStr,
        difficulty,
        rhythmPatterns
      );
      if (!result || !result.pattern) return null;

      // D-02: Reject consecutive identical patterns (compare binary signature)
      const signature = result.pattern.join(",");
      if (
        attempt < MAX_VARIETY_RETRIES &&
        signature === lastPatternRef.current
      ) {
        continue; // Re-roll
      }
      lastPatternRef.current = signature;
      const beats = binaryPatternToBeats(result.pattern);
      return beats;
    } catch (err) {
      console.warn("[ArcadeRhythmGame] fetchNewPattern error:", err);
      return null;
    }
  }
  return null;
}, [timeSignatureStr, difficulty, rhythmPatterns]);
```

**Migration shape (Stash Chunk A — recommended salvage):**

```javascript
// Add at top alongside getPattern import:
import {
  resolveByTags,
  resolveByAnyTag,
} from "../../../data/patterns/RhythmPatternGenerator";

// Derive from nodeConfig.rhythmConfig (already in scope via getNodeById(nodeId)):
const node = getNodeById(nodeId);
const rc = node?.rhythmConfig;
const patternTags = rc?.patternTags ?? [];
const patternTagMode = rc?.patternTagMode ?? "all";
const nodeDurations = rc?.durations ?? ["q"];

const fetchNewPattern = useCallback(async () => {
  const MAX_VARIETY_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_VARIETY_RETRIES; attempt++) {
    let result;
    if (patternTags.length > 0) {
      const resolver =
        patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
      result = resolver(patternTags, nodeDurations, {
        timeSignature: timeSignatureStr,
      });
      // result shape: { binary, vexDurations, ... }
    } else {
      // Fallback to OLD path for legacy/free-play
      const old = await getPattern(
        timeSignatureStr,
        difficulty,
        rhythmPatterns
      );
      result = old?.pattern ? { binary: old.pattern } : null;
    }
    if (!result?.binary) return null;
    const signature = result.binary.join(",");
    if (attempt < MAX_VARIETY_RETRIES && signature === lastPatternRef.current)
      continue;
    lastPatternRef.current = signature;
    return binaryPatternToBeats(result.binary);
  }
  return null;
}, [
  patternTags,
  patternTagMode,
  nodeDurations,
  timeSignatureStr,
  difficulty,
  rhythmPatterns,
]);
```

**What to copy from MixedLessonGame:** the `patternTagMode === "any" ? resolveByAnyTag : resolveByTags` selector and the `binaryPatternToBeats(result.binary)` adapter. Both already proven in production.

**What to change:** keep `getPattern` as the fallback when `patternTags` is empty (preserves backward compatibility for any non-trail or untagged path). Keep the `lastPatternRef` D-02 dedup loop verbatim.

**Risk:** test file `ArcadeRhythmGame.test.js` mocks `getPattern`. If the new path is taken (when `patternTags` exists), tests must also mock `resolveByTags`/`resolveByAnyTag`. RESEARCH R3 confirms this is low risk if mocks cover both.

---

### 6. `ArcadeRhythmGame.jsx` variety rule with per-duration coverage (D-10)

**Role:** game component
**Data flow:** transform (session-level pattern selection)

**Self-analog — existing `lastPatternRef` machinery** (ArcadeRhythmGame.jsx:195, 372-381):

```javascript
const lastPatternRef = useRef(null); // Track last pattern's binary signature for D-02 variety enforcement

// in fetchNewPattern:
const signature = result.pattern.join(",");
if (
  attempt < MAX_VARIETY_RETRIES &&
  signature === lastPatternRef.current
) {
  continue; // Re-roll
}
lastPatternRef.current = signature;
```

**Extension for D-10 ("≥1 pattern per declared duration per session"):** add a session-level `seenDurationsRef` that tracks which of `rhythmConfig.durations` have appeared in any picked pattern so far. After picking pattern N (where N is near the end of the session), if any duration in `nodeDurations` is missing from `seenDurationsRef`, force a re-roll constrained to patterns containing that duration.

**Concrete shape (Discretion: rejection-sample-then-fill chosen):**

```javascript
const seenDurationsRef = useRef(new Set()); // D-10: per-session duration coverage
// Reset on session start (alongside lastPatternRef reset)

// Inside fetchNewPattern, after lastPatternRef accept:
const vex = result.vexDurations || []; // available from resolveByTags result
vex.forEach((d) => seenDurationsRef.current.add(d));

// After accepting, if this is the LAST slot of the session and coverage is incomplete:
const missing = nodeDurations.filter((d) => !seenDurationsRef.current.has(d));
const remainingSlots = TOTAL_PATTERNS - currentPatternIndex;
if (missing.length > 0 && remainingSlots <= missing.length) {
  // Reject this pick and re-roll constrained to a pattern that contains `missing[0]`
  // (filter resolveByTags result manually or call resolveByTags with a sub-tag if available)
}
```

**What to copy:** the ref-based session counter pattern (line 195) and the retry-loop topology (lines 363-389). Both already proven for D-02.

**What to change:** add the `vexDurations`-based coverage check. Note that `resolveByTags` already returns `vexDurations` in its result shape (RhythmPatternGenerator.js:260), so no additional work is needed to introspect a pattern.

---

### 7. `BossIntroOverlay.jsx` — NEW boss UX overlay (D-18 contingent)

**Role:** overlay / component
**Data flow:** one-shot (mount → 2-second display → unmount)

**Analogs:**

- `src/components/orientation/RotatePromptOverlay.jsx:21-127` — full-screen `fixed inset-0 z-[9999]` overlay with framer-motion fade + reduced-motion branch
- `src/components/games/rhythm-games/components/CountdownOverlay.jsx:14-42` — minimal full-screen overlay with `aria-live` region and `text-yellow-400`/`text-green-400` color tokens
- `src/components/games/shared/AudioInterruptedOverlay.jsx:50-120` — modal-style glassmorphism card with `bg-white/90 backdrop-blur-sm`, ARIA dialog role
- `src/components/celebrations/BossUnlockModal.jsx:1-50` — boss celebration patterns: gold/amber confetti colors `['#FFD700', '#FFC107', '#FFA000', '#FFFFFF', '#FFE082']`, `Trophy`/`Crown` icons, fanfare sound on user gesture

**RotatePromptOverlay structure to copy** (RotatePromptOverlay.jsx:21-30):

```jsx
import { motion, AnimatePresence } from "framer-motion";
import { useMotionTokens } from "../../utils/useMotionTokens";
import { useAccessibility } from "../../contexts/AccessibilityContext";

return (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      dir={isRTL ? "rtl" : "ltr"}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 flex flex-col items-center justify-center gap-8 px-4"
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {t("...")}
      </div>
      {reducedMotion ? <StaticContent /> : <motion.div animate={...}>...</motion.div>}
    </motion.div>
  </AnimatePresence>
);
```

**CountdownOverlay color/animate pattern to adapt** (CountdownOverlay.jsx:23-37):

```jsx
const colorClass = isGo ? "text-green-400" : "text-yellow-400";
const pulseClass = reducedMotion ? "" : "animate-pulse";

return (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
    aria-live="polite"
    aria-atomic="true"
    role="status"
  >
    <div
      className={`text-3xl font-bold ${colorClass} ${pulseClass} select-none`}
    >
      {displayText}
    </div>
  </div>
);
```

**Glassmorphism per CLAUDE.md** (project standard):

- Container: `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg`
- Boss-themed accent: amber/gold (`text-amber-300`, `bg-gradient-to-b from-amber-600/90 to-orange-900/90` per VictoryScreen.jsx:288)

**What to copy:** RotatePromptOverlay's full-screen `fixed inset-0 z-[9999]` shell + AnimatePresence + reducedMotion branch + `useMotionTokens()` for fade timing. CountdownOverlay's `aria-live="polite"` for screen readers. BossUnlockModal's gold color palette.

**What to change:** swap RotatePrompt's tilting-phone visual for a bold "BOSS FIGHT" / boss name text using `Fredoka One` font (project standard for victory titles per VictoryScreen.jsx:210). 2-second auto-dismiss. Add `Crown`/`Trophy` icon from lucide-react. Respect `reducedMotion`: skip the pulse, just show static text. i18n key: `trail:boss.intro.title` etc. (HE locale entry required per CLAUDE.md i18n rule).

**Mount point:** in `MixedLessonGame.jsx`, gate on `node.isBoss && node.nodeType === "boss"` (full BOSS) — not on MINI_BOSS. Render before the first question; transition to game state after dismiss.

---

### 8. `VictoryScreen.jsx` — boss VFX hook point (D-18 contingent)

**Role:** component
**Data flow:** event-driven (post-session render)

**Self-analog — existing boss branch in `useVictoryState`** (useVictoryState.js:221, 231, 571-581):

```javascript
const isBoss = node?.isBoss || false;
// ...
return { tier, config, message, isBoss, nodeType, effectiveStars };
// ...
celebrationData.isBoss && /* ... boss-specific behavior ... */
```

**Existing celebrationData destructure in VictoryScreen** (VictoryScreen.jsx:30-77):

```javascript
const {
  stars, celebrationData, xpData, ..., showBossModal, handleBossModalClose,
} = useVictoryState({...});

// Already-renders BossUnlockModal at z-[10000]:
{showBossModal && (
  <BossUnlockModal
    nodeId={nodeId}
    nodeName={getNodeById(nodeId)?.name || "Boss"}
    nextNode={null}
    stars={stars}
    onClose={handleBossModalClose}
    onNavigateToNext={...}
  />
)}
```

**Where the D-18 boss VFX hooks in:** the existing `celebrationData.isBoss` branch (line 571 in useVictoryState) is the natural condition. In VictoryScreen.jsx, conditionally render an extra confetti tier (gold-only colors) or a boss-specific subtitle. Two minimal options:

- (a) Pass `tier="boss"` to the existing `<ConfettiEffect>` when `celebrationData.isBoss` (currently only the `tier` from `celebrationData` decides — see line 117) and use the `BOSS_CONFETTI_COLORS` from `BossUnlockModal.jsx:46`.
- (b) Add a boss-specific sound on victory mount (alongside the existing `playFanfare` from BossUnlockModal).

**What to copy:** the `celebrationData.isBoss` gate (already in scope at VictoryScreen.jsx:122-135). The gold confetti palette already lives in `BossUnlockModal.jsx:46` — re-import or extract to a shared constant.

**What to change:** likely zero net new component — extend the existing branch. Keep the change minimal per "no gold-plate" framing.

---

### 9. Rhythm unit data file template (D-08, D-11, D-12 audit edits)

**Role:** data / config
**Data flow:** static (build-time validated by `validateTrail.mjs`)

**Analog — `rhythmUnit1Redesigned.js` rhythm_1_1 node (full shape)** (rhythmUnit1Redesigned.js:36-88):

```javascript
{
  id: "rhythm_1_1",
  name: "Meet Quarter Notes",
  description: "Learn to play steady quarter notes",
  category: CATEGORY,
  unit: UNIT_ID,
  unitName: UNIT_NAME,
  order: START_ORDER,
  orderInUnit: 1,
  prerequisites: [],

  // Node type classification
  nodeType: NODE_TYPES.DISCOVERY,

  // Rhythm configuration (NO noteConfig for rhythm-only nodes)
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.SIMPLE,
    durations: ["q"],
    focusDurations: ["q"],         // NEW: introduced in this node
    contextDurations: [],          // No previous durations yet
    patternTags: ["quarter-only"],
    tempo: { min: 60, max: 70, default: 65 },
    pitch: "C4",
    timeSignature: "4/4",
  },

  newContent: NEW_CONTENT_TYPES.RHYTHM,
  newContentDescription: "Quarter Notes (1 beat)",

  // Exercises — Discovery intro + pulse (first rhythm exercise ever)
  exercises: [
    {
      type: EXERCISE_TYPES.MIXED_LESSON,
      config: {
        questions: [
          { type: "discovery_intro", focusDuration: "q" },
          { type: "syllable_matching" },
          { type: "visual_recognition" },
          { type: "pulse" },
        ],
      },
    },
  ],

  // Progression
  skills: ["quarter_note"],
  xpReward: 40,
  accessoryUnlock: null,
  isBoss: false,
  isReview: false,
  reviewsUnits: [],
},
```

**What to copy:** the strict template — UNIT_ID, START_ORDER constants at top of file; node objects with stable field order (id, name, description, category, unit, unitName, order, orderInUnit, prerequisites, nodeType, rhythmConfig, newContent, exercises, skills, xpReward, accessoryUnlock, isBoss, isReview, reviewsUnits). Every audit edit should preserve the existing field order in that node — no reordering.

**What to change per audit (D-08, D-11, D-12):**

- D-11 renames: edit `name` and/or `description` strings only (RESEARCH §3 lists rhythm_2_3, rhythm_4_6, rhythm_6_4, rhythm_8_1)
- D-12 rest cleanup: data-side change is in `src/data/patterns/rhythmPatterns.js` (NOT in unit files) — remove `quarter-half` tag from rest-bearing entries OR delete those entries entirely
- D-08 mismatches: `rhythm_2_3` `discovery_intro` question with `focusDuration: "q"` should be removed (RESEARCH §3 Unit 2); `rhythm_4_6` durations missing `w` despite `whole-rest` tag (add `"w"` to durations); `rhythm_8_1` change `focusDurations` from `["8"]` to `["8_pair"]` if D-15 fix path (a) chosen

**Build-time safety:** every edit triggers `npm run verify:trail` (validateTrail.mjs prebuild hook). Any audit change that breaks prereqs/cycles/XP/`resolveByTags` non-null gets caught automatically.

---

### 10. Speed nodes cumulative tags (D-19 contingent)

**Role:** data / config
**Data flow:** static

**Analog — `boss_rhythm_3` node** (rhythmUnit3Redesigned.js:316-372):

```javascript
{
  id: "boss_rhythm_3",
  name: "Running Notes Master",
  // ...
  nodeType: NODE_TYPES.MINI_BOSS,
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.VARIED,
    durations: ["q", "h", "w", "8"],
    focusDurations: [],
    contextDurations: ["q", "h", "w", "8"],
    patternTags: [
      "quarter-only",
      "quarter-half",
      "quarter-half-whole",
      "quarter-eighth",
      "quarter-half-whole-eighth",
    ], // D-06: cumulative U1-U3
    patternTagMode: "any", // D-06: OR-mode for cumulative boss patterns
    tempo: { min: 75, max: 85, default: 80 },
    pitch: "C4",
    timeSignature: "4/4",
  },
  // ...
}
```

**Counter-example — current `rhythm_1_6` Speed Challenge** (rhythmUnit1Redesigned.js:262-304):

```javascript
{
  id: "rhythm_1_6",
  name: "Speed Challenge",
  description: "How fast can you play quarters and halves?",
  // ...
  nodeType: NODE_TYPES.SPEED_ROUND,
  rhythmConfig: {
    complexity: RHYTHM_COMPLEXITY.MEDIUM,
    durations: ["q", "h"],
    focusDurations: [],
    contextDurations: ["q", "h"],
    patternTags: ["quarter-only", "quarter-half"],  // <-- only this unit's tags, no patternTagMode
    tempo: { min: 85, max: 95, default: 90 },
    pitch: "C4",
    timeSignature: "4/4",
  },
  exercises: [{ type: EXERCISE_TYPES.ARCADE_RHYTHM, config: { difficulty: "intermediate" } }],
  // ...
}
```

**The D-19 edit (per speed node, contingent):** mirror the boss-node data shape — add cumulative `patternTags` from units 1..N AND `patternTagMode: "any"`. Example for `rhythm_3_6` (Speed Running, Unit 3):

```javascript
patternTags: [
  "quarter-only",          // U1
  "quarter-half",          // U1
  "quarter-half-whole",    // U2
  "quarter-eighth",        // U3
  "quarter-half-whole-eighth", // U3
],
patternTagMode: "any",
```

**What to copy:** the exact shape from `boss_rhythm_3` rhythmConfig — both fields (`patternTags` listing cumulative tags, `patternTagMode: "any"`).

**What to change:** keep `durations` matching the speed node's narrower vocabulary (NOT cumulative — only the boss should expand the duration set). The cumulative-tags pull works alongside per-node durations because D-09's filter constrains the resolved patterns.

**Critical dependency:** D-19 is a no-op without #5 (Stash Chunk A salvage). The OLD `getPattern()` path used by current ArcadeRhythmGame ignores `patternTags` entirely (RESEARCH §6 D-19 implementation detail). Plan must enforce: if D-19 fires, #5 also fires.

---

### 11. Rate-limit migration deploy (D-07)

**Role:** ops / deploy
**Data flow:** one-shot

**Analog:** No prior in-repo automation. `package.json` has no `supabase` or `migrate` script. Deploy path is the standard Supabase CLI command: `npx supabase db push` (or `npx supabase migration up`).

**Pre-deploy hardening (RESEARCH §7):** Three `CREATE POLICY` statements in `20260201000002_add_rate_limiting.sql` are NOT idempotent. Recommended edit before deploy — wrap each in `DROP POLICY IF EXISTS ... ; CREATE POLICY ...;`:

```sql
DROP POLICY IF EXISTS "Students can view own rate limits" ON rate_limits;
CREATE POLICY "Students can view own rate limits" ...
```

**Deploy sequence:**

1. (optional) Edit migration to add `DROP POLICY IF EXISTS` guards
2. `npx supabase start` + `npx supabase db reset` locally — confirms migration applies cleanly
3. `npx supabase db push` — applies to remote
4. Verify via Supabase dashboard / `select * from pg_proc where proname = 'check_rate_limit'`
5. Reload app — frontend warning ("Rate limit function not found in database") should disappear

**What to copy:** the `npx supabase` CLI workflow is standard Supabase practice (no in-repo precedent to reference).

**What to change:** Nothing in the codebase changes for D-07 — it's purely a remote-DB action. The frontend already calls `check_rate_limit` and silently allows requests when the function is missing (per the current console warning text).

---

## Shared Patterns

### Glassmorphism (CLAUDE.md design system)

**Source:** project-wide (CLAUDE.md "Glass Card Pattern")
**Apply to:** any new D-18 boss intro overlay UI; any boss-themed VictoryScreen extension

```jsx
// Container
className =
  "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg";

// Nested
className = "bg-white/5 border-white/10";

// Text
className = "text-white"; // primary
className = "text-white/70"; // secondary
className = "text-amber-300"; // accent (boss/gold)
```

### Reduced motion respect

**Source:** `src/utils/useMotionTokens.js` and `src/contexts/AccessibilityContext.jsx`
**Apply to:** any new D-18 overlay; any new VFX

**Pattern from RotatePromptOverlay.jsx:43-104:**

```jsx
const { fade } = useMotionTokens();
const { reducedMotion } = useAccessibility();

return (
  <AnimatePresence>
    <motion.div initial={...} animate={...} exit={...} transition={fade}>
      {reducedMotion ? <StaticContent /> : <motion.div animate={{...}}>...</motion.div>}
    </motion.div>
  </AnimatePresence>
);
```

### i18n with EN + HE

**Source:** `src/locales/{en,he}/*.json`, `useTranslation('common')` hook
**Apply to:** any new D-18 strings

```jsx
const { t, i18n } = useTranslation("common");
const isRTL = i18n.dir() === "rtl";
// usage: t("rotatePrompt.title")
// HE locale entry MUST be added in lockstep
```

### Build-time validation safety net

**Source:** `scripts/validateTrail.mjs` (prebuild hook in `package.json:8`)
**Apply to:** every D-08/D-11/D-12 unit data edit

Build fails (and so does `npm run verify:trail`) if data audit changes break prereqs, cycles, XP, or yield empty `resolveByTags` results. RESEARCH Open Question 2 flags that it is unverified whether the loop actually invokes `resolveByTags` per node — Plan task should confirm or extend.

### `lastPatternRef` session-coverage extension pattern

**Source:** `ArcadeRhythmGame.jsx:195, 372-381` (Phase 32 D-02 dedup)
**Apply to:** D-10 per-duration coverage rule

The same `useRef`/binary-signature/retry-loop topology extends naturally to a `seenDurationsRef` Set. No new state machinery needed.

---

## No Analog Found

| File / Work                           | Reason                                                                                                                                                                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate-limit migration deploy           | No prior `supabase db push` in repo (no script in package.json, no CI workflow). Use standard Supabase CLI workflow. Treat as one-shot ops, not code.                                                                                             |
| `useEnsureAudioReady` exact signature | No exact analog hook in `src/hooks/`. The closest is `useAudioEngine` itself (which the new hook composes). Per Discretion, signature is open — recommended: `useEnsureAudioReady(audioEngine, getOrCreateAudioContext): () => Promise<boolean>`. |

---

## Metadata

**Analog search scope:**

- `src/hooks/` (28 files — listed via Glob)
- `src/components/games/rhythm-games/` (renderers, components, ArcadeRhythmGame, MixedLessonGame, RhythmPatternGenerator legacy)
- `src/data/patterns/` (4 files — RhythmPatternGenerator new + tests + rhythmPatterns)
- `src/data/units/rhythmUnit*.js` (8 unit files — sampled units 1, 3 in detail)
- `src/components/orientation/` (RotatePromptOverlay)
- `src/components/games/shared/` (AudioInterruptedOverlay)
- `src/components/games/` (VictoryScreen)
- `src/components/celebrations/` (BossUnlockModal)
- `package.json` (deploy script audit)
- `supabase/migrations/` (35 migrations — confirmed `20260201000002_add_rate_limiting.sql` exists, undeployed)

**Files scanned:** ~22 source files read directly; ~30 located via Glob/Grep

**Pattern extraction date:** 2026-05-03

---

## PATTERN MAPPING COMPLETE
