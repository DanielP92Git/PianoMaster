# Feature Landscape

**Domain:** Rhythm games (tap-along, dictation, arcade) and ear training games (pitch comparison, instrument recognition, interval identification) for a children's piano education PWA
**Researched:** 2026-03-26
**Overall confidence:** MEDIUM-HIGH (competitor analysis from public sources; pedagogy patterns verified across multiple music education sources; age-appropriateness cross-referenced with child development research; implementation constraints verified against existing codebase)

---

## Context: What This Research Answers

This is research for **v2.9 Game Variety & Ear Training** — a milestone adding 3 new rhythm game components, remapping 36 existing rhythm trail nodes to use a mix of game types, and adding a new Ear Training trail path (~12-15 nodes) with 3 new game types.

The primary audience is **8-year-old piano learners** using a gamified trail system. All new games must integrate with:
- The existing trail system (nodeId, exerciseIndex, VictoryScreen, XP awards)
- Existing `EXERCISE_TYPES` constant in `src/data/constants.js`
- Existing `AudioContextProvider` and `useAudioEngine` hook
- Existing landscape orientation lock and rotate prompt infrastructure
- Existing `useLandscapeLock`, `useRotatePrompt`, `SessionTimeoutContext` hooks

The question is: for each of the 6 new game types, what are table stakes features (missing = feels broken), differentiators (adds delight), and anti-features (avoid entirely)?

---

## Game Type 1: Rhythm Reading / Tap-Along

**What it is:** Player sees written rhythm notation and taps the screen to perform it in time. The game plays a metronome or backing track, shows the notation, and the player taps each beat.

**Closest existing analog:** `MetronomeTrainer.jsx` already implements this as its core mechanic — it plays a pattern, then the user taps to echo. The new game would shift focus to *reading notation first* and tapping in real time with it playing (not echo mode).

**Key reference apps:** Rhythm Cat, Rhythmic Village, Tonesavvy Rhythm Performance

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| VexFlow notation display showing the pattern | Users can't tap what they can't read — core game loop | Med | Already have `RhythmNotationRenderer.jsx` |
| Metronome count-in (1-2 beats before start) | Without count-in, first taps are always late — frustrating | Low | Already in MetronomeTrainer |
| Visual tap feedback on each beat (color flash, ripple) | Instant confirmation that tap was registered — critical for 8-year-olds | Low | Could reuse `TapArea.jsx` |
| PERFECT / GOOD / MISS per-tap scoring with visual label | Kids need immediate per-tap feedback, not end-of-pattern only | Low | MetronomeTrainer has this already |
| Timing window scaled to tempo (slower = more generous) | Without this, slow tempos feel impossibly strict | Low | `calculateTimingThresholds()` already exists |
| Session score → VictoryScreen | Integration point for XP awards and trail progress | Low | Pattern established across all games |
| Landscape layout | All games require landscape on mobile | Low | `useLandscapeLock` already exists |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Scrolling cursor on notation that advances with the music | Visual connection between written note and expected tap | Med | Ties notation visually to time — strong for readers |
| Sound feedback on tap (click or drum hit) | Audio confirmation creates physical connection to rhythm | Low | `useAudioEngine` has tap sounds |
| Per-beat color highlighting on the notation as it plays | Shows which note is "active" — reinforces notation reading | Med | Requires VexFlow coordination |
| Combo system for consecutive PERFECT/GOOD taps | Engagement layer from NotesRecognitionGame model | Low | Already have pattern from existing arcade mode |
| Difficulty: "strict mode" toggle for advanced users | Tight timing window as challenge — increases replayability | Low | Pass as config to thresholds |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Requiring mic input to detect taps | Adds permission complexity and latency; kids tap screens, not clap | Touchscreen tap detection only |
| Complex time signature introduction (7/8, 5/4) for early nodes | Cognitively overwhelming — 8-year-olds need 4/4 and 3/4 first | Stick to existing `rhythmConfig.timeSignature` progression |
| Penalizing for tapping before count-in | Punishing exploratory taps is frustrating for kids | Grace period: ignore taps during count-in |
| Displaying "Miss" prominently in red before pattern ends | Ruins remaining taps psychologically — "already failed" feeling | Show missed beats subtly; save score summary for end |
| Requiring 100% accuracy to advance | Creates indefinite loops for struggling kids | 3-star scoring (60/80/95%) like all other games |

