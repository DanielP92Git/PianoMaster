---
phase: 7
slug: data-foundation-trailmap-refactor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | INFRA-01 | unit | `npx vitest run src/data/__tests__/constants.test.js` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | INFRA-05 | build | `npm run verify:trail` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | INFRA-04 | unit | `npx vitest run src/components/trail/__tests__/TrailMap.test.jsx` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 1 | INFRA-03 | manual | Browser: tap node with new exercise type | N/A | ⬜ pending |
| 07-03-01 | 03 | 2 | INFRA-02 | manual | Browser: tap node → Coming Soon screen | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/trail/__tests__/TrailMap.test.jsx` — stubs for INFRA-04 (data-driven tab rendering)

*Existing `constants.test.js` and `validateTrail.mjs` cover INFRA-01 and INFRA-05.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tapping trail node navigates to correct game screen | INFRA-03 | Requires router + navigation context | 1. Open trail, 2. Tap node with new exercise type, 3. Verify no blank screen |
| Coming Soon placeholder renders for unimplemented games | INFRA-02 | Visual/navigation verification | 1. Tap node with unimplemented type, 2. Verify ComingSoon screen with game name + back button |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
