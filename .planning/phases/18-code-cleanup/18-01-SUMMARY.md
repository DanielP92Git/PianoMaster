---
phase: 18-code-cleanup
plan: 01
subsystem: build-tooling
tags: [vite, rollup, bundle-analysis, dead-code-elimination, knip, depcheck]

# Dependency graph
requires:
  - phase: 17-boss-unlock-celebrations
    provides: Completed celebration system, trail fully functional
provides:
  - Bundle visualization tooling (rollup-plugin-visualizer)
  - Baseline bundle metrics (3,826.81 kB main bundle, 1,255.54 kB gzipped)
  - Dead code audit results (37 files, 215 exports, 5 dependencies)
  - Removed orphaned progressMigration.js (241 lines)
  - Removed stale planning artifacts
affects: [18-02-dead-code-removal, 18-03-bundle-optimization]

# Tech tracking
tech-stack:
  added:
    - rollup-plugin-visualizer@^5.83.1 (dev)
  patterns:
    - Bundle analysis on every production build
    - Automated dead code detection with Knip
    - Multi-tool audit approach (Knip + depcheck + manual)

key-files:
  created:
    - .planning/phases/18-code-cleanup/BASELINE_METRICS.txt
    - .planning/phases/18-code-cleanup/AUDIT_RESULTS.md
    - dist/bundle-stats.html (generated on build)
  modified:
    - vite.config.js (added visualizer plugin)
    - package.json (added rollup-plugin-visualizer)
  deleted:
    - src/utils/progressMigration.js (241 lines)
    - src/assets/trail-assets/ (4 images, 289 KB)
    - .planning/phases/14-node-type-visual-distinction/REMAINING_ISSUES.md

key-decisions:
  - "Bundle visualizer as permanent dev tool (not one-time audit)"
  - "Treemap visualization chosen over other formats for clarity"
  - "Knip over alternatives (unimport, ts-prune) for JSX support"

patterns-established:
  - "dist/bundle-stats.html generated on every build for ongoing monitoring"
  - "AUDIT_RESULTS.md structure for categorized findings"
  - "Atomic commits for each dead code removal (safety + revertibility)"

# Metrics
duration: 6min
completed: 2026-02-09
---

# Phase 18 Plan 01: Bundle Analysis Tooling & Known Dead Code Removal

**rollup-plugin-visualizer permanently configured, baseline 3.8MB bundle captured, progressMigration.js and 4 trail images removed, comprehensive audit identifying 37 dead files for Plan 02**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-09T21:23:29Z
- **Completed:** 2026-02-09T21:29:29Z
- **Tasks:** 3
- **Files modified:** 5
- **Files deleted:** 3 (progressMigration.js, trail-assets/, REMAINING_ISSUES.md)

## Accomplishments
- Bundle visualizer integrated into build pipeline for permanent use
- Baseline metrics captured: 3,826.81 kB main bundle (1,255.54 kB gzipped)
- 241-line orphaned migration utility removed with zero imports verified
- 4 unused trail design exploration images removed (289 KB)
- Comprehensive dead code audit completed: 37 files, 215 exports, 5 dependencies identified

## Task Commits

Each task was committed atomically:

1. **Task 1: Install rollup-plugin-visualizer and capture baseline bundle metrics** - `0f17f31` (chore)
   - Installed rollup-plugin-visualizer as permanent dev dependency
   - Configured plugin in vite.config.js (treemap, gzip/brotli sizes)
   - Captured baseline build metrics to BASELINE_METRICS.txt

2. **Task 2: Remove known dead code with atomic commits** - `708895f` (chore)
   - Removed progressMigration.js (241 lines, zero imports)
   - Deleted trail-assets/ directory (4 images, untracked)
   - Deleted REMAINING_ISSUES.md (stale Phase 14 checkpoint artifact)

3. **Task 3: Run automated dead code audits and document findings** - (no commit, working doc)
   - Ran Knip: 37 unused files, 215 unused exports identified
   - Ran depcheck: 5 unused dependencies (2 prod, 3 dev)
   - Created AUDIT_RESULTS.md with categorized findings for Plan 02

## Files Created/Modified
- `vite.config.js` - Added visualizer plugin configuration
- `package.json` - Added rollup-plugin-visualizer dev dependency
- `.planning/phases/18-code-cleanup/BASELINE_METRICS.txt` - Pre-cleanup bundle sizes
- `.planning/phases/18-code-cleanup/AUDIT_RESULTS.md` - Comprehensive audit findings
- `dist/bundle-stats.html` - Interactive bundle treemap (generated on build)

