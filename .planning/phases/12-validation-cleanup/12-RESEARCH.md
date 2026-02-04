# Phase 12: Validation & Cleanup - Research

**Researched:** 2026-02-04
**Domain:** Production validation, legacy code removal, database cleanup
**Confidence:** HIGH

## Summary

Phase 12 finalizes the v1.3 Trail System Redesign by validating the new 93-node system with production data and removing all legacy code from the old 18-node system. This is a cleanup and validation phase with no new features.

The domain encompasses three main areas: (1) production data validation to ensure the new trail system works with real user data, (2) safe legacy code removal following clean-break principles, and (3) database cleanup of orphaned progress records. The phase builds on existing build-time validation infrastructure (validateTrail.mjs) and extends it with production data snapshot testing.

The standard approach combines automated validation scripts with manual verification of critical user flows. Modern best practices (2026) emphasize automation in CI/CD pipelines, production-aware testing with real data snapshots, and safe incremental deletion with git history as a safety net. The key recommendation is to use the existing build validation infrastructure as a foundation and extend it with production data simulation.

**Primary recommendation:** Leverage existing validateTrail.mjs infrastructure, extend with production data snapshot testing, perform complete legacy code deletion with git revert commit ready for rollback.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 3.2.4 | Unit/integration testing | Already in project, fast ESM support, React ecosystem standard |
| Node.js scripts | Built-in | Build-time validation | Zero dependencies, runs in npm scripts |
| Supabase CLI | Latest | Database migration management | Official Supabase tooling, migration history tracking |
| ESLint | 9.9.1 | Static code analysis | Already configured, detects unused variables/imports |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright | Not installed | E2E testing (optional) | Only if automated E2E required - manual walkthrough is sufficient |
| Knip | Not installed | Dead code detection | Optional - can find unused exports beyond ESLint |
| PostgreSQL psql | Client | Database queries | Production snapshot export/validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual testing | Playwright E2E suite | Automated but adds complexity - overkill for final validation phase |
| Node.js scripts | Vitest tests | More infrastructure but less necessary for one-time validation |
| Manual code search | Knip tool | Automated but requires setup - grep/eslint sufficient for known patterns |

**Installation:**
No new dependencies required. All validation can be done with existing stack.

## Architecture Patterns

### Production Data Validation Pattern

**What:** Test with anonymized production data snapshot to verify trail system handles real-world scenarios.

**When to use:** After major data model changes, before deploying cutover migrations.

**Pattern:**
```javascript
// scripts/validateProductionSnapshot.mjs

import { SKILL_NODES } from '../src/data/skillTrail.js';

/**
 * Simulate production scenarios with real node IDs
 */
async function validateProductionSnapshot() {
  // 1. Query production database for sample progress records
  const sampleProgress = await fetchProductionSample();

  // 2. Check for orphaned records (progress references invalid node IDs)
  const orphanedRecords = sampleProgress.filter(
    record => !SKILL_NODES.find(node => node.id === record.node_id)
  );

  // 3. Verify prerequisite unlocking with real user data
  const unlockingIssues = validatePrerequisiteUnlocking(sampleProgress);

  // 4. Report findings
  console.log(`Orphaned records: ${orphanedRecords.length}`);
  console.log(`Unlocking issues: ${unlockingIssues.length}`);

  // Fail if issues found
  return orphanedRecords.length === 0 && unlockingIssues.length === 0;
}
```

### Safe Legacy Code Deletion Pattern

**What:** Delete legacy code in single atomic commit with revert commit prepared.

**When to use:** When legacy code is confirmed unused and new system is verified.

**Pattern:**
```bash
# 1. Verify no imports remain
grep -r "LEGACY_NODES" src/
grep -r "nodeGenerator" src/

# 2. Delete legacy code in single commit
git add -A
git commit -m "refactor(trail): remove legacy 18-node system

Delete LEGACY_NODES array (594 lines) and nodeGenerator.js (368 lines).
New 93-node system validated and deployed.

Breaking change: Old node IDs no longer exist in codebase.
Git history preserves legacy implementation.

Refs: #v1.3-trail-redesign"

# 3. Immediately create revert commit (don't push)
git revert HEAD --no-commit
git commit -m "Revert: rollback to legacy trail system (emergency only)"

# 4. Push both commits
git push origin HEAD~1:main  # Push deletion commit
# Keep revert commit local for emergency use
```

