# Architecture Patterns: v2.9 Game Variety & Ear Training

**Domain:** Piano learning PWA — rhythm game expansion + new ear training path
**Researched:** 2026-03-26
**Confidence:** HIGH — based on direct codebase inspection of all integration points

---

## Recommended Architecture

This milestone adds three new game components, remaps 36 rhythm trail nodes to use
mixed game types, and creates a new Ear Training trail path (~12-15 nodes) with its
own tab in the trail map. The architecture follows the same patterns already established
by NoteSpeedCards (v2.8) — the most recent precedent for integrating a new game type.

### High-Level Component Boundaries

```
src/
├── data/
│   ├── constants.js               MODIFY — add 5 new EXERCISE_TYPES + EAR_TRAINING category
│   ├── nodeTypes.js               no change needed
│   └── units/
│       ├── rhythmUnit*Redesigned.js   MODIFY — mix in new exercise types
│       └── earUnit1..3.js             CREATE — 3 new ear training unit files
├── data/expandedNodes.js          MODIFY — import + spread ear unit nodes
├── data/skillTrail.js             MODIFY — add EAR_TRAINING UNITS metadata
│
├── components/
│   ├── games/
│   │   ├── rhythm-games/
│   │   │   ├── RhythmReadingGame.jsx    CREATE — rhythm reading / tap-along
│   │   │   ├── RhythmDictationGame.jsx  CREATE — hear-and-pick rhythm dictation
│   │   │   └── ArcadeRhythmGame.jsx     CREATE — arcade falling beats
│   │   └── ear-training-games/          CREATE dir
│   │       ├── NoteComparisonGame.jsx   CREATE — higher/lower pitch comparison
│   │       ├── InstrumentRecogGame.jsx  CREATE — identify instrument by sound
│   │       └── IntervalGame.jsx         CREATE — identify intervals by ear
│   ├── trail/
│   │   ├── TrailMap.jsx           MODIFY — add Ear Training tab
│   │   └── TrailNodeModal.jsx     MODIFY — add 5 new exercise type names + routing
│   └── dashboard/
│       └── SkillPathProgress.jsx  CREATE — 2-3 path progress indicators card
│
├── hooks/
│   └── usePianoSampler.js         CREATE — multi-note piano playback from existing WAV library
│
└── App.jsx                        MODIFY — add 3 rhythm routes + 3 ear training routes
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `RhythmReadingGame` | Display VexFlow rhythm notation, play audio, user taps on screen | `AudioContextProvider`, `VictoryScreen`, `SessionTimeoutContext` |
| `RhythmDictationGame` | Play rhythm audio, present 3-4 visual pattern choices to pick | `usePianoSampler`, `VictoryScreen`, `SessionTimeoutContext` |
| `ArcadeRhythmGame` | Falling beat objects, tap to catch, combo system | `useAudioEngine`, `VictoryScreen`, `GameOverScreen` |
| `NoteComparisonGame` | Play two notes, pick higher/lower/same | `usePianoSampler`, `VictoryScreen` |
| `InstrumentRecogGame` | Play audio clip, pick instrument from image grid | static `Audio` element, `VictoryScreen` |
| `IntervalGame` | Play two-note interval, identify from labeled choices | `usePianoSampler`, `VictoryScreen` |
| `usePianoSampler` | Load WAV files from public dir, decode via AudioContext, play by note name | `AudioContextProvider` |
| `SkillPathProgress` | Show 3 mini path summaries (last completed node, next node, stars earned) | `skillProgressService`, `useUser` |
| `TrailMap` | Tab switching now includes 4th "Ear" tab | `NODE_CATEGORIES.EAR_TRAINING` |
| `TrailNodeModal` | Routes new exercise types to correct game components | `navigate()` |

---

## Data Flow: New Exercise Types End-to-End

### Step 1 — Constants (data layer foundation)
New exercise types are declared in `src/data/constants.js`:

```javascript
export const EXERCISE_TYPES = {
  // Existing
  NOTE_RECOGNITION:   'note_recognition',
  SIGHT_READING:      'sight_reading',
  RHYTHM:             'rhythm',
  MEMORY_GAME:        'memory_game',
  BOSS_CHALLENGE:     'boss_challenge',
  NOTE_CATCH:         'note_catch',

  // New — Rhythm games
  RHYTHM_READING:     'rhythm_reading',    // Read notation + tap along
  RHYTHM_DICTATION:   'rhythm_dictation',  // Hear rhythm + pick pattern
  ARCADE_RHYTHM:      'arcade_rhythm',     // Falling beats arcade

  // New — Ear training
  NOTE_COMPARISON:    'note_comparison',   // Higher/lower pitch
  INTERVAL_ID:        'interval_id',       // Identify interval
  INSTRUMENT_RECOG:   'instrument_recog',  // Identify instrument
};
```

Add `EAR_TRAINING` to `NODE_CATEGORIES` in the same file:

```javascript
export const NODE_CATEGORIES = {
  TREBLE_CLEF:  'treble_clef',
  BASS_CLEF:    'bass_clef',
  RHYTHM:       'rhythm',
  BOSS:         'boss',
  EAR_TRAINING: 'ear_training',   // NEW
};
```

### Step 2 — TrailNodeModal routing
Add cases to the `switch (exercise.type)` block in `TrailNodeModal.jsx`
(currently at lines 188-212, inside `navigateToExercise`):

```javascript
case 'rhythm_reading':
  navigate('/rhythm-mode/rhythm-reading-game', { state: navState });
  break;