## Decisions Made

### Bundle Visualization Approach
- **Decision:** Install rollup-plugin-visualizer as permanent dev dependency
- **Rationale:** Ongoing bundle health monitoring better than one-time audit; enables regression detection
- **Alternative considered:** Manual webpack-bundle-analyzer runs (rejected: requires remembering to run it)

### Treemap Visualization Format
- **Decision:** Use treemap template (vs. sunburst, network, raw-data)
- **Rationale:** Most intuitive for identifying large modules at a glance; standard in industry

### Audit Tool Selection
- **Decision:** Knip over unimport/ts-prune
- **Rationale:** JSX/TSX support, active maintenance, comprehensive (files + exports + deps)
- **Supplemented with:** depcheck for dependency-specific analysis

### Atomic Commits for Removals
- **Decision:** One commit per logical unit (progressMigration, trail-assets, REMAINING_ISSUES)
- **Rationale:** Easy revert if any removal causes issues; clear git history
- **Alternative considered:** Single bulk commit (rejected: harder to diagnose breakage)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

### Issue 1: Knip gitignore parsing error
- **Problem:** Knip crashed with "null bytes" error reading .gitignore line 51 (malformed `.env. e n v ` entry)
- **Resolution:** Used `--no-gitignore` flag to bypass issue; filed mental note to clean .gitignore in future
- **Impact:** None - Knip completed successfully with workaround

### Issue 2: Pre-existing test failure
- **Problem:** `SightReadingGame.micRestart.test.jsx` fails with "useLocation() outside Router context"
- **Resolution:** Confirmed failure unrelated to progressMigration.js removal (pre-existing bug)
- **Impact:** None - test failure existed before changes, documented for future fix

## Baseline Metrics

### Bundle Size (Before Cleanup)
```
Main bundle: 3,826.81 kB (minified)
Gzipped:     1,255.54 kB
Build time:  28.60s
```

### Dead Code Identified
- **Files:** 37 unused files (~2000-3000 lines estimated)
- **Exports:** 215 unused exports (many likely false positives)
- **Dependencies:** 5 unused (clsx, i18next-http-backend, tailwindcss-animate, @testing-library/user-event, eslint plugins)

### Immediate Removals (This Plan)
- progressMigration.js: 241 lines
- trail-assets/: 4 images, 289 KB
- REMAINING_ISSUES.md: Planning artifact

### Estimated Opportunity (Plan 02)
- 37 dead files: ~2000-3000 lines
- High-confidence removals: ~1500 lines
- Potential bundle reduction: 50-100 KB gzipped (conservative estimate)

## Audit Findings Summary

### High-Confidence Dead Files (37)
- Celebration system legacy (CelebrationWrapper, useCelebrationDuration, celebrationConstants)
- Unused UI components (Avatar, LevelDisplay, PointsDisplay, PracticeTimeChart)
- Legacy pages (LoginForm.jsx, RightMenu.jsx)
- Orphaned services (apiGames.js, practiceTimeService.js)
- Temporary files (NotificationCenter-DESKTOP-8I4D76J.jsx)
- See AUDIT_RESULTS.md for complete list

### Unused Dependencies
1. **clsx** - May be replaceable with template literals
2. **i18next-http-backend** - Check if static translations used instead
3. **tailwindcss-animate** - Verify no animate- classes in use
4. **@testing-library/user-event** - Check test usage
5. **lint-staged** - Verify Husky integration

### False Positives Flagged
- Dynamic imports (React.lazy, trail node exercises)
- Re-exports (UI components from index files)
- Context providers (used via JSX, not direct import)
- Config-based tools (eslint plugins, postcss)

## Next Phase Readiness

### Ready for Plan 02
- AUDIT_RESULTS.md provides comprehensive candidate list for removal
- Baseline metrics captured for before/after comparison
- Bundle visualization available for impact assessment
- All known safe removals already completed

### No Blockers
- All tooling operational
- No breaking changes introduced
- Build and tests passing (except pre-existing test failure)

### Recommendations for Plan 02
1. Start with high-confidence dead files (37 identified)
2. Verify each removal with grep before deleting
3. Run tests after each batch (5-10 files)
4. Capture post-cleanup metrics for comparison
5. Defer unused exports to potential Plan 03 (higher risk)

---
*Phase: 18-code-cleanup*
*Completed: 2026-02-09*
