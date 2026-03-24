---
phase: 01
slug: signup-flow-redesign
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.1 |
| **Config file** | `vitest.config.js` (project root) |
| **Quick run command** | `npx vitest run src/components/auth/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/auth/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Behavior | Test Type | Automated Command | File Exists | Status |
|----------|-----------|-------------------|-------------|--------|
| Role selection navigates student to birth year step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 | pending |
| Role selection navigates teacher directly to credentials step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 | pending |
| Birth year under-13 navigates to parent email step | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 | pending |
| Birth year 13+ skips parent email, goes to credentials | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 | pending |
| Parent email "Skip" calls onSubmit with null | unit | `npx vitest run src/components/auth/ParentEmailStep.test.jsx` | Wave 0 | pending |
| Back button on birth-year returns to role | unit | `npx vitest run src/components/auth/SignupForm.test.jsx` | Wave 0 | pending |
| useSignup sets account_status = 'active' regardless of age | unit | `npx vitest run src/features/authentication/useSignup.test.js` | Wave 0 | pending |
| useSignup does NOT call sendParentalConsentEmail | unit | `npx vitest run src/features/authentication/useSignup.test.js` | Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/auth/SignupForm.test.jsx` — stubs for step navigation (student + teacher paths, back navigation)
- [ ] `src/components/auth/ParentEmailStep.test.jsx` — stubs for skip button behavior
- [ ] `src/features/authentication/useSignup.test.js` — stubs for account_status and consent removal

*(No existing auth component tests found in the codebase. All three test files are new.)*

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Step dots visually update on role change | Visual rendering | 1. Open signup, 2. Observe 4 dots, 3. Select teacher, 4. Verify 2 dots |
| Glass card styling matches design system | Visual rendering | Compare against `docs/DESIGN_SYSTEM.md` patterns |
| Supabase migration activates suspended accounts | DB state change | Run migration, query `SELECT count(*) FROM students WHERE account_status = 'suspended_consent'` — expect 0 |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
