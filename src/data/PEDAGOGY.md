# Piano Trail Pedagogy

Design rationale for the piano learning trail system, targeting 8-year-old learners.

## Design Philosophy

Core educational psychology principles:
- **One new element at a time** (cognitive load theory)
- **Varied activity types** for engagement (Discovery -> Practice -> Mix-Up -> Speed -> Boss)
- **Immediate feedback** (mastery learning)
- **Achievement-based motivation** (XP, stars, badges)

## Target Learner Profile

- **Age:** 8 years old
- **Attention span:** 15-20 minutes per session
- **Prior knowledge:** Assumes no prior music reading ability
- **Motivation:** Game-like progression, visual rewards

## Note Introduction Order

### Treble Clef Path: C4 -> B4 -> C5

**Unit 1: First Position (C4, D4, E4)**
- C4 (Middle C): Universal starting point in piano pedagogy
- D4: One step up, reinforces staff line reading
- E4: Completes first three-note group

Rationale: Three-note grouping establishes pattern before expanding. Ascending order matches physical keyboard (left to right).

**Unit 2: Five Finger Position (F4, G4)**
- F4, G4: Complete the natural five-finger position
- Pedagogically standard "C position"

**Unit 3: Full Octave (A4, B4, C5)**
- Complete the octave progressively
- C5 is the "goal note" - returning to C reinforces octave concept

**Unit 4: Extended Range (Ledger Lines)**
- Notes above C5 and below C4
- Requires understanding ledger line patterns

**Unit 5: Accidentals (Sharps & Flats)**
- Chromatic notes introduce half-step concept
- Advanced material after naturals mastered

Sources: Middle C method (W.S.B. Mathews, 1892), Thompson's Modern Course (1936), Faber Piano Adventures

### Bass Clef Path: C4 -> C3

**Mirrors treble pedagogy exactly but descending:**
- Unit 1: C4, B3, A3 (start at Middle C, go down)
- Unit 2: G3, F3 (complete five-finger position)
- Unit 3: E3, D3, C3 (full octave down)
- Unit 4: Extended Bass (ledger lines below C3)
- Unit 5: Bass Accidentals (sharps and flats)

Rationale: Same cognitive load as treble (one note at a time). Descending matches bass clef reading direction.

### Rhythm Path: Quarter -> Half -> Whole -> Eighth -> Dotted

**Progression rationale:**
1. Quarter note = steady beat (foundational concept)
2. Half note = two beats (longer, simpler than subdivisions)
3. Whole note = four beats (patience, counting practice)
4. Eighth note = subdivision (only after beat mastery)
5. Dotted rhythms = advanced (1.5 beats requires understanding beat + half-beat)

**Critical constraint:** No eighth notes in Units 1-3 (learning phase). Eighth notes unlocked in Unit 4+ as reward for note mastery.

Sources: Kodaly method ("ta" and "ti-ti"), Orff pedagogy

## Node Type Purposes

Each node type serves a specific educational and psychological purpose. Node types are defined in `nodeTypes.js` as the `NODE_TYPES` enum.

### Discovery Nodes (`NODE_TYPES.DISCOVERY`)
- **Purpose:** Introduce 1-2 new notes
- **Duration:** 3-4 minutes
- **Rhythm:** Simple (quarters only) - focus on pitch recognition
- **Child thinks:** "Ooh, something NEW!"
- **Exercise:** Note recognition with new notes highlighted

### Practice Nodes (`NODE_TYPES.PRACTICE`)
- **Purpose:** Drill recent notes with sight reading
- **Duration:** 3-5 minutes
- **Rhythm:** Medium (quarters + halves)
- **Child thinks:** "I'm getting better!"
- **Exercise:** Sight reading with recently learned notes

### Mix-Up Nodes (`NODE_TYPES.MIX_UP`)
- **Purpose:** Memory game variation (sustained engagement)
- **Duration:** 4-5 minutes
- **Child thinks:** "This is FUN!"
- **Exercise:** Memory matching game with notes
- **Why it matters:** Variety prevents monotony, same learning through different lens

### Speed Round Nodes (`NODE_TYPES.SPEED_ROUND`)
- **Purpose:** Timed challenge (flow state, urgency)
- **Duration:** 2-3 minutes
- **Child thinks:** "Can I beat the clock?"
- **Exercise:** Timed note recognition
- **Why it matters:** Creates excitement, tests automaticity

### Review Nodes (`NODE_TYPES.REVIEW`)
- **Purpose:** Spaced repetition of previous units
- **Duration:** 3-4 minutes
- **Child thinks:** "I still remember!"
- **Exercise:** Mixed notes from previous units
- **Why it matters:** Combats forgetting curve

### Challenge Nodes (`NODE_TYPES.CHALLENGE`)
- **Purpose:** Increased difficulty preparation
- **Duration:** 4-5 minutes
- **Child thinks:** "Harder... but I can do it!"
- **Exercise:** Faster tempo or more notes
- **Why it matters:** Builds confidence for boss

