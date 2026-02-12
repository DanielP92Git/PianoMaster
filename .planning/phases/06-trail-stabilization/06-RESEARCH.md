# Phase 6: Trail Stabilization - Research

**Researched:** 2026-02-03
**Domain:** Git workflow, manual testing, and repository cleanup
**Confidence:** HIGH

## Summary

Phase 6 is a stabilization phase focused on committing existing trail work, executing manual testing, fixing discovered bugs, and cleaning up temporary documentation. This is not a feature development phase but rather a consolidation and validation phase that prepares the trail system for production use.

The research covers three main domains: (1) Git commit strategies for large features with multiple files, (2) manual testing methodologies for React applications with specific attention to integration testing, and (3) safe repository cleanup practices. The phase follows a commit-first, test-next, fix-then-cleanup workflow that ensures work is preserved early and validated thoroughly before removing temporary artifacts.

The standard approach is to use **interactive staging** (`git add -p`) to create logical commits grouped by functionality rather than one massive commit, follow **Conventional Commits** format for automated changelog generation, execute **systematic manual testing** using predefined test cases from TEST_PLAN.md, and use **git clean with dry-run** to safely remove temporary files.

**Primary recommendation:** Use interactive staging to create 3-4 logical commits (foundation files, integration updates, migrations, documentation), execute all 10 test cases from TEST_PLAN.md systematically, fix any discovered bugs with separate commits, then safely remove temporary files using `git clean -n` preview followed by manual deletion.

## Standard Stack

The established tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Git | 2.x | Version control | Universal standard for code versioning |
| Conventional Commits | 1.0.0 | Commit message format | Enables automated changelog generation and semantic versioning |
| Vitest | 3.2.4+ | Unit testing framework | Already configured in project, JSDOM support |
| Chrome DevTools | Latest | Browser debugging | Standard React debugging tool, F12 console access |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| git add -p | Built-in | Interactive staging | Large features requiring logical commit separation |
| git clean | Built-in | Untracked file removal | Repository cleanup after feature completion |
| React Testing Library | 16.3.0+ | Component testing | If automated tests needed for future phases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Conventional Commits | Free-form messages | Loses automated tooling benefits, inconsistent history |
| Interactive staging | Single commit | Harder to review, loses logical separation |
| Manual testing | Automated E2E tests | Faster for one-time validation, automation better for regression |

**Installation:**
All tools already installed in project. No additional dependencies needed.

## Architecture Patterns

### Recommended Commit Structure

This is a large feature (trail redesign) spanning multiple files. Break into logical commits:

```
1. Foundation commit (new files):
   - src/data/constants.js
   - src/data/nodeTypes.js
   - src/data/trailSections.js
   - src/data/units/*.js

2. Integration commit (modified files):
   - src/components/games/notes-master-games/MemoryGame.jsx
   - src/components/trail/TrailMap.jsx
   - src/components/trail/TrailNodeModal.jsx
   - src/data/skillTrail.js
   - src/data/expandedNodes.js
   - src/utils/nodeGenerator.js

3. Database migrations commit:
   - supabase/migrations/20260129000002_add_unit_tracking.sql
   - supabase/migrations/20260129000003_add_delete_policies.sql

4. Documentation cleanup commit:
   - Remove IMPLEMENTATION_STATUS.md, PHASE2_COMPLETE.md, etc.
   - Remove verify-redesign.mjs, unlock-nodes-test.sql
```

### Pattern 1: Interactive Staging for Large Features
**What:** Use `git add -p` (patch mode) to stage specific hunks from files, enabling creation of multiple focused commits from a large working directory.

**When to use:** When you have multiple related changes that should be separated for review clarity.

