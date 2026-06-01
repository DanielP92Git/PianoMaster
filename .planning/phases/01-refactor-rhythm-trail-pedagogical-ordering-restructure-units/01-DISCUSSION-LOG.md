# Phase 01: Refactor Rhythm Trail — Pedagogical Restructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
**Areas discussed:** Unit map & order; Rests-woven granularity; Scaffolding mechanism + content; All-rhythm cumulative boss

---

## Unit Map & Order

### Round 1 — Long-duration grouping

| Option                               | Description                                                  | Selected          |
| ------------------------------------ | ------------------------------------------------------------ | ----------------- |
| Separate units (3 units)             | U1=Quarter, U2=Half, U3=Whole — strict one-duration-per-unit | ✓ (with addition) |
| Quarter solo, then Half+Whole paired | U1 Quarter, U2 Half+Whole                                    |                   |
| Single Pulse Family unit             | One unit covers Q→H→W as a single arc                        |                   |
| Quarter + Half (U1), Whole later     | Today's shape with Whole added as a later extension          |                   |

**User's choice:** "Separate units (3 units) but quarter rest is with quarter note in unit 1"
**Notes:** User bridged Areas 1 and 2 in one answer — rests are folded INTO each duration unit. This pre-resolved most of Area 2.

### Round 2 — Within-unit sequence

| Option                                                                     | Description                        | Selected |
| -------------------------------------------------------------------------- | ---------------------------------- | -------- |
| Intro→Practice→Rest Intro→Practice→Speed→Mini-Boss (6 nodes)               | Clean one-new-thing-at-a-time      | ✓        |
| Intro→Rest Intro→Practice (combined)→Speed→Mini-Boss (5 nodes)             | Compact, matches today's unit size |          |
| Intro→Practice→Rest Intro→Speed→Mini-Boss (5 nodes, rest no solo-practice) | Smaller unit, rest gets less reps  |          |

**User's choice:** 6-node arc
**Notes:** Each duration unit gets its rest its own dedicated practice slot before the unit boss.

### Round 3 — Subdivisions / dotted / meter placement

| Option                                                   | Description                                          | Selected |
| -------------------------------------------------------- | ---------------------------------------------------- | -------- |
| Subdivisions first: 8ths→16ths, THEN dotted, THEN meters | Strict pyramid: durations→subdivisions→dotted→meters | ✓        |
| Subdivisions mixed with dotted-notes                     | Dotted intermixed where pedagogically adjacent       |          |
| Subdivisions early, meters before dotted                 | Meters before dotted                                 |          |
| Dotted woven into matching duration units                | Compact, fewer units; concept-per-unit risk          |          |

**User's choice:** Subdivisions first pyramid
**Notes:** Strict ordering. Meters are most advanced.

### Round 4 — Dotted-half + dotted-quarter

| Option                                                  | Description                          | Selected |
| ------------------------------------------------------- | ------------------------------------ | -------- |
| Single 'Dotted Notes' unit (both intros)                | Treat "dotted family" as one concept |          |
| Two units (Dotted Half, then Dotted Quarter)            | Strict concept-per-unit              | ✓        |
| Dotted-half folded into Half, Dotted-quarter standalone | Stretches U2, compresses overall     |          |

**User's choice:** Two units
**Notes:** Strict reading of concept-per-unit. Pushes trail to 9 content units.

### Round 5 — Node ID convention & non-duration unit shape