### Mini-Boss Nodes (`NODE_TYPES.MINI_BOSS`)
- **Purpose:** Unit checkpoint (sense of accomplishment)
- **Duration:** 5-6 minutes
- **XP reward:** 2x regular nodes
- **Child thinks:** "I've learned SO MUCH!"
- **Exercise:** All unit notes, medium challenge

### Boss Nodes (`NODE_TYPES.BOSS`)
- **Purpose:** Major milestone (epic challenge moment)
- **Duration:** 6-8 minutes
- **XP reward:** 3x regular nodes
- **Child thinks:** "EPIC CHALLENGE!"
- **Exercise:** All path notes, time pressure

## XP Economy Design

### Principles
- Equal total XP per path (treble = bass = rhythm)
- Boss nodes award 2-3x more XP than regular nodes
- Completing all three paths should reach high levels (Level 12+)

### Level Thresholds

From `xpSystem.js` (`XP_LEVELS` array):

| Level | XP Required | Title          | Icon |
|-------|-------------|----------------|------|
| 1     | 0           | Beginner       |      |
| 2     | 100         | Music Sprout   |      |
| 3     | 250         | Note Finder    |      |
| 4     | 450         | Melody Maker   |      |
| 5     | 700         | Rhythm Keeper  |      |
| 6     | 1000        | Music Explorer |      |
| 7     | 1400        | Sound Wizard   |      |
| 8     | 1900        | Piano Pro      |      |
| 9     | 2500        | Music Master   |      |
| 10    | 3200        | Symphony Star  |      |
| 11    | 4000        | Harmony Hero   |      |
| 12    | 5000        | Virtuoso       |      |
| 13    | 6200        | Maestro        |      |
| 14    | 7500        | Grand Master   |      |
| 15    | 9000        | Legend         |      |

### XP Per Path Target

With 90 total nodes across three paths:
- ~30 nodes per path
- Average 50 XP per regular node
- Boss nodes 150-200 XP
- Target: ~2000-2500 XP per path (3 paths = 6000-7500 total)

This ensures:
- Completing one path: ~Level 7-8 (Piano Pro/Sound Wizard)
- Completing two paths: ~Level 10-11 (Symphony Star/Harmony Hero)
- Completing all paths: ~Level 13-14 (Maestro/Grand Master)

## Node Variety Pattern

**Within each unit, vary node types:**
1. Discovery (new note)
2. Practice (drill)
3. Mix-Up (game)
4. Speed Round (challenge)
5. Mini-Boss (checkpoint)

**Why this order:** Discovery introduces concept, Practice reinforces, Mix-Up maintains engagement, Speed tests mastery, Mini-Boss celebrates completion.

## Rhythm Complexity Levels

From `nodeTypes.js` (`RHYTHM_COMPLEXITY` enum):

| Level  | Allowed Rhythms          | Used In           |
|--------|--------------------------|-------------------|
| SIMPLE | Quarters only            | Discovery nodes   |
| MEDIUM | Quarters + Halves        | Practice nodes    |
| VARIED | Quarters + Eighths       | Challenge nodes   |
| ALL    | All rhythms              | Boss nodes        |

**Rhythm as reward:** More complex rhythms unlock as pitch recognition improves. This maintains focus during note learning, then introduces rhythmic challenge as mastery develops.

---

## Legacy Reference

### Legacy Node IDs (for historical reference)

These IDs existed in the original `LEGACY_NODES` array in `skillTrail.js`. Since all trail progress will be reset with v1.3, no runtime migration is needed. This section documents them for reference only.

**Treble Clef (Legacy):**
- `treble_c_d` - C & D notes
- `treble_c_e` - C, D, E notes
- `treble_five_finger` - C, D, E, F, G notes
- `treble_c_a` - C through A
- `treble_almost_there` - C through B
- `treble_full_octave` - Full octave C4-C5

**Bass Clef (Legacy):**
- `bass_c_b` - C & B notes
- `bass_c_a` - C, B, A notes
- `bass_c_g` - C through G (descending)
- `bass_c_f` - C through F
- `bass_almost_there` - Nearly complete range
- `bass_master` - Full bass range

**Rhythm (Legacy):**
- `rhythm_intro` - Rhythm basics
- `rhythm_quarter_notes` - Quarter notes
- `rhythm_half_notes` - Half notes
- `rhythm_eighth_notes` - Eighth notes
- `rhythm_mixed` - Mixed rhythms

**Boss (Legacy):**
- `boss_treble_warrior` - Treble boss
- `boss_bass_master` - Bass boss
- `boss_rhythm_master` - Rhythm boss

### New Node ID Convention

New nodes follow the pattern: `{path}_{unit}_{order}`
- Example: `treble_1_1` (Treble Unit 1, Node 1)
- Example: `bass_2_3` (Bass Unit 2, Node 3)
- Boss nodes: `boss_{path}_{unit}` (e.g., `boss_treble_3`)

This convention enables:
- Easy identification of path and unit
- Predictable ordering
- Clear hierarchy

---

*Document created: Phase 8 - Design & Data Modeling*
*Last updated: 2026-02-03*
