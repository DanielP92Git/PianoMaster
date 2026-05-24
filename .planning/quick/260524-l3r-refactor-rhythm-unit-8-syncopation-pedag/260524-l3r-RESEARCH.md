# Quick Task 260524-l3r: Refactor Rhythm Unit 8 — Research

**Researched:** 2026-05-24
**Domain:** MixedLessonGame question-type extension, rhythm pattern catalog weighting, Unit 8 data refactor
**Confidence:** HIGH (all findings verified in-source)

## CORRECTIONS (post-rebase, 2026-05-24)

The initial research ran against `origin/main` which was 5 commits behind local `main`. Two findings are stale; all others survive verbatim.

1. **Node count baseline is 8, not 6.** Local commit `d49c44e` expanded Unit 8 from 6 → 8 nodes (5 syncopation core + Mixed Practice + Speed + Boss). The architect's target of 7 nodes is unchanged, so the _output_ is identical — only the framing of "what we're starting from" shifts. The diff is **8 → 7**, not 6 → 7. Net reduction of 1 node (removes one of the redundant 2-bar practice nodes; adds the creative `compose_rhythm` node).

2. **`long-syncopation` tag exists in 1 pattern (q_44_003), not zero.** Local commit `d49c44e` re-scoped the tag to exclusively the canonical q-h-q pattern. **However, the planner should still DROP `long-syncopation` from the new design** per CONTEXT.md decision A (q-h-q is reframed as "agogic accent," not syncopation, and the word "syncopation" is reserved for 8-q-8). The single q_44_003 pattern can remain in the catalog tagged `quarter-half` (which it already carries) — drop only the `long-syncopation` tag itself, or leave the tag orphaned. Recommend dropping the tag from the pattern entirely to avoid an orphan tag warning from `validatePatternTagCoverage`.

3. **Test file has 18 it() blocks, not 16.** Local commit `d49c44e` added 2 new assertions (`longer-phrase nodes (2, 4, 5, 6) use measureCount 2` and `dotted syncopation is no longer taught in Unit 8`). Both will break under the new 7-node design and need rewriting. Net break count is now **~12 of 18 assertions**, not 10 of 16. Plan a full test file rewrite (already the recommendation).

4. **`Combined-values node variety (DATA-04)` describe block reference Unit 1/2/3** — confirmed unchanged, still survives untouched.

All other findings — MixedLessonGame contract, pattern catalog counts for tags other than `long-syncopation`, generator selection mechanics, boss-weighting math, engine plumbing verification, validator gating, XP arc analysis, file-touch surface table — are accurate against the current source.

---

## Summary

The architect's locked design assumes a 7-node Unit 8 with a new `compose_rhythm` question type, a body-split visual pulse on Node 4, per-question score tracking, and a boss that hits ≥50% syncopated bars. Source investigation reveals four important deltas the planner must absorb:

1. **Current Unit 8 has 6 nodes (5 + boss), not 8.** The PEDAGOGY-REVIEW.md "8 → 7" framing predates a 2026-05 restructure. The diff is actually **6 → 7** (one new node — the `compose_rhythm` Node 5).
2. **The `long-syncopation` tag does not exist in the pattern catalog.** All `[ASSUMED]` references to it in the design must be resolved either by introducing the tag with curated patterns or by dropping it.
3. **The boss-weighting problem is concretely measurable.** Under the proposed strict boss config (`tags: [syncopation, quarter-half, quarter-eighth]`, `durations: [q,h,8]`, `patternTagMode: any`), only **5 of 25 eligible patterns (20%)** are syncopated. The architect's ≥50% target is unreachable without one of two interventions described below.
4. **Per-question scoring is not currently tracked.** `MixedLessonGame` records aggregate `results: boolean[]`; question-specific success criteria like "≥70% on the two `rhythm_tap` echo questions" require either a new tracking field or simplification of the criterion.

**Primary recommendation:** Build `compose_rhythm` as a thin renderer that reuses `binaryPatternToBeats` + `schedulePatternPlayback`. Solve boss weighting with **option (a) — curated `syncopation-heavy` tag** applied to existing syncopated patterns plus 4-6 new pattern entries. Defer per-question score tracking — relax the architect's Node 2 criterion to aggregate-only.

## 1. MixedLessonGame Question Type Contract

### Question object shape

