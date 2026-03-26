# Project Research Summary

**Project:** PianoApp2 — v2.9 Game Variety & Ear Training
**Domain:** Children's piano learning PWA — rhythm game expansion + new ear training trail path
**Researched:** 2026-03-26
**Confidence:** MEDIUM-HIGH

## Executive Summary

v2.9 adds significant game variety to an existing, live production app with real users and stored progress. The research confirms this milestone is feasible using almost entirely the existing tech stack — the only new dependency is `smplr ^0.16.4` for multi-instrument sample playback in the Instrument Recognition game, which integrates cleanly with the existing `AudioContextProvider` singleton. All other capabilities (timing, notation, animation, trail integration, audio playback) are built from the existing stack. The six new game types — Rhythm Reading/tap-along, Rhythm Dictation/hear-and-pick, Arcade Rhythm/falling-notes, Note Comparison/higher-lower, Instrument Recognition/timbre, Interval Identification/step-skip-leap — each map to clear interaction patterns from competitor apps and music education research, with well-established implementation paths from the existing codebase.

The recommended approach is to front-load all data-layer changes before building any game component: add new `EXERCISE_TYPES` constants, extend `validateTrail.mjs`, update `TrailNodeModal` routing, refactor TrailMap to be data-driven, and write the DB migration that resets existing rhythm node progress before any node remapping ships. This sequence prevents the two most destructive pitfalls: silent route misses when new exercise types are tapped on the trail, and invalidated progress records for live users when exercise arrays change. The TrailMap refactor (removing hardcoded 3-tab if/else logic) must precede all EAR_TRAINING node authoring — this is a hard dependency, not optional cleanup.

The primary risk factors are audio timing accuracy (using `audioContext.currentTime` throughout, not `Date.now()`), iOS AudioContext lifecycle for new sample-based games (resume before every `bufferSource.start()`), subscription gate desync (Postgres `is_free_node()` must be updated in the same PR as `subscriptionConfig.js`), and audio asset size management (runtime-loaded MP3s in `public/`, not Vite-bundled). Instrument Recognition has the largest new asset footprint of any game type and the only unresolved external dependency (sourcing audio clips per instrument) — it belongs in the final phase. For piano note playback in ear training and rhythm dictation, the existing chromatic WAV library at `src/assets/sounds/piano/` is sufficient via a new `usePianoSampler` hook, avoiding a dependency on `smplr` for those game types.

## Key Findings

### Recommended Stack

The existing stack handles everything except multi-instrument timbre samples. `smplr ^0.16.4` accepts an existing `AudioContext` via its constructor, so the singleton from `AudioContextProvider` is passed in directly and all iOS lifecycle handling applies automatically — it is the right choice over Tone.js (creates its own AudioContext, conflicts with `AudioContextProvider`) and Howler.js (same problem). However, the codebase already has a complete chromatic piano WAV library at `src/assets/sounds/piano/` (A1-G7, confirmed present), making `smplr` unnecessary for piano note playback in ear training and rhythm dictation. A `usePianoSampler` hook that runtime-fetches WAV files from `public/sounds/piano-samples/` covers those game types; `smplr` (or self-hosted MP3s) is only needed for Instrument Recognition's non-piano instrument clips.

For the arcade rhythm game's falling-note animation, `requestAnimationFrame` with direct DOM mutation via `ref.style.transform` on GPU-promoted elements is the correct approach. framer-motion is wrong for continuous frame-rate-sensitive animation but remains correct for discrete event animations (score popups, combo bursts). The `useAudioEngine` lookahead scheduler needs only a `scheduleBeatSequence` helper (~30 lines) rather than any new library — WAAClock is unmaintained, Tone.js Transport conflicts with `AudioContextProvider`.

