# Phase 24: Multi-Angle Rhythm Games - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 24-multi-angle-rhythm-games
**Areas discussed:** Game mechanics & format, Card rendering, Trail node wiring, Component structure

---

## Game Mechanics & Format

| Option                       | Description                                   | Selected |
| ---------------------------- | --------------------------------------------- | -------- |
| "Which one is X?"            | Text prompt + 4 VexFlow cards, Duolingo-style | ✓        |
| "Match the name to the note" | Note name label + 4 cards, more reading-heavy |          |
| "Tap the odd one out"        | Find the different card among 4               |          |

**User's choice:** "Which one is X?" for Visual Recognition
**Notes:** Simple, clear format for 8-year-olds

| Option                       | Description                        | Selected |
| ---------------------------- | ---------------------------------- | -------- |
| VexFlow note → pick syllable | Note at top, 4 syllable text cards | ✓        |
| Syllable text → pick note    | Reverse direction                  |          |
| Both directions mixed        | Random alternation                 |          |

**User's choice:** VexFlow note → pick syllable for Syllable Matching

| Option                 | Description                        | Selected |
| ---------------------- | ---------------------------------- | -------- |
| 10 questions, no lives | Standard session, always finish    |          |
| 10 questions + 3 lives | Lives system like NotesRecognition |          |
| Timed rounds           | Time-limited arcade style          |          |

**User's choice:** 5 questions per exercise (modified from 10 during follow-up discussion about multi-exercise nodes)
**Notes:** User clarified that the purpose of multi-angle games is exercise diversity within nodes, not longer individual sessions

| Option                      | Description                          | Selected |
| --------------------------- | ------------------------------------ | -------- |
| Instant color flash + sound | Green/red + chime/buzz, auto-advance | ✓        |
| Animated celebration        | Confetti/sparkle                     |          |
| Minimal                     | Small icon only                      |          |

**User's choice:** Instant color flash + sound

| Option                  | Description                      | Selected |
| ----------------------- | -------------------------------- | -------- |
| Yes, include rests      | Quarter/half/whole rest as cards | ✓        |
| No rests                | Notes only                       |          |
| Visual Recognition only | Rests only in one game           |          |

**User's choice:** Yes, include rests in both games

| Option           | Description            | Selected |
| ---------------- | ---------------------- | -------- |
| Dot progress bar | 5 dots, green/red fill | ✓        |
| Simple counter   | "4/5" text             |          |
| No progress      | No indicator           |          |

**User's choice:** Dot progress bar

| Option                        | Description           | Selected |
| ----------------------------- | --------------------- | -------- |
| Node's rhythmConfig durations | Pedagogically aligned | ✓        |
| Fixed global set              | Always all durations  |          |
| Node + 1 ahead                | Preview next content  |          |

**User's choice:** Node's rhythmConfig durations for targets, global pool for distractors

| Option                           | Description                         | Selected |
| -------------------------------- | ----------------------------------- | -------- |
| Repeat with shuffled distractors | Same focus, varied wrong answers    |          |
| Mix visual rec + syllable        | Alternate game types in one session | ✓        |
| Fewer questions                  | 5 instead of 10                     |          |

**User's choice:** Mix via separate exercises — user clarified multi-exercise nodes ARE the variety solution
**Notes:** "that's the purpose of the multi-game nodes, to make the node more diverse and not repeating the same game for quarter-only"

| Option                 | Description            | Selected |
| ---------------------- | ---------------------- | -------- |
| Trail-only for now     | No free practice entry | ✓        |
| Also in practice modes | Add to practice grid   |          |

**User's choice:** Trail-only

| Option               | Description        | Selected |
| -------------------- | ------------------ | -------- |
| Full i18n from start | EN + HE with Nikud | ✓        |
| English only first   | Add Hebrew later   |          |

**User's choice:** Full i18n from start

---

## Card Rendering

| Option                      | Description            | Selected |
| --------------------------- | ---------------------- | -------- |
| Isolated note on mini-staff | Short staff segment    |          |
| Note icon only (no staff)   | Just the note shape    | ✓        |
| Full measure context        | Clef + time sig + note |          |

**User's choice:** Note icon only — no staff lines

| Option                          | Description                    | Selected |
| ------------------------------- | ------------------------------ | -------- |
| VexFlow with hidden staff lines | Render via VexFlow, hide lines |          |
| Static SVG sprites              | Pre-made SVG files             | ✓        |
| Canvas-drawn custom shapes      | Draw from scratch              |          |

**User's choice:** Static SVG sprites

