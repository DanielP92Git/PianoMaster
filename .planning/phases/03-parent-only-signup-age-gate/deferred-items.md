# Deferred Items — Phase 03 (parent-only-signup-age-gate)

## Pre-existing i18n parity gap (out of scope for 03-01)

**Found during:** Plan 03-01, Task 2 (EN+HE copy contract authoring), while running the
plan's full-file parity script.

**Issue:** The plan's acceptance-criteria parity script (`node -e ...` diffing all EN vs
HE key paths) reports 7 pre-existing mismatches unrelated to this plan's new keys:

- `dashboard.streak.dayLabel_many`
- `dashboard.streak.dayLabel_two`
- `gameSettings.difficulty.levels.advanced.bars_two`
- `gameSettings.difficulty.levels.beginner.bars_two`
- `gameSettings.difficulty.levels.intermediate.bars_two`
- `gameSettings.gridSize.pairs_two`
- `gameSettings.noteSelection.selectedCount_two`

These are i18next pluralization suffixes (`_two`, `_many`) used by Hebrew's dual/plural
grammar rules with no English equivalent form (English only needs `_one`/default). They
are unrelated to `src/components/dashboard`/`src/components/games/shared` files touched
by this phase and pre-date this plan — confirmed present in the phase's pre-plan base
commit (`320ffd4e`, verified via `git show 320ffd4e:src/locales/{en,he}/common.json`).

**Action taken:** Not fixed (out of scope per executor scope-boundary rule — only auto-fix
issues directly caused by the current task's changes). Verified instead that all 16
keys newly added by 03-01 Task 2 (`auth.signup.dobGate.*`, `auth.signup.ageBlock.*`,
`auth.signup.role.parent(Desc)`, `auth.signup.credentials.submitParent`,
`auth.signup.parentNameLabel`, `auth.signup.successParent`, `parentPlaceholder.*`) have
exact EN/HE parity via a scoped key-prefix diff.

**Recommendation:** A future i18n cleanup task should either add the missing Hebrew
plural-form values or confirm i18next's Hebrew plural rules don't require `_two`/`_many`
for these specific counters, then delete the unused English keys or backfill the Hebrew
plural forms as appropriate.