**Core technologies:**
- `smplr ^0.16.4` (new, scoped to Instrument Recognition): Multi-instrument GM sample playback — passes existing `AudioContext` directly, avoiding iOS lifecycle conflicts
- `usePianoSampler` hook (new): Runtime-fetches existing WAV library from `public/sounds/piano-samples/`; covers ear training and rhythm dictation note playback without new npm dependency
- `requestAnimationFrame` + `ref.style.transform` (no library): Arcade rhythm game falling-tile loop — GPU compositor animation, lowest possible frame jank
- VexFlow v5 (existing): Rhythm notation display for tap-along and dictation games — `RhythmStaveRenderer` with `Stem.UP` and fixed pitch for rhythm-only display
- `useAudioEngine` + `scheduleBeatSequence` helper (existing, extended): Beat sequencing for tap-along and arcade games using established lookahead scheduler pattern

### Expected Features

**Must have (table stakes — all 6 game types):**
- Trail integration (nodeId, exerciseIndex → VictoryScreen + XP awards) — without this, nodes have no completion state
- Landscape orientation lock + rotate prompt — all rhythm/ear games require horizontal space
- `AudioInterruptedOverlay` handling — iOS audio interruption recovery for every audio-producing game
- SessionTimeout pause/resume during gameplay — child safety on shared devices
- Replay button before answering — 8-year-olds need multiple listens; one-shot audio is a failure mode
- i18n EN + HE keys for all UI text — Hebrew RTL is a production requirement

**Must have per game type:**
- Rhythm Reading: VexFlow notation display, count-in before start, PERFECT/GOOD/MISS per-tap feedback, timing windows scaled to tempo via existing `calculateTimingThresholds`
- Rhythm Dictation: Audio-first (hear before seeing options), 2-4 VexFlow notation choices, correct/wrong reveal with replay, tap-to-hear gate (not useEffect autoplay)
- Arcade Rhythm: Falling tiles synchronized to audio, hit zone with judgment display, 3-lives system, score/combo counter, landscape only
- Note Comparison: Binary HIGHER/LOWER buttons, progressive narrowing of interval distance, animated direction reveal after answer
- Instrument Recognition: Real sampled audio (not synthesis), illustrated instrument choices, correct instrument name revealed after wrong answer, start with instrument families
- Interval Identification: Step/Skip/Leap vocabulary (age-appropriate for 8-year-olds), ascending before descending, reference song hints on wrong answer

**Should have (competitive differentiators):**
- Scrolling cursor on notation advancing with music (Rhythm Reading) — connects written note to expected tap moment
- "Watch notation play along" reveal mode after answering (Rhythm Dictation) — highest educational value of any differentiator
- Combo multiplier with on-fire animation (Arcade Rhythm, Tap-Along) — proven engagement pattern from existing NotesRecognitionGame
- Piano keyboard SVG showing played notes after answer (Note Comparison, Interval ID) — connects sound to visual keyboard position
- "New game type" badge on trail node first play — signals variety and curiosity
- Cross-path XP bonus for practicing multiple paths in one day — incentivizes path variety

**Defer (post-v2.9):**
- Microphone ear training (sing back intervals) — COPPA voice recording compliance adds significant complexity
- Song-based gameplay with licensed music — licensing complexity, explicit out-of-scope
- Latency calibration UI — children cannot use calibration tools; pre-tune via `useAudioEngine`'s existing latency offset
- Instrument animation SVG (instrument being played) — high complexity, low priority
- Teacher view of all students' ear training progress — future milestone scope

**Rhythm trail remapping distribution (36 nodes across units 2-8):**
- MetronomeTrainer (existing): ~40% of rhythm nodes (discovery and practice types)
- Rhythm Reading/Tap-Along: ~30% (practice and mix-up nodes)
- Rhythm Dictation/Hear-and-Pick: ~20% (mix-up and boss lead-up nodes)
- Arcade Rhythm: ~10% (speed round and mini-boss nodes only)

**Ear Training trail:** 12-15 nodes across 2-3 units, order values starting at 300+. Unit 1 "Sound Detectives" (7 nodes): Note Comparison higher/lower discrimination, wide to narrow intervals, plus Instrument Recognition at family level. Unit 2 "Interval Explorers" (7 nodes + 1 boss): Interval Identification step/skip/leap ascending then descending then harmonic, plus harder timbre discrimination.

### Architecture Approach

