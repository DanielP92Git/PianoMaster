# Phase 26: Restore Phase 23 UX Regression - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-12
**Phase:** 26-restore-ux-regression
**Areas discussed:** Restoration approach, Integration gap fixes, Hebrew Nikud confirmation, Test strategy

---

## Restoration Approach

| Option                       | Description                                                   | Selected |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| Re-implement from CONTEXT.md | Use Phase 23's detailed decisions as spec and implement fresh | ✓        |
| Git diff extraction          | Extract diffs from Phase 23 commits and manually apply        |          |
| You decide                   | Claude picks best approach                                    |          |

**User's choice:** Re-implement from CONTEXT.md (Recommended)
**Notes:** Cleanest approach since Phase 24/25 changed some of the affected files.

---

| Option                       | Description                                               | Selected |
| ---------------------------- | --------------------------------------------------------- | -------- |
| Same 3-plan structure        | Mirror Phase 23 exactly with integration gaps in 4th plan |          |
| Consolidate into fewer plans | Merge related changes for faster execution                |          |
| You decide                   | Claude determines optimal plan structure                  | ✓        |

**User's choice:** You decide
**Notes:** Claude has discretion on plan structure optimization.

---

## Integration Gap Fixes

| Option                    | Description                                                                                   | Selected |
| ------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| Inline with related plans | PAT-04 with RhythmReadingGame plan, PAT-06 with measure-count plan, pulse i18n with i18n plan | ✓        |
| Separate integration plan | Dedicated plan for all 3 gaps                                                                 |          |
| You decide                | Claude places them where they best fit                                                        |          |

**User's choice:** Inline with related plans (Recommended)
**Notes:** No separate integration plan needed.

---

| Option                 | Description                       | Selected |
| ---------------------- | --------------------------------- | -------- |
| פולס (transliteration) | Common in Israeli music education |          |
| דופק (native Hebrew)   | Hebrew word for pulse/heartbeat   | ✓        |
| Custom                 | User provides exact text          |          |

**User's choice:** דופק
**Notes:** Native Hebrew preferred over transliteration for pulse exercise type.

---

## Hebrew Nikud Confirmation

| Option         | Description                                                                     | Selected |
| -------------- | ------------------------------------------------------------------------------- | -------- |
| Yes, confirmed | Quarter: טָה, Eighth: טָה-טֶה, Half: טָה-אָה, Whole: טָה-אָה-אָה-אָה, Rest: הָס | ✓        |
| Need to update | Provide corrected values                                                        |          |

**User's choice:** Yes, confirmed
**Notes:** Values match prior session correction. Do not change without asking.

---

| Option                 | Description                           | Selected |
| ---------------------- | ------------------------------------- | -------- |
| Keep ti-ti for English | English Kodaly tradition              | ✓        |
| Change to ta-te        | Match Hebrew pedagogy                 |          |
| You decide             | Claude picks based on standard Kodaly |          |

**User's choice:** Keep ti-ti for English
**Notes:** English and Hebrew syllables intentionally differ for eighth notes: EN=ti-ti, HE=טָה-טֶה.

---

## Test Strategy

| Option                     | Description                                   | Selected |
| -------------------------- | --------------------------------------------- | -------- |
| Write fresh tests          | New tests based on current code + decisions   | ✓        |
| Extract Phase 23 test code | Pull original tests from git, adapt as needed |          |
| You decide                 | Claude picks best approach                    |          |

**User's choice:** Write fresh tests (Recommended)
**Notes:** Avoids stale test assumptions from Phase 23.

---

| Option                   | Description                                            | Selected |
| ------------------------ | ------------------------------------------------------ | -------- |
| Tests alongside features | Each plan includes tests for the feature it implements |          |
| Separate test plan       | All tests in a final plan                              |          |
| You decide               | Claude places tests where they best fit                | ✓        |

**User's choice:** You decide
**Notes:** Claude has discretion on test placement.

---

## Claude's Discretion

- Plan structure and wave assignment
- Test file placement (co-located or separate)
- Syllable toggle button styling
- VexFlow annotation font size and positioning
- Hebrew "Almost!" equivalent translation

## Deferred Ideas

None — discussion stayed within phase scope
