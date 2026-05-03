---
phase: 33
type: manual_uat
build_sha: 0546a82
created: 2026-05-03
---

# Phase 33 — Manual UAT

> Per CONTEXT.md D-02: user plays through current build and marks each issue
> confirmed-bug / resolved-by-deploy / cannot-reproduce. Fixes only target confirmed-bug entries.

**Build under test:** 0546a82 (record deploy URL when applicable)
**Pre-flight audit (Task 1 of 33-01-PLAN):**

- npm run verify:trail: PASS (exit 0; non-blocking warnings only — XP variance 10.4% Rhythm vs Bass; 20 low-variety rhythm nodes flagged as missing multi-angle games)
- boss_rhythm_6.measureCount: 4 (confirmed — rhythmUnit6Redesigned.js:336)
- boss_rhythm_8.measureCount: 4 (confirmed — rhythmUnit8Redesigned.js:336)
- validateTrail.mjs invokes resolveByTags per node: yes (validateDurationSafety() at lines 521–547 iterates every node with rhythmConfig.patternTags + rhythmConfig.durations and calls resolveByTags([tag], durations, {timeSignature, allowRests:true}); a null return is a hard error — RESEARCH Open Question 2 closed)
- Validator run timestamp (UTC): 2026-05-03T16:38:04Z

---

## Issue 1: First-play trim on node 1_1 quarter-intro Listen

- Build under test: 0546a82
- Steps:
  1. Sign in as student
  2. Navigate to /trail
  3. Open unit 1 → node 1_1 ("Meet Quarter Notes")
  4. Tap "Listen" button on the discovery_intro question (FIRST tap of the session)
  5. Listen carefully — count audible quarter-note clicks
- Expected (per current code, RESEARCH §4): All 4 quarter notes audible from t=0; no clipping; no missing first note. (May still reproduce — fix candidate for D-13/D-14.)
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes:

## Issue 2/9: Node 1_3 still uses unlearned rests

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → node 1_3 ("Meet Half Notes")
  2. Play through ALL questions (visual_recognition, syllable_matching, rhythm_tap, etc.) — do NOT skip
  3. Replay the node 5 times total (stochastic pattern selection)
  4. Watch for any rest symbol on staff or any silent-beat in audio
- Expected (per current code, RESEARCH §3 Unit 1 + §1 Issue 2): No rest symbol shown, no silent beat; only quarter and half notes appear. `patternNeedsRests` filter should have already removed rest-bearing patterns.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes:

## Issue 4: Eighths discovery first-play (Unit 3 node 3_1 vs Unit 8 node 8_1)

- Build under test: 0546a82
- Steps:
  1. /trail → unit 3 → node 3_1 ("Meet Eighth Notes") → tap Listen on discovery_intro
  2. Listen — count beamed eighth-note PAIRS, note pitch alternation (high/low)
  3. /trail → unit 8 → node 8_1 ("Off-Beat Surprise") → tap Listen on discovery_intro
  4. Compare: 8_1 plays 4 plain eighth notes (NOT pairs, NOT pitch-alternating) per RESEARCH §3 Unit 8