### Infrastructure Dependencies

- `EXERCISE_TYPES.RHYTHM_TAP` — new constant needed
- `RhythmNotationRenderer.jsx` — reuse for notation display
- `TapArea.jsx` — reuse or extend
- `calculateTimingThresholds()` from MetronomeTrainer — extract to shared util
- `RhythmPatternGenerator.js` — reuse for pattern generation
- Existing trail node `rhythmConfig` fields: `tempo`, `durations`, `timeSignature`

---

## Game Type 2: Rhythm Dictation / Hear-and-Pick

**What it is:** A rhythm is played (audio only), and the player picks which written rhythm they just heard from 2-4 multiple-choice options. No performance required — pure aural identification.

**Closest existing analog:** MemoryGame pattern (multiple choice cards), but audio-driven rather than visual-matching.

**Key reference apps:** Rhythmic Village ("aural differentiation"), Rhythm Galaxy, Tonesavvy Rhythm Dictation, Rhythmicvillage "hear and pick which rhythm was played"

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Audio playback of the target rhythm (not notation first) | Core game loop — hear it, then pick it | Low | `useAudioEngine` plays patterns |
| "Play Again" button before answering | Kids need to replay; one hearing is not enough | Low | Simple state addition |
| 2-4 multiple choice rhythm cards showing VexFlow notation | The "pick" mechanic — must show written options | Med | VexFlow renders each option as small staff |
| Correct/wrong answer feedback with reveal animation | Immediate feedback is table stakes for 8-year-olds | Low | Green/red flash + show correct answer |
| Options differ in at least one obviously audible way | If options are too similar, impossible to distinguish — not fun | Med | Pattern generation logic must enforce contrast |
| Session score → VictoryScreen | Trail integration | Low | Standard pattern |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Watch the notation play along" reveal mode after answering | After choosing, show the notation animated while replaying — teaches reading | Med | High educational value |
| Slow-down button (half tempo replay) | Lets struggling kids hear the pattern more clearly | Low | Pass tempo * 0.5 to playback |
| Highlight wrong taps in the pattern after answer | "Here's where the rhythm changed" — pinpoints confusion | Med | Requires beat-level diff between options |
| 3 difficulty levels: 2 choices → 3 choices → 4 choices | Progressive challenge within same node type | Low | Config: `optionCount: 2|3|4` |
| "You heard X, this was Y" wrong-answer explanation | Teaches ear training principle explicitly | Low | Compare pattern names in i18n strings |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Options that are musically identical to untrained ears | Game becomes pure guessing — discouraging | Enforce minimum rhythmic distance between options |
| Requiring microphone for this game type | It's a listening game, not a performance game | Audio playback only, no mic |
| Showing notation before playing the audio | Defeats the ear-training purpose — players read instead of listen | Play audio first, then show all options simultaneously |
| More than 4 options at early levels | Too many choices overwhelm 8-year-olds | Cap at 4; start with 2 for first few nodes |
| Complex written rhythms as wrong options (16th note triplets when learning quarters) | Introducing unseen notation as wrong options is confusing | Wrong options must only use durations the student already knows |

### Infrastructure Dependencies

- `EXERCISE_TYPES.RHYTHM_DICTATION` — new constant needed
- `useAudioEngine` — play generated rhythms without mic
- `RhythmPatternGenerator.js` — generate both the answer and distractors
- `RhythmNotationRenderer.jsx` — render each choice as a compact staff
- Existing MemoryGame card-selection pattern (select → reveal) — reuse interaction model
- Trail node `rhythmConfig` — same config fields, adds `optionCount`

---

## Game Type 3: Arcade Rhythm (Falling Notes)

**What it is:** Notes/tiles fall down the screen from top to bottom. A hit zone sits at the bottom. Player taps the matching lane/key as tiles reach the hit zone. Guitar Hero / Magic Tiles style. Evaluates timing accuracy.

**Closest existing analog:** NoteSpeedCards uses horizontal conveyor animation; this is vertical falling with a hit zone. Genre reference: Magic Tiles 3, Piano Fire.