case 'rhythm_dictation':
  navigate('/rhythm-mode/rhythm-dictation-game', { state: navState });
  break;
case 'arcade_rhythm':
  navigate('/rhythm-mode/arcade-rhythm-game', { state: navState });
  break;
case 'note_comparison':
  navigate('/ear-training-mode/note-comparison-game', { state: navState });
  break;
case 'interval_id':
  navigate('/ear-training-mode/interval-game', { state: navState });
  break;
case 'instrument_recog':
  navigate('/ear-training-mode/instrument-recog-game', { state: navState });
  break;
```

Also add to `getExerciseTypeName()` switch (display labels) and to the
`handleNextExercise` navigation switch inside each new game component.

### Step 3 — App.jsx routes
Add 6 new lazy routes inside the `ProtectedRoute` block. All game routes use
`AudioContextProvider` wrapping, consistent with existing games:

```javascript
// Rhythm games
const RhythmReadingGame   = lazyWithRetry(() => import('./components/games/rhythm-games/RhythmReadingGame'));
const RhythmDictationGame = lazyWithRetry(() => import('./components/games/rhythm-games/RhythmDictationGame'));
const ArcadeRhythmGame    = lazyWithRetry(() => import('./components/games/rhythm-games/ArcadeRhythmGame'));

// Ear training games
const NoteComparisonGame  = lazyWithRetry(() => import('./components/games/ear-training-games/NoteComparisonGame'));
const IntervalGame        = lazyWithRetry(() => import('./components/games/ear-training-games/IntervalGame'));
const InstrumentRecogGame = lazyWithRetry(() => import('./components/games/ear-training-games/InstrumentRecogGame'));

// Routes
<Route path="/rhythm-mode/rhythm-reading-game"
  element={<AudioContextProvider><RhythmReadingGame /></AudioContextProvider>} />
<Route path="/rhythm-mode/rhythm-dictation-game"
  element={<AudioContextProvider><RhythmDictationGame /></AudioContextProvider>} />
<Route path="/rhythm-mode/arcade-rhythm-game"
  element={<AudioContextProvider><ArcadeRhythmGame /></AudioContextProvider>} />
<Route path="/ear-training-mode/note-comparison-game"
  element={<AudioContextProvider><NoteComparisonGame /></AudioContextProvider>} />
<Route path="/ear-training-mode/interval-game"
  element={<AudioContextProvider><IntervalGame /></AudioContextProvider>} />
<Route path="/ear-training-mode/instrument-recog-game"
  element={<AudioContextProvider><InstrumentRecogGame /></AudioContextProvider>} />
