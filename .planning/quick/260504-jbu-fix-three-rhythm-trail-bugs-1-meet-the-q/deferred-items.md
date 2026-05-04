# Deferred Items — Plan 260504-jbu-01

Logged during execution per Rule scope boundary (only fix issues directly caused
by the current task's changes; out-of-scope discoveries are deferred).

## Pre-existing lint parse error (unrelated)

- **File:** `src/components/settings/ParentZoneEntryCard.test.jsx:32:42`
- **Error:** `Parsing error: Cannot use keyword 'await' outside an async function`
- **Status:** Pre-existing — not introduced by Plan 260504-jbu changes.
- **Action:** Not fixed in this plan. Suggest filing a follow-up cleanup task or
  letting the next milestone's quality pass pick it up.

## Hebrew "ti-ti" Nikud (follow-up — see Task 2 SUMMARY)

`getSyllable("8_pair", "he")` falls back to the English `"ti-ti"`. Per
memory.md, Hebrew syllables with Nikud diacritics (e.g., possible `"טִי-טִי"`)
require explicit user approval before being added to either
`durationInfo.SYLLABLE_BY_UNITS_HE` or as an `info.syllableHe` override.

Action: ask user for the approved Hebrew form when convenient; until then the
English fallback prevents collision with `"טָה"` (Hebrew "ta") which was the
original bug-2 surface.