Authored in `rhythmConfig.exercises[0].config.questions[]` (array of `{ type, ...extras }`). Currently supported `type` values (verified in `MixedLessonGame.jsx` lines 215-287 + dispatch lines 519-575):

| Type                 | Extra authored fields           | Generation path in `startGame`                                                  |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------- |
| `discovery_intro`    | `focusDuration: 'qd'\|'8'\|...` | passes through                                                                  |
| `rhythm_tap`         | none                            | `buildRhythmTapConfig()` from node `rhythmConfig`                               |
| `pulse`              | none                            | same as rhythm_tap (config wrapper around metronome)                            |
| `rhythm_reading`     | none                            | same as rhythm_tap                                                              |
| `rhythm_dictation`   | none                            | resolves a pattern via `resolveByTags`/`resolveByAnyTag`, generates distractors |
| `count_subdivision`  | `target`, `subdivision`         | `generateCountSubdivisionQuestion`                                              |
| `visual_recognition` | none                            | `generateQuestions(pool, ALL_DURATION_CODES, 1)`                                |
| `syllable_matching`  | none                            | same + `{ dedupSyllables: true }`                                               |

### Dispatch table

`MixedLessonGame.jsx` lines 519-575, `renderQuestion()` — a plain `switch(currentQuestion.type)`. **The new symbol the planner extends is this switch.**

### Lifecycle contract for a renderer

Each renderer component receives different prop sets depending on whether it's a "card-select" question or a "stateful tap" question:

- **Card-select** (`visual_recognition`, `syllable_matching`, `count_subdivision`): props `{ question, cardStates, isLandscape, onSelect, disabled }`. Reports completion implicitly when parent calls `onSelect(cardIndex)`; parent computes correctness against `question.correct`/`question.choices`.
- **Stateful "tap" path** (`rhythm_tap`, `pulse`, `discovery_intro`, `rhythm_reading`, `rhythm_dictation`): props `{ question, isLandscape, onComplete, disabled }`. Renderer manages its own sub-state machine and calls `onComplete(onTimeTaps, totalExpectedTaps)`. `MixedLessonGame.handleRhythmTapComplete` then computes `isCorrect = onTimeTaps >= Math.ceil(totalExpectedTaps/2)`.

`compose_rhythm` belongs in the **stateful path**: it owns its own UI lifecycle (tile picking, playback) and reports a binary or graded score back via `onComplete(score, max)`.

### Where audio and notation are handled

- **Audio playback for assembled rhythm patterns:** `src/components/games/rhythm-games/utils/rhythmTimingUtils.js::schedulePatternPlayback(beats, tempo, audioContext, playNote, explicitStartTime?, timeSignature?)`. Takes `{ durationUnits, isRest }[]` beats. Used by `RhythmReadingQuestion`, `DiscoveryIntroQuestion`. **Reuse directly for compose playback.**
- **Notation rendering for VexFlow rhythm staves:** `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` (also a `RhythmNotationRenderer.jsx` canvas-based variant exists — prefer `RhythmStaffDisplay`, it is the shipped pattern and what `PulseQuestion`/`RhythmReadingQuestion` use).
- **Binary → beats conversion:** `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js::binaryPatternToBeats(binary)`. **Use this to convert authored palette tile `binary` arrays into the `beats` form `schedulePatternPlayback` and `RhythmStaffDisplay` expect.**

### Minimum surface area to add `compose_rhythm`

