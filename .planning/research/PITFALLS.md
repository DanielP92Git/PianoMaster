# Pitfalls Research: v2.9 Game Variety & Ear Training

**Domain:** Rhythm game variants and ear training path added to existing children's piano learning PWA
**Researched:** 2026-03-26
**Confidence:** HIGH (direct codebase review of trail system, audio engine, progress service, service worker, subscription gate; supplemented by web research on web audio timing, touch latency, PWA audio caching, COPPA voice recording rules)

---

## Context

This document covers common mistakes when adding these features to the existing PianoApp2 codebase
(v2.8, ~90K LOC, real users with stored progress in Supabase):

1. **3 new rhythm game components** — Rhythm Reading/tap-along, Rhythm Dictation/hear-and-pick, Arcade-style rhythm
2. **Remapping 36 existing rhythm trail nodes** to use a mix of game types (breaking change risk)
3. **New EAR_TRAINING trail path** (~12-15 nodes) with note comparison, instrument recognition, interval identification
4. **Audio sample management** — instrument sounds and interval playback in a PWA
5. **4th trail tab** added to TrailMap (currently hardcoded for 3 tabs)

Codebase context verified at time of research:
- `src/data/units/rhythmUnit1-8Redesigned.js` — 36 rhythm nodes, all using `EXERCISE_TYPES.RHYTHM` wired to `/rhythm-mode/metronome-trainer`
- `src/components/trail/TrailMap.jsx` — TRAIL_TABS array hardcoded as `[treble, bass, rhythm]`, activeNodes derived by `if/else` chain not loop
- `src/components/trail/TrailNodeModal.jsx` — `navigateToExercise()` switch-case over `EXERCISE_TYPES` (default: `console.error`)
- `src/hooks/useAudioEngine.js` — lookahead scheduler at 100ms, `performance.now()` not used for tap capture
- `public/sw.js` — no audio file exclusion rule; cache-first applies to `/assets/*`
- `src/config/subscriptionConfig.js` — static ID Set; Postgres `is_free_node()` must be manually kept in sync
- `src/services/skillProgressService.js` — `exercise_progress` JSONB stores `{index, type, stars, bestScore, completedAt}` per exercise

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or silent breakage for live users.

### Pitfall 1: Remapping Rhythm Node Exercise Types Silently Breaks Existing Progress

**What goes wrong:** Changing a rhythm node's exercises array — adding exercises, removing exercises, or changing exercise order — invalidates `exercise_progress` records already stored in Supabase for real users. The `exercise_progress` JSONB stores `{index, type, ...}`. If index 0 was `EXERCISE_TYPES.RHYTHM` (MetronomeTrainer) and you insert a new exercise at index 0, the stored index-0 record now refers to the wrong exercise. The VictoryScreen calls `updateExerciseProgress()` with the new index, `getNextExerciseIndex()` returns 0 (because the old record at index 0 is typed `rhythm` not the new type), and users replay exercises they already completed.

**Why it happens:** The progress schema uses positional indexes rather than exercise IDs. There is no migration path: existing JSONB rows have no foreign key to enforce consistency, and Supabase RLS does not validate JSONB contents.

**Consequences:**
- Users see previously-starred exercises shown as incomplete
- Completion logic (`allExercisesComplete = completedExercises.length >= totalExercises`) can permanently block node completion if `totalExercises` count changes
- Node stars recalculate as `Math.min(...exercise stars)` — adding an uncompleted exercise to a completed node resets node stars to 0
- Rate limit counter (`exercises_completed` column) increments incorrectly

**Prevention:**
- **Never change exercise order or count for nodes that already have live user progress.** Only append new exercises at the end; never insert at index 0 or mid-array.
- For nodes being remapped: create a **DB migration** that clears `exercise_progress` and resets `stars`/`exercises_completed`/`best_score` to 0 for affected node IDs, then display a "node refreshed — try again!" UI message. Use `20260326000001_reset_rhythm_nodes_v29.sql` pattern.
- Write a migration validation query to confirm affected node IDs before running: `SELECT COUNT(*) FROM student_skill_progress WHERE node_id = ANY(ARRAY['rhythm_1_1',...]) AND exercise_progress IS NOT NULL;`

