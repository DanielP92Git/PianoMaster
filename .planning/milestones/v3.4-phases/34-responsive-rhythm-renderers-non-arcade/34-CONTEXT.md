# Phase 34: Responsive Rhythm Renderers (Non-Arcade) - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the route-based landscape lock for rhythm games with a content-driven `NeedsLandscapeContext`, and make every non-arcade rhythm renderer + wrapper render correctly across all 4 phone/tablet × portrait/landscape quadrants. Specifically: vertical card stacks stop scrolling on small phones (iPhone SE portrait fits 4 cards as 2×2 with no scroll), and tablets get real 2-column layouts that use the available width instead of a centered single column with whitespace gutters.

This is a pure layout/UX milestone over existing rhythm content. **Out of scope:** new game types, new content, audio/scoring/timing changes, pattern-generation logic changes, ArcadeRhythmGame portrait (Phase 35), notes-master/ear-training responsive (NM-01/ET-01 deferred to a future milestone).

16 requirements covered by this phase: INFRA-01..04, CORE-01..05, NOTATION-01..03, WRAPPER-01..03, TABLET-01.

</domain>

<decisions>
## Implementation Decisions

### needsLandscape Heuristic (NOTATION-01/02/03)

- **D-01: Formula keyed on beat count.** `totalBeats = measures × beatsPerMeasure`. Single number, time-signature-aware, predictable at content-authoring time. No DOM measurement, no per-pattern metadata.
- **D-02: Threshold ~8 beats.** Patterns with `totalBeats > 8` declare `needsLandscape=true` on phone. Covers > 2 measures of 4/4 or > 4 measures of 2/4. Researcher should sanity-check the exact threshold (8 vs 9 vs 10) against actual VexFlow output at iPhone SE portrait width and confirm cards/staff legibility holds; the spec is "moderate" — not "conservative" or "aggressive".
- **D-03: Pure helper, not a hook, not metadata.** Implement as `needsLandscape(pattern, timeSignature) => boolean` in `src/components/games/rhythm-games/utils/needsLandscape.js`. Renderer calls it and passes the result to `useDeclareNeedsLandscape(result)`. Unit-tested directly per NOTATION-03.
- **D-04: Helper is viewport-agnostic.** Heuristic always runs. The viewport gate (`viewport < 768 AND orientation === portrait`) lives in `RotatePromptOverlay`, not in the helper. Tablets never see the prompt because the overlay's gate filters it.

### Card Grid Breakpoints (CORE-02/04/05, TABLET-01)

Resolves the apparent conflict between CORE-02/04 ("1×4 on wider viewports") and TABLET-01 ("real 2-col on tablet-landscape") in favor of TABLET-01 for tablet, and 1×4 only for phone-landscape.

- **D-05: Quadrant layout matrix:**
  - Phone-portrait (<768): **2×2** — fits all 4 cards without scroll
  - Phone-landscape (≥640 landscape, <768): **1×4 row** — preserves vertical space on iPhone SE rotated
  - Tablet-portrait (≥768): **2×2** with bigger cards
  - Tablet-landscape (≥1024): **2×2 full-width** — fills available width, no centered whitespace gutters
- **D-06: Tailwind classes** for the cards container: `grid grid-cols-2 landscape:max-md:grid-cols-4 md:grid-cols-2 lg:grid-cols-2`. The `landscape:max-md:grid-cols-4` modifier is the only deviation — phone-landscape goes 1×4; everything else stays 2×2 with progressively larger cards/gaps via responsive padding/gap utilities.
- **D-07: This pattern applies to** `DictationChoiceCard` (4 cards in `RhythmDictationQuestion`), `SyllableMatchingQuestion` cards, `VisualRecognitionQuestion` cards. `DiscoveryIntroQuestion` is single-card per CORE-01 (no grid pattern needed) but its tablet-portrait variant (single column with larger SVG) reuses the same `md:` breakpoint logic.

### Wrapper + Supporting Component Audit (WRAPPER-01/02/03)

