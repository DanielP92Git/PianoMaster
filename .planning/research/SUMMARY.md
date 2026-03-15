# Project Research Summary

**Project:** v2.2 Sharps & Flats Trail Content Expansion
**Domain:** Piano learning PWA — accidentals content for beginner children (age 8)
**Researched:** 2026-03-15
**Confidence:** HIGH

## Executive Summary

The v2.2 Sharps & Flats milestone is primarily a data-authoring task, not an infrastructure build. Every capability required to teach accidentals — SVG note images for all sharps and flats, audio samples for all chromatic pitches, VexFlow `Accidental` modifier rendering, pitch detection across all 12 chromatic notes, and enharmonic normalization — already exists and is verified as working in the codebase. The core deliverable is four new unit data files (`trebleUnit4Redesigned.js`, `trebleUnit5Redesigned.js`, `bassUnit4Redesigned.js`, `bassUnit5Redesigned.js`) plus two targeted bug fixes that prevent existing code from silently discarding accidentals when games are launched via the trail routing layer.

The recommended approach is to separate sharps and flats into distinct units per clef (Unit 4 = sharps, Unit 5 = flats), introduce a maximum of one new accidental per Discovery node, and use the pedagogically established sequence: F#/C# for treble sharps, Bb/Eb for bass flats. This matches the Faber Piano Adventures and Alfred's Basic Piano Library order — circle-of-fifths sequence — which introduces accidentals children will encounter immediately in real beginner pieces. All new nodes are premium-only and gating works by absence from the `FREE_NODE_IDS` set — no positive gate configuration is required. The build-time validator (`npm run verify:patterns`) will automatically catch prerequisite cycles and schema violations in the new unit files.

The two critical risks are both code bugs, not data issues. First, the trail auto-start block in `NotesRecognitionGame.jsx` hardcodes `enableSharps: false, enableFlats: false`, which silently strips all accidentals from the game pool when launched from the trail — this must be fixed before any accidentals node can be tested end-to-end. Second, `patternBuilder.js` has a regex that only matches natural-note pitch strings, causing accidental pitches in sight reading exercises to fall through to a C4 fallback — this must be fixed before adding any `SIGHT_READING` exercise types to new nodes. Both fixes are surgical (3-5 lines each), precisely located in the research files, and carry minimal regression risk.

---

## Key Findings

### Recommended Stack

No new libraries are required. All four game modes (Note Recognition, Sight Reading, Memory Game, Boss Challenge) already support accidentals at the rendering and detection layer. VexFlow's `Accidental` modifier is already imported and used in `VexFlowStaffDisplay.jsx`. The `pitchy`-based pitch detector outputs all 12 chromatic sharp-form names natively. All WAV audio samples for flat-form pitches (Db, Eb, Gb, Ab, Bb across seven octaves) are already registered in `NOTE_AUDIO_LOADERS`. The SVG note images for all accidentals in treble and bass clef octave ranges 1–6 are already imported in `gameSettings.js`.

**Core technologies (all existing — zero new dependencies):**
- **VexFlow v5**: SVG music notation — `Accidental` class already handles `#` and `b` modifiers via `note.addModifier(new Accidental('#'), 0)`; verified working in `VexFlowStaffDisplay.jsx`
- **pitchy (McLeod Pitch Method)**: Pitch detection — `NOTE_NAMES` array includes all 12 chromatic tones; outputs sharp-form (`C#4`, `F#3`); enharmonic mapping to flat-form handled by existing `toFlatEnharmonic()` in `NotesRecognitionGame.jsx`
- **Klavier**: Keyboard input — already handles all 88 piano keys including black keys
- **Supabase RLS + `subscriptionConfig.js`**: Subscription gate — new nodes are premium by absence from `FREE_NODE_IDS`; `is_free_node()` Postgres function returns `FALSE` for unknown IDs by design

### Expected Features

