---
status: diagnosed
phase: 04-integration-gate-and-i18n
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md]
started: 2026-03-16T17:00:00Z
updated: 2026-03-16T17:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. New accidental nodes visible on trail
expected: Open the trail map. Scroll past existing treble/bass Units 1-3. New sharp nodes (Meet F Sharp, Meet C Sharp, Meet G Sharp) and flat nodes (Meet B Flat, Meet E Flat, etc.) should be visible continuing the trail path. Trail now has 129 nodes total.
result: pass

### 2. Accidental nodes locked for free users
expected: As a free user (or without an active subscription), tap on any new accidental node (e.g., "Meet F Sharp"). It should show a gold lock icon or paywall overlay — these nodes are premium-only and not in the free tier.
result: pass

### 3. English skill bubble note names (Unicode symbols)
expected: Open a new accidental node's modal (e.g., "Meet F Sharp" or "Meet B Flat"). The skill bubbles showing note names should display Unicode music symbols: F♯ (not F#), B♭ (not Bb), etc.
result: issue
reported: "Description shows F# (keyboard char) not F♯ (Unicode). Also, Skills You'll Learn shows F, F#, G — should only show F# since F and G are already-learned natural notes."
severity: major

### 4. Hebrew note names in skill bubbles
expected: Switch app language to Hebrew. Open any new accidental node modal. Skill bubbles should show Hebrew music terms: e.g., "פה דיאז" for F#, "סי במול" for Bb — not English fallback text.
result: issue
reported: "The note name פה דיאז is overflowing the bubble — Hebrew two-word accidental names too long for circular skill bubbles"
severity: cosmetic

### 5. Hebrew node names on trail
expected: In Hebrew mode, the trail map should show Hebrew node names for all new accidental nodes. E.g., "הכירו את פה דיאז" instead of "Meet F Sharp", "דיאזים ביחד" instead of "Sharps Together". No English fallback keys visible.
result: pass

### 6. Hebrew boss unlock hints
expected: In Hebrew mode, view a locked boss node (e.g., "Sharp Star" / "כוכב הדיאזים"). The unlock hint text should display in Hebrew (e.g., "השלימו את כל שיעורי הדיאזים כדי לפתוח את האתגר!"), not English.
result: pass

### 7. Enharmonic mic scoring in Sight Reading
expected: Start a Sight Reading exercise from an accidental node that has flat notes in its pool (e.g., a node with Bb4 or Db4). Play the note on a real piano with mic input. The mic will detect C#4 for Db4 (sharp-form). The note should score as CORRECT — not wrong, not flagged as cheating.
result: skipped
reason: User can't test mic right now — defer to later verification

### 8. Hebrew node descriptions
expected: In Hebrew mode, open a new accidental node modal. The description text should be in Hebrew (e.g., "גלו את התו פה דיאז" for "Meet F Sharp"), not English.
result: pass

## Summary

total: 8
passed: 5
issues: 2
pending: 0
skipped: 1

## Gaps

- truth: "Skill bubbles display Unicode music symbols (F♯ not F#) and only show new skills being learned"
  status: failed
  reason: "User reported: Description shows F# (keyboard char) not F♯ (Unicode). Also, Skills You'll Learn shows F, F#, G — should only show F# since F and G are already-learned natural notes."
  severity: major
  test: 3
  root_cause: "TrailNodeModal.jsx:314 iterates node.skills (full array including context notes F4, G4) instead of node.noteConfig.focusNotes (which has only F#4). Description at line 304 falls back to node.description (raw ASCII F#) when i18n key lookup misses, instead of using the i18n entry which has Unicode F♯."
  artifacts:
    - path: "src/components/trail/TrailNodeModal.jsx"
      issue: "Line 314 uses node.skills instead of focusNotes; line 304 description fallback shows raw ASCII"
    - path: "src/data/units/trebleUnit4Redesigned.js"
      issue: "skills array has ['F4', 'F#4', 'G4'] — focusNotes has ['F#4'] but is ignored by modal"
  missing:
    - "Use node.noteConfig.focusNotes (or filter skills to only new notes) for Skills You'll Learn"
    - "Fix description fallback or update unit file descriptions to use Unicode ♯/♭"
  debug_session: ""
- truth: "Hebrew skill bubble note names display correctly without overflow"
  status: failed
  reason: "User reported: The note name פה דיאז is overflowing the bubble — Hebrew two-word accidental names too long for circular skill bubbles"
  severity: cosmetic
  test: 4
  root_cause: "TrailNodeModal.jsx:324 bubble has fixed size w-14 h-14 (56px) with text-xl font and no overflow handling. Hebrew two-word accidental names (e.g., 'פה דיאז' = 7 chars) don't fit the circle."
  artifacts:
    - path: "src/components/trail/TrailNodeModal.jsx"
      issue: "Line 324: fixed w-14 h-14 circle, text-xl font, no overflow-hidden or font scaling for long strings"
  missing:
    - "Add dynamic font scaling (text-xs for strings > 4 chars) or allow text wrapping within bubble"
  debug_session: ""
