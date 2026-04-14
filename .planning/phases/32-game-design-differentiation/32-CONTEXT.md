# Phase 32: Game Design Differentiation - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Tune gameplay so speed challenge nodes, boss nodes, and the current "Rhythm Patterns" (Mix-Up) slot each feel distinct from regular practice nodes — and from each other. This is a **data + tuning** phase over existing games and pattern infrastructure. No new game types. No new rhythm mechanics (PLAY-01 hold already shipped in Phase 31).

Satisfies REQUIREMENTS.md PLAY-02, PLAY-03, PLAY-04.

</domain>

<decisions>
## Implementation Decisions

### Speed Challenge Tuning (PLAY-02)

- **D-01:** Session length reduced to **8 patterns** (was hardcoded 10 in `ArcadeRhythmGame.TOTAL_PATTERNS`). Matches 2-3 min target in nodeTypes metadata and 8-year-old attention span.
- **D-02:** **No two consecutive identical patterns** within a session. Variety enforced at pattern selection time. Satisfies success criterion 1 literally.
- **D-03:** Tempo stays **fixed from node config** for the whole session (no ramp, no adaptive scaling). Adaptive tempo is explicitly deferred (PLAY-F02).
- **D-04:** Pattern pool scope unchanged — Speed Round continues using the same `patternTags` as the unit's practice node. Variety comes from shuffle rules, not new content.

### Boss Difficulty Levers (PLAY-03)

- **D-05:** **Scale levers by boss type.** MINI_BOSS = subset (wider duration set + harder question mix). Full BOSS = all four levers stacked (adds 4-bar patterns + hard timing tier).
- **D-06:** **Wider duration set = cumulative prior units.** A Unit N boss pulls from duration sets introduced in Units 1..N. Creates the "everything you know" feeling. Applies to both MINI_BOSS and BOSS per D-05.
- **D-07:** **Reduced timing forgiveness for full BOSS only.** Remove BOSS nodes from `EASY_NODE_TYPES` so they fall back to default (stricter) thresholds. No new threshold tier. MINI_BOSS retains easy thresholds.
- **D-08:** **Full BOSS patterns = 4 bars** (uses existing `trailMeasureCount` wiring from Phase 23). MINI_BOSS pattern length unchanged.
- **D-09:** **Harder question type mix for BOSS.** BOSS MIXED_LESSON sequences emphasize `rhythm_dictation` + `rhythm_reading` over `rhythm_tap` + `syllable_matching`. Data-only edit to existing hand-authored question arrays.
- **D-10:** Keep standard VictoryScreen, existing 60/80/95 star thresholds, existing accessory unlocks for all boss types. Hardness lives in the content, not the gate. No new celebration UI in this phase.

### Rhythm Pattern Nodes — Removed (PLAY-04)

- **D-11:** **Remove the 6 rhythm Mix-Up "Rhythm Patterns" nodes** entirely. Affected IDs: `rhythm_1_5`, `rhythm_2_5`, `rhythm_3_5`, `rhythm_6_5`, `rhythm_7_5`, `rhythm_8_5` (Units 1, 2, 3, 6, 7, 8 — Units 4 and 5 already use alternate structures and are unaffected).
- **D-12:** **Shrink affected units to 6 nodes.** New flow per affected unit: Discovery → Practice → Discovery → Practice → Speed Round → Mini-Boss (or BOSS for Units 6 & 8). Satisfies PLAY-04's "unique content or replaced" criterion via removal.
- **D-13:** **Re-wire Speed Round prerequisites** from `rhythm_X_5` → `rhythm_X_4` in each affected unit file. Update `orderInUnit` + `order` fields on subsequent nodes so the trail is continuous.
- **D-14:** **Leave orphaned `student_skill_progress` rows untouched.** No DB migration. `getNodeById()` returns undefined for removed IDs; UI simply doesn't surface them. Pre-launch beta users lose those stars; no production risk.
- **D-15:** **Fully delete the node objects.** No backward-compat comments. Clean removal.

### Shared Difficulty Vocabulary

- **D-16:** **Document 4 difficulty levers in `src/data/PEDAGOGY.md`.** Levers:
  1. **Pool scope** — current unit / cumulative / curated tag
  2. **Pattern length** — 1 / 2 / 4 bars (per existing Phase 23 measure-count policy)
  3. **Timing tier** — easy (EASY_NODE_TYPES) / default / (future: hard)
  4. **Question mix** — tap-heavy / reading-heavy / dictation-heavy emphasis
     (Tempo stays where it lives: `rhythmConfig.tempo`.)
     Gives future unit authors a reference for tuning new rhythm nodes.
