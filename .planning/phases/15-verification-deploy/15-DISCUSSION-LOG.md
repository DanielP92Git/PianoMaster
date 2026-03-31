# Phase 15: Verification & Deploy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 15-verification-deploy
**Areas discussed:** Daily Goals Audit, Deploy Sequencing Doc, UAT Verification Process

---

## Daily Goals Audit

| Option             | Description                                                                                                    | Selected |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | -------- |
| Verify + add tests | Read code, confirm all 5 goal types work with all 11 exercise types, write unit tests. Fix only if bugs found. | ✓        |
| Code review only   | Read code, document findings, flag gaps -- no tests or code changes                                            |          |
| Fix + test         | Assume bugs exist, fix and add tests. More aggressive.                                                         |          |

**User's choice:** Verify + add tests
**Notes:** None

### Follow-up: Test creation if no bugs found

| Option                | Description                                                                      | Selected |
| --------------------- | -------------------------------------------------------------------------------- | -------- |
| Yes, always add tests | Regression tests prove service handles all game types. Prevents future breakage. | ✓        |
| Only if bugs found    | Skip tests if everything works. Keep phase lightweight.                          |          |

**User's choice:** Yes, always add tests
**Notes:** None

---

## Deploy Sequencing Doc

### Location

| Option            | Description                                                                 | Selected |
| ----------------- | --------------------------------------------------------------------------- | -------- |
| docs/ folder      | Alongside DESIGN_SYSTEM.md and SECURITY_GUIDELINES.md. Visible, persistent. | ✓        |
| .planning/ folder | With planning artifacts. Less discoverable.                                 |          |

**User's choice:** docs/ folder
**Notes:** None

### Content scope

| Option                | Description                                                 | Selected |
| --------------------- | ----------------------------------------------------------- | -------- |
| Deploy order          | Step-by-step: Supabase migration first, then Netlify deploy | ✓        |
| Rollback steps        | What to do if deploy goes wrong                             | ✓        |
| Environment variables | List of required env var names                              | ✓        |
| Edge Function deploys | How to deploy Edge Functions separately                     | ✓        |

**User's choice:** All four areas selected
**Notes:** User specified "add the Environment variables names only if its a safe practice" -- confirmed that listing names (not values) is standard practice.

---

## UAT Verification Process

### Approach

| Option                 | Description                                                                         | Selected |
| ---------------------- | ----------------------------------------------------------------------------------- | -------- |
| Guided checklist       | Claude creates step-by-step testing script. User runs on device, reports pass/fail. | ✓        |
| You test independently | User tests independently and reports results to document.                           |          |
| Skip UAT for now       | Defer to later. Focus on GOAL-01 and DEPLOY-01.                                     |          |

**User's choice:** Guided checklist
**Notes:** None

### Target devices

| Option                 | Description                                        | Selected |
| ---------------------- | -------------------------------------------------- | -------- |
| Android phone (PWA)    | Primary target -- auto-rotate, PWA cache, audio    | ✓        |
| iOS phone (Safari/PWA) | AudioContext quirks, silent switch, no auto-rotate | ✓        |
| Desktop browser        | Chrome/Firefox -- rhythm games and piano tone      | ✓        |

**User's choice:** All three devices
**Notes:** None

### Failure handling

| Option         | Description                                       | Selected |
| -------------- | ------------------------------------------------- | -------- |
| Document + fix | Fix failures within this phase. Keeps v3.0 clean. | ✓        |
| Document only  | Record pass/fail. Fixes go to future phase.       |          |

**User's choice:** Document + fix
**Notes:** None

---

## Claude's Discretion

- Test file naming and structure for daily goals tests
- Deploy doc formatting (sections, tables, etc.)
- UAT checklist formatting and device grouping

## Deferred Ideas

None -- discussion stayed within phase scope
