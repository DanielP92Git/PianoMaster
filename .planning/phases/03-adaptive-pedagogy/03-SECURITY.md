---
phase: 03
slug: adaptive-pedagogy
status: verified
threats_open: 0
asvs_level: 1
created: 2026-07-13
---

# Phase 03 — Adaptive Pedagogy — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

**Audited:** 2026-07-13
**Scope:** Plans 01–07 (adaptive engine, mastery persistence service, LevelUpCue, override-settings plumbing, tier wiring, VictoryScreen mastery threading, `note_mastery` DDL)
**ASVS Level:** 1 · **block_on:** critical

This audit verifies each declared threat mitigation against the implemented code (read-only —
no implementation files were modified during the audit pass). Evidence is grep/read-verified,
not inferred from documentation or intent. One gap found on the first pass (T-03-05) was
remediated in code and re-verified before sign-off — see the Audit Trail.

## Result: SECURED (threats_open: 0)

12 of 12 `mitigate` threats CLOSED with direct code evidence; all 4 `accept` threats' rationale
remains valid against current code. The first audit pass found T-03-05 OPEN (a post-Plan-06
code-review fix, `WR-01`, added a `note_mastery` write path — `mergeNoteMasteryOnly` — that
skipped the rate-limit gate the mitigation relied on). Owner elected to close it by code: a
non-blocking `checkRateLimit` was added to that path (2026-07-13). Re-verified CLOSED.

---

## Trust Boundaries

| Boundary                                   | Description                                                          | Data Crossing                              |
| ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| client (browser) → Postgres (Supabase)     | Read/write of per-student `note_mastery` on `student_skill_progress` | Per-pitch practice telemetry (non-PII)     |
| operator/agent → production Postgres (DDL) | `note_mastery` column + index migration                              | Schema change on children's-data table     |
| in-app code → pattern/tempo engine         | `overrideSettings`/tier deltas drive `generatePattern`               | Client-only config (no user/network input) |

---

## Threat Register