**Key reference apps:** Magic Tiles 3, Piano Tiles 2, Piano World (browser), Rhythm Doctor (pedagogical approach)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Falling note tiles synchronized to audio playback | Core game loop — tiles must match what's playing | High | Web Audio API timing + requestAnimationFrame |
| Hit zone at bottom with visible judgment ring | Player needs clear visual target — table stakes for the genre | Low | CSS/canvas hit zone |
| PERFECT / GOOD / MISS visual judgment per tile | Instant per-hit feedback is genre-defining | Low | Overlay text animations |
| Miss causes tile to fall through (visual failure) | Clear visual for missed notes — genre convention | Low | CSS animation |
| Lives system (3 lives, game over at 0) | Risk/reward tension — 8-year-olds enjoy lives system | Low | Already in NotesRecognitionGame |
| Score/combo counter display | Running score display is table stakes for arcade games | Low | Standard pattern |
| Session → VictoryScreen | Trail integration | Low | Standard |
| Landscape orientation only | Falling notes need vertical space — portrait is unplayable | Low | `useLandscapeLock` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Combo multiplier (x2, x3) with on-fire animation | Direct lift from NotesRecognitionGame arcade mode — proven for this app | Low | Reuse on-fire pattern |
| Note duration visualization (longer tiles for half notes) | Teaches duration concept visually — educational value | Med | Tile height proportional to beat count |
| Speed ramp (tiles fall faster as combo increases) | Creates flow zone — progressively harder within session | Med | Multiplier on fall velocity |
| Color coding by note duration | Quarter = blue, half = green, whole = gold — visual distinction | Low | Simple CSS classes |
| Particle effects on PERFECT hit | Satisfying delight moment | Low | CSS-only, respects reducedMotion |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Multiple simultaneous lanes (4+ lanes) for beginners | Splits attention — 8-year-olds can't track 4 lanes of falling notes | 1-2 lanes for early nodes; 3-4 lanes only in advanced nodes |
| Latency calibration UI | Kids can't use latency calibration tools | Pre-tune audio scheduling offset; use `useAudioEngine`'s existing timing |
| Song-based gameplay (licensed music) | Licensing complexity explicitly out of scope | Use generated rhythm patterns from `RhythmPatternGenerator.js` |
| Health bar that depletes slowly (invisible failure point) | Kids don't notice gradual drain — frustrating surprise | Discrete lives system (3 hearts) they can see |
| Falling speed tied to real tempo (80+ BPM = untappable) | Fast BPM + fall distance = reaction time impossible | Decouple fall speed from BPM; scale independently |

### Infrastructure Dependencies

- `EXERCISE_TYPES.ARCADE_RHYTHM` — new constant needed
- `useAudioEngine` — audio scheduling for playback
- `RhythmPatternGenerator.js` — pattern for tile sequence
- `requestAnimationFrame` game loop — must be new (no existing canvas/animation loop)
- Latency compensation — `useAudioEngine` has `latencyOffset`; reuse pattern
- On-fire mode logic — can extract from `NotesRecognitionGame.jsx`
- Lives system — extract from `NotesRecognitionGame.jsx`
- `useLandscapeLock` — required

---

## Game Type 4: Note Comparison (Higher / Lower)

**What it is:** Two notes are played in sequence (or simultaneously). Player picks whether the second note is HIGHER, LOWER, or the SAME pitch as the first. Progressive difficulty narrows the interval.

**Closest existing analog:** None in the current app. This is pure aural pitch discrimination — no notation, no keyboard, no mic. Just listen and choose.

**Key reference apps:** Theta Music Trainer "Pitch Compare", CheckYourPitch, Tonesavvy, Smart Board "Pitch: Higher or Lower", LAMI Find Notes (child-specific)

