# Roadmap: PianoApp

## Milestones

- ✅ **v1.0 Security Hardening** - Phases 1-4 (shipped 2026-02-01)
- ✅ **v1.1 Parental Consent Email Service** - Phase 5 (shipped 2026-02-02)
- ✅ **v1.2 Trail System Stabilization** - Phases 6-7 (shipped 2026-02-03)
- ✅ **v1.3 Trail System Redesign** - Phases 8-12 (shipped 2026-02-05)
- 🚧 **v1.4 UI Polish & Celebrations** - Phases 13-18 (in progress)

## Phases

<details>
<summary>✅ v1.0 Security Hardening (Phases 1-4) - SHIPPED 2026-02-01</summary>

### Phase 1: Authorization Hardening
**Goal**: Protect children's data with layered authorization
**Plans**: 4 plans

Plans:
- [x] 01-01: RLS policies using database state
- [x] 01-02: SECURITY DEFINER functions with auth checks
- [x] 01-03: Client-side service verification
- [x] 01-04: Secure logout with localStorage cleanup

### Phase 2: COPPA Compliance Foundation
**Goal**: Meet children's data protection regulations
**Plans**: 4 plans

Plans:
- [x] 02-01: Age gate with neutral DOB collection
- [x] 02-02: Parental consent blocking mechanism
- [x] 02-03: Data export functionality
- [x] 02-04: Data deletion with 30-day grace period

### Phase 3: Production Safeguards
**Goal**: Prevent abuse and protect shared device users
**Plans**: 4 plans

Plans:
- [x] 03-01: Rate limiting at database level
- [x] 03-02: Session timeout with inactivity detection
- [x] 03-03: Service worker auth exclusion
- [x] 03-04: Username anonymization in shared features

### Phase 4: Privacy Foundation
**Goal**: Eliminate third-party data collection
**Plans**: 3 plans

Plans:
- [x] 04-01: Self-hosted fonts via @fontsource
- [x] 04-02: Child-friendly error messages
- [x] 04-03: Production verification checklist

</details>

<details>
<summary>✅ v1.1 Parental Consent Email Service (Phase 5) - SHIPPED 2026-02-02</summary>

### Phase 5: Consent Email Service
**Goal**: Working parental consent email flow via Brevo API
**Plans**: 2 plans

Plans:
- [x] 05-01: Supabase Edge Function with Brevo integration
- [x] 05-02: End-to-end consent verification flow

</details>

<details>
<summary>✅ v1.2 Trail System Stabilization (Phases 6-7) - SHIPPED 2026-02-03</summary>

### Phase 6: Trail Commitment
**Goal**: Commit and validate 26-node trail redesign
**Plans**: 2 plans

Plans:
- [x] 06-01: Commit redesign with 8 node types
- [x] 06-02: Integration testing and validation

### Phase 7: Tech Debt Cleanup
**Goal**: Resolve accumulated technical debt
**Plans**: 2 plans

Plans:
- [x] 07-01: Memory Game trail integration fixes
- [x] 07-02: Documentation and code cleanup

</details>

<details>
<summary>✅ v1.3 Trail System Redesign (Phases 8-12) - SHIPPED 2026-02-05</summary>

### Phase 8: Validation Infrastructure
**Goal**: Build-time validation for node integrity
**Plans**: 3 plans

Plans:
- [x] 08-01: Validation script with DFS cycle detection
- [x] 08-02: Node type and XP economy validation
- [x] 08-03: Integration with npm build pipeline

### Phase 9: Bass Clef Redesign
**Goal**: 22 bass clef nodes with consistent pedagogy
**Plans**: 3 plans

Plans:
- [x] 09-01: Bass Unit 1 (C4 to F3)
- [x] 09-02: Bass Unit 2 (E3 to G3)
- [x] 09-03: Bass Unit 3 (F3 to C3)

### Phase 10: Rhythm Redesign
**Goal**: 36 rhythm nodes with duration-based progression
**Plans**: 4 plans

Plans:
- [x] 10-01: Rhythm Units 1-2 (quarter, half, whole notes)
- [x] 10-02: Rhythm Units 3-4 (eighth notes)
- [x] 10-03: Rhythm Units 5-6 (sixteenth notes)
- [x] 10-04: Rhythm path validation

### Phase 11: Trail System Integration
**Goal**: 93-node unified trail system with atomic cutover
**Plans**: 3 plans

Plans:
- [x] 11-01: expandedNodes.js with all 93 nodes
- [x] 11-02: Progress reset with XP preservation
- [x] 11-03: Legacy code removal

### Phase 12: E2E Verification
**Goal**: Human-verified working paths across all three trails
**Plans**: 1 plan

Plans:
- [x] 12-01: Manual E2E testing of all paths

</details>

### v1.4 UI Polish & Celebrations (In Progress)

**Milestone Goal:** Make the 93-node trail system feel rewarding with node-type celebrations, boss unlock events, visual distinction, and prominent XP display.