**Detection:** Trail QA: complete a rhythm node to 3 stars, remap its exercises in a branch, reload — if stars reset to 0 or "next exercise" loops, the migration is missing.

**Phase:** Address in Phase 1 (before any node remapping ships). Migration must precede the data file change.

---

### Pitfall 2: Duplicate Exercise Type Constants Cause Silent Route Misses in TrailNodeModal

**What goes wrong:** `TrailNodeModal.navigateToExercise()` uses a `switch-case` over `exercise.type` to decide which route to navigate to. Adding new exercise types (`rhythm_reading`, `rhythm_dictation`, `rhythm_arcade`, `ear_comparison`, `ear_interval`, `ear_instrument`) without adding a corresponding `case` in the switch causes the `default: console.error('Unknown exercise type:', exercise.type)` branch to fire. The modal closes (because `onClose()` runs before the switch), then nothing happens — the user sees a blank screen or is returned to the trail with no error shown.

**Why it happens:** `EXERCISE_TYPES` in `src/data/constants.js` is purely a constant registry; there is no enforcement that all values have route mappings. The switch-case in `TrailNodeModal.jsx` is the only place that maps types to routes, and it is not validated at build time.

**Consequences:**
- Silent failure — no user-visible error, just the trail closes and nothing opens
- Sentry will catch `console.error` only if explicitly captured; it is not currently wrapped in `Sentry.captureException` in that switch
- Particularly bad for EAR_TRAINING path where all 3 game types are new

**Prevention:**
- Add all new `EXERCISE_TYPES` constants before writing any node data files
- Add the corresponding `case` in `TrailNodeModal.navigateToExercise()` at the same time (one commit, both changes)
- Add a build-time or test validation: `validateTrail.mjs` should be extended to verify that every `exercise.type` in EXPANDED_NODES has a corresponding route mapping
- Write a unit test: `navigateToExercise()` with each new exercise type must not reach the `default` branch

**Detection:** Open TrailNodeModal for a node with a new exercise type in dev; if the modal closes but nothing opens, this pitfall occurred.

**Phase:** Phase 1. Block all other phases until `EXERCISE_TYPES` + TrailNodeModal are updated together.

---

### Pitfall 3: Web Audio Timing Drift When Using setTimeout for Tap Capture

**What goes wrong:** The existing `useAudioEngine.js` uses the AudioContext scheduler (100ms lookahead) to schedule metronome ticks with sample-accurate timing. However, if new rhythm games capture the tap timestamp using `Date.now()` or `event.timeStamp` instead of `audioContext.currentTime`, there is a timing mismatch. The beat is scheduled in AudioContext time; the tap is measured in wall-clock time. The two clocks can drift by 15-50ms under main-thread load (React renders, layout reflows), making a correct tap appear late.

**Why it happens:** AudioContext.currentTime runs on the audio thread and is independent of the JavaScript event loop. `Date.now()` and `event.timeStamp` (which is DOMHighResTimeStamp since epoch) are wall-clock measurements that pause during background throttling and can be affected by GC pauses. The existing `BASE_TIMING_THRESHOLDS.PERFECT = 50ms` leaves almost no headroom.

**Consequences:**
- Players with correct timing are penalized as "MISS" or "FAIR"
- Inconsistent results across devices — worse on low-end Android than on desktop
- Particularly bad during React state updates that trigger re-renders mid-game

**Prevention:**
- Capture taps as: `const tapTime = audioContext.currentTime;` inside the `touchstart`/`pointerdown` handler, where `audioContext` is from the shared `AudioContextProvider`
- For the beat schedule, store `scheduledBeatTime` in AudioContext time at schedule time
- Compare: `const offset = tapTime - scheduledBeatTime;` — both in AudioContext seconds
- The existing `calculateTimingThresholds(tempo)` already handles tempo scaling; apply it to this offset
- Do NOT use `performance.now()` — it is in milliseconds since page load (a different epoch than AudioContext.currentTime which is seconds since context creation); convert carefully if you must compare them

