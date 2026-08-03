---
phase: 3
slug: parent-only-signup-age-gate
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` §Validation Architecture. Per-task rows are
> filled by the planner once PLAN.md task IDs exist.

---

## Test Infrastructure

| Property               | Value                                                                   |
| ---------------------- | ----------------------------------------------------------------------- |
| **Framework**          | Vitest (JSDOM) + `@testing-library/react` + `@testing-library/jest-dom` |
| **Config file**        | `vitest.config.js` (repo root)                                          |
| **Quick run command**  | `npx vitest run <changed test file>`                                    |
| **Full suite command** | `npm run test:run`                                                      |
| **Estimated runtime**  | full suite ~2160+ tests (Phase 2 close baseline)                        |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed test file(s)>`
- **After every plan wave:** Run `npm run test:run` (full suite)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** quick run seconds; full suite < ~120s

> ⚠ The full-suite run will surface **intentional** failures in
> `RoleSelection.test.jsx` and `AgeGate.test.jsx` — their current assertions
> describe the exact pre-Phase-3 behavior this phase replaces. These must be
> **rewritten**, not reverted (RESEARCH Pitfall 4).

---

## Per-Task Verification Map

> Planner fills Task IDs / Plan / Wave columns. Requirement → behavior → test-type
> mapping below is locked from RESEARCH §"Phase Requirements → Test Map".

| Task ID     | Plan  | Wave | Requirement | Secure Behavior                                                       | Test Type        | Automated Command                                                                             | File Exists                           | Status     |
| ----------- | ----- | ---- | ----------- | --------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- | ---------- |
| 04-T1       | 04    | 2    | SIGNUP-01   | Neutral open-field DOB accepts valid M/D/Y, rejects invalid/future    | unit + component | `npx vitest run src/utils/ageUtils.test.js src/components/auth/AgeGate.test.jsx`              | ❌→W0 in 01 (`ageUtils.test.js`)      | ⬜ pending |
| 01-T1       | 01    | 1    | SIGNUP-01   | `isUnder18` boundary classification (18 today / 17y364d / 18y0d)      | unit             | `npx vitest run src/utils/ageUtils.test.js`                                                   | ❌→W0 created in 01                   | ⬜ pending |
| 07-T2       | 07    | 3    | SIGNUP-02   | Under-18 shows block screen, creates no account                       | component        | `npx vitest run src/components/auth/SignupForm.test.jsx`                                      | ✅ add cases (07)                     | ⬜ pending |
| 04-T1/07-T2 | 04/07 | 2/3  | SIGNUP-02   | Block screen "try again" returns to DOB entry                         | component        | `npx vitest run src/components/auth/AgeGate.test.jsx src/components/auth/SignupForm.test.jsx` | ✅ AgeBlockScreen in 04, wiring in 07 | ⬜ pending |
| 08-T2       | 08    | 3    | SIGNUP-03   | OAuth completion (no profile) blocks under-18 + signs out             | component        | `npx vitest run src/components/auth/RoleSelection.test.jsx` (rewrite)                         | ✅ rewrite (08)                       | ⬜ pending |
| 03-T1       | 03    | 1    | SIGNUP-03   | `getCurrentUser()` detects a `parents` row as "has profile"           | unit             | `npx vitest run src/services/apiAuth.test.js`                                                 | ❌→W0 created in 03                   | ⬜ pending |
| 05-T1       | 05    | 2    | SIGNUP-04   | Parent signup writes only `parents`, never `students`                 | unit             | `npx vitest run src/features/authentication/useSignup.test.js`                                | ✅ fill stubs (05)                    | ⬜ pending |
| 07-T2       | 07    | 3    | SIGNUP-05   | Privacy Policy link present → `/privacy` on registration entry screen | component        | `npx vitest run src/components/auth/SignupForm.test.jsx`                                      | ✅ add assertion (07)                 | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/utils/ageUtils.test.js` — **does not exist today**; covers new `isUnder18` sibling + boundary-date correctness (SIGNUP-01/02)
- [ ] `src/services/apiAuth.test.js` — **verify existence, create if missing**; must unit-cover `getCurrentUser()`'s 3-table branch (`parents`/`teachers`/`students`). Highest-risk single change in the phase (RESEARCH Pitfall 1) — needs direct unit coverage, not just component mocking
- [ ] `RoleSelection.test.jsx` — substantial **rewrite** (asserts replaced behavior)
- [ ] `AgeGate.test.jsx` — substantial **rewrite** (year-only dropdown being replaced)
- [ ] `useSignup.test.js` — currently 3 `it.todo()` stubs with zero real assertions; must become a real test file covering the parent-vs-teacher branch

---

## Manual-Only Verifications

| Behavior                                                    | Requirement   | Why Manual                                                       | Test Instructions                                                                                                                                                            |
| ----------------------------------------------------------- | ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EN/HE i18n key parity for all new auth strings              | SIGNUP-01..05 | No automated parity check exists anywhere in the repo (verified) | Side-by-side diff of `src/locales/en/common.json` vs `src/locales/he/common.json` for every new `auth.*` key; confirm RTL rendering of DOB gate / block / completion screens |
| Live Google OAuth round-trip (redirect → completion screen) | SIGNUP-03     | Real OAuth redirect cannot run in JSDOM                          | Manual: new Google account → forced DOB+role completion before any `parents` row; under-18 → signed out + block screen                                                       |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`ageUtils.test.js`, `apiAuth.test.js`)
- [ ] No watch-mode flags
- [ ] Feedback latency acceptable
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** approved by planner 2026-08-03 — all rows mapped to plan tasks; Wave 0 gaps (ageUtils.test.js in Plan 01, apiAuth.test.js in Plan 03) assigned; no 3 consecutive tasks without automated verify.
