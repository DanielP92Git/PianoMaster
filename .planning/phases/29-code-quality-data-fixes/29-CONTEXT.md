# Phase 29: Code Quality & Data Fixes - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix known bugs from v3.2 code review (stale closure, score cap, empty array guard) and correct unit data errors that cause wrong patterns or incorrect section labels. All 7 requirements (CODE-01/02/03, DATA-01/02/03/04) have specific, testable success criteria.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User reviewed all 7 requirements and confirmed they are unambiguous with clear fixes. Claude has full discretion on implementation approach for all items:

- **CODE-01:** Fix stale-closure `currentIndex` read in `handleRhythmTapComplete` (MixedLessonGame.jsx). Use ref or functional state update.
- **CODE-02:** Exclude rest tiles from `scoredRef` count in ArcadeRhythmGame score calculation. Score must not exceed 100%.
- **CODE-03:** Guard `...generated[0]` spread in MixedLessonGame when question generation returns empty array. Show error or fallback.
- **DATA-01:** Fix node `rhythm_1_3` patterns to contain only note values already introduced (no unlearned rests).
- **DATA-02:** Fix pulse game on quarter-only nodes to generate only quarter-note patterns (no half notes).
- **DATA-03:** Audit all 8 rhythm unit section titles (UNIT_NAME) and fix any that mismatch their content.
- **DATA-04:** Ensure combined-values practice nodes use all expected duration values with varied order.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Code Review Findings

- `.planning/v3.2-MILESTONE-AUDIT.md` -- tech_debt section documents CODE-01 (HR-01), CODE-02 (HR-02), CODE-03 (empty array)

### Requirements

- `.planning/REQUIREMENTS.md` -- CODE-01/02/03, DATA-01/02/03/04 definitions and acceptance criteria

### Source Files (bugs)

- `src/components/games/rhythm-games/MixedLessonGame.jsx` -- CODE-01 (handleRhythmTapComplete stale closure), CODE-03 (generated[0] spread)
- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` -- CODE-02 (scoredRef includes rest tiles)

### Source Files (data)

- `src/data/units/rhythmUnit1Redesigned.js` -- DATA-01 (node 1_3 patterns), DATA-02 (pulse quarter-only)
- `src/data/units/rhythmUnit2Redesigned.js` through `rhythmUnit8Redesigned.js` -- DATA-03 (section titles), DATA-04 (combined values)

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `handleRhythmTapComplete` callback in MixedLessonGame already uses `useCallback` with `currentIndex` in closure -- needs ref pattern
- `scoredRef` in ArcadeRhythmGame already has `isRest` check in the miss-detection branch but not in the final score tally
- Pattern generation pipeline: `generateQuestions()` -> spread result -- guard at spread site

### Established Patterns

- React refs for mutable state in game loops (ArcadeRhythmGame uses `gamePhaseRef`, `tilesRef` pattern extensively)
- Unit data files use constants (`UNIT_NAME`, `UNIT_ID`, `NODE_TYPES`, `RHYTHM_COMPLEXITY`)
- Pattern tags system (`patternTags` arrays on node configs) controls which patterns appear

### Integration Points

- MixedLessonGame serves rhythm_tap, pulse, discovery_intro, rhythm_reading, rhythm_dictation question types
- ArcadeRhythmGame score feeds into VictoryScreen via `finishPattern()` callback
- Unit data files are aggregated by `src/data/expandedNodes.js` and validated by `scripts/validateTrail.mjs`

</code_context>

<specifics>
## Specific Ideas

No specific requirements -- open to standard approaches for all fixes.

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>

---

_Phase: 29-code-quality-data-fixes_
_Context gathered: 2026-04-13_