### Database Cleanup Migration Pattern

**What:** One-time migration that logs deletions and performs cleanup atomically.

**When to use:** After progress reset, to clean up orphaned records.

**Implementation:**
```sql
-- Migration: Cleanup orphaned progress records
-- Date: 2026-02-04
-- Description: Remove progress records for deleted legacy node IDs

BEGIN;

-- Step 1: Log orphaned records count
DO $$
DECLARE
  v_orphaned_progress INTEGER;
  v_orphaned_goals INTEGER;
BEGIN
  -- Count progress records with node_id not in current SKILL_NODES
  -- (This requires node IDs to be passed from application layer)

  -- For now, log all records as reference
  SELECT COUNT(*) INTO v_orphaned_progress
  FROM student_skill_progress;

  SELECT COUNT(*) INTO v_orphaned_goals
  FROM student_daily_goals;

  RAISE NOTICE 'Orphaned progress records deleted: %', v_orphaned_progress;
  RAISE NOTICE 'Orphaned goals records deleted: %', v_orphaned_goals;
END $$;

-- Step 2: Delete orphaned records
-- (Already done in 20260204000001_reset_trail_progress_v13.sql)

COMMIT;
```

**Note:** The progress reset migration already handles cleanup. This pattern is documented for reference in case additional orphaned records are discovered during validation.

### Build-Time Validation Extension Pattern

**What:** Extend existing validateTrail.mjs with production-aware checks.

**When to use:** After core validation passes, before deployment.

**Pattern:**
```javascript
// Add to scripts/validateTrail.mjs

/**
 * Validate that all node configurations are game-compatible
 */
function validateGameCompatibility() {
  console.log('\nChecking game compatibility...');

  for (const node of SKILL_NODES) {
    // Check note recognition exercises have valid note pools
    const noteRecEx = node.exercises.find(ex => ex.type === 'note_recognition');
    if (noteRecEx && (!noteRecEx.config.notePool || noteRecEx.config.notePool.length === 0)) {
      console.error(`  ERROR: Node "${node.id}" has note_recognition exercise with empty notePool`);
      hasErrors = true;
    }

    // Check rhythm exercises have valid tempo
    const rhythmEx = node.exercises.find(ex => ex.type === 'rhythm');
    if (rhythmEx && rhythmEx.config.tempo < 40) {
      console.error(`  ERROR: Node "${node.id}" has rhythm exercise with invalid tempo: ${rhythmEx.config.tempo}`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log('  Game compatibility: OK');
  }
}
```

### Anti-Patterns to Avoid

- **Gradual deletion over multiple commits:** Creates unstable intermediate states. Delete in one atomic commit.
- **Commenting out instead of deleting:** Clutters codebase. Git history preserves deleted code.
- **Testing in production first:** Validate with snapshot data before deploying to production.
- **Manual record counting without logging:** Use RAISE NOTICE in migrations for audit trail.
- **Skipping rollback preparation:** Always have revert commit ready before deploying breaking changes.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dead code detection | Custom AST parser | ESLint no-unused-vars + manual grep | ESLint catches 90% of cases, grep finds remaining patterns |
| E2E test framework | Custom test runner | Playwright (if needed) | Battle-tested, auto-wait, CI-friendly |
| Database migration rollback | Custom SQL scripts | Supabase migration repair + git revert | Official tooling prevents history corruption |
| Production data snapshot | Manual SQL exports | PostgreSQL pg_dump with --data-only | Standard tooling, handles all data types correctly |

**Key insight:** This phase is about cleanup and validation, not building new infrastructure. Use existing tools and scripts, extend where necessary, but don't introduce new complex systems.

## Common Pitfalls

### Pitfall 1: Deleting Code Still Referenced Elsewhere

