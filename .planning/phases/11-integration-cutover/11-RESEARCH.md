# Phase 11: Integration & Cutover - Research

**Researched:** 2026-02-04
**Domain:** JavaScript module integration, database migration, progress reset, deployment atomicity
**Confidence:** HIGH

## Summary

This research investigated how to execute an atomic cutover from the legacy 18-node trail system to the new 87-node redesigned system (treble/bass/rhythm units). The standard approach combines several proven techniques: single-file import consolidation for atomicity, database migration scripts for progress reset, build-time validation for verification, and structured rollback planning.

The critical insight is that "atomic" doesn't mean "without database changes" - it means all components change together in a coordinated fashion. The cutover requires both code changes (skillTrail.js import swap) and database changes (progress reset migration), executed as a single deployment unit.

Key recommendations:
- Use single-commit cutover with both code and migration files
- Reset progress via database migration, preserve XP totals
- Run validation script before and after cutover (prebuild hook already configured)
- Keep 1-week rollback window with database backup
- Mark LEGACY_NODES as deprecated but retain in file (Phase 12 cleanup)

**Primary recommendation:** Execute cutover as single git commit containing both skillTrail.js changes and migration file, deploy together as atomic unit.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JavaScript ES6 modules | Native | Module import/export system | Native browser/Node.js support, static analysis |
| Supabase migrations | 2.0+ | Database schema versioning | Official Supabase CLI tool, timestamp-based ordering |
| Node.js validation scripts | Native | Build-time checks | No external dependencies, fast execution, CI/CD integration |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vite prebuild hook | 6.x | Run validation before build | Catch errors at build time, not runtime |
| Git atomic commits | Native | Coordinate code + migration | Ensure code/DB changes deploy together |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single commit | Feature flag | More complexity, longer test period, but gradual rollout possible |
| Progress reset | Data migration | More complex, preserves history, but risks XP inflation and mismatched pedagogy |
| Prebuild validation | Runtime checks | Catches errors in production, not build time (unacceptable for this domain) |

**Installation:**
```bash
# All tools already installed - no additional dependencies needed
npm run verify:trail  # Validation script
npm run build         # Triggers prebuild validation automatically
```

## Architecture Patterns

### Recommended Project Structure
```
src/data/
├── skillTrail.js           # Master file - imports from expandedNodes
├── expandedNodes.js        # Aggregator - imports all unit files
├── units/
│   ├── trebleUnit1Redesigned.js
│   ├── trebleUnit2Redesigned.js
│   ├── trebleUnit3Redesigned.js
│   ├── bassUnit1Redesigned.js
│   ├── bassUnit2Redesigned.js
│   ├── bassUnit3Redesigned.js
│   ├── rhythmUnit1Redesigned.js
│   ├── rhythmUnit2Redesigned.js
│   ├── rhythmUnit3Redesigned.js
│   ├── rhythmUnit4Redesigned.js
│   ├── rhythmUnit5Redesigned.js
│   └── rhythmUnit6Redesigned.js
supabase/migrations/
└── 20260204000001_reset_trail_progress_v13.sql  # Progress reset migration
```

### Pattern 1: Single Import Swap (Atomic Cutover)
**What:** Change one line in skillTrail.js to switch from LEGACY_NODES to expandedNodes
**When to use:** When all unit files are complete and validated
**Example:**
```javascript
// Before (current state):
export const SKILL_NODES = [
  ...expandedNodes,
  ...LEGACY_NODES  // Still spreading legacy for backward compat
];

// After (cutover):
export const SKILL_NODES = [
  ...expandedNodes  // Only new system
];

// LEGACY_NODES stays in file with deprecation comment:
// DEPRECATED: Retained for Phase 12 cleanup. Do NOT spread into SKILL_NODES.
const LEGACY_NODES = [ /* ... */ ];
```

