---
phase: 17
slug: feedback-form-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 + @testing-library/react 16.3.0 |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/components/settings/FeedbackForm.test.jsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/settings/FeedbackForm.test.jsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | FORM-01 | unit | `npx vitest run src/components/settings/FeedbackForm.test.jsx` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | FORM-02 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | FORM-03 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | FORM-04 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-05 | 01 | 1 | FORM-05 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-06 | 01 | 1 | SPAM-03 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-07 | 01 | 1 | SPAM-05 | unit | same | ❌ W0 | ⬜ pending |
| 17-01-08 | 01 | 1 | I18N-01 | unit | same | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/settings/FeedbackForm.test.jsx` — test stubs for FORM-01 through FORM-05, SPAM-03, SPAM-05, I18N-01
- [ ] Mock for `supabase.functions.invoke` (vi.mock pattern)
- [ ] Mock for `useUser` hook returning `{ user: { id: 'test-id' } }`

*Existing infrastructure covers framework setup (Vitest + testing-library already configured).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hebrew RTL layout visual correctness | I18N-01 | CSS layout visual check | Switch language to Hebrew, verify form layout mirrors correctly |
| ParentGateMath overlay stacking | FORM-01 | Visual z-index check | Open feedback gate while another gate is active |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
