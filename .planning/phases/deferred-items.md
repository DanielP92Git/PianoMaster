# Deferred Items

Out-of-scope issues discovered during quick task 260524-l3r execution.

## Pre-existing test failure: QuickStatsGrid

**File:** `src/components/parent/QuickStatsGrid.test.jsx`

**Symptom:** 2 of 9 tests fail looking for `"2/180"` text in rendered
output. The component now renders the number `14` and the i18n key
`parentPortal.statStreak` instead of the expected string.

**Verified pre-existing:** The failure reproduces against `main` (commit
`6a30405`) when the test+component files are checked out alone — the
worktree branch is unaffected.

**Scope:** Unrelated to Unit 8 syncopation refactor. Recommend a
follow-up quick task to align the test expectation with the current
streak rendering format (likely a `t()` mock issue or a refactor that
changed the displayed metric).
