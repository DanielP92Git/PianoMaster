# Quick Task 260524-l3r: Refactor Rhythm Unit 8 Syncopation Pedagogy and Engagement - Context

**Gathered:** 2026-05-24
**Status:** Ready for planning

<domain>
## Task Boundary

Refactor Rhythm Unit 8 (syncopation) end-to-end so the flow is pedagogically correct, genuinely engaging, and varied within and between nodes. Target audience: 8-year-old learners. Scope strictly limited to Unit 8 — no other units touched.

**Files in play**

- `src/data/units/rhythmUnit8Redesigned.js` (current 8 nodes + boss → becomes 7 nodes + boss)
- `src/data/units/rhythmUnit8Redesigned.test.js` (assertions need full rewrite)
- `src/data/patterns/rhythmPatterns.js` (may need new `syncopation-heavy` curated subset to fix bar-weighting dilution)
- `src/components/games/rhythm-games/MixedLessonGame.jsx` and a new question-type component for `compose_rhythm`
- `src/locales/en/*.json` and `src/locales/he/*.json` (renamed node titles and copy)

**Pedagogical baseline** (from `PEDAGOGY-REVIEW.md` in this directory)

- Kodaly / Gordon / Orff / Dalcroze converge on: **aural → bodily → visual → notational**
- 8-q-8 is the canonical perceived-syncopation gesture; q-h-q is an _agogic accent_, not really syncopation
- Children at age 8 fatigue at 8-9 questions per node — 6-8 is sustainable
- The currently missing "feeling moment" is: child hears a note where a beat _isn't_ and a silence where a beat _is_
  </domain>

<decisions>
## Implementation Decisions

### Terminology — "syncopation" word usage

- **Reserve the word "syncopation" for 8-q-8 only** in child-facing UI.
- q-h-q is reframed as "Hold across the beat" or "Long-note hold" — no "syncopation" label.
- "Syncopation" continues to be used internally in code (tag names, design docs, comments). Hebrew copy may use "סינ-קו-פה" only on the 8-q-8 nodes.
- Why: Kodaly/Gordon literature treats agogic accent as a distinct concept; conflating them under one word muddies what the child is supposed to feel.

### Game-feel variety — monomodal nodes

- Each regular node specializes in **one dominant modality**: pure listen-and-echo, pure reading, body-split pulse + tap, creative compose, speed arcade.
- A skill (tap, read, listen, identify) still appears across multiple nodes — just not in equal ratios within each node.
- Why: identical question manifolds across current nodes 2/4/5/6 are the dominant complaint. Specialization breaks that without losing skill coverage.

### Creative milestone node — build it

- Build a new `compose_rhythm` question type. MVP scope:
  - Palette of 4-6 measure-tiles (e.g., `[q q q q]`, `[q h q]`, `[8-q-8 q]`, `[q 8-q-8]`)
  - Child drags 2 tiles to form a 2-bar phrase
  - Tap "Play" → engine plays back the chosen phrase at node tempo
  - Validation: tile completion + a follow-up echo/read check
- Node 5 leads with `compose_rhythm`, then 2 `rhythm_tap` (echo) + 2 `rhythm_reading` (read back) questions.
- Why: highest-engagement payoff in the unit; authorship is the strongest motivator at this age. 1-2 days of dev cost is acceptable.

### Boss scope — strict syncopation capstone

- Boss durations limited to `[q, h, 8]`. Drop `qd, qd-r, 16, hd, hr, wr` from current pool.
- Tags lean strictly to `syncopation`, `long-syncopation`, `quarter-eighth`, with `patternTagMode: "any"`.
- **≥ 50% of bars must contain syncopation** — implement via a curated `syncopation-heavy` tag subset OR a weighting tweak in the boss config.
- Boss drops to 10 questions (from 12). Star thresholds engine-default.
- Why: capstone should over-index on the unit's headline skill, not act as a kitchen-sink rhythm review.

### Node count and structure

7 nodes total (down from current 8):