**Must have (table stakes):**
- Pedagogically correct accidental sequence — F# before C# in treble (circle-of-fifths order), Bb before Eb in bass; this is the Faber/Alfred/RCM standard and is non-negotiable for the target audience
- One new accidental per Discovery node — cognitive load theory for 8-year-olds; all existing units follow this pattern
- Natural + accidental contrast in early nodes — pair F#4 with F4 and G4 so children see the visual distinction on the staff
- All four exercise types working with accidental note pools — Note Recognition, Sight Reading, Memory Game, Boss Challenge
- Subscription paywall enforcement — all 20+ new nodes are premium-only; no changes to `FREE_NODE_IDS`
- Boss nodes for each new unit — every existing unit ends with a Boss node; `boss_treble_4`, `boss_treble_5`, `boss_bass_4`, `boss_bass_5` required; must follow `boss_treble_N` ID convention
- `expandedNodes.js` updated with all four new unit file imports
- `npm run verify:patterns` passing before any deployment

**Should have (competitive advantage):**
- Natural-vs-accidental visual contrast in Discovery nodes — showing F4 and F#4 side-by-side teaches the half-step more concretely than any other approach
- Black key "between F and G" labeling in wrong-answer feedback — more concrete for 8-year-olds than "F sharp"
- Enharmonic Explorer node (optional) — "same key, two names" concept after both F# and Gb are known; adds curiosity value without theory overhead

**Defer to v2.3+:**
- Unit 4 Ledger Lines — pedagogically between Unit 3 (octave) and Unit 5 (accidentals), but accidentals within C4–C5 range do not require ledger lines, so the gap is acceptable for v2.2
- Key Signatures unit — natural signs, key context; separate research and milestone
- Remaining accidentals (Ab4, Db4, Gb4 treble; corresponding bass sharps) — 4 accidentals per unit maximum for cognitive load; extend in v2.3
- i18n for sharp/flat labels — Hebrew terms for "sharp" (דיאז) and "flat" (במול)

### Architecture Approach

The architecture follows a pure data-driven pattern. New unit files slot into the existing pipeline: `unitFile.js` → `expandedNodes.js` → `SKILL_NODES` → trail display and game routing. The subscription gate (React `isFreeNode()` + Postgres RLS) works by default for all new node IDs — no configuration needed. The game layer requires one fix in `NotesRecognitionGame.jsx` to derive `enableSharps`/`enableFlats` from `notePool` contents rather than hardcoding `false`. The rendering layer (`VexFlowStaffDisplay`, audio loader, note images) requires zero changes. Sharps are separated from flats into distinct unit files to avoid enharmonic confusion — the pitch detector outputs sharps only, and mixing both spellings for the same black key in one node pool creates unreachable answers via microphone.

**Major components and their v2.2 change status:**
1. `src/data/units/trebleUnit4Redesigned.js` (NEW) — 8 treble sharps nodes, `START_ORDER = 27`
2. `src/data/units/trebleUnit5Redesigned.js` (NEW) — 8 treble flats nodes, boss unlocks `accidental_master_badge`
3. `src/data/units/bassUnit4Redesigned.js` (NEW) — 8 bass sharps nodes, `START_ORDER = read from bassUnit3`
4. `src/data/units/bassUnit5Redesigned.js` (NEW) — 8 bass flats nodes, boss unlocks `bass_accidental_badge`
5. `src/data/expandedNodes.js` (MODIFY) — 4 new imports + spreads
6. `NotesRecognitionGame.jsx` (MODIFY) — ~3 lines in auto-start `useEffect` to derive `enableSharps`/`enableFlats` from `notePool`
7. `patternBuilder.js` (MODIFY) — one regex change on line 60 from `/^([A-G])(\d+)$/` to `/^([A-G][#b]?)(\d+)$/`

### Critical Pitfalls

1. **Trail auto-start hardcodes `enableSharps: false, enableFlats: false`** — Located at `NotesRecognitionGame.jsx` lines 524-525. Without this fix, all accidental pitches are silently stripped from every trail-launched session. Fix: derive both flags from `notePool` contents using `.some(p => p.includes('#'))` and `.some(p => p.includes('b') && p.length > 2)`.