All 6 new game components follow the `MetronomeTrainer`/`NoteSpeedCards` established pattern: read trail state from `location.state`, call `useLandscapeLock()` + `useRotatePrompt()`, call `useSessionTimeout()` pause/resume, access the shared AudioContext via `useAudioContext()` (never create a new `AudioContext` inside a component), use the `hasAutoStartedRef` auto-start guard, and pass all trail fields to `VictoryScreen`. TrailNodeModal gets a `case` for each new exercise type in the same commit that adds the constant. App.jsx gets a lazy route + `LANDSCAPE_ROUTES` entry per game. Piano samples are fetched at runtime from `public/sounds/piano-samples/` (not bundled through Vite) using the new `usePianoSampler` hook, caching `AudioBuffer` objects in a `useRef` Map. Instrument recognition samples use the HTML `Audio` element (not Web Audio API) since timing precision is not required for identification games. The TrailMap must be refactored to a data-driven `TRAIL_TAB_CONFIGS` array before any EAR_TRAINING nodes are authored — the current hardcoded if/else chains encode a 3-tab assumption in 8+ separate places.

**Major components:**
1. `RhythmReadingGame` — VexFlow notation + tap capture using `audioContext.currentTime`, timing eval via extracted `calculateTimingThresholds`, count-in before start
2. `RhythmDictationGame` — Tap-to-hear gate at exercise entry (no useEffect autoplay), VexFlow multiple-choice cards, distractor generation from `RhythmPatternGenerator`
3. `ArcadeRhythmGame` — `requestAnimationFrame` game loop with `ref.style.transform` tiles, beat scheduling via `scheduleBeatSequence` in `useAudioEngine`, lives + combo systems extracted from `NotesRecognitionGame`
4. `NoteComparisonGame` — `usePianoSampler` plays two notes sequentially, binary HIGHER/LOWER buttons, optional piano keyboard SVG reveal
5. `InstrumentRecogGame` — HTML `Audio` element for instrument MP3 clips from `public/sounds/instruments/`, illustrated choice cards (MemoryGame card UI pattern)
6. `IntervalGame` — `usePianoSampler` plays melodic interval, Step/Skip/Leap category buttons, piano keyboard SVG shared with `NoteComparisonGame`
7. `usePianoSampler` hook — runtime fetch + `decodeAudioData` + `Map<noteId, AudioBuffer>` cache using shared AudioContext from `useAudioContext()`
8. `TrailMap` refactor — data-driven `TRAIL_TAB_CONFIGS` array replacing hardcoded if/else chains, enabling 4th Ear tab without further structural changes
9. `SkillPathProgress` dashboard card — 3 mini path summaries using `getNextRecommendedNode()`, mounted below `XPProgressCard`

### Critical Pitfalls

1. **Remapping rhythm node exercises invalidates existing user progress** — positional `exercise_progress` JSONB records become stale when exercise arrays change index, count, or order. Prevention: write a DB migration clearing `exercise_progress`/`stars` for affected rhythm node IDs before the data file changes deploy; never insert exercises at index 0 or mid-array of a live node.

2. **New `EXERCISE_TYPES` without matching `TrailNodeModal` switch cases cause silent blank-screen failures** — the `default: console.error` branch fires, modal closes, nothing navigates. Prevention: add the constant and the `case` in the same commit; extend `validateTrail.mjs` to verify all exercise type strings have route mappings.

3. **Audio timing drift when using `Date.now()` for tap capture** — AudioContext clock and wall-clock diverge by 15-50ms under main-thread load, turning correct taps into MISSes. Prevention: capture `audioContext.currentTime` as the first line of every `touchstart`/`pointerdown` handler; compare tap time to scheduled beat time both in AudioContext seconds.

4. **iOS AudioContext suspension silences sample-based games with no error** — `decodeAudioData` succeeds but `bufferSource.start()` produces no sound if context is suspended. Prevention: call `await audioContext.resume()` before every `bufferSource.start()`; use MP3 format only for all instrument samples (iOS Safari does not support OGG).

5. **TrailMap hardcoded 3-tab logic breaks silently when 4th tab is added** — `premiumLockedNodeIds`, progress fetching, and boss node filtering all encode a 3-category assumption in 8+ separate if/else chains. Prevention: refactor TrailMap to data-driven `TRAIL_TAB_CONFIGS` before authoring any `EAR_TRAINING` nodes.