**Detection:** Log both `event.timeStamp` and `audioContext.currentTime * 1000` on each tap. If they diverge by more than 5ms over a 30-second session, the drift is measurable. On Android PWA this divergence is often 20-40ms.

**Phase:** Phase 1 (architecture decision). Once tap capture uses the wrong clock it is difficult to retrofit without changing how scheduled beat times are stored.

---

### Pitfall 4: iOS Silent Switch / AudioContext Interruption Breaks New Audio Samples

**What goes wrong:** The existing `AudioContextProvider` and `AudioInterruptedOverlay` handle iOS AudioContext interruption for the MetronomeTrainer. However, new games that load instrument samples (for ear training: piano notes, violin, guitar) using `fetch()` + `decodeAudioData()` on AudioBuffers will silently fail if the AudioContext is suspended at load time. `decodeAudioData()` requires a running context; if the context is in `suspended` state (because the iOS silent switch toggled, or because it was created before a user gesture), the decoded buffer is valid but playback via `audioContext.createBufferSource().start()` emits no sound. No error is thrown.

**Why it happens:** iOS WebKit enforces that AudioContext must be resumed after a user gesture AND has additional interruption handling for phone calls, background/foreground transitions, and the physical silent switch. The existing `isInterrupted` flag in `AudioContextProvider` only covers the interruption overlay, not the "audio loaded but context suspended" race condition.

**Consequences:**
- Ear training games load successfully (no errors), but produce no sound
- On iOS, this affects ~40% of child users (iPads are common in educational settings)
- Users tap "play interval" repeatedly thinking the game is broken, leading to abandonment
- The `AudioInterruptedOverlay` only appears after an `onstatechange` event — if the context was suspended from the start, this event may not fire

**Prevention:**
- Always call `await audioContext.resume()` immediately before any `bufferSource.start()` call, not just at app init
- Check `audioContext.state === 'running'` before scheduling; if `suspended`, show a tap-to-continue prompt
- Use `audioContext.onstatechange` to detect transitions: `running` → `suspended` → show overlay
- For OGG format: iOS Safari does not support OGG. Use MP3 for all instrument samples. Provide only MP3, not OGG fallback — the existing app has no OGG assets so this is a new requirement to document explicitly
- Test on a physical iPad with the silent switch ON; simulator does not replicate this behavior

**Detection:** Physical iPad, silent switch ON, navigate to any ear training game that plays audio. Sound should be absent and overlay should appear.

**Phase:** Phase 2 (when first audio samples are introduced). The existing `AudioInterruptedOverlay` component already handles this UI pattern — reuse it, do not build a new one.

---

### Pitfall 5: Adding EAR_TRAINING Category Breaks TrailMap's Hardcoded Tab Logic

**What goes wrong:** `TrailMap.jsx` has hardcoded tab logic in several places:
```
const activeNodes = activeTab === 'treble' ? trebleWithBoss :
                    activeTab === 'bass' ? bassWithBoss : rhythmWithBoss;
```
and
```
[getCurrentUnitForCategory(user.id, NODE_CATEGORIES.TREBLE_CLEF),
 getCurrentUnitForCategory(user.id, NODE_CATEGORIES.BASS_CLEF),
 getCurrentUnitForCategory(user.id, NODE_CATEGORIES.RHYTHM)]
```
Adding `EAR_TRAINING` requires touching 8+ separate places in TrailMap that encode the 3-tab assumption. Partial updates (adding the tab to `TRAIL_TABS` but forgetting one of the `if/else` chains) will cause the ear training tab to render an empty trail or to show rhythm nodes.

**Why it happens:** The tabs were designed for exactly 3 categories and the codebase was never abstracted to be data-driven for this dimension.

