# Requirements: PianoApp v3.0

**Defined:** 2026-03-30
**Core Value:** Children's data must be protected and inaccessible to unauthorized users

## v3.0 Requirements

Requirements for Cleanup & Polish milestone. Addresses accumulated tech debt, broken tests, and deferred items from prior milestones.

### Trail Config

- [x] **TCFG-01**: Rhythm games read `rhythmPatterns` from trail node config to constrain which durations appear
- [x] **TCFG-02**: Trail difficulty values (`easy`/`medium`/`hard`) map to generator levels (`beginner`/`intermediate`/`advanced`)
- [x] **TCFG-03**: rhythmUnit7/8 test expectations updated to validate D-12 distribution (3x RHYTHM + 2x RHYTHM_TAP + 1x RHYTHM_DICTATION + 1x ARCADE_RHYTHM)

### Code Quality

- [ ] **QUAL-01**: `noteNameToMidi` consolidated to single utility (currently 3 implementations)
- [ ] **QUAL-02**: `calculateStars` consolidated to single utility (currently 2 implementations)
- [ ] **QUAL-03**: `verifyStudentDataAccess` duplicate in apiDatabase.js removed, imports from authorizationUtils.js
- [x] **QUAL-04**: AchievementsLegacy.jsx deleted (dead code, never imported)
- [x] **QUAL-05**: Non-migration files removed from supabase/migrations/ (DEBUG_, TEST_, README_)
- [ ] **QUAL-06**: console.log/debug calls gated behind `import.meta.env.DEV` or removed (366 -> target: <50 production calls)
- [x] **QUAL-07**: TeacherDashboard converted to React.lazy() (currently eager-loaded for all users)

### XP Migration

- [x] **XP-01**: TeacherDashboard `total_points` references migrated to XP terminology (~20 occurrences)

### Daily Goals

- [ ] **GOAL-01**: dailyGoalsService handles all exercise types including ear training (no hardcoded category arrays)

### Deploy

- [ ] **DEPLOY-01**: Deploy sequencing documented -- Supabase migration runs before Netlify JS serves updated code

### UAT

- [ ] **UAT-01**: Phase 08 human verification items completed (5 pending: rhythm games, piano tone, PWA cache)

## Future Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### i18n Completeness

- **I18N-01**: Trail modal skills badges show Hebrew note names (currently raw IDs like C4)
- **I18N-02**: TeacherDashboard fully translated to Hebrew (61+ hardcoded English strings)
- **I18N-03**: SightReadingGame UI strings moved to i18n (hardcoded English in input mode selection, anti-cheat)
- **I18N-04**: Achievement definitions translated (currently English-only)

### God Component Refactoring

- **REFACTOR-01**: SightReadingGame.jsx extracted into custom hooks (3,748 lines, 24 useState)
- **REFACTOR-02**: NotesRecognitionGame.jsx extracted into custom hooks (2,828 lines)
- **REFACTOR-03**: UnifiedGameSettings.jsx split into smaller components (2,289 lines)

### Asset Optimization

- **ASSET-01**: Piano WAV files (433 MB) moved to CDN/Supabase Storage with OGG/MP3 conversion

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| New game types or trail content | v3.0 is cleanup only -- no new features |
| God component refactoring | Large effort, defer to dedicated refactoring milestone |
| Full i18n audit | Separate milestone scope -- i18n completeness |
| Piano WAV CDN migration | Infrastructure change requiring CDN setup and testing |
| Instrument Recognition game | Unresolved audio clip sourcing (from v2.9) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TCFG-01 | Phase 12 | Complete |
| TCFG-02 | Phase 12 | Complete |
| TCFG-03 | Phase 12 | Complete |
| QUAL-01 | Phase 13 | Pending |
| QUAL-02 | Phase 13 | Pending |
| QUAL-03 | Phase 13 | Pending |
| QUAL-04 | Phase 13 | Complete |
| QUAL-05 | Phase 13 | Complete |
| QUAL-06 | Phase 14 | Pending |
| QUAL-07 | Phase 13 | Complete |
| XP-01 | Phase 13 | Complete |
| GOAL-01 | Phase 15 | Pending |
| DEPLOY-01 | Phase 15 | Pending |
| UAT-01 | Phase 15 | Pending |

**Coverage:**
- v3.0 requirements: 14 total
- Mapped to phases: 14/14
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Traceability updated: 2026-03-30*