**Age-appropriateness:** Research confirms 8-year-olds have sufficient pitch discrimination capability, particularly with training. Widely used in elementary music programs from ages 5+. The "higher/lower" concept maps directly to "goes up/comes down" which children understand intuitively.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Two-button choice: HIGHER / LOWER | Core game loop — binary is the simplest possible format | Low | Two large touch-friendly buttons |
| Audio playback of both notes (not notation) | This is ear training — notation would defeat the purpose | Low | `useAudioEngine` plays single notes |
| Replay button before answering | Essential for this age group — some kids need 2-3 listens | Low | Simple state flag |
| Clear animated note direction icon (arrow up/down) after answer | Kids need visual confirmation of what "higher" means | Low | SVG arrow animation |
| Progressive difficulty: start far apart (octave), narrow over time | Curriculum design that matches cognitive development | Med | Config: `semitoneDistance` |
| Correct/wrong feedback with encouraging text | Immediate positive reinforcement | Low | Standard pattern |
| Session score → VictoryScreen | Trail integration | Low | Standard |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Piano keyboard visualization showing which keys were played after reveal | Connects sound to visual representation — reinforces note position knowledge | Med | Static SVG keyboard with highlight |
| "Same" as a third option for advanced nodes | Adds discrimination challenge for same-pitch detection | Low | Config: `includeSame: true` |
| Note names revealed after answer ("That was C, then E") | Connects ear training to note knowledge — cross-path reinforcement | Low | i18n note names |
| Ascending vs. descending framing (Step up/Step down) | Connects to melodic interval vocabulary taught in music classes | Low | UI label variation |
| Speed challenge mode: answer in under 3 seconds | Builds automaticity of pitch comparison — for advanced nodes | Med | Timer display |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Requiring mic pitch matching | Performance task is harder than identification task — different skill | Stay identification-only for this game type |
| Displaying staff notation for comparison | Staff reading skill is separate from aural comparison skill | Audio-only presentation |
| More than 3 choices at beginner level | Cognitive overload — HIGHER/LOWER is the natural binary | Start binary; add SAME only in later nodes |
| Using dissonant intervals early (minor 2nds = 1 semitone) | Too similar to hear at 8 years old without training | Start with Major 6th (9 semitones), narrow progressively |
| Penalizing fast answers | Some kids have good ears and answer quickly — no benefit to time penalty | No time limit on beginner nodes |

### Infrastructure Dependencies

- `EXERCISE_TYPES.PITCH_COMPARISON` — new constant needed
- `useAudioEngine` — play individual notes (already used in SightReadingGame)
- Web Audio API oscillator/sampler for note playback — `useAudioEngine` already handles this
- No mic, no VexFlow notation required
- Note frequency map — exists in `src/hooks/usePitchDetection.js` (can extract/reuse)
- New trail category `EAR_TRAINING` in `NODE_CATEGORIES` constant
- New trail tab in `TrailMap.jsx` TRAIL_TABS array
- New unit files: `earUnit1Redesigned.js` through `earUnit3Redesigned.js` (or similar)

---

## Game Type 5: Instrument Recognition (Timbre)

**What it is:** A short musical phrase is played by an instrument. Player picks which instrument family or specific instrument played it. Teaches timbre discrimination.

**Closest existing analog:** None in current app. Most similar interaction to MemoryGame (card choice) but stimulus is audio, not visual.

**Key reference apps:** BBC Instrument Matchup, Rhythmic Village (creature voice matching), Theta Music Trainer "Pitch Compare with different instruments", classroom Mystery Sound Game

