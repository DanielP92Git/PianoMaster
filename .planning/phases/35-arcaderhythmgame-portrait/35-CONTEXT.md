# Phase 35: ArcadeRhythmGame Portrait - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Decide via short feel-test spike whether `ArcadeRhythmGame` ships a portrait-native experience on phone (vertical-lane, no rotate prompt) OR declares `needsLandscape=true` and uses the rotate-prompt path. Then ship whichever path the spike picks. Phase 34's `NeedsLandscapeContext` infra (D-15..D-17) is the consumed dependency.

**Surprise surfaced during discussion:** The existing `ArcadeRhythmGame.jsx` is already a single full-width vertical lane (tiles spawn at top, fall to a hit zone at the bottom, `tileLaneRef` is `absolute inset-0`, `laneHeightRef` reads `offsetHeight` dynamically). The backlog memo and ROADMAP SC #3 framed the phase as "vertical-lane redesign vs. horizontal-lanes-only-on-landscape," but the code today is vertical-lane in landscape orientation. So the actual spike is much smaller than the memo implied: _"does just removing `useDeclareNeedsLandscape(true)` and letting it render in a taller portrait viewport feel good?"_ — not _"design a new layout."_

**Out of scope:** Audio/scoring/timing logic changes, pattern-generation changes, difficulty curve changes, multi-column lane redesigns (not needed if the unlock feels right; deferred to a future phase if not), notes-master/ear-training responsive (NM-01/ET-01 still deferred per v3.4 REQUIREMENTS).

2 requirements covered by this phase: ARCADE-01 (spike), ARCADE-02 (ship one path).

</domain>

<decisions>
## Implementation Decisions

### Spike Scope & Format (ARCADE-01)

- **D-01: Unlock-and-feel-test, not a redesign.** Spike = flip `useDeclareNeedsLandscape(true) → (false)` on the existing single-lane code and play. No new layout work in the spike itself. If feel-test passes, that IS the ship target (modulo polish). If it fails, escalate to either a redesign mini-spike or rotate-prompt fallback (see D-04).
- **D-02: Spike lives in-place behind a dev URL flag.** Add `?spike-portrait` URL param detection in `ArcadeRhythmGame.jsx` that conditionally flips the declaration. Prod path unchanged; one-line revert if rotate-prompt path wins. Pattern mirrors Phase 34's dev-only `?measures` URL helper (Plan 34-08).
- **D-03: Test surface for the spike** — iPhone SE portrait (375×667), one larger phone portrait (e.g., iPhone 14), iPad portrait (informs Area 3 tablet decision), AND both short (2-bar) and long (4-bar) patterns. Tile density at long-pattern + small-screen is the worst-case feel target.

### Decision Criteria (ARCADE-02 outcome resolution)

- **D-04: Subjective feel-test is the primary criterion.** Play 10–15 min on real phones; judge as the project owner: "does this feel like an arcade rhythm game I'd ship to 8yos?" Yes → ship vertical. No → rotate-prompt. Matches Phase 34 D-12 manual-UAT, ship-don't-gold-plate posture.
- **D-05: Just the project owner tests.** No kid testers during the spike. Kid feedback gets a follow-up post-beta if signal warrants. Consistent with v3.4 beta-launch focus.
- **D-06: Verdict recorded in `35-SPIKE.md`.** Single file documenting: device(s) tested, time spent, what felt right/wrong, screenshots/video if helpful, final verdict (ship-vertical or rotate-prompt) with rationale. This file is the audit trail for ARCADE-01's success criterion #1.
- **D-07: On-the-fence tie-break defaults to rotate-prompt.** If the owner cannot confidently say "this feels right," the safer outcome wins: declare `needsLandscape=true` always. Rotate-prompt is the lower-risk path (effectively a no-op vs. the current code) and avoids shipping a portrait UX the owner is unsure about.

### Tablet Behavior (resolves ROADMAP SC #3 ambiguity)

- **D-08: Same single-vertical-lane in both tablet orientations, no rotate prompt.** Tablet-portrait and tablet-landscape both play the existing single-lane code. ROADMAP SC #3's "horizontal-lanes layout" wording is a documentation slip — the actual code is vertical-lane and always has been. SC #3 gets updated as part of this phase.
- **D-09: Tablet behavior is independent of the phone spike outcome.** Even if the spike picks rotate-prompt for phone, tablet plays in any orientation. Honors Phase 34 D-12's "tablet never sees the prompt" principle.
- **D-10: Viewport-aware declaration in the component.** `ArcadeRhythmGame.jsx` calls `useDeclareNeedsLandscape(viewportWidth < 768)` (or equivalent matchMedia/hook). Phone (<768) declares true on rotate-prompt outcome and false on ship-vertical outcome; tablet (≥768) declares false regardless. This intentionally controls the context value rather than relying solely on `RotatePromptOverlay`'s viewport gate — because Phase 34 D-19 also gates the `useLandscapeLock` Android-PWA `screen.orientation.lock('landscape')` on `ctxNeedsLandscape === true`, and we don't want iPads forcefully locked to landscape.
- **D-11: ROADMAP SC #3 wording is fixed early.** Update SC #3 from "horizontal-lanes layout" to "vertical-lane layout" in `.planning/ROADMAP.md` Phase 35 section as one of the first planning tasks (small docs commit before substantive plans land). Prevents planner/researcher from inheriting confused requirements.

