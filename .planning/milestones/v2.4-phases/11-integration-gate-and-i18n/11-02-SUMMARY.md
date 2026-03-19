---
phase: 11-integration-gate-and-i18n
plan: 02
subsystem: i18n
tags: [i18n, translations, trail, en, he, key-signatures, compound-meter, syncopation]
dependency_graph:
  requires:
    - 11-01 (expandedNodes.js + skillTrail.js — all new unit files wired)
    - 08-02 (trebleUnit6/7 and bassUnit6/7 — node names verified)
    - 10-01 (rhythmUnit7Redesigned.js — node names verified)
    - 10-02 (rhythmUnit8Redesigned.js — node names verified)
  provides:
    - Full EN and HE translation coverage for all Phase 08-10 content
    - 28 unique node names in both locales
    - 6 new unit names in both locales
    - 5 new skill IDs in both locales
    - 6 new accessory IDs in both locales
  affects:
    - TrailMap UI (all new nodes display correctly in EN and HE)
    - TrailNodeModal (descriptions and unlock hints render in both locales)
    - UnitProgressCard (unit names display in both locales)
    - RTL Hebrew layout receives correct translations
tech_stack:
  added: []
  patterns:
    - Identity-mapped EN trail.json pattern (value = key for node names)
    - Unicode music symbols in values (♭, ♯) while keys use plain ASCII
    - Hebrew solfege key names: סול/רה/לה/פה/סי♭/מי♭ for G/D/A/F/Bb/Eb
    - Locked Hebrew terminology: מז'ור (Mazhor), סינקופה, משקל מורכב
key_files:
  modified:
    - src/locales/en/trail.json
    - src/locales/he/trail.json
  created: []
decisions:
  - "Node name keys in EN trail.json use ASCII flat/sharp (Meet Bb Major, Meet Eb Major) to exactly match name fields in source unit files; display values use Unicode ♭ (Meet B♭ Major)"
  - "Hebrew uses solfege key names throughout: G=סול, D=רה, A=לה, F=פה, Bb=סי♭, Eb=מי♭ per CONTEXT.md locked decision"
  - "Discovery nodes use הכירו את prefix (plural imperative for Meet); practice nodes use תרגול prefix (noun form) per CONTEXT.md locked decision"
  - "Compound meter = משקל מורכב; syncopation = סינקופה per locked Hebrew music terminology"
metrics:
  duration: 8 minutes
  completed_date: "2026-03-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
  files_created: 0
---

# Phase 11 Plan 02: i18n Translations Summary

Full English and Hebrew translation coverage for all new trail content — 28 unique node names, 6 unit names, 5 skill IDs, and 6 accessory IDs added to both trail.json locale files using locked Hebrew music terminology (solfege key names, mazhor, mishkal murkav, synkopa).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add English translations to EN trail.json | 206f646 | src/locales/en/trail.json |
| 2 | Add Hebrew translations to HE trail.json | d5d2d25 | src/locales/he/trail.json |

## What Was Built

### Task 1: EN trail.json (82 insertions)

Added entries in 6 sections:

**units.names (6 new entries):**
- Magic Dots, Speed Champions, Key Signatures: Sharps, Key Signatures: Mixed, Six-Eight Time, Off-Beat Magic

**nodes (28 unique entries):**
- Key signature nodes (14): Meet G/D/A/F Major, Bb/Eb Major variants, Key Sig Memory Mix-Up, Key Signature Master
- Rhythm Unit 7 (7): Two Big Beats, Feel the Pulse, Adding Quarters, Mixing It Up, Compound Cocktail, Quick Beats, Compound Commander
- Rhythm Unit 8 (7): Off-Beat Surprise, Between the Beats, Dotted Groove, Swing and Sway, Syncopation Shuffle, Rapid Syncopation, Rhythm Master

Node name keys use ASCII (Meet Bb Major) to match source files; display values use Unicode ♭ (Meet B♭ Major).

**skillNames (5 entries):**
- 68_compound_meter, quarter_note_68, eighth_note_68, syncopation_eighth_quarter, syncopation_dotted_quarter

**accessories (6 entries):**
- treble_keysig_sharps_badge, treble_keysig_master_badge, bass_keysig_sharps_badge, bass_keysig_master_badge, compound_badge, advanced_rhythm_badge

**descriptions (28 entries):** All new node names with full English descriptions including Unicode music symbols.

**unlockHints (3 entries):** Key Signature Master, Compound Commander, Rhythm Master.

### Task 2: HE trail.json (82 insertions)

Added Hebrew translations in all same sections using locked terminology:

**units.names:** נקודות קסם, אלופי המהירות, סימני מפתח: דיאזים, סימני מפתח: מעורב, משקל 6/8, קסם הסינקופה

**nodes (28 entries):** Solfege key names throughout:
- הכירו את סול מז'ור (Meet G Major), תרגול רה מז'ור (D Major Practice)
- הכירו את סי♭ מז'ור (Meet Bb Major), הכירו את מי♭ מז'ור (Meet Eb Major)
- שתי פעימות גדולות (Two Big Beats), מאסטר הקצב (Rhythm Master)
- מפקד המשקל המורכב (Compound Commander), הפתעת הסינקופה (Off-Beat Surprise)

**skillNames:** משקל מורכב 6/8, רבע ב-6/8, שמינית ב-6/8, סינקופה variants

**accessories:** תג מפתחות דיאז, תג מאסטר סימני המפתח, תג משקל מורכב, תג קצב מתקדם, etc.

**descriptions (28 entries):** Full Hebrew descriptions with musical terminology.

**unlockHints (3 entries):** Key Signature Master, Compound Commander, Rhythm Master in Hebrew.

## Verification Results

- `node -e "require('./src/locales/en/trail.json'); console.log('EN OK')"` — Passed
- `node -e "require('./src/locales/he/trail.json'); console.log('HE OK')"` — Passed
- All 28 node name keys verified in both locales via automated Node.js checks
- All 5 skill IDs verified in both locales
- All 6 accessory IDs verified in both locales
- All 6 unit names verified in both locales
- `npm run build` — Passed (exit 0, 39.57s)

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `src/locales/en/trail.json` modified — FOUND
- `src/locales/he/trail.json` modified — FOUND
- Commit 206f646 exists — FOUND
- Commit d5d2d25 exists — FOUND
- `npm run build` exit 0 — CONFIRMED
