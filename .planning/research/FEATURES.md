# Feature Research

**Domain:** Rhythm trail pedagogy rework for children's piano learning PWA (age 8)
**Researched:** 2026-04-06
**Confidence:** MEDIUM-HIGH (pedagogy sequence verified against Kodaly/Orff sources and competitor apps; curated-pattern design from Rhythm Lab and Complete Rhythm Trainer analysis; engagement factors cross-referenced against multiple edtech and music education research sources)

---

## Context: What This Research Answers

This is research for a **rhythm trail pedagogical rework** — not adding new game types, but making the existing 50-node, 8-unit rhythm path (already built) genuinely teach rhythm progression to 8-year-olds. The four existing games are: echo/call-response, sight-read-and-tap, hear-and-pick, and falling-tiles arcade.

The core question: what does a pedagogically sound, non-frustrating rhythm curriculum look like for a beginner child, and what does "curated patterns" mean in practice?

---

## Table Stakes (Users Expect These)

Features a rhythm trail for children must have. Missing any of these makes the curriculum feel broken or arbitrary.

| Feature                                                                 | Why Expected                                                                                                                                                                                           | Complexity | Notes                                                                                                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One new note value per unit**                                         | Children cannot process multiple new duration concepts simultaneously; adding two at once causes confusion and failure spirals                                                                         | LOW        | Existing units already do this — must stay enforced by design rule, not just convention                                                                             |
| **Quarter and eighth notes introduced first (before half/whole)**       | Kodaly method: quarter = "walking beat" and eighth = "running beat" — the rhythms children already feel in their bodies. Starting with whole notes (long, abstract) violates developmental sequence    | MEDIUM     | Current unit ordering introduces quarter → half → whole → eighth, which contradicts Kodaly/Orff consensus. Eighth notes should come before or alongside half notes  |
| **Rests taught as active skill, not absence**                           | Children who skip rest counting develop timing errors that persist. Quarter rest must be explicitly practiced, not assumed                                                                             | LOW        | Existing Unit 4 "Quiet Moments" does this correctly — preserve it                                                                                                   |
| **Patterns graded by allowed duration set (not just difficulty label)** | A "beginner" label on a pattern containing dotted-quarter and eighth notes is meaningless to a child who only knows quarter notes. Each exercise must only use durations the child has already learned | MEDIUM     | Current `allowedDurations` filter in HybridPatternService provides the mechanism — needs to be wired to each node's `focusDurations` + `contextDurations`           |
| **Steady beat must be established before note values are taught**       | Orff/Kodaly consensus: children internalize pulse through movement/clapping before abstract notation. A child who hasn't felt steady pulse will fail all subsequent rhythm games                       | LOW        | App currently skips this entirely — echo game and falling tiles assume pulse is internalized. At minimum, Unit 1 Node 1 should have an aural/tapping pulse exercise |
| **Immediate yes/no feedback per tap**                                   | Children need to know within 100-200ms whether their tap was correct; delayed or absent feedback breaks the cause-effect loop that rhythm learning depends on                                          | MEDIUM     | Existing games provide this; must remain gated to stay correct                                                                                                      |
| **Tempo that matches a child's comfortable pace at each stage**         | Too fast = panic; too slow = boredom. Beginner nodes: 60-70 BPM. Intermediate: 75-90 BPM. Advanced: 90-110 BPM                                                                                         | LOW        | Existing `rhythmConfig.tempo` ranges are correctly specified; must be respected by game engines                                                                     |
| **Visual notation accompanies every pattern**                           | Rhythm games where a child taps blind (audio only) are frustrating for beginners; they need to see the note symbol while they hear and tap it                                                          | MEDIUM     | Falling-tiles shows symbols; echo game may not. All games should show VexFlow notation of the target pattern during or before the attempt                           |
| **Retry without punishment**                                            | Children who fail a pattern need immediate retry with no navigation overhead; session-level "lose a life" is acceptable but node-level hard failure is not                                             | LOW        | Existing lives system (3 per session) handles this                                                                                                                  |

## Differentiators (Competitive Advantage)

Features that make this rhythm trail notably better than generative-only approaches or undifferentiated "tap to the beat" apps.

