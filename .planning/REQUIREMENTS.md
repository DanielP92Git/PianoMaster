# Requirements: PianoApp — v2.7 Instrument Practice Tracking

**Defined:** 2026-03-24
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v2.7 Requirements

Requirements for v2.7 milestone. Each maps to roadmap phases.

### Practice Logging

- [x] **LOG-01**: Student can log daily instrument practice via a button on the dashboard
- [x] **LOG-02**: Dashboard practice card shows today's log status (logged / not-yet / loading)
- [x] **LOG-03**: Student receives 25 XP for logging daily practice, once per day (idempotent via DB constraint)
- [ ] **LOG-04**: Student sees practice milestone celebrations at 5, 10, 21, and 30 day streak milestones

### Practice Streak

- [x] **STRK-01**: Student has a dedicated instrument practice streak counter on the dashboard, visually distinct from app-usage streak (piano/music icon, not fire)
- [x] **STRK-02**: Instrument practice streak respects weekend freeze (Shabbat pass) matching existing behavior
- [x] **STRK-03**: Practice streak uses independent DB table and service (not merged with app-usage streak)

### Push Notifications

- [x] **PUSH-01**: Student receives a daily "Did you practice today?" push notification (cron-triggered, separate from existing timer reminder)
- [x] **PUSH-02**: Practice check-in notification skips students who already logged for the day
- [x] **PUSH-03**: Notification coordinates with existing push system to prevent multiple notifications on the same day
- [ ] **PUSH-04**: On Android/desktop, notification shows interactive action buttons ("Yes, I practiced!" / "Not yet")
- [ ] **PUSH-05**: On iOS, tapping the notification opens the app with a practice log prompt (URL param fallback as primary path)

### Parent Features

- [ ] **PARENT-01**: Parent portal shows a calendar heatmap of the child's instrument practice history
- [ ] **PARENT-02**: Calendar heatmap covers 52-week rolling window with child-appropriate coloring (no red for missed days)

### Infrastructure

- [x] **INFRA-01**: Database migration creates `instrument_practice_logs` and `instrument_practice_streak` tables with RLS
- [x] **INFRA-02**: New tables include `ON DELETE CASCADE` for COPPA hard-delete compliance
- [x] **INFRA-03**: Practice log enforces one entry per student per day via UNIQUE constraint
- [x] **INFRA-04**: Practice log stores `local_date` (client timezone) to prevent timezone mismatch on streak/heatmap calculations
- [x] **INFRA-05**: Full EN/HE translations for all new UI elements

## Future Requirements

Deferred to v3+. Tracked but not in current roadmap.

### Practice Logging Enhancements

- **LOG-F01**: Student can retroactively log yesterday's practice (RLS-enforced date constraint)
- **LOG-F02**: Zero-state CTA card shown until first practice is logged (instead of 0-day streak)

### Parent Enhancements

- **PARENT-F01**: Practice summary added to existing weekly parent email report
- **PARENT-F02**: RTL calendar heatmap direction for Hebrew locale
- **PARENT-F03**: Teacher view of all students' practice heatmaps

### Tracking Enhancements

- **TRACK-F01**: Duration logging (minutes practiced per session)
- **TRACK-F02**: Mic-verified practice detection

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Quality rating (1-5 stars) | Developmentally inappropriate for 8-year-olds |
| Push notification reply text input | Unsupported on iOS, COPPA data burden |
| Notification frequency escalation | Uninstall trigger for parents |
| Never-breaking streak | Removes the motivating signal |
| Streak repair / XP buy-back | No spendable XP economy exists yet |
| Social practice leaderboards | COPPA prohibition without verifiable parental consent |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | Phase 2 | Complete |
| LOG-02 | Phase 2 | Complete |
| LOG-03 | Phase 2 | Complete |
| LOG-04 | Phase 5 | Pending |
| STRK-01 | Phase 2 | Complete |
| STRK-02 | Phase 2 | Complete |
| STRK-03 | Phase 2 | Complete |
| PUSH-01 | Phase 3 | Complete |
| PUSH-02 | Phase 3 | Complete |
| PUSH-03 | Phase 3 | Complete |
| PUSH-04 | Phase 3 | Pending |
| PUSH-05 | Phase 3 | Pending |
| PARENT-01 | Phase 4 | Pending |
| PARENT-02 | Phase 4 | Pending |
| INFRA-01 | Phase 2 | Complete |
| INFRA-02 | Phase 2 | Complete |
| INFRA-03 | Phase 2 | Complete |
| INFRA-04 | Phase 2 | Complete |
| INFRA-05 | Phase 2 | Complete |

**Coverage:**
- v2.7 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 — traceability table completed*
