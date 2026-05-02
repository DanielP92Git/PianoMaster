---
phase: 33
slug: rhythm-issues-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-03
---

# Phase 33 — Validation Strategy

> Per-phase validation contract. CONTEXT.md D-06 explicitly chose **manual UAT over automated regression tests** for this phase. Nyquist sampling is effectively NOT-APPLICABLE — the phase done-bar is "every confirmed-survivor bug is marked resolved by user during a focused replay session."

---

## Test Infrastructure

| Property               | Value                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Framework**          | Vitest (existing) — used only for any side-effect/unit tests the planner opts to add |
| **Config file**        | `vitest.config.js` (root, already configured)                                        |
| **Quick run command**  | `npx vitest run src/components/games/rhythm-games/`                                  |
| **Full suite command** | `npm run test:run`                                                                   |
| **Estimated runtime**  | ~30 seconds (existing rhythm tests only; no new tests required)                      |

---

## Sampling Rate

- **After every task commit:** No automated sampling required (D-06). For optional unit tests, run `npx vitest run <touched file>`.
- **After every plan wave:** User performs targeted manual UAT pass against the matching `33-UAT.md` entries.
- **Before `/gsd-verify-work`:** Full UAT (`33-UAT.md`) must have every confirmed-survivor entry marked `resolved-by-deploy`.
- **Max feedback latency:** Manual — bounded by user availability. Per-issue UAT entry takes ~2 min.

---

## Per-Task Verification Map

This phase uses manual UAT instead of per-task automated tests. The mapping below shows which UAT entry each plan addresses; plans MUST reference the UAT issue number in their `must_haves`.

| Plan area                                                    | Wave | CONTEXT decision      | UAT issue # (manual)           | File Exists                   | Status     |
| ------------------------------------------------------------ | ---- | --------------------- | ------------------------------ | ----------------------------- | ---------- |
| Pre-flight (validateTrail audit + 33-UAT generation)         | 0    | D-01, D-02            | —                              | ❌ W0 (UAT.md to be authored) | ⬜ pending |
| Triage UAT pass on current build                             | 1    | D-01, D-02, D-03      | 1, 2/9, 4, 7, 10, 12, 13       | ❌ W0                         | ⬜ pending |
| D-13 prewarm hook + dictation race fix                       | 2    | D-13                  | 7                              | ❌ W0                         | ⬜ pending |
| D-12 + D-08 data audit edits (rhythm units 1–8)              | 2    | D-08, D-11, D-12      | 2/9, 5, 4 (Unit 8)             | ❌ W0                         | ⬜ pending |
| D-07 rate-limit migration deploy                             | 2    | D-07                  | 6                              | ❌ W0                         | ⬜ pending |
| Stash Chunk A — ArcadeRhythmGame → tag-based generator       | 2    | D-09, D-10 (enabling) | 8, 10                          | ❌ W0                         | ⬜ pending |
| D-09 duration filter in `resolveByTags`                      | 2    | D-09                  | 8, 10                          | ❌ W0                         | ⬜ pending |
| D-10 "≥1 per declared duration" variety rule                 | 2    | D-10                  | 10                             | ❌ W0                         | ⬜ pending |
| D-14/D-15 audio buffer hardening (CONFIRMED-only)            | 2    | D-14, D-15, D-16      | 1, 4                           | ❌ W0                         | ⬜ pending |
| D-18 boss intro overlay + victory VFX (CONTINGENT on retest) | 3    | D-17, D-18, D-20      | 13                             | ❌ W0                         | ⬜ pending |
| D-19 cumulative tags on speed nodes (CONTINGENT)             | 3    | D-17, D-19, D-20      | 12                             | ❌ W0                         | ⬜ pending |
| Final UAT pass + state update                                | 4    | D-06                  | all confirmed-survivor entries | ❌ W0                         | ⬜ pending |

_Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky_

---

## Wave 0 Requirements

- [ ] `.planning/phases/33-rhythm-issues-cleanup/33-UAT.md` — researcher-authored manual UAT script (one section per Triage Table row from RESEARCH.md §1). Format:

  ```markdown
  ## Issue [N]: [summary]

  - Build under test: <commit SHA / deploy URL>
  - Steps: 1. ... 2. ... 3. ...
  - Expected: <per-current-code behavior>
  - Mark: [ ] confirmed-bug / [ ] resolved-by-deploy / [ ] cannot-reproduce
  - Notes:
  ```

- [ ] Vitest already configured — no framework install required.
- [ ] No new automated tests required (D-06 explicit).

---

## Manual-Only Verifications

| Behavior                                                  | UAT issue | Why Manual                                     | Test Instructions                                                                                                  |
| --------------------------------------------------------- | --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| First-play trim absent on quarter-intro Listen            | 1         | Audio timing perception is human-judged        | `/trail` → unit 1 → node 1_1 → tap Listen — confirm all 4 quarter clicks audible from t=0                          |
| Node 1_3 has no rests in any of 9 questions               | 2/9       | Stochastic pattern selection — needs 5x replay | `/trail` → unit 1 → node 1_3 → play through; replay 5×; assert no rest visible/audible                             |
| Eighths first-play (Unit 3 vs Unit 8 divergence)          | 4         | Verifies D-15 fork: 8_pair vs single-8         | Unit 3 → 3_1 Listen: 4 pairs hi-lo. Unit 8 → 8_1 Listen: confirm shipped behavior; flag if first eighth is clipped |
| Section/content title coherence                           | 5         | Reading comprehension judgment                 | All 8 unit files: skim node names + descriptions; compare against rename suggestions in RESEARCH.md §3             |
| Console clean after node completion                       | 6         | Browser DevTools observation                   | Open DevTools console → complete any node → no "rate limit not found" warning                                      |
| Dictation Listen plays on first click inside MIXED_LESSON | 7         | Audio race timing                              | `/trail` → unit 1 → node 1_2 → reach rhythm_dictation question → tap Listen — sound on first tap                   |
| Pulse always emits 4 quarters                             | 8         | NOT-A-BUG verification                         | `/trail` → unit 1 → node 1_1 pulse — confirm 4 beats, all quarters                                                 |
| Combined-values variety per session                       | 10        | Statistical observation across 8 patterns      | `/trail` → unit 1 → node 1_4 → MIXED_LESSON full session — assert ≥1 halves pattern AND ≥1 quarters pattern        |
| Speed Challenge variety perception                        | 12        | Subjective "feels stale?" rating               | `/trail` → unit 1 → node 1_6 — free-form 1–5 rating                                                                |
| Boss differentiation perception                           | 13        | Subjective "feels distinct?" rating            | `/trail` → unit 1 boss + unit 6 boss + unit 8 boss — free-form 1–5 rating                                          |

---

## Validation Sign-Off

- [ ] `33-UAT.md` exists with one section per Triage Table row
- [ ] Build SHA captured at top of UAT before user starts
- [ ] Every confirmed-bug entry maps to a plan in Wave 2 or 3
- [ ] User has marked every confirmed-survivor entry `resolved-by-deploy` before phase verify
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: false` (intentional — D-06 manual-only by design)

**Approval:** pending
