# Requirements: PianoApp

**Defined:** 2026-02-13
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1.6 Requirements

Requirements for Auto-Rotate Landscape for Games milestone. Each maps to roadmap phases.

### Orientation Detection

- [ ] **ORIENT-01**: User sees a playful animated rotate prompt when entering a game in portrait mode on mobile
- [ ] **ORIENT-02**: Rotate prompt disappears automatically when device is rotated to landscape
- [ ] **ORIENT-03**: User can dismiss the rotate prompt and it stays dismissed for the session
- [ ] **ORIENT-04**: Rotate prompt appears for all 4 game modes (note recognition, sight reading, rhythm, memory)
- [ ] **ORIENT-05**: Rotate prompt does not appear on desktop or when already in landscape

### Game Layout

- [ ] **LAYOUT-01**: All 4 game modes display optimized layouts in landscape orientation
- [ ] **LAYOUT-02**: Settings modal renders correctly in landscape orientation
- [ ] **LAYOUT-03**: VictoryScreen renders correctly in landscape orientation
- [ ] **LAYOUT-04**: Games remain playable in portrait mode with degraded but functional layout

### Platform

- [ ] **PLAT-01**: On Android PWA, orientation locks to landscape when entering a game
- [ ] **PLAT-02**: On Android PWA, orientation unlocks when navigating away from game (Back to Trail/dashboard)
- [ ] **PLAT-03**: On iOS, rotate prompt is shown instead of API lock (graceful fallback)
- [ ] **PLAT-04**: Orientation lock/prompt covers full game lifecycle (settings through victory screen)

### Accessibility

- [ ] **A11Y-01**: Rotate prompt animation respects reducedMotion preference
- [ ] **A11Y-02**: Rotate prompt is accessible to screen readers with appropriate announcements
- [ ] **A11Y-03**: User can dismiss prompt and play in portrait (WCAG 1.3.4 escape hatch)
- [ ] **A11Y-04**: Rotate prompt text is translated in both English and Hebrew
- [ ] **A11Y-05**: Rotate prompt supports RTL layout for Hebrew

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Platform Enhancements

- **PLAT-05**: Auto-fullscreen mode on Android for immersive game experience
- **PLAT-06**: Orientation-aware trail map layout

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Force landscape on app launch | Not supported on iOS; violates PWA principles |
| Block gameplay in portrait | Accessibility issue — some users can't rotate (wheelchair-mounted devices) |
| Orientation lock on all routes | Dashboard, settings, profile don't need landscape |
| Persistent nag prompts | Annoying if user dismissed; show prompt max once per session |
| Manifest orientation key | iOS ignores it; locks entire app not per-page |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ORIENT-01 | Phase 02 | Pending |
| ORIENT-02 | Phase 02 | Pending |
| ORIENT-03 | Phase 02 | Pending |
| ORIENT-04 | Phase 02 | Pending |
| ORIENT-05 | Phase 02 | Pending |
| LAYOUT-01 | Phase 03 | Pending |
| LAYOUT-02 | Phase 03 | Pending |
| LAYOUT-03 | Phase 03 | Pending |
| LAYOUT-04 | Phase 03 | Pending |
| PLAT-01 | Phase 04 | Pending |
| PLAT-02 | Phase 04 | Pending |
| PLAT-03 | Phase 04 | Pending |
| PLAT-04 | Phase 04 | Pending |
| A11Y-01 | Phase 05 | Pending |
| A11Y-02 | Phase 05 | Pending |
| A11Y-03 | Phase 05 | Pending |
| A11Y-04 | Phase 05 | Pending |
| A11Y-05 | Phase 05 | Pending |

**Coverage:**
- v1.6 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 (100% coverage)

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation*
