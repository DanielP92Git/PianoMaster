---
phase: 08-design-data-modeling
plan: 01
subsystem: trail-validation
tags: [build-tools, validation, trail-data, npm-lifecycle]

dependency_graph:
  requires: []
  provides:
    - Build-time trail validation
    - Prerequisite cycle detection
    - Node type validation
    - XP economy audit
  affects:
    - Phase 09-12 (trail system changes validated at build)
    - CI/CD pipeline

tech_stack:
  added: []
  patterns:
    - DFS three-state cycle detection
    - npm prebuild lifecycle hook

file_tracking:
  key_files:
    created:
      - scripts/validateTrail.mjs
    modified:
      - package.json

decisions:
  - id: validation-warnings-vs-errors
    choice: XP imbalance is warning, cycles/invalid types are errors
    rationale: XP balance will be fixed in Phase 11, but structural errors must block deploy

metrics:
  duration: 6 minutes
  completed: 2026-02-03
---

# Phase 08 Plan 01: Build-time Validation Script Summary

**One-liner:** DFS cycle detection + node type validation with npm prebuild hook (263 LOC)

## What Was Built

Created `scripts/validateTrail.mjs` - a Node.js ESM script that validates trail data structure at build time.

### Validation Functions

| Function | Purpose | Failure Mode |
|----------|---------|--------------|
| `validatePrerequisiteChains()` | DFS cycle detection with three-state tracking | ERROR (exit 1) |
| `validateNodeTypes()` | Verifies nodeType against NODE_TYPES enum | ERROR (exit 1) |
| `validateDuplicateIds()` | Catches duplicate node IDs | ERROR (exit 1) |
| `validateXPEconomy()` | Calculates per-category XP totals | WARNING only |

### npm Integration

- **`prebuild`**: Runs validation automatically before `npm run build`
- **`verify:trail`**: Standalone command for development

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create validateTrail.mjs | f0de845 | scripts/validateTrail.mjs |
| 2 | Integrate into npm lifecycle | 6efaffb | package.json |

## Verification Results

1. `npm run verify:trail` - PASS (exits 0, shows warnings)
2. `npm run build` - PASS (shows validation before Vite build)
3. Cycle detection test - PASS (detects `treble_c_d -> treble_c_e -> treble_c_d`)
4. Invalid nodeType test - PASS (reports `invalid_type_xyz` as error)
5. XP imbalance - PASS (65% variance logged as warning, not error)

## Current Trail Status

Validation output on current data:
```
Validating 64 trail nodes...
  Prerequisite chains: OK
  Node types: OK (26 typed, 38 legacy)
  Unique IDs: OK (64 nodes)
  Treble: 1530 XP | Boss: 1550 XP | Bass: 870 XP | Rhythm: 535 XP
  WARNING: XP variance 65.0% between paths
Validation passed with warnings.
```

## Deviations from Plan

None - plan executed exactly as written.

## Key Implementation Details

### DFS Cycle Detection Algorithm

Uses three-state tracking (UNVISITED=0, VISITING=1, VISITED=2) to detect back edges:

```javascript
if (state === VISITING) {
  // Found a cycle - node already in current path
  const cycle = [...path.slice(cycleStart), nodeId];
  console.error(`Cycle detected: ${cycle.join(' -> ')}`);
}
```

### Exit Codes

- **0**: Validation passed (may have warnings)
- **1**: Validation failed (has errors) - build aborted

## Next Phase Readiness

The validation infrastructure is ready for Phases 9-12:
- New nodes added will be validated automatically
- Prerequisite changes will be cycle-checked
- Node type additions will be verified against NODE_TYPES
- XP economy changes will be tracked (warnings for Phase 11 balancing)

## Files Reference

- **Created**: `scripts/validateTrail.mjs` (263 lines)
- **Modified**: `package.json` (2 lines added)