2. **`patternBuilder.toVexFlowNote` drops accidentals** — Regex on line 60 matches only natural-note pitch strings; `F#4` falls through to a C4 fallback, causing sight reading to show wrong notes and score zero. Fix the regex before adding any `SIGHT_READING` exercise type to new nodes. Add `F#4`, `Bb4`, `Eb4` test cases to `patternBuilder.test.js`.

3. **Enharmonic mismatch in pitch detection** — Mic always outputs sharp-form (`C#4`); flat-form note pools (`Db4`) require normalization before comparison. `NotesRecognitionGame` already has `toFlatEnharmonic()` but `SightReadingGame`'s `scoreCalculator.js` `calculatePitchAccuracy()` needs verification — strict string comparison would score every correct flat-pool answer as zero via mic.

4. **Auto-grow arcade mode injects accidental notes into natural-notes sessions** — When accidentals units are added to `expandedNodes.js`, the auto-grow feature walks forward into `treble_4_1` nodes during natural-notes arcade play, injecting `F#4` into a session where `enableSharps: false`. Filter accidental pitches from auto-grow candidates when both flags are false.

5. **`expandedNodes.js` not updated** — New unit files are completely invisible to the trail if the import lines are missing. No error is thrown. Trail renders unchanged at 93 nodes. This is the most common missed step when adding unit files.

---

## Implications for Roadmap

Based on combined research, the milestone divides into three phases with two targeted code fixes as a mandatory prerequisite before any data authoring.

### Phase 0: Pre-Flight Fixes (Foundation)

**Rationale:** Both code bugs will silently corrupt behavior for every subsequent development and testing step. Fixing them first means all subsequent work can be tested accurately from day one. This phase contains no data authoring — only surgical code changes in three files.

**Delivers:** A working pipeline where accidental pitches in `notePool` actually reach the game, answer buttons, and VexFlow renderer when launched from the trail. Auto-grow no longer leaks accidentals into natural-note sessions.

**Addresses:** Prerequisite for all table-stakes features in v2.2.

**Avoids:**
- Pitfall 1 (trail auto-start strips accidentals — fix in `NotesRecognitionGame.jsx` auto-start effect)
- Pitfall 2 (patternBuilder drops accidentals — fix regex in `patternBuilder.js` line 60; add test cases)
- Pitfall 4 (auto-grow injects accidentals into natural-note sessions — add filter at same time as Pitfall 1 fix)

**Research flag:** No additional research needed. Both bug locations are identified at line-number precision with exact fix code in ARCHITECTURE.md.

### Phase 1: Treble Content (Data + Integration)

**Rationale:** Treble clef first — it is the more familiar clef for the target audience, SVG coverage for treble sharps/flats is most thoroughly verified, and the F#-first pedagogical sequence maps naturally to the sharp-form output of the pitch detector. Starting with treble permits full end-to-end testing before committing to the bass structure. Sharps before flats (Unit 4 before Unit 5) avoids enharmonic confusion from mixing spelling conventions within a learning sequence.