**Consequences:**
- Ear training tab shows empty or wrong nodes
- `premiumLockedNodeIds` calculation silently omits ear training nodes (line 209: iterates `[...trebleWithBoss, ...bassWithBoss, ...rhythmWithBoss]`)
- Progress loading (`Promise.all`) fetches unit progress for only 3 categories
- Boss node filter uses `startsWith('boss_rhythm')` — ear training boss nodes (if any) require a new prefix

**Prevention:**
- Refactor `TrailMap.jsx` to be data-driven before adding the 4th tab. Extract a `TRAIL_TAB_CONFIGS` array that maps `{id, categoryKey, getNodes, getBosses}` and replace all hardcoded `if/else` chains with `.find()` on this config
- Add `NODE_CATEGORIES.EAR_TRAINING = 'ear_training'` to `src/data/constants.js` before any nodes reference it
- Extend `validateTrail.mjs` to check that every node's `category` value is a valid member of `NODE_CATEGORIES`
- Check that `getNodesByCategory()` in `skillTrail.js` handles the new category — it currently uses `SKILL_NODES.filter(n => n.category === category)`, which will work automatically if nodes are in EXPANDED_NODES

**Detection:** Add EAR_TRAINING to `TRAIL_TABS` array only, run the app, click the ear tab — blank trail or rhythm nodes rendering means the if/else chains were missed.

**Phase:** Phase 1 (before any EAR_TRAINING nodes are authored). Refactor first, then author content.

---

### Pitfall 6: Subscription Gate Desync — New Node IDs Not in Postgres is_free_node()

**What goes wrong:** `src/config/subscriptionConfig.js` explicitly warns: "must sync with Postgres `is_free_node()`". New ear training node IDs (e.g., `ear_1_1` through `ear_1_6`) added to `FREE_EAR_NODE_IDS` in the JS config will pass the React UI gate (`isFreeNode()`), but if the Postgres `is_free_node()` function is not updated, the DB-layer RLS will block score writes for those nodes. The student completes an ear training exercise, the VictoryScreen tries to save progress, and gets a silent RLS rejection (Supabase returns `null` data, not an error, on policy violation).

**Why it happens:** The `is_free_node()` function lives exclusively in the live Supabase database — it is not present in any migration file in the repo (confirmed by searching all `.sql` files). It was established on the live DB during v1.8 and has been manually updated since. There is no automated sync check.

**Consequences:**
- Users on the free tier can play ear training exercises but progress never saves
- No error shown (silent RLS rejection on INSERT returns null)
- Users repeat the same exercise indefinitely — severe frustration for 8-year-olds
- Teacher analytics show zero progress for free-tier students on ear training

**Prevention:**
- Write a new migration `20260326_update_is_free_node_ear_training.sql` that uses `CREATE OR REPLACE FUNCTION is_free_node(p_node_id TEXT) RETURNS BOOLEAN AS $$ BEGIN RETURN p_node_id = ANY(ARRAY[...all free IDs...]); END; $$` — explicitly listing all free IDs including new ear training ones
- Include this migration in every phase that adds new node IDs to `subscriptionConfig.js`
- Add a Supabase SQL test in verification steps: `SELECT is_free_node('ear_1_1') AS should_be_true, is_free_node('ear_2_1') AS should_be_false;`
- Consider adding `FREE_EAR_NODE_IDS` to `FREE_TIER_SUMMARY` for human auditability

**Detection:** Free-tier user completes ear_1_1, VictoryScreen shows, navigates back to trail — ear_1_1 node still shows 0 stars.

**Phase:** Phase 3 (when EAR_TRAINING nodes are first wired end-to-end). Must be in the same PR as the subscriptionConfig.js change.

---

## Moderate Pitfalls

### Pitfall 1: Touch Latency Accumulation on Android PWA from React Re-renders