- **D-08: Audit-first plan, fix-second plan(s).** Plan A: dedicated audit pass. Researcher plays each wrapper + supporting component in dev across all 4 quadrants and produces a punch list (per-component: observed issues at each quadrant + screenshots optional). Plan B onward: prioritize and fix from the punch list. De-risks the renderer work — full surface known before code touches.
- **D-09: Audit covers exactly** the 6 wrappers (RhythmDictationGame, RhythmReadingGame, MetronomeTrainer, VisualRecognitionGame, SyllableMatchingGame, MixedLessonGame) + 5 supporting components named in WRAPPER-03 (CountdownOverlay, BossIntroOverlay, FloatingFeedback, MetronomeDisplay, TapArea) + RhythmGameSetup + RhythmGameSettings. Total: 13 components.
- **D-10: Rhythm-only audit scope.** VictoryScreen, GameOverScreen, and other shared post-game screens are explicitly out of scope. They're responsive enough today and changing them risks regressing notes-master/ear-training. If the audit observes a shared-screen issue, log it as a deferred item for a future quick task — don't fix in Phase 34.
- **D-11: BossIntroOverlay audited for responsive sanity only** — not for boss VFX changes (Phase 33 D-18 contingent UX). Phase 34 only verifies the overlay doesn't clip/overflow at any quadrant.
- **D-12: Verification gate = manual UAT in dev.** User plays each game on real devices: iPhone SE (portrait + landscape), iPad (portrait + landscape). Audit screenshots serve as before/after evidence. No new automated tests beyond NOTATION-03's heuristic unit test. Matches v3.3/Phase 33 ship-don't-gold-plate posture and beta launch focus.

### LANDSCAPE_ROUTES Migration (INFRA-01/02/03/04)

- **D-13: Rhythm-only migration.** Remove only the 7 rhythm routes from `LANDSCAPE_ROUTES` in `src/App.jsx`. Notes-master (4 routes) and ear-training (2 routes) stay hardcoded. Honors the NM-01/ET-01 deferral in REQUIREMENTS.md and keeps the phase scope tight.
- **D-14: Coexistence strategy.** `RotatePromptOverlay` shows when EITHER (a) the active route is in the legacy `LANDSCAPE_ROUTES` array OR (b) `NeedsLandscapeContext.needsLandscape === true`, AND the viewport gate (< 768px, portrait) is satisfied. Both systems coexist; rhythm uses the new one, others keep the old until they migrate in a future milestone.
- **D-15: Context API: single hook, last-writer-wins.** `useDeclareNeedsLandscape(boolean)` — each renderer that mounts sets the flag for its lifetime; cleanup on unmount sets back to false. Reads via `useNeedsLandscape()` (read-only) for the overlay. Conflict-free in practice because only one rhythm renderer is active at a time (MixedLessonGame swaps renderers but never mounts two simultaneously).
- **D-16: Provider mounts in `AppLayout.jsx`.** Single source of truth, wraps every routed page that has the sidebar/header/overlay surface. RotatePromptOverlay (currently rendered from App.jsx) reads from the provider via context.
- **D-17: No special API extensions for Phase 35.** The basic boolean API supports both Phase 35 outcomes: ship vertical lanes (declare false on phone-portrait, true elsewhere via inline conditional in the component) OR rotate prompt (declare true unconditionally). Phase 35 adds no infrastructure — only consumption.

### Plan-Phase Augmentations (added during planning)

- **D-18: RhythmGameSettings glass-converted unconditionally.** The component currently uses `bg-white text-gray-700 border-gray-300` (pre-glass-migration era). Even if the surrounding `<Modal>` partially masks it, the legacy classes do not match the design system and Phase 34 ships a glass-pattern conversion (per CLAUDE.md Glass Card Pattern). Implemented in Plan 05 Task 2. Resolves RESEARCH § Open Question 1.
- **D-19: `useLandscapeLock` becomes context-aware.** Hook reads `useNeedsLandscape()` internally and gates the Android-PWA fullscreen + `screen.orientation.lock('landscape')` calls on `ctxNeedsLandscape === true`. Caller signature unchanged — all existing `useLandscapeLock()` call sites remain. Implemented in Plan 03 Task 2. Resolves RESEARCH § Open Question 3.
- **D-20: OrientationController defaults to `portrait-primary` on rhythm routes after removal from `LANDSCAPE_ROUTES`.** Combined with D-19 (no Android PWA lock when content says portrait-OK), this delivers a coherent portrait-by-default rhythm experience. Resolves RESEARCH § Open Question 2.

