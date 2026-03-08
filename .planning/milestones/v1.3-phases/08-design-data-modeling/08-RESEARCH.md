# Phase 8: Design & Data Modeling - Research

**Researched:** 2026-02-03
**Domain:** Build-time validation, XP economy design, pedagogy documentation
**Confidence:** HIGH

## Summary

This phase establishes validation infrastructure and documents pedagogy decisions before implementing bass/rhythm nodes. The research identifies three core domains: (1) build-time validation scripts integrated into npm build, (2) XP economy design principles for balanced progression, and (3) pedagogy documentation patterns for educational rationale.

**Key findings:**
- Build-time validation should use Node.js scripts called via npm lifecycle hooks (prebuild or build) with non-zero exit codes to fail builds
- Graph validation for prerequisite chains requires cycle detection algorithms (DFS with three-state tracking)
- XP economy design follows principles from game design: balanced effort-to-reward ratios, equal total XP per path, boss node multipliers
- Pedagogy documentation should capture design rationale (why this order, why these node types) for both human developers and AI agents

**Primary recommendation:** Create a standalone validation script (`scripts/validateTrail.mjs`) that runs automatically during `npm run build`, fails the build on errors, and provides developer-friendly output. Document pedagogy in `src/data/PEDAGOGY.md` as a living design document.

## Standard Stack

### Core Validation Tools

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in | ESM | Validation script runtime | No external dependencies, works in any Node.js environment |
| npm scripts | (built-in) | Build integration via lifecycle hooks | Standard build orchestration in package.json |

### Supporting

| Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| process.exit(1) | (built-in) | Fail build on validation errors | When validation finds critical issues |
| console.error() | (built-in) | Developer-friendly error messages | For all validation failures |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| npm script | Vite plugin | Vite plugins run during dev too; prebuild script only runs on build |
| TypeScript validation | ESLint plugin | TypeScript can't validate runtime data structure relationships |
| External library | Custom DFS implementation | Graph validation is simple enough to implement, no dependency needed |

**Installation:**
```bash
# No external dependencies required
# Uses Node.js built-in ESM modules
```

## Architecture Patterns

### Recommended Project Structure

```
src/data/
├── skillTrail.js           # Main node definitions (imports expandedNodes)
├── expandedNodes.js        # Combines all unit files (Phase 11)
├── constants.js            # NODE_CATEGORIES, EXERCISE_TYPES
├── nodeTypes.js            # NODE_TYPES enum, metadata
├── PEDAGOGY.md             # Design rationale documentation (NEW)
└── units/
    ├── trebleUnit1.js
    ├── trebleUnit2.js
    ├── bassUnit1.js        # Phase 9
    ├── bassUnit2.js        # Phase 9
    └── rhythmUnit1.js      # Phase 10

scripts/
└── validateTrail.mjs       # Build-time validation (NEW)

package.json                # Add prebuild script (NEW)
```

### Pattern 1: Build-Time Validation Script

**What:** Standalone Node.js script that validates trail data structure before build
**When to use:** Run automatically as part of `npm run build` to catch errors before deploy

**Example:**
```javascript
// scripts/validateTrail.mjs
#!/usr/bin/env node

import { SKILL_NODES } from '../src/data/skillTrail.js';
import { NODE_TYPES } from '../src/data/nodeTypes.js';

let hasErrors = false;

// Validate prerequisite chains (cycle detection)
function validatePrerequisites() {
  const visited = new Set();
  const visiting = new Set();

  function hasCycle(nodeId, path = []) {
    if (visiting.has(nodeId)) {
      console.error(`❌ Cycle detected: ${[...path, nodeId].join(' → ')}`);
      return true;
    }
    if (visited.has(nodeId)) return false;

    visiting.add(nodeId);
    const node = SKILL_NODES.find(n => n.id === nodeId);
    if (!node) {
      console.error(`❌ Invalid prerequisite: "${nodeId}" not found`);
      return true;
    }

    for (const prereqId of node.prerequisites) {
      if (hasCycle(prereqId, [...path, nodeId])) return true;
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  for (const node of SKILL_NODES) {
    if (hasCycle(node.id)) hasErrors = true;
  }
}

// Validate node types
function validateNodeTypes() {
  const validTypes = Object.values(NODE_TYPES);
  for (const node of SKILL_NODES) {
    if (!validTypes.includes(node.nodeType)) {
      console.error(`❌ Invalid nodeType in ${node.id}: "${node.nodeType}"`);
      hasErrors = true;
    }
  }
}

console.log('🔍 Validating trail nodes...');
validatePrerequisites();
validateNodeTypes();

if (hasErrors) {
  console.error('\n❌ Validation failed. Build aborted.\n');
  process.exit(1);
}

console.log('✅ Trail validation passed\n');
```