**What goes wrong:** Rhythm tap games fire `touchstart` events that need to reach the timing evaluator in under 16ms to achieve 60fps-equivalent response. On Android PWA, if the React component hosting the tap area triggers a state update on each tap (e.g., `setTapCount(n + 1)`), this schedules a synchronous re-render that can block the main thread for 8-30ms. Combined with the browser's own 0-10ms touch input pipeline, total latency from finger-lift to timing comparison can reach 50ms — equal to the entire PERFECT window.

**Why it happens:** `touchstart` fires on the main thread. React setState batches in React 18 but the synchronous commit still happens before the next frame. On mid-range Android hardware (common for families with 8-year-olds), this is measurable.

**Prevention:**
- Capture the AudioContext timestamp (`audioContext.currentTime`) as the very first line of the event handler, before any setState call
- Defer all visual feedback state updates to `requestAnimationFrame(() => setState(...))` so they don't block the timing comparison
- Use `React.memo` and stable callback refs (`useCallback`) on TapArea to minimize re-render frequency
- The existing `TapArea.jsx` component is a good starting point — verify it is not causing parent re-renders via prop drilling

**Detection:** Chrome DevTools Performance tab, record a 30-second tap session. If "Long Task" markers appear within 16ms of touchstart events, re-renders are blocking timing.

**Phase:** Phase 2 (during tap game implementation).

---

### Pitfall 2: Audio Sample Bundle Size Causes PWA Install Failure or Slow First Load

**What goes wrong:** Instrument samples for ear training (piano notes for different octaves, violin, guitar, etc.) are binary assets. If loaded as static imports or included in the Vite build as `/assets/` files, they will be included in the service worker's precache and added to the install payload. At 2-4MB per instrument and 3 instruments, a 6-12MB addition to the install payload will cause:
- PWA install to time out on slow connections (common in Israeli schools)
- First-load time to spike, failing Core Web Vitals thresholds
- The service worker `pianomaster-v8` cache to exceed browser limits (typically 50-100MB per origin, but quota varies)

**Why it happens:** The service worker precaches `/assets/*` with cache-first. Vite content-hashes audio files and puts them in `/assets/`. Any audio file referenced in a JS import or in `STATIC_CACHE_URLS` is included in the precache.

**Prevention:**
- Do NOT import audio files as ES module imports. Load them at runtime via `fetch()` inside the game component's `useEffect`, after user interaction starts
- Store loaded `AudioBuffer` objects in a module-level cache (`Map<string, AudioBuffer>`) so they survive React re-renders but are not in the service worker precache
- Add audio file URL patterns to `sw.js` as a runtime cache strategy (network-first with 7-day TTL) rather than precache: `if (url.pathname.match(/\.(mp3|wav)$/)) { return networkFirstWithCache(request); }`
- Use format MP3 only (not OGG). iOS Safari does not support OGG (confirmed — Apple only supports MP3/AAC/WAV). Offering OGG wastes build output for zero gain on the primary mobile platform
- Target maximum 500KB per instrument set using pitch-shifted samples (3-4 key samples per instrument, shifted ±6 semitones rather than one sample per note)

**Detection:** After adding first instrument samples, run `npm run build` and check chunk sizes. Run Lighthouse on the PWA and check "Minimize main-thread work" and "Avoid enormous network payloads".

**Phase:** Phase 2. Make the loading strategy decision before authoring any audio files.

---

### Pitfall 3: Daily Goals Service Does Not Know About New Exercise Types

**What goes wrong:** `src/services/dailyGoalsService.js` generates daily goals including `complete_exercises` and `perfect_score` goal types. These goals likely query `student_skill_progress` filtered by exercise types or node categories. If the goals service uses a hardcoded category list or relies on `NODE_CATEGORIES` values that do not include `EAR_TRAINING`, ear training sessions will not contribute to daily goal completion — even though the user completed exercises.

**Why it happens:** Goal generation was written when only 3 categories existed. Any hardcoded category list or `category IN ('treble_clef', 'bass_clef', 'rhythm')` SQL filter will silently exclude ear training.

