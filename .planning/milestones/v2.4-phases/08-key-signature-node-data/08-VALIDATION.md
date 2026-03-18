---
phase: 08
slug: key-signature-node-data
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npm run test:run && npm run verify:patterns` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:patterns`
- **After every plan wave:** Run `npm run test:run && npm run verify:patterns`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | TREB-01..07 | integration | `npm run verify:patterns` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 1 | BASS-01..07 | integration | `npm run verify:patterns` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

- `npm run verify:patterns` — validates trail node definitions (prerequisite chains, nodeType values, duplicate IDs, XP economy)
- `src/data/validateTrail.mjs` — existing validator script

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gold paywall overlay on locked nodes | Premium-only | Visual check | Navigate to trail as free user, verify new nodes show gold lock overlay |
| Discovery node explanation text | TREB-01 | Content review | Open first key sig node, verify "the sharp/flat symbol..." text appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