**Integration in package.json:**
```json
{
  "scripts": {
    "prebuild": "node scripts/validateTrail.mjs",
    "build": "vite build"
  }
}
```

**Why this pattern:** npm automatically runs `prebuild` before `build`. If validation fails (exit code 1), the build never starts.

### Pattern 2: XP Economy Calculation

**What:** Calculate total XP per path to ensure balanced progression
**When to use:** During validation to verify XP totals match design intent

**Example:**
```javascript
// In validateTrail.mjs
function validateXPEconomy() {
  const xpByCategory = {
    treble_clef: 0,
    bass_clef: 0,
    rhythm: 0
  };

  for (const node of SKILL_NODES) {
    if (node.category === 'boss') continue; // Count separately
    xpByCategory[node.category] += node.xpReward;
  }

  const trebleXP = xpByCategory.treble_clef;
  const bassXP = xpByCategory.bass_clef;
  const rhythmXP = xpByCategory.rhythm;

  // Allow 10% variance
  const maxVariance = Math.max(trebleXP, bassXP, rhythmXP) * 0.1;

  if (Math.abs(trebleXP - bassXP) > maxVariance ||
      Math.abs(trebleXP - rhythmXP) > maxVariance ||
      Math.abs(bassXP - rhythmXP) > maxVariance) {
    console.error(`❌ XP imbalance detected:`);
    console.error(`   Treble: ${trebleXP} XP`);
    console.error(`   Bass:   ${bassXP} XP`);
    console.error(`   Rhythm: ${rhythmXP} XP`);
    hasErrors = true;
  } else {
    console.log(`✅ XP economy balanced (${trebleXP} XP per path)`);
  }
}
```

### Pattern 3: Pedagogy Documentation Structure

**What:** Markdown file documenting educational design rationale
**When to use:** Created in Phase 8, maintained as nodes are added

**Example:**
```markdown
# Piano Trail Pedagogy

## Design Philosophy

This trail is designed for 8-year-old learners following educational psychology principles:
- **One new element at a time** - Cognitive load theory
- **Varied activity types** - Sustained engagement (Discovery → Practice → Mix-Up → Speed → Boss)
- **Immediate feedback** - Mastery learning

## Note Introduction Order

### Treble Clef: C4 → D4 → E4 → F4 → G4 → A4 → B4 → C5

**Rationale:**
- Start with Middle C (C4) - Universal starting point in piano pedagogy
- Ascending order matches physical keyboard layout (left to right)
- Three-note grouping (C-D-E) establishes pattern before expanding

**Sources:**
- Middle C method (W.S.B. Mathews, 1892; popularized by Thompson's Modern Course, 1936)
- Faber Piano Adventures uses C, G, F as guide notes but adds systematically

### Bass Clef: C4 → B3 → A3 → G3 → F3 → E3 → D3 → C3

**Rationale:**
- Mirror treble pedagogy: start with Middle C
- Descending order matches bass clef reading direction (reading downward)
- Same cognitive load as treble (one note at a time, same grouping pattern)

### Rhythm: Quarter → Half → Whole → Eighth → Dotted

**Rationale:**
- Quarter note = steady beat (foundational concept in rhythm pedagogy)
- Half/whole notes = longer durations (simpler than subdivisions)
- Eighth notes = first subdivision (typically taught after beat mastery)
- Dotted notes = advanced concept (1.5 beats requires understanding of beat + half-beat)

**Sources:**
- "ta and ti-ti" is typically first rhythm experience in elementary music
- Eighth notes introduced as division of quarter notes after beat mastery

## Node Type Purposes

### Discovery Nodes
**Purpose:** Introduce 1-2 new notes without cognitive overload
**Duration:** 3-4 minutes
**Rhythm:** Simple (quarters only) - focus on pitch recognition

### Practice Nodes
**Purpose:** Drill recent notes with sight reading
**Duration:** 3-5 minutes
**Rhythm:** Medium complexity (quarters + halves) - reward for note mastery

### Mix-Up Nodes
**Purpose:** Memory game variation (sustained engagement)
**Duration:** 4-5 minutes
**Child thinks:** "This is FUN!" (variety prevents monotony)

### Speed Round Nodes
**Purpose:** Timed challenge (flow state, urgency)
**Duration:** 2-3 minutes
**Child thinks:** "Can I beat the clock?"

### Mini-Boss Nodes
**Purpose:** Unit checkpoint (sense of accomplishment)
**Duration:** 5-6 minutes
**XP:** 2x regular nodes (celebration of unit completion)

### Boss Nodes
**Purpose:** Major milestone (epic challenge moment)
**Duration:** 6-8 minutes
**XP:** 3x regular nodes (major celebration)
```