| Threat ID | Category               | Component                              | Disposition | Mitigation / Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Status |
| --------- | ---------------------- | -------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T-03-01   | Tampering              | `applyTierToSettings` tempo clamp      | mitigate    | `adaptiveEngine.js:49-53` clamps to `[BASE*0.75, BASE*1.25]` (`adaptiveTiers.js:22-23`); both extremes unit-tested (`adaptiveEngine.test.js`, 22 tests green)                                                                                                                                                                                                                                                                                                                         | closed |
| T-03-02   | DoS                    | `buildWeightedNotePool`                | accept      | Superseded by CR-01 fix — now returns a per-pitch weight map bounded to `basePool.length` (`adaptiveEngine.js:93-112`), stricter than the original 3x-duplication rationale                                                                                                                                                                                                                                                                                                           | closed |
| T-03-03   | Tampering              | client `perNoteMastery` payload        | mitigate    | `mergeMasteryDelta` (`skillProgressService.js:23-38`) rejects non-integer/negative/`correct>total` deltas before merge; shared by all write paths. RLS `student_id=auth.uid()` confirmed live (`03-07-SUMMARY.md` pg_policies check)                                                                                                                                                                                                                                                  | closed |
| T-03-04   | Elevation of Privilege | `note_mastery` column access           | mitigate    | Migration has 0 `CREATE/ALTER POLICY` (grep confirmed); `verifyStudentDataAccess` (`authorizationUtils.js:19-46`) runs first in every access point. Live RLS inheritance documented in `03-07-SUMMARY.md`                                                                                                                                                                                                                                                                             | closed |
| T-03-05   | DoS                    | mastery write bypassing rate limit     | mitigate    | **Remediated 2026-07-13.** The `mergeNoteMasteryOnly` telemetry path (`skillProgressService.js:210-254`) now calls `checkRateLimit(studentId, nodeId)` after `verifyStudentDataAccess` (`:230-234`); a rate-limited call drops silently (`return null`), sharing the same per-(student,node) 10-req/5-min bucket as the victory-path writes. Tests: `skillProgressService.test.js` "consumes the per-(student,node) rate-limit bucket" + "drops the write silently when rate limited" | closed |
| T-03-06   | Info Disclosure        | teacher SELECT of weak-note profile    | accept      | Pre-existing teacher-connected-student branch of `student_skill_progress_select_consolidated`; unchanged (`03-07-SUMMARY.md`)                                                                                                                                                                                                                                                                                                                                                         | closed |
| T-03-07   | Info Disclosure        | escalation cue copy                    | accept      | `LevelUpCue.jsx` renders only generic i18n strings (`levelUp`/`levelUpSubtitle`/`levelUpDismiss`) — no score/PII (EN+HE parity test green)                                                                                                                                                                                                                                                                                                                                            | closed |
| T-03-08   | Tampering              | `overrideSettings` → `generatePattern` | mitigate    | `overrideSettings` is in-app-only; `patternBuilder.js` validates `selectedNotes` against `validPitches`, falls back if empty, re-validates picked note (lines 244-482) — settings treated as untrusted regardless of caller                                                                                                                                                                                                                                                           | closed |
| T-03-09   | Tampering              | tier tempo/note widening               | mitigate    | Tempo clamp per T-03-01; widening bounded to node's own `noteConfig.notePool` (`SightReadingGame.jsx:510-511`), never the full clef range                                                                                                                                                                                                                                                                                                                                             | closed |
| T-03-10   | DoS                    | escalation cue setTimeout              | accept      | Mechanism removed entirely — cue now manual-dismiss (`SightReadingGame.jsx` `handleLevelUpDismiss`), no timer at all. Strict reduction of the accepted risk                                                                                                                                                                                                                                                                                                                           | closed |
| T-03-11   | Elevation of Privilege | mastery read/write for another student | mitigate    | Read (`getNodeProgress`) and write (`updateExerciseProgress`/`updateNodeProgress`, plus `mergeNoteMasteryOnly`) all gate on `verifyStudentDataAccess` + RLS; reuse pre-existing functions, no new bypass                                                                                                                                                                                                                                                                              | closed |
| T-03-12   | Tampering              | accumulated `sessionMastery` payload   | mitigate    | Same `mergeMasteryDelta` validation as T-03-03 applies to the `sessionMasteryRef` payload; RLS restricts client to own row                                                                                                                                                                                                                                                                                                                                                            | closed |
| T-03-13   | Info Disclosure        | weak-note profile in Practice mode     | mitigate    | `useVictoryState.js:359-374` early-returns before write when `suppressPersistence`; the separate `mergeNoteMasteryOnly` path independently re-checks `isPracticeMode` and skips (`SightReadingGame.jsx:993`). "Practice persists nothing" holds across both paths                                                                                                                                                                                                                     | closed |
| T-03-14   | Tampering/Destructive  | production DDL apply                   | mitigate    | `20260712120000_add_note_mastery.sql` uses `ADD COLUMN/CREATE INDEX IF NOT EXISTS` only; owner-approval checkpoint before apply (`03-07-SUMMARY.md`)                                                                                                                                                                                                                                                                                                                                  | closed |
| T-03-15   | Elevation of Privilege | new column access scope                | mitigate    | Same migration grep (0 policy statements); live `pg_policies` unchanged (4 pre-existing policies) per `03-07-SUMMARY.md`                                                                                                                                                                                                                                                                                                                                                              | closed |
| T-03-16   | Repudiation            | untracked production change            | mitigate    | Applied from committed, timestamped migration file; apply method + verification output recorded in `03-07-SUMMARY.md`                                                                                                                                                                                                                                                                                                                                                                 | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

No accepted risks. (T-03-05, initially a candidate for an accepted-risk entry, was instead
closed by adding rate limiting per owner decision on 2026-07-13.)

---

## Security Audit Trail

| Audit Date                    | Threats Total | Closed | Open        | Run By                                             |
| ----------------------------- | ------------- | ------ | ----------- | -------------------------------------------------- |
| 2026-07-13 (pass 1)           | 16            | 15     | 1 (T-03-05) | gsd-security-auditor                               |
| 2026-07-13 (pass 2, post-fix) | 16            | 16     | 0           | /gsd-secure-phase 03 (code re-verify + full suite) |

**Remediation (T-03-05):** Added a non-blocking `checkRateLimit` to `mergeNoteMasteryOnly`
(`skillProgressService.js:231-234`) — telemetry writes now share the victory-path's
per-(student,node) 10/5min bucket and drop silently when limited. Inverted the prior
"does NOT call checkRateLimit" unit test and added a rate-limited-drop test. Full run:
238/238 skill-progress + sight-reading tests pass; ESLint clean on both changed files.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log (none)
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-07-13

---

_Audited by: gsd-security-auditor · Gap T-03-05 remediated in code by /gsd-secure-phase 03 and re-verified._