### Fallback Cleanup (post-spike code shape)

- **D-12: If spike → rotate-prompt path: minimal cleanup.** Remove the `?spike-portrait` flag detection. Replace the Phase 35 TODO comment at `ArcadeRhythmGame.jsx:122-127` with a permanent comment citing `35-SPIKE.md` and the decision rationale. `useDeclareNeedsLandscape` becomes viewport-aware per D-10 (true on <768, false on ≥768). Single-commit shipping change.
- **D-13: If spike → ship-vertical path: promote spike behavior to default.** Remove the `?spike-portrait` flag. `useDeclareNeedsLandscape` becomes viewport-aware per D-10 (false on both phone and tablet, since spike outcome was positive). Remove the existing TODO + the "W2 Android PWA regression guard" comment (Phase 34 D-19 already handles the Android lock gating via context). Bundle any responsive polish surfaced during the spike (tile sizing, hit zone tap target, header sizing) into Phase 35 plans rather than deferring.
- **D-14: No new helper file or unit test.** Unlike Phase 34's `needsLandscape(pattern, timeSignature)` helper, this is a binary decision (viewport-based) and doesn't merit its own extracted helper or NOTATION-03-style unit test. Inline matchMedia or simple width check is enough.

### Claude's Discretion

- Exact mechanism for viewport-aware declaration in D-10 — inline `window.matchMedia('(min-width: 768px)')` vs. a small reusable hook (`useViewportIsTablet()` or similar). Planner picks based on whether other components need the same gate.
- Exact phrasing of the post-decision comment replacing the line 122-127 TODO.
- Whether the SPIKE.md template uses Phase 34-style prose or a structured form (verdict box at top, then findings).
- Whether `35-SPIKE.md` lives in `.planning/phases/35-.../` (project record) or under `.planning/spikes/` (separate spike namespace). Project convention so far has been in-phase for ship-related spikes — keep that unless planner finds a reason to deviate.
- How to handle the case where the spike reveals "feels good but needs N visual fixes" — bundle into Phase 35 plans (per D-13) or split into a "Phase 35.5 polish" follow-up. Planner judges based on the size of the punch list.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap

- `.planning/REQUIREMENTS.md` — ARCADE-01 (spike), ARCADE-02 (ship one path); traceability table maps both to Phase 35
- `.planning/ROADMAP.md` (Phase 35 section) — Goal, Success Criteria #1-3, dependency on Phase 34 INFRA-02 (note: SC #3 wording needs fix per D-11)
- `.planning/STATE.md` — v3.4 milestone status, Phase 34 complete (2026-05-10)

### Phase 34 Context (load-bearing for this phase)

- `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-CONTEXT.md` — D-15..D-17 (NeedsLandscapeContext API stability), D-19 (`useLandscapeLock` is context-aware), D-12 (tablet-never-prompts principle, manual UAT gate)
- `.planning/phases/34-responsive-rhythm-renderers-non-arcade/34-08-PLAN.md` — dev-only `?measures` URL param helper pattern (model for the `?spike-portrait` flag in D-02)

### Existing Code Surface

- `src/components/games/rhythm-games/ArcadeRhythmGame.jsx` — the only file touched by Phase 35 (spike + ship). Key spots: line 121-128 (TODO + `useDeclareNeedsLandscape(true)`), line 129 (`useLandscapeLock()`), lines 1106-1339 (render block — single vertical lane, header h-12, main lane, hit zone bottom 12)
- `src/contexts/NeedsLandscapeContext.jsx` — `useDeclareNeedsLandscape`/`useNeedsLandscape` API (provided by Phase 34 D-15..D-17)
- `src/components/orientation/RotatePromptOverlay.jsx` — overlay surfacing the prompt; viewport gate (<768 portrait) lives here per Phase 34 D-04
- `src/hooks/useLandscapeLock.js` — Android PWA fullscreen + `screen.orientation.lock`; context-gated per Phase 34 D-19

### Backlog Memo (for historical context, not authoritative)

- User memory `backlog_arcade_portrait_phase.md` (private) — original phase framing from 2026-05-07. Note: the memo's "horizontal lanes vs vertical lanes" framing is superseded by the actual code state surfaced in this discussion. CONTEXT.md takes precedence.