| Question   | Option                                                                        | Selected                |
| ---------- | ----------------------------------------------------------------------------- | ----------------------- |
| Node IDs   | Renumber to rhythm*1*_ through rhythm*9*_ (collide with hidden U8)            |                         |
| Node IDs   | Semantic IDs (rhythm_quarter_intro, etc.)                                     |                         |
| Node IDs   | rhythm*1*_ through rhythm*9*_, RENAME hidden syncopation to rhythm*synco*\*   | ✓ (Claude's discretion) |
| Unit shape | Same 5-node pattern: Intro→Practice→Discovery(mixed)→Practice→Speed→Mini-Boss | ✓                       |
| Unit shape | 4-node compressed pattern                                                     |                         |
| Unit shape | Defer to planner                                                              |                         |

**User's choice:** "you decide what's best" for node IDs; full multi-node arc for unit shape
**Notes:** Claude locked numeric-pattern + syncopation-rename per principle of minimum churn to existing FREE_NODE_IDS / Postgres / locale key infrastructure. The "5-node pattern" label was a Claude typo — the option enumerated 6 nodes; user's choice is the 6-node arc.

---

## Rests-Woven Granularity

### Round 1 — Rest scaffolding scope

| Option                                                  | Description                                | Selected |
| ------------------------------------------------------- | ------------------------------------------ | -------- |
| Each rest = dedicated scaffolding (12 explainers total) | Most copy, cleanest pedagogy               | ✓        |
| Rest scaffolding piggybacks on duration intro           | Lighter copy load                          |          |
| Defer to planner / designer                             | Lock principle, defer "what counts as new" |          |

**User's choice:** Dedicated scaffolding for each rest
**Notes:** 12 concepts × 2–4 cards × EN+HE locales = ~50–100 new translation keys. Most pedagogically clean option.

---

## Scaffolding Mechanism + Content

### Round 1 — Mechanism (where it lives)

| Option                                                                   | Description                                                | Selected                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- | ----------------------- |
| Extend existing discovery_intro question type                            | Least engine churn; pagination inside renderer             | ✓ (Claude's discretion) |
| New standalone SCAFFOLDING node type                                     | Discrete trail nodes; bigger UI surface; double node count |                         |
| Both — SCAFFOLDING for first-encounter, discovery_intro for re-encounter | Best pedagogy, most code surface                           |                         |

**User's choice:** "you decide best approach"
**Notes:** Claude locked extending existing renderer. Reasoning: existing renderer already handles acknowledge/audio/i18n/audio-context/landscape plumbing. New node type forces touching NODE_TYPES, validator whitelist, TrailNode/Modal routing, paywall, and doubles trail visual node count. Requirement 7's "bounded to pedagogical necessity" guard prefers extension over addition.

### Round 2 — Content format

| Option                                     | Description                                          | Selected                |
| ------------------------------------------ | ---------------------------------------------------- | ----------------------- |
| Single rich card (current + improvements)  | Fast to ship, modest copy                            |                         |
| Multi-step swipable cards (Duolingo-style) | 2–4 cards per concept, matches spec reference        | ✓ (Claude's discretion) |
| Interactive demo (tap-to-feel-the-beat)    | Most engaging, most engine work, hardest to localize |                         |

**User's choice:** "you decide based on best approach and app structure"
**Notes:** Claude locked multi-step swipable cards. Reasoning: Requirement 4 explicitly cites Duolingo lesson-intro slides as the reference pattern. Single-card won't feel different enough from today's UI. Interactive demo is scope risk per Requirement 7.

---

## All-Rhythm Cumulative Boss

### Round 1 — Final boss treatment

| Option                                              | Description                            | Selected |
| --------------------------------------------------- | -------------------------------------- | -------- |
| Drop the cumulative boss — 9 unit-bosses are enough | Simplest, smallest node count          |          |
| Add U10 'Rhythm Review' with single cumulative BOSS | Restores 'beat the whole trail' moment | ✓        |
| Promote U9 mini-boss to full BOSS (cumulative)      | Compact but mixes two purposes         |          |

**User's choice:** U10 Rhythm Review unit with single cumulative BOSS
**Notes:** Trail terminus = boss_rhythm_10. Uses `patternTagMode: "any"` to pull from all U1–U9 pattern tags. Final node count: 9 × 6 + 1 = 55 rhythm nodes total.

---

## Claude's Discretion

- **Node ID convention** (locked): numeric pattern `rhythm_1_*` through `rhythm_9_*` + rename hidden U8 syncopation to `rhythm_synco_*` / `boss_rhythm_synco`.
- **Scaffolding mechanism** (locked): extend existing `discovery_intro` question type — no new SCAFFOLDING node type.
- **Scaffolding content format** (locked): multi-step swipable cards (2–4 per concept), Duolingo-style template.

## Deferred Ideas

- **Eighth-rest / sixteenth-rest / dotted-rest scaffolding** — Content expansion, not restructure. Future phase.
- **Re-enable hidden Rhythm Unit 8 Syncopation** — Separate product decision; rename in D-10 makes path mechanical.
- **MetronomeTrainer copy references to old unit/node names** — Audit during planning.
- **Interactive scaffolding card ("tap-to-feel-the-beat")** — Rejected for v1 in favor of multi-card. Revisit if owner walkthrough flags engagement gap.