6. **Subscription gate desync — Postgres `is_free_node()` not updated with new ear node IDs** — free users can play but progress saves silently fail (RLS returns null, not an error), causing infinite replay loops for 8-year-olds. Prevention: DB migration updating `is_free_node()` must ship in the same PR as `subscriptionConfig.js` changes.

## Implications for Roadmap

Based on combined research, the natural phase structure follows strict dependency ordering: data layer constants + routing foundation first; audio infrastructure second; simpler games before complex; trail data after game components are routable; coordinated deploy for node remapping.

### Phase 1: Data Foundation + TrailMap Refactor

**Rationale:** Everything else depends on this. New `EXERCISE_TYPES` constants block node data files from being authored. TrailNodeModal routing blocks game navigation. TrailMap refactor must precede EAR_TRAINING node authoring. `validateTrail.mjs` extension prevents silent typo failures at build time. Doing this first eliminates the most catastrophic failure modes for all subsequent phases.
**Delivers:** All 5 new `EXERCISE_TYPES` + `EAR_TRAINING` category in `constants.js`; `TrailNodeModal` with all 6 new `case` entries + `getExerciseTypeName` labels; `validateTrail.mjs` extended to validate exercise type strings; TrailMap refactored to data-driven `TRAIL_TAB_CONFIGS` (4-tab capable); i18n stub keys for all new exercise types in `en/trail.json` + `he/trail.json`.
**Addresses:** Foundation for all 6 game types' trail integration; FEATURES.md landscape lock and session timeout dependencies
**Avoids:** Critical Pitfall 2 (silent route misses), Critical Pitfall 5 (hardcoded TrailMap tabs), Minor Pitfall 4 (validateTrail type validation), Minor Pitfall 1 (missing i18n keys), Minor Pitfall 5 (boss node prefix filtering)
**Research flag:** Standard patterns — direct codebase changes with no external dependencies. HIGH confidence.

### Phase 2: Audio Infrastructure + Rhythm Games (Reading + Dictation)

**Rationale:** `usePianoSampler` hook unblocks all ear training games and rhythm dictation. Rhythm Reading and Rhythm Dictation have the lowest implementation complexity of the new games and reuse the most existing infrastructure (MetronomeTrainer timing, RhythmPatternGenerator, MemoryGame card UI). Building them before Arcade Rhythm validates the tap-timing pattern at lower complexity before the game loop adds risk. Service worker cache version must bump when new audio assets are introduced.
**Delivers:** `usePianoSampler.js` hook with `AudioBuffer` cache; `public/sounds/piano-samples/` C3-C6 WAVs copied from existing library; `RhythmReadingGame` with `audioContext.currentTime` tap capture; `RhythmDictationGame` with tap-to-hear gate; `calculateTimingThresholds` extracted to shared util; App.jsx routes + LANDSCAPE_ROUTES for both games; service worker bumped to `pianomaster-v9`.
**Uses:** Existing `useAudioEngine`, existing `RhythmPatternGenerator.js`, existing `RhythmNotationRenderer.jsx`, existing `TapArea.jsx`
**Avoids:** Critical Pitfall 3 (timing drift — `audioContext.currentTime` in tap handler), Critical Pitfall 4 (iOS suspension — resume before playback), Moderate Pitfall 1 (touch latency — defer setState to rAF), Moderate Pitfall 2 (bundle size — runtime fetch not Vite import), Moderate Pitfall 5 (audio before user gesture in dictation), Minor Pitfall 3 (SW cache version)
**Research flag:** iOS audio testing requires physical iPad (silent switch behavior, `onstatechange` events). Confirm test device availability before starting. Otherwise standard patterns.

### Phase 3: Ear Training Games (Note Comparison + Interval ID)

