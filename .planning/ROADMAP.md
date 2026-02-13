# Roadmap: PianoApp

## Milestones

- ✅ **v1.0 Security Hardening** — Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email Service** — Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** — Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** — Phases 8-12 (shipped 2026-02-05)
- ✅ **v1.4 UI Polish & Celebrations** — Phases 13-18 (shipped 2026-02-09)
- ✅ **v1.5 Trail Page Visual Redesign** — Phases 19-22 (shipped 2026-02-12)
- 🚧 **v1.6 Auto-Rotate Landscape for Games** — Phases 02-05 (in progress)

See `.planning/milestones/` for archived details of each milestone.

## Phases

<details>
<summary>✅ v1.0 Security Hardening (Phases 1-4) — SHIPPED 2026-02-01</summary>

- [x] Phase 1: Authorization Hardening (4/4 plans) — completed 2026-02-01
- [x] Phase 2: COPPA Compliance Foundation (4/4 plans) — completed 2026-02-01
- [x] Phase 3: Production Safeguards (4/4 plans) — completed 2026-02-01
- [x] Phase 4: Privacy Foundation (3/3 plans) — completed 2026-02-01

</details>

<details>
<summary>✅ v1.1 Parental Consent Email Service (Phase 5) — SHIPPED 2026-02-02</summary>

- [x] Phase 5: Consent Email Service (2/2 plans) — completed 2026-02-02

</details>

<details>
<summary>✅ v1.2 Trail System Stabilization (Phases 6-7) — SHIPPED 2026-02-03</summary>

- [x] Phase 6: Trail Commitment (2/2 plans) — completed 2026-02-03
- [x] Phase 7: Tech Debt Cleanup (2/2 plans) — completed 2026-02-03

</details>

<details>
<summary>✅ v1.3 Trail System Redesign (Phases 8-12) — SHIPPED 2026-02-05</summary>

- [x] Phase 8: Validation Infrastructure (3/3 plans) — completed 2026-02-05
- [x] Phase 9: Bass Clef Redesign (3/3 plans) — completed 2026-02-05
- [x] Phase 10: Rhythm Redesign (4/4 plans) — completed 2026-02-05
- [x] Phase 11: Trail System Integration (3/3 plans) — completed 2026-02-05
- [x] Phase 12: E2E Verification (1/1 plan) — completed 2026-02-05

</details>

<details>
<summary>✅ v1.4 UI Polish & Celebrations (Phases 13-18) — SHIPPED 2026-02-09</summary>

- [x] Phase 13: Celebration Foundation & Accessibility (2/2 plans) — completed 2026-02-05
- [x] Phase 14: Node Type Visual Distinction (2/2 plans) — completed 2026-02-08
- [x] Phase 15: VictoryScreen Celebration System (3/3 plans) — completed 2026-02-09
- [x] Phase 16: Dashboard XP Prominence (2/2 plans) — completed 2026-02-09
- [x] Phase 17: Boss Unlock Celebrations (2/2 plans) — completed 2026-02-09
- [x] Phase 18: Code Cleanup (2/2 plans) — completed 2026-02-09

</details>

<details>
<summary>✅ v1.5 Trail Page Visual Redesign (Phases 19-22) — SHIPPED 2026-02-12</summary>

- [x] Phase 19: CSS Foundation & Font Setup (2/2 plans) — completed 2026-02-10
- [x] Phase 20: Component Integration & Tab Navigation (3/3 plans) — completed 2026-02-10
- [x] Phase 21: Responsive Layout Rewrite (3/3 plans) — completed 2026-02-11
- [x] Phase 22: Performance Optimization & Deployment (2/2 plans) — completed 2026-02-11

</details>

<details>
<summary>✅ Phase 01: Hebrew Translations (v1.6 prep) — COMPLETE 2026-02-13</summary>

**Goal:** Fix missing/broken translation keys and remove dead keys from EN and HE locale files

Plans:
- [x] 01-01: Fix EN root install namespace and add missing Hebrew notification key
- [x] 01-02: Remove dead keys from EN/HE common.json and deprecated trail names from HE trail.json

</details>

---

### 🚧 v1.6 Auto-Rotate Landscape for Games (In Progress)

**Milestone Goal:** Automatically rotate to landscape mode when entering games on mobile, with API lock on Android and a playful rotate prompt on iOS.

**Phase Numbering Note:** Starting at Phase 02 (Phase 01 was Hebrew translations, complete).

#### Phase 02: Foundation - Orientation Detection & Prompt

**Goal**: Mobile users see a playful rotate prompt when entering games in portrait mode, with universal orientation detection that works on both iOS and Android.

**Depends on**: Phase 01

**Requirements**: ORIENT-01, ORIENT-02, ORIENT-03, ORIENT-04, ORIENT-05

**Success Criteria** (what must be TRUE):
  1. User entering any of the 4 game modes in portrait mode sees an animated rotate prompt overlay
  2. Rotate prompt disappears automatically when user rotates device to landscape
  3. User can dismiss the rotate prompt with a close button and it stays dismissed for the session
  4. Rotate prompt does not appear on desktop devices or when device is already in landscape
  5. Orientation detection works universally via CSS media queries (no reliance on Screen Orientation API)

**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Create useOrientation hook, useRotatePrompt hook, and RotatePromptOverlay component
- [ ] 02-02-PLAN.md — Integrate rotate prompt into all 4 game modes + visual verification

---

#### Phase 03: Game Layout Optimization

**Goal**: All game modes display optimized layouts in landscape orientation while remaining playable in portrait mode with degraded but functional layouts.

**Depends on**: Phase 02

**Requirements**: LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04

