# Phase 01: Engagement HUD Parity - Research

**Researched:** 2026-07-09
**Domain:** React state management / real-time note-scoring integration (client-only, no new libraries)
**Confidence:** HIGH

## Summary

This phase wires the already-built, already-shared HUD components (`ComboPill`, `OnFireBadge`,
`OnFireSplash`, shipped in v3.6) into `SightReadingGame.jsx`. There is no new mechanic to design —
`NotesRecognitionGame.jsx` is the canonical reference implementation, and every constant, prop
signature, and locale key needed already exists in the codebase `[VERIFIED: codebase read]`.

The one genuinely non-trivial design question — "where does live, note-by-note miss detection
already hook in?" — turned out to have a clean, existing answer, and it **corrects a premise in
01-CONTEXT.md**: misses are **not** reconciled only in a late post-exercise sweep. `SightReadingGame.jsx`
already runs a `requestAnimationFrame`-driven timeline (`schedulePerformanceTimeline`'s `tick()`,
lines ~2016–2186) that scans every animation frame for notes whose timing window has just closed and
records them as `missed` in real time via `recordPerformanceResult()`. This is the single existing
hook point for a live combo reset. The single hook point for combo increment is the correct-note
branch inside `handleNoteDetected` (line ~1858), which **both** mic (via `useMicNoteInput`'s
`onNoteEvent` → `handleNoteEvent` → `handleNoteDetectedRef.current`) and keyboard (via
`handleKeyboardNoteInput` → `handleNoteEvent`) already funnel through — meaning there is exactly
ONE correct-hit hook and ONE miss hook to touch, not two per input mode `[VERIFIED: codebase read]`.