**Rationale:** Note Comparison is the simplest new game mechanic (binary button choice, no new assets beyond piano samples from Phase 2). Interval ID builds directly on Note Comparison and shares the piano keyboard SVG component. Together they cover the pedagogically foundational "pitch discrimination" content. Instrument Recognition deferred to Phase 6 due to audio sample asset sourcing complexity — it is the only game with an unresolved external dependency.
**Delivers:** `NoteComparisonGame` with HIGHER/LOWER buttons + animated reveal; `IntervalGame` with Step/Skip/Leap buttons + piano keyboard SVG; shared piano keyboard SVG component; App.jsx routes; `earUnit1Redesigned.js` + `earUnit2Redesigned.js` node files; `expandedNodes.js` updated; `subscriptionConfig.js` with `FREE_EAR_NODE_IDS`; DB migration updating `is_free_node()`.
**Uses:** `usePianoSampler` from Phase 2; note frequency arithmetic reused from existing `usePitchDetection.js` utilities
**Avoids:** Critical Pitfall 6 (subscription gate desync — DB migration in same PR), Moderate Pitfall 3 (daily goals — audit `dailyGoalsService.js` for category hardcoding), Moderate Pitfall 4 (PlayNext ignoring ear training), Minor Pitfall 2 (order numbers — use 300+ range)
**Research flag:** Audit `dailyGoalsService.js` for hardcoded category lists before this phase ships. Standard implementation patterns otherwise.

### Phase 4: Ear Training Trail Data + Trail Tab

**Rationale:** Trail unit files and the TrailMap Ear tab can only be finalized after Phase 1 constants and Phase 3 game components are both routed and tested end-to-end. Boss node category convention must be confirmed before authoring boss nodes (use `category: 'boss'` + `isBoss: true` per existing pattern for all boss nodes).
**Delivers:** TrailMap with 4th "Ear" tab rendered; BUBBLE_COLORS + MODAL_ICON_STYLES entries for `ear_training` (amber/teal palette distinct from existing blue/purple/green/gold); earUnit1/2 node data wired end-to-end through VictoryScreen and XP; boss ear nodes with correct category; `skillTrail.js` UNITS metadata for EAR_TRAINING.
**Avoids:** Minor Pitfall 5 (boss node prefix filtering resolved by category-based approach from Phase 1 refactor)
**Research flag:** Standard patterns — follows established trail node authoring. Verify boss node category convention in existing data files before authoring.

### Phase 5: Arcade Rhythm Game + Rhythm Node Remapping

**Rationale:** Arcade Rhythm is the highest-complexity game (requestAnimationFrame game loop, latency compensation, falling-tile DOM management with direct mutation) — best built after simpler games validate all integration patterns. Rhythm node remapping is a coordinated deploy: DB migration clearing progress must run before the data file changes reach production users.
**Delivers:** `ArcadeRhythmGame` with rAF loop, `will-change: transform` tiles, `scheduleBeatSequence` helper in `useAudioEngine`, lives system and on-fire mode extracted from `NotesRecognitionGame`; rhythm nodes in units 2-8 remapped to mixed exercise type distribution (~40/30/20/10 MetronomeTrainer/Reading/Dictation/Arcade); DB migration clearing `exercise_progress` + `stars` for remapped nodes with "node refreshed" UI banner.
**Avoids:** Critical Pitfall 1 (progress desync — migration runs before data file changes in production), FEATURES.md anti-pattern of all-same-game-type per unit
**Research flag:** Deploy sequencing is the key risk. Verify the DB migration runs before the data file changes in the Netlify build pipeline. Staging validation: complete a rhythm node to 3 stars, deploy branch, confirm migration cleared progress correctly before merge.

### Phase 6: Instrument Recognition + Dashboard SkillPathProgress