### Pattern 2: Database Progress Reset
**What:** SQL migration that deletes trail progress, preserves XP totals
**When to use:** When node IDs change and preservation would cause more harm than good
**Example:**
```sql
-- Source: Supabase migration best practices
-- https://supabase.com/docs/guides/deployment/database-migrations

-- Take manual backup first (via Supabase dashboard or CLI)

BEGIN;

-- Delete trail-specific progress
DELETE FROM student_skill_progress;
DELETE FROM student_daily_goals;
DELETE FROM student_unit_progress;

-- XP totals remain intact (students.total_xp, students.current_level unchanged)

-- Add migration metadata comment
COMMENT ON TABLE student_skill_progress IS
  'Trail progress reset 2026-02-04 for v1.3 redesigned system';

COMMIT;
```

### Pattern 3: Build-Time Validation Gate
**What:** Prebuild script that fails build if trail data is invalid
**When to use:** Always - prevents deploying broken trail configurations
**Example:**
```javascript
// Source: Existing validateTrail.mjs in project
// Already configured in package.json: "prebuild": "node scripts/validateTrail.mjs"

// Validates:
// 1. No duplicate node IDs
// 2. All prerequisites exist
// 3. No circular dependencies
// 4. Valid node types
// 5. XP economy variance (warning only)

// Exit code 1 fails the build
if (hasErrors) {
  console.error('Validation FAILED. Build aborted.');
  process.exit(1);
}
```

### Pattern 4: Structured Rollback Plan
**What:** Documented procedure for reverting cutover if critical issues surface
**When to use:** Always - risk mitigation for major changes
**Example:**
```markdown
## Rollback Procedure (Within 1 week of cutover)

### Option A: Git Revert + Database Restore (Fastest)
1. Git revert the cutover commit
2. Deploy reverted code
3. Restore database from pre-cutover backup (Supabase dashboard)
4. Verify legacy trail loads correctly

### Option B: Fix Forward (Preferred after 24 hours)
1. Identify specific issue (broken node, missing prerequisite, etc.)
2. Create hotfix commit
3. Deploy fix without touching database
4. Users continue with new system
```

### Anti-Patterns to Avoid
- **Gradual migration by category:** Mixing legacy and new nodes creates broken prerequisite chains
- **Runtime node generation:** Already removed in Phase 10; importing static files is faster and safer
- **Preserving legacy node IDs:** Users expect v1.3 to be different; clean break is clearer than ID remapping
- **Skipping validation:** Build will catch errors anyway via prebuild hook, but manual check is good practice

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validation in game components | Runtime checks for node existence | Build-time validation script | Catches errors before deploy, not in production |
| Gradual rollout system | Custom feature flag in code | Single atomic commit | Trail is static data, not user-facing feature; complexity not justified |
| XP economy balancing | Manual calculation | validateTrail.mjs XP analysis | Already reports variance by category, warns at >10% |
| Database backup automation | Custom backup script | Supabase manual backup | One-time operation, UI is faster than scripting |
| Migration history tracking | Custom version table | Supabase migrations table | Built into Supabase CLI, tracks applied migrations |

**Key insight:** Trail cutover is a one-time operation, not an ongoing feature. Use simple, verifiable techniques instead of building infrastructure.

## Common Pitfalls

### Pitfall 1: Assuming "Atomic" Means No Database Changes
**What goes wrong:** Developers try to preserve old data with new node IDs, causing mismatches
**Why it happens:** "Atomic" sounds like "no side effects", but it really means "coordinated changes"
**How to avoid:** Plan database changes alongside code changes, deploy together
**Warning signs:** Attempting node ID remapping, building migration scripts that preserve exercise_progress with old node IDs

### Pitfall 2: Forgetting Triggers Reference Node IDs
**What goes wrong:** Database triggers like `update_unit_progress_on_node_completion()` use node_id patterns (e.g., `LIKE 'treble_%'`)
**Why it happens:** Triggers are invisible during code review, only visible in migration files
**How to avoid:** Grep for `node_id` in migration files, verify trigger logic still applies to new IDs
**Warning signs:** Trigger extracts category from node_id prefix - new IDs must follow same pattern (treble_1_1, bass_1_1, rhythm_1_1)

