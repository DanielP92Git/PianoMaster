# Phase 11: Arcade Rhythm Game + Rhythm Node Remapping - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 11-arcade-rhythm-game-rhythm-node-remapping
**Areas discussed:** Falling Tile Visual Design, Game Feel & Feedback, Node Remapping Strategy, Difficulty Progression

---

## Falling Tile Visual Design

### Tile Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single lane, full-width tiles | One column of tiles falling down center. Tap anywhere. Like single-lane Guitar Hero. | ✓ |
| Multi-lane (2-4 columns) | Tiles fall in different lanes. Must tap correct lane. More complex. | |
| Single lane with note icons | Single lane but tiles show VexFlow note symbols instead of text. | |

**User's choice:** Single lane, full-width tiles
**Notes:** Simplest interaction for 8-year-olds — tap anywhere when tile reaches hit zone.

### Duration Visualization

| Option | Description | Selected |
|--------|-------------|----------|
| Color-coded tiles | Each duration gets a distinct color. Quick visual recognition. | ✓ |
| Tile height varies by duration | Half notes taller than quarter notes. Visual length = musical length. | |
| Both color + height | Combine color coding AND proportional height. | |

**User's choice:** Color-coded tiles
**Notes:** Builds duration-color association over time without complex spatial mapping.

### Hit Zone

| Option | Description | Selected |
|--------|-------------|----------|
| Glowing line | Horizontal glowing line, pulsing with beat. Tiles dissolve when crossing. | ✓ |
| Padded target zone | Semi-transparent rectangular strip. PERFECT=center, GOOD=edges. | |
| Animated catch area | Cup/platform that catches tiles. More game-like. | |

**User's choice:** Glowing line
**Notes:** Fits enchanted forest glass aesthetic.

### Rest Representation

| Option | Description | Selected |
|--------|-------------|----------|
| Ghost tiles for rests | Semi-transparent tiles fall for rests. Don't tap. Teaches rest awareness. | ✓ |
| Empty gaps only | No visual for rests. Just empty space between tiles. | |
| Rest symbol tiles | Tiles with rest notation symbols fall. Must not tap. | |

**User's choice:** Ghost tiles for rests
**Notes:** Visual representation helps children learn rest awareness without penalty.

---

## Game Feel & Feedback

### Tap Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Floating text + tile burst | Text floats up, PERFECT=particle explosion, GOOD=dissolve, MISS=gray fallthrough. | ✓ |
| Hit zone flash only | Line flashes green/yellow/red. Cleaner but less rewarding. | |
| Full-screen flash + text | Screen-edge color pulse + floating text. More dramatic. | |

**User's choice:** Floating text + tile burst
**Notes:** Reuses FloatingFeedback pattern from RhythmReadingGame.

### On-Fire Mode

| Option | Description | Selected |
|--------|-------------|----------|
| Flame trail on tiles | Tiles gain fire/glow trail. Hit zone turns orange. | ✓ |
| Background intensifies | Forest background shifts — more stars, brighter orbs. | |
| Both tiles + background | Flame trail AND background intensifies. | |

**User's choice:** Flame trail on tiles
**Notes:** Focused visual reward on the game elements, not ambient background.

### Life Loss

| Option | Description | Selected |
|--------|-------------|----------|
| Heart icons + screen shake | 3 hearts in corner. Heart breaks with screen shake on miss. | ✓ |
| Heart icons only | Hearts silently drain. | |
| Lives bar + warning flash | Life bar drains, border flashes red. | |

**User's choice:** Heart icons + screen shake
**Notes:** Screen shake respects reducedMotion preference.

### Count-In

| Option | Description | Selected |
|--------|-------------|----------|
| Countdown + tiles visible | 3-2-1-GO with metronome clicks. First tiles already descending during countdown. | ✓ |
| Count-in with blank screen | Countdown plays but tiles appear only after GO. | |
| No count-in, slow start | First tiles fall at reduced speed as warm-up. | |

**User's choice:** Visual countdown + first tiles visible
**Notes:** Child previews the incoming pattern during countdown. Same pattern as RhythmReadingGame.

---

## Node Remapping Strategy

### Distribution Across Units

| Option | Description | Selected |
|--------|-------------|----------|
| Progressive variety | Units 1-2 mostly MetronomeTrainer, gradually introduce new types. | |
| Mixed from the start | Every unit has a mix of all types from Unit 1. | ✓ |
| Game-type clusters | Dedicate certain node positions to specific types. | |

**User's choice:** Mixed from the start
**Notes:** Maximum variety immediately. Kids encounter all game types in every unit.

### Per-Unit Split Rule

| Option | Description | Selected |
|--------|-------------|----------|
| Per-unit proportional | Each unit independently follows ~40/30/20/10 split. | ✓ |
| Global across all 36 | Split applies to total 36, not per-unit. | |
| You decide | Claude picks best distribution per node. | |

**User's choice:** Per-unit proportional
**Notes:** Consistent variety in every unit.

### Boss Node Exercise Type

| Option | Description | Selected |
|--------|-------------|----------|
| Arcade Rhythm for all bosses | Every rhythm boss uses arcade_rhythm. Consistent boss identity. | ✓ |
| Match unit's dominant type | Boss uses the unit's dominant exercise type. | |
| Multi-exercise boss | Boss chains 2-3 different exercise types. | |

**User's choice:** Arcade Rhythm for all bosses
**Notes:** Most exciting game type creates consistent "boss battle" feel.

---

## Difficulty Progression

### Fall Speed vs Tempo

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed screen travel time | Tiles always take same time to cross screen. Higher tempo = denser tiles. | ✓ |
| Speed scales with tempo | Higher tempo = faster falling tiles. | |
| Configurable per node | Each node sets its own fall speed. | |

**User's choice:** Fixed screen travel time
**Notes:** Consistent visual feel regardless of difficulty level.

### In-Session Difficulty

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed difficulty per session | All 10 patterns use same tempo/complexity from node config. | ✓ |
| Gradual ramp within session | First patterns easier, then ramp up. | |
| Adaptive difficulty | Adjusts based on performance. | |

**User's choice:** Fixed difficulty per session
**Notes:** Difficulty controlled by trail progression, not within individual sessions.

---

## Claude's Discretion

- Exact color palette for duration-coded tiles
- Tile dimensions and spacing
- Glowing line animation details
- Particle burst effect implementation
- Flame trail visual details
- Combo threshold for on-fire activation
- Ghost tile opacity
- Countdown animation timing
- Per-node exercise type assignments (within D-11/D-12/D-13 rules)
- Screen travel time constant
- PERFECT/GOOD/MISS timing windows
- FloatingFeedback reuse approach

## Deferred Ideas

None — discussion stayed within phase scope.
