---
phase: 17
slug: push-notifications
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + Deno.test (Edge Function) |
| **Config file** | `vitest.config.js` (existing), inline Deno test for Edge Function |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | TBD | TBD | NOTIF-01 | unit | `npx vitest run src/components/settings/ParentGateMath.test.jsx` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTIF-02 | unit | `npx vitest run src/services/notificationService.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTIF-03 | manual | N/A — requires real pg_cron + Edge Function | N/A | ⬜ pending |
| TBD | TBD | TBD | NOTIF-04 | unit | `npx vitest run src/utils/notificationMessages.test.js` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | NOTIF-05 | unit | `npx vitest run src/services/notificationService.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/settings/ParentGateMath.test.jsx` — math problem generation, correct/incorrect answer handling, consent callback
- [ ] `src/services/notificationService.test.js` — savePushSubscription, removePushSubscription, iOS PWA check
- [ ] `src/utils/notificationMessages.test.js` — selectNotification priority logic, variant selection, message content

*Existing vitest infrastructure covers framework needs — no new installs required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push notification delivery when app closed | NOTIF-02 | Requires real browser push subscription + service worker | 1. Enable push in Settings, 2. Close app, 3. Wait for cron trigger (or manually invoke Edge Function), 4. Verify notification appears |
| 1/day rate limit enforcement | NOTIF-03 | Requires pg_cron + Edge Function + real push endpoint | 1. Trigger Edge Function twice, 2. Verify only one notification sent per student |
| Context-aware message reflects student state | NOTIF-04 | Requires real student data + Edge Function | 1. Set student with streak > 0, 2. Trigger, 3. Verify streak message sent |
| notificationclick opens trail page | NOTIF-02 | Requires real push + service worker click handler | 1. Receive notification, 2. Click it, 3. Verify app opens to /trail |
| iOS PWA install guard | NOTIF-02 | Requires iOS device in standalone mode | 1. Open app in Safari (not installed), 2. Try to enable push, 3. Verify install prompt shown |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