- Expected (per current code, RESEARCH §1 Issue 4 + §3): 3_1 = 4 pairs of beamed eighths with hi-lo pitch alternation. 8_1 = 4 plain single eighths (research flags this as a potential drift; user judges whether it's a bug).
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes (specify which node, 3_1 or 8_1, has the issue):

## Issue 5: Section/content title mismatches across all 8 units

- Build under test: 0546a82
- Steps:
  1. /trail — open each of the 8 rhythm units
  2. Read each node's name + description; play 1-2 questions from each
  3. Specifically check rename suggestions from RESEARCH §3:
     - rhythm_2_3 "Long and Short" → may need "Mix Long and Short"
     - rhythm_4_6 "Speed Silence" → may need "Fast Notes and Rests"
     - rhythm_6_4 "Fast and Faster" → name promises tempo contrast; content is duration variety
     - rhythm_8_1 "Off-Beat Surprise" → discovery_intro plays plain eighths, not off-beats
- Expected (per CONTEXT D-11): User approves or rejects each rename proposal.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes (per node):

## Issue 6: Console 404 + rate-limit warning

- Build under test: 0546a82
- Steps:
  1. Open browser DevTools console
  2. /trail → complete any node (any unit, any node)
  3. Watch console output during and after node completion
- Expected (per current code, RESEARCH §7): "Rate limit function not found in database. Allowing request. Run migration 20260201000002_add_rate_limiting.sql to enable rate limiting." warning appears. CONFIRMED-BUG by code review — fix is D-07 migration deploy.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes:

## Issue 7: Dictation Listen fails on first click inside MixedLessonGame

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → node 1_2 ("Practice Quarter Notes")
  2. Advance through MixedLessonGame questions until reaching a rhythm_dictation question
  3. Tap "Listen" — FIRST tap, carefully time observation
  4. If sound plays on first tap: resolved. If silent on first tap, sound on Replay/second tap: confirmed-bug.
- Expected (per current code, RESEARCH §4 Issue 7): Sound plays on first tap. Race in `gainNodeRef` setup may cause silent first tap inside MixedLessonGame mount. Fix is D-13 shared prewarm hook.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes:

## Issue 8: Pulse game in quarter-only node generates halves

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → node 1_1 → MixedLessonGame → reach the "pulse" question
  2. Watch the pulse circles — count the beats; confirm all 4 beats are quarter-equal (no double-length stretched indicators)
  3. CRITICAL: User MUST distinguish pulse-game (4 expanding circles, no notation) vs rhythm_tap (notation + tap)
- Expected (per current code, RESEARCH §1 Issue 8): NOT-A-BUG. PulseQuestion uses hardcoded PULSE_BEATS (4 quarters). User likely confused pulse with rhythm_tap. If user actually saw halves in PulseQuestion specifically, escalate. If in rhythm_tap, that's Issue 10 territory + ArcadeRhythmGame OLD getPattern path.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes (specify game type seen — pulse circles or tap notation):

## Issue 10: Combined-values nodes not shuffling all expected durations

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → node 1_4 ("Practice Quarters and Halves")
  2. Play full session (8 patterns)
  3. Track: did at least 1 pattern contain a HALF note? At least 1 contain only QUARTERS?
  4. Replay 3x to assess statistically
- Expected (per current code + D-10): At least 1 halves-pattern AND at least 1 quarters-pattern per session. Phase 32 D-02 no-consecutive rule active. May still reproduce as bug if ArcadeRhythmGame path is hit (OLD getPattern); MIXED_LESSON path uses resolveByTags which is broader.
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes:

## Issue 11: Rhythm pattern node feels same as practice — DROPPED PER CONTEXT D-04

Phase 32 D-11 already removed all 6 Mix-Up nodes. Issue is structurally resolved. No UAT step.

## Issue 12: Speed Challenge variety perception

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → node 1_6 ("Speed Challenge")
  2. Play full 8-pattern session
  3. Subjective rating (1=very stale, 5=fresh): **\_**
  4. Specifically note: did patterns feel repetitive, or did the no-consecutive rule feel sufficient? (D-05 dropped the "10 exercises too long" subclaim — TOTAL_PATTERNS already 8.)
- Expected (per RESEARCH §6 D-19 trigger): At U1 there is intrinsic pool ceiling (≤7 distinct binaries with quarter+half tags); some repetition unavoidable. If user rates ≤2 AND replays rhythm_3_6 (Unit 3) AND rates that ≤2 too, fire D-19 (cumulative tags on speed nodes — depends on Stash Chunk A salvage in Plan 33-06).
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes (rating + free-form):

## Issue 13: Boss differentiation perception

- Build under test: 0546a82
- Steps:
  1. /trail → unit 1 → boss_rhythm_1 (MINI_BOSS) — play full session
  2. /trail → unit 6 → boss_rhythm_6 (full BOSS) — play full session
  3. /trail → unit 8 → boss_rhythm_8 (full BOSS) — play full session
  4. Subjective rating (1=just like practice, 5=feels like a boss fight): **\_**
  5. Trigger phrasing to capture (per RESEARCH §6 D-18 triggers):
     - "It still feels like just another lesson"
     - "Even my child didn't notice it was a boss"
     - "I want it to feel like a boss"
- Expected (per Phase 32 verification, RESEARCH §5): Boss timing tier strict (BOSS removed from EASY_NODE_TYPES), 4-bar patterns, dictation-heavy Q-mix, cumulative duration set. Content levers shipped. User-felt flatness gates D-18 (boss intro overlay + victory VFX in Plan 33-08).
- Mark: [ ] confirmed-bug · [ ] resolved-by-deploy · [ ] cannot-reproduce
- Notes (rating + which boss[es] felt flat):

---

## Sign-off

- [ ] All 10 active issue sections marked
- [ ] Issue 11 acknowledged as DROPPED-PER-CONTEXT (no action)
- [ ] User's confirmed-bug subset feeds Wave 2 plan triggering (33-03 unconditional, 33-04/05 unconditional, 33-06 unconditional, 33-07 contingent on Issue 1 OR 4 confirmed-bug, 33-08 contingent on Issue 13 confirmed-bug, 33-09 contingent on Issue 12 confirmed-bug)