| Option             | Description         | Selected    |
| ------------------ | ------------------- | ----------- |
| 2x2 grid           | Four cards in 2x2   | portrait ✓  |
| 1x4 horizontal row | Four cards in a row | landscape ✓ |
| Vertical stack     | Four cards stacked  |             |

**User's choice:** 2x2 in portrait, 1x4 in landscape

| Option                 | Description          | Selected |
| ---------------------- | -------------------- | -------- |
| No labels — icons only | No text on cards     | ✓        |
| Labels on all cards    | Note name below icon |          |
| Labels after answering | Reveal on feedback   |          |

**User's choice:** No labels

| Option                   | Description                | Selected |
| ------------------------ | -------------------------- | -------- |
| Same static SVG (larger) | Consistent visual language | ✓        |
| VexFlow on mini-staff    | More realistic             |          |
| Text name only           | Duration name as text      |          |

**User's choice:** Same static SVG, displayed larger in glass panel

| Option                      | Description                 | Selected |
| --------------------------- | --------------------------- | -------- |
| Glass cards with large text | bg-white/10, large syllable | ✓        |
| Colored pill buttons        | Playful pills               |          |
| Outlined cards              | White outline, transparent  |          |

**User's choice:** Glass cards with large centered text

| Option                      | Description             | Selected |
| --------------------------- | ----------------------- | -------- |
| Create custom SVGs          | Designed for this app   | ✓        |
| Extract from VexFlow glyphs | Reuse VexFlow internals |          |
| Music notation font         | Bravura/SMuFL           |          |

**User's choice:** Create custom SVGs in src/assets/icons/rhythm/

| Option                  | Description        | Selected |
| ----------------------- | ------------------ | -------- |
| Single eighth with flag | One note, one flag | ✓        |
| Beamed pair             | Two beamed eighths |          |
| Both available          | Both SVGs          |          |

**User's choice:** Single with flag. Syllable = "ti" (singular)

| Option                            | Description            | Selected |
| --------------------------------- | ---------------------- | -------- |
| Single sixteenth with double flag | Consistent with eighth | ✓        |
| Skip sixteenths                   | Add later              |          |
| Four-note group                   | Beamed group           |          |

**User's choice:** Single with double flag. Syllable = "ti-ka"

| Option                   | Description                 | Selected |
| ------------------------ | --------------------------- | -------- |
| Separate SVGs for dotted | dotted-quarter, dotted-half | ✓        |
| Dynamic dot overlay      | Base SVG + CSS dot          |          |
| Skip dotted              | Add later                   |          |

**User's choice:** Separate SVG files

| Option            | Description                | Selected |
| ----------------- | -------------------------- | -------- |
| White             | Consistent with text-white | ✓        |
| Accent indigo-300 | Design system accent       |          |

**User's choice:** White icons on glass background

| Option                    | Description            | Selected |
| ------------------------- | ---------------------- | -------- |
| Scale press + color flash | 0.95 scale + green/red | ✓        |
| Bounce + glow             | More playful           |          |

**User's choice:** Scale press + color flash. Reduced-motion: color only.

| Option               | Description               | Selected |
| -------------------- | ------------------------- | -------- |
| Min 80px, fill space | Responsive, large targets | ✓        |
| Fixed 120px          | Predictable size          |          |

**User's choice:** Min 80px, fill available space

| Option              | Description  | Selected |
| ------------------- | ------------ | -------- |
| 1x4 row, prompt top | Cards in row | ✓        |
| Keep 2x2 wider      | Same grid    |          |
| Side-by-side        | Split layout |          |

**User's choice:** 1x4 horizontal row with prompt above

| Option                | Description          | Selected |
| --------------------- | -------------------- | -------- |
| Above cards, centered | Natural reading flow | ✓        |
| Fixed top bar         | Pinned at top        |          |

**User's choice:** Above cards, centered

| Option        | Description         | Selected |
| ------------- | ------------------- | -------- |
| Top of screen | Above question text | ✓        |
| Below cards   | At bottom           |          |

**User's choice:** Top of screen, above question

| Option                    | Description          | Selected |
| ------------------------- | -------------------- | -------- |
| Large note in glass panel | Structured container | ✓        |
| Note left, cards right    | Split layout         |          |
| Floating note             | No container         |          |

**User's choice:** Glass panel with large SVG + "What syllable is this?" text, then answer cards below

---

## Trail Node Wiring

| Option                   | Description         | Selected |
| ------------------------ | ------------------- | -------- |
| Low-variety nodes only   | ≤2 unique durations | ✓        |
| All Discovery + Practice | Broader coverage    |          |
| Only Unit 1              | Smallest scope      |          |