### Anti-Patterns to Avoid

- **Validation warnings instead of errors:** Warnings get ignored. Critical issues (cycles, invalid types) MUST fail the build.
- **Manual validation before commit:** Humans forget. Automate in build pipeline.
- **Complex external dependencies:** Graph validation is ~30 lines of code. Don't add a library for this.
- **Pedagogy docs in code comments:** Comments get out of sync. Separate documentation file is source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cycle detection | BFS with visited set | DFS with three-state tracking (unvisited/visiting/visited) | BFS can't detect back edges in directed graphs |
| XP level curves | Linear progression | Exponential/polynomial curves | Game economies need increasing effort per level to maintain engagement |
| npm script integration | Custom CLI tool | npm lifecycle hooks (prebuild) | npm already has standard hooks, no custom tooling needed |

**Key insight:** Build-time validation catches errors at development time, not production runtime. This is a "shift left" approach—fail fast during build rather than discovering issues after deploy.

## Common Pitfalls

### Pitfall 1: Validation Runs Too Late

**What goes wrong:** Validation runs as a separate manual command that developers forget to run before committing
**Why it happens:** Relying on human process instead of automation
**How to avoid:** Use npm `prebuild` lifecycle hook so validation is mandatory before every build
**Warning signs:**
- "I forgot to run the validation script"
- Invalid nodes discovered after deployment
- CI/CD pipeline catches errors that should've been caught locally

### Pitfall 2: Cycle Detection False Negatives

**What goes wrong:** Cycle detection misses certain graph patterns (e.g., cycles not reachable from starting nodes)
**Why it happens:** Only validating from nodes with `prerequisites: []` instead of all nodes
**How to avoid:** Iterate through ALL nodes as starting points for cycle detection, not just entry nodes
**Warning signs:**
- Validation passes but students encounter "impossible to unlock" nodes
- Prerequisites reference nodes that themselves require the original node (indirect cycles)

### Pitfall 3: XP Economy Drift

**What goes wrong:** Total XP per path becomes unbalanced as nodes are added over time
**Why it happens:** No automated check that treble/bass/rhythm paths award equal total XP
**How to avoid:** Validation script calculates and compares XP totals, fails if variance > 10%
**Warning signs:**
- Students favor one path because it's faster to level up
- Completing treble clef reaches level 10 but bass clef only level 7

### Pitfall 4: Pedagogy Documentation Becomes Stale

**What goes wrong:** Documentation describes old trail structure, doesn't reflect current implementation
**Why it happens:** Documentation not updated when nodes change
**How to avoid:** Make pedagogy doc a living document—update it in the same PR as node changes
**Warning signs:**
- "The documentation says X but the code does Y"
- New developers don't understand why notes are introduced in specific order
- AI agents hallucinate pedagogy that contradicts actual implementation

### Pitfall 5: Legacy Node Duplication

**What goes wrong:** Same node defined in both LEGACY_NODES and expanded nodes arrays
**Why it happens:** Incomplete cleanup when migrating from legacy to new system
**How to avoid:** Validation script checks for duplicate node IDs across all sources
**Warning signs:**
- Students see same node twice on trail map
- Progress saving fails due to ID conflicts
- XP economy calculation counts same node twice

## Code Examples

### Validated Pattern: DFS Cycle Detection

