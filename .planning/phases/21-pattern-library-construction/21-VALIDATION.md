---
phase: 21
slug: pattern-library-construction
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property               | Value                               |
| ---------------------- | ----------------------------------- |
| **Framework**          | Vitest v3                           |
| **Config file**        | `vite.config.js` (project root)     |
| **Quick run command**  | `npx vitest run src/data/patterns/` |
| **Full suite command** | `npm run test:run`                  |
| **Estimated runtime**  | ~5 seconds                          |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/data/patterns/`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID  | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command                                         | File Exists | Status     |
| -------- | ---- | ---- | ----------- | ---------- | --------------- | --------- | --------------------------------------------------------- | ----------- | ---------- |
| 21-01-01 | 01   | 1    | PAT-01      | —          | N/A             | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | ❌ W0       | ⬜ pending |
| 21-01-02 | 01   | 1    | PAT-02      | —          | N/A             | unit      | `npx vitest run src/data/patterns/rhythmPatterns.test.js` | ❌ W0       | ⬜ pending |
| 21-02-01 | 02   | 1    | PAT-01/02   | —          | N/A             | build     | `npm run build`                                           | ✅ extend   | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `src/data/patterns/` directory — does not yet exist
- [ ] `src/data/patterns/rhythmPatterns.test.js` — stubs for PAT-01 (count, helpers) and PAT-02 (tags)

_Existing test infrastructure covers everything else — no additional conftest needed._

---

## Manual-Only Verifications

| Behavior                        | Requirement | Why Manual             | Test Instructions                                                    |
| ------------------------------- | ----------- | ---------------------- | -------------------------------------------------------------------- |
| Patterns are musically coherent | PAT-01      | Music theory judgement | Review authored patterns for correct beat emphasis, rhythmic variety |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
