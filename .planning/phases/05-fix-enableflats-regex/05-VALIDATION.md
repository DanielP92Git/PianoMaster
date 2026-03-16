---
phase: 05
slug: fix-enableflats-regex
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.js` |
| **Quick run command** | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | FIX-01 | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | FIX-01 | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | FIX-01 | unit | `npx vitest run src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Add `'B3'` regression test to `src/components/games/notes-master-games/NotesRecognitionGame.autogrow.test.js`
- [ ] Add `'B4'` regression test to same file
- [ ] Add `enableFlats` derivation test (FULL_SHARP_POOL yields `false`)

*Existing infrastructure covers framework and config — only new test cases needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Node `bass_4_6` launches with `enableFlats=false` | FIX-01 | Requires trail navigation + game launch | Navigate to bass_4_6 on trail → open modal → start game → verify no flat notes appear |
| Auto-grow doesn't add flats for sharp nodes | FIX-01 | Requires sustained combo in running game | Play bass_4_6 → reach combo milestone → verify expanded pool has no flats |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
