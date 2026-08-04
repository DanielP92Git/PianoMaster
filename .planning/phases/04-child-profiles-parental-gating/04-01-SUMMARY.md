---
phase: 04-child-profiles-parental-gating
plan: 01
subsystem: i18n
tags: [i18n, locales, copy-contract, parental-gate]
requirements-completed: [PROFILE-03]
dependency-graph:
  requires: []
  provides:
    - "switcher.* EN+HE i18n namespace (Who's Playing switcher copy)"
    - "children.* EN+HE i18n namespace (Add/Manage Children, form copy)"
    - "dataRights.* EN+HE i18n namespace (review/export/deactivate/reactivate/delete)"
    - "parentGate.* EN+HE i18n namespace (generalized 4-surface parental gate copy)"
    - "common.errorRetryAskParent EN+HE key"
    - "src/locales/__tests__/phase4-parity.test.js EN<->HE parity gate"
  affects:
    - "src/locales/en/common.json"
    - "src/locales/he/common.json"
tech-stack:
  added: []
  patterns:
    - "New Phase-4 top-level i18n namespaces added as siblings to existing top-level keys, not nested inside pages"
    - "Old pages.settings.notifications.parentGate block left untouched (three consumers still read it until Plan 05 repoints ParentGateMath)"
key-files:
  created:
    - src/locales/__tests__/phase4-parity.test.js
  modified:
    - src/locales/en/common.json
    - src/locales/he/common.json
decisions:
  - "errorRetryAskParent placed inside the existing top-level `common` bucket (not JSON root) since that bucket already exists and holds other generic/shared strings"
  - "Parity test follows the sight-reading-parity.test.js / scaffolding-card-parity.test.js precedent (recursive key-path Set comparison, values ignored) rather than inventing a new pattern"
metrics:
  duration: "~4 min (2 task commits)"
  completed: 2026-08-04
---

# Phase 04 Plan 01: Phase-4 i18n Copy Contract Summary

Authored every new EN + HE i18n string Phase 4 (child profiles + parental gating) needs, in one shared-file plan, so all ten downstream UI plans in this phase only ever call `t("...")` and never touch a locale file directly.

## What Was Built

- **Task 1** — Added four new top-level namespaces (`switcher`, `children`, `dataRights`, `parentGate`) to `src/locales/en/common.json`, verbatim from the 04-UI-SPEC.md Copywriting Contract, plus `common.errorRetryAskParent` (kid-safe error copy for the unsupervised-child-facing switcher). The pre-existing nested `pages.settings.notifications.parentGate` block was left untouched per D-06 (three other consumers still read the old path; Plan 05 repoints `ParentGateMath` to the new generalized namespace).
- **Task 2** — Mirrored the identical key tree into `src/locales/he/common.json` with Hebrew copy (RTL-safe plain strings, double-brace `{{nickname}}` interpolation preserved verbatim), then authored `src/locales/__tests__/phase4-parity.test.js` — a Vitest suite asserting recursive EN<->HE key-set parity for the four new namespaces plus targeted assertions (interpolation present in delete/deactivate confirm strings, nickname warning non-empty, old notification-scoped parentGate block unchanged in both locales).

## Verification

- `node -e` EN namespace/key check: prints `EN OK`.
- `npx vitest run src/locales/__tests__/phase4-parity.test.js`: 8/8 tests green.
- Grep confirms both the old (`pages.settings.notifications.parentGate`, line 477) and new (`parentGate`, line 2335) blocks exist side-by-side in `en/common.json`.
- No unexpected file deletions in either task commit (`git diff --diff-filter=D` empty across both commits).

## Deviations from Plan

None — plan executed exactly as written. Both tasks matched their acceptance criteria on the first pass.

## Commits

| Task | Commit     | Files                                                                       |
| ---- | ---------- | --------------------------------------------------------------------------- |
| 1    | `044f65eb` | `src/locales/en/common.json`                                                |
| 2    | `4648811c` | `src/locales/he/common.json`, `src/locales/__tests__/phase4-parity.test.js` |

## Known Stubs

None. This plan is pure copy/data — no UI wiring or stubbed data flows.

## Threat Flags

None. The plan's own `<threat_model>` already covers the only new surface (kid-facing error copy, i18n interpolation) — both threats were mitigated/accepted as designed (T-04-01-01 kid-safe error phrasing, T-04-01-02 accepted since `{{nickname}}` is parent-entered data already exposed to the same RLS session).

## Self-Check: PASSED

- FOUND: src/locales/**tests**/phase4-parity.test.js
- FOUND: .planning/phases/04-child-profiles-parental-gating/04-01-SUMMARY.md
- FOUND: commit 044f65eb
- FOUND: commit 4648811c
