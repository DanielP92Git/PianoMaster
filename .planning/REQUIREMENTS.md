# Requirements: PianoApp v1.4

**Defined:** 2026-02-05
**Core Value:** Make the 93-node trail system feel rewarding with node-type celebrations, boss unlock events, visual distinction, and prominent XP display.

## v1.4 Requirements

Requirements for v1.4 UI Polish & Celebrations milestone. Each maps to roadmap phases.

### Celebration System

- [x] **CELEB-01**: VictoryScreen shows tiered celebrations based on achievement (minimal/standard/full/epic)
- [x] **CELEB-02**: Confetti effects trigger for high achievements (3-star completions, boss wins)
- [x] **CELEB-03**: Celebrations are always skippable (click anywhere to dismiss)
- [x] **CELEB-04**: Celebration animations respect AccessibilityContext reducedMotion setting
- [x] **CELEB-05**: Node-type-specific messaging in VictoryScreen (8 different messages for 8 node types)
- [x] **CELEB-06**: Boss unlock modal shows 3-stage sequence (celebration → unlock animation → next unit preview)
- [x] **CELEB-07**: Boss unlock modal only shows once per boss node (localStorage tracking)
- [x] **CELEB-08**: XP breakdown display shows "Stars earned: +X, Node completion: +Y"
- [x] **CELEB-09**: Progress comparison shows "Better than X% of your previous scores" in VictoryScreen
- [x] **CELEB-10**: Standard celebrations complete within 500ms, boss celebrations within 2 seconds

### Visual Distinction

- [x] **VISUAL-01**: TrailNode shows icon based on node type (8 different icons for 8 node types)
- [x] **VISUAL-02**: TrailNode shows color-coded badge based on node type
- [x] **VISUAL-03**: Boss nodes are visually distinct with crown icon and gold accent
- [x] **VISUAL-04**: Icon system uses lucide-react icons (BookOpen, Target, Zap, Trophy, Crown, etc.)
- [x] **VISUAL-05**: TrailNodeModal displays node type icon and color consistently with TrailNode
- [x] **VISUAL-06**: Locked/available/mastered states remain clear with new visual distinction

### XP Prominence

- [x] **XP-01**: Dashboard displays XP progress bar showing current level (e.g., "Level 3: Apprentice")
- [x] **XP-02**: Dashboard shows "X XP to next level" indicator
- [x] **XP-03**: Dashboard shows current XP / threshold display (e.g., "450 / 700 XP")
- [x] **XP-04**: Level-up animation triggers when user crosses level threshold (shimmer effect, badge unlock)
- [x] **XP-05**: VictoryScreen shows XP gain with count-up animation effect
- [x] **XP-06**: XP progress card respects AccessibilityContext reducedMotion setting

### Code Cleanup

- [x] **CLEAN-01**: Remove orphaned progressMigration.js file (175 lines unused)
- [x] **CLEAN-02**: Remove any other dead code identified during implementation

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Sound Effects (v2.0)

- **SOUND-01**: Celebration sound effects with volume control (requires A/B testing with classrooms)
- **SOUND-02**: User preference toggle for sound effects in settings

### Advanced Celebrations (v2.0)

- **CELEB-11**: Streak celebration animation (consecutive days practicing)
- **CELEB-12**: Unit completion celebration (finishing all nodes in a unit)
- **CELEB-13**: Path completion celebration (finishing all treble/bass/rhythm nodes)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Avatar customization / unlockable items | Research shows tangible rewards undermine intrinsic motivation for 8-year-olds ("overjustification effect") |
| Celebration sound effects (this milestone) | Classroom disruption risk, requires A/B testing with teachers, 5KB+ bundle increase |
| Long unskippable animations (>3s) | Research shows 60% user abandonment with >3s delays, violates WCAG animation guidelines |
| Social comparison features ("Your rank: #5") | Not appropriate for 8-year-old learners, creates anxiety rather than motivation |
| Leaderboard celebrations | COPPA concerns with exposing child usernames, social pressure inappropriate for age group |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CELEB-01 | Phase 15 | Complete |
| CELEB-02 | Phase 15 | Complete |
| CELEB-03 | Phase 13 | Complete |
| CELEB-04 | Phase 13 | Complete |
| CELEB-05 | Phase 15 | Complete |
| CELEB-06 | Phase 17 | Complete |
| CELEB-07 | Phase 17 | Complete |
| CELEB-08 | Phase 15 | Complete |
| CELEB-09 | Phase 15 | Complete |
| CELEB-10 | Phase 13 | Complete |
| VISUAL-01 | Phase 14 | Complete |
| VISUAL-02 | Phase 14 | Complete |
| VISUAL-03 | Phase 14 | Complete |
| VISUAL-04 | Phase 14 | Complete |
| VISUAL-05 | Phase 14 | Complete |
| VISUAL-06 | Phase 14 | Complete |
| XP-01 | Phase 16 | Complete |
| XP-02 | Phase 16 | Complete |
| XP-03 | Phase 16 | Complete |
| XP-04 | Phase 16 | Complete |
| XP-05 | Phase 16 | Complete |
| XP-06 | Phase 16 | Complete |
| CLEAN-01 | Phase 18 | Complete |
| CLEAN-02 | Phase 18 | Complete |

**Coverage:**
- v1.4 requirements: 24 total
- Mapped to phases: 24/24 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-09 after Phase 18 complete — all v1.4 requirements Complete*
