---
phase: 07
slug: key-signature-rendering-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (globals: true) |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/components/games/sight-reading-game/` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/sight-reading-game/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | RENDER-01 | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | Extends existing | ⬜ pending |
| 07-01-02 | 01 | 1 | RENDER-02 | unit | `npx vitest run src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | RENDER-03 | unit | `npx vitest run src/components/games/sight-reading-game/utils/patternBuilder.test.js` | Extends existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/games/sight-reading-game/utils/keySignatureUtils.test.js` — stubs for RENDER-02 (accidental suppression, in-key note filtering)
- [ ] Additional test cases in `patternBuilder.test.js` — covers RENDER-03 (keySignature param filters note pool)

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual regression: null keySignature renders identically to before | RENDER-03 | SVG visual comparison cannot be automated without snapshot tooling | 1. Open sight reading free-play with no key selected 2. Compare rendered staff to pre-Phase-07 screenshot 3. Verify no visual differences in note heads, stems, beams, accidentals |
| Key signature glyph correct position (between clef and time sig) | RENDER-01 | Glyph positioning is visual | 1. Select G major in free-play 2. Verify sharp glyph appears on F line between clef and time sig |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