```javascript
// Source: Based on graph algorithms from js-incremental-cycle-detect and tarjan-graph
// Adapted for prerequisite chain validation

function validatePrerequisiteChains(nodes) {
  const UNVISITED = 0;
  const VISITING = 1;
  const VISITED = 2;

  const state = new Map();
  let cycleDetected = false;

  // Initialize all nodes as unvisited
  for (const node of nodes) {
    state.set(node.id, UNVISITED);
  }

  function dfs(nodeId, path = []) {
    const currentState = state.get(nodeId);

    // Back edge detected - this is a cycle
    if (currentState === VISITING) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = [...path.slice(cycleStart), nodeId];
      console.error(`❌ Cycle detected: ${cycle.join(' → ')}`);
      cycleDetected = true;
      return;
    }

    // Already fully explored this branch
    if (currentState === VISITED) return;

    // Mark as visiting (gray node)
    state.set(nodeId, VISITING);

    // Find node and explore prerequisites
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      console.error(`❌ Node not found: ${nodeId}`);
      cycleDetected = true;
      return;
    }

    for (const prereqId of node.prerequisites) {
      dfs(prereqId, [...path, nodeId]);
    }

    // Mark as visited (black node)
    state.set(nodeId, VISITED);
  }

  // Check all nodes (not just entry points)
  for (const node of nodes) {
    if (state.get(node.id) === UNVISITED) {
      dfs(node.id);
    }
  }

  return !cycleDetected;
}
```

### Validated Pattern: Exercise Config Validation

```javascript
// Validate that exercise configs match their types
function validateExerciseConfigs(nodes) {
  let valid = true;

  for (const node of nodes) {
    for (const exercise of node.exercises) {
      const { type, config } = exercise;

      if (type === 'note_recognition' || type === 'sight_reading') {
        if (!config.notePool || !config.clef) {
          console.error(`❌ ${node.id}: ${type} missing notePool or clef`);
          valid = false;
        }
      }

      if (type === 'rhythm') {
        if (!config.rhythmPatterns || !config.tempo) {
          console.error(`❌ ${node.id}: rhythm missing rhythmPatterns or tempo`);
          valid = false;
        }
      }
    }
  }

  return valid;
}
```

### Validated Pattern: npm Lifecycle Integration

```json
// package.json
{
  "scripts": {
    "prebuild": "node scripts/validateTrail.mjs",
    "build": "vite build",
    "verify:trail": "node scripts/validateTrail.mjs"
  }
}
```

**Usage:**
- `npm run build` - Automatically validates before building (prebuild hook)
- `npm run verify:trail` - Manual validation for development

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual validation | Automated prebuild validation | 2026 (Phase 8) | Catches errors before deploy, not after |
| Runtime prerequisite checking | Build-time graph validation | 2026 (Phase 8) | Shift left - fail during build, not production |
| Scattered pedagogy in comments | Centralized PEDAGOGY.md | 2026 (Phase 8) | Single source of truth for design rationale |
| LEGACY_NODES duplication | Single source (expandedNodes.js) | 2026 v1.3 (Phase 11) | Eliminates duplicate node IDs |
| 10 XP levels (0-3200 XP) | 15 XP levels (0-9000 XP) | Jan 2026 | Accommodates 90-node trail expansion |

**Deprecated/outdated:**
- `nodeGenerator.js`: Will be removed after Phase 9 (bass) and Phase 10 (rhythm) complete. Hand-crafted nodes in `units/*.js` replace generated ones.
- `LEGACY_NODES` array in `skillTrail.js`: Will be removed in Phase 11 after all nodes migrated to unit structure.

## Open Questions

1. **Should validation fail on XP imbalance or just warn?**
   - What we know: Game economies require balanced effort-to-reward across parallel paths
   - What's unclear: Is 10% variance acceptable or should it be stricter?
   - Recommendation: Start with 10% variance tolerance (fail build if exceeded), tighten if needed

2. **Where should PEDAGOGY.md live?**
   - What we know: Claude Code needs to reference it during planning, developers need to maintain it
   - Options: `.planning/PEDAGOGY.md` (agent-focused) vs `src/data/PEDAGOGY.md` (code-focused) vs `docs/PEDAGOGY.md` (documentation-focused)
   - Recommendation: `src/data/PEDAGOGY.md` - colocated with trail definitions, part of codebase (checked into git)