| File                                                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/games/rhythm-games/renderers/ComposeRhythmQuestion.jsx`                | **NEW.** Renderer for the compose flow. Reads `question.tiles[]` (each `{ id, binary, label? }`), `question.slotCount` (= 2), `question.tempo`. Shows tile palette (each tile = `RhythmStaffDisplay` mini + tap-to-preview-playback). Drag-or-tap to drop a tile into one of two 2-bar slots. "Play" button calls `schedulePatternPlayback` on the concatenated beats. On submit calls `onComplete(slotCount, slotCount)` if both slots are filled (treat composition as informational, like `discovery_intro`). |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`                                | Add `case "compose_rhythm":` to the dispatch in `renderQuestion()` (~line 519). In `startGame()` (~line 215), pass-through entry: `if (entry.type === "compose_rhythm") return { type: "compose_rhythm", tiles: entry.tiles, slotCount: entry.slotCount ?? 2, tempo: buildRhythmTapConfig().tempo };`                                                                                                                                                                                                            |
| `scripts/validateTrail.mjs`                                                            | Add `'compose_rhythm'` to the `RENDERER_TYPES` Set (line 393-396) and the `SKIP_EXERCISE_TYPES` Set in `validateMeasureCountPolicy` (~line 611) — compose tiles are pre-authored, not measure-driven.                                                                                                                                                                                                                                                                                                            |
| `src/components/games/rhythm-games/renderers/__tests__/ComposeRhythmQuestion.test.jsx` | **NEW.** Mirror the existing renderer test pattern (`PulseQuestion.test.jsx`, `RhythmDictationQuestion.test.jsx`).                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/locales/{en,he}/common.json`                                                      | New keys for compose UI: tile palette label, "Play your phrase", slot prompts.                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Recommendation: keep `compose_rhythm` informational-success only** (always returns 1/1). The architect's "verification" responsibility lives in the _follow-up_ `rhythm_tap`/`rhythm_reading` questions in Node 5, which already exist. Trying to grade composition correctness opens a rabbit-hole (what makes a 2-bar phrase "correct"?). Stay out of it.

## 2. Pattern Catalog and Boss Weighting

### Catalog counts (4/4 only, verified via `node -e` against `RHYTHM_PATTERNS`)

| Tag                         | Pattern count (4/4)        |
| --------------------------- | -------------------------- |
| `quarter-only`              | 8                          |
| `quarter-half`              | 6                          |
| `quarter-half-whole`        | 13                         |
| `quarter-eighth`            | 20                         |
| `quarter-half-whole-eighth` | 17                         |
| `quarter-rest`              | 12                         |
| `half-rest`                 | 8                          |
| `whole-rest`                | 7                          |
| `dotted-half`               | 10                         |
| `dotted-quarter`            | 12                         |
| `sixteenth`                 | 10                         |
| **`syncopation`**           | **16**                     |
| **`long-syncopation`**      | **0 — TAG DOES NOT EXIST** |
| `dotted-syncopation`        | 16                         |
| Total 4/4 patterns          | 92                         |

### Generator selection mechanics

`resolveByAnyTag(tags, durations, options)` in `src/data/patterns/RhythmPatternGenerator.js` (lines 288-329):

1. Filter `RHYTHM_PATTERNS` to those matching `p.tags.some(tag => tags.includes(tag))` (union).
2. Filter by `timeSignature` if passed.
3. If `allowRests=false`, drop patterns whose `binaryToVexDurations` would emit rest codes given the node `durations`.
4. Drop patterns whose resolved vex codes are not all in `durations` (D-09 safety filter).
5. **Pick uniformly at random** from what remains (`matching[Math.floor(Math.random() * matching.length)]`).

Selection is **uniform random over the union pool**. No tag weighting. No "first match wins." This is the root of the boss dilution.

### Concrete estimate for proposed boss

Under the architect's spec `tags: [syncopation, long-syncopation, quarter-half, quarter-eighth]` × `durations: [q, h, 8]` × `patternTagMode: any` (`long-syncopation` is silently dropped — tag doesn't exist):

- 40 patterns match the union raw
- 25 survive the rest filter + duration-subset filter
- **5 of 25 are syncopated → 20% syncopated bars expected**

The architect's ≥50% requirement **will fail by 30 percentage points** without intervention.

### Two implementation options

**(a) New `syncopation-heavy` tag, curated subset.** Add the tag to existing pattern entries that _exclusively or primarily_ feature syncopation. Boss `patternTags` becomes `['syncopation-heavy']` with `patternTagMode: 'all'` (or `'any'` with just that one tag). One catch: the 16 `syncopation`-tagged patterns may be enough on their own — promote them all to `syncopation-heavy` and the boss draws 100% syncopated bars. If we want some non-syncopated "breathing room" (~30%), tag ~16 syncopated + ~4-6 contrast bars as a single `syncopation-heavy` pool. **Files touched: `src/data/patterns/rhythmPatterns.js` (tag additions only; no new patterns required), `src/data/units/rhythmUnit8Redesigned.js` (boss `patternTags`).** Zero generator changes. Trail validator's `validatePatternTagExistence` will pass automatically once any pattern carries the new tag; `validatePatternTagCoverage` warns on orphan tags only.

**(b) New `rhythmConfig.minPatternRatio` field + generator-side rejection sampling.** E.g. `minPatternRatio: { syncopation: 0.5 }` causes the generator to reject draws that violate the running ratio. Files touched: `RhythmPatternGenerator.js` (new branch in both resolvers, history tracking), `RhythmPatternGenerator.test.js` (new tests), `rhythmUnit8Redesigned.js` (config). Generator becomes stateful (or callers pass history), which is a meaningful architectural change.

**Recommendation: (a).** Lower blast radius, no new generator state, leverages a system the validator already enforces. The cost is curating ~16-22 pattern tag additions — a one-line edit per pattern in `rhythmPatterns.js`. Option (b)'s flexibility is not needed for a single-node use case.

**Also: drop `long-syncopation` from the design.** It's a phantom tag. The q-h-q "agogic accent" patterns the architect was hinting at are already covered by `quarter-half`. If we want them as a distinct pool, that's a separate curation pass — and the architect explicitly de-emphasized q-h-q for the boss anyway.

## 3. Engine Plumbing Verification

| Feature                                          | Status                                        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pulse` question type                            | **EXISTS**                                    | `MixedLessonGame.jsx:219` (config build) + `:536-544` (dispatch) → `src/components/games/rhythm-games/renderers/PulseQuestion.jsx`. Plays 4 measures of metronome, child taps along, evaluates `onTimeTaps/totalExpectedBeats`. Works against the metronome via `useAudioEngine` + `scheduleBeatClicks`. **Use as-is for Node 1's 4/4 re-grounding question and Node 4's pulse opener.**                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `compose_rhythm` question type                   | **DOES NOT EXIST**                            | Verified by `grep -rn "compose_rhythm\|composeRhythm" src/` returning zero matches.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Per-question score tracking                      | **NOT TRACKED**                               | `MixedLessonGame.jsx:337` stores `setResults((prev) => [...prev, isCorrect])` — a `boolean[]` aligned by index to `questions[]`. The information is _available_ in the array (questions[i] ↔ results[i]) but not threshold-checked per type. The architect's Node 2 success criterion ("≥70% on the two `rhythm_tap` echo questions specifically") would need either: (i) per-renderer success thresholds in node config + VictoryScreen logic to enforce, or (ii) simplification to aggregate. **Recommend: simplify the criterion in Node 2** to "≥80% aggregate" — that's what VictoryScreen already enforces via existing star thresholds (60/80/95).                                                                                                                                                               |
| Body-split visual pulse on `rhythm_tap` (Node 4) | **NOT IMPLEMENTED, partial precedent exists** | `PulseQuestion` already has a beat-synced `beatPulse` state driving a circle pulse (lines 282-295). `RhythmTapQuestion` does NOT carry this hook. Cheapest add: a `showPulseIndicator?: boolean` prop on `RhythmTapQuestion` that, when true, renders a small pulsing dot synchronized to the `MetronomeDisplay` already in the component. Toggle by adding `showPulseIndicator: true` in the authored entry: `{ type: "rhythm_tap", showPulseIndicator: true }`. **Critically: CONTEXT.md decision-D explicitly allows degraded fallback.** Recommend gating this on a stretch flag — ship Node 4 without the visual pulse first, add it as a follow-up plan if time permits.                                                                                                                                           |
| XP value range (60/100/250 arc)                  | **NO HARD CLAMP**                             | `src/utils/xpSystem.js` has `MAX_STATIC_LEVEL = 30` (line 49) and uses `Math.max(0, Math.min(100, scorePercentage))` for percentage clamping (line 363), but **no `xpReward` upper bound is enforced anywhere**. Boss already carries `xpReward: 250` (current shipped value). `validateTrail.mjs` `validateXPEconomy` (lines 175-236) computes per-category totals and warns at >10% variance _between treble/bass/rhythm paths_ — local 60→100→250 dip-spike does NOT trigger this warning since it's intra-rhythm. **The proposed XP arc will work without code changes.** Also: the existing test `xpReward values are in valid range` (line 138) asserts `>=75 && <=90` for regular nodes and `===250` for boss — **this test will fail** with the new arc (60 and 100 fall outside [75,90]). Test must be updated. |

