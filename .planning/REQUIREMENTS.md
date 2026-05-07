# Requirements: PianoApp v3.4 — Rhythm Games Responsive UX

**Defined:** 2026-05-07
**Core Value:** Children's data must be protected and inaccessible to unauthorized users.

**Milestone goal:** Drop the route-based landscape lock for rhythm games and make each renderer responsive across phone-portrait, phone-landscape, tablet-portrait, and tablet-landscape — so vertical-card-stack games (dictation) stop scrolling, and tablets get layouts that use the extra space.

## v3.4 Requirements

### Infrastructure

- [ ] **INFRA-01**: Rhythm routes (7 total: metronome-trainer, rhythm-reading, rhythm-dictation, arcade-rhythm, visual-recognition, syllable-matching, mixed-lesson) removed from `LANDSCAPE_ROUTES` in `src/App.jsx`; remain in `gameRoutes` (sidebar/header still hidden)
- [ ] **INFRA-02**: New `NeedsLandscapeContext` provider lets renderers declare `needsLandscape` via `useDeclareNeedsLandscape(boolean)` hook
- [ ] **INFRA-03**: `RotatePromptOverlay` shows only when `(context.needsLandscape) AND (viewport < 768px) AND (orientation === portrait)`
- [ ] **INFRA-04**: Phone vs. tablet cutoff = Tailwind `md` breakpoint (768px); tablets never see rotate prompt regardless of orientation

### Core Renderers — Non-Notation

- [ ] **CORE-01**: `DiscoveryIntroQuestion` renders without scroll on iPhone SE portrait (375×667); tablet-portrait variant added (single column with larger SVG)
- [ ] **CORE-02**: `SyllableMatchingQuestion` + `DictationChoiceCard` render as 2×2 card grid on phone-portrait, 1×4 row on wider viewports
- [ ] **CORE-03**: `PulseQuestion` tap zone fills viewport across all orientations and sizes
- [ ] **CORE-04**: `VisualRecognitionQuestion` renders 2×2 on phone-portrait, 1×4 on wider viewports
- [ ] **CORE-05**: `RhythmDictationQuestion` staff at top, choice cards in 2×2 grid on phone-portrait, 1×N on wider viewports — no scroll trap

### Notation Renderers — Content-Driven Prompt

- [ ] **NOTATION-01**: `RhythmReadingQuestion` computes `needsLandscape` from pattern length × time-signature factor; short patterns render in phone-portrait without prompt, long patterns trigger prompt on phone only
- [ ] **NOTATION-02**: `RhythmTapQuestion` uses the same `needsLandscape` heuristic — long-pattern variants trigger prompt on phone, all patterns render inline on tablet
- [ ] **NOTATION-03**: `needsLandscape` heuristic helper extracted to `src/components/games/rhythm-games/utils/needsLandscape.js` with unit test of the threshold

### Wrappers + Setup Audit

- [ ] **WRAPPER-01**: 6 standalone game wrappers (`RhythmDictationGame`, `RhythmReadingGame`, `MetronomeTrainer`, `VisualRecognitionGame`, `SyllableMatchingGame`, `MixedLessonGame`) audited for hardcoded landscape assumptions; fixes applied where needed
- [ ] **WRAPPER-02**: `RhythmGameSetup` and `RhythmGameSettings` setup screens render correctly across all 4 quadrants (phone/tablet × portrait/landscape)
- [ ] **WRAPPER-03**: Supporting components (`CountdownOverlay`, `BossIntroOverlay`, `FloatingFeedback`, `MetronomeDisplay`, `TapArea`) audited for responsive sanity

### Tablet 2-Column Optimization

- [ ] **TABLET-01**: Cards-based renderers (dictation, syllable-matching, visual-recognition) use real 2-col layout on tablet-landscape — not just centered with whitespace; uses Tailwind `md:`/`lg:` breakpoints

### ArcadeRhythmGame Portrait — Separate Phase

- [ ] **ARCADE-01**: Spike vertical lanes (top-down scrolling) on phone-portrait — ~10-min throwaway prototype to feel-test timing/visual experience
- [ ] **ARCADE-02**: Based on spike outcome, either ship vertical-lane redesign (with horizontal lanes preserved on tablet-landscape) OR declare `needsLandscape=true` and rely on rotate prompt from INFRA-02/03

## Future Requirements (deferred)

### Notes-Master Responsive

- **NM-01**: Notes-master games (NotesRecognitionGame, MemoryGame, SightReadingGame, NoteSpeedCards) made responsive using same `NeedsLandscapeContext` infrastructure

### Ear-Training Responsive

- **ET-01**: Ear-training games (NoteComparisonGame, IntervalGame) made responsive using same infrastructure

## Out of Scope

| Feature                                     | Reason                                                                                         |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Notes-master responsive                     | Deferred to future milestone — keep v3.4 focused on rhythm; same infra available for follow-up |
| Ear-training responsive                     | Same as above; smaller surface, can be a quick task later                                      |
| iOS native orientation lock                 | Not technically possible in Safari/PWA — rotate prompt remains the workaround                  |
| Audio/scoring/timing logic changes          | Out of scope; this is purely a layout/UX milestone                                             |
| Pattern generation logic changes            | Out of scope; renderers consume existing patterns unchanged                                    |
| New rhythm games or content                 | No new capabilities — only adapting existing ones                                              |
| DATA-02 (pulse hold path filter) carry-over | Unrelated to responsive work; reschedule for a future quick task                               |

## Traceability

Empty initially; populated during roadmap creation.

| Requirement | Phase | Status  |
| ----------- | ----- | ------- |
| INFRA-01    | TBD   | Pending |
| INFRA-02    | TBD   | Pending |
| INFRA-03    | TBD   | Pending |
| INFRA-04    | TBD   | Pending |
| CORE-01     | TBD   | Pending |
| CORE-02     | TBD   | Pending |
| CORE-03     | TBD   | Pending |
| CORE-04     | TBD   | Pending |
| CORE-05     | TBD   | Pending |
| NOTATION-01 | TBD   | Pending |
| NOTATION-02 | TBD   | Pending |
| NOTATION-03 | TBD   | Pending |
| WRAPPER-01  | TBD   | Pending |
| WRAPPER-02  | TBD   | Pending |
| WRAPPER-03  | TBD   | Pending |
| TABLET-01   | TBD   | Pending |
| ARCADE-01   | TBD   | Pending |
| ARCADE-02   | TBD   | Pending |

**Coverage:**

- v3.4 requirements: 18 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 18 ⚠️ (will be resolved by gsd-roadmapper)

---

_Requirements defined: 2026-05-07_
_Last updated: 2026-05-07 — initial v3.4 definition_
