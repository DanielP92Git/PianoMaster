---
status: partial
phase: 01-refactor-rhythm-trail-pedagogical-ordering-restructure-units
source: [01-VERIFICATION.md]
started: 2026-06-02T00:36:00Z
updated: 2026-06-02T00:36:00Z
---

## Current Test

[awaiting human testing — Task 4 (supabase db push, D-13) must run BEFORE Task 5 (UAT walkthrough)]

## Tests

### 1. Apply Phase 1 v3.5 Supabase migration to production via `supabase db push` (D-13)

expected: |
Migration `supabase/migrations/20260601000001_phase1_rhythm_pedagogy.sql` applied to the
production project BEFORE the Netlify code deploy. Pre-push: confirm `supabase status`
points at the prod project ref and record `SELECT SUM(total_xp) FROM students;`. Run
`supabase db push`. Post-push verification:

- `SELECT COUNT(*) FROM student_skill_progress WHERE node_id LIKE 'rhythm_%' OR node_id LIKE 'boss_rhythm_%';` → expect 0
- `SELECT SUM(total_xp) FROM students;` → unchanged from pre-push value
- `SELECT is_free_node('rhythm_1_1');` → TRUE
- `SELECT is_free_node('rhythm_1_5');` → TRUE
- `SELECT is_free_node('boss_rhythm_1');` → TRUE
- `SELECT is_free_node('rhythm_1_6');` → FALSE
- `SELECT is_free_node('rhythm_2_1');` → FALSE

Only after all post-push checks pass: trigger Netlify deploy and confirm
`pianomaster-v12` appears in the deployed `public/sw.js`.

result: [pending]

### 2. Owner UAT walkthrough — full rhythm trail rhythm_1_1 → boss_rhythm_10 (SC-9)

expected: |
After Task 1 lands and Netlify deploy goes live, walk every rhythm node on a real
device signed in as a real student account:

- All 6 U1 free nodes complete without paywall (rhythm_1_1..5, boss_rhythm_1)
- U2+ first node (rhythm_2_1) shows paywall for non-subscribers (or passes through for paid)
- Scaffolding: 4 cards on duration intros (meet / sound / music / ready), 3 cards on rest intros (meet / music / ready — no sound, rests = silence)
- Mini-staff renders correctly per concept; 3/4 staff at rhythm*8*_; 6/8 staff at rhythm*9*_
- Speed-round (orderInUnit=5 nodes) launch the arcade renderer
- Mini-bosses (boss_rhythm_1..9) and `boss_rhythm_10` ("Rhythm Master" cumulative) complete without softlock
- Hebrew RTL: switch locale and spot-check 2–3 scaffolding nodes (e.g. rhythm_1_1, rhythm_4_1, rhythm_8_1) — Hebrew copy renders with correct nikud on Kodaly syllables; no layout clipping
- Total XP preserved: profile XP matches pre-migration value recorded in Test 1
- `/trail` UI: 10 rhythm units render with U10 as terminus; hidden syncopation unit invisible
- Non-rhythm regression spot-check: Treble Unit 1 + Bass Unit 1 progression intact

result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
