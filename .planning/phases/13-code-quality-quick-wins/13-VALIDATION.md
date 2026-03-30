---
phase: 13
slug: code-quality-quick-wins
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | vite.config.js |
| **Quick run command** | `npx vitest run src/utils/noteUtils.test.js src/services/skillProgressService.test.js` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | QUAL-01 | unit | `npx vitest run src/utils/noteUtils.test.js` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | QUAL-02 | unit | `npx vitest run src/services/skillProgressService.test.js` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | QUAL-03 | smoke | `npm run build` | — | ⬜ pending |
| 13-02-01 | 02 | 1 | QUAL-04 | smoke | `npm run build` | — | ⬜ pending |
| 13-02-02 | 02 | 1 | QUAL-05 | manual | `ls supabase/migrations/` | — | ⬜ pending |
| 13-02-03 | 02 | 1 | QUAL-07 | smoke | `npm run build` (check chunk output) | — | ⬜ pending |
| 13-02-04 | 02 | 1 | XP-01 | manual | grep locale files for "points" | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/noteUtils.test.js` — stubs for QUAL-01: tests sharp notes, flat notes, lowercase input, invalid input, null input
- [ ] `src/services/skillProgressService.test.js` — stubs for QUAL-02: tests 0%, 59%, 60%, 79%, 80%, 94%, 95%, 100% thresholds

*All other requirements verified by build success, file existence checks, or grep.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-migration files deleted from supabase/migrations/ | QUAL-05 | File existence check | `ls supabase/migrations/ \| grep -E "^(DEBUG_\|TEST_\|README_)"` should return empty |
| Locale "points" → "XP" in achievements/accessories | XP-01 | String value check | `grep -i "total points" src/locales/en/common.json src/locales/he/common.json` should return empty |
| TeacherDashboard in separate chunk | QUAL-07 | Build output check | `npm run build` output should show a separate chunk for TeacherDashboard |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