**Age-appropriateness:** Timbre discrimination is developmentally appropriate from age 5+. By age 8, children can reliably distinguish instrument families (strings/winds/percussion) and many can identify common solo instruments. Research shows children engage strongly with "mystery sound" framing.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Audio playback of instrument sample | Core game loop — must sound like the real instrument | Med | Requires sampled audio files, not synthesis |
| 2-4 illustrated instrument choices | Visual anchor for instruments they may not have seen | Low | SVG illustrations or photos |
| Replay button | Essential for this age group | Low | Simple state |
| Correct/wrong reveal with instrument name | Kids should learn the instrument name, not just pick correctly | Low | i18n name + visual |
| Start with instrument families (piano vs. violin vs. trumpet) | Coarse discrimination before fine — pedagogically correct | Low | Early nodes: family level |
| Session score → VictoryScreen | Trail integration | Low | Standard |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| "Meet this instrument" reveal screen after first correct answer | Brief instrument fact or image — creates moment of delight | Low | Modal overlay with instrument image |
| Progressive difficulty: family → section → solo instrument | Treble/Bass/Rhythm mirrors this pattern — consistency | Med | Config: `discriminationLevel: 'family'|'section'|'instrument'` |
| Sound phrase matches the instrument's typical role | Violin plays violin-typical phrases, not piano phrases | Med | Requires curated audio library per instrument |
| Animation showing the instrument being "played" | Visual feedback connecting motion to sound | High | SVG animation — skip for MVP |
| Short explanation: "Strings make sound by bowing" | Micro-learning moment | Low | i18n text blob per instrument |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Synthesized instrument sounds | Synthesis sounds nothing like real instruments — defeats timbre teaching | Must use audio samples (MP3/OGG per instrument) |
| Obscure instruments early (theorbo, Ondes Martenot) | 8-year-olds have no reference point | Start with: piano, violin, trumpet, drum. Expand progressively |
| 6+ choices simultaneously | Cognitive overload — 2-3 for beginners, max 4 | Hard cap at 4 choices |
| Pure pitch content (same note, different instrument) | Conflates pitch discrimination with timbre discrimination | Use short melodies, not single notes, to emphasize timbre |
| Score-only without learning what was wrong | Kids will guess-cycle without feedback | Always show the correct instrument after wrong answer |

### Infrastructure Dependencies

- `EXERCISE_TYPES.INSTRUMENT_RECOGNITION` — new constant needed
- Audio sample files — significant new asset: requires ~5-10 MP3/OGG files per instrument minimum (piano, violin, trumpet, drum, flute, cello)
- `useAudioEngine` or direct `AudioContext.decodeAudioData` for sample playback
- MemoryGame card UI pattern — reuse for instrument choice cards
- No mic, no VexFlow notation
- Instrument image/illustration assets — SVG or optimized PNG per instrument
- This game type has the **largest new asset footprint** of all 6 game types

---

## Game Type 6: Interval Identification

**What it is:** Two notes are played in sequence (melodic interval). Player identifies the interval size as a named category: Step (2nd), Skip (3rd), Leap (5th+), or the specific interval name for advanced nodes. Builds on note comparison but adds the concept of distance.

**Closest existing analog:** Note Comparison game (Game Type 4) is the prerequisite — this is the harder next step. EarMaster, Tonesavvy, Theta Music Trainer all feature this.

**Key reference apps:** EarMaster, Theta Music Trainer "Two Tones (Major)", Tonesavvy interval game, ToneDear interval ear training, Session.town interval trainer

**Age-appropriateness:** "Step / Skip / Leap" terminology is used in elementary music education (grades 1-4). The specific interval names (Major 2nd, Perfect 5th) are typically introduced around grades 4-6 (ages 9-12). For 8-year-olds, the Step/Skip/Leap framing is age-appropriate; named intervals are a differentiator/advanced feature.

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Audio playback of ascending melodic interval | Core game loop | Low | `useAudioEngine` plays two notes in sequence |
| 3-choice answer: Step / Skip / Leap | Age-appropriate vocabulary for 8-year-olds | Low | Three large buttons |
| Replay button | Essential | Low | Standard |
| Correct/wrong feedback | Immediate feedback | Low | Standard |
| Association hint on wrong answer ("A Step is like C to D") | Helps anchor abstract concept to concrete reference | Low | i18n hint text per interval class |
| Session → VictoryScreen | Trail integration | Low | Standard |
| Ascending intervals first, descending later | Ascending is easier to perceive; pedagogically standard | Low | Config: `direction: 'ascending'|'descending'|'both'` |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Piano keyboard visualization showing the two notes after answer | Connects sound to visual distance on keyboard — "see the skip" | Med | Static SVG keyboard with range highlight |
| Reference song hint ("Step sounds like C-D in 'Happy Birthday'") | Most powerful learning anchor for interval recognition | Low | i18n hints per interval class |
| Advanced nodes: specific names (Minor 3rd, Perfect 5th) | Curriculum progression for motivated students | Low | Config: `labelStyle: 'category'|'name'` |
| Harmonic interval option (both notes simultaneously) | Adds chord awareness dimension for advanced nodes | Low | Config: `playStyle: 'melodic'|'harmonic'` |
| Staff notation visualization alongside audio | Connects ear training to notation reading (cross-path reinforcement) | Med | VexFlow two-note display |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Named interval terminology (Major 3rd, Perfect 4th) from the first node | Too abstract for 8-year-olds starting ear training | Use Step/Skip/Leap first; introduce names only in advanced nodes |
| Descending intervals before ascending | Descending is harder to perceive — introduce after ascending is mastered | Config-enforced ordering |
| All 12 chromatic interval sizes in early curriculum | Too many categories to learn at once | Early: just Step (m2/M2), Skip (m3/M3), Leap (5th+). Later: refine |
| No audio replay | Kids need multiple listens — omitting replay is frustrating | Always include replay button |
| Random interval selection without curriculum scaffolding | Jumping between intervals prevents pattern formation | Progressive disclosure: introduce one interval class per node |