| Feature                                                           | Value Proposition                                                                                                                                                                                                                                                                                            | Complexity | Notes                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Per-node curated pattern library keyed to `allowedDurations`**  | A hand-authored 4-4.json pattern library indexed by duration-set ensures every pattern a child sees is pedagogically appropriate for their current knowledge. Rhythmic Village and Complete Rhythm Trainer both use this approach; generative systems produce duration combinations the child hasn't learned | HIGH       | Schema already exists: `{ "duration": "quarter", "note": true }[]`. Needs expansion from ~6 beginner patterns to ~20+ per duration-set tier |
| **Difficulty progression within a node (adaptive tempo)**         | Start each node session at the floor tempo; if 3 consecutive correct, nudge tempo up by 5 BPM. If 2 consecutive wrong, drop 5 BPM. Keeps each child in their personal optimal challenge zone regardless of prior experience                                                                                  | MEDIUM     | Requires game engines to accept mutable tempo state; VictoryScreen already tracks accuracy — can derive tempo nudge from session score      |
| **"Name that rhythm" aural dictation mode in hear-and-pick game** | Child hears a pattern and picks the matching notation from 3 options — directly mirrors Rhythmic Village's strongest pedagogical feature, which research shows produces faster internalization than sight-reading alone                                                                                      | MEDIUM     | Hear-and-pick game already has this structure; pedagogical value unlocked by pairing with curated patterns at the right difficulty          |
| **Syllable reinforcement (ta/ti-ti) alongside notation**          | Displaying Kodaly rhythm syllables (ta = quarter, ti-ti = two eighths, ta-a = half) underneath VexFlow notation gives children a verbal anchor for each duration. Measurably reduces confusion for 6-9 year olds per Kodaly research                                                                         | MEDIUM     | New visual layer in notation display; syllables map deterministically from duration → string; no backend needed                             |
| **"New vs. known" visual cue per exercise**                       | Highlight the newly-introduced duration in a distinct color for the first 3 nodes of a unit (focusDuration glows), then fade to uniform display. Children process novelty faster when it is visually flagged                                                                                                 | LOW        | Existing `newContent` / `focusDurations` fields on node config carry this intent; needs CSS rendering in notation component                 |
| **Echo game as the first encounter for every new duration**       | Before sight-reading or hear-and-pick, the echo game (listen and tap back immediately) is the safest introduction: no notation pressure, no wrong-answer shame, pure embodied repetition. Orff call-and-response is foundational                                                                             | LOW        | Scheduling echo as the exercise type for all Discovery nodes is a data change only                                                          |
| **Progressive measure length (1 bar → 2 bars → 4 bars)**          | Complete Rhythm Trainer structures its 252 drills on increasing pattern length, not just increasing duration complexity. A child who masters 1-bar quarter-note patterns should face 2-bar patterns before new durations are introduced                                                                      | MEDIUM     | `measuresPerPattern` field already exists on exercise configs; needs to be systematically scheduled across node sequence                    |

## Anti-Features (Commonly Requested, Often Problematic)

| Feature                                               | Why Requested                                           | Why Problematic                                                                                                                                                                                                                                                                                                       | Alternative                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Fully random generative patterns**                  | Infinite variety, no content authoring cost             | A purely probabilistic generator can produce duration combinations the child has not learned yet (e.g., dotted-eighth before sixteenth notes are taught), causing confusion with no pedagogical justification. Research on curated vs generative: combining curated structures with generative fill is most effective | Use curated patterns as primary source, fall back to generative only when curated pool is exhausted, constrained to `allowedDurations` |
| **Multiple new concepts in one node**                 | Seems efficient — teach quarter + eighth simultaneously | Cognitive load theory: each new duration concept requires its own consolidation window. Introducing two at once doubles error rate and reduces confidence. Kodaly sequenced concepts are taught one per lesson over weeks                                                                                             | Strict one-new-element rule per Discovery node; use Mix-Up nodes to combine known elements                                             |
| **Skipping steady beat entirely**                     | Saves a node; seems obvious                             | Children who cannot feel a steady pulse fail ALL rhythm games. Jumping to notation without pulse work creates a hidden failure mode that appears as "the game is broken"                                                                                                                                              | Unit 1 Node 1 must establish pulse. Echo game with a pure metronome click (no notation) for 30 seconds is sufficient                   |
| **Introducing sixteenth notes before dotted rhythms** | Seems like natural order (shortest subdivision next)    | Sixteenth notes at beginner tempo (60-70 BPM) produce extremely fast taps (4 per beat) that overwhelm motor control in 8-year-olds. Dotted patterns (dotted-quarter + eighth) appear in familiar songs and are more musically meaningful at this age                                                                  | Dotted rhythms in Unit 5-6, sixteenth notes in Unit 6 at controlled slow tempo                                                         |
| **3/4 time before 4/4 is mastered**                   | Waltz feels fun                                         | 3/4 meter requires correct placement of 3 beats, which is harder to feel than 4/4's strong-weak-strong-weak. Kodaly defers 3/4 until after 4/4 and 2/4 are secure                                                                                                                                                     | Keep 3/4 as optional "bonus" content, not a required trail node for beginners                                                          |
| **Syncopation in the main beginner trail**            | Sounds cool, is in popular music                        | Syncopation (accent on weak beat) requires a child to first have a strongly internalized sense of where the strong beats are. Introducing it before Units 6-7 undermines pattern internalization                                                                                                                      | Syncopation belongs only in Unit 8 (existing) after compound meter is established                                                      |
| **Audio-only echo (no visual)**                       | Simpler to build                                        | Children aged 6-10 benefit dramatically from multimodal learning — hearing + seeing + doing simultaneously. Audio-only echo has no visual anchor, which makes the pattern evaporate from working memory faster                                                                                                        | Echo game should always show the VexFlow notation of the pattern being echoed, displayed during the listen phase                       |

