# Future Milestones Backlog

Prioritized backlog of planned milestones. Pick the next one after each milestone ships.
Updated as milestones complete and priorities shift.

**Current milestone:** v2.4 Content Expansion (Key Signatures + Advanced Rhythm)

---

## Priority 1: Content Expansion (continued)

### v2.5 Two-Hand Basics (~20 nodes)
**Goal:** Introduce cross-clef playing with both hands on a grand staff.
**Why next:** Highest-impact content gap. Two-hand playing is the natural next step after key signatures.
**Complexity:** HIGH — requires new grand staff UI (two staves), new input detection model (two simultaneous notes), new exercise type.
**Dependencies:** None on v2.4.
**Research needed:** Yes — grand staff rendering in VexFlow, two-hand input detection patterns.

### v2.6 Simple Melodies (~15 nodes, public domain songs)
**Goal:** Introduce melody playing with recognizable tunes (public domain).
**Why:** Bridges gap between isolated note exercises and real music. High emotional engagement ("I played a real song!").
**Complexity:** MEDIUM — needs song data format, melody playback reference, scoring for melodic accuracy.
**Dependencies:** Benefits from key signatures (v2.4) since melodies use keys.
**Research needed:** Yes — public domain song sourcing, melody scoring algorithms.

---

## Priority 2: Retention Mechanics

### v2.7 Spaced Repetition ("Rusty Skills")
**Goal:** Completed nodes decay over time, prompting review. Prevents "done and forget" pattern.
**Why:** Critical for 6-month+ retention. Without review incentives, mastered content is never revisited.
**Complexity:** MEDIUM — accuracy decay algorithm, "rusty" visual state for nodes, review XP bonuses.
**Dependencies:** More impactful with larger trail (after v2.4-v2.6).
**Research needed:** Yes — spaced repetition algorithms (SM-2, Leitner), decay curves for children.

### v2.8 Weekly Bonus Events
**Goal:** Rotating weekly themes (Double XP Week, Bass Focus Week, Speed Challenge Week, Review Week).
**Why:** Creates variety in daily return hooks. Prevents routine fatigue.
**Complexity:** LOW — event system, themed UI overlays, XP multiplier logic.
**Dependencies:** None.
**Research needed:** No — straightforward implementation.

---

## Priority 3: Game Variety

### v2.9 New Mini-Games
**Goal:** Add 2-3 new game types to break monotony.
**Candidates (pick during scoping):**
- **Note Catcher** — Guitar Hero-style falling notes, tap to catch
- **Melody Puzzle** — Arrange note fragments into correct melody order
- **Interval Training** — Identify distance between two notes (ear training)
- **Rhythm Battle** — Side-by-side rhythm matching challenge

**Why:** 4 game modes get repetitive after 3+ months. New modes refresh engagement.
**Complexity:** HIGH per game — each is a new component with its own mechanics.
**Dependencies:** Benefits from melody content (v2.6) for Melody Puzzle.
**Research needed:** Yes — which game types are most effective for music education.

---

## Priority 4: Narrative & Emotional

### v3.0 Story Campaign
**Goal:** Wrap the trail in a narrative ("Help Beethoven restore his musical powers"). Each unit = a chapter.
**Why:** Transforms mechanical XP grind into emotional journey. Research shows narrative increases completion rates 40%+ in educational apps.
**Complexity:** HIGH — story writing, character art, chapter transitions, dialogue system.
**Dependencies:** Better with more content (v2.4-v2.6) so the story has enough chapters.
**Research needed:** Yes — age-appropriate narrative patterns, character design for 8-year-olds.

### v3.1 Seasonal Events
**Goal:** Time-limited themed content (Halloween, Winter, Spring, Summer) with exclusive cosmetics.
**Why:** Creates urgency and FOMO (in a child-safe way). Keeps long-term players engaged.
**Complexity:** MEDIUM — event framework, themed UI, time-gated content, cosmetic rewards.
**Dependencies:** Benefits from accessory system if one exists.
**Research needed:** Moderate — COPPA-safe FOMO patterns, seasonal content calendar.

---

## Priority 5: Social & Competitive (COPPA-safe)

### v3.2 Classroom Challenges
**Goal:** Teacher-set anonymous challenges with collective class progress.
**Why:** Adds social accountability without violating COPPA. Teachers can create shared goals.
**Complexity:** MEDIUM — teacher UI for challenge creation, anonymous progress aggregation.
**Dependencies:** None critical.
**Research needed:** Yes — COPPA-compliant social features, teacher workflow patterns.

---

## Priority 6: Progression Depth

### Prestige / Mastery Stars
**Goal:** Gold 4th star, Diamond 5th star beyond current 3-star max for completed nodes.
**Why:** Gives completionists a reason to replay mastered content.
**Complexity:** LOW — star tier visuals, higher score thresholds.
**Dependencies:** None. Can be bundled into any milestone.
**Note:** Small enough to add as a phase within another milestone.

### Adaptive Difficulty
**Goal:** Dynamic difficulty adjustment within sessions (flow zone management).
**Why:** Prevents boredom (too easy) and frustration (too hard). Key for diverse skill levels.
**Complexity:** HIGH — algorithm research, per-student difficulty model, real-time adjustment.
**Dependencies:** Benefits from more content variety.
**Research needed:** Yes — flow theory, adaptive algorithms for children.

---

## Deferred / Out of Scope

| Feature | Reason | Revisit When |
|---------|--------|--------------|
| Real song integration (licensed) | Licensing complexity ($500-5000/song) | After public domain melodies prove demand |
| Social network features | COPPA prohibits without verifiable parental consent | If classroom challenges show demand |
| Virtual currency (purchasable) | COPPA dark pattern risk | Never (earn-only model) |
| Mobile app stores | Requires full compliance audit | After core content is 6+ months deep |
| Celebration sound effects | Needs classroom A/B testing | When user testing is feasible |
| Hard delete Edge Function | 30-day grace period accounts | Low priority, no user impact |

---

## How to Use This Document

1. After shipping a milestone, come here to pick the next one
2. Run `/gsd:new-milestone` with the chosen milestone
3. Update this document: move shipped milestone out, adjust priorities if needed
4. Priorities may shift based on user feedback, analytics, or new insights

---
*Created: 2026-03-18*
*Last updated: 2026-03-18*