### Claude's Discretion

- Exact threshold value within the "moderate" bucket (D-02) — researcher confirms 8 vs 9 vs 10 against actual VexFlow rendering at iPhone SE width. The picked value gets the unit test (NOTATION-03).
- How `MixedLessonGame` propagates `needsLandscape` from its embedded renderer (each child renderer just calls `useDeclareNeedsLandscape` on mount; should work, but planner verifies).
- Concrete responsive padding/gap values per breakpoint (e.g., `gap-3 md:gap-4 lg:gap-6`).
- Whether `DiscoveryIntroQuestion`'s "larger SVG" on tablet uses fixed sizes (`w-64 md:w-96`) or viewport units (`w-[40vw]`).
- Whether the audit punch list lives in a single AUDIT.md or per-component subsections.
- Exact migration order between rhythm routes' removal and renderer opt-ins (probably: introduce context first, then per-renderer opt-in, then route removal — atomic per renderer).
- Behavior of `RotatePromptOverlay` while the user is mid-game on phone-landscape and rotates to portrait while a long-pattern reading exercise is in progress. Likely: overlay appears, game state preserved, dismissing returns to game in current orientation. Confirm this matches existing v1.6 behavior.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/REQUIREMENTS.md` — full v3.4 requirements with traceability table; 16 requirements mapped to Phase 34
- `.planning/ROADMAP.md` (Phase 34 section) — Goal, Success Criteria, Requirements list, Phase 35 dependency note
- `.planning/STATE.md` — milestone status and v3.4 phase split rationale

### Existing Infrastructure

- `src/App.jsx` (lines 269-285) — current `LANDSCAPE_ROUTES` array and `isLandscapeRoute` derivation; the array Phase 34 partially empties
- `src/components/orientation/RotatePromptOverlay.jsx` — overlay rendered when route requires landscape; will be modified to read from context AND legacy array
- `src/components/layout/AppLayout.jsx` — the `gameRoutes` array that hides sidebar/header during gameplay; **stays unchanged** (rhythm routes remain in `gameRoutes`, only leaving `LANDSCAPE_ROUTES`)

### Rhythm Game Surface (audit + fix scope)

- `src/components/games/rhythm-games/renderers/` — 7 renderers (DiscoveryIntroQuestion, PulseQuestion, RhythmDictationQuestion, RhythmReadingQuestion, RhythmTapQuestion, SyllableMatchingQuestion, VisualRecognitionQuestion)
- `src/components/games/rhythm-games/components/` — supporting components: DictationChoiceCard, RhythmGameSetup, RhythmGameSettings, CountdownOverlay, BossIntroOverlay, FloatingFeedback, MetronomeDisplay, TapArea, RhythmStaffDisplay (notation rendering, used by reading/tap renderers)
- `src/components/games/rhythm-games/{RhythmDictationGame, RhythmReadingGame, MetronomeTrainer, VisualRecognitionGame, SyllableMatchingGame, MixedLessonGame}.jsx` — 6 standalone wrappers in WRAPPER-01

### Notation & Helpers

- `src/components/games/rhythm-games/components/RhythmStaffDisplay.jsx` — VexFlow renderer; supports 1-4 measures via `measures` prop (relevant for needsLandscape inputs)
- `src/components/games/rhythm-games/utils/` — directory where `needsLandscape.js` will land (NOTATION-03)

### Project Conventions

- `CLAUDE.md` (Routing § Layout Patterns) — anti-pattern note about the dual-array trap (`LANDSCAPE_ROUTES` + `gameRoutes`); Phase 34 partially eliminates this for rhythm
- `docs/DESIGN_SYSTEM.md` — glassmorphism patterns and design system rules (used by setup screens and supporting components)
- `docs/vexflow-notation/vexflow-guidelines.md` — VexFlow rendering patterns (relevant when needsLandscape interacts with multi-stave renders)

### Prior Phase Context (for continuity)

- `.planning/milestones/v3.3-phases/33-rhythm-issues-cleanup/33-CONTEXT.md` — most recent rhythm phase decisions, including ship-focused beta posture and Phase 33 D-18 (boss UX, deferred)
- `.planning/milestones/` — v3.2/v3.3 rhythm trail rework history if researcher needs deeper context on renderer evolution

### Phase 35 Dependency

- `.planning/ROADMAP.md` (Phase 35 section) — confirms `NeedsLandscapeContext` (INFRA-02) is the consumed artifact; API decisions in this phase (D-15..17) are load-bearing for Phase 35

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **`RhythmStaffDisplay`** already supports multi-measure rendering (1-4) and accepts `timeSignature` — the inputs needed for the needsLandscape heuristic are already available where rendering happens.
- **`useMotionTokens` + `AccessibilityContext`** — existing reduced-motion + RTL support already wired into RotatePromptOverlay; new components reuse the pattern.
- **Tailwind `landscape:` modifier** — already supported by the project's Tailwind config; safe to use in D-06.

### Established Patterns

- **Glass card container** (CLAUDE.md Design System): `bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg` — applies to setup screens and supporting components during the audit fixes.
- **Game route dual-array** (CLAUDE.md Routing): the `LANDSCAPE_ROUTES` + `gameRoutes` foot-gun is the explicit anti-pattern this phase eliminates for rhythm. Notes-master/ear-training keep the legacy pattern until their own milestone.
- **Renderer auto-start** (CLAUDE.md Game Component Integration): renderers receive trail navigation state via `location.state`. Layout changes must not break this contract.

### Integration Points

- **App.jsx → AppLayout.jsx → renderer**: provider mounts in AppLayout, every routed game is wrapped. RotatePromptOverlay (currently in App.jsx) reads from provider plus checks legacy `LANDSCAPE_ROUTES`.
- **`MixedLessonGame` swaps renderers** within a single session. Each child renderer calls `useDeclareNeedsLandscape` on mount and cleans up on unmount → context value tracks the active child correctly.
- **`SightReadingSession`/`Rhythm` contexts** are independent of `NeedsLandscapeContext`. No interaction expected.

</code_context>

<specifics>
## Specific Ideas

- iPhone SE portrait (375×667) is the explicit floor target — every cards-based renderer must show staff + 2×2 cards without vertical scroll on this device. Success criterion #1 in ROADMAP Phase 34.
- "Real 2-col" on tablet-landscape (TABLET-01) means the cards grid spans the full container width with comfortable gaps — NOT a 1×4 horizontal row. Resolves explicitly against the literal reading of CORE-02/04.
- BossIntroOverlay must keep its existing visual treatment; only responsive-sanity fixes are in scope.

</specifics>

<deferred>
## Deferred Ideas

- **Notes-master + ear-training responsive (NM-01, ET-01)** — already deferred in REQUIREMENTS. Phase 34 does NOT migrate their routes off `LANDSCAPE_ROUTES`.
- **Shared-screen quadrant issues** (VictoryScreen, GameOverScreen) — if observed during audit, log as future quick-task items; do not fix in Phase 34.
- **Tighter beat-count threshold** — if user feedback after launch shows ~8 is wrong (too aggressive or too lax), revisit the threshold as a quick task; the heuristic location and unit test make this a one-line change.
- **Visual regression / Playwright cross-quadrant tests** — explicitly rejected for Phase 34 (manual UAT instead). Could be added in a future "test infra" milestone.
- **Full migration of all 13 game routes to declarative `useDeclareNeedsLandscape`** — explicitly rejected for Phase 34 scope; keeps notes-master/ear-training on the legacy array until NM-01/ET-01 ship.
- **Phase 33 D-18 boss UX (intro overlay + victory VFX)** — still deferred; Phase 34 only audits BossIntroOverlay for responsive sanity, not visual treatment.

</deferred>

---

_Phase: 34-Responsive Rhythm Renderers (Non-Arcade)_
_Context gathered: 2026-05-07_