**Prevention:**
- Audit `dailyGoalsService.js` for category filters before shipping EAR_TRAINING nodes
- Prefer checking `node_id IS NOT NULL` (any trail exercise) rather than category-specific conditions
- If daily challenge types include rhythm-specific goals (`practice_new_node` in rhythm path), verify the goal display still works when a user is on the ear training path

**Detection:** Complete an ear training exercise, check the daily goals panel — `complete_exercises` goal should increment.

**Phase:** Phase 3 (during EAR_TRAINING integration).

---

### Pitfall 4: PlayNextButton Recommendation Ignores New EAR_TRAINING Category

**What goes wrong:** `src/components/dashboard/PlayNextButton.jsx` calls `getNextRecommendedNode()` from `skillProgressService.js`. That function calls `getUnlockedNodes(completedNodeIds)` from `skillTrail.js`. `getUnlockedNodes()` works on `SKILL_NODES` — if EAR_TRAINING nodes are correctly in `EXPANDED_NODES` and therefore in `SKILL_NODES`, they should surface in recommendations. However, `getNextRecommendedNode()` filters out premium-locked nodes for free users using `isFreeNode()`. If ear training node IDs are not in `FREE_NODE_IDS`, all ear training nodes will be filtered out for free users, and the Play Next button will never recommend ear training even for new users who should see it.

**Prevention:** Explicitly add the first EAR_TRAINING unit's nodes to `FREE_EAR_NODE_IDS` and `FREE_NODE_IDS` in `subscriptionConfig.js` (and sync Postgres `is_free_node()`) before shipping.

**Phase:** Phase 3.

---

### Pitfall 5: Rhythm Dictation Game — "Hear and Pick" UI Requires Audio Before User Gesture

**What goes wrong:** Rhythm dictation presents a rhythm pattern by playing it (audio), then asks the user to identify it from choices. The game needs to play audio immediately when the exercise starts. However, per Web Audio API autoplay policy, AudioContext cannot produce sound until after a user gesture. If the game tries to play the demonstration rhythm on mount (inside `useEffect`), the AudioContext will be in `suspended` state and no sound will play. The child sees a "listen to this rhythm" screen with no sound, with no indication of why.

**Why it happens:** The existing MetronomeTrainer avoids this because it has a Setup screen that requires the user to press "Start" before audio begins. Dictation games where audio plays immediately on entry do not have this natural gesture gate.

**Prevention:**
- Show a "Tap to hear" large button as the entry point to each exercise. First tap resumes AudioContext and triggers playback simultaneously
- Use the existing `needsGestureToStart` pattern from MetronomeTrainer: check `audioContext.state`, set state flag if suspended, render tap-to-start overlay
- Do not play audio in `useEffect` with empty deps array; play audio in a callback triggered by a user-facing button

**Detection:** Navigate to rhythm dictation exercise on iOS or any browser with fresh session. If no sound plays on first exercise load, this pitfall occurred.

**Phase:** Phase 2 (rhythm dictation implementation).

---

### Pitfall 6: COPPA Voice Recording Exposure if Ear Training Uses Microphone

**What goes wrong:** Some ear training game designs could tempt use of the microphone (e.g., "sing the interval back"). Under COPPA as updated in 2024-2025, voice recordings from children require explicit parental consent AND must be deleted immediately after their functional use — they cannot be stored, analyzed, or transmitted. The existing pitch detection (`usePitchDetection.js`) already uses the microphone for note recognition games, but those games are gated by existing COPPA consent flow. A new ear training game that adds ANY microphone use must verify the consent path is active before opening the mic.

**Why it happens:** The FTC's 2025 COPPA guidance explicitly classifies voice recordings as biometric/sensitive personal information. The existing mic consent is implicit (pitch detection for piano games was part of original app consent). Adding a new mic use case for a different game type may require re-consent or an updated privacy policy disclosure.