```

### Step 4 — Landscape lock
Add all 6 new route paths to the `LANDSCAPE_ROUTES` array in `App.jsx`'s
`OrientationController` component.

### Step 5 — Trail map tab
Add `{ id: 'ear', label: 'Ear', categoryKey: 'EAR_TRAINING' }` to `TRAIL_TABS` in
`TrailMap.jsx`. The existing tab rendering, URL persistence (`?path=ear`), and ARIA
keyboard navigation are fully generic — no structural changes required.

---

## Patterns to Follow

### Pattern 1: Game Component Structure (follow NoteSpeedCards / MetronomeTrainer)

Every new game component must follow this structural checklist. Deviation from this
causes session timeout, landscape lock, and trail navigation to break.

```javascript
export function RhythmReadingGame() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Read trail state from location (same field names as all other games)
  const nodeId             = location.state?.nodeId || null;
  const nodeConfig         = location.state?.nodeConfig || null;
  const trailExerciseIndex = location.state?.exerciseIndex ?? null;
  const trailTotalExercises = location.state?.totalExercises ?? null;
  const trailExerciseType  = location.state?.exerciseType ?? null;

  // 2. Landscape lock (both hooks required)
  useLandscapeLock();
  const { shouldShowPrompt, dismissPrompt } = useRotatePrompt();

  // 3. Session timeout pause/resume
  const { pauseTimer, resumeTimer } = useSessionTimeout();

  // 4. Audio context (shared — do NOT create new AudioContext)
  const { audioContextRef, isInterrupted, handleTapToResume } = useAudioContext();

  // 5. Auto-start guard ref (prevents double-start on re-render)
  const hasAutoStartedRef = useRef(false);

  // 6. VictoryScreen props include all trail fields
  <VictoryScreen
    score={score}
    totalPossibleScore={totalPossibleScore}
    nodeId={nodeId}
    exerciseIndex={trailExerciseIndex}
    totalExercises={trailTotalExercises}
    exerciseType={trailExerciseType}
    onNextExercise={handleNextExercise}
    onReset={handleReset}
    onExit={handleExit}
  />

  // 7. handleNextExercise mirrors MetronomeTrainer lines 202-242
  //    Switch on nextExercise.type covering all 11 EXERCISE_TYPES
}
```

**Critical constraint:** `AudioContextProvider` is already applied at the route level
in `App.jsx`. Do not add a second `AudioContextProvider` inside the component.
Use `useAudioContext()` inside the component to access the shared context.

### Pattern 2: usePianoSampler Hook

Create `src/hooks/usePianoSampler.js`. The project already has a complete chromatic
piano sample library at `src/assets/sounds/piano/` (A1-G7 inclusive, WAV format,
confirmed by direct file listing). Use the same runtime fetch pattern as
`useAudioEngine.loadPianoSound()`:

```javascript
export function usePianoSampler({ sharedAudioContext = null } = {}) {
  const bufferCache = useRef(new Map()); // noteId -> AudioBuffer

  const playNote = useCallback(async (noteId, { duration = 1.0 } = {}) => {
    const ctx = sharedAudioContext || audioContextRef.current;
    if (!ctx) return;

    if (!bufferCache.current.has(noteId)) {
      const response = await fetch(`/sounds/piano-samples/${noteId}.wav`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      bufferCache.current.set(noteId, buffer);
    }

    const source = ctx.createBufferSource();
    source.buffer = bufferCache.current.get(noteId);
    source.connect(ctx.destination);
    source.start(0);
    source.stop(ctx.currentTime + duration);
  }, [sharedAudioContext]);

  return { playNote };
}
```

**Asset placement:** Copy the WAV files needed for game note ranges to
`public/sounds/piano-samples/`. Do not import them through Vite's asset pipeline —
that would bundle hundreds of WAV files. The fetch-at-runtime approach mirrors how
the metronome game already works with `/sounds/piano/G4.mp3`.

For ear training, the typical note range is C3-C6 (36 notes). Copy only that octave
range to keep `public/` size reasonable. Instrument recognition and interval games
work within the same range.

### Pattern 3: Instrument Audio Samples

For `InstrumentRecogGame`, use short (~2-3 second) pre-recorded clips stored in
`public/sounds/instruments/`. Use the HTML `Audio` element (not Web Audio API) —
these are recognition samples, not timing-critical playback, and the simpler API
avoids any AudioContext lifecycle complications:

```javascript
const audio = new Audio('/sounds/instruments/violin.mp3');
audio.play();
```

Follow the `useSounds()` hook pattern exactly (path array fallback, volume set to
0.7, load on mount, cleanup on unmount).

### Pattern 4: Trail Tab for Ear Training

`TrailMap.jsx` uses a generic `TRAIL_TABS` array rendered with `map()`. The tab
rendering, URL param persistence, ARIA keyboard navigation, and `ZigzagTrailLayout`
consumption are all category-agnostic. Adding a fourth tab requires exactly one
change: add one object to the array. The color scheme for `ear_training` nodes
should be added to `BUBBLE_COLORS` and `MODAL_ICON_STYLES` in `TrailNodeModal.jsx`
— use a distinct amber/orange or teal palette that does not clash with the existing
blue/purple/green/gold assignments.

### Pattern 5: Rhythm Node Remapping

When remapping existing rhythm trail nodes to use new exercise types, change only
the `exercises` array. The `rhythmConfig` field used for TrailNodeModal display
stays untouched. The VictoryScreen's multi-exercise flow handles cross-type
navigation already — no VictoryScreen changes are needed.

Example of a remapped node with mixed exercise types:

```javascript
exercises: [
  { type: EXERCISE_TYPES.RHYTHM_READING,   config: { tempo: 80, timeSignature: '4/4', difficulty: 'easy' } },
  { type: EXERCISE_TYPES.ARCADE_RHYTHM,    config: { tempo: 80, timeSignature: '4/4' } },
]
```

The prerequisite chain and `xpReward` are unaffected by the exercise type change.

### Pattern 6: Dashboard Skill Progress Indicators

Create `src/components/dashboard/SkillPathProgress.jsx`. This is a standalone
dashboard card — not a new route or context. Data comes from
`getNextRecommendedNode()` in `skillProgressService.js` (already used by
`PlayNextButton`). Use React Query with the same `staleTime` as other dashboard
queries (~5 minutes).

Display structure: 3 mini path cards (Treble, Rhythm, Ear Training — or whichever
paths the user has started). Each card shows path icon, last completed node name,
next node name with lock status, and a 3-star row. Mount it in `Dashboard.jsx`
below `XPProgressCard`, above `DailyGoalsCard`.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating a New AudioContext in a Game Component

**What goes wrong:** Instantiating `new AudioContext()` directly inside a game
component instead of using the shared provider.

**Why it happens:** Copy-pasting older code or not knowing the provider exists.

**Consequences:** Safari limits 4 simultaneous AudioContexts. Multiple contexts also
cause the v1.7 mic restart regression to resurface.

**Prevention:** Every game route in `App.jsx` already wraps with
`<AudioContextProvider>`. Use `useAudioContext()` inside components.

### Anti-Pattern 2: Ear Training Boss Nodes With Wrong Category

**What goes wrong:** Setting `category: 'ear_training'` on a boss node.

**Why it happens:** Assuming the boss node should stay in its path's category.

**Consequences:** `getBossNodes()` in `skillTrail.js` filters for `isBoss: true`
regardless of category — those nodes appear in `TrailMap`'s unlock calculation.
However, `getNodesByCategory('ear_training')` would also return the boss node,
causing it to appear in both the Ear tab and the Boss calculations. The existing
pattern uses `category: 'boss'` for all boss nodes.

**Prevention:** All ear training boss nodes use `category: NODE_CATEGORIES.BOSS`
and `isBoss: true`, identical to `boss_treble_1`, `boss_bass_1`, `boss_rhythm_1`.

### Anti-Pattern 3: Importing Piano WAVs Through Vite

**What goes wrong:** `import C4 from '../../assets/sounds/piano/C4.wav'` for
each note.

**Why it happens:** Treating WAV files like other imported assets.

**Consequences:** Vite inlines or hashes each WAV file into the bundle. 36+ WAV
files for a single octave range would add megabytes to the initial bundle.

**Prevention:** Copy needed WAV files to `public/sounds/piano-samples/` and fetch
them at runtime, exactly as `useAudioEngine` fetches `/sounds/piano/G4.mp3`.

### Anti-Pattern 4: Skipping validateTrail.mjs Extension

**What goes wrong:** Remapping rhythm nodes to `rhythm_reading` before adding that
type to `scripts/validateTrail.mjs`.

**Why it happens:** Focusing on game components before data validation.

**Consequences:** `npm run build` fails with a validation error. This blocks deploy.

**Prevention:** Extend `validateTrail.mjs` to accept all 5 new exercise types as the
very first step, before touching any node data files.

### Anti-Pattern 5: Adding Ear Training Without subscriptionConfig Update

**What goes wrong:** Creating ear training nodes without updating
`src/config/subscriptionConfig.js` and the Postgres `is_free_node()` function.

**Why it happens:** Forgetting that the subscription gate has two layers.

**Consequences:** New nodes either fail the RLS check for free users (blocked
unexpectedly) or pass for all users regardless of subscription (paywall broken).

**Prevention:** After creating ear training unit 1 node IDs, add them to
`FREE_EAR_NODE_IDS` in `subscriptionConfig.js` and sync with a Supabase migration
updating the `is_free_node()` Postgres function.

---

## Scalability Considerations

| Concern | Current (~93 nodes) | After This Milestone (~108 nodes) | Notes |
|---------|--------------------|------------------------------------|-------|
| Trail tab count | 3 tabs | 4 tabs | Tab bar scrolls on mobile; existing ARIA nav handles N tabs |
| SKILL_NODES array size | 93 entries | ~108 entries | No performance concern at this scale |
| Audio context per session | 1 (shared provider) | Still 1 | Architecture unchanged |
| WAV files loaded per session | 1 (G4.mp3 for metronome) | Up to 12-15 per ear training session | Buffer Map cache prevents redundant loads |
| validateTrail.mjs type list | 6 types | 11 types | Simple array addition |
| subscriptionConfig free nodes | 19 free + 3 paywalled boss | Add ~6 ear unit 1 free nodes | Must sync JS + Postgres manually |
| i18n keys | ~200 existing | +12 exercise type labels | Routine |

---

## Build Order (Dependency-Ordered)

Sequencing based on which pieces block other pieces.

### Phase 1: Data Foundation (blocks everything else)
1. Add `EAR_TRAINING` to `NODE_CATEGORIES` in `constants.js`
2. Add 5 new `EXERCISE_TYPES` to `constants.js`
3. Extend `scripts/validateTrail.mjs` to accept the new types
4. Add i18n stub keys for new exercise types in `en/trail.json` and `he/trail.json`

### Phase 2: Piano Sampler Infrastructure (blocks ear training games)
1. Copy C3-C6 WAV files to `public/sounds/piano-samples/`
2. Create `src/hooks/usePianoSampler.js`

### Phase 3: New Rhythm Games (parallel after Phase 1)
For each of `RhythmReadingGame`, `RhythmDictationGame`, `ArcadeRhythmGame`:
- Create the game component
- Add lazy route + `LANDSCAPE_ROUTES` entry in `App.jsx`
- Add `navigateToExercise` switch case in `TrailNodeModal.jsx`
- Add `handleNextExercise` switch case inside the component itself
- Add i18n display name key

### Phase 4: Ear Training Games (parallel after Phase 2)
For each of `NoteComparisonGame`, `IntervalGame`, `InstrumentRecogGame`:
- Same checklist as Phase 3 but using `/ear-training-mode/` prefix
- `InstrumentRecogGame` also needs instrument audio clips in `public/sounds/instruments/`

### Phase 5: Ear Training Trail Data
1. Create `src/data/units/earUnit1Redesigned.js` (~5-6 nodes, note comparison)
2. Create `src/data/units/earUnit2Redesigned.js` (~5-6 nodes, intervals)
3. Create `src/data/units/earUnit3Redesigned.js` (~3-4 nodes, instrument recognition)
4. Add `EAR_TRAINING` unit metadata entries to `skillTrail.js` UNITS object
5. Import and spread ear unit arrays in `expandedNodes.js`
6. Update `subscriptionConfig.js` — add `FREE_EAR_NODE_IDS` for unit 1 nodes
7. Write a Supabase migration updating `is_free_node()` to include ear unit 1 IDs

### Phase 6: Trail Map Ear Training Tab (after Phase 5)
1. Add `{ id: 'ear', label: 'Ear', categoryKey: 'EAR_TRAINING' }` to `TRAIL_TABS`
2. Add `ear_training` BUBBLE_COLORS entry in `TrailNodeModal.jsx`
3. Add `ear_training` MODAL_ICON_STYLES entry in `TrailNodeModal.jsx`
4. Add `progressGradient` condition for `ear_training` category

### Phase 7: Rhythm Node Remapping (after Phase 1 + Phase 3)
1. Remap a subset of rhythm nodes (units 2-8) to use mixed exercise types
2. Run `npm run verify:trail` after each unit to catch validation errors early

### Phase 8: Dashboard Skill Progress Indicators (independent — any order)
1. Create `src/components/dashboard/SkillPathProgress.jsx`
2. Mount in `Dashboard.jsx`
3. Add i18n keys

---

## Key Data Structures

### Ear Training Node Shape

```javascript
{
  id: 'ear_1_1',
  name: 'High or Low?',
  description: 'Is the second note higher or lower?',
  category: 'ear_training',
  unit: 1,
  unitName: 'Listening Starters',
  order: 200,              // After rhythm nodes (max rhythm order ~185)
  orderInUnit: 1,
  prerequisites: [],       // First ear node has no prereqs
  nodeType: NODE_TYPES.DISCOVERY,
  earConfig: {
    notePool: ['C4', 'E4', 'G4', 'C5'],
    intervalRange: [1, 5], // semitones
    playbackDelay: 800,    // ms between two notes
  },
  exercises: [
    {
      type: EXERCISE_TYPES.NOTE_COMPARISON,
      config: {
        notePool: ['C4', 'E4', 'G4', 'C5'],
        questionCount: 10,
        playbackDelay: 800,
      }
    }
  ],
  skills: ['higher_lower'],
  xpReward: 40,
  isBoss: false,
}
```

### navState for Ear Training (via location.state — same shape as all games)

```javascript
{
  nodeId:           'ear_1_1',
  nodeConfig:       exercise.config,
  exerciseIndex:    0,
  totalExercises:   1,
  exerciseType:     'note_comparison',
  // enableSharps / enableFlats / keySignature not needed for ear training
}
```

---

## Integration Point Checklist (Per New Game Component)

| File | Required Change |
|------|----------------|
| `src/data/constants.js` | New `EXERCISE_TYPES` entry (Phase 1, done once) |
| `src/App.jsx` | `lazyWithRetry` import + `<Route>` + `LANDSCAPE_ROUTES` entry |
| `src/components/trail/TrailNodeModal.jsx` | `navigateToExercise` switch case + `getExerciseTypeName` case |
| `src/locales/en/trail.json` | `exerciseTypes.rhythm_reading` etc. |
| `src/locales/he/trail.json` | Hebrew translations |
| `scripts/validateTrail.mjs` | Accept new type string (Phase 1, done once) |
| Game component itself | `handleNextExercise` switch covering all 11 `EXERCISE_TYPES` |

---

## Sources

- Direct codebase inspection: `src/data/constants.js`, `src/components/trail/TrailNodeModal.jsx`,
  `src/App.jsx`, `src/components/trail/TrailMap.jsx`, `src/hooks/useAudioEngine.js`,
  `src/contexts/AudioContextProvider.jsx`, `src/features/games/hooks/useSounds.js`,
  `src/components/games/rhythm-games/MetronomeTrainer.jsx`
- Precedent: `NoteSpeedCards` (v2.8 — most recent new game integration),
  `MetronomeTrainer` (trail auto-start pattern)
- Asset inventory: `src/assets/sounds/piano/` — full chromatic WAV library confirmed
  present (A1-G7 plus all standard flats), verified by file listing
- Confidence: HIGH — all integration points derived from source code, no external
  sources required for this architecture analysis