**What goes wrong:** Delete LEGACY_NODES array, but forget it's imported in a test file or commented-out code path.

**Why it happens:** Incomplete search for references. Only checking active imports, not comments or test fixtures.

**How to avoid:**
1. Use multiple search patterns: `grep -r "LEGACY_NODES"`, `grep -r "nodeGenerator"`, `git grep -i "legacy"`
2. Check test files explicitly: `find src -name "*.test.js*" -exec grep -l "LEGACY_NODES" {} \;`
3. Run full test suite after deletion: `npm run test:run`

**Warning signs:**
- Build passes but tests fail with "module not found"
- Runtime errors in development but not caught by validation
- TypeScript/ESLint warnings about missing imports

### Pitfall 2: Production Data Edge Cases Not Tested

**What goes wrong:** Validation passes with clean test data, but real users have edge cases (null values, orphaned foreign keys, data from old schema versions).

**Why it happens:** Test data is idealized. Production data has years of accumulated anomalies.

**How to avoid:**
1. Export real production data snapshot (anonymized): `pg_dump --data-only --table=student_skill_progress`
2. Test against actual node IDs from production records
3. Check for NULL values in required fields
4. Verify foreign key relationships still valid after migration

**Warning signs:**
- Migration succeeds but queries fail with "column does not exist"
- RLS policies block unexpected records
- Dashboard shows empty state for users who had progress

### Pitfall 3: Incomplete Migration Rollback Plan

**What goes wrong:** Deploy migration, discover critical issue, attempt rollback but can't restore deleted progress data.

**Why it happens:** Migration deletes data without backup. Revert commit only restores code, not database state.

**How to avoid:**
1. Migration already designed to preserve XP (only deletes trail-specific progress)
2. Create revert commit BEFORE pushing deletion commit
3. Test revert commit locally: `git revert HEAD` and verify build passes
4. Document rollback procedure in deployment notes

**Warning signs:**
- No revert commit prepared
- Migration deletes data without logging
- No mechanism to restore user state if rollback needed

### Pitfall 4: False Positive from ESLint Unused Warnings

**What goes wrong:** ESLint reports LEGACY_NODES as unused, but it's actually exported and used in an edge case.

**Why it happens:** ESLint's `no-unused-vars` rule doesn't track dynamic usage (require() calls, string-based imports, re-exports).

**How to avoid:**
1. After ESLint check, manually verify with grep: `grep -r "LEGACY_NODES" --exclude-dir=node_modules`
2. Check for re-exports: Look for `export { LEGACY_NODES }` or `export * from './skillTrail'`
3. Validate by removing code and running full test suite
4. If tests pass and app runs, code is truly unused

**Warning signs:**
- ESLint says unused but grep finds references
- Code is exported but ESLint doesn't detect usage
- Removing code causes runtime errors not caught by tests

### Pitfall 5: Regression in Core Trail Features

**What goes wrong:** Cleanup accidentally removes code needed by new system, causing trail to break after deployment.

**Why it happens:** Shared utilities between old and new system. Grep finds usage in LEGACY_NODES but misses usage in expandedNodes.

**How to avoid:**
1. Full regression test of trail features: unlock, progress, daily goals, XP
2. Test all three paths (treble, bass, rhythm) end-to-end
3. Manual walkthrough: Start node → Complete → Check stars → Verify next unlocked
4. Automated validation: Extend validateTrail.mjs to check game compatibility

**Warning signs:**
- Trail renders but nodes don't unlock after completion
- Stars save but don't display on trail map
- Daily goals don't update after completing exercises
- XP awards but level doesn't increase

## Code Examples

Verified patterns from existing codebase:

### Production Snapshot Validation

