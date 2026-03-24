---
phase: 3
slug: push-notification-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/components/layout/Dashboard.test.jsx` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | PUSH-01 | unit | `npx vitest run src/services/__tests__/sendDailyPush.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | PUSH-02 | unit | `npx vitest run src/services/__tests__/sendDailyPush.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | PUSH-03 | unit | `npx vitest run src/services/__tests__/sendDailyPush.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | PUSH-04 | unit | `npx vitest run src/services/__tests__/sw.test.js` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | PUSH-05 | unit | `npx vitest run src/components/layout/Dashboard.test.jsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/layout/Dashboard.test.jsx` — covers PUSH-05 (URL param detection, auto-log, already-logged toast)
- [ ] Logic test for Edge Function priority branching — pure TypeScript function extraction for PUSH-01, PUSH-02, PUSH-03
- [ ] SW handler test is optional (browser environment mocking overhead) — recommend manual testing in DevTools

*Existing infrastructure: `vitest.config.js`, `src/test/setupTests.js`, `@testing-library/react` all present — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SW push notification actions (Android) | PUSH-04 | Requires real browser push + system notification | 1. Deploy to staging 2. Trigger cron 3. Verify actions in notification tray |
| iOS tap-to-open URL param flow | PUSH-05 | Requires iOS device in PWA standalone mode | 1. Install PWA on iOS 2. Trigger push 3. Tap notification 4. Verify dashboard prompt |
| Cron coordination (no double notification) | PUSH-03 | Requires real Supabase cron timing | 1. Set up test student 2. Trigger both crons within window 3. Verify only one notification |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