**Rationale:** Instrument Recognition has the only unresolved external dependency (instrument audio clip sourcing) — deferring it lets all other v2.9 content ship without blocking on asset production. `SkillPathProgress` dashboard card is independent of all other phases and fits here as low-complexity polish.
**Delivers:** `InstrumentRecogGame` with HTML `Audio` element playback; `public/sounds/instruments/` MP3 library (piano, violin, trumpet, drum, flute, cello — ~150-200KB each at 128kbps, 3-4 seconds); `earUnit3Redesigned.js` instrument recognition nodes; `SkillPathProgress` dashboard card in `Dashboard.jsx` with 3 mini path summaries.
**Uses:** HTML `Audio` element (not Web Audio API — timing precision not required for identification games); MemoryGame card UI pattern for instrument choice cards; `getNextRecommendedNode()` from `skillProgressService.js` for dashboard card
**Avoids:** Critical Pitfall 4 (iOS — MP3 only, no OGG), Moderate Pitfall 2 (bundle size — HTML Audio element, not Vite-bundled static import)
**Research flag:** Audio asset sourcing is outside standard development workflow and must be resolved before this phase begins. Instrument MP3 clips must be licensed (freesound.org CC0, Splice, or direct recording). Target: 3-4 second characteristic phrases per instrument, ~150-200KB at 128kbps MP3. This is the only external blocking unknown in the milestone.

### Phase Ordering Rationale

- Constants and routing must precede all game development — silent failure modes (Critical Pitfall 2) are catastrophic for a live app with real users and cannot be discovered by users as "works but is a bit rough"
- Infrastructure before games prevents rework — Phase 2's `usePianoSampler` is a dependency of Phase 3; Phase 1's TrailMap refactor is a dependency of Phase 4
- Simpler games before complex validates integration patterns at lower cost — timing model confirmed in Phase 2 before the more demanding rAF game loop in Phase 5
- Ear training game components before trail data files — games must be routable before nodes can be tested end-to-end in the trail system
- DB migration before data file changes is a hard deploy constraint for Phase 5 — not a preference, a correctness requirement for live user progress
- Instrument Recognition last — the only phase with an external asset dependency that could block other work if it shipped earlier

### Research Flags

Phases needing attention during planning:
- **Phase 2:** iOS physical device testing required before signing off. Silent switch + AudioContext `onstatechange` behavior is not replicable in simulator.
- **Phase 3:** Audit `dailyGoalsService.js` for hardcoded category arrays before writing phase spec — if categories are hardcoded, the fix must be in Phase 3 scope.
- **Phase 5:** Explicit deploy sequencing plan required. Confirm that Netlify runs the Supabase migration before serving the updated JS. Document as a deployment checklist item in the phase spec.
- **Phase 6:** Instrument audio clip sourcing must be resolved before this phase begins. Identify source (freesound.org, recording, or commission) and confirm licensing during phase planning.

Phases with standard patterns (no additional research needed):
- **Phase 1:** Pure codebase changes. All patterns verified by direct source inspection. HIGH confidence.
- **Phase 4:** Trail node authoring follows exact same pattern as existing unit files. Tab addition is a one-object array addition after Phase 1 refactor.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | `smplr` AudioContext pass-through API confirmed from npm/GitHub docs but not tested in this codebase; `usePianoSampler` from existing WAVs is HIGH (direct file inspection confirmed library present A1-G7); all other decisions HIGH from direct codebase inspection |
| Features | MEDIUM-HIGH | Game mechanics verified across multiple competitor apps and music education research; age-appropriateness cross-referenced with child development literature; implementation complexity estimates from codebase inspection |
| Architecture | HIGH | All integration points derived from direct codebase inspection; precedent from NoteSpeedCards (v2.8) and MetronomeTrainer confirmed; anti-patterns identified from live code review |
| Pitfalls | HIGH | All critical pitfalls identified from direct codebase inspection of live data structures, service worker, subscription gate, and TrailMap; supplemented by Web Audio timing and iOS audio research |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **smplr vs. self-hosted MP3s for Instrument Recognition:** Architecture research found the existing WAV library sufficient for piano notes (`usePianoSampler`), but Instrument Recognition still needs non-piano instrument clips. Options are: (a) `smplr Soundfont` for GM instrument samples via CDN, (b) self-hosted MP3s in `public/sounds/instruments/`. Decision should be made at Phase 6 planning based on whether CDN delivery is acceptable for the app's offline use case. Self-hosted MP3s give full offline support; `smplr Soundfont` requires network on first load with CacheStorage on subsequent loads.
- **Instrument audio clip sourcing:** No specific source identified for instrument recognition clips. Must be resolved before Phase 6. Options: freesound.org (CC0 license), Splice, or direct recording. Target: 3-4 second characteristic phrases per instrument, 128kbps MP3, ~150-200KB each, 6 instruments minimum.
- **iOS physical device testing:** Critical Pitfall 4 (silent switch, `onstatechange` behavior) and OGG format validation require physical iPad — iOS Simulator does not replicate these behaviors. Confirm test device availability before Phase 2 begins.
- **`dailyGoalsService.js` category hardcoding:** Not fully audited in this research. Must be checked before Phase 3 ships to confirm ear training exercises credit daily goals.

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `src/data/constants.js` — existing EXERCISE_TYPES, NODE_CATEGORIES
- `src/components/trail/TrailNodeModal.jsx` — navigateToExercise switch-case, hardcoded 3-tab if/else chains
- `src/components/trail/TrailMap.jsx` — TRAIL_TABS array, hardcoded 3-tab logic in 8+ locations
- `src/hooks/useAudioEngine.js` — lookahead scheduler, createPianoSound, timing thresholds
- `src/contexts/AudioContextProvider.jsx` — singleton pattern, iOS interruption handling
- `src/components/games/rhythm-games/MetronomeTrainer.jsx` — auto-start pattern, timing model, handleNextExercise pattern
- `src/assets/sounds/piano/` — complete chromatic WAV library A1-G7 confirmed present
- `src/services/skillProgressService.js` — exercise_progress JSONB positional index schema
- `src/config/subscriptionConfig.js` — FREE_NODE_IDS Set, is_free_node() manual sync requirement
- `public/sw.js` — cache-first on `/assets/*`, no audio file exclusion, current version `pianomaster-v7`
- `scripts/validateTrail.mjs` — exercise type validation gap confirmed