#### Phase 13: Celebration Foundation & Accessibility
**Goal**: Establish accessibility-first animation patterns before implementing any celebrations
**Depends on**: Phase 12
**Requirements**: CELEB-03, CELEB-04, CELEB-10
**Success Criteria** (what must be TRUE):
  1. All celebrations respect AccessibilityContext reducedMotion setting
  2. Standard celebrations complete within 500ms, boss celebrations within 2 seconds
  3. All celebration animations are skippable (click anywhere to dismiss)
  4. Accessibility-aware animation wrapper component is available for all celebration features
  5. Service worker excludes celebration components from cache (accessibility changes take effect immediately)
**Plans**: 2 plans
**Status**: Complete
**Completed**: 2026-02-05

Plans:
- [x] 13-01-PLAN.md -- Celebration constants, duration hook, and CelebrationWrapper component
- [x] 13-02-PLAN.md -- VictoryScreen animation accessibility integration

#### Phase 14: Node Type Visual Distinction
**Goal**: Provide visual identity for each of 8 node types across 93 trail nodes
**Depends on**: Phase 13
**Requirements**: VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-04, VISUAL-05, VISUAL-06
**Success Criteria** (what must be TRUE):
  1. Each node type displays a unique icon from lucide-react library
  2. Each node type shows color-coded badge matching its category
  3. Boss nodes display crown icon and gold accent making them visually distinct
  4. TrailNodeModal displays node type icon and color consistently with TrailNode
  5. Locked, available, and mastered states remain clear with new visual distinction
**Plans**: 2 plans
**Status**: Complete
**Completed**: 2026-02-08

Plans:
- [x] 14-01-PLAN.md -- Node type style system (icons, colors, custom SVGs, CSS animation)
- [x] 14-02-PLAN.md -- TrailNode and TrailNodeModal visual integration

#### Phase 15: VictoryScreen Celebration System
**Goal**: Create tiered celebration system that matches achievement significance
**Depends on**: Phase 13, Phase 14
**Requirements**: CELEB-01, CELEB-02, CELEB-05, CELEB-08, CELEB-09
**Success Criteria** (what must be TRUE):
  1. VictoryScreen shows tiered celebrations (minimal/standard/full/epic) based on achievement
  2. Confetti effects trigger for 3-star completions and boss wins
  3. Celebration messaging is node-type-specific (8 different messages for 8 node types)
  4. XP breakdown displays "Stars earned: +X, Node completion: +Y"
  5. Progress comparison shows "Better than X% of your previous scores"
**Plans**: TBD

Plans:
- [ ] 15-01: TBD
- [ ] 15-02: TBD
- [ ] 15-03: TBD

#### Phase 16: Dashboard XP Prominence
**Goal**: Make XP system visible and motivating throughout the app
**Depends on**: Phase 13
**Requirements**: XP-01, XP-02, XP-03, XP-04, XP-05, XP-06
**Success Criteria** (what must be TRUE):
  1. Dashboard displays XP progress bar showing current level (e.g., "Level 3: Apprentice")
  2. Dashboard shows "X XP to next level" indicator
  3. Dashboard shows current XP / threshold display (e.g., "450 / 700 XP")
  4. Level-up animation triggers when user crosses level threshold
  5. VictoryScreen shows XP gain with count-up animation effect
**Plans**: TBD

Plans:
- [ ] 16-01: TBD
- [ ] 16-02: TBD

#### Phase 17: Boss Unlock Celebrations
**Goal**: Create memorable milestone moments for boss node completions
**Depends on**: Phase 13, Phase 14, Phase 15
**Requirements**: CELEB-06, CELEB-07
**Success Criteria** (what must be TRUE):
  1. Boss unlock modal shows 3-stage sequence (celebration → unlock animation → next unit preview)
  2. Boss unlock modal only shows once per boss node (localStorage tracking prevents repetition)
  3. Boss unlock modal dismisses when user clicks anywhere or after auto-advance timer
  4. Boss unlock confetti uses musical-themed particles and elevated intensity
**Plans**: TBD

Plans:
- [ ] 17-01: TBD
- [ ] 17-02: TBD

#### Phase 18: Code Cleanup
**Goal**: Remove orphaned code and dead dependencies
**Depends on**: Phase 17
**Requirements**: CLEAN-01, CLEAN-02
**Success Criteria** (what must be TRUE):
  1. progressMigration.js file (175 lines) is removed from codebase
  2. No dead code remains from previous milestones (validated via grep)
  3. Bundle size analysis shows no unused dependencies
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18

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
| 15. VictoryScreen Celebration System | v1.4 | 0/TBD | Not started | - |
| 16. Dashboard XP Prominence | v1.4 | 0/TBD | Not started | - |
| 17. Boss Unlock Celebrations | v1.4 | 0/TBD | Not started | - |
| 18. Code Cleanup | v1.4 | 0/TBD | Not started | - |

---
*Last updated: 2026-02-05 after Phase 14 planning*