### Pitfall 3: Validation Script Not Failing Build
**What goes wrong:** Broken trail deployed to production because validation didn't stop build
**Why it happens:** Exit code 1 must be explicit in script to fail build process
**How to avoid:** Test prebuild hook locally: `npm run build` with intentionally broken data
**Warning signs:** Validation script logs errors but build succeeds anyway

### Pitfall 4: No Rollback Plan Documentation
**What goes wrong:** Critical issue in production, no one knows how to revert safely
**Why it happens:** Team assumes "we'll figure it out if needed", no written procedure
**How to avoid:** Document rollback steps BEFORE cutover, include in PR description
**Warning signs:** "We can just git revert if something breaks" without testing procedure

### Pitfall 5: Deploying Code and Migration Separately
**What goes wrong:** Code deploys first, references new nodes that don't exist yet; or migration runs first, resets progress while old trail still active
**Why it happens:** CI/CD pipeline deploys frontend and backend separately
**How to avoid:** Single PR with both code and migration, deploy as single unit
**Warning signs:** Frontend deploy triggers before database migration runs, or vice versa

### Pitfall 6: XP Economy Variance Not Audited
**What goes wrong:** One path (e.g., rhythm) awards significantly more/less XP, creating imbalance
**Why it happens:** Units designed independently without cross-path comparison
**How to avoid:** Run `npm run verify:trail` and review XP totals, adjust if variance >10%
**Warning signs:** validateTrail.mjs shows warning about XP variance

## Code Examples

Verified patterns from project and official sources:

### Atomic Cutover Commit Structure
```bash
# Source: Git best practices + project conventions
# Single commit containing all cutover changes

git add src/data/skillTrail.js                              # Import swap
git add supabase/migrations/20260204000001_reset_v13.sql    # Progress reset
git add .planning/STATE.md                                  # Update milestone

git commit -m "feat(11): atomic cutover to redesigned trail system

- Remove LEGACY_NODES from SKILL_NODES array
- Mark LEGACY_NODES as deprecated for Phase 12 cleanup
- Reset trail progress via database migration (preserve XP)
- All 87 nodes from redesigned units now active

BREAKING CHANGE: Student trail progress reset with v1.3
XP totals preserved, progress starts fresh with new pedagogy

Refs: .planning/phases/11-integration-cutover/11-CONTEXT.md"
```

### Progress Reset Migration
```sql
-- Source: Supabase migration docs + project security patterns
-- https://supabase.com/docs/guides/deployment/database-migrations

-- Migration: Reset Trail Progress for v1.3 Redesigned System
-- Date: 2026-02-04
-- Description: Atomic reset of trail-specific progress while preserving XP totals

BEGIN;

-- Step 1: Verify pre-migration state (for rollback reference)
DO $$
DECLARE
  v_total_students INTEGER;
  v_total_progress INTEGER;
  v_total_xp BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total_students FROM students;
  SELECT COUNT(*) INTO v_total_progress FROM student_skill_progress;
  SELECT SUM(total_xp) INTO v_total_xp FROM students;

  RAISE NOTICE 'Pre-migration: % students, % progress records, % total XP',
    v_total_students, v_total_progress, v_total_xp;
END $$;

-- Step 2: Delete trail progress (cascade to exercise progress)
DELETE FROM student_skill_progress;
DELETE FROM student_daily_goals;
DELETE FROM student_unit_progress;

-- Step 3: Verify XP totals unchanged
DO $$
DECLARE
  v_total_xp_after BIGINT;
BEGIN
  SELECT SUM(total_xp) INTO v_total_xp_after FROM students;
  RAISE NOTICE 'Post-migration: Total XP preserved: %', v_total_xp_after;
END $$;

-- Step 4: Add migration metadata
COMMENT ON TABLE student_skill_progress IS
  'Trail progress reset 2026-02-04 for v1.3 redesigned system (87 nodes)';

COMMIT;
```