---

## Feature Dependencies

```
Steady Beat Internalization (Unit 1, Node 1)
    └──required by──> All subsequent rhythm games (cannot count without pulse)

Curated Pattern Library (per duration-set tier)
    └──required by──> Per-node allowedDurations filtering
                          └──required by──> Pedagogically safe exercise selection

Quarter Note mastery (Units 1-2)
    └──required by──> Eighth Note introduction (Unit 3, per Kodaly)
                          └──required by──> Dotted Quarter patterns (Unit 5-6)
                                               └──required by──> Syncopation (Unit 8)

Quarter Rest (Unit 4)
    └──required by──> Half Rest (Unit 4)
                          └──required by──> Whole Rest (Unit 4)

Echo game (Discovery nodes)
    └──precedes──> Sight-read-and-tap (Practice nodes)
                       └──precedes──> Hear-and-pick (Mix-Up nodes)
                                          └──precedes──> Falling-tiles Arcade (Speed/Boss nodes)

VexFlow notation display during exercise
    └──required by──> Syllable overlay (ta/ti-ti rendering)
    └──required by──> focusDuration highlight
```

### Dependency Notes

- **Eighth notes require quarter mastery:** The Kodaly and Orff consensus is that quarter ("walking") and eighth ("running") notes are taught together as a pair — walking vs. running — because children already embody these in daily movement. Half notes (held, sustained) are a different cognitive category and can come after eighth notes without loss.
- **Curated pattern library is a prerequisite for safe generative fallback:** The `allowedDurations` filter in `HybridPatternService.getCuratedPattern()` already exists; the gap is insufficient pattern count per duration-tier (currently ~6 beginner patterns total vs. the ~20+ needed for a node to avoid repetition before star-3 is reached).
- **Echo game ordering is a data dependency, not a code change:** Scheduling echo as the exercise type for all `nodeType: DISCOVERY` nodes is a content edit to the unit files, not a new game feature.

---

## Recommended Duration Progression (Evidence-Based)

This is the key pedagogical finding. The Kodaly/Orff consensus, cross-validated against Complete Rhythm Trainer's 30-chapter structure and Rhythmic Village's level progression:

| Unit | New Element                  | Rationale                                                   | Rest Introduced        |
| ---- | ---------------------------- | ----------------------------------------------------------- | ---------------------- |
| 1    | Pulse → Quarter note (ta)    | Body movement before notation; walking beat                 | —                      |
| 2    | Eighth notes (ti-ti)         | Running beat — children embody this before notation         | Eighth rest (optional) |
| 3    | Half note (ta-a)             | "Stretch" — holding longer now that short notes are secure  | Half rest              |
| 4    | Whole note (ta-a-a-a)        | Maximum held duration; contrasts with eighth pairs          | Whole rest             |
| 5    | Quarter rest                 | Silence is a skill; quarter rest first per grade-1 pedagogy | Quarter rest           |
| 6    | Dotted quarter + eighth pair | Musical feel of "long-short"; appears in folk/pop songs     | Dotted half            |
| 7    | Sixteenth notes              | Very fast at slow tempo (60 BPM = 4/beat manageable)        | Sixteenth rest         |
| 8    | 6/8 compound meter           | Two big beats; dotted-quarter as the beat unit              | —                      |

**Current app ordering** (quarter → half → whole → eighth → rests → dotted → sixteenth → 6/8 → syncopation) contradicts this by introducing whole notes before eighth notes. This is the primary pedagogical issue to fix.

**Source authority:** Kodaly K-5 sequence (quarter + eighth first, half and whole after), Becca's Music Room grade-level breakdown (quarter rest grade 1, half/whole notes grade 2, sixteenth grade 3, dotted grade 4), Complete Rhythm Trainer's 30-chapter ordering.