**Example:**
```bash
# Stage foundation files
git add src/data/constants.js src/data/nodeTypes.js src/data/trailSections.js
git add src/data/units/

# Create first commit
git commit -m "$(cat <<'EOF'
feat(trail): add redesigned treble clef Units 1-3 foundation

- Add shared constants file (NODE_CATEGORIES, EXERCISE_TYPES)
- Define 8 node types (Discovery, Practice, Mix-Up, Speed Round, etc.)
- Add section-based organization system
- Create Units 1-3 with 26 nodes total (vs 18 in old system)
- Implement one-note-at-a-time pedagogy
- Remove eighth notes from Units 1-3 (pedagogically correct)

Units 1-3 introduce C4-C5 progressively with 8 distinct node types
for psychological variety and engagement.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# Stage integration files
git add src/components/games/notes-master-games/MemoryGame.jsx
git add src/components/trail/*.jsx
git add src/data/skillTrail.js src/data/expandedNodes.js
git add src/utils/*.js

# Create second commit
git commit -m "$(cat <<'EOF'
feat(trail): integrate memory game with trail navigation

- Add trail auto-start to MemoryGame component
- Update TrailMap and TrailNodeModal for memory game nodes
- Wire navigation between note recognition, sight reading, memory game
- Update expandedNodes to use redesigned units

Memory game now works seamlessly with trail nodes treble_1_4,
treble_2_5, and treble_3_8 with auto-configuration.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
**Source:** Based on [Git Interactive Staging Documentation](https://git-scm.com/book/en/v2/Git-Tools-Interactive-Staging) and [Git Tower Guide](https://www.git-tower.com/learn/git/faq/remove-untracked-files-git-clean)

### Pattern 2: Systematic Manual Testing Workflow
**What:** Execute predefined test cases methodically, document results, and track issues discovered.

**When to use:** When validating a large feature before marking it complete, especially for features with complex integration points.

**Example:**
```markdown
Testing Workflow:
1. Pre-test setup
   - Start dev server (npm run dev)
   - Login as student account
   - Open browser console (F12)
   - Clear console for clean start

2. Execute each test case
   - Read test case from TEST_PLAN.md
   - Execute steps exactly as written
   - Observe expected behavior
   - Document any deviations
   - Check console for errors

3. Bug tracking
   - For each issue discovered:
     * What you did (exact steps)
     * What happened (actual behavior)
     * What you expected (expected behavior)
     * Console errors (full message)
     * Screenshot if visual

4. Fix cycle
   - Create bug fix commit for each issue
   - Re-test the specific test case
   - Continue with remaining tests

5. Final validation
   - Re-run all failed tests
   - Verify no new console errors
   - Check that all success criteria met
```
**Source:** Synthesized from [UXPin Manual Testing Checklist](https://www.uxpin.com/studio/blog/checklist-for-manual-testing-of-react-components/), [BrowserStack QA Best Practices](https://www.browserstack.com/guide/qa-best-practices), and [Software Testing Help QA Checklist](https://www.softwaretestinghelp.com/software-testing-qa-checklists/)

### Pattern 3: Safe Repository Cleanup
**What:** Preview and selectively remove untracked files after feature completion using dry-run followed by verification.

**When to use:** After committing all feature work and before marking phase complete.

**Example:**
```bash
# Step 1: Preview what would be deleted
git clean -n

# Output shows files that would be removed:
# Would remove IMPLEMENTATION_STATUS.md
# Would remove PHASE2_COMPLETE.md
# Would remove TEST_PLAN.md
# ...

# Step 2: If preview looks correct, review each file individually
ls -la *.md
cat IMPLEMENTATION_STATUS.md  # Verify it's truly temporary

# Step 3: Selective removal (safer than git clean -f)
rm IMPLEMENTATION_STATUS.md
rm PHASE2_COMPLETE.md
rm REDESIGN_COMPLETE.md
rm TEST_PLAN.md
rm verify-redesign.mjs
rm unlock-nodes-test.sql

# Step 4: Verify removal
git status

# Step 5: Commit cleanup
git add -A
git commit -m "$(cat <<'EOF'
chore(trail): remove temporary implementation documentation

Remove temporary status files and verification scripts used during
trail redesign implementation. All information preserved in git history.

