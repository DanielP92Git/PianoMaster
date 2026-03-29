# Phase 10: Ear Training Trail Data + Trail Tab - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 10-ear-training-trail-data-trail-tab
**Areas discussed:** Node progression, Unit structure, Free tier boundary, Boss node design

---

## Node Progression

### Path start

| Option | Description | Selected |
|--------|-------------|----------|
| Pitch comparison first | Start with higher/lower (easier concept) for 4-5 nodes, then introduce intervals. Mirrors how music teachers sequence ear training — direction before distance. | ✓ |
| Alternating from the start | Interleave pitch comparison and interval nodes from the beginning. More variety early, but harder conceptual load. | |
| Mixed exercises per node | Each node has BOTH a pitch comparison AND an interval exercise. Child does both per node, progressing both skills together. | |

**User's choice:** Pitch comparison first
**Notes:** None

### Note range

| Option | Description | Selected |
|--------|-------------|----------|
| Start C4 neighborhood | Begin with notes near middle C (C3-C5), expand outward to C3-B5 by late nodes. Familiar territory for kids who played treble/bass games. | ✓ |
| Full range from start | Use the full piano sampler range (C3-B4) from the beginning. More challenging but consistent. | |
| You decide | Let Claude pick based on what works best with the difficulty tiers from Phase 9. | |

**User's choice:** Start C4 neighborhood
**Notes:** None

### Difficulty progression (pitch comparison)

| Option | Description | Selected |
|--------|-------------|----------|
| Shrinking intervals | Early nodes: wide intervals (octave+). Middle nodes: 4ths/5ths. Later nodes: 2nds/3rds. Matches Phase 9's tiered band system — but each NODE locks a tier. | ✓ |
| Same tiers, more questions | All nodes use the same wide-to-narrow session progression from Phase 9, but later nodes have tighter time pressure or more questions. | |
| Chromatic narrowing | Early: only white keys. Later: introduce sharps/flats to make intervals harder to distinguish. | |

**User's choice:** Shrinking intervals
**Notes:** None

### Interval build

| Option | Description | Selected |
|--------|-------------|----------|
| Steps first, then skips, then leaps | First interval node: only steps. Next: steps + skips. Later: all three. Scaffolded learning. | ✓ |
| All three from first interval node | Every interval node has step/skip/leap as options. Difficulty comes from ascending vs descending and narrower intervals. | |
| You decide | Let Claude design the interval progression based on music pedagogy. | |

**User's choice:** Steps first, then skips, then leaps
**Notes:** None

---

## Unit Structure

### Unit themes

| Option | Description | Selected |
|--------|-------------|----------|
| By game type | Unit 1: "Sound Direction" — pitch comparison nodes. Unit 2: "Interval Explorer" — interval ID nodes + mixed review. Clean conceptual split. | ✓ |
| By difficulty tier | Unit 1: "Easy Ears" — wide intervals, both games. Unit 2: "Sharp Ears" — narrow intervals, both games. Both units mix game types. | |
| You decide | Let Claude pick the best split based on the node count and progression. | |

**User's choice:** By game type
**Notes:** None

### Node count

| Option | Description | Selected |
|--------|-------------|----------|
| 6 + 7 (13 total) | Unit 1: 6 pitch comparison nodes. Unit 2: 7 interval nodes (including some mixed). Manageable size. | ✓ |
| 7 + 8 (15 total) | Larger units with more granular difficulty steps. More content but more data authoring work. | |
| 5 + 7 (12 total) | Shorter Unit 1 since pitch comparison is simpler. Fewer nodes to author. | |

**User's choice:** 6 + 7 (13 total)
**Notes:** None

---

## Free Tier Boundary

### Free nodes

| Option | Description | Selected |
|--------|-------------|----------|
| Unit 1 free (6 nodes) | All of Unit 1 (Sound Direction) is free, Unit 2 is premium. Consistent with treble/bass/rhythm where unit 1 is the free tier. | ✓ |
| First 4 nodes free | Only the first 4 pitch comparison nodes are free. Tighter gate. | |
| 3 per unit (6 total) | 3 free nodes from each unit. Kids get a taste of both game types before paywall. | |

**User's choice:** Unit 1 free (6 nodes)
**Notes:** None

### Boss gate

| Option | Description | Selected |
|--------|-------------|----------|
| All bosses paywalled | Consistent with existing pattern — all boss nodes in PAYWALL_BOSS_NODE_IDS. | ✓ |
| Unit 1 boss free | Let free-tier kids complete Unit 1 including its boss. More satisfying but breaks convention. | |

**User's choice:** All bosses paywalled
**Notes:** None

### DB sync approach

| Option | Description | Selected |
|--------|-------------|----------|
| New migration adding ear IDs | Add a new Supabase migration that updates is_free_node() to include the new ear training node IDs. | ✓ |
| You decide | Let Claude handle the DB sync approach. | |

**User's choice:** New migration adding ear IDs
**Notes:** None

---

## Boss Node Design

### Boss count

| Option | Description | Selected |
|--------|-------------|----------|
| 1 per unit (2 total) | Boss at end of Unit 1 and Unit 2. IDs: boss_ear_1 and boss_ear_2. Matches treble/bass pattern. | ✓ |
| 1 total at the end | Single boss after Unit 2 that combines both pitch comparison and intervals. | |
| You decide | Let Claude pick based on what works with the 13-node structure. | |

**User's choice:** 1 per unit (2 total)
**Notes:** None

### Boss exercise mix

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-exercise combining unit skills | Unit 1 boss: 2 pitch comparison exercises (wide + narrow). Unit 2 boss: 1 interval + 1 mixed. Harder versions. | ✓ |
| Single harder exercise per boss | Each boss is one exercise with tighter parameters. Simpler to author. | |
| Cross-category boss | Boss mixes ear training with note recognition or sight reading. Tests broader music knowledge. | |

**User's choice:** Multi-exercise combining unit skills
**Notes:** None

---

## Claude's Discretion

- Exact node IDs and naming convention
- Node descriptions and display names
- Specific note ranges per node
- Interval tier boundaries per node
- XP reward values
- Exercise config parameters
- Prerequisite chain design
- accessoryUnlock assignments
- Unit header descriptions

## Deferred Ideas

None — discussion stayed within phase scope.