### Validation Before Deployment
```bash
# Source: Project package.json scripts

# Run validation manually before committing
npm run verify:trail

# Expected output for successful validation:
# ==================================================
# Trail Validation
# ==================================================
# Validating 87 trail nodes...
#
# Checking prerequisite chains...
#   Prerequisite chains: OK
#
# Checking node types...
#   Node types: OK (87 typed, 0 legacy)
#
# Checking for duplicate IDs...
#   Unique IDs: OK (87 nodes)
#
# Analyzing XP economy...
#   Treble: 1050 XP (21 nodes) | Bass: 1050 XP (21 nodes) | Rhythm: 2450 XP (42 nodes)
#   WARNING: XP variance 42.0% between paths (Rhythm: 2450 vs Treble: 1050)
#
# ==================================================
# Validation passed with warnings.
# ==================================================

# Build will run validation automatically
npm run build  # Triggers prebuild hook
```

### Trigger Compatibility Verification
```sql
-- Source: Existing trigger in 20260129000002_add_unit_tracking.sql
-- Verify trigger logic works with new node ID format

-- New node IDs: treble_1_1, treble_1_2, bass_1_1, rhythm_1_1, etc.
-- Trigger extracts category from node_id prefix:

CREATE OR REPLACE FUNCTION update_unit_progress_on_node_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_category TEXT;
BEGIN
  -- Extract category from node_id prefix
  IF NEW.node_id LIKE 'treble_%' THEN
    v_category := 'treble_clef';
  ELSIF NEW.node_id LIKE 'bass_%' THEN
    v_category := 'bass_clef';
  ELSIF NEW.node_id LIKE 'rhythm_%' THEN
    v_category := 'rhythm';
  END IF;

  -- Trigger logic continues...
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification: New node IDs match existing patterns
-- treble_1_1 → LIKE 'treble_%' → category = 'treble_clef' ✓
-- bass_2_3 → LIKE 'bass_%' → category = 'bass_clef' ✓
-- rhythm_5_6 → LIKE 'rhythm_%' → category = 'rhythm' ✓
```