Files removed:
- IMPLEMENTATION_STATUS.md
- PHASE2_COMPLETE.md
- REDESIGN_COMPLETE.md
- TEST_PLAN.md
- verify-redesign.mjs
- unlock-nodes-test.sql

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
**Source:** Based on [Atlassian Git Clean Tutorial](https://www.atlassian.com/git/tutorials/undoing-changes/git-clean) and [DataCamp Git Clean Guide](https://www.datacamp.com/tutorial/git-clean)

### Anti-Patterns to Avoid
- **One massive commit:** Makes code review impossible, loses logical separation, harder to debug if issues arise
- **git clean -f without preview:** Irreversible deletion, bypasses recycle bin, cannot recover deleted files
- **Committing after testing:** If critical bugs found, work could be lost; commit preserves work immediately
- **Testing without console open:** Miss runtime errors, warnings, and validation failures that don't crash app
- **Free-form commit messages:** Breaks automated tooling, inconsistent history, harder to generate changelogs

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Commit message formatting | Custom format | Conventional Commits spec | Enables semantic versioning, automated changelogs, CI/CD triggers |
| Selective file staging | Manual file listing | `git add -p` (patch mode) | Interactive, shows diffs, prevents accidental staging |
| Test case management | Ad-hoc testing | Systematic checklist (TEST_PLAN.md) | Ensures coverage, reproducible, tracks completion |
| Untracked file removal | Manual deletion loop | `git clean -n` + verify | Preview prevents mistakes, consistent with git workflow |
| Bug reporting | Informal notes | Structured format (steps/expected/actual/console) | Reproducible, complete information for fixing |

**Key insight:** Git's built-in interactive tools (`add -p`, `clean -n`) provide safety and control that custom scripts cannot match. Testing checklists prevent "works on my machine" syndrome by ensuring consistent execution across test runs.

## Common Pitfalls

### Pitfall 1: Creating One Giant Commit
**What goes wrong:** Staging all modified/new files at once creates a commit that's difficult to review, understand, and potentially revert if needed.

**Why it happens:** `git add -A` or `git add .` is quick but indiscriminate. For large features, this bundles unrelated changes.

**How to avoid:** Use interactive staging (`git add -p`) or stage files by logical group. Ask: "Could this commit stand alone if I needed to cherry-pick it?"

**Warning signs:** Commit message has multiple unrelated bullet points, commit diff spans 20+ files, commit touches database, UI, and documentation all at once.

### Pitfall 2: Testing Without Browser Console Open
**What goes wrong:** React errors, warnings, and validation failures may not visibly crash the app but indicate serious issues. Testing without console open misses these.

**Why it happens:** Focus on visual UI behavior, forgetting that console provides runtime diagnostics.

**How to avoid:** Make "Open DevTools (F12)" the first step of every test session. Clear console before each test case. Check for errors after each test.

**Warning signs:** User reports "it works fine" but console shows 10+ errors, PropTypes warnings about missing props, failed network requests that were silently handled.

### Pitfall 3: Deleting Files Without Git Status Check
**What goes wrong:** Running `git clean -f` or `rm -rf` without verifying git status can delete uncommitted work or files that should be staged.

**Why it happens:** Assumption that all important work is committed, overlooking modified files in working directory.

**How to avoid:** Always run `git status` before cleanup. Use `git clean -n` (dry-run) to preview. Check for modified files (M marker) vs untracked files (?? marker).

**Warning signs:** "Where did my changes go?", git status showed modified files before cleanup, panic about lost work.

### Pitfall 4: Skipping Test Cases to "Save Time"
**What goes wrong:** Incomplete testing misses integration issues, edge cases, or regressions that only appear in specific flows.

**Why it happens:** Confidence that "it should work", time pressure, or boredom with repetitive testing.

**How to avoid:** Treat test plan as mandatory checklist. Each test case validates a specific requirement. Skipping tests = incomplete validation.

**Warning signs:** "It worked when I tested it" (but didn't test all scenarios), issues discovered in production that test plan would have caught.

### Pitfall 5: Fixing Bugs Without Separate Commits
**What goes wrong:** Mixing bug fixes into the same commit as the feature makes it harder to track what was wrong and when it was fixed.

**Why it happens:** "Fix it before committing" mentality, treating bug fixes as part of feature development.

**How to avoid:** Commit feature work first (preserves state), then create separate fix commits for each discovered bug. Use `fix(scope):` prefix in commit message.

**Warning signs:** Commit message lists bugs fixed in parentheses, diff shows unrelated fixes buried in feature changes, cannot easily identify when specific bug was addressed.

### Pitfall 6: Testing on Development Server Only
**What goes wrong:** Development server has hot reload, more verbose errors, and different timing. Issues may only appear in production build.

**Why it happens:** `npm run dev` is default workflow, production build seems unnecessary for testing.

**How to avoid:** After passing all test cases on dev server, run `npm run build && npm run preview` and re-test critical paths.

**Warning signs:** "Works on dev but breaks in production", missing environment variables, build-time errors, service worker caching issues.

### Pitfall 7: Ignoring Circular Dependency Warnings
**What goes wrong:** Trail system had circular dependencies that caused runtime initialization errors. These are often hidden until specific code paths execute.

**Why it happens:** Importing constants/utilities back and forth between modules without checking dependency graph.

**How to avoid:** Extract shared constants to dependency-free file (like `constants.js`). Check build output for circular dependency warnings. Use verification scripts.

**Warning signs:** `ReferenceError: Cannot access 'X' before initialization`, imports work in isolation but fail when combined, sporadic runtime errors depending on load order.

## Code Examples

Verified patterns from official sources:

### Conventional Commit Message Format
```bash
# Format: <type>(<scope>): <subject>
#
# <optional body>
#
# <optional footer>

git commit -m "$(cat <<'EOF'
feat(trail): add redesigned treble clef Units 1-3 foundation

Add shared constants file to prevent circular dependencies.
Define 8 node types for psychological variety.
Implement Units 1-3 with 26 nodes using one-note-at-a-time pedagogy.

BREAKING CHANGE: Old expandedNodes structure replaced with unit-based system.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```
**Source:** [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/)

**Common types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `refactor:` - Code restructuring without behavior change
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks (cleanup, deps, etc.)

### Interactive Staging Session
```bash
# Preview changes
git diff

# Enter interactive patch mode for a specific file
git add -p src/components/trail/TrailNodeModal.jsx

# Git shows each hunk with prompt:
# Stage this hunk [y,n,q,a,d,s,e,?]?
# y - stage this hunk
# n - do not stage this hunk
# s - split into smaller hunks
# q - quit; do not stage this or remaining hunks
# a - stage this and all remaining hunks
# ? - print help

# Stage all files in a directory
git add src/data/units/

# Check what's staged
git diff --staged

# Commit staged changes
git commit -m "feat(trail): add Unit 1-3 node definitions"
```
**Source:** [Git Interactive Staging Book](https://git-scm.com/book/en/v2/Git-Tools-Interactive-Staging)

### Safe File Cleanup Workflow
```bash
# Step 1: Check current status
git status

# Output:
# On branch feature/trail-redesign
# Untracked files:
#   IMPLEMENTATION_STATUS.md
#   PHASE2_COMPLETE.md
#   TEST_PLAN.md
#   verify-redesign.mjs

# Step 2: Preview what git clean would remove
git clean -n

# Output:
# Would remove IMPLEMENTATION_STATUS.md
# Would remove PHASE2_COMPLETE.md
# Would remove TEST_PLAN.md
# Would remove verify-redesign.mjs

# Step 3: If preview looks correct, remove manually (safer)
rm IMPLEMENTATION_STATUS.md PHASE2_COMPLETE.md TEST_PLAN.md verify-redesign.mjs

# Alternative: Use git clean with force (requires -f for safety)
# git clean -f

# Step 4: Verify
git status  # Should show "nothing to commit, working tree clean"
```
**Source:** [Git Clean Official Documentation](https://git-scm.com/docs/git-clean) and [Git Tower Tutorial](https://www.git-tower.com/learn/git/faq/remove-untracked-files-git-clean)

### React Manual Testing Pattern
```javascript
// TEST_PLAN.md Test Case Execution Pattern

// Test 3: Memory Game Auto-Start
// 1. Open browser console (F12)
// 2. Clear console
// 3. Navigate to /trail
// 4. Click node treble_1_4 "Note Pairs"
// 5. Observe modal opens
// 6. Click "Start Practice"
// 7. Check console for errors
// 8. Observe loading screen
// 9. Wait for auto-start
// 10. Verify only C4 and D4 cards appear
// 11. Complete game
// 12. Check victory screen shows stars/XP
// 13. Click "Back to Trail"
// 14. Verify node shows stars

// Console Checklist:
// ✓ No red errors
// ✓ No PropTypes warnings
// ✓ Network requests successful (200 status)
// ✓ Progress saved message logged

// If errors found:
// 1. Copy full error stack trace
// 2. Note exact steps that caused error
// 3. Screenshot if visual bug
// 4. Create bug report with all info
// 5. Create fix commit
// 6. Re-test this specific case
```
**Source:** Synthesized from [UXPin React Testing Checklist](https://www.uxpin.com/studio/blog/checklist-for-manual-testing-of-react-components/) and project TEST_PLAN.md

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single commit per feature | Interactive staging for logical commits | Git 2.0+ | Better code review, easier reverts, clearer history |
| Free-form commit messages | Conventional Commits spec | 2016-present | Automated changelogs, semantic versioning, CI/CD integration |
| Ad-hoc manual testing | Systematic test case checklists | Modern QA (2020+) | Reproducible, complete coverage, documented results |
| `git add -A` then commit | `git add -p` for selective staging | Git 1.5+ | Prevents accidental commits, creates focused commits |
| `rm -rf` for cleanup | `git clean -n` then verify | Git best practices | Safety preview, consistent with git workflow |

**Deprecated/outdated:**
- **Squashing all commits before merge:** Modern practice keeps logical commits for better history (unless repo policy requires squash merges)
- **Avoiding --no-edit with interactive rebase:** Actually, `--no-edit` is NOT valid for `git rebase` (per CLAUDE.md guidelines)
- **Testing only happy path:** Modern QA emphasizes edge cases, error states, accessibility, and cross-browser testing

## Open Questions

Things that couldn't be fully resolved:

1. **Production Build Testing**
   - What we know: `npm run build && npm run preview` creates production build
   - What's unclear: Whether service worker caching behavior differs between dev/prod in ways that affect trail navigation
   - Recommendation: Include production build test in Phase 6 verification after dev testing passes

2. **Database Migration Execution**
   - What we know: Two migrations exist (add_unit_tracking, add_delete_policies) that should be applied
   - What's unclear: Whether these have already been run on the development database
   - Recommendation: Check Supabase migration status, run if needed, document in commit message

3. **Test Coverage Gaps**
   - What we know: TEST_PLAN.md covers 10 test cases for memory game and trail navigation
   - What's unclear: Whether this covers all critical paths, especially error handling and edge cases
   - Recommendation: If time permits, add test cases for invalid states, network errors, and rapid clicking

4. **Commit Granularity**
   - What we know: 4 logical commits planned (foundation, integration, migrations, cleanup)
   - What's unclear: Whether integration commit should be split further (MemoryGame vs navigation updates)
   - Recommendation: Start with 4 commits, split integration if commit becomes too large (>15 files)

## Sources

### Primary (HIGH confidence)
- [Conventional Commits Specification 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) - Official spec for commit message format
- [Git Interactive Staging Documentation](https://git-scm.com/book/en/v2/Git-Tools-Interactive-Staging) - Official Git book on patch mode
- [Git Clean Official Documentation](https://git-scm.com/docs/git-clean) - Official reference for git clean command
- Project files: TEST_PLAN.md, IMPLEMENTATION_STATUS.md, PHASE2_COMPLETE.md - Current phase context

### Secondary (MEDIUM confidence)
- [Graphite Git Commit Best Practices](https://graphite.com/guides/git-commit-message-best-practices) - Industry guidance verified 2026
- [UXPin React Component Testing Checklist](https://www.uxpin.com/studio/blog/checklist-for-manual-testing-of-react-components/) - React-specific testing guidance
- [BrowserStack QA Best Practices 2026](https://www.browserstack.com/guide/qa-best-practices) - Modern QA methodologies
- [Atlassian Git Clean Tutorial](https://www.atlassian.com/git/tutorials/undoing-changes/git-clean) - Practical git clean guide
- [DataCamp Git Clean Guide](https://www.datacamp.com/tutorial/git-clean) - Safety-focused cleanup tutorial

### Tertiary (LOW confidence)
- WebSearch results for "git staging strategy" - General guidance, not React-specific
- WebSearch results for "React debugging production" - Requires tool-specific verification (Sentry, LogRocket)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Git and Conventional Commits are universally adopted, project already uses Vitest
- Architecture patterns: HIGH - All patterns verified with official Git documentation and established QA practices
- Common pitfalls: HIGH - Based on known issues from IMPLEMENTATION_STATUS.md (circular dependencies) and universal git/testing mistakes
- Code examples: HIGH - Direct from official Git docs, Conventional Commits spec, and project files

**Research date:** 2026-02-03
**Valid until:** 60 days (stable domain - git workflows and manual testing practices change slowly)

**Notes:**
- No new dependencies required - all tools already in project
- Phase is execution-focused (commit, test, fix, cleanup) rather than research-intensive
- TEST_PLAN.md provides complete test case definitions
- Git commit patterns follow project's existing conventions (seen in recent commits)
