---
status: diagnosed
phase: 32-game-design-differentiation
source: [32-01-SUMMARY.md, 32-02-SUMMARY.md, 32-03-SUMMARY.md]
started: 2026-04-21T12:00:00Z
updated: 2026-04-21T12:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Speed Challenge Session Length

expected: Start a Speed Challenge from any rhythm trail node. The session ends after exactly 8 patterns (not the old 10). Count as you play — game completes at 8.
result: pass

### 2. Speed Challenge Pattern Variety

expected: During a Speed Challenge session, consecutive patterns should never be identical. Each new pattern should differ from the one immediately before it.
result: issue
reported: "all patterns are still only quarters"
severity: major

### 3. Rhythm Trail Units Show 6 Nodes (Units 1-3)

expected: Open the Trail Map and scroll to Rhythm Units 1, 2, and 3. Each unit should show 6 nodes: Discovery → Practice → Discovery → Practice → Speed Round → Boss. There should be no "Mix-Up" node between Practice and Speed Round.
result: pass

### 4. Rhythm Trail Units Show 6 Nodes (Units 6-8)

expected: Scroll to Rhythm Units 6, 7, and 8 on the Trail Map. Same as above — 6 nodes per unit with no Mix-Up node. Units 4 and 5 still have 7 nodes (they were not changed).
result: issue
reported: "unit 7 shows 5 nodes"
severity: major

### 5. Boss Node Pattern Pool (Cumulative)

expected: Play a later boss node (e.g., boss_rhythm_5 or boss_rhythm_6). Patterns should draw from a wide pool covering multiple earlier units — you should see a variety of rhythm durations (quarter, half, eighth, etc.) rather than only the current unit's note types.
result: blocked
blocked_by: prior-phase
reason: "Later boss nodes are locked"

### 6. Full Boss Nodes Use 4-Bar Patterns

expected: Play boss_rhythm_6 or boss_rhythm_8 (the full BOSS nodes). Reading and dictation questions should display 4-bar patterns (4 measures shown on screen), not the standard 1-bar.
result: blocked
blocked_by: prior-phase
reason: "Later boss nodes are locked"

### 7. Boss Nodes Have Dictation-Heavy Question Mix

expected: Play a full boss node (boss_rhythm_6 or boss_rhythm_8). The question types should be weighted toward reading and dictation exercises, with fewer tap exercises. Expect roughly 5 reading + 5 dictation + 2 tap in a 12-question session.
result: blocked
blocked_by: prior-phase
reason: "Later boss nodes are locked"

### 8. Mini-Boss vs Boss Timing Strictness

expected: Play a mini-boss node (e.g., boss_rhythm_1 through boss_rhythm_5 or boss_rhythm_7) — timing should be forgiving. Then play a full boss node (boss_rhythm_6 or boss_rhythm_8) — timing should be noticeably stricter.
result: blocked
blocked_by: prior-phase
reason: "Later boss nodes are locked"

## Summary

total: 8
passed: 3
issues: 2
pending: 0
skipped: 0
blocked: 4

## Gaps

- truth: "Consecutive patterns should differ from each other during Speed Challenge"
  status: failed
  reason: "User reported: all patterns are still only quarters"
  severity: major
  test: 2
  root_cause: "INTERMEDIATE difficulty in GENERATION_RULES (RhythmPatternGenerator.js:89-92) has allowedSubdivisions [QUARTER, EIGHTH, DOTTED_QUARTER] but is missing HALF. When a Speed Round node specifies durations ['q', 'h'] with difficulty 'intermediate', the intersection at line 713 yields only [QUARTER] — so all generated patterns use quarter notes exclusively."
  artifacts:
  - path: "src/components/games/rhythm-games/RhythmPatternGenerator.js"
    issue: "INTERMEDIATE allowedSubdivisions missing DURATION_CONSTANTS.HALF (lines 89-92)"
  - path: "src/components/games/rhythm-games/RhythmPatternGenerator.js"
    issue: "Intersection logic at line 713 filters out half notes since they're not in INTERMEDIATE rules"
    missing:
  - "Add DURATION_CONSTANTS.HALF to INTERMEDIATE allowedSubdivisions array"
    debug_session: ""

- truth: "Rhythm Unit 7 should show 6 nodes on the trail map"
  status: failed
  reason: "User reported: unit 7 shows 5 nodes"
  severity: major
  test: 4
  root_cause: "boss_rhythm_7 has isBoss: false (rhythmUnit7Redesigned.js:374) AND category: 'boss' (line 324). TrailMap gets rhythm nodes via getNodesByCategory('rhythm') which excludes category:'boss' nodes, then merges getBossNodes() which filters by isBoss===true (skillTrail.js:463). boss_rhythm_7 falls through both filters and is invisible. Other rhythm mini-bosses (Units 1-6) have isBoss: true so they appear correctly."
  artifacts:
  - path: "src/data/units/rhythmUnit7Redesigned.js"
    issue: "boss_rhythm_7 has isBoss: false (line 374) — should be true like all other rhythm boss nodes"
  - path: "src/data/skillTrail.js"
    issue: "getBossNodes() at line 463 filters by isBoss===true, excluding boss_rhythm_7"
    missing:
  - "Set isBoss: true on boss_rhythm_7 in rhythmUnit7Redesigned.js"
    debug_session: ""
