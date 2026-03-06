# Requirements: PianoApp — v1.9 Engagement & Retention

**Defined:** 2026-03-04
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v1.9 Requirements

Requirements for engagement and retention improvements. Each maps to roadmap phases.

### Notifications

- [x] **NOTIF-01**: Parent can opt-in to push notifications for their child with COPPA-compliant consent
- [x] **NOTIF-02**: App requests Web Push API permission and registers service worker subscription
- [x] **NOTIF-03**: Student receives max 1 push notification per day
- [x] **NOTIF-04**: Notifications include context-aware messages (streak at risk, XP near level-up, daily goals waiting)
- [x] **NOTIF-05**: Student or parent can disable notifications from settings

### Streak Protection

- [x] **STRK-01**: Student earns a streak freeze consumable for every 7-day streak
- [x] **STRK-02**: Streak freeze automatically protects one missed day
- [x] **STRK-03**: Streak uses 36-hour grace period instead of midnight cutoff
- [x] **STRK-04**: Student receives 2x XP comeback bonus for 3 days after a broken streak
- [x] **STRK-05**: Parent or teacher can toggle weekend pass (streaks don't require weekend practice)

### Game Engagement

- [x] **GAME-01**: Notes Recognition shows combo/streak counter with multiplier (like Rhythm Trainer)
- [x] **GAME-02**: Student earns speed bonus for answering within 3 seconds
- [x] **GAME-03**: Notes Recognition uses lives system (3 lives instead of just scoring 0)
- [x] **GAME-04**: Visual "on fire" mode activates after 5 correct answers in a row
- [x] **GAME-05**: Note pool auto-grows by 1 note after 5 correct answers in a streak

### Progression

- [ ] **PROG-01**: XP level system extended from 15 to 30 levels with new themed names
- [ ] **PROG-02**: Prestige tiers unlock after level 30 (Maestro I, II, III...)
- [ ] **PROG-03**: Each level grants a unique accessory or title
- [ ] **PROG-04**: Dashboard shows weekly progress summary (days practiced, notes learned, XP earned)
- [ ] **PROG-05**: Student sees personal bests ("New record! Fastest perfect round!")
- [ ] **PROG-06**: Dashboard shows varied daily login messages ("Did you know? Beethoven practiced 4 hours a day!")
- [ ] **PROG-07**: Parent receives weekly progress email report via Brevo

### Node Modal UI

- [ ] **UI-01**: TrailNodeModal shows a large centered category icon in a glowing circular badge at the top
- [ ] **UI-02**: Skill notes render as colorful 3D bubble badges with sparkle decorations instead of flat pills
- [ ] **UI-03**: XP reward section displays a golden star icon with large XP value in a dedicated card
- [ ] **UI-04**: Modal layout is centered with clear title/subtitle hierarchy and spacious padding
- [ ] **UI-05**: All existing modal functionality is preserved (exercises, progress, premium lock, boss hints, prerequisites, RTL, navigation)

### Dashboard Redesign

- [ ] **DASH-01**: PlayNextButton renders as a large gradient pill CTA overlapping the hero bottom edge
- [ ] **DASH-02**: XPRing displays circular SVG progress with gold star center icon
- [ ] **DASH-03**: UnifiedStatsCard consolidates level, XP ring, streak, and daily goals summary with gradient border
- [ ] **DASH-04**: UnifiedStatsCard shows loading skeleton and supports RTL layout
- [ ] **DASH-05**: Dashboard hero is compact with centered avatar and level badge
- [ ] **DASH-06**: Old stat cards (4 floating icons), My Progress panel, and Assignments section are removed
- [ ] **DASH-07**: Practice Tools render as 3 circular glowing icon buttons with labels below
- [ ] **DASH-08**: DailyGoalsCard receives visual refresh (glow icons, thicker progress bars)
- [ ] **DASH-09**: i18n keys added for new dashboard elements in English and Hebrew

## Future Requirements

Deferred to v2.0+. Tracked but not in current roadmap.

### Content Expansion

- **CONT-01**: Trail Section 4: Sharps & Flats (~20 nodes)
- **CONT-02**: Trail Section 5: Key Signatures (~15 nodes)
- **CONT-03**: Trail Section 6: Two-Hand Basics (~20 nodes)
- **CONT-04**: Trail Section 7: Simple Melodies (~15 nodes)
- **CONT-05**: Trail Section 8: Advanced Rhythm (~15 nodes)
- **CONT-06**: Procedural "Endless Practice" mode
- **CONT-07**: Real Song Library (public domain first)

### Daily Engagement Loops

- **LOOP-01**: Daily challenge system (rotating unique challenges)
- **LOOP-02**: Weekly bonus events (Double XP, themed weeks)
- **LOOP-03**: Seasonal events framework (quarterly themed content)

### Advanced Gamification

- **ADV-01**: Prestige / mastery star tiers (Gold 4th, Diamond 5th)
- **ADV-02**: Spaced repetition "Rusty Skills" system
- **ADV-03**: Adaptive difficulty within sessions

### New Game Types

- **MINI-01**: Note Catcher (Guitar Hero style)
- **MINI-02**: Melody Puzzle (drag-and-drop note ordering)
- **MINI-03**: Rhythm Battle (pattern matching)
- **MINI-04**: Interval Training (higher/lower identification)

### Social & Competitive

- **SOCL-01**: Classroom challenges (teacher-set, anonymous)
- **SOCL-02**: Classroom leaderboard enhancements

### Narrative

- **NARR-01**: Story campaign wrapper
- **NARR-02**: Accessory system expansion

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New trail content (nodes/sections) | Content authoring is v2.0 scope; v1.9 is engagement infrastructure only |
| New mini-game types | High effort per game; v2.1 scope |
| Spaced repetition algorithm | Needs accuracy tracking infrastructure; v2.0 scope |
| Seasonal events | Requires event framework + calendar system; v2.2 scope |
| Classroom challenges | Requires teacher UI expansion; v2.2 scope |
| Story campaign | Requires illustration assets + narrative design; v2.0 scope |
| Adaptive difficulty | Algorithm research needed; v2.1 scope |
| In-app currency | COPPA dark pattern risk; earn-only accessories preferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NOTIF-01 | Phase 17 | Complete |
| NOTIF-02 | Phase 17 | Complete |
| NOTIF-03 | Phase 17 | Complete |
| NOTIF-04 | Phase 17 | Complete |
| NOTIF-05 | Phase 17 | Complete |
| STRK-01 | Phase 18 | Complete |
| STRK-02 | Phase 18 | Complete |
| STRK-03 | Phase 18 | Complete |
| STRK-04 | Phase 18 | Complete |
| STRK-05 | Phase 18 | Complete |
| GAME-01 | Phase 19 | Complete |
| GAME-02 | Phase 19 | Complete |
| GAME-03 | Phase 19 | Complete |
| GAME-04 | Phase 19 | Complete |
| GAME-05 | Phase 19 | Complete |
| PROG-01 | Phase 20 | Pending |
| PROG-02 | Phase 20 | Pending |
| PROG-03 | Phase 20 | Pending |
| PROG-04 | Phase 21 | Pending |
| PROG-05 | Phase 21 | Pending |
| PROG-06 | Phase 21 | Pending |
| PROG-07 | Phase 21 | Pending |
| UI-01 | Phase 22 | Pending |
| UI-02 | Phase 22 | Pending |
| UI-03 | Phase 22 | Pending |
| UI-04 | Phase 22 | Pending |
| UI-05 | Phase 22 | Pending |
| DASH-01 | Phase 23 | Pending |
| DASH-02 | Phase 23 | Pending |
| DASH-03 | Phase 23 | Pending |
| DASH-04 | Phase 23 | Pending |
| DASH-05 | Phase 23 | Pending |
| DASH-06 | Phase 23 | Pending |
| DASH-07 | Phase 23 | Pending |
| DASH-08 | Phase 23 | Pending |
| DASH-09 | Phase 23 | Pending |

**Coverage:**
- v1.9 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-06 — added DASH-01 through DASH-09 for Phase 23, UI-01 through UI-05 for Phase 22*