### Secondary (MEDIUM confidence — official docs + npm packages)
- [smplr npm v0.16.4](https://www.npmjs.com/package/smplr) — AudioContext constructor API, SplendidGrandPiano + Soundfont classes
- [smplr GitHub (danigb/smplr)](https://github.com/danigb/smplr) — instrument list, start/stop API, CDN sample hosting
- [web.dev/audio-scheduling](https://web.dev/articles/audio-scheduling) — authoritative lookahead scheduler pattern
- [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) — game loop timing
- [MDN CSS animation performance](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance) — will-change: transform compositor thread
- [Rhythmic Village app mechanics](https://www.classplash.de/en/rhythmicvillage/) — rhythm dictation and ear training competitor analysis
- [Theta Music Trainer game catalog](https://trainer.thetamusic.com/en/content/music-games) — ear training interaction patterns
- [EarMaster interval game mechanics](https://www.earmaster.com/) — interval identification patterns
- [Step/Skip/Leap interval teaching](https://www.fundamentalsofmusic.com/melody-melodic-intervals-of-step-skip-leap.html) — age-appropriate vocabulary for 8-year-olds
- [Pitch perception in children 8-10 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11789513/) — developmental appropriateness validation

### Tertiary (MEDIUM confidence — supplementary)
- [FTC COPPA guidance on voice recording (Fenwick)](https://www.fenwick.com/insights/publications/ftcs-new-coppa-guidance-on-recording-childrens-voices-five-tips-for-app-developers-and-toymakers-to-comply) — voice recording COPPA classification (relevant to any future mic ear training)
- [Rhythm Quest Devlog 10 — Latency Calibration](https://ddrkirbyisq.medium.com/rhythm-quest-devlog-10-latency-calibration-fb6f1a56395c) — tap latency decomposition
- [Adactio — Web Audio weirdness on iOS](https://adactio.com/journal/17709) — iOS silent switch AudioContext behavior
- [Apple Developer — iOS audio format support](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/PlayingandSynthesizingSounds/PlayingandSynthesizingSounds.html) — MP3/AAC/WAV only, OGG not supported
- [PWA audio cache test (daffinm/audio-cache-test)](https://github.com/daffinm/audio-cache-test) — runtime cache strategy for audio assets in service workers

---
*Research completed: 2026-03-26*
*Ready for roadmap: yes*
