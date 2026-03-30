# Phase 7: Data Foundation + TrailMap Refactor - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 07-data-foundation-trailmap-refactor
**Areas discussed:** Ear Training tab identity, Placeholder UX for new games, Validation strictness, Tab config data shape

---

## Ear Training Tab Identity

### Color Palette

| Option | Description | Selected |
|--------|-------------|----------|
| Teal/Cyan | Distinct from purple/indigo theme, associated with listening/audio | :heavy_check_mark: |
| Amber/Gold | Warm contrast to cool purple theme, may clash with boss gold | |
| Rose/Pink | Soft and distinct, less conventional for audio | |

**User's choice:** Teal/Cyan
**Notes:** None

### Tab Icon

| Option | Description | Selected |
|--------|-------------|----------|
| Ear icon (lucide Ear) | Direct and literal, immediately communicates listening | :heavy_check_mark: |
| Headphones icon | Modern and playful, associated with audio | |
| No icon, text only | Keep consistent with existing icon-less tabs | |

**User's choice:** Ear icon (lucide Ear)
**Notes:** None

### All Tabs Get Icons

| Option | Description | Selected |
|--------|-------------|----------|
| All tabs get icons | Consistent, helps with 4-tab scannability | :heavy_check_mark: |
| Only Ear tab | Minimal change but inconsistent | |

**User's choice:** All tabs get icons
**Notes:** Music note for Treble, bass clef for Bass, metronome/drum for Rhythm, ear for Ear

### Tab Label

| Option | Description | Selected |
|--------|-------------|----------|
| Ear | Short, matches single-word style, fits mobile | |
| Ear Training | More descriptive, clearer for first-time users | :heavy_check_mark: |
| Listen | Action-oriented, child-friendly, unconventional | |

**User's choice:** Ear Training
**Notes:** None

---

## Placeholder UX for New Games

### Tap Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Coming Soon screen | Friendly placeholder with game name and back button | :heavy_check_mark: |
| Hide unimplemented nodes | Don't show nodes until games ship | |
| Disable tap, show lock | Greyed out with tooltip | |

**User's choice:** Coming Soon screen
**Notes:** None

### Component Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Shared component | One ComingSoon component, reusable for all types | :heavy_check_mark: |
| Inline per route | Each route gets its own minimal placeholder | |

**User's choice:** Shared ComingSoon component
**Notes:** None

---

## Validation Strictness

### Build Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Hard fail | Unknown exercise type = build error | :heavy_check_mark: |
| Warn only | Log warning but allow build | |

**User's choice:** Hard fail
**Notes:** Consistent with existing prerequisite validation pattern

### Validation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Type string only | Just validate type is a known constant | :heavy_check_mark: |
| Type + required config fields | Schema per exercise type | |

**User's choice:** Type string only
**Notes:** Config schema validation deferred, game-specific

---

## Tab Config Data Shape

### Config Richness

| Option | Description | Selected |
|--------|-------------|----------|
| Full config | id, label, categoryKey, icon, colors, bossPrefix per entry | :heavy_check_mark: |
| Minimal + derive styling | Config has id/label/categoryKey, styling derived separately | |

**User's choice:** Full config
**Notes:** Adding a tab = one array entry, no code changes

### Config Location

| Option | Description | Selected |
|--------|-------------|----------|
| src/data/constants.js | Co-located with NODE_CATEGORIES and EXERCISE_TYPES | :heavy_check_mark: |
| src/data/trailTabConfig.js | Dedicated file, imports from constants | |

**User's choice:** src/data/constants.js
**Notes:** Single source of truth for trail data

### Tab Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| Array position | Order = index, simpler | :heavy_check_mark: |
| Explicit order field | Each config has order: N | |

**User's choice:** Array position
**Notes:** None

### Unit Fetching

| Option | Description | Selected |
|--------|-------------|----------|
| Data-driven | Loop over TRAIL_TAB_CONFIGS dynamically | :heavy_check_mark: |
| Keep hardcoded + add ear | Add 4th explicit call | |

**User's choice:** Data-driven
**Notes:** Adding Ear Training tab auto-fetches its unit progress

### Boss Node Association

| Option | Description | Selected |
|--------|-------------|----------|
| Config-driven bossPrefix | Each tab config has bossPrefix field | :heavy_check_mark: |
| Keep current string matching | Hardcoded id.startsWith() | |

**User's choice:** Config-driven bossPrefix
**Notes:** No more hardcoded boss filtering

---

## Claude's Discretion

- Specific lucide icon choices for Treble, Bass, Rhythm tabs
- Exact teal/cyan shade within Tailwind palette
- ComingSoon component layout and tone
- Internal TrailMap refactoring approach

## Deferred Ideas

None — discussion stayed within phase scope
