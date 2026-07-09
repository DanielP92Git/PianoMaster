# Requirements: PianoApp — v3.7 Sight-Reading Engagement & Pedagogy

**Defined:** 2026-07-09
**Core Value:** Children's data must be protected and inaccessible to unauthorized users.

Milestone scope: Phase D of the sight-reading deep audit. Phases A (correctness, PR #10), B (performance, PR #11), and C (feedback wiring, PR #12) already shipped. This milestone turns the hardened game into an elite learning experience. Source plan: `~/.claude/plans/analyze-the-entire-codebase-valiant-hejlsberg.md` (Phase D, §"Missing Features for an Elite Sight-Reading Experience" items 4–10).

## v1 Requirements

Requirements for this milestone. Each maps to exactly one roadmap phase.

### Engagement HUD (P1 — no DB)

- [ ] **HUD-01**: Player sees a live combo counter that increments on consecutive correct notes and resets on a miss, using the shared `ComboPill` component from v3.6.
- [ ] **HUD-02**: Player has a session-level lives system rendered with the shared `LivesDisplay`; depletion routes to the shared `GameOverScreen` path instead of the bespoke sight-reading loss screen.
- [ ] **HUD-03**: Player sees an on-fire state (badge + splash) when the combo crosses a threshold, respecting `prefers-reduced-motion`.

### Practice Tooling (P2 — no DB)

- [ ] **PRAC-01**: During the read/display phase the player can replay the exercise audio on demand ("hear it again"), beyond the single existing auto-play.
- [ ] **PRAC-02**: In the feedback phase the player can hear a played-vs-correct comparison playback (their rendition vs the correct one).
- [ ] **PRAC-03**: The player can select Practice vs Test mode — Practice grades with lenient timing tolerances (pitch-focused), Test uses strict timing tolerances.
- [ ] **PRAC-04**: After an exercise the player can enter a Review-mistakes mode that steps through only the wrong/missed notes.

### Adaptive Pedagogy (P3 — needs Supabase)

- [ ] **ADAPT-01**: Within a session, difficulty progresses on sustained success (widen note range / add rests / raise tempo) and eases on struggle.
- [ ] **ADAPT-02**: Tempo adapts to performance — slows on struggle, speeds up on success.
- [ ] **ADAPT-03**: Per-note mastery (accuracy per pitch) persists across sessions via a JSONB field on the student progress row, enabling weak-note targeting across sessions.
- [ ] **ADAPT-04**: Persisted per-note mastery is written and read only for the authenticated student under RLS, mirroring existing `student_skill_progress` protections (defense-in-depth: JS gate + DB RLS).

### Cross-cutting

- [ ] **I18N-01**: All new player-facing strings (HUD labels, replay / mode-toggle / review-mistakes controls, coaching copy) ship in EN + HE with RTL correctness and EN↔HE locale parity, gated like prior milestones.

## v2 Requirements

Deferred to a future release. Tracked but not in this roadmap.

### Sight-Reading (future)

- **SR-FUT-01**: Rush-vs-drag coaching that names the internal-pulse error (`timingStatus` already carries early/late; deeper coaching UI deferred).
- **SR-FUT-02**: Grand-staff / two-hand cross-clef reading.
- **SR-FUT-03**: Real song library (public-domain first) as sight-reading content.

## Out of Scope

Explicitly excluded for v3.7.

| Feature                                       | Reason                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| Grand-staff / two-hand reading                | Large new notation surface; separate milestone                         |
| Licensed song content                         | Licensing complexity; public-domain-first, later milestone             |
| Social / leaderboard on sight-reading         | COPPA constraints; tracked as future candidate in PROJECT.md           |
| Notes-master / ear-training engagement parity | This milestone is sight-reading-only; sibling games already have HUD   |
| Cross-game adaptive-difficulty framework      | v3.7 keeps adaptivity scoped to sight-reading; generalization deferred |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase       | Status  |
| ----------- | ----------- | ------- |
| HUD-01      | Phase 01    | Pending |
| HUD-02      | Phase 01    | Pending |
| HUD-03      | Phase 01    | Pending |
| PRAC-01     | Phase 02    | Pending |
| PRAC-02     | Phase 02    | Pending |
| PRAC-03     | Phase 02    | Pending |
| PRAC-04     | Phase 02    | Pending |
| ADAPT-01    | Phase 03    | Pending |
| ADAPT-02    | Phase 03    | Pending |
| ADAPT-03    | Phase 03    | Pending |
| ADAPT-04    | Phase 03    | Pending |
| I18N-01     | Phase 01–03 | Pending |

**Coverage:**

- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

_(I18N-01 is cross-cutting: each phase ships its own new strings in EN+HE; the roadmapper may attach it to each phase's success criteria rather than a single phase.)_

---

_Requirements defined: 2026-07-09_
_Last updated: 2026-07-09 after initial definition_