- **D-17:** **Leave `rhythmConfig.complexity` field untouched.** SIMPLE/MEDIUM/VARIED/ALL enum is low-value but harmless. Flag as a deferred cleanup idea — do not refactor in this phase.

### Claude's Discretion

- Exact algorithm for "no two consecutive identical" (array diff check, shuffle-with-memory, Fisher-Yates with rejection, etc.)
- How to identify pattern "identity" for dedup (pattern `id` field, binary signature, or beat structure)
- Whether `TOTAL_PATTERNS` becomes a per-node config field or stays a module-level constant
- How to represent "cumulative prior units' durations" in node config — new `rhythmConfig` field (e.g., `includePreviousUnits: true`) vs. derived from unit number at resolution time
- Exact ordering of boss question types for the harder mix (dictation first? interleaved?)
- Exact migration approach for unit file edits (one file at a time vs. single commit)
- Exact text of the PEDAGOGY.md "4 levers" section
- Whether the variety rule in Speed Challenge also applies to rest tiles (edge case for predominantly-rest pools)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/REQUIREMENTS.md` — PLAY-02, PLAY-03, PLAY-04 definitions and acceptance criteria
- `.planning/ROADMAP.md` — Phase 32 goal, dependencies, 4 success criteria

### Prior Phase Context (infrastructure these decisions rely on)

- `.planning/phases/23-ux-polish/` — measure count policy, EASY_NODE_TYPES timing tier
- `.planning/phases/26-restore-ux-regression/` — restored timing + measure count wiring
- `.planning/phases/29-code-quality-data-fixes/29-CONTEXT.md` — recent data fixes to rhythm units
- `.planning/phases/31-long-press-sustain/31-CONTEXT.md` — hold mechanic (Phase 31) may interact with boss timing tier decision

### Unit Data (primary edit surface)

- `src/data/units/rhythmUnit1Redesigned.js` — remove `rhythm_1_5`, retarget `rhythm_1_6` prereq, re-tune MINI_BOSS at `boss_rhythm_1`
- `src/data/units/rhythmUnit2Redesigned.js` — remove `rhythm_2_5`, retarget `rhythm_2_6` prereq, re-tune MINI_BOSS
- `src/data/units/rhythmUnit3Redesigned.js` — remove `rhythm_3_5`, retarget `rhythm_3_6` prereq, re-tune MINI_BOSS
- `src/data/units/rhythmUnit4Redesigned.js` — no Mix-Up to remove; re-tune MINI_BOSS
- `src/data/units/rhythmUnit5Redesigned.js` — no Mix-Up to remove; re-tune MINI_BOSS
- `src/data/units/rhythmUnit6Redesigned.js` — remove `rhythm_6_5`, retarget `rhythm_6_6` prereq, re-tune full **BOSS** (all 4 levers)
- `src/data/units/rhythmUnit7Redesigned.js` — remove `rhythm_7_5`, retarget `rhythm_7_6` prereq, re-tune MINI_BOSS
- `src/data/units/rhythmUnit8Redesigned.js` — remove `rhythm_8_5`, retarget `rhythm_8_6` prereq, re-tune full **BOSS** (all 4 levers)

### Game Components

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — `TOTAL_PATTERNS` constant (D-01), pattern selection loop (D-02)
- `src/components/games/rhythm-games/RhythmPatternGenerator.js` — `resolveByTags()` / `getPattern()` — may need cumulative-units resolution helper (D-06)
- `src/components/games/rhythm-games/MixedLessonGame.jsx` — boss question sequences, measure count wiring (D-08, D-09)
- `src/components/games/rhythm-games/utils/rhythmTimingUtils.js` — `EASY_NODE_TYPES` set, `calculateTimingThresholds()` (D-07)

### Trail Infrastructure

- `src/data/nodeTypes.js` — NODE_TYPES enum, NODE_TYPE_METADATA, RHYTHM_COMPLEXITY (D-17 flag)
- `src/data/skillTrail.js` — `getNodeById()` (returns undefined for removed IDs — validates D-14 assumption)
- `src/data/expandedNodes.js` — aggregates unit files
- `scripts/validateTrail.mjs` — prebuild validator (will catch broken prereqs after Mix-Up removal — rely on this as a safety net)

### Documentation Target

- `src/data/PEDAGOGY.md` — destination for D-16 difficulty-levers vocabulary section

### Design System

- `docs/DESIGN_SYSTEM.md` — glassmorphism patterns (no UI changes in this phase; referenced for non-regression)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ArcadeRhythmGame.TOTAL_PATTERNS` already a named module constant — easy to change to 8 (D-01)
- `EASY_NODE_TYPES` set in `rhythmTimingUtils.js` is the single switch for timing forgiveness — removing BOSS from the set gives D-07 with zero new code
- `trailMeasureCount` prop wiring from Phase 23 already threads measure count through RhythmReadingGame and MixedLessonGame question renderers — reuse for D-08
- `RhythmPatternGenerator.resolveByTags()` already resolves patterns by tag array — D-06's cumulative duration set needs a helper that builds the tag list from unit number but reuses the same resolver
- Hand-authored MIXED_LESSON question arrays in boss nodes (`boss_rhythm_1` etc.) are already data — D-09 is pure data editing
- `scripts/validateTrail.mjs` runs on `npm run build` and checks prereqs + cycles — removing Mix-Up nodes will break any dangling prereq link, failing the build. That's the safety net for D-13.

