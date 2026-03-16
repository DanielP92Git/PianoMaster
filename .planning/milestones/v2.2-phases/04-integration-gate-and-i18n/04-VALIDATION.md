---
phase: 04
slug: integration-gate-and-i18n
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | vitest.config.js |
| **Quick run command** | `npm run verify:trail` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run verify:trail`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | INTG-01 | smoke | `npm run verify:trail` | ✅ scripts/validateTrail.mjs | ⬜ pending |
| 04-01-02 | 01 | 1 | INTG-02 | manual | n/a — UI smoke test | n/a | ⬜ pending |
| 04-02-01 | 02 | 1 | INTG-03 | unit | `npx vitest run src/**/*enharmonic*` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | I18N-01 | manual | n/a — visual verification | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Enharmonic normalization unit test — test `noteToMidi()` equality for all 5 pairs (C#=Db, D#=Eb, F#=Gb, G#=Ab, A#=Bb) — covers INTG-03

*Existing infrastructure covers INTG-01 (verify:trail) and INTG-02 (manual UI test).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Free user sees paywall for new accidentals node | INTG-02 | UI smoke test — paywall modal requires rendered DOM | 1. Log in as free user 2. Navigate to trail 3. Tap any new accidentals node 4. Confirm paywall modal appears |
| Accidental note names correct in EN and HE | I18N-01 | Visual verification of rendered text | 1. Switch lang to EN, check node names show F♯, B♭ etc. 2. Switch to HE, check names show פה דיאז, סי במול etc. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