1. `rhythm_8_1` — "Hold-Across Warm-Up" (DISCOVERY, q–h–q, 1 bar) — also re-grounds 4/4 pulse after Unit 7's 6/8.
2. `rhythm_8_2` — "Surprise Beat: Listen & Echo" (DISCOVERY, 8–q–8, 1 bar, listen-first)
3. `rhythm_8_3` — "Read the Off-Beat" (PRACTICE, 2 bars, reading + detective `visual_recognition`)
4. `rhythm_8_4` — "Body Split" (PRACTICE, body-split with on-screen pulse hook)
5. `rhythm_8_5` — "Build a Syncopation" (CHALLENGE, `compose_rhythm` creative milestone)
6. `rhythm_8_6` — "Off-Beat Speed Drill" (SPEED_ROUND, ARCADE)
7. `boss_rhythm_8` — strict syncopation capstone (10 Qs, 4 bars, ≥50% syncopated bars)

### XP arc

Deliberate dip-and-spike to break the linear creep:
60 (warm-up) → 80 (headline discovery) → 85 → 85 → **100 (creative bonus)** → 90 (speed) → 250 (boss).

### Questions-per-node ceiling

- Discovery / Practice / Body-split: 6-7 questions
- Creative milestone: 5 questions (1 compose + 4 verify)
- Speed Round: arcade-default
- Boss: 10 questions (down from 12)

### Claude's Discretion

- Exact pattern subset / tag name for the boss "syncopation-heavy" requirement — planner decides whether to use a new tag, a new field on the boss config, or a curated `patterns:` literal array.
- Exact wording of child-facing node titles in English and Hebrew (will follow existing app voice).
- Whether the body-split visual pulse in Node 4 is added now or flagged as "ships gracefully degraded if renderer change deferred."
- Whether Node 1's `pulse` re-grounding question is its own engine type (already exists per architect note) or a styled `rhythm_tap` against the metronome.
- Pattern IDs for any new patterns added.
  </decisions>

<specifics>
## Specific Ideas

### From `PEDAGOGY-REVIEW.md`

- Frame the unit narrative as _"Most music puts notes on the beat. Today you learn to put them between."_
- Kodaly syllables for 8-q-8: "ti-ta-ti" (English) or established Hebrew equivalents already in `feedback_hebrew_nikud.md` memory.
- Node 3 "detective mode" framing for `visual_recognition`: "Which one has the off-beat?" with 3 notated options where only one is syncopated.
- Node 4 body-split: persistent on-screen "heartbeat" circle pulses at quarter-note rate behind every `rhythm_tap` question. Visual pulse renderer addition is optional — falls back to plain `rhythm_tap` if not implemented this pass.
- Node 5 creative compose: cap at 4-6 tiles in palette to avoid overwhelm.

### Constraints carried from invoking prompt

- Keep MIXED*LESSON / ARCADE_RHYTHM exercise types (no new game-engine-level exercise types — only new \_question* types inside MixedLessonGame).
- Do not touch supabase migrations.
- Keep pitch C4 + timeSignature 4/4 for regular nodes.
- Retain `boss_rhythm_8` id since downstream references exist.
- Scope is Unit 8 ONLY. Do not modify other rhythm units.
  </specifics>

<canonical_refs>

## Canonical References

- `.planning/quick/260524-l3r-refactor-rhythm-unit-8-syncopation-pedag/PEDAGOGY-REVIEW.md` — edu-game-architect's full diagnostic and proposed structure (this is the locked design)
- `CLAUDE.md` — project conventions (glassmorphism, i18n EN+HE, child-safe COPPA tone)
- Memory: `feedback_hebrew_nikud.md` — Kodaly syllables in Hebrew use confirmed diacritics; do not change without asking
- Memory: `feedback_musicSymbols_svgs.md` — note icons use MuseScore-style SVGs from src/assets/musicSymbols/
- Memory: `feedback_mixedlesson_key_prop.md` — MixedLessonGame crossfade key must include currentIndex, not just fadeKey
- Memory: `feedback_exercise_progress_field.md` — exercise_progress JSONB uses `index`, not `exerciseIndex`
- Memory: `feedback_game_routes_dual_array.md` — new game routes need both LANDSCAPE_ROUTES (App.jsx) AND gameRoutes (AppLayout.jsx); not expected to be triggered here since we're not adding a route
- Previous commit on this area: `d49c44e feat(rhythm): restructure Unit 8 to 5-step syncopation flow + drop dotted intro` (the structure being replaced)
  </canonical_refs>