**User's choice:** Low-variety nodes only (≤2 unique non-rest durations)

| Option                                 | Description       | Selected |
| -------------------------------------- | ----------------- | -------- |
| VISUAL_RECOGNITION + SYLLABLE_MATCHING | Descriptive names | ✓        |
| RHYTHM_VISUAL + RHYTHM_SYLLABLE        | Namespaced        |          |
| NOTE_ID + SYLLABLE_ID                  | Short             |          |

**User's choice:** VISUAL_RECOGNITION + SYLLABLE_MATCHING

| Option                     | Description     | Selected |
| -------------------------- | --------------- | -------- |
| After existing rhythm game | do → see → name | ✓        |
| Visual first               | see → do → name |          |

**User's choice:** rhythm_tap [0] → visual_recognition [1] → syllable_matching [2]

| Option                  | Description             | Selected |
| ----------------------- | ----------------------- | -------- |
| Minimal: questionCount  | Game reads rhythmConfig | ✓        |
| Explicit duration lists | More control            |          |
| No config               | Fixed defaults          |          |

**User's choice:** Minimal { questionCount: 5 }

| Option          | Description                     | Selected |
| --------------- | ------------------------------- | -------- |
| Full validation | Config + nodeType + enforcement | ✓        |
| Basic type only | Just valid enum                 |          |
| Skip            | No validator                    |          |

**User's choice:** Full validation with enforcement

| Option               | Description             | Selected |
| -------------------- | ----------------------- | -------- |
| Import from existing | rhythmVexflowHelpers.js | ✓        |
| Extract to shared    | New shared file         |          |
| Duplicate            | Copy into component     |          |

**User's choice:** Import from existing location

| Option                    | Description                 | Selected |
| ------------------------- | --------------------------- | -------- |
| Global pool minus correct | Random 3 from all durations | ✓        |
| Weighted by similarity    | Harder questions            |          |
| Context durations         | Only learned durations      |          |

**User's choice:** Global pool minus correct answer

| Option                | Description            | Selected |
| --------------------- | ---------------------- | -------- |
| Central DURATION_INFO | Single lookup object   | ✓        |
| Derive from existing  | Use DURATION_CONSTANTS |          |

**User's choice:** Central DURATION_INFO lookup object

| Option                     | Description        | Selected |
| -------------------------- | ------------------ | -------- |
| Standard exercise progress | 60/80/95% stars    | ✓        |
| Custom thresholds          | Different for quiz |          |

**User's choice:** Standard updateExerciseProgress

---

## Component Structure

| Option                  | Description          | Selected |
| ----------------------- | -------------------- | -------- |
| Two separate components | Distinct files       | ✓        |
| One shared QuizGame     | Parameterized        |          |
| Shared base + wrappers  | Hook + thin wrappers |          |

**User's choice:** Two separate components

| Option                    | Description                     | Selected |
| ------------------------- | ------------------------------- | -------- |
| Under rhythm-games/       | Alongside existing rhythm games | ✓        |
| New multi-angle-games/    | Separate directory              |          |
| Under notes-master-games/ | With quiz-style games           |          |

**User's choice:** Under rhythm-games/

| Option               | Description                  | Selected |
| -------------------- | ---------------------------- | -------- |
| /rhythm-mode/ prefix | Consistent with rhythm games | ✓        |
| /quiz-mode/ prefix   | New route group              |          |

**User's choice:** /rhythm-mode/visual-recognition-game and /rhythm-mode/syllable-matching-game

| Option                  | Description                 | Selected |
| ----------------------- | --------------------------- | -------- |
| Shared DurationCard.jsx | In components/ subdir       | ✓        |
| Inline in each game     | No shared component         |          |
| Two card components     | NotationCard + SyllableCard |          |

**User's choice:** Shared DurationCard.jsx in rhythm-games/components/

| Option                   | Description                  | Selected |
| ------------------------ | ---------------------------- | -------- |
| rhythm-games/utils/      | With other rhythm utils      | ✓        |
| src/data/                | App-level data               |          |
| rhythm-games/components/ | Co-located with DurationCard |          |

**User's choice:** rhythm-games/utils/durationInfo.js

---

## Claude's Discretion

- SVG sprite artwork design
- Quiz state machine implementation
- Sound effect selection
- Test structure
- Distractor shuffling algorithm
- Whether to extract shared quiz hook

## Deferred Ideas

- Free practice mode entry points
- Similarity-weighted distractors
- Reverse syllable direction (syllable → pick note)