### Infrastructure Dependencies

- `EXERCISE_TYPES.INTERVAL_ID` — new constant needed
- `useAudioEngine` — plays two notes in sequence (already handles note playback)
- Note frequency map / note name lookup — reuse from pitch detection utilities
- Piano keyboard SVG component (new, shared with Note Comparison game)
- No mic required
- VexFlow for optional notation display (already available)
- Note Comparison game (Type 4) is the recommended prerequisite in trail ordering

---

## Rhythm Trail Remapping: Game Mix Recommendations

The 36 existing rhythm nodes (Units 1-8) should be remapped to use a variety of game types. Current state: all use `EXERCISE_TYPES.RHYTHM` (MetronomeTrainer). Recommended distribution:

| Game Type | Proportion | Best Node Types | Rationale |
|-----------|-----------|-----------------|-----------|
| MetronomeTrainer (existing) | ~40% | Discovery, Practice | Echo-then-perform builds muscle memory first |
| Rhythm Reading / Tap-Along | ~30% | Practice, Mix-Up, Speed Round | Reading notation while tapping = reinforces theory |
| Rhythm Dictation / Hear-and-Pick | ~20% | Mix-Up, Boss lead-up | Aural discrimination complements reading |
| Arcade Rhythm | ~10% | Speed Round, Mini-Boss | High engagement for mastery confirmation |

**Rule:** No two consecutive nodes in the same unit should use the same game type. The variety itself creates engagement.

---

## Ear Training Trail Path: Recommended Curriculum

**12 nodes across 2 units** (expand to 3 units + boss nodes later):

### Unit 1: "Sound Detectives" (7 nodes)
Pitch comparison foundation + instrument introduction

| Node | Game Type | Skill | Notes |
|------|-----------|-------|-------|
| ear_1_1 | Note Comparison | Higher/Lower (far apart: major 6th+) | No prerequisites |
| ear_1_2 | Note Comparison | Higher/Lower (medium: 4th-6th) | Simple progression |
| ear_1_3 | Note Comparison | Higher/Lower + Same | Adds third option |
| ear_1_4 | Instrument Recognition | Family level (piano vs. violin vs. drum) | Introduces timbre |
| ear_1_5 | Instrument Recognition | Family level (4 families) | More options |
| ear_1_6 | Note Comparison | Narrower intervals (2nd-3rd) | Harder discrimination |
| boss_ear_1 | Mixed: Note Comparison + Instrument | Combined challenge | Mini-boss |

### Unit 2: "Interval Explorers" (7 nodes + 1 boss)
Interval identification progression

| Node | Game Type | Skill | Notes |
|------|-----------|-------|-------|
| ear_2_1 | Interval Identification | Step vs. Leap (ascending) | Requires ear_1_3 |
| ear_2_2 | Interval Identification | Step vs. Skip vs. Leap (ascending) | Three categories |
| ear_2_3 | Interval Identification | Steps only: M2 vs. m2 | Fine discrimination |
| ear_2_4 | Instrument Recognition | Specific instruments (violin vs. cello) | Harder timbre |
| ear_2_5 | Interval Identification | Descending intervals | Direction reversal |
| ear_2_6 | Interval Identification | Harmonic intervals (simultaneous) | New dimension |
| ear_2_7 | Interval Identification | Mixed ascending + descending | Consolidation |
| boss_ear_2 | Interval Identification + Instrument | Unit challenge boss | Full unit boss |