**Prevention:**
- For the initial ear training path, avoid microphone entirely. Use listen-only or tap/click interactions
- If microphone ear training is added in future: update the COPPA privacy policy to explicitly name "interval singing practice" as a mic use; process voice data only client-side (no server transmission); delete immediately after processing
- The existing `AudioInterruptedOverlay` and `useMicNoteInput.js` have the correct mic permission request pattern — any new mic use must go through the same parent-gate check

**Phase:** Not applicable for this milestone if mic is avoided in ear training. Flag as requirement if mic is considered.

---

## Minor Pitfalls

### Pitfall 1: i18n Keys Missing for New Exercise Types in TrailNodeModal

**What goes wrong:** `TrailNodeModal.jsx` calls `getExerciseTypeName(type, t)` which does a switch-case over `t('trail:exerciseTypes.note_recognition')` etc. New types (`rhythm_reading`, `rhythm_dictation`, `rhythm_arcade`, `ear_comparison`, `ear_interval`, `ear_instrument`) that are missing from `src/locales/en/trail.json` and `src/locales/he/trail.json` will fall through to `default: return type` — showing raw key strings like `"rhythm_reading"` to users in the modal's exercise list.

**Prevention:** Add all new exercise type display names to both locale files before authoring any node data that uses them. Hebrew translations must include RTL-appropriate musical terms.

**Detection:** Open TrailNodeModal for any new node in Hebrew locale — if raw key strings appear in the exercise list, translations are missing.

**Phase:** Phase 1.

---

### Pitfall 2: Trail Order Numbers Collide With Existing Rhythm Nodes

**What goes wrong:** Rhythm unit nodes use `order` values starting at 100 (`rhythmUnit1` starts at 100). EAR_TRAINING nodes need order values in a separate numeric namespace. If ear training nodes are accidentally assigned order values that overlap with rhythm node order values (100-199), `getNodesByCategory()` will correctly separate them by category, but `getNextNodeInCategory()` and the trail layout ordering could behave unexpectedly if any code iterates all nodes sorted by order without category filtering.

**Prevention:** Use a distinct order range for ear training — start at 300+ (treble is 1-99, bass is roughly parallel, rhythm is 100-199 based on unit files). Add a comment in each unit file documenting the range convention.

**Phase:** Phase 3 (when EAR_TRAINING node files are authored).

---

### Pitfall 3: Service Worker Cache Version Not Bumped After Audio Assets Added

**What goes wrong:** The service worker `CACHE_NAME = "pianomaster-v8"` must be incremented when new static assets are added that should be cached. If audio samples are added to the build but the cache version stays at v8, users who have the PWA installed will continue serving old cached responses for audio file paths (cache-first strategy on `/assets/*`). New audio files won't be in their cache and `fetch()` will hit the network — fine for online users, silent failures for offline users.

**Prevention:** Bump `CACHE_NAME` to `"pianomaster-v9"` (or higher) in `public/sw.js` any time new asset types are introduced. Document this bump in the phase plan.

**Phase:** Phase 2.

---

### Pitfall 4: validateTrail.mjs Does Not Validate New Exercise Types

**What goes wrong:** `scripts/validateTrail.mjs` validates prerequisite chains, duplicate IDs, cycles, and XP values. It does NOT validate that `exercise.type` values are valid members of `EXERCISE_TYPES`. After adding new exercise types to constants and node files, a typo (`'rythm_reading'` instead of `'rhythm_reading'`) will not be caught at build time — it will silently fail at runtime when TrailNodeModal hits the `default` branch of its switch.

**Prevention:** Extend `validateTrail.mjs` to import `EXERCISE_TYPES` and check that every exercise type in every node is a valid constant value. This is a 5-line addition with high safety value.

**Phase:** Phase 1.

---

### Pitfall 5: EAR_TRAINING Boss Node Prefix Not Handled in TrailMap Boss Filtering