### Established Patterns

- Rhythm unit files follow a strict template: `UNIT_ID`, `UNIT_NAME`, `START_ORDER`, nodes array with `orderInUnit` 1..N. Removal = splice array + renumber remaining nodes.
- Node `order` field is `START_ORDER + orderInUnit - 1` — keeping the formula consistent requires recalculating orders when nodes are spliced out.
- `EXERCISE_TYPES.MIXED_LESSON` config takes a `questions: [{ type: "..." }]` array — question-type mix (D-09) is just reordering this array.
- Test files (`rhythmUnit7Redesigned.test.js`, `rhythmUnit8Redesigned.test.js`) assert specific node counts and sequences — will need updates after D-11/D-12.

### Integration Points

- Removed node IDs flow through: `expandedNodes.js` (aggregate) → `getNodeById()` / `getUnlockedNodes()` (lookup) → TrailMap rendering → routed game components. Removing from unit files cascades automatically.
- Orphaned `student_skill_progress.node_id` rows are tolerated because UI queries go through `getNodeById()` — undefined node = skipped render. Confirmed safe for D-14.
- `RhythmPatternGenerator` already supports tag-array resolution so a new unit-cumulative helper doesn't require architecture changes.
- `EASY_NODE_TYPES` consumed by `scoreTap()` via `nodeType` param — already threaded through both RhythmTapQuestion (listen&tap) and PulseQuestion. D-07 works without touching renderer code.

</code_context>

<specifics>
## Specific Ideas

- The 4-lever vocabulary (Pool scope / Pattern length / Timing tier / Question mix) is meant to be applied **independently** — any rhythm node can dial each lever separately. This is the designer's surface area for future content.
- "Boss = everything you know so far" is the core narrative for D-06. Unit 8 BOSS should genuinely feel like a finale because it pulls from all 8 units' duration sets.
- Full BOSS at 4 bars + hard timing + cumulative durations + dictation-heavy Q mix is intentionally stacked. A child who just barely passes a MINI_BOSS should find the corresponding full BOSS clearly harder — not unfair, but clearly a step up.
- Removing Mix-Up rather than refactoring isn't just cheaper — it reflects the honest pedagogical reality that the rhythm trail never had a distinct "Mix-Up" game (unlike treble/bass which use Memory Game). The slot was aspirational filler.

</specifics>

<deferred>
## Deferred Ideas

- **Rhythm Memory Game variant** — a genuinely distinct Mix-Up game for rhythm, analogous to treble/bass Memory Game. Out of scope for v3.3 (explicit "no new rhythm game types" constraint in REQUIREMENTS.md). Future milestone.
- **Adaptive tempo escalation** — already tracked as PLAY-F02 (Future Requirements). Not this phase.
- **`RHYTHM_COMPLEXITY` enum cleanup** — SIMPLE/MEDIUM/VARIED/ALL field appears redundant with `patternTags` + duration set. Flag for a future code-quality phase. Not this phase (D-17).
- **Boss-only celebration VFX/sound** — special finale for full BOSS completion. Would be a polish/UI phase. Not this phase (D-10).
- **New "boss" timing threshold tier** (stricter than default) — considered and rejected for Phase 32; default-tier timing is sufficient differentiation. Future option if default doesn't register as "harder."
- **`TOTAL_PATTERNS` per-node override** — currently speed-count will be 8 globally. Making it per-node is speculative; defer until a unit actually needs 6 or 12.

</deferred>

---

_Phase: 32-game-design-differentiation_
_Context gathered: 2026-04-14_