---

## Curated Patterns in Practice

### What "curated" means here

A curated pattern library is a hand-authored JSON array of measures, each tagged with the duration set it requires. The child only sees patterns whose duration set is a subset of what they have already learned.

**Existing schema (4-4.json) — correct approach:**

```json
{ "duration": "quarter", "note": true }
```

**What's missing:** The existing library has ~6 beginner patterns (quarters only), ~8 intermediate patterns (mixed), ~6 advanced patterns. For a trail with 7 nodes per unit and 3 exercises minimum per node, the child will see repeat patterns before reaching 1-star mastery. The pattern pool needs expansion.

### Recommended pattern counts per duration-tier

| Duration Set Available            | Minimum Patterns | Rationale                                                         |
| --------------------------------- | ---------------- | ----------------------------------------------------------------- |
| quarter only                      | 20               | 7 nodes × 3 attempts before repetition feels boring               |
| quarter + eighth                  | 25               | Eighth combinations are numerous; variety prevents predictability |
| quarter + eighth + half           | 20               | Half note patterns are structurally simpler                       |
| quarter + half + whole            | 15               | Whole-note patterns are very limited in variety                   |
| quarter + rest (any)              | 20               | Rest placement creates meaningful variety                         |
| quarter + eighth + dotted-quarter | 20               | Dotted patterns are distinct enough each feels new                |
| sixteenth combinations            | 15               | Sufficient for speed round variety                                |
| 6/8 patterns                      | 15               | Separate JSON file already exists (6-8.json)                      |

### Difficulty scoring within a tier

Patterns within a duration-set tier can be difficulty-ranked by two axes:

1. **Density:** Ratio of notes to rests (higher density = harder; silence requires counting)
2. **Beat placement:** Strong-beat-only patterns are easier; weak-beat placement increases difficulty

A pattern tagged `{ density: 0.75, syncopation: false, durations: ["quarter","eighth"] }` gives the engine enough signal to select easy-first, hard-last ordering within a node session without requiring a separate difficulty label per pattern.

---

## MVP Definition for This Milestone

This is not a new feature build — it is a content and wiring rework of existing systems.

### Rework With (v1 of this milestone)

- [ ] **Reorder duration sequence** in unit files to match Kodaly progression (quarter → eighth → half → whole → rests → dotted → sixteenth → compound)
- [ ] **Expand curated pattern library** (4-4.json) from ~20 total patterns to ~120+, organized by duration-set not by difficulty label
- [ ] **Wire allowedDurations to node config** — every node's `focusDurations` + `contextDurations` must constrain which curated patterns are served; fix any nodes where this wiring is missing
- [ ] **Schedule echo game for all Discovery nodes** — change exercise `type` to echo for all `nodeType: DISCOVERY` nodes (data-only change)
- [ ] **Add pulse exercise to Unit 1 Node 1** — simplest possible: metronome click + "tap with the beat" for 30 seconds before any notation appears
- [ ] **Add syllable overlay to VexFlow notation** — ta/ti-ti/ta-a text below each note head; single render pass, deterministic from duration

### Add After Validation (v1.x)

- [ ] **Adaptive tempo within session** — nudge BPM ±5 based on consecutive correct/wrong taps; validate that it doesn't confuse children
- [ ] **"New vs known" focus highlighting** — glow effect on focusDuration notes for first 3 Discovery nodes of each unit
- [ ] **Progressive measure length** — 1-bar exercises in Discovery nodes, 2-bar in Practice, 4-bar in Speed/Boss nodes

### Future Consideration (v2+)

- [ ] **3/4 meter trail branch** — optional unlock after Unit 8 for learners who complete the full path
- [ ] **Triplet feel intro** — tied to Unit 8+ or a future jazz/swing unit; too cognitively complex for beginner path
- [ ] **Student-generated patterns** — composition mode where child creates a rhythm and the app plays it back; high engagement but requires notation input UI

---

## Feature Prioritization Matrix

