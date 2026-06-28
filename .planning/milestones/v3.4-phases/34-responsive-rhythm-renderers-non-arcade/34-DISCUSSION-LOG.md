# Phase 34: Responsive Rhythm Renderers (Non-Arcade) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 34-Responsive Rhythm Renderers (Non-Arcade)
**Areas discussed:** needsLandscape formula, Card grid breakpoints, Wrapper audit approach, LANDSCAPE_ROUTES migration

---

## Area Selection

User selected ALL 4 identified gray areas for discussion.

| Area                       | Selected |
| -------------------------- | -------- |
| needsLandscape formula     | ✓        |
| Card grid breakpoints      | ✓        |
| Wrapper audit approach     | ✓        |
| LANDSCAPE_ROUTES migration | ✓        |

---

## needsLandscape Formula

### Q1: Formula input

| Option                             | Description                                                                                      | Selected |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Beat count                         | totalBeats = measures × beatsPerMeasure. Single number, easy to threshold, time-signature-aware. | ✓        |
| Measure count only                 | Threshold purely on number of measures. Simpler but ignores time signature.                      |          |
| Computed from VexFlow render width | Render at hidden phone-portrait viewport, measure overflow. Most accurate but expensive.         |          |
| Note count                         | Total notes in pattern. Simpler than width but ignores horizontal density.                       |          |

**User's choice:** Beat count (Recommended).

### Q2: Threshold

| Option                         | Description                                                        | Selected |
| ------------------------------ | ------------------------------------------------------------------ | -------- |
| Conservative (longer triggers) | ~12 beats; only longest patterns prompt; risk of cramped notation. |          |
| Moderate ~8 beats              | ~8 beats threshold; > 2 measures of 4/4 prompts on phone-portrait. | ✓        |
| Aggressive (shorter triggers)  | > 4 beats triggers; even short patterns go landscape.              |          |
| You decide                     | Researcher prototypes at 3 phone widths and picks.                 |          |

**User's choice:** Moderate ~8 beats (Recommended). Researcher should sanity-check exact value (8/9/10) against VexFlow output.

### Q3: Helper API shape

| Option                 | Description                                                                                      | Selected |
| ---------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| Pure function          | needsLandscape(pattern, timeSignature) => boolean in utils/. Easy to unit-test (NOTATION-03).    | ✓        |
| Custom hook            | useNeedsLandscape that internally declares. Single line in renderer but ties to React lifecycle. |          |
| Pattern-level metadata | Pre-compute at build into pattern definitions. Couples content to layout heuristic.              |          |

**User's choice:** Pure function (Recommended).

### Q4: Tablet override

| Option                                       | Description                                                                     | Selected |
| -------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Heuristic always runs, viewport gate filters | Helper stays pure and viewport-agnostic; INFRA-03 gate in overlay.              | ✓        |
| Heuristic short-circuits on tablet           | Helper accepts viewport, returns false on tablet. Bakes 768 cutoff into helper. |          |

**User's choice:** Heuristic always runs, viewport gate filters (Recommended).

---

## Card Grid Breakpoints

### Q1: Tablet-landscape layout

Note: Resolves apparent conflict between CORE-02/04 ("1×4 on wider viewports") and TABLET-01 ("real 2-col on tablet-landscape").

| Option                           | Description                                                             | Selected |
| -------------------------------- | ----------------------------------------------------------------------- | -------- |
| 2×2 grid full-width              | Full container width, comfortable gaps. Matches TABLET-01 'real 2-col'. | ✓        |
| 1×4 row full-width               | All 4 cards equal-width row. Matches CORE-02/04 literal reading.        |          |
| Mixed: dictation 2×2, others 1×4 | Dictation shares with staff.                                            |          |

**User's choice:** 2×2 grid full-width (Recommended).

### Q2: Phone-landscape layout

| Option           | Description                                          | Selected |
| ---------------- | ---------------------------------------------------- | -------- |
| 1×4 row          | Preserves vertical space on iPhone SE rotated.       | ✓        |
| 2×2 grid         | Same as portrait. Risk: card overflow at 375 height. |          |
| Auto from aspect | Tailwind landscape modifier, content-aware.          |          |

**User's choice:** 1×4 row (Recommended).

### Q3: Tablet-portrait layout

| Option                   | Description                                                | Selected |
| ------------------------ | ---------------------------------------------------------- | -------- |
| 2×2 grid                 | Bigger cards; matches portrait pattern; abundant vertical. | ✓        |
| 1×4 row                  | Narrow vertical strips at 768.                             |          |
| Same as tablet-landscape | Treat both tablet orientations identically.                |          |

**User's choice:** 2×2 grid (Recommended).

### Q4: Tailwind classes

| Option                                        | Description                                                                                                  | Selected |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------- |
| Width breakpoints + landscape modifier        | grid grid-cols-2 landscape:max-md:grid-cols-4 md:grid-cols-2 lg:grid-cols-2. Matches 4 quadrants explicitly. | ✓        |
| Width breakpoints only                        | grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2. Simpler but couples phone-landscape with small tablets.      |          |
| JS-computed grid based on orientation context | Hook reads viewport+orientation, outputs className. Adds runtime indirection.                                |          |

**User's choice:** Width breakpoints + landscape modifier (Recommended).

---

## Wrapper Audit Approach

### Q1: Audit shape