3. **Should validation check exercise config validity?**
   - What we know: Invalid configs cause runtime errors in games
   - What's unclear: How deep should validation go? (e.g., validate that notePool notes are valid scientific pitch notation?)
   - Recommendation: Start with basic checks (required fields present), expand if runtime errors occur

4. **Legacy ID mapping - in-node field vs separate file?**
   - What we know: Context says "simplified by reset decision" - no complex migration needed
   - What's unclear: Do we need ANY legacy ID tracking?
   - Recommendation: Document legacy IDs in PEDAGOGY.md comments for reference, no runtime mapping needed

## Sources

### Primary (HIGH confidence)

- **npm lifecycle scripts** - [npm scripts documentation](https://docs.npmjs.com/cli/v11/using-npm/scripts/): Official npm docs confirm prebuild/build/postbuild hooks
- **Cycle detection algorithms** - [js-incremental-cycle-detect](https://blutorange.github.io/js-incremental-cycle-detect/), [tarjan-graph](https://github.com/tmont/tarjan-graph): Established libraries for graph cycle detection
- **DFS three-state tracking** - [The Javascript Developer's Guide to Graphs](https://hackernoon.com/the-javascript-developers-guide-to-graphs-and-detecting-cycles-in-them-96f4f619d563): Standard algorithm for cycle detection in directed graphs
- **Existing codebase patterns** - `scripts/patternVerifier.mjs`, `src/data/nodeTypes.js`, `src/utils/xpSystem.js`: Current project structure and conventions

### Secondary (MEDIUM confidence)

- **Game economy design** - [Designing Game Economies: Inflation, Resource Management, and Balance](https://medium.com/@msahinn21/designing-game-economies-inflation-resource-management-and-balance-fa1e6c894670) (Jan 2026): Recent article on balanced progression systems
- **XP level curves** - [Game Economy Design – Playtank](https://playtank.io/2025/08/12/game-economy-design/): Discusses effort-to-reward balance in progression systems
- **Duolingo progression** - [Duolingo XP Points Explained](https://duolingoguides.com/what-is-xp-in-duolingo/): Real-world example of skill tree XP rewards (10 XP per lesson, 20 XP for skill completion)
- **Piano pedagogy** - [Basic Piano Adventures Q&A](https://pianoadventures.com/piano-books/basic-piano-adventures/primer/q-and-a/): Faber's approach to note introduction order
- **Rhythm pedagogy** - [Teaching Quarter and Eighth Notes](https://www.adifferentmusician.com/post/scaffolding-quarters-and-eighths-with-your-kiddos): Elementary music pedagogy order

### Tertiary (LOW confidence)

- **Vite build hooks** - [Vite Building for Production](https://vite.dev/guide/build): Vite documentation doesn't specify prebuild integration, npm handles it
- **Middle C method** - [Piano pedagogy - Wikipedia](https://en.wikipedia.org/wiki/Piano_pedagogy): Historical context but no specific 2026 guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - npm lifecycle hooks and DFS algorithms are well-established patterns
- Architecture: HIGH - Validation script pattern verified from existing codebase (`patternVerifier.mjs`)
- XP economy: MEDIUM - Game design principles verified but specific balance ratios need playtesting
- Pedagogy: MEDIUM - Traditional piano pedagogy verified but specific note order for 8-year-olds benefits from expert review

**Research date:** 2026-02-03
**Valid until:** 60 days (stable domain - build tooling and pedagogy principles don't change rapidly)

---

## Implementation Notes for Planner

**Critical path:**
1. Create `scripts/validateTrail.mjs` with prerequisite chain validation (catches cycles)
2. Add node type validation (catches invalid NODE_TYPES values)
3. Add XP economy validation (warns if paths unbalanced)
4. Integrate via `prebuild` script in package.json
5. Create `src/data/PEDAGOGY.md` with design rationale
6. Document legacy node IDs for reference (no runtime migration needed per Context)

**Success criteria:**
- Running `npm run build` automatically validates trail before building
- Validation fails build (exit code 1) on critical errors (cycles, invalid types)
- XP totals per path calculated and displayed
- PEDAGOGY.md documents note introduction order and node type purposes
- All validation covered by unit tests (optional but recommended)