### Project Conventions

- `CLAUDE.md` (Routing § Layout Patterns) — dual-array trap (`LANDSCAPE_ROUTES` + `gameRoutes`); ArcadeRhythmGame stays in `gameRoutes` (full-viewport game), no longer needs to be in `LANDSCAPE_ROUTES` either way (declarative path)
- `docs/DESIGN_SYSTEM.md` — glassmorphism patterns; ArcadeRhythmGame already uses the gradient + glass treatment in its render block

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- **Single vertical lane already implemented.** `ArcadeRhythmGame.jsx:1213-1246` — tiles are `absolute left-4 right-4` (full-width minus padding) inside a `tileLaneRef` lane that's `absolute inset-0` (entire main area). `laneHeightRef.current = tileLaneRef.current.offsetHeight` (line 587) reads the actual rendered height at runtime — portrait would just give a taller lane and more travel distance for the same beat schedule.
- **`useDeclareNeedsLandscape` API** — Phase 34's hook accepts a boolean per render; safe to make it viewport-conditional inline.
- **`?measures` URL pattern from Plan 34-08** — direct precedent for `?spike-portrait`. Same place to add (search params read once on mount), same dev-only intent.

### Established Patterns

- **Game wrapper with `useLandscapeLock` + `useDeclareNeedsLandscape`** (Phase 34 D-19) — call `useDeclareNeedsLandscape(needsLandscape)` first, then `useLandscapeLock()` — the lock hook reads the context and gates the Android PWA orientation lock on `ctxNeedsLandscape === true`. ArcadeRhythmGame already follows this pattern (lines 128-129); Phase 35 only changes the argument.
- **`RotatePromptOverlay` viewport gate** (Phase 34 D-04) — overlay's own `<768 + portrait` filter prevents tablets from ever seeing the prompt regardless of context value. Belt-and-braces with D-10's viewport-aware declaration.
- **In-phase SPIKE record file** (model from `.planning/spikes/` MANIFEST conventions where they exist) — phase keeps its spike artifact in its own directory unless a project-wide spike directory pattern is established.

### Integration Points

- **No new routes, no new context, no new API surface.** Phase 35 only modifies `ArcadeRhythmGame.jsx` (and possibly adds `35-SPIKE.md`). Tightest possible blast radius.
- **`MixedLessonGame` does NOT embed `ArcadeRhythmGame`** — the arcade game is its own standalone wrapper at `/rhythm-mode/arcade-rhythm-game`, not a renderer swap target. So Phase 34's mixed-lesson renderer-swap concern doesn't apply here.
- **`useLandscapeLock` context-aware behavior (D-19)** — already in place from Phase 34. If Phase 35 declares `false` on phone-portrait, the Android PWA orientation lock automatically stops firing. Zero work to remove the Android lock side-effect.

</code_context>

<specifics>
## Specific Ideas

- iPhone SE portrait (375×667) is the explicit floor target for the spike — same anchor as Phase 34 D-12.
- Tablet ≥768px is the "always plays, never prompts" rule (matches Phase 34's RotatePromptOverlay gate).
- Spike timebox: 10–15 min of play per device; total spike cycle (including SPIKE.md write-up) targets a single dev session.
- The Phase 34 TODO at `ArcadeRhythmGame.jsx:122-127` is the explicit "Phase 35 enters here" marker — that comment will be replaced either way (D-12 or D-13).

</specifics>

<deferred>
## Deferred Ideas

- **Multi-column / Guitar-Hero-style lane redesign.** If the spike feel-test fails AND rotate-prompt also feels wrong long-term, a future phase could explore a multi-lane variant. Not in Phase 35 scope; would be its own spike + phase if it surfaces as a real need post-beta.
- **Tile sizing / hit zone / header polish punch list.** If the spike reveals "feels good but needs N visual fixes" and the planner judges the list is too large to bundle into Phase 35, it splits into a "Phase 35.5 portrait polish" follow-up (per D-13 planner discretion).
- **`needsLandscape(viewport)` extracted helper + unit test (Phase 34-style).** Considered and rejected (D-14) — binary viewport check doesn't justify the abstraction. Could be added later if other wrappers need the same gate.
- **Kid tester feedback loop.** Deferred to post-beta per D-05. No formalized kid-testing infrastructure in this phase.
- **Removal of Phase 35 from `LANDSCAPE_ROUTES`.** Already handled — Phase 34 D-13 left `arcade-rhythm-game` out of the migration intentionally so it could continue working via the route lock during the inter-phase window. Phase 35 doesn't need to touch `LANDSCAPE_ROUTES` because Phase 34 already removed it; the declarative path (`useDeclareNeedsLandscape`) is now the only mechanism.

</deferred>

---

_Phase: 35-ArcadeRhythmGame Portrait_
_Context gathered: 2026-05-10_