| Option                             | Description                                                                                   | Selected |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Audit-first plan, fix-second plan  | Plan A: dedicated audit producing punch list. Plan B+: fix from list. De-risks renderer work. | ✓        |
| Fix-as-found during renderer plans | No separate audit; opportunistic. Smaller commits but risk missing wrappers nobody plays.     |          |
| Lightweight audit + parallel fixes | Quick bullet list (~30 min) without screenshots, then fold fixes into renderer plans.         |          |

**User's choice:** Audit-first plan, fix-second plan (Recommended).

### Q2: Test surface / verification gate

| Option                          | Description                                                                                                                      | Selected |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Manual UAT in dev               | User plays each game on real devices. Audit screenshots = before/after evidence. Matches Phase 33 ship-don't-gold-plate posture. | ✓        |
| Add visual regression snapshots | Vitest+jsdom+viewport mocks. Catches future regressions but jsdom doesn't render layout.                                         |          |
| Playwright cross-quadrant       | Real-browser screenshots at 4 viewports. Robust but introduces new infra.                                                        |          |

**User's choice:** Manual UAT in dev (Recommended).

### Q3: Audit scope (shared screens)

| Option                           | Description                                                                           | Selected |
| -------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| Rhythm-only scope                | 6 wrappers + 5 supporting from WRAPPER-03. VictoryScreen/GameOverScreen out of scope. | ✓        |
| Include shared post-game screens | Add VictoryScreen + GameOverScreen. Risk: spillover into other game types.            |          |
| Note shared issues but don't fix | Log observed issues for future quick task.                                            |          |

**User's choice:** Rhythm-only scope (Recommended).

### Q4: BossIntroOverlay

| Option                   | Description                                                                  | Selected |
| ------------------------ | ---------------------------------------------------------------------------- | -------- |
| Yes — part of WRAPPER-03 | Audit for responsive sanity (clipping/overflow). Don't change VFX.           | ✓        |
| No — separate concern    | Skip until visual treatment confirmed via UAT. Risk shipping a quadrant bug. |          |

**User's choice:** Yes — part of WRAPPER-03 (Recommended).

---

## LANDSCAPE_ROUTES Migration

### Q1: Migration scope

| Option                              | Description                                                                                                                | Selected |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| Rhythm-only migration               | Remove only the 7 rhythm routes. Notes-master/ear-training stay hardcoded. Honors NM-01/ET-01 deferral.                    | ✓        |
| All games migrate to declarative    | All 13 routes leave the array; everyone declares via hook. Eliminates dual-array footgun globally but expands phase scope. |          |
| Keep array, add context as override | Both systems coexist with override semantics. Most flexible, most confusing.                                               |          |

**User's choice:** Rhythm-only migration (Recommended).

### Q2: Context API

| Option                           | Description                                                                                       | Selected |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| Single hook, last-writer-wins    | useDeclareNeedsLandscape(boolean); cleanup on unmount. Read-only useNeedsLandscape() for overlay. | ✓        |
| Counter-based (any-true wins)    | Multiple components can declare; provider tracks count. Heavier API for rare case.                |          |
| Hash-keyed (last-writer per key) | useDeclareNeedsLandscape(key, boolean). Most explicit but adds boilerplate.                       |          |

**User's choice:** Single hook, last-writer-wins (Recommended).

### Q3: Provider mount

| Option           | Description                                                                                  | Selected |
| ---------------- | -------------------------------------------------------------------------------------------- | -------- |
| AppLayout        | Single source of truth, wraps every routed page; rhythm renders are in scope automatically.  | ✓        |
| App.jsx root     | Available even outside AppLayout. Probably overkill since rhythm games never appear outside. |          |
| Per game wrapper | Most isolated but breaks architecture goal — siblings can't read each other's state.         |          |

**User's choice:** AppLayout (Recommended).

### Q4: Phase 35 prep

| Option                     | Description                                                                          | Selected |
| -------------------------- | ------------------------------------------------------------------------------------ | -------- |
| No special prep            | Basic boolean API supports both Phase 35 outcomes (vertical lanes vs rotate prompt). | ✓        |
| Add viewport-aware variant | useDeclareNeedsLandscape((viewport) => boolean) for Phase 35. Slightly heavier API.  |          |

**User's choice:** No special prep (Recommended).

---

## Claude's Discretion

- Exact threshold value within "moderate" bucket (D-02) — researcher confirms 8 vs 9 vs 10 against VexFlow output.
- How `MixedLessonGame` propagates needsLandscape from its embedded renderer — verify each child renderer's mount/unmount drives the hook correctly.
- Concrete responsive padding/gap values per breakpoint.
- Whether DiscoveryIntroQuestion's "larger SVG" tablet variant uses fixed sizes or viewport units.
- Whether the audit punch list is one AUDIT.md or per-component subsections.
- Exact migration order between rhythm route removal and renderer opt-ins.
- Behavior of RotatePromptOverlay when user rotates to portrait mid-game on a long-pattern reading exercise — confirm matches v1.6 baseline.

## Deferred Ideas

- Notes-master + ear-training responsive (NM-01, ET-01) — future milestone.
- Shared-screen quadrant issues observed during audit — log as future quick task, don't fix.
- Tighter beat-count threshold tuning post-launch.
- Visual regression / Playwright cross-quadrant tests.
- Full 13-route declarative migration.
- Phase 33 D-18 boss UX (intro overlay + victory VFX).
