# Deferred Items — Phase 02 (practice-tooling)

Out-of-scope discoveries logged during plan execution (per executor Scope Boundary rule —
not fixed, only recorded).

## Plan 02-09

- **Duplicate `syllableToggle` JSON key in locale files** — `src/locales/en/common.json`
  (lines ~813 and ~826) and `src/locales/he/common.json` have two byte-identical
  `syllableToggle` objects under the rhythm-games section (label/show/hide). Harmless today
  (JSON keeps the last occurrence, and both blocks are identical), but it's dead/duplicate
  data unrelated to this plan's sight-reading review feature — out of scope for 02-09.
  Candidate for a future locale-cleanup quick task.