## 4. Test and Verification Surface

### `src/data/units/rhythmUnit8Redesigned.test.js` (200 lines)

Currently 16 `it()` blocks across 3 `describe()` groups. Survival/break analysis for the new 7-node design:

| Test                                                 | Current assertion                                                 | Status under new design                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exports exactly 6 nodes`                            | `toHaveLength(6)`                                                 | **BREAKS.** Update to 7.                                                                                                                                |
| `all node IDs are unique`                            | `Set(ids).size === 6`                                             | **BREAKS.** Update to 7.                                                                                                                                |
| `node IDs follow naming convention`                  | hard-coded array of 6 IDs                                         | **BREAKS.** Rewrite to `[rhythm_8_1, ...rhythm_8_6, boss_rhythm_8]`.                                                                                    |
| `orders are sequential from 144 to 149`              | `[144..149]`                                                      | **BREAKS.** Update to `[144..150]`.                                                                                                                     |
| `prerequisite chain is valid`                        | walks the chain                                                   | survives if linear chain holds                                                                                                                          |
| `regular nodes use 4/4`                              | slice(0,5)                                                        | **BREAKS.** Update to slice(0,6).                                                                                                                       |
| `all nodes use pitch C4`                             | each `pitch === 'C4'`                                             | survives if respected                                                                                                                                   |
| `first node is syncopation discovery`                | `newContentDescription === 'Syncopation: Tap between the beats!'` | **BREAKS.** Node 1 is now q-h-q "Hold-Across Warm-Up". Content description changes per CONTEXT.md decision A.                                           |
| `third node introduces dotted quarter-eighth`        | `durations.includes('qd')` + dotted desc                          | **BREAKS.** Node 3 is now "Read the Off-Beat" (8-q-8 reading). Dotted-quarter is OUT entirely per CONTEXT.md decision D (boss restricted to `[q,h,8]`). |
| `regular nodes use rhythm category`                  | slice(0,5)                                                        | **BREAKS.** Update to slice(0,6).                                                                                                                       |
| `regular node exercise types match game-type policy` | hard-coded type list                                              | **BREAKS.** Update for 6 regular nodes (5 mixed_lesson + 1 arcade_rhythm for Node 6 speed).                                                             |
| `boss node exercise is MIXED_LESSON`                 | last node                                                         | survives                                                                                                                                                |
| `boss node has correct ID and properties`            | `id === 'boss_rhythm_8'`, etc                                     | survives (id preserved per CONTEXT.md constraints)                                                                                                      |
| `boss has 250 XP reward`                             | `===250`                                                          | survives                                                                                                                                                |
| `boss has accessory unlock`                          | `=== 'advanced_rhythm_badge'`                                     | survives if kept                                                                                                                                        |
| `boss has 1 MIXED_LESSON exercise with 12 questions` | `.toHaveLength(12)`                                               | **BREAKS.** CONTEXT.md decision D drops to 10.                                                                                                          |
| `tempo increases across the unit`                    | first.default < last_regular.default                              | survives (60 → 90)                                                                                                                                      |
| `xpReward values are in valid range`                 | regular nodes 75-90                                               | **BREAKS.** New arc is 60-100. Update bounds to 50-110 (or remove).                                                                                     |

The 3 `it()` blocks in `Combined-values node variety (DATA-04)` describe block reference Unit 1/2/3 nodes, NOT Unit 8 — they survive untouched.

**Net: 10 of 16 Unit-8-specific assertions break.** Plan a full rewrite of `rhythmUnit8Redesigned.test.js` rather than incremental patching.

### `npm run verify:trail` (= `scripts/validateTrail.mjs`)

Runs as a `prebuild` hook. Validators that touch Unit 8:

| Validator                     | Will it trigger on our changes?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validatePrerequisiteChains`  | Yes — must ensure `rhythm_8_1` prereqs `boss_rhythm_7` and new Node 5 / Node 6 chain correctly.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `validateDuplicateIds`        | Yes — new IDs must be unique.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `validateXPEconomy`           | Yes but lenient — only warns on >10% inter-path variance. 60+80+85+85+100+90+250 = 750 for Unit 8, contributes ~750 of rhythm total (~3000). Won't change variance much.                                                                                                                                                                                                                                                                                                                                                                                          |
| `validateExerciseTypes`       | Yes — `compose_rhythm` is a question type, NOT an exercise type. Exercise is still `mixed_lesson`. No change needed.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `validateMultiAngleGames`     | Watch out — Node 1 has only `['q','h']` (2 non-rest durations), triggers the "should include at least one multi-angle game" warning unless we include `visual_recognition` or `syllable_matching`. The architect's Node 1 question list (`discovery_intro → pulse → rhythm_tap → visual_recognition → rhythm_tap → rhythm_reading`) DOES include visual_recognition — passes.                                                                                                                                                                                     |
| `validateMixedLessons`        | **`RENDERER_TYPES` Set at line 393 must be updated to include `'compose_rhythm'`** or validator hard-errors. Also enforces 8-10 questions per node (4 minimum for discovery, 10-12 for boss). New Node 2 has 7 questions = passes discovery minimum. New Node 5 has 5 questions = **fails the 8-question minimum.** Either bump Node 5's question count to 8 (add more verifies), or relax the validator threshold for `compose_rhythm`-containing nodes. **Recommend: update validator to allow `length >= 5` when the node contains a `compose_rhythm` entry.** |
| `validatePatternTagExistence` | If we add `syncopation-heavy` tag and reference it in boss config, validator will pass once at least one pattern carries the tag.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `validatePatternTagCoverage`  | If we add a tag but forget to reference it, warns (not errors).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `validateDurationSafety`      | For each tag the boss references, at least one pattern must render with `[q,h,8]`. The 16 `syncopation`-tagged patterns and the planned `syncopation-heavy` subset must include compatible patterns.                                                                                                                                                                                                                                                                                                                                                              |
| `validateGameTypePolicy`      | Node 6 (`speed_round`) must use `arcade_rhythm`; others `mixed_lesson`. Architect's design respects this.                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `validateMeasureCountPolicy`  | Node-type → measureCount: discovery=1, practice=2, speed_round=4, boss=4. New design respects these per CONTEXT.md (Node 2 = 1 bar discovery; Nodes 3,4 = 2 bar practice; Node 6 = arcade-default; boss = 4 bar). `compose_rhythm` should be added to `SKIP_EXERCISE_TYPES` Set since it's question-type-level, not measure-count-driven.                                                                                                                                                                                                                         |