| Feature                                  | User Value | Implementation Cost     | Priority |
| ---------------------------------------- | ---------- | ----------------------- | -------- |
| Reorder duration sequence (data edit)    | HIGH       | LOW                     | P1       |
| Expand curated pattern library           | HIGH       | MEDIUM (authoring time) | P1       |
| Wire allowedDurations to node config     | HIGH       | LOW (already exists)    | P1       |
| Echo game for Discovery nodes            | HIGH       | LOW (data change)       | P1       |
| Pulse exercise Unit 1 Node 1             | MEDIUM     | LOW                     | P1       |
| Syllable overlay (ta/ti-ti)              | MEDIUM     | MEDIUM                  | P2       |
| focusDuration highlight ("new vs known") | MEDIUM     | LOW                     | P2       |
| Progressive measure length               | MEDIUM     | LOW (field exists)      | P2       |
| Adaptive tempo within session            | MEDIUM     | MEDIUM                  | P2       |
| 3/4 meter branch                         | LOW        | HIGH                    | P3       |
| Triplets                                 | LOW        | HIGH                    | P3       |
| Student composition mode                 | MEDIUM     | HIGH                    | P3       |

---

## Competitor Feature Analysis

| Feature                        | Rhythmic Village                 | Complete Rhythm Trainer             | Simply Piano                            | This App (current)                                     |
| ------------------------------ | -------------------------------- | ----------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Duration progression order     | Quarter+eighth first (Kodaly)    | Half → quarter → eighth → sixteenth | Song-first (duration exposure implicit) | Quarter → half → whole → eighth (diverges from Kodaly) |
| Curated pattern library        | Yes, 1000+ patterns in 10 levels | 252 drills, hand-authored           | Song-based (not abstract patterns)      | 20 total patterns; insufficient                        |
| Echo game available            | Yes (core mode)                  | Yes (imitation drills)              | No                                      | Yes (exists)                                           |
| Syllable system                | No                               | No                                  | No                                      | No                                                     |
| Notation shown during exercise | Yes                              | Yes                                 | Yes                                     | Partial (falling tiles yes, echo unclear)              |
| Adaptive tempo                 | No                               | No                                  | No                                      | No                                                     |
| Rest as dedicated unit         | No — rests embedded in patterns  | No                                  | No                                      | Yes (Unit 4 "Quiet Moments")                           |
| 6/8 compound meter             | Yes                              | Yes                                 | No                                      | Yes (Unit 7)                                           |
| Pulse exercise before notation | Yes (clicking with metronome)    | No                                  | No                                      | No                                                     |

---

## Sources

- Kodaly method pedagogy: [Wikipedia: Kodály method](https://en.wikipedia.org/wiki/Kod%C3%A1ly_method) — rhythm sequence, ta/ti-ti syllables, developmental ordering
- Grade-level rhythm progression: [Becca's Music Room: How to Teach Rhythm in Elementary Music](https://beccasmusicroom.com/teach-rhythm/) — 7-step sequence, grade 1-4 note value introduction order
- Teaching strategies: [Jooya Teaching Resources: 10 Simple Strategies to Teach Note Values](https://juliajooya.com/2024/02/14/10-simple-strategies-to-teach-note-values-in-music-with-rhythm-patterns/) — pattern building, complexity scaffolding, engagement vs frustration factors
- Competitor: [Complete Rhythm Trainer](https://completerhythmtrainer.com/) — 252 drills, 4 levels, 30 chapters; game-based + strong pedagogy
- Competitor: [Rhythmic Village App Store](https://apps.apple.com/us/app/learn-music-rhythmic-village/id1351762757) — echo, dictation, aural differentiation; ages 6+
- Competitor: [Rhythm Lab JSON Documentation](https://www.rhythmlab-app.com/knowledge-base/file-and-user-mgt/file-management/json-documentation-for-custom-patterns/) — curated patterns in JSON, hand-authored, importable
- Research: [Music and Rhythm as Promising Tools to Assess and Improve Cognitive Development in Children (PMC 2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12420879/) — cognitive impact of rhythm training; importance of challenge calibration
- Pedagogy comparison: [Comparative Analysis of Kodaly, Suzuki, Dalcroze, Orff, Gordon (ResearchGate 2024)](https://www.researchgate.net/profile/Jay-Mabini/publication/381457025_Comparative_Analysis_of_Kodaly_Suzuki_Dalcroze_Orff_and_Gordon_Music_Learning_Theory_in_Early_Childhood_Music_Education_A_Literature_Review/links/666dc89ab769e76919386856/)
- Rhythm syllable systems: [Rhythm Syllable Systems — Make Moments Matter](https://makemomentsmatter.org/classroom-ideas/rhythm-syllable-systems-what-to-use-and-why/)
- App review: [Top 11 Rhythm Reading Apps for Music Teachers — Midnight Music (2024)](https://midnightmusic.com/2024/05/top-11-rhythm-reading-apps-for-music-teachers/)

---

_Feature research for: Rhythm trail pedagogy rework (8-year-old piano learners)_
_Researched: 2026-04-06_
