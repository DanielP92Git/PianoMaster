---
phase: 01
slug: refactor-rhythm-trail-pedagogical-ordering-restructure-units
status: verified
threats_open: 0
asvs_level: 1
created: 2026-06-29
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Phase 1 v3.5 — Rhythm trail pedagogical reordering + unit restructure. Threat surface
> is concentrated in the Supabase migration (Plan 04) and its production deploy (Plan 10);
> Plans 05–09 are pure client-side data restructure with no security surface.

---

## Trust Boundaries

| Boundary                    | Description                                                                                                            | Data Crossing                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| build-time → runtime        | Trail validator rules block production builds; a buggy rule can silently allow regressions OR falsely fail.            | Node classification (free/paid), trail integrity |
| migration → production DB   | `supabase db push` applies scoped DELETE + `is_free_node()` body swap to live data. Predicate error = wrong-data wipe. | Student skill progress, free-node whitelist      |
| code ↔ DB (paywall)        | `is_free_node()` is ground-truth paywall; JS `FREE_NODE_IDS` Set is UX hint. Drift = security/UX issue.                | Subscription gate decisions                      |
| code deploy ordering (D-13) | Migration must precede Netlify deploy; reversed order = transient schema/code race.                                    | Active session writes                            |
| i18n locale data            | EN/HE translation strings; missing HE key renders EN fallback.                                                         | Display text only (no trust crossing)            |

---

## Threat Register

| Threat ID | Category               | Component                                                                               | Disposition | Mitigation                                                                                                                                                                                     | Status |
| --------- | ---------------------- | --------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T-01-01   | Tampering              | Validator rule could misclassify a paid node as free if `CONCEPT_FAMILIES` map is wrong | mitigate    | Sibling unit test exercises positive + negative fixture nodes per rule; validator is build-time only (SUMMARY 01)                                                                              | closed |
| T-01-02   | Repudiation            | Parity test could pass vacuously before keys exist                                      | accept      | Documented in test code: parity intentionally passes on empty `game.discovery.cards` tree (Wave 0 gate)                                                                                        | closed |
| T-02-01   | Tampering              | Incomplete rename leaves `rhythm_8_*` colliding with new U8 (3/4 Meter)                 | mitigate    | Synco unit renamed to `rhythm_synco_*` (19 refs; only residual `rhythm_8_` is a doc comment); `validateTrail.mjs` confirms 0 duplicate IDs                                                     | closed |
| T-02-02   | Information Disclosure | Translation orphans could surface hidden-unit names if re-enabled                       | accept      | Hidden-unit keys renamed but content preserved; only the re-enable path activates them                                                                                                         | closed |
| T-03-01   | Tampering              | Hand-authored Hebrew nikud could corrupt user-confirmed Kodaly syllables                | mitigate    | `game.discovery.syllableOverride.*` untouched; nikud verified byte-identical via diff (SUMMARY 03)                                                                                             | closed |
| T-03-02   | Information Disclosure | Missing HE key renders EN fallback                                                      | mitigate    | scaffolding-card-parity test green and load-bearing (SUMMARY 03)                                                                                                                               | closed |
| T-04-01   | Tampering              | Migration wipes non-rhythm rows by accident                                             | mitigate    | Scoped `DELETE ... WHERE node_id LIKE 'rhythm_%' OR LIKE 'boss_rhythm_%'`; wrapped in BEGIN/COMMIT; pre/post-flight COUNT. UAT Test 1: only rhythm/boss_rhythm rows = 0, no other data touched | closed |
| T-04-02   | Elevation of Privilege | `is_free_node()` rewrite makes a paid node free                                         | mitigate    | `freeNodes.parity.test.js` enforces JS Set === SQL whitelist. UAT Test 1: `is_free_node` TRUE for rhythm_1_1/1_5/boss_rhythm_1, FALSE for rhythm_1_6/rhythm_2_1                                | closed |
| T-04-03   | Tampering              | Migration touches `students.total_xp`                                                   | mitigate    | 0 writes to `students`/`students_score` (only READ-ONLY `SELECT SUM(total_xp)` in DO blocks). UAT Test 1: total_xp = 72607 unchanged across migration                                          | closed |
| T-04-04   | Repudiation            | Migration runs without forensic logging                                                 | mitigate    | DO-block RAISE NOTICE pre/post-flight logs row counts + total_xp invariant; RAISE EXCEPTION trip-wire if rhythm rows survive                                                                   | closed |
| T-10-01   | Tampering              | Migration applied to wrong Supabase project                                             | mitigate    | [BLOCKING] owner checkpoint confirms project ref before push. UAT Test 1: applied to prod, all 7 post-push checks passed                                                                       | closed |
| T-10-02   | Information Disclosure | SW cache serves stale paywall config after deploy                                       | mitigate    | SW cache bumped to v12. UAT Test 1: `pianomaster-v12` confirmed live at /sw.js                                                                                                                 | closed |
| T-10-03   | Tampering              | Deleting OLD `rhythmUnit*Redesigned.js` while still imported                            | mitigate    | Pre-deletion grep confirms ZERO active imports of `rhythmUnit[1-7]Redesigned`                                                                                                                  | closed |

_Status: open · closed_
_Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)_

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale                                                                                                                                                                                           | Accepted By        | Date       |
| ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ---------- |
| AR-01   | T-01-02    | Parity test passes vacuously on an empty `game.discovery.cards` tree during Wave 0; this is the intended gate-establishment behavior — Wave 2 populates the tree and the gate becomes load-bearing. | Plan author (D-10) | 2026-06-02 |
| AR-02   | T-02-02    | Hidden syncopation unit translation keys are renamed but content preserved; surfacing requires the deliberate re-enable path (HIDDEN-V1 uncomment). No runtime exposure in shipped build.           | Plan author (D-10) | 2026-06-02 |

_Accepted risks do not resurface in future audit runs._

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By                                                        |
| ---------- | ------------- | ------ | ---- | ------------------------------------------------------------- |
| 2026-06-29 | 13            | 13     | 0    | /gsd-secure-phase (Claude, artifact + UAT cross-verification) |

Notes: Threats verified from PLAN `<threat_model>` registers + SUMMARY threat-surface scans, cross-confirmed against the shipped migration file (`20260601000001_phase1_rhythm_pedagogy.sql`), `validateTrail.mjs` output, and the runtime evidence in `01-HUMAN-UAT.md` Test 1 (production migration verification: rhythm rows = 0, total_xp = 72607 unchanged, free-node gates correct, SW v12 live). Plans 05–09 carry no security surface (data restructure only).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-29
