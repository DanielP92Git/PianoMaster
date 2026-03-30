# Phase 7: Data Foundation + TrailMap Refactor - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the routing and data infrastructure required by all new game types in v2.9. This includes:
- 5 new EXERCISE_TYPES constants (RHYTHM_TAP, RHYTHM_DICTATION, ARCADE_RHYTHM, PITCH_COMPARISON, INTERVAL_ID)
- EAR_TRAINING added to NODE_CATEGORIES
- TrailNodeModal routing for each new exercise type
- TrailMap refactored to a fully data-driven tab system supporting 4+ tabs
- validateTrail.mjs extended to validate exercise type strings against EXERCISE_TYPES

No actual game components are built in this phase — only the infrastructure they plug into.

</domain>

<decisions>
## Implementation Decisions

### Ear Training Tab Identity
- **D-01:** Teal/Cyan color palette for the Ear Training tab — distinct from the purple/indigo enchanted forest theme
- **D-02:** Lucide `Ear` icon for the Ear Training tab
- **D-03:** All tabs get icons for consistency — Music note for Treble, bass clef for Bass, metronome/drum for Rhythm, ear for Ear Training
- **D-04:** Tab label is "Ear Training" (full text, not abbreviated "Ear")

### Placeholder UX for New Games
- **D-05:** Tapping a node with an unimplemented exercise type shows a friendly "Coming Soon" screen with the game name and a back-to-trail button
- **D-06:** Shared reusable `ComingSoon` component — one component that takes game name as prop, reusable for all 5 new types and any future games

### Validation Strictness
- **D-07:** Unknown exercise types cause a hard build failure (not just a warning) — consistent with how prerequisite validation already works
- **D-08:** Validation checks type string only — no exercise config schema validation in this phase (game-specific config shape can come later)

### Tab Config Data Shape
- **D-09:** Full config per tab entry: id, label, categoryKey, icon component, color palette (active/inactive), and bossPrefix pattern. Adding a tab = one array entry, zero code changes
- **D-10:** `TRAIL_TAB_CONFIGS` lives in `src/data/constants.js` alongside NODE_CATEGORIES and EXERCISE_TYPES
- **D-11:** Tab order determined by array position (no explicit order field)
- **D-12:** TrailMap unit-fetching logic becomes data-driven — loop over TRAIL_TAB_CONFIGS to fetch `getCurrentUnitForCategory` dynamically instead of hardcoded treble/bass/rhythm calls
- **D-13:** Boss nodes associated with tabs via config-driven `bossPrefix` field (e.g. `'boss_treble'`, `'boss_ear'`). No more hardcoded `id.startsWith()` filtering

### Claude's Discretion
- Specific lucide icon choices for Treble, Bass, and Rhythm tabs (as long as they're visually clear and consistent)
- Exact teal/cyan shade selection within Tailwind's color palette
- ComingSoon component layout and messaging tone (child-friendly)
- Internal refactoring approach for TrailMap (how to restructure the data flow)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Trail Data & Constants
- `src/data/constants.js` -- Current NODE_CATEGORIES and EXERCISE_TYPES definitions (the files being extended)
- `src/data/skillTrail.js` -- SKILL_NODES array, getNodesByCategory(), getBossNodes() (consumed by TrailMap)
- `src/data/nodeTypes.js` -- NODE_TYPES used by validateTrail.mjs

### Trail UI Components
- `src/components/trail/TrailMap.jsx` -- Current hardcoded TRAIL_TABS and tab rendering logic (being refactored)
- `src/components/trail/TrailNodeModal.jsx` -- Exercise type routing switch (adding 5 new cases)

### Build Validation
- `scripts/validateTrail.mjs` -- Build-time validator being extended with exercise type checking

### Design System
- `docs/DESIGN_SYSTEM.md` -- Glass card patterns, color conventions for the enchanted forest theme

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TrailNodeModal.jsx` exercise routing switch: well-structured, each case is 2 lines (navigate call). Adding 5 new cases follows exact same pattern
- `validateTrail.mjs` validation functions: modular (one function per check). New exercise type validation follows `validateNodeTypes()` pattern
- `getNodesByCategory()` / `getBossNodes()` from `skillTrail.js`: used by TrailMap, will work with new EAR_TRAINING category once added
- `getCurrentUnitForCategory()` from services: already accepts any category string

### Established Patterns
- **Trail tabs**: Currently a simple array of `{ id, label, categoryKey }` objects rendered via `.map()` with ARIA tablist/tab/tabpanel roles
- **Boss filtering**: Currently uses `id.startsWith('boss_rhythm')` pattern — will be replaced by config-driven `bossPrefix`
- **i18n**: Tab labels already use `t('tabs.${tab.id}')` pattern — new tab needs `tabs.ear_training` key
- **URL persistence**: Active tab stored in `?path=` search param — Ear Training tab will use `?path=ear_training`

### Integration Points
- `constants.js` is imported by: skillTrail.js, TrailMap.jsx, TrailNodeModal.jsx, validateTrail.mjs, skillProgressService.js
- `TrailMap.jsx` fetches data via: `getStudentProgress()`, `getCompletedNodeIds()`, `getCurrentUnitForCategory()`
- `TrailNodeModal.jsx` navigation uses `react-router` `useNavigate()` with `location.state` for trail context
- Route definitions in main router config need new routes for placeholder pages

</code_context>

<specifics>
## Specific Ideas

No specific external references or "I want it like X" moments — decisions are clear and self-contained.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-data-foundation-trailmap-refactor*
*Context gathered: 2026-03-27*