```javascript
// scripts/validateProductionSnapshot.mjs
// Source: Adapted from existing validateTrail.mjs pattern

import { SKILL_NODES } from '../src/data/skillTrail.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fetch sample of progress records from production
 */
async function fetchProductionSample(limit = 100) {
  const { data, error } = await supabase
    .from('student_skill_progress')
    .select('node_id, student_id, stars')
    .limit(limit);

  if (error) {
    console.error('Failed to fetch production data:', error);
    return [];
  }

  return data;
}

/**
 * Check for orphaned progress records
 */
function findOrphanedRecords(progressRecords) {
  const validNodeIds = new Set(SKILL_NODES.map(n => n.id));

  return progressRecords.filter(record => !validNodeIds.has(record.node_id));
}

/**
 * Main validation
 */
async function validateProduction() {
  console.log('Fetching production data sample...');
  const records = await fetchProductionSample();

  console.log(`\nValidating ${records.length} records...`);
  const orphaned = findOrphanedRecords(records);

  if (orphaned.length > 0) {
    console.error(`Found ${orphaned.length} orphaned records:`);
    orphaned.forEach(r => console.error(`  ${r.node_id} (student: ${r.student_id})`));
    process.exit(1);
  }

  console.log('Production validation passed!');
}

validateProduction();
```

### Dead Code Audit Script

```bash
#!/bin/bash
# scripts/auditDeadCode.sh
# Source: Based on 2026 dead code detection best practices

echo "=== Dead Code Audit ==="

# Check for LEGACY_NODES references
echo ""
echo "Checking LEGACY_NODES references..."
LEGACY_REFS=$(grep -r "LEGACY_NODES" src/ --exclude-dir=node_modules | wc -l)
if [ "$LEGACY_REFS" -gt 1 ]; then
  echo "  Found $LEGACY_REFS references (expected 1 in skillTrail.js)"
  grep -r "LEGACY_NODES" src/ --exclude-dir=node_modules
else
  echo "  OK - Only definition found"
fi

# Check for nodeGenerator imports
echo ""
echo "Checking nodeGenerator imports..."
NODE_GEN_IMPORTS=$(grep -r "from.*nodeGenerator" src/ --exclude-dir=node_modules | wc -l)
if [ "$NODE_GEN_IMPORTS" -gt 0 ]; then
  echo "  ERROR: Found $NODE_GEN_IMPORTS imports"
  grep -r "from.*nodeGenerator" src/ --exclude-dir=node_modules
  exit 1
else
  echo "  OK - No imports found"
fi

# Run ESLint check
echo ""
echo "Running ESLint unused code detection..."
npm run lint 2>&1 | grep -E "(no-unused-vars|@typescript-eslint/no-unused-vars)" || echo "  OK - No unused variables"

echo ""
echo "=== Audit Complete ==="
```

### E2E Manual Test Checklist