**What goes wrong:** TrailMap filters boss nodes with `bossNodes.filter(b => b.id.startsWith('boss_rhythm'))`. Ear training boss nodes with IDs like `boss_ear_1` will not be filtered into the correct `earWithBoss` array. After the TrailMap refactor (Pitfall 5, Critical), this filter logic must be updated to use category-based filtering rather than ID prefix matching.

**Prevention:** During the TrailMap refactor, replace `startsWith` boss filtering with `b.category === NODE_CATEGORIES.EAR_TRAINING && b.isBoss === true` or rely on the node's `category` field directly. The `BOSS` category in `NODE_CATEGORIES` appears to be for cross-category boss challenges — clarify whether ear training bosses use `category: 'boss'` or `category: 'ear_training'` with `isBoss: true` before authoring node files.

**Phase:** Phase 1 (during TrailMap refactor).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Add new EXERCISE_TYPES constants | TrailNodeModal switch-case miss (Critical #2) | Update constants + switch-case + i18n in one commit |
| Remap rhythm node exercise arrays | Progress index desync for live users (Critical #1) | Write DB migration resetting affected node progress before pushing |
| Add tap-along game | AudioContext timing drift (Critical #3); Touch latency (Moderate #1) | Capture `audioContext.currentTime` as first line of tap handler |
| Add rhythm dictation game | Audio before user gesture (Moderate #5) | Gate first audio on tap interaction, not useEffect mount |
| Add instrument sound samples | iOS silent switch / suspended context (Critical #4); Bundle size (Moderate #2) | Lazy-load samples at runtime, MP3 only, add runtime SW caching rule |
| Refactor TrailMap for 4th tab | Hardcoded tab logic (Critical #5) | Data-driven refactor before authoring EAR_TRAINING nodes |
| Author EAR_TRAINING nodes | Order number collision (Minor #2); Boss prefix (Minor #5) | Use 300+ order range; category-based boss filtering |
| Wire EAR_TRAINING to subscription gate | Gate desync (Critical #6); PlayNext ignores new path (Moderate #4) | DB migration for is_free_node() + JS config in same PR |
| Daily goals + ear training | Goals don't credit ear training (Moderate #3) | Audit dailyGoalsService.js for category hardcoding |
| Any new mic use in ear training | COPPA voice recording (Moderate #6) | Avoid mic for initial milestone; update privacy policy if added later |

---

## Sources

**Web Audio Timing:**
- [A tale of two clocks — web.dev](https://web.dev/articles/audio-scheduling) — AudioContext scheduler vs setTimeout, lookahead pattern
- [Advanced techniques: Creating and sequencing audio — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques) — authoritative scheduler pattern

**Touch Latency:**
- [Rhythm Quest Devlog 10 — Latency Calibration](https://ddrkirbyisq.medium.com/rhythm-quest-devlog-10-latency-calibration-fb6f1a56395c) — tap test limitations, three-latency decomposition

**iOS Audio:**
- [Web Audio API weirdness on iOS — Adactio](https://adactio.com/journal/17709) — silent switch behavior
- [Playing Sounds with the Web Audio API — Apple Developer](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html) — iOS audio format support (MP3/AAC/WAV only, no OGG)

**PWA Audio Caching:**
- [GitHub — daffinm/audio-cache-test](https://github.com/daffinm/audio-cache-test) — PWA media file caching with Workbox, range request complexity

**COPPA:**
- [FTC's New COPPA Guidance on Recording Children's Voices — Fenwick](https://www.fenwick.com/insights/publications/ftcs-new-coppa-guidance-on-recording-childrens-voices-five-tips-for-app-developers-and-toymakers-to-comply) — voice recording exception conditions
- [COPPA Compliance in 2025 — promise.legal](https://blog.promise.legal/startup-central/coppa-compliance-in-2025-a-practical-guide-for-tech-edtech-and-kids-apps/) — biometric/voice data classification

**Instrument Samples:**
- [Piano Sounds with the Web Audio API — Greg Jopa](https://www.gregjopa.com/2023/03/piano-sounds-with-web-audio-api/) — pitch-shifted sample strategy, 2-3MB target