**Delivers:** `trebleUnit4Redesigned.js` (8 nodes, F#4/C#4/G#4 sharps, `boss_treble_4`), `trebleUnit5Redesigned.js` (8 nodes, Bb4/Eb4/Ab4 flats, `boss_treble_5` + `accidental_master_badge` unlock).

**Addresses features:** 10 treble accidentals nodes with premium gating, correct boss node IDs, badge unlock, `expandedNodes.js` wired.

**Avoids:**
- Anti-pattern: enharmonic mixing within a single node — sharps-only in Unit 4, flats-only in Unit 5
- Anti-pattern: wrong boss ID prefix — must be `boss_treble_4`, `boss_treble_5`
- Anti-pattern: order value collision — `START_ORDER = 27` (after `boss_treble_3` at order 26)
- Pitfall 7: `subscriptionConfig` — verify `isFreeNode()` returns false for all new treble IDs before wiring `expandedNodes.js`
- Pitfall 8: `expandedNodes.js` — add import line immediately after creating each unit file; verify with `getNodeById()` in browser console

**Needs investigation during implementation:**
- Verify `calculatePitchAccuracy()` in `scoreCalculator.js` handles enharmonic equivalence before adding any `SIGHT_READING` exercises — if strict string comparison is found, fix is localized to that function

### Phase 2: Bass Content (Data + Integration)

**Rationale:** Mirrors Phase 1 in structure. Separated because the bass `START_ORDER` must be read from `bassUnit3Redesigned.js` before authoring — this is a hard dependency, not a preference. Bass flats sequence (Bb/Eb/Ab/Db) is the standard bass clef introduction order because these flats appear in the most common beginner pieces in bass clef.

**Delivers:** `bassUnit4Redesigned.js` (8 nodes, F#3/C#3/G#3 sharps, `boss_bass_4`), `bassUnit5Redesigned.js` (8 nodes, Bb3/Eb3/Ab3/Db3 flats, `boss_bass_5` + `bass_accidental_badge` unlock).

**Addresses features:** 10 bass accidentals nodes, full premium paywall coverage for both clef paths.

**Avoids:**
- Pitfall 4 (order value collision): `START_ORDER` must be read from `bassUnit3Redesigned.js`, not guessed
- Anti-pattern: wrong boss ID — must be `boss_bass_4`, `boss_bass_5` exactly
- Anti-pattern: copy-paste from treble without updating `START_ORDER` constant

### Phase 3: Verification and QA

**Rationale:** Several pitfalls only surface at runtime or on specific device/locale configurations and cannot be detected by code review. A dedicated verification pass catches these before subscribers encounter them. The "Looks Done But Isn't" checklist from PITFALLS.md is the test plan.

**Delivers:** Signed-off verification checklist confirming all 8 failure modes tested on real configurations.

**Key verifications:**
- VexFlow accidental glyph spacing on 375px viewport — 3+ accidentals per measure may collide; increase `FIXED_STAVE_WIDTH_PER_BAR` if needed (Pitfall 5)
- Mic input matches flat-form pitches end-to-end — play Db4 on real piano/keyboard and verify correct answer scored (Pitfall 3)
- Free user sees paywall modal on `treble_5_1`; paid user can submit progress without RLS 403 (Pitfall 7)
- Hebrew locale — answer buttons for Db4 and C#4 are visually distinguishable (Pitfall 6)
- `boss_treble_5` completion triggers 3-stage boss modal and `accidental_master_badge` unlock
- Arcade mode on `treble_3_9` at 10-combo does not inject `F#4` from next unit (Pitfall 4 verification)
- Existing `boss_treble_3` completions remain visible after deploy

### Phase Ordering Rationale

- Phase 0 is non-negotiable first: without the two code fixes, all testing produces misleading results — nodes appear to launch but show wrong note pools, making bugs invisible during development
- Phase 1 before Phase 2: treble is the primary learning path; verified treble pipeline reduces risk when authoring identical bass structure; bass `START_ORDER` is also a dependency that requires existing code to be stable first
- Phase 3 last: runtime-only pitfalls (VexFlow spacing, mic enharmonics, Hebrew labels, subscription gate) cannot be verified until content exists on all four unit files

### Research Flags

Phases needing investigation during implementation (not planning):
- **Phase 1 and 2 (scoreCalculator enharmonic):** Verify `calculatePitchAccuracy()` in `scoreCalculator.js` handles enharmonic equivalence before adding any `SIGHT_READING` exercise types. Highest-risk gap for SightReadingGame. If strict string comparison is found, fix is a targeted change to that function.
- **Phase 2 (bass START_ORDER):** Read `bassUnit3Redesigned.js` to confirm last `order` value before setting `bassUnit4Redesigned.js` `START_ORDER`. Do not assign a value until confirmed.

Phases with standard patterns (no additional research needed):
- **Phase 0 (code fixes):** Both bugs precisely located with confirmed fix code in ARCHITECTURE.md
- **Phase 1 and 2 (node data):** Exact schema documented in ARCHITECTURE.md Pattern 1 with complete working example
- **Phase 3 (subscription gate):** Gate-by-absence pattern is well-understood; new nodes are premium by default

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings verified against working code in codebase; no external sources needed; zero new libraries |
| Features | HIGH | Codebase audit confirmed all infrastructure; pedagogy sequence from Faber/Alfred (MEDIUM confidence web sources) but sequence choice is low-risk |
| Architecture | HIGH | Entire codebase analyzed directly; all integration points verified at line-number precision with exact fix code |
| Pitfalls | HIGH | Bugs confirmed by direct regex/line inspection; runtime pitfalls drawn from verified code paths; all have documented prevention strategies |

**Overall confidence: HIGH**

### Gaps to Address

Three open questions require hands-on verification during Phase 1 implementation, not during planning:

- **`scoreCalculator.js` enharmonic matching:** `calculatePitchAccuracy()` may use strict string comparison for pitch matching in SightReadingGame. If so, a flat-form note pool (`Eb4`) will never match mic output (`D#4`). Verify before adding SIGHT_READING exercises to any new nodes. If strict comparison is found, fix is localized to `scoreCalculator.js`.

- **Bass unit order values:** Bass units 1-3 are stated to start at order 51, but the exact last order value in `bassUnit3Redesigned.js` is not confirmed in research. Read the file directly before setting `bassUnit4Redesigned.js` `START_ORDER`. Guessing causes silent duplicate-order corruption that breaks trail node traversal.

- **`accidentals: true` flag runtime behavior:** Research confirms the flag is metadata-only (nothing reads it at runtime). The auto-start fix in Phase 0 reads `notePool` directly, making the flag irrelevant for correctness. However, set it accurately on all new nodes as future tooling may validate it.

---

## Sources

### Primary (HIGH confidence — direct codebase analysis, 2026-03-15)
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` lines 518-536, 875-898 — auto-start block (confirmed hardcoded flags), auto-grow logic
- `src/components/games/sight-reading-game/utils/patternBuilder.js` line 60 — confirmed accidental regex gap
- `src/components/games/sight-reading-game/components/VexFlowStaffDisplay.jsx` lines 446-485 — confirmed accidental rendering via `Accidental` modifier
- `src/hooks/usePitchDetection.js` lines 25-38 — confirmed sharp-form `NOTE_NAMES` array
- `src/components/games/sight-reading-game/constants/gameSettings.js` lines 44-225 — confirmed full accidental SVG map for treble and bass
- `src/data/skillTrail.js` — `UNITS.TREBLE_5` and `UNITS.BASS_5` stubs confirmed present
- `src/config/subscriptionConfig.js` — gate-by-absence pattern confirmed; no migration needed
- `src/data/expandedNodes.js` — manual aggregation pattern confirmed
- VexFlow v5 `Accidental` class — valid codes `'#'`, `'b'` verified against working code in codebase

### Secondary (MEDIUM confidence — web sources)
- [Little Red Piano — Order of Sharps and Flats](https://littleredpiano.com/order-of-sharps-and-flats/) — circle-of-fifths pedagogical sequence for accidentals introduction
- [Faber Piano Adventures Level 1](https://pianoadventures.com/piano-books/accelerated-piano-adventures/level-1/accelerated-1-qa/) — F# introduced in Level 1, confirms standard sequence
- Alfred's Basic Piano Library — accidentals-before-key-signatures pedagogy confirmed in web research

### Tertiary (LOW confidence)
- Competitor analysis (Simply Piano, Yousician) — accidentals pedagogical order observation; not primary sources

---
*Research completed: 2026-03-15*
*Ready for roadmap: yes*