---

## Table Stakes Across All 6 New Game Types

Features every single new game must have regardless of type:

| Feature | Why Expected | Notes |
|---------|--------------|-------|
| Trail integration (nodeId, exerciseIndex → VictoryScreen) | Without this, nodes have no completion state | Pattern from all existing games |
| Landscape orientation lock | Mobile gameplay requires horizontal space | `useLandscapeLock` + `RotatePromptOverlay` |
| AudioInterruptedOverlay handling | iOS audio interruption recovery | `AudioInterruptedOverlay` component |
| SessionTimeout integration (pause during play, resume on exit) | Child safety on shared devices | `useSessionTimeout().pauseTimer()` pattern |
| `useAudioContext()` shared context | Prevents multiple AudioContext instances | `AudioContextProvider` wrapping |
| Replay/try-again button on GameOverScreen | 8-year-olds need immediate retry path | `GameOverScreen` already handles this |
| i18n: EN + HE keys for all UI text | Hebrew RTL support is required | Add to `src/locales/en/common.json` and `he/common.json` |
| Reduced motion respect | Accessibility requirement | `useAccessibility().reducedMotion` check |

---

## Differentiators (Cross-Game)

| Feature | Applies To | Value | Complexity |
|---------|------------|-------|------------|
| "New game type" badge on trail node (first time) | All new game types | Signals variety and curiosity | Low |
| Short 3-second animated tutorial on first play | All games | Eliminates confusion on unfamiliar mechanics | Med |
| Combo/streak counter visible during gameplay | Tap-Along, Arcade Rhythm | Keeps kids in flow state | Low |
| Node-type-specific VictoryScreen messages | All new games | "Great listening!" vs "You've got rhythm!" | Low |
| Cross-path XP bonus ("You did ear training AND rhythm today!") | All new games | Incentivizes path variety | Low |

---

## Anti-Features (Cross-Game)

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Microphone requirement for listening/identification games | Ear training games (types 4, 5, 6) are pure listening — mic adds latency and permission friction | Audio playback only for Types 4, 5, 6 |
| Score percentage displayed as a number to kids | "67%" means nothing to 8-year-olds | Stars (0-3) and encouraging text |
| Same game played 5 times in a row in one trail unit | Kills variety — the whole point of v2.9 is mixed game types | Hard cap: same game type maximum 2 consecutive nodes per unit |
| Complex settings modal before every game | Friction before play — kids just want to start | Progressive disclosure: smart defaults, advanced settings hidden |
| "Strict mode" as default at any level | Strict timing/accuracy windows as default cause immediate failure at 8yo skill level | Generous defaults; strict mode = optional differentiator only |
| Requiring audio samples that need a server CDN | Infrastructure overhead, offline issues | Self-host minimal sample set in `/public/audio/` |

---

## Feature Dependencies (Build Order)

```
Note Comparison (Type 4)       → base for Interval Identification (Type 6)
Rhythm Tap-Along (Type 1)      → reuses MetronomeTrainer infrastructure
Rhythm Dictation (Type 2)      → reuses RhythmPatternGenerator + MemoryGame card UI
Arcade Rhythm (Type 3)         → needs game loop animation (new complexity)
Instrument Recognition (Type 5) → needs audio sample assets (new asset pipeline)
Interval Identification (Type 6) → needs Note Comparison game working first

New EXERCISE_TYPES constants (all 6) → needed before any unit data can be written
New NODE_CATEGORIES.EAR_TRAINING → needed before Ear Training unit data
New TrailMap tab ("Ear") → needed before Ear Training path is visible
```

---

## MVP Recommendation

**Phase 1: Rhythm Game Variety (lower complexity)**
Prioritize:
1. Rhythm Reading / Tap-Along — reuses most existing MetronomeTrainer infrastructure
2. Rhythm Dictation / Hear-and-Pick — reuses RhythmPatternGenerator + audio engine
3. Remap 36 rhythm nodes to mix of MetronomeTrainer + Tap-Along + Dictation

Defer Arcade Rhythm to Phase 2 (requires new animation game loop — highest complexity of the 3 rhythm games).