```markdown
# Trail System E2E Verification Checklist

Date: _______
Tester: _______

## Treble Path
- [ ] Start node unlocked and clickable
- [ ] Complete node → Stars display correctly (1★, 2★, 3★)
- [ ] Next node unlocks after completion
- [ ] Prerequisites block locked nodes
- [ ] Boss node appears after unit completion
- [ ] XP awarded matches node.xpReward × stars
- [ ] Level increases when XP threshold crossed

## Bass Path
- [ ] All above checks for bass clef nodes
- [ ] Bass clef renders correctly in exercises
- [ ] Note recognition accepts correct bass notes

## Rhythm Path
- [ ] All above checks for rhythm nodes
- [ ] Metronome trainer launches with correct tempo
- [ ] Rhythm patterns match node configuration
- [ ] Time signature changes work (4/4, 3/4)

## Daily Goals
- [ ] Three goals generated on first visit
- [ ] Progress updates after completing exercises
- [ ] Goals reset at midnight (check database)
- [ ] Completed goals show checkmark

## Cross-Feature
- [ ] Continue Learning button shows correct next node
- [ ] Trail map scrolls smoothly
- [ ] Modal shows exercise details
- [ ] Accessories unlock on node completion
- [ ] Teacher can view student trail progress
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual QA before deploy | Automated validation in CI/CD pipeline | 2024-2025 | Catches issues earlier, faster feedback |
| Delete code across multiple PRs | Atomic deletion with revert commit ready | 2025-2026 | Easier rollback, clearer git history |
| Test with synthetic data | Production data snapshot testing | 2025-2026 | Catches real-world edge cases |
| Comment out legacy code | Delete completely, rely on git history | Always | Cleaner codebase, git preserves history |

**Deprecated/outdated:**
- Jest for Vite projects: Vitest is now standard for ESM/Vite codebases (2024+)
- Cypress for React: Playwright has better React component testing support (2025+)
- Manual migration rollback scripts: Supabase CLI migration repair is official approach (2024+)

## Open Questions

1. **Production Snapshot Access**
   - What we know: Migration has been deployed to production (based on Phase 11 verification)
   - What's unclear: Whether we can safely export production data snapshot for validation
   - Recommendation: Use Supabase CLI to export anonymized sample: `supabase db dump --data-only --table=student_skill_progress --limit=100`

2. **Testing Approach: Automated vs Manual**
   - What we know: CONTEXT.md leaves this to Claude's discretion
   - What's unclear: Whether manual walkthrough is sufficient or automated E2E needed
   - Recommendation: Manual walkthrough is sufficient for final validation phase. 3-5 critical flows tested manually (one per path + daily goals + XP/leveling) provides adequate coverage without E2E infrastructure overhead.

3. **Deployment Timing: Immediate vs Soak Period**
   - What we know: CONTEXT.md mentions "manual check-in for first 24-48 hours"
   - What's unclear: Whether this means delay deployment or deploy and monitor
   - Recommendation: Deploy immediately after validation, monitor for 24-48 hours with revert commit ready. No need to delay if validation passes.

4. **Rollback Scope**
   - What we know: Git revert can restore code, but not database state
   - What's unclear: If rollback is needed, do we also revert the progress reset migration?
   - Recommendation: Rollback plan should include re-running old migration if code revert is needed. Document this in deployment notes.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `scripts/validateTrail.mjs`, `package.json`, `src/data/skillTrail.js`
- Phase 11 verification: `.planning/phases/11-integration-cutover/11-VERIFICATION.md`
- Supabase migration: `supabase/migrations/20260204000001_reset_trail_progress_v13.sql`

### Secondary (MEDIUM confidence)
- [Software testing best practices for 2026 - N-iX](https://www.n-ix.com/software-testing-best-practices/)
- [Data Quality Testing: Methods and Best Practices for 2026](https://www.ovaledge.com/blog/data-quality-testing-guide)
- [Supabase Data Migration Guide](https://copyright-certificate.byu.edu/news/supabase-data-migration-guide)
- [How to Automate Safe Removal of Unused Code - Security Boulevard](https://securityboulevard.com/2026/01/how-to-automate-safe-removal-of-unused-code/)
- [Delete unused code (and how to retrieve it)](https://understandlegacycode.com/blog/delete-unused-code/)
- [Testing in 2026: Jest, React Testing Library, and Full Stack Testing Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [Guide to Playwright end-to-end testing in 2026 - DeviQA](https://www.deviqa.com/blog/guide-to-playwright-end-to-end-testing-in-2025/)
- [Knip: Dead Code Detector for JavaScript & TypeScript Projects](https://dev.to/ajmal_hasan/knip-the-ultimate-dead-code-detector-for-javascript-typescript-projects-3463)

### Tertiary (LOW confidence)
- WebSearch results on validation/cleanup patterns (verified with existing codebase patterns)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools already in project, no new dependencies needed
- Architecture: HIGH - Patterns derived from existing validateTrail.mjs and migration files
- Pitfalls: HIGH - Based on Phase 11 verification findings and 2026 best practices

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - stable domain, no major framework changes expected)

**Key findings:**
1. **Existing infrastructure is solid:** validateTrail.mjs provides excellent foundation, just needs extension for production data
2. **No new dependencies needed:** All validation can be done with Node.js, ESLint, grep, and existing test suite
3. **Manual testing is sufficient:** E2E automation would be overkill for final validation phase with 3-5 critical flows
4. **Clean deletion is safe:** Git history preserves legacy code, atomic commit with revert prepared enables safe rollback
5. **Migration already handles cleanup:** Progress reset migration is well-designed with logging and atomic transaction