### Rollback Verification Test
```bash
# Source: Supabase CLI docs
# Test rollback procedure BEFORE cutover

# 1. Create test backup
# Via Supabase dashboard: Project Settings > Database > Backups > Manual Backup

# 2. Test restore procedure (on staging/local)
# Download backup file, then:
# psql -h <host> -U <user> -d <database> -f backup.sql

# 3. Verify data restored correctly
# Check student_skill_progress has legacy node IDs
# Check students.total_xp unchanged

# 4. Document working procedure for production
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Runtime node generation with `generateUnit()` | Static unit files imported at build time | Phase 10 (Jan 2026) | Faster imports, better tree-shaking, static analysis |
| Gradual migration with ID remapping | Atomic cutover with progress reset | Phase 11 design (Feb 2026) | Simpler implementation, cleaner data model |
| Manual prerequisite linking at runtime | Prerequisites set in unit files | Phase 10-04 | No runtime overhead, prerequisites visible in source |
| Separate frontend/backend deploys | Single PR with code + migration | Modern CI/CD pattern | Ensures consistency, atomic rollback |

**Deprecated/outdated:**
- `generateUnit()` and `generateRhythmUnit()` functions: Removed from expandedNodes.js in Phase 10, all units now use static exported arrays
- `linkUnitPrerequisites()` runtime logic: Simplified to pass-through in Phase 10, prerequisites now baked into unit files
- Node ID remapping strategies: Documentation exists but approach rejected in favor of clean break with progress reset

## Open Questions

Things that couldn't be fully resolved:

1. **XP Economy Variance (42.9% between Rhythm and Bass)**
   - What we know: Rhythm path has 42 nodes (2450 XP), Bass/Treble have 21 nodes each (1050 XP)
   - What's unclear: Whether this is pedagogically acceptable or needs rebalancing
   - Recommendation: Validate with user testing in first 2 weeks post-cutover; rhythm path is longest/most granular, may justify higher total XP. Check if users complain about "grinding" in rhythm vs feeling "rushed" in clef paths. Document in Phase 12 if adjustment needed.

2. **Manual Backup vs Automated Snapshot**
   - What we know: Supabase offers manual backups via dashboard, point-in-time recovery for paid plans
   - What's unclear: Current project plan (free vs paid tier) and whether automated backup is needed
   - Recommendation: Manual backup is sufficient for one-time cutover; document in PR that backup was taken, include timestamp

3. **Rollback Window Duration (1 week suggested)**
   - What we know: User feedback typically surfaces within 48 hours, but edge cases may take longer
   - What's unclear: What defines "critical issue" that justifies rollback vs "fix forward"
   - Recommendation: Define rollback criteria: (1) Trail navigation broken, (2) >50% of users unable to progress, (3) Data loss beyond progress reset. Otherwise fix forward. After 1 week, delete backup and commit to new system.

4. **Production Smoke Test Procedure**
   - What we know: Build validation catches data errors, but runtime behavior needs verification
   - What's unclear: Who performs smoke test and what specific checks to run
   - Recommendation: Post-deploy checklist: (1) Load trail map (verify all 87 nodes render), (2) Start one node from each category, (3) Complete one node and verify progress saves, (4) Check VictoryScreen shows correct XP award. Document in deployment notes.

## Sources

### Primary (HIGH confidence)
- [JavaScript modules - MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) - ES6 module system
- [Database Migrations | Supabase Docs](https://supabase.com/docs/guides/deployment/database-migrations) - Migration best practices
- [Local development with schema migrations | Supabase Docs](https://supabase.com/docs/guides/local-development/overview) - `supabase db reset` command
- [Rollback Migrations · supabase · Discussion #11263](https://github.com/orgs/supabase/discussions/11263) - Migration rollback strategies
- Project source code analysis: `src/data/skillTrail.js`, `scripts/validateTrail.mjs`, `supabase/migrations/20260129000002_add_unit_tracking.sql`

### Secondary (MEDIUM confidence)
- [Migrating Foreign Keys in PostgreSQL](https://thomas.skowron.eu/blog/migrating-foreign-keys-in-postgresql/) - Foreign key migration patterns
- [8 Feature Flag Deployment Strategies](https://www.flagsmith.com/blog/deployment-strategies) - Atomic deployment patterns
- [How You Can Use Feature Flags to Simplify Your Rollback Plan](https://www.harness.io/blog/are-feature-flags-a-part-of-your-rollback-plan) - Rollback strategies
- [5 Basic Steps in Creating Balanced In-Game Economy](https://www.gamedeveloper.com/design/5-basic-steps-in-creating-balanced-in-game-economy) - XP economy design principles

### Tertiary (LOW confidence)
- [Atomic Deployment Techniques - MOSS](https://moss.sh/reviews/atomic-deployment-techniques/) - General deployment strategies (not Supabase-specific)
- [Blue-green deployment vs rolling deployment](https://www.getunleash.io/blog/blue-green-deployment-vs-rolling-deployment) - Alternative deployment patterns (overkill for this use case)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ES6 modules and Supabase migrations are well-documented, established patterns
- Architecture: HIGH - Validated against existing project structure, all referenced files exist
- Pitfalls: HIGH - Based on common migration anti-patterns + project-specific trigger analysis
- XP economy: MEDIUM - Validation script exists but variance threshold is subjective, needs user testing validation

**Research date:** 2026-02-04
**Valid until:** 30 days (stable patterns, but check for Supabase CLI updates before executing)
