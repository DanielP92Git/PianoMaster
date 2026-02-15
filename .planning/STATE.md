# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Children's data must be protected and inaccessible to unauthorized users
**Current focus:** Milestone v1.6 - Auto-Rotate Landscape for Games (Phase 02-05)

## Current Position

Phase: 04 of 05 (Platform-Specific Android Enhancement)
Plan: 1 of 2 complete
Status: Executing
Last activity: 2026-02-15 — Completed 04-01-PLAN.md (Android PWA landscape lock hooks)

Progress: [████████░░] 66 of 73 plans complete (90%)

## Milestone History

| Version | Name | Phases | Plans | Shipped |
|---------|------|--------|-------|---------|
| v1.0 | Security Hardening | 1-4 | 15 | 2026-02-01 |
| v1.1 | Parental Consent Email Service | 5 | 2 | 2026-02-02 |
| v1.2 | Trail System Stabilization | 6-7 | 4 | 2026-02-03 |
| v1.3 | Trail System Redesign | 8-12 | 14 | 2026-02-05 |
| v1.4 | UI Polish & Celebrations | 13-18 | 13 | 2026-02-09 |
| v1.5 | Trail Page Visual Redesign | 19-22 | 10 | 2026-02-12 |
| v1.6 | Auto-Rotate Landscape for Games | 01, 02-05 | 2 + TBD | In progress |

## Performance Metrics

**Velocity:**
- Total plans completed: 60 (across 23 phases in 6 shipped milestones + Phase 01)
- 6 milestones shipped in 13 days (2026-01-31 to 2026-02-12)
- ~67,835 lines JavaScript/JSX/CSS

**Recent execution:**
| Phase-Plan | Duration | Tasks | Files | Date |
|------------|----------|-------|-------|------|
| 02-01 | 2 min | 2 | 3 | 2026-02-13 |
| 02-02 | 5 min | 2 | 5 | 2026-02-13 |
| 03-01 | 6 min | 2 | 5 | 2026-02-15 |
| 03-02 | 4 min | 2 | 1 | 2026-02-15 |
| 03-03 | ~30 min | 3 | 3 | 2026-02-15 |
| 04-01 | 2 min | 2 | 2 | 2026-02-15 |

## Accumulated Context

### Decisions

**Phase 01 decisions (Hebrew translations):**
- Added install.safari as separate object at root install level to match install.ios structure
- Removed duplicate pages.install object from EN common.json
- Fixed install.ios in HE to use installStep1/2/3 pattern matching EN
- Preserved all Hebrew plural forms (_two, _many) as valid Hebrew grammar

**Phase 02 decisions (Orientation detection & prompt):**
- Use function initializer in useState for synchronous orientation detection (avoids flash of incorrect state)
- Text-only dismiss button "Play anyway" (no X icon) per WCAG 1.3.4 escape hatch requirement
- localStorage key "pianoapp-rotate-dismissed" for permanent dismiss (matches app naming convention)
- Animation changed from swing to rotate-pause-reset cycle per user feedback (phone rotates to landscape, pauses, snaps back)
- Removed music note emoji from overlay per user feedback
- Rotate prompt renders as FIRST child in game JSX (before settings modal)

**Phase 03 decisions (Game layout optimization):**
- Use Tailwind raw media queries for orientation modifiers (no aspect-ratio guards needed - games have no text inputs)
- Portrait-first design philosophy: portrait as baseline, landscape as CSS-only enhancement (WCAG 1.3.4 compliance)
- MemoryGame landscape grid scaling: 3X4→6cols, 3X6→6cols, 3X8→8cols for better horizontal space utilization

**Phase 04 decisions (Android PWA landscape lock):**
- Fullscreen entered before orientation lock (Android API requirement)
- fullscreenchange listener handles Escape key edge case (auto-unlocks orientation)
- Platform guard: Android PWA only (iOS/desktop/browser get no-op)
- API support guard: checks for requestFullscreen and screen.orientation.lock
- Empty dependency array for run-once-on-mount effect hook
- useState function initializer for isAndroidPWA (synchronous detection, same pattern as permanentlyDismissed)

All milestone decisions logged in PROJECT.md Key Decisions table (220 entries across 6 milestones).

### v1.6 Roadmap Structure

**4 Phases (02-05):**
- Phase 02: Foundation (CSS detection + prompt overlay) — ORIENT-01 through ORIENT-05
- Phase 03: Game Layout Optimization — LAYOUT-01 through LAYOUT-04
- Phase 04: Platform-Specific Android Enhancement — PLAT-01 through PLAT-04
- Phase 05: Accessibility & i18n — A11Y-01 through A11Y-05

**18 Requirements total** across 4 categories, 100% mapped to phases.

**Key research findings:**
- Zero new npm packages needed (CSS media queries + existing deps)
- iOS blocks Screen Orientation API — must use CSS-first detection
- Android orientation lock requires fullscreen API
- VexFlow may need double-RAF coordinate refresh after orientation change
- WCAG 1.3.4 requires escape hatch (can't force orientation)

### Pending Todos

None — between milestones.

### Blockers/Concerns

**Outstanding items (non-blocking):**
- Pre-existing test failure: SightReadingGame.micRestart.test.jsx (Router context issue)
- Pre-existing lint warnings: 24 errors, 415 warnings (all pre-v1.4)
- syncPracticeSessions() stub in sw.js (zero runtime impact)

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed 04-01-PLAN.md
Resume file: None

**Next action:** Execute 04-02-PLAN.md (game component integration)

---
*State initialized: 2026-01-31*
*Last updated: 2026-02-15 — Phase 04 Plan 01 complete (Android PWA landscape lock hooks)*