**Phase 2: Ear Training Foundation**
Prioritize:
1. Note Comparison (Higher/Lower) — simplest new game mechanic, no assets needed
2. Interval Identification (Step/Skip/Leap) — builds directly on Note Comparison
3. New Ear Training trail path with ~12 nodes (Units 1-2)

Defer Instrument Recognition until audio sample assets are sourced (significant asset work — see Pitfalls).

**Phase 3: Full Arcade Rhythm + Instrument Recognition**
- Arcade Rhythm falling-notes game (animation game loop)
- Instrument Recognition (after audio sample library is assembled)

---

## Complexity Summary by Game Type

| Game Type | Implementation Complexity | Primary Risk | New Infrastructure Needed |
|-----------|--------------------------|--------------|--------------------------|
| Rhythm Reading / Tap-Along | Low-Med | Timing window feel; count-in UX | Shared timing threshold util |
| Rhythm Dictation / Hear-and-Pick | Low-Med | Distractor generation logic | None (reuses existing) |
| Arcade Rhythm (Falling Notes) | High | Animation loop + latency compensation | requestAnimationFrame game loop |
| Note Comparison (Higher/Lower) | Low | Note playback scheduling | Note frequency lookup util |
| Instrument Recognition | Med (code) + High (assets) | Audio sample sourcing + file size | Audio sample library + asset pipeline |
| Interval Identification | Low-Med | Step/Skip/Leap category mapping | Piano keyboard SVG component |

---

## Sources

- [Rhythmic Village app mechanics — Classplash](https://www.classplash.de/en/rhythmicvillage/)
- [Top 11 Rhythm Reading Apps — Midnight Music (2024)](https://midnightmusic.com/2024/05/top-11-rhythm-reading-apps-for-music-teachers/)
- [Theta Music Trainer game catalog — trainer.thetamusic.com](https://trainer.thetamusic.com/en/content/music-games)
- [Rhythm Dictation game — Tonesavvy](https://tonesavvy.com/music-practice-exercise/14/rhythm-dictation-game-eighth-notes/)
- [Rhythm Galaxy hear-and-pick mechanics — Good Music Academy](https://goodmusicacademy.com/best-rhythm-apps-games-for-kids/)
- [LAMI Find Notes children's ear training — App Store](https://apps.apple.com/us/app/lami-find-notes-childrens-ear-training-music-for-kids/id925269534)
- [Pitch Compare mechanics — CheckYourPitch](https://checkyourpitch.com/)
- [EarMaster interval game mechanics — earmaster.com](https://www.earmaster.com/)
- [Step/Skip/Leap interval teaching — fundamentalsofmusic.com](https://www.fundamentalsofmusic.com/melody-melodic-intervals-of-step-skip-leap.html)
- [Teaching timbre to children — Yellow Brick Road Music blog](https://yellowbrickroadblog.com/teaching-timbre-in-elementary-music/)
- [Mystery Sound instrument recognition — Yellow Brick Road blog](https://yellowbrickroadblog.com/an-easy-lesson-on-timbre-with-the-mystery-sound-game/)
- [Rhythm Doctor game mechanics (7th beat, polyrhythm pedagogy) — Wikipedia](https://en.wikipedia.org/wiki/Rhythm_Doctor)
- [Arcade rhythm game falling notes mechanics — fun-space.com](https://fun-space.com/industry-information/the-ultimate-guide-to-arcade-rhythm-game-types.html)
- [Pitch perception in children ages 8-10 — PMC neuroscience research](https://pmc.ncbi.nlm.nih.gov/articles/PMC11789513/)
- [UX Design for Kids — Ramotion Agency](https://www.ramotion.com/blog/ux-design-for-kids/)
- [Rhythm latency calibration in games — Rhythm Quest Devlog](https://ddrkirbyisq.medium.com/rhythm-quest-devlog-10-latency-calibration-fb6f1a56395c)
- [Web Audio API / Tone.js for instrument synthesis — tonejs.github.io](https://tonejs.github.io/)
- Codebase analysis: `src/components/games/rhythm-games/MetronomeTrainer.jsx`, `RhythmPatternGenerator.js`, `src/data/units/rhythmUnit1Redesigned.js`, `src/data/constants.js`, `src/App.jsx`, `src/components/trail/TrailMap.jsx`