**Success Criteria** (what must be TRUE):
  1. VexFlow notation in sight reading game uses full horizontal space in landscape
  2. Settings modals render correctly in both landscape and portrait orientations
  3. VictoryScreen displays correctly in both orientations without layout breaking
  4. Games remain fully playable in portrait mode if user dismisses rotate prompt (WCAG 1.3.4 compliance)
  5. Orientation changes during gameplay trigger smooth layout recalculation without losing state

**Plans**: TBD

Plans:
- [ ] 03-01: Add landscape-optimized CSS layouts to all 4 game modes
- [ ] 03-02: Handle VexFlow re-render on orientation change with debouncing
- [ ] 03-03: Optimize modals (settings, victory) for landscape orientation

---

#### Phase 04: Platform-Specific Android Enhancement

**Goal**: Android PWA users get automatic landscape lock when entering games, with proper unlock on navigation away from games.

**Depends on**: Phase 03

**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04

**Success Criteria** (what must be TRUE):
  1. On Android PWA, device automatically locks to landscape orientation when entering a game
  2. On Android PWA, orientation unlocks when user navigates away from game (Back to Trail/dashboard)
  3. On iOS, users see the rotate prompt instead of orientation lock (graceful platform fallback)
  4. Orientation lock/prompt covers full game lifecycle from settings modal through victory screen
  5. Feature detection prevents errors when Screen Orientation API is unavailable

**Plans**: TBD

Plans:
- [ ] 04-01: Add platform detection utility (Android vs iOS)
- [ ] 04-02: Implement fullscreen + orientation lock for Android
- [ ] 04-03: Add orientation unlock cleanup on navigation and unmount

---

#### Phase 05: Accessibility & Internationalization

**Goal**: Rotate prompt and orientation features fully integrated with app's accessibility system, translated in English and Hebrew with RTL support.

**Depends on**: Phase 04

**Requirements**: A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05

**Success Criteria** (what must be TRUE):
  1. Rotate prompt animation respects user's reducedMotion preference (instant appearance if enabled)
  2. Screen readers announce rotate prompt with appropriate ARIA labels and live regions
  3. User can dismiss prompt and play in portrait without game blocking them (WCAG 1.3.4 escape hatch)
  4. Rotate prompt text is available in both English and Hebrew languages
  5. Rotate prompt layout properly mirrors for RTL (right-to-left) in Hebrew mode

**Plans**: TBD

Plans:
- [ ] 05-01: Integrate with AccessibilityContext for reducedMotion support
- [ ] 05-02: Add ARIA labels and screen reader announcements
- [ ] 05-03: Add English and Hebrew translations with RTL layout support

---

## Progress

**Execution Order:**
Phases execute in numeric order: 01 → 02 → 03 → 04 → 05

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Authorization Hardening | v1.0 | 4/4 | Complete | 2026-02-01 |
| 2. COPPA Compliance Foundation | v1.0 | 4/4 | Complete | 2026-02-01 |
| 3. Production Safeguards | v1.0 | 4/4 | Complete | 2026-02-01 |
| 4. Privacy Foundation | v1.0 | 3/3 | Complete | 2026-02-01 |
| 5. Consent Email Service | v1.1 | 2/2 | Complete | 2026-02-02 |
| 6. Trail Commitment | v1.2 | 2/2 | Complete | 2026-02-03 |
| 7. Tech Debt Cleanup | v1.2 | 2/2 | Complete | 2026-02-03 |
| 8. Validation Infrastructure | v1.3 | 3/3 | Complete | 2026-02-05 |
| 9. Bass Clef Redesign | v1.3 | 3/3 | Complete | 2026-02-05 |
| 10. Rhythm Redesign | v1.3 | 4/4 | Complete | 2026-02-05 |
| 11. Trail System Integration | v1.3 | 3/3 | Complete | 2026-02-05 |
| 12. E2E Verification | v1.3 | 1/1 | Complete | 2026-02-05 |
| 13. Celebration Foundation & Accessibility | v1.4 | 2/2 | Complete | 2026-02-05 |
| 14. Node Type Visual Distinction | v1.4 | 2/2 | Complete | 2026-02-08 |
| 15. VictoryScreen Celebration System | v1.4 | 3/3 | Complete | 2026-02-09 |
| 16. Dashboard XP Prominence | v1.4 | 2/2 | Complete | 2026-02-09 |
| 17. Boss Unlock Celebrations | v1.4 | 2/2 | Complete | 2026-02-09 |
| 18. Code Cleanup | v1.4 | 2/2 | Complete | 2026-02-09 |
| 19. CSS Foundation & Font Setup | v1.5 | 2/2 | Complete | 2026-02-10 |
| 20. Component Integration & Tab Navigation | v1.5 | 3/3 | Complete | 2026-02-10 |
| 21. Responsive Layout Rewrite | v1.5 | 3/3 | Complete | 2026-02-11 |
| 22. Performance Optimization & Deployment | v1.5 | 2/2 | Complete | 2026-02-11 |
| 01. Hebrew Translations | v1.6 prep | 2/2 | Complete | 2026-02-13 |
| 02. Foundation - Orientation Detection & Prompt | v1.6 | 0/2 | Not started | - |
| 03. Game Layout Optimization | v1.6 | 0/3 | Not started | - |
| 04. Platform-Specific Android Enhancement | v1.6 | 0/3 | Not started | - |
| 05. Accessibility & Internationalization | v1.6 | 0/3 | Not started | - |

**Total: 26 phases, 70 plans across 6 shipped milestones + 1 in progress**

---
*Last updated: 2026-02-13 — v1.6 roadmap created*