**Primary recommendation:** Lift combo/on-fire state into `SightReadingSessionContext` as two stable
`useCallback`s (`incrementCombo()`, `resetCombo()`, empty deps, internal ref+state double-write
mirroring `NotesRecognitionGame`'s `comboRef`/`setCombo` pattern) plus derived `combo`/`isOnFire`
values in the existing `useMemo` block. Call `incrementCombo()` at the single correct-note record site
and `resetCombo()` at the single miss-record site inside the RAF tick. Keep sound/splash-timeout
side effects local to `SightReadingGame.jsx` (as `NotesRecognitionGame` does), triggered by a
`useEffect` watching the context's `isOnFire` value transition from `false` to `true`. This avoids
reintroducing 60Hz `setState` (Phase B's core fix) because state only changes on note-events, never
per animation frame, and it avoids any _new_ stale-closure ref-mirroring in the game component because
the two context callbacks are stable identities that are safe to close over from both the
per-render-recreated `handleNoteDetected` (ref-mirrored via the existing `handleNoteDetectedRef`
pattern) and the once-per-exercise `tick()` closure inside `schedulePerformanceTimeline`.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** No lives system and no game-over screen in sight-reading for this phase. Ship positive
  reinforcement only (combo + on-fire). Pedagogy/entertainment/business rationale: sight-reading is
  highest-cognitive-load game; fail-states raise anxiety; lives are a monetization mechanic this app
  doesn't use (subscription-gated, not energy economy).
- **D-02:** HUD-02 is deferred, not permanently killed. REQUIREMENTS.md already amended (confirmed —
  see Phase Requirements below) to move HUD-02 to deferred status with the D-01 rationale.
- **D-03:** Keep the existing gentle "encouragement" screen (shown at session end when
  `percentage < 0.7`). Do NOT add `GameOverScreen` to the sight-reading loss path.
- **D-04:** Live, note-by-note. Combo ticks up visibly as each correct note lands and resets the
  instant a wrong/missed note occurs (a miss = when its timing window closes). Ref-mirrors for stale
  closures in mic-detection callbacks (established pattern), and window-close detection so a silent
  missed note breaks combo live rather than only in a post-exercise sweep.
- **D-05:** Combo is session-wide (spans exercises). Lift combo state into
  `SightReadingSessionContext` (not per-exercise local state). Per-exercise reset rejected: ~4-8 notes
  per exercise makes the on-fire threshold of 5 rarely hit and the streak feel too short.
- **D-06:** Reuse shared constants: on-fire threshold = 5, combo tiers at 3/8 (same as
  NotesRecognition). Only re-tune the threshold if session-wide scope makes 5 feel trivially easy in
  practice — planner's discretion, but default is reuse.
- **D-07:** Reuse the shared `games.engagement` i18n keys (`combo`, `onFire`, ...) already present in
  EN + HE. Do NOT create a new `sightReading.engagement` block. Any genuinely sight-reading-specific
  string still ships EN+HE with RTL correctness (I18N-01).
- **D-08:** Reduced-motion is handled inside the HUD components. Do NOT pass any reduced-motion prop
  from the game. `OnFireSplash` must render at the root of the game tree (`fixed inset-0`), not inside
  a card/scroll container.

### Claude's Discretion

- On-fire threshold re-tuning (D-06) if 5 proves trivial under session-wide scope.
- Exact HUD placement on the sight-reading layout, and whether the combo/on-fire is echoed on the
  encouragement screen (not required).
- Whether to reuse NotesRecognition's on-fire sound trigger or stay silent — planner's call.

### Deferred Ideas (OUT OF SCOPE)

- **HUD-02 (lives + game-over routing)** — deferred out of this phase per D-01/D-02. Reconsider only
  as gentle streak/star pressure, never hearts + `GameOverScreen`. Requires the REQUIREMENTS.md
  amendment (already done — see Phase Requirements). Not assigned to a specific future phase.

## Phase Requirements

| ID         | Description                                                                                                        | Research Support                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HUD-01     | Live combo counter, session-wide, increments on consecutive correct notes, resets on miss, uses shared `ComboPill` | See "Standard Stack", "Architecture Patterns" (single correct-hit hook, single miss hook), "Code Examples"                                                                             |
| HUD-03     | On-fire badge/splash at combo threshold, respects `prefers-reduced-motion`                                         | See `OnFireBadge`/`OnFireSplash` component contracts below (D-08 self-handling confirmed by source read); "Code Examples"                                                              |
| I18N-01    | New HUD strings ship EN+HE with RTL correctness, reusing `games.engagement.*`                                      | See "i18n" section — `combo`/`onFire` keys exist in both locales but are currently **unused** anywhere in the codebase; planner must decide where to consume them (see Open Questions) |
| ~~HUD-02~~ | Deferred — not addressed this phase                                                                                | N/A                                                                                                                                                                                    |

## Architectural Responsibility Map

| Capability                                     | Primary Tier                              | Secondary Tier | Rationale                                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combo count/isOnFire state (session-wide)      | Frontend Client (React Context)           | —              | Must survive exercise transitions within one game session; `SightReadingSessionContext` already exists for exactly this cross-exercise aggregation role |
| Combo increment on correct note                | Frontend Client (game component logic)    | —              | Purely a client-side scoring-reaction; no server round-trip                                                                                             |
| Combo reset on miss (window-close detection)   | Frontend Client (RAF timeline)            | —              | Timing-window math is already 100% client-side (audio-clock driven), no backend involvement                                                             |
| On-fire visual (badge/splash) + reduced-motion | Browser/Client (presentational component) | —              | Purely rendering; components already self-contained (`useMotionTokens`, `useAccessibility`)                                                             |
| Locale strings (EN/HE)                         | Frontend Client (i18next resource files)  | —              | Static JSON resources, no i18n backend in this app                                                                                                      |
| Fire sound (Web Audio oscillator)              | Browser/Client                            | —              | Ephemeral audio side-effect, not persisted, matches `NotesRecognitionGame`'s existing pattern                                                           |

No API/Backend, CDN, or Database tier involvement in this phase — 100% Frontend Client work,
consistent with the phase description ("no new mechanics ... no DB").

## Standard Stack

### Core (all already installed — no new dependencies)

| Library                 | Version (installed)            | Purpose                                                                          | Why Standard                                                                |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| react                   | ^18.3.1                        | Component state/hooks                                                            | Already the app's UI runtime `[VERIFIED: package.json]`                     |
| framer-motion           | ^12.23.26                      | `ComboPill`/`OnFireBadge`/`OnFireSplash` internal animation + `useReducedMotion` | Already used by all three shared HUD components `[VERIFIED: codebase read]` |
| react-i18next / i18next | ^16.3.5 / ^25.7.0              | EN/HE string rendering                                                           | App-wide i18n stack, `games.engagement.*` namespace already populated       |
| lucide-react            | (installed, used by ComboPill) | Zap/Flame icons inside `ComboPill`                                               | Already imported by `ComboPill.jsx`                                         |

**No installation required for this phase.** Every component, constant, and locale key already
exists in the repository.

### Reused In-Repo "Libraries" (shared HUD kit)

| Module         | Path                                               | Purpose                                                                                              | Contract                                                                                                                                                                                       |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ComboPill`    | `src/components/games/shared/hud/ComboPill.jsx`    | Renders combo count with self-animated shake (on decrease)/scale (on increase) and tier tint (0/3/8) | `ComboPill({ combo, isOnFire = false })` — **no other props accepted**; detects its own transitions via internal `prevComboRef`                                                                |
| `OnFireBadge`  | `src/components/games/shared/hud/OnFireBadge.jsx`  | Inline flame badge shown while on-fire is active                                                     | `OnFireBadge({ active })` — reads `useMotionTokens().reduce` AND `useAccessibility().reducedMotion` internally (dual-source reduced-motion, **do not pass a reduced-motion prop**)             |
| `OnFireSplash` | `src/components/games/shared/hud/OnFireSplash.jsx` | One-shot full-screen flame celebration on first on-fire activation                                   | `OnFireSplash({ show })` — renders `fixed inset-0 z-[70]`; **must be a direct child of the game's root render tree**, not nested inside `SightReadingLayout`'s scrollable regions (would clip) |

### Alternatives Considered

| Instead of                                                                    | Could Use                                                                             | Tradeoff                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifting combo into `SightReadingSessionContext`                               | New separate `ComboContext`                                                           | Rejected by D-05 intent (spans exercises, and the session context already owns cross-exercise aggregation — `exerciseResults`, `percentage`, `isVictory`); a second context would duplicate session-boundary reset logic (`startSession`/`resetSession`) |
| `useEffect`-driven combo increment (watching `performanceResults` array diff) | Direct imperative call at the two record sites (`recordPerformanceResult` call sites) | Diffing the array every render to find "what changed" is more code and risks double-counting on the COUNT_IN→PERFORMANCE override edge case (see Pitfalls); direct calls at the two known mutation sites are simpler and precise                         |

**Installation:** None — no new packages.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
                    │        SightReadingSessionContext        │
                    │  (session-wide, survives exercise loop)  │
                    │                                          │
                    │  state: { combo, isOnFire, ... }         │
                    │  incrementCombo() ── stable useCallback  │
                    │  resetCombo()     ── stable useCallback  │
                    └───────────────┬──────────────┬───────────┘
                                    │              │
                     incrementCombo()│              │resetCombo()
                                    │              │
   ┌────────────────────────────────▼───┐   ┌──────▼─────────────────────────────┐
   │ handleNoteDetected() correct branch │   │ schedulePerformanceTimeline() tick()│
   │ (SightReadingGame.jsx ~line 1858)   │   │  RAF loop, miss-record branch       │
   │                                     │   │  (SightReadingGame.jsx ~line 2135)  │
   │ Called by BOTH input modes via a    │   │                                     │
   │ SINGLE shared entry point:          │   │ Runs every animation frame during   │
   │  mic  → useMicNoteInput.onNoteEvent │   │ PERFORMANCE phase; only mutates     │
   │       → handleNoteEvent()           │   │ state when a note's timing window   │
   │       → handleNoteDetectedRef.current│  │ has just closed with no correct hit │
   │  kbd  → handleKeyboardNoteInput()   │   │ recorded (event-driven, NOT 60Hz    │
   │       → handleNoteEvent() (same fn) │   │ setState — see Pitfall below)       │
   └─────────────────────────────────────┘   └─────────────────────────────────────┘
                     │                                        │
                     │ recordPerformanceResult(isCorrect:true)│ recordPerformanceResult(isCorrect:false, timingStatus:"missed")
                     ▼                                        ▼
              performanceResults[] (existing, unchanged — combo hooks run ALONGSIDE this, not instead of it)

   Render tree (top-level fragment, SightReadingGame.jsx return statement ~line 3811):
   <>
     {headerRegion}              ← ComboPill + OnFireBadge render here (near ScorePill)
     <SightReadingLayout .../>   ← staff/keyboard/feedback (scrollable/contained regions)
     <OnFireSplash show={...} /> ← ROOT-LEVEL sibling, fixed inset-0 (D-08), NOT inside SightReadingLayout
     {other fixed-position overlays: MicErrorOverlay, penalty modal, etc.}
   </>
```

### Recommended Integration Points (no new files required)

```
src/
├── contexts/
│   └── SightReadingSessionContext.jsx   # ADD: combo/isOnFire state + incrementCombo/resetCombo
└── components/games/sight-reading-game/
    └── SightReadingGame.jsx              # ADD: destructure combo/isOnFire/incrementCombo/resetCombo;
                                           #      call incrementCombo() at correct-note record site;
                                           #      call resetCombo() at miss-record site inside tick();
                                           #      local showFireSplash + prevIsOnFireRef useEffect;
                                           #      render <ComboPill>/<OnFireBadge> in headerRegion;
                                           #      render <OnFireSplash> at root fragment
```

No new component files are needed — `ComboPill`, `OnFireBadge`, `OnFireSplash` are imported, not
forked (per CONTEXT.md canonical_refs: "reuse, do not fork").

### Pattern 1: Stable context-owned combo callbacks (avoids re-introducing stale-closure refs)

**What:** `SightReadingSessionContext` exposes `incrementCombo`/`resetCombo` as `useCallback`s with
empty dependency arrays (mirroring the existing `recordExerciseResult`/`goToNextExercise` pattern
already in that file), each internally doing a ref+state double-write exactly like
`NotesRecognitionGame`'s `comboRef`/`setCombo`.

**When to use:** Any time combo needs to be mutated from a callback whose own closure may be stale
(the mic detection pipeline, the RAF timeline tick) — a stable function reference sidesteps the
staleness problem entirely, because the _function itself_ never changes identity, it just reads/writes
through its own internal ref.

**Example (context — new code to add):**

```javascript
// Source: pattern mirrored from src/components/games/notes-master-games/NotesRecognitionGame.jsx
// comboRef/setCombo (lines 663-664, 1637-1652, 1720-1722) — adapted to context ownership.
const comboRef = useRef(0);
const isOnFireRef = useRef(false);
const [combo, setCombo] = useState(0);
const [isOnFire, setIsOnFire] = useState(false);

const ON_FIRE_THRESHOLD = 5; // reuse NotesRecognitionGame's constant (D-06)

const incrementCombo = useCallback(() => {
  comboRef.current += 1;
  setCombo(comboRef.current);
  if (comboRef.current >= ON_FIRE_THRESHOLD && !isOnFireRef.current) {
    isOnFireRef.current = true;
    setIsOnFire(true);
  }
}, []);

const resetCombo = useCallback(() => {
  comboRef.current = 0;
  setCombo(0);
  if (isOnFireRef.current) {
    isOnFireRef.current = false;
    setIsOnFire(false);
  }
}, []);
```

**Example (game component — calling sites):**

```javascript
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:1858 (existing correct-note site)
recordPerformanceResult(result);
incrementCombo(); // NEW — single hook point, covers both mic + keyboard (both route through handleNoteDetected)

// Source: src/components/games/sight-reading-game/SightReadingGame.jsx:2135 (existing miss-record site,
// inside schedulePerformanceTimeline's tick() RAF loop)
recordPerformanceResult(missed);
resetCombo(); // NEW — single hook point, fires exactly once per note (guarded by the existing `already` check at line 2090-2093)
```

### Pattern 2: Local ephemeral side-effects (sound, splash timing) stay in the game component

**What:** `NotesRecognitionGame` does NOT put `playFireSound()` or the 1500ms splash-visibility timer
into shared/global state — those are one-shot, component-local side effects. Mirror this: context
owns only `combo`/`isOnFire` (durable, needed by the render), while `SightReadingGame.jsx` owns a
local `showFireSplash` state, triggered by watching the context's `isOnFire` for a `false → true`
transition.

**Example:**

```javascript
// Source: pattern mirrored from NotesRecognitionGame.jsx:1679-1686 (playFireSound + setShowFireSplash),
// adapted to react off context state instead of local state.
const [showFireSplash, setShowFireSplash] = useState(false);
const prevIsOnFireRef = useRef(isOnFire);

useEffect(() => {
  if (isOnFire && !prevIsOnFireRef.current) {
    playFireSound(); // reuse NotesRecognitionGame's standalone oscillator implementation (or stay silent — Claude's Discretion)
    setShowFireSplash(true);
    const t = setTimeout(() => setShowFireSplash(false), 1500);
    prevIsOnFireRef.current = isOnFire;
    return () => clearTimeout(t);
  }
  prevIsOnFireRef.current = isOnFire;
}, [isOnFire]);
```

### Anti-Patterns to Avoid

- **Do not add a reduced-motion prop to `ComboPill`/`OnFireBadge`/`OnFireSplash`.** Their JSDoc
  explicitly states they self-consume `useMotionTokens()`/`useAccessibility()` (D-08). Passing a prop
  would silently do nothing (no such prop exists) or require forking the component (forbidden).
- **Do not read combo state directly inside the RAF `tick()` closure via a plain variable.** `tick()`
  is created once per `schedulePerformanceTimeline()` call (once per exercise start) and recurses via
  `requestAnimationFrame(tick)` using that same closure for the whole exercise. Only _stable function
  references_ (like `resetCombo`, `recordPerformanceResult`) are safe to close over directly; a raw
  `combo` number read here would be frozen at exercise-start value. (This doesn't currently arise in
  the recommended pattern since `resetCombo` only needs to _write_, not read, combo — but is worth
  flagging if the planner considers any conditional logic based on combo _value_ inside `tick()`.)
- **Do not add a `setCombo`/`setIsOnFire` call inside the 60fps `tick()` body unconditionally.** Only
  call `resetCombo()` inside the existing `if (already) continue;`-guarded miss block (fires once per
  note, not once per frame) — this is what keeps the update event-driven rather than reintroducing the
  60Hz `setState` pattern Phase B (PR #11) deliberately eliminated.
- **Do not reset combo in `goToNextExercise()` or `loadExercisePattern()`.** Those reset
  `performanceResults`/`currentNoteIndex` per exercise by design — combo must NOT follow that reset
  path (D-05). Only `resetSession()` (called by `handleStartNewSession` and `returnToSetup`) should
  reset combo to 0.

## Don't Hand-Roll

| Problem                                    | Don't Build                                        | Use Instead                                                                             | Why                                                                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combo pill visuals + shake/scale animation | A new sight-reading-specific combo badge           | `ComboPill` (shared)                                                                    | Already handles tier tinting, shake-on-decrease/scale-on-increase, reduced-motion — verbatim reuse is the whole point of "parity, not new design"                                                                             |
| On-fire celebration                        | A custom splash/badge                              | `OnFireBadge` + `OnFireSplash` (shared)                                                 | Same reasoning; both already handle reduced-motion internally                                                                                                                                                                 |
| Reduced-motion detection                   | Custom `matchMedia` listener in the game component | `useMotionTokens()` / `useAccessibility()` (already wired inside the shared components) | Two independent settings (OS pref vs. in-app toggle) must both be honored — the shared components already implement the dual-source read; re-deriving it in the game component would be redundant and could drift out of sync |
| EN/HE combo/on-fire copy                   | New `sightReading.engagement.*` keys               | Existing `games.engagement.combo` / `games.engagement.onFire` (both locales)            | D-07 explicitly forbids a new i18n block; keys are already translated and used by sibling games' _intent_ (currently technically unused anywhere — see Open Questions)                                                        |

**Key insight:** Every piece of this phase already exists somewhere in the codebase in a proven,
tested form. The entire task is precise wiring, not construction.

## Common Pitfalls

### Pitfall 1: Assuming misses are only caught in a "post-exercise sweep" (they are not)

**What goes wrong:** Planning a new polling mechanism or a `useEffect` that scans
`performanceResults` at exercise-end to detect misses for the combo reset, duplicating existing logic.

**Why it happens:** 01-CONTEXT.md's framing ("misses are currently reconciled late in a post-exercise
sweep") describes an earlier/aspirational mental model, but the actual code already runs a live,
frame-accurate miss detector (`schedulePerformanceTimeline`'s `tick()`, lines 2079-2139) that records
a `missed` result the instant a note's timing window closes, **during** the performance, not after it.

**How to avoid:** Hook `resetCombo()` directly into the existing `recordPerformanceResult(missed)`
call at line ~2135. No new timer, polling loop, or sweep needed.

**Warning signs:** If a plan proposes a new `setInterval`/RAF loop for miss detection, or a
`useEffect` keyed on `gamePhase === FEEDBACK`, that's redundant work — the miss is already recorded
in real time.

### Pitfall 2: Forgetting the COUNT_IN→PERFORMANCE "missed record override" edge case

**What goes wrong:** A note played very early (during the count-in/first-note grace window) can be
recorded as `missed` first (phase: `COUNT_IN`), then later overridden to `isCorrect: true` when the
mic detects the actual pitch during `PERFORMANCE` (see `canOverrideExisting` at line 1606-1610).
If combo logic isn't aware this is an override-of-existing-record rather than a first-time record for
that note index, no bug results from the recommended pattern (increment/reset are simple counters,
not per-note idempotency-checked), but a planner writing a _different_ implementation (e.g., diffing
`performanceResults` array length) could double count or miss this transition.

**Why it happens:** `recordPerformanceResult` performs an upsert (`findIndex` + replace-or-append,
lines 1485-1510), not a pure append — the same `noteIndex` can be written twice.

**How to avoid:** Trigger `incrementCombo()`/`resetCombo()` imperatively at the exact call sites
(inside `handleNoteDetected`'s correct branch and inside `tick()`'s miss branch), not via a `useEffect`
reacting to the `performanceResults` array shape. This sidesteps the upsert-vs-append ambiguity
entirely.

**Warning signs:** Combo count doesn't match the number of genuinely distinct correct notes if this
edge case is mishandled via array-diffing.

### Pitfall 3: Placing `OnFireSplash` inside `SightReadingLayout` instead of at the fragment root

**What goes wrong:** `SightReadingLayout` manages scroll/overflow contracts (see the "Scroll contract"
comment at line ~3567-3572: desktop is `h-screen`-like with no page scroll, mobile allows exactly one
scrollbar). Placing a `fixed inset-0` element inside a scrollable/contained region can clip it or cause
stacking-context surprises.

**How to avoid:** Render `<OnFireSplash show={showFireSplash} />` as a direct sibling of
`<SightReadingLayout />` inside the top-level return fragment (same level as `AudioInterruptedOverlay`,
`MicErrorOverlay`, and the penalty modal, all of which are already root-level `fixed inset-0` overlays
in this file) — exactly per D-08 and consistent with existing overlay conventions in this component.

### Pitfall 4: Re-introducing 60Hz `setState` (the exact regression Phase B fixed)

**What goes wrong:** The RAF `tick()` in `schedulePerformanceTimeline` runs on every animation frame
during the entire PERFORMANCE phase. It is tempting to read/display "time until next note" or a live
progress value tied to combo inside this loop with a `setState` call every frame.

**Why it happens:** The loop is already there and "convenient" to hook into for anything.

**How to avoid:** Only call `resetCombo()` inside the existing miss-record `if` block (which is itself
gated by the `already` check — fires at most once per note, not once per frame). Never call any
`setCombo`/`setIsOnFire` unconditionally in the per-frame body. This mirrors MEMORY.md's note that
"Phase B (PR #11) deliberately killed the two 60Hz setState sources" — don't add a third.

## Code Examples

### `games.engagement` i18n keys — confirmed present in both locales

```json
// Source: src/locales/en/common.json (games.engagement) — VERIFIED via direct file read
{
  "combo": "Combo",
  "onFire": "ON FIRE!"
}
```

```json
// Source: src/locales/he/common.json (games.engagement) — VERIFIED via direct file read
{
  "combo": "קומבו",
  "onFire": "מדהים!"
}
```

### Existing header region insertion point (near `ScorePill`)

```jsx
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx ~line 3609-3616
// (existing "Right Controls" flex container inside headerRegion)
<div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
  {/* NEW: Combo + On-fire — add before/after ScorePill, matching NotesRecognitionGame's placement
      ("left of streak pill" — NotesRecognitionGame.jsx:2291-2295) */}
  <OnFireBadge active={isOnFire} />
  <ComboPill combo={combo} isOnFire={isOnFire} />
  <ScorePill value={Math.round(sessionTotalScore)} label={t("games.score")} />
  {/* ...existing BPM pill, input mode button, metronome button, settings button... */}
</div>
```

### Root-level `OnFireSplash` placement

```jsx
// Source: src/components/games/sight-reading-game/SightReadingGame.jsx ~line 3811-3840
// (existing top-level return fragment)
return (
  <>
    {shouldShowPrompt && <RotatePromptOverlay onDismiss={dismissPrompt} />}
    <div className="relative">
      {/* ...MicDebugPanel, countInOverlay... */}
      <SightReadingLayout /* ...existing props... */ />
    </div>

    {/* NEW — root-level sibling, NOT inside SightReadingLayout (D-08) */}
    <OnFireSplash show={showFireSplash} />

    {/* ...existing input-mode modal, AudioInterruptedOverlay, MicErrorOverlay, penalty modal... */}
  </>
);
```

## State of the Art

| Old Approach                                                        | Current Approach                                                         | When Changed                                      | Impact                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Per-game bespoke combo/lives/on-fire implementations                | Shared `src/components/games/shared/hud/*` component kit                 | v3.6 (Phase 36, shipped 2026-06-14 per MEMORY.md) | This phase is the first time sight-reading adopts the shared kit — Notes Recognition and Arcade Rhythm already did |
| 60Hz `setState` for live scoring feedback in `SightReadingGame.jsx` | Event-driven `setState` only on note-events (correct hit / window-close) | Phase B / PR #11 (already shipped)                | Any new combo logic MUST follow this event-driven discipline, not reintroduce per-frame `setState`                 |

**Deprecated/outdated:** None relevant to this phase — no library deprecations involved (client-only,
already-installed dependencies).

## Assumptions Log

| #   | Claim                                                                                                                                                                                                                                                                                                             | Section                                              | Risk if Wrong                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | "Try Again" (`replayPattern`, does not call `resetSession`/`startSession`) should NOT reset combo — combo persists across a retry of the same exercise, consistent with "session-wide" framing.                                                                                                                   | Architecture Patterns / Pattern 1 (reset boundaries) | If the intended UX is that Try Again should feel like a fresh attempt, combo would carry over unexpectedly high from a previous partial attempt; low-medium risk — a discuss-phase or planner note-back to the owner would resolve this cheaply |
| A2  | `games.engagement.combo`/`onFire` keys, though present in both locales, are intended to be consumed as accessible labels (e.g., `aria-label`/screen-reader text) on the HUD elements rather than as visible text, since `ComboPill`/`OnFireBadge` render no text label themselves beyond the numeric combo count. | Phase Requirements / Code Examples                   | Low risk — worst case the planner chooses a different (also valid) placement, e.g. a tooltip; either way I18N-01 is satisfiable without new keys                                                                                                |
| A3  | Reusing `NotesRecognitionGame`'s standalone Web Audio oscillator `playFireSound()` verbatim (copy, not shared extraction) is acceptable rather than extracting it into a shared hook, since CONTEXT.md leaves the sound decision to "planner's call" and doesn't mandate a shared audio utility.                  | Code Examples / Pattern 2                            | Low risk — if a future phase also wants this sound, minor duplication could be refactored then; not a correctness risk now                                                                                                                      |

**If this table is empty:** N/A — see above; none of these are compliance/security/retention-policy
claims, all are low-risk implementation-detail defaults the planner can adjust freely.

## Open Questions (RESOLVED)

1. **Should "Try Again" (replay same exercise) preserve or reset combo?** — RESOLVED: preserve combo. `resetCombo` fires only at session boundaries (`startSession`/`resetSession`); `replayPattern()` deliberately does not, so a retry keeps the streak (Plan 01 Task 2, D-05).
   - What we know: `replayPattern()` does not call `resetSession()`/`startSession()` — only
     `handleStartNewSession()` and `returnToSetup()` do. Per current context wiring, combo would
     naturally persist through a Try Again.
   - What's unclear: CONTEXT.md doesn't explicitly address this specific transition (it discusses
     "session-wide, spans exercises" but Try Again replays the _same_ exercise rather than advancing).
   - Recommendation: Default to persisting combo through Try Again (matches the "session-wide" spirit
     and requires zero extra code) unless the planner or a quick owner check-in decides otherwise.

2. **Should combo/on-fire be echoed on the `VictoryScreen` or the inline encouragement screen?** — RESOLVED: no echo. Combo/on-fire live on the gameplay HUD only; the summary screens are left untouched this phase (Claude discretion, not required — Plan 02 scope).
   - What we know: CONTEXT.md explicitly marks this as "Claude's Discretion... not required."
   - What's unclear: No strong signal either way from the phase goal (parity is about the _live
     gameplay_ HUD, not the summary screens).
   - Recommendation: Skip it for this phase (simplest, satisfies all locked success criteria); revisit
     only if a future phase wants richer session summaries.

3. **On-fire re-tuning if session-wide scope makes threshold=5 trivial** — RESOLVED: ship at threshold=5 (D-06 default); `ON_FIRE_THRESHOLD` is a single named constant, and 01-VALIDATION.md carries a manual-verification row to re-tune post-playtest if needed.
   - What we know: D-06 explicitly flags this as a possible follow-up but defaults to reuse.
   - What's unclear: Whether 5 will actually feel too easy — this is an empirical/UX question that
     can't be resolved by static code research; needs a playtest or owner judgment call after
     implementation.
   - Recommendation: Ship with threshold=5 as default; leave the constant clearly named/exported so
     re-tuning later is a one-line change, and flag it for owner review during verification.

## Validation Architecture

### Test Framework

| Property           | Value                                                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Framework          | Vitest ^3.2.4 + `@testing-library/react` ^16.3.0 + `@testing-library/jest-dom` ^6.9.1                                    |
| Config file        | `vitest.config.js` (repo root)                                                                                           |
| Quick run command  | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` (new file, name TBD by planner) |
| Full suite command | `npm run test:run`                                                                                                       |

Existing conventions confirmed by direct read of
`src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx`:

- Mocks `useSightReadingSession` wholesale (this test WILL need updating/extending once combo/isOnFire/
  incrementCombo/resetCombo are added to the context's return shape — every existing test mocking this
  hook must add the new fields or the component will crash on `undefined` destructure).
- Mocks `useMicNoteInput` and captures its `onNoteEvent` callback indirectly via the mocked
  `useAudioContext`/`useAudioEngine`/`usePatternGeneration` — simulating a correct note requires either
  (a) driving the keyboard path via `KlavierKeyboard`'s `onNotePlayed` prop (easier — it's already
  mocked as a plain `data-testid` div in existing tests, so the mock would need to expose a button/
  callback), or (b) mocking `useMicNoteInput` to capture and invoke `onNoteEvent` directly.
- Uses `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` to drive the RAF-based
  `schedulePerformanceTimeline` past note-window-close — this is the existing, proven way to
  deterministically trigger a "missed" record in tests without real timing races.

### Phase Requirements → Test Map

| Req ID  | Behavior                                                                                                      | Test Type       | Automated Command                                                                                                                                                                                                                               | File Exists?                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HUD-01  | Combo increments on consecutive correct notes (keyboard input)                                                | integration     | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx -t "increments"`                                                                                                                                        | ❌ Wave 0                                                                                                                                                                               |
| HUD-01  | Combo resets when a note's timing window closes with no correct hit (mic + keyboard, single shared code path) | integration     | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx -t "resets on miss"`                                                                                                                                    | ❌ Wave 0                                                                                                                                                                               |
| HUD-01  | Combo persists across `goToNextExercise()` (session-wide)                                                     | integration     | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx -t "persists across exercises"`                                                                                                                         | ❌ Wave 0                                                                                                                                                                               |
| HUD-01  | Combo resets on `resetSession()`/`startSession()` (new session / return to setup)                             | unit (context)  | `npx vitest run src/contexts/SightReadingSessionContext.test.jsx -t "combo reset"`                                                                                                                                                              | ❌ Wave 0                                                                                                                                                                               |
| HUD-03  | On-fire activates at combo >= 5, badge + splash render                                                        | integration     | `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx -t "on-fire"`                                                                                                                                           | ❌ Wave 0                                                                                                                                                                               |
| HUD-03  | Reduced-motion suppression                                                                                    | unit (existing) | `npx vitest run src/components/games/shared/hud/ComboPill.test.jsx` (already covers tier/flame rendering; `OnFireBadge`/`OnFireSplash` reduced-motion is internal to those components, not re-tested per integration — already shipped in v3.6) | ✅ (partial — `ComboPill.test.jsx` exists; no `OnFireBadge.test.jsx`/`OnFireSplash.test.jsx` exist, but these are unmodified shared components, out of this phase's test-writing scope) |
| I18N-01 | `games.engagement.combo`/`onFire` render correctly in EN+HE wherever consumed (e.g., aria-label)              | unit            | New assertion in whichever test covers the accessible-label wiring decision (see Open Question 2)                                                                                                                                               | ❌ Wave 0                                                                                                                                                                               |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx src/contexts/SightReadingSessionContext.test.jsx`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/contexts/SightReadingSessionContext.test.jsx` — does not currently exist; needed to cover
      combo/isOnFire state + reset-on-session-boundary behavior in isolation (context has no existing
      test file at all — confirmed via glob, only component tests exist today).
- [ ] `src/components/games/sight-reading-game/SightReadingGame.combo.test.jsx` (or extend
      `SightReadingGame.micRestart.test.jsx`) — needed for the live increment/reset integration
      behavior. Must update the `useSightReadingSession` mock shape used across ALL existing
      SightReadingGame test files once the context's return shape changes (breaking-change risk —
      flagged explicitly since `SightReadingGame.micRestart.test.jsx` and any other test mocking
      this hook will need the new fields added or the component destructure will produce `undefined`
      instead of crashing outright, since JS destructuring of missing keys yields `undefined`, not a
      throw — so combo would silently be `undefined` in those tests rather than fail loudly; the
      planner should ensure all six `useSightReadingSession` mock objects in the test suite are updated
      together in one task).
- [ ] Framework install: none — Vitest/RTL already fully configured.

## Security Domain

`security_enforcement` is absent from `.planning/config.json` (treated as enabled per policy), but
this phase has no new attack surface: no new endpoints, no new stored data, no new auth/session
concerns, no new user input parsing beyond what already exists (pitch/keyboard note input, already
handled by existing anti-cheat/debounce logic untouched by this phase). Confirmed via full read of
`SightReadingGame.jsx`'s scoring pipeline — combo state is derived entirely from already-validated
`performanceResults` entries; no new trust boundary is crossed.

| ASVS Category         | Applies        | Standard Control                                                                                                                                                                                                             |
| --------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no             | Unchanged — phase touches no auth code                                                                                                                                                                                       |
| V3 Session Management | no             | "Session" here means in-app game session (`SightReadingSessionContext`), not an auth session — unrelated to ASVS V3                                                                                                          |
| V4 Access Control     | no             | No new routes/permissions                                                                                                                                                                                                    |
| V5 Input Validation   | no (unchanged) | Existing pitch/keyboard input validation (timing windows, debounce, anti-cheat tracking) is untouched by this phase; combo hooks only read `isCorrect`/`timingStatus` already computed by that existing, unmodified pipeline |
| V6 Cryptography       | no             | N/A                                                                                                                                                                                                                          |

### Known Threat Patterns for this stack

None applicable — client-only visual/engagement state with no persistence, no new network calls, no
new user-supplied data reaching a trust boundary.

## Sources

### Primary (HIGH confidence — direct codebase reads this session)

- `src/components/games/shared/hud/ComboPill.jsx` — full source read, prop contract confirmed
- `src/components/games/shared/hud/OnFireBadge.jsx` — full source read, dual-source reduced-motion confirmed
- `src/components/games/shared/hud/OnFireSplash.jsx` — full source read, root-placement requirement confirmed
- `src/components/games/shared/hud/ComboPill.test.jsx` — existing test conventions for this component
- `src/contexts/SightReadingSessionContext.jsx` — full source read, current state shape and reset boundaries confirmed
- `src/components/games/notes-master-games/NotesRecognitionGame.jsx` — combo/on-fire wiring block (lines 313-324, 662-710, 1620-1736) read in full, canonical constants and pattern confirmed
- `src/components/games/sight-reading-game/SightReadingGame.jsx` — full scoring pipeline read: `recordPerformanceResult` (1485-1510), `handleNoteDetected` (1513-1950), `handleKeyboardNoteInput`/`handleNoteEvent` (918-960, 1960-1992), `schedulePerformanceTimeline`/`tick()` (2016-2186), `completePerformance` (1234-1278), session-boundary calls to `startSession`/`resetSession` (397-402, 2417-2422, 2530-2559), header/render region (3588-3968)
- `src/components/games/sight-reading-game/SightReadingGame.micRestart.test.jsx` — full read, existing test mocking conventions confirmed
- `src/locales/en/common.json` / `src/locales/he/common.json` — `games.engagement.*` key presence confirmed via direct JSON parse; cross-referenced against actual usages via grep (confirmed `combo`/`onFire` currently unused anywhere in `src/`)
- `src/utils/useMotionTokens.js` — full source read
- `src/contexts/AccessibilityContext.jsx` — `reducedMotion` field confirmed via grep
- `package.json` — dependency versions confirmed via direct read
- `.planning/config.json` — `nyquist_validation`/`security_enforcement` keys absent (both treated as enabled per policy)
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/phases/01-engagement-hud-parity/01-CONTEXT.md` — full reads

### Secondary (MEDIUM confidence)

None — all findings this session were directly verifiable against the codebase; no external
WebSearch/Context7 lookups were needed since this is a 100% internal-reuse phase with zero new
third-party dependencies.

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every component/constant/locale-key claim verified by direct file read, not training-data recall
- Architecture: HIGH — the RAF-loop live-miss-detection hook point and the single shared correct-hit entry point (`handleNoteDetected`) were confirmed by reading the actual current source, not inferred from CONTEXT.md's (partially inaccurate) framing
- Pitfalls: HIGH — each pitfall is tied to a specific, cited line range in the actual current file

**Research date:** 2026-07-09
**Valid until:** 30 days (stable internal codebase, no external dependency drift risk for this phase)
