---
phase: 12
slug: trail-config-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (project-installed) |
| **Config file** | `vite.config.js` (vitest config co-located) |
| **Quick run command** | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run verify:trail` passes
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| *Populated after planning* | | | | | | | |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/games/rhythm-games/RhythmPatternGenerator.test.js` — covers TCFG-01 (getPattern with allowedPatterns arg). Verify existence before creating.
- [ ] `src/data/units/rhythmUnits.difficulty.test.js` — covers TCFG-02 + D-06 regression test

*Existing tests that need updating (not Wave 0 — update in place):*
- `src/data/units/rhythmUnit7Redesigned.test.js` — stale D-12 assertions (TCFG-03)
- `src/data/units/rhythmUnit8Redesigned.test.js` — stale D-12 assertions (TCFG-03)

---

## Per-Requirement Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| TCFG-01 | getPattern passes allowedPatterns constraint | unit | `npx vitest run src/components/games/rhythm-games/RhythmPatternGenerator.test.js` | No — Wave 0 |
| TCFG-02 | Rhythm unit configs use valid difficulty values | unit | `npx vitest run src/data/units/rhythmUnits.difficulty.test.js` | No — Wave 0 (D-06) |
| TCFG-03 | Unit 7/8 tests assert D-12 distribution | unit | `npx vitest run src/data/units/rhythmUnit7Redesigned.test.js src/data/units/rhythmUnit8Redesigned.test.js` | Yes (stale) |
| TCFG-02 + D-07 | Build validator rejects invalid difficulty values | integration | `npm run verify:trail` | Yes (enhancement needed) |

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