### `npm run verify:patterns` (= `scripts/patternVerifier.mjs`)

**Does NOT touch `rhythmPatterns.js`.** It's for the sight-reading game's `patternBuilder.js`. Adding a new tag or pattern entries to `rhythmPatterns.js` does NOT require updating this script.

## Decisions for the Planner (recommended, not locked)

1. **Build `compose_rhythm` informational-only.** Always reports 1/1 success. Authored tiles in node config: `{ type: "compose_rhythm", tiles: [...], slotCount: 2 }`.
2. **Solve boss weighting via curated `syncopation-heavy` tag.** Apply to existing 16 syncopation-tagged + ~4-6 contrast patterns. Update boss `patternTags: ['syncopation-heavy']`, drop `long-syncopation` from the design entirely.
3. **Drop the per-question score criterion** in Node 2's success spec. Use aggregate ≥80% (engine default).
4. **Ship Node 4 without the body-split visual pulse.** Flag as follow-up; renderer change adds risk for marginal gain. CONTEXT.md decision D allows this.
5. **Keep boss at id `boss_rhythm_8`** (CONTEXT.md constraint). Update its `questions` array to 10 entries.

## Estimated Implementation Surface

| File                                                                                   | Change                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/data/units/rhythmUnit8Redesigned.js`                                              | **REWRITE.** 6 → 7 nodes. New IDs/orders/prereqs. New question sequences per architect's Nodes 1-7. Boss `patternTags: ['syncopation-heavy']`, `durations: [q,h,8]`, questions array trimmed to 10. XP arc 60/80/85/85/100/90/250.                                                               |
| `src/data/units/rhythmUnit8Redesigned.test.js`                                         | **REWRITE.** ~10 of 16 assertions break; full rewrite is cleaner than patching.                                                                                                                                                                                                                  |
| `src/data/patterns/rhythmPatterns.js`                                                  | **EDIT.** Add `'syncopation-heavy'` tag to ~16 existing syncopation patterns + add 4-6 contrast patterns also tagged `syncopation-heavy` so the boss draws ~70-80% syncopated bars.                                                                                                              |
| `src/components/games/rhythm-games/renderers/ComposeRhythmQuestion.jsx`                | **NEW.** ~150-250 LOC. Tile palette, slot drop targets, "Play" button, calls `onComplete(slotCount, slotCount)`. Reuses `RhythmStaffDisplay`, `binaryPatternToBeats`, `schedulePatternPlayback`.                                                                                                 |
| `src/components/games/rhythm-games/renderers/__tests__/ComposeRhythmQuestion.test.jsx` | **NEW.** Mirror `PulseQuestion.test.jsx`. Mock `useAudioEngine`. Assert tiles render, slot fills, onComplete fires.                                                                                                                                                                              |
| `src/components/games/rhythm-games/MixedLessonGame.jsx`                                | **EDIT.** Add `compose_rhythm` import + pass-through case in `startGame()` (~line 215) + dispatch case in `renderQuestion()` (~line 519).                                                                                                                                                        |
| `scripts/validateTrail.mjs`                                                            | **EDIT.** (1) Add `'compose_rhythm'` to `RENDERER_TYPES` Set (line 393). (2) Add `'compose_rhythm'` to `SKIP_EXERCISE_TYPES` Set in `validateMeasureCountPolicy` (line 611). (3) Relax `validateMixedLessons` minimum-question check to `>=5` when any question in the node is `compose_rhythm`. |
| `src/locales/en/trail.json`                                                            | **EDIT.** Rename Unit 8 node labels per architect (Hold-Across Warm-Up, Surprise Beat, Read the Off-Beat, Body Split, Build a Syncopation, Off-Beat Speed Drill). Update descriptions. Drop `Syncopation Shuffle`.                                                                               |
| `src/locales/he/trail.json`                                                            | **EDIT.** Mirror Hebrew translations. Follow `feedback_hebrew_nikud.md` memory — reserve "סינ-קו-פה" for 8-q-8 nodes only per CONTEXT.md decision.                                                                                                                                               |
| `src/locales/en/common.json`                                                           | **EDIT.** Add compose UI strings (e.g. `compose.palette`, `compose.slot.empty`, `compose.play`, `compose.instruction`).                                                                                                                                                                          |
| `src/locales/he/common.json`                                                           | **EDIT.** Mirror Hebrew strings.                                                                                                                                                                                                                                                                 |

**Net: 5 edits + 3 new files + 1 patterns curation pass.** No generator changes, no SQL changes, no validation-script architecture changes.

## Risks

- **Risk:** Hebrew copy for new node names not pre-approved. Mitigation: planner drafts, defers final wording to UAT.
- **Risk:** Curating which existing patterns deserve `syncopation-heavy` is a judgment call. Mitigation: planner spot-checks a sampled run via `node -e` script (same shape as the one in §2) before marking done.
- **Risk:** Adding `compose_rhythm` opens a UX rabbit-hole (drag-vs-tap interaction, tile preview audio overlap, RTL layout). Mitigation: CONTEXT.md decision C scoped MVP to "palette of 4-6 tiles, drag 2 to a 2-bar slot" — stay strictly within that. Defer animations, hint systems, tile previews beyond simple tap-to-hear.

## Sources

- `src/components/games/rhythm-games/MixedLessonGame.jsx` (full read)
- `src/components/games/rhythm-games/renderers/PulseQuestion.jsx` (full read — confirms metronome+pulse plumbing)
- `src/components/games/rhythm-games/renderers/RhythmTapQuestion.jsx` (lines 1-120 — confirms onComplete signature, no pulse indicator)
- `src/components/games/rhythm-games/renderers/DiscoveryIntroQuestion.jsx` (lines 1-40 — informational success pattern)
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` (lines 340-400 — `schedulePatternPlayback` signature)
- `src/components/games/rhythm-games/utils/rhythmVexflowHelpers.js` (lines 30-90 — `binaryPatternToBeats`)
- `src/data/patterns/rhythmPatterns.js` (sampled; full tag-count via `node -e`)
- `src/data/patterns/RhythmPatternGenerator.js` (full read — confirms uniform selection over union)
- `src/data/units/rhythmUnit8Redesigned.js` (full read — current 6-node state)
- `src/data/units/rhythmUnit8Redesigned.test.js` (full read — assertion inventory)
- `scripts/validateTrail.mjs` (full read — all validators)
- `scripts/patternVerifier.mjs` (full read — confirmed unrelated to rhythmPatterns)
- `src/utils/xpSystem.js` (grep — no `xpReward` clamp)
- `src/locales/en/trail.json`, `src/locales/he/trail.json` (grep — current Unit 8 keys)
- Live `node -e` evaluation against `RHYTHM_PATTERNS` for tag counts and proposed-boss filter chain
