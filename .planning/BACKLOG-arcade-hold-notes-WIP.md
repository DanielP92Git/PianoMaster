---
status: backlog
origin: phase-33-WIP stash (re-stashed 2026-05-03 during /gsd-discuss-phase 33)
captured: 2026-05-12
preserves: stash@{0} dropped after capture
---

# BACKLOG — Arcade Hold-Notes WIP

Captured from the `phase-33-WIP` stash before dropping. Holds the substantive unfinished work that did **not** land in Phases 33–35: hold-note support inside `ArcadeRhythmGame` (Chunk B) and the dynamic tile-height refactor it depends on (Chunk D).

## Provenance

The stash originally contained four chunks (B/C/D/E) per memory notes. Status at capture time (2026-05-12):

| Chunk | Description                                                                                                                                       | Status                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| B     | Hold-notes in ArcadeRhythmGame (pointer-event handlers, HoldRing overlay, "Hold" tile label, spacebar keydown/keyup, widened scoring windows)     | **Not on main.** Captured in this doc.                                                                                        |
| C     | Tag-based pattern resolution via `src/data/patterns/RhythmPatternGenerator` (`resolveByTags`/`resolveByAnyTag`, `patternTags`)                    | **Already landed** on main via Phase 33 Plan 06 ("Stash Chunk A salvage"). Slightly different implementation, same semantics. |
| D     | Dynamic tile heights — replace static `TILE_HEIGHTS` map with `height = (noteDurationSec / SCREEN_TRAVEL_TIME) * hitZoneY`, bottom-edge alignment | **Not on main.** Captured in this doc. Tightly coupled to Chunk B (hold-notes need accurate tile heights).                    |
| E     | `boss_rhythm_7` flip `isBoss: false` → `true` + test expectation                                                                                  | **Already landed** on main (`src/data/units/rhythmUnit7Redesigned.js:377` + `.test.js:74`). v3.3 BLOCKER-1 close.             |

Phase 35 did not touch tile rendering or scoring — no overlap.

## Why this is backlog, not a quick task

- Chunks B + D are an unfinished feature, not a fix. Hold-notes in the arcade context need:
  - UX decisions on visual feedback during the hold window
  - Scoring policy decisions (currently captures "worst of onset and hold")
  - Potentially device-tested feel on phone touch + spacebar
- The scoring-window widening (150→250ms PERFECT, 280→400ms GOOD) is a behavior change that should go through a discuss-phase before shipping.
- The tile-geometry refactor (static heights → proportional bottom-edge alignment) is a visual regression risk for the existing landscape rendering.

## When to revisit

Fold into the next milestone if/when the user scopes arcade hold-notes. Approach options:

1. **Re-derive from PulseQuestion's hold pattern** (cleaner — PulseQuestion's hold implementation has shipped + been validated; reapply the same scoring/animation pattern to ArcadeRhythmGame).
2. **Apply the captured diff** as a starting point (faster, but the WIP predates Phase 33 Plan 06 / Phase 34 refactors — expect rebase friction; the `fetchNewPattern` branch in the diff conflicts with the salvaged Chunk C implementation already on main).

Recommend (1).

## Captured Diff (from `git stash show -p stash@{0}`)

> Includes Chunks B + C + D + E. Chunks C and E are already on main and should be ignored when re-applying. Chunks B + D are the substantive remaining work.

```diff
diff --git a/src/components/games/rhythm-games/ArcadeRhythmGame.jsx b/src/components/games/rhythm-games/ArcadeRhythmGame.jsx
index 1f23b35..8ad9a0c 100644
--- a/src/components/games/rhythm-games/ArcadeRhythmGame.jsx
+++ b/src/components/games/rhythm-games/ArcadeRhythmGame.jsx
@@ -20,7 +20,10 @@ import GameOverScreen from "../GameOverScreen";
 import BackButton from "../../ui/BackButton";
 import { getNodeById } from "../../../data/skillTrail";
 import { getPattern, TIME_SIGNATURES } from "./RhythmPatternGenerator";
+import { resolveByTags, resolveByAnyTag } from "../../../data/patterns/RhythmPatternGenerator";
 import { binaryPatternToBeats } from "./utils/rhythmVexflowHelpers";
+import { isHoldNote, scoreHold, calcHoldDurationMs, HOLD_THRESHOLDS } from "./utils/holdScoringUtils";
+import { HoldRing, CIRCUMFERENCE } from "./components/HoldRing";
 // scoreTap not used — arcade game uses wider inline timing windows
 import FloatingFeedback from "./components/FloatingFeedback";
 import CountdownOverlay from "./components/CountdownOverlay";
@@ -62,17 +65,8 @@ const VEX_TO_OLD_NAME = {
   qd: "dotted-quarter",
 };

-/** Duration-coded tile heights in pixels */
-const TILE_HEIGHTS = {
-  16: 80, // whole (16 sixteenth units)
-  12: 72, // dotted half
-  8: 64, // half
-  6: 56, // dotted quarter
-  4: 56, // quarter
-  3: 48, // dotted eighth
-  2: 44, // eighth
-  1: 36, // sixteenth
-};
+// TILE_HEIGHTS removed — heights are now computed dynamically from tempo and lane height
+// so tiles exactly fill their time duration with no gaps (see buildTilesFromBeats).

 /** Duration-coded tile Tailwind classes */
 function getTileColorClass(durationUnits, isRest) {
@@ -137,6 +131,19 @@ function ArcadeRhythmGame() {
     return durations.map((d) => VEX_TO_OLD_NAME[d] || d);
   }, [nodeId, nodeConfig]);

+  // Extract tag-based pattern resolution fields from node's rhythmConfig
+  // Used to fetch curated patterns that match the node's duration vocabulary
+  const { patternTags, patternTagMode, nodeDurations } = useMemo(() => {
+    if (!nodeId) return {};
+    const node = getNodeById(nodeId);
+    const rc = node?.rhythmConfig;
+    return {
+      patternTags: rc?.patternTags,
+      patternTagMode: rc?.patternTagMode,
+      nodeDurations: rc?.durations,
+    };
+  }, [nodeId]);
+
   // Audio context
   const {
     audioContextRef,
@@ -196,6 +203,14 @@ function ArcadeRhythmGame() {
   const tileLaneRef = useRef(null); // tile lane container (for height measurement)
   const laneHeightRef = useRef(0); // cached lane height for RAF animation

+  // Hold-note tracking
+  const holdActiveRef = useRef(false);
+  const holdStartTimeRef = useRef(null); // performance.now() at press-start
+  const holdTileInfoRef = useRef(null); // { tileIdx, beatIndex, requiredMs, onsetQuality }
+  const holdRingCircleRef = useRef(null); // ref for HoldRing SVG stroke animation
+  const holdRafIdRef = useRef(null); // rAF ID for ring animation
+  const [isHoldActive, setIsHoldActive] = useState(false);
+
   // Sync refs with state
   useEffect(() => {
     livesRef.current = lives;
@@ -237,6 +252,12 @@ function ArcadeRhythmGame() {
       clearTimeout(feedbackTimeoutRef.current);
       feedbackTimeoutRef.current = null;
     }
+    // Reset hold state
+    if (holdRafIdRef.current) cancelAnimationFrame(holdRafIdRef.current);
+    holdActiveRef.current = false;
+    holdStartTimeRef.current = null;
+    holdTileInfoRef.current = null;
+    setIsHoldActive(false);
   }, []);

   // Cleanup on unmount
@@ -306,7 +327,7 @@ function ArcadeRhythmGame() {
    * Each tile has: id, durationUnits, isRest, spawnTime, beatTime, height, colorClass
    * spawnTime = beatTime - SCREEN_TRAVEL_TIME (tile starts off-screen)
    */
-  const buildTilesFromBeats = useCallback((beats, playbackStartTime, bpm) => {
+  const buildTilesFromBeats = useCallback((beats, playbackStartTime, bpm, hitZoneY) => {
     const beatDuration = 60 / bpm;
     const sixteenthDuration = beatDuration / 4;
     const tileDefinitions = [];
@@ -316,7 +337,9 @@ function ArcadeRhythmGame() {
     beats.forEach((beat, idx) => {
       const beatTime = playbackStartTime + offset;
       const spawnTime = beatTime - SCREEN_TRAVEL_TIME;
-      const height = TILE_HEIGHTS[beat.durationUnits] ?? TILE_HEIGHTS[4];
+      // Height proportional to duration using same travel distance as RAF loop
+      const noteDurationSec = sixteenthDuration * beat.durationUnits;
+      const height = (noteDurationSec / SCREEN_TRAVEL_TIME) * hitZoneY;
       const colorClass = getTileColorClass(beat.durationUnits, beat.isRest);

       tileDefinitions.push({
@@ -362,15 +385,32 @@ function ArcadeRhythmGame() {
     const MAX_VARIETY_RETRIES = 3;
     for (let attempt = 0; attempt <= MAX_VARIETY_RETRIES; attempt++) {
       try {
-        const result = await getPattern(
-          timeSignatureStr,
-          difficulty,
-          rhythmPatterns
-        );
-        if (!result || !result.pattern) return null;
+        let binaryPattern;
+
+        if (patternTags?.length > 0) {
+          // Trail mode: curated patterns via tag-based resolution
+          const resolver =
+            patternTagMode === "any" ? resolveByAnyTag : resolveByTags;
+          const resolved = resolver(
+            patternTags,
+            nodeDurations || ["q"],
+            { timeSignature: timeSignatureStr }
+          );
+          if (!resolved) return null;
+          binaryPattern = resolved.binary;
+        } else {
+          // Non-trail / free-play mode: procedural generation
+          const result = await getPattern(
+            timeSignatureStr,
+            difficulty,
+            rhythmPatterns
+          );
+          if (!result || !result.pattern) return null;
+          binaryPattern = result.pattern;
+        }

         // D-02: Reject consecutive identical patterns (compare binary signature)
-        const signature = result.pattern.join(",");
+        const signature = binaryPattern.join(",");
         if (
           attempt < MAX_VARIETY_RETRIES &&
           signature === lastPatternRef.current
@@ -379,7 +419,7 @@ function ArcadeRhythmGame() {
         }

         lastPatternRef.current = signature;
-        const beats = binaryPatternToBeats(result.pattern);
+        const beats = binaryPatternToBeats(binaryPattern);
         return beats;
       } catch (err) {
         console.warn("[ArcadeRhythmGame] fetchNewPattern error:", err);
@@ -387,7 +427,7 @@ function ArcadeRhythmGame() {
       }
     }
     return null;
-  }, [timeSignatureStr, difficulty, rhythmPatterns]);
+  }, [timeSignatureStr, difficulty, rhythmPatterns, patternTags, patternTagMode, nodeDurations]);

   // ---------------------------------------------------------------------------
   // Screen shake on miss
@@ -452,12 +492,12 @@ function ArcadeRhythmGame() {
             return;
           }

-          const targetY = laneHeightRef.current - 24 - tile.height / 2;
+          // All tiles travel the same distance at the same speed (bottom-edge alignment)
+          const hitZoneY = laneHeightRef.current - 24;

           if (progress <= 1.0) {
-            // Tile is descending — position via pixel transform
-            // progress 0 = top of lane, progress 1 = tile CENTER at hit zone line
-            const yPx = progress * targetY;
+            // Tile is descending — bottom edge reaches hit zone at progress=1
+            const yPx = progress * hitZoneY - tile.height;
             tileEl.style.transform = `translateY(${yPx}px)`;
             tileEl.style.opacity = "1";
             return;
@@ -465,7 +505,7 @@ function ArcadeRhythmGame() {

           // progress > 1.0 — tile past hit zone: keep moving down + fade out
           const overshoot = progress - 1.0;
-          const yPx = targetY + overshoot * targetY * 0.5; // continue descending
+          const yPx = hitZoneY - tile.height + overshoot * hitZoneY * 0.5;
           const fadeOpacity = Math.max(0, 1 - overshoot * 3); // fade over ~0.33 progress
           tileEl.style.transform = `translateY(${yPx}px)`;
           tileEl.style.opacity = String(fadeOpacity);
@@ -606,11 +646,13 @@ function ArcadeRhythmGame() {
       const playbackStartTime = ctx.currentTime + SCREEN_TRAVEL_TIME + 0.05;
       patternStartTimeRef.current = playbackStartTime;

-      // Build tile definitions
+      // Build tile definitions (hitZoneY = travel distance, same as RAF loop)
+      const hitZoneY = (tileLaneRef.current?.offsetHeight || 400) - 24;
       const tileDefinitions = buildTilesFromBeats(
         beats,
         playbackStartTime,
-        tempo
+        tempo,
+        hitZoneY
       );
       tilesRef.current = tileDefinitions;
       setTiles(tileDefinitions);
@@ -681,91 +723,180 @@ function ArcadeRhythmGame() {
   // ---------------------------------------------------------------------------
   // Tap scoring
   // ---------------------------------------------------------------------------
-  const handleHitZoneTap = useCallback(() => {
-    if (gamePhaseRef.current !== GAME_PHASES.PLAYING) return;
+  const handleHitZonePointerDown = useCallback(
+    (e) => {
+      if (gamePhaseRef.current !== GAME_PHASES.PLAYING) return;

-    const ctx = audioContextRef.current;
-    if (!ctx) return;
+      const ctx = audioContextRef.current;
+      if (!ctx) return;

-    playTapClick();
+      playTapClick();

-    const tapTime = ctx.currentTime;
-    if (scheduledBeatTimesRef.current.length === 0) return;
+      const tapTime = ctx.currentTime;
+      if (scheduledBeatTimesRef.current.length === 0) return;

-    // Arcade-specific scoring with wider windows than MetronomeTrainer
-    // Visual-only falling-tile games need generous windows (~3x wider)
-    const ARCADE_PERFECT_MS = 150; // ±150ms — generous for visual-only arcade game
-    const ARCADE_GOOD_MS = 280; // ±280ms — forgiving for children
+      // Arcade-specific scoring — generous windows for visual-only falling-tile game
+      const ARCADE_PERFECT_MS = 250; // ±250ms — tile is near/at hit zone
+      const ARCADE_GOOD_MS = 400; // ±400ms — tile is approaching or just past

-    const beatTimes = scheduledBeatTimesRef.current;
-    const searchStart = Math.max(0, nextBeatIndexRef.current);
-    const searchEnd = Math.min(
-      beatTimes.length - 1,
-      nextBeatIndexRef.current + 2
-    );
-    let bestDelta = Infinity;
-    let bestIdx = searchStart;
-    for (let i = searchStart; i <= searchEnd; i++) {
-      const delta = Math.abs((tapTime - beatTimes[i]) * 1000);
-      if (delta < bestDelta) {
-        bestDelta = delta;
-        bestIdx = i;
+      const beatTimes = scheduledBeatTimesRef.current;
+      const searchStart = Math.max(0, nextBeatIndexRef.current);
+      const searchEnd = Math.min(
+        beatTimes.length - 1,
+        nextBeatIndexRef.current + 2
+      );
+      let bestDelta = Infinity;
+      let bestIdx = searchStart;
+      for (let i = searchStart; i <= searchEnd; i++) {
+        const delta = Math.abs((tapTime - beatTimes[i]) * 1000);
+        if (delta < bestDelta) {
+          bestDelta = delta;
+          bestIdx = i;
+        }
       }
-    }

-    let quality;
-    if (bestDelta <= ARCADE_PERFECT_MS) quality = "PERFECT";
-    else if (bestDelta <= ARCADE_GOOD_MS) quality = "GOOD";
-    else quality = "MISS";
+      let onsetQuality;
+      if (bestDelta <= ARCADE_PERFECT_MS) onsetQuality = "PERFECT";
+      else if (bestDelta <= ARCADE_GOOD_MS) onsetQuality = "GOOD";
+      else onsetQuality = "MISS";

-    const noteIdx = bestIdx;
-    const newNextBeatIndex = bestIdx + 1;
+      const noteIdx = bestIdx;

-    // Mark the corresponding tile as scored
-    // Find the tile whose beatIndex matches noteIdx
-    const tileIdx = tilesRef.current.findIndex(
-      (t) => !t.isRest && t.beatIndex === noteIdx
-    );
-    if (tileIdx !== -1) {
-      scoredRef.current.add(tileIdx);
-    }
+      // Find corresponding tile
+      const tileIdx = tilesRef.current.findIndex(
+        (t) => !t.isRest && t.beatIndex === noteIdx
+      );
+      const tile = tileIdx !== -1 ? tilesRef.current[tileIdx] : null;
+
+      // Mark tile scored + advance beat index
+      if (tileIdx !== -1) scoredRef.current.add(tileIdx);
+      nextBeatIndexRef.current = noteIdx + 1;
+
+      // --- Branch: hold note vs tap note ---
+      if (tile && isHoldNote(tile.durationUnits) && onsetQuality !== "MISS") {
+        // HOLD NOTE: start tracking
+        const requiredMs = calcHoldDurationMs(tile.durationUnits, tempo);
+        holdActiveRef.current = true;
+        holdStartTimeRef.current = performance.now();
+        holdTileInfoRef.current = {
+          tileIdx,
+          beatIndex: noteIdx,
+          requiredMs,
+          onsetQuality,
+        };
+        setIsHoldActive(true);
+
+        // Capture pointer for reliable up/cancel events
+        e.currentTarget.setPointerCapture(e.pointerId);
+
+        // Start HoldRing rAF animation
+        const ringTarget = requiredMs * HOLD_THRESHOLDS.PERFECT;
+        const startTime = performance.now();
+        function animateRing() {
+          const elapsed = performance.now() - startTime;
+          const progress = Math.min(1, elapsed / ringTarget);
+          if (holdRingCircleRef.current) {
+            holdRingCircleRef.current.setAttribute(
+              "stroke-dashoffset",
+              String(CIRCUMFERENCE * (1 - progress))
+            );
+          }
+          if (progress < 1 && holdActiveRef.current) {
+            holdRafIdRef.current = requestAnimationFrame(animateRing);
+          }
+        }
+        holdRafIdRef.current = requestAnimationFrame(animateRing);
+        return;
+      }
+
+      // TAP NOTE (or hold with MISS onset): instant scoring
+      if (onsetQuality === "MISS") {
+        setCombo(0);
+        setIsOnFire(false);
+      } else {
+        setCombo((prev) => {
+          const next = prev + 1;
+          if (next >= ON_FIRE_THRESHOLD) setIsOnFire(true);
+          return next;
+        });
+      }

-    nextBeatIndexRef.current = newNextBeatIndex;
+      setLatestFeedback(onsetQuality);
+      setFeedbackKey((k) => k + 1);
+
+      // Visual: fade tile
+      if (tileIdx !== -1) {
+        const tileEl = tileRefs.current[tileIdx];
+        if (tileEl) {
+          tileEl.style.transition =
+            onsetQuality === "GOOD" && !reducedMotion
+              ? "opacity 200ms ease-out"
+              : "none";
+          tileEl.style.opacity = "0";
+        }
+      }
+    },
+    [audioContextRef, tempo, playTapClick, reducedMotion]
+  );

-    if (quality === "MISS") {
-      // Tap too early/late — reset combo but don't lose a life
-      // (lives are only lost when tiles pass through untapped, via handleMissFromRaf)
+  /** Score hold duration on pointer release */
+  const handleHitZonePointerUp = useCallback(() => {
+    if (!holdActiveRef.current) return;
+
+    const holdMs = performance.now() - holdStartTimeRef.current;
+    const { tileIdx, onsetQuality, requiredMs } = holdTileInfoRef.current;
+    const holdQuality = scoreHold(holdMs, requiredMs);
+
+    // Combined quality: worst of onset and hold
+    const QUALITY_RANK = { PERFECT: 2, GOOD: 1, MISS: 0 };
+    const finalQuality =
+      QUALITY_RANK[holdQuality] <= QUALITY_RANK[onsetQuality]
+        ? holdQuality
+        : onsetQuality;
+
+    // Cancel ring animation
+    if (holdRafIdRef.current) cancelAnimationFrame(holdRafIdRef.current);
+
+    // Reset hold state
+    holdActiveRef.current = false;
+    holdStartTimeRef.current = null;
+    holdTileInfoRef.current = null;
+    setIsHoldActive(false);
+
+    // Reset ring SVG
+    if (holdRingCircleRef.current) {
+      holdRingCircleRef.current.setAttribute(
+        "stroke-dashoffset",
+        String(CIRCUMFERENCE)
+      );
+    }
+
+    // Apply scoring
+    if (finalQuality === "MISS") {
       setCombo(0);
       setIsOnFire(false);
     } else {
-      // PERFECT or GOOD
       setCombo((prev) => {
         const next = prev + 1;
-        if (next >= ON_FIRE_THRESHOLD) {
-          setIsOnFire(true);
-        }
+        if (next >= ON_FIRE_THRESHOLD) setIsOnFire(true);
         return next;
       });
     }

-    setLatestFeedback(quality);
+    setLatestFeedback(finalQuality);
     setFeedbackKey((k) => k + 1);

-    // Visual feedback: apply scored class to tile element
+    // Fade tile
     if (tileIdx !== -1) {
       const tileEl = tileRefs.current[tileIdx];
       if (tileEl) {
-        if (quality === "GOOD") {
-          tileEl.style.transition = reducedMotion
-            ? "none"
-            : "opacity 200ms ease-out";
-          tileEl.style.opacity = "0";
-        } else if (quality === "PERFECT") {
-          tileEl.style.opacity = "0";
-        }
+        tileEl.style.transition = !reducedMotion
+          ? "opacity 200ms ease-out"
+          : "none";
+        tileEl.style.opacity = "0";
       }
     }
-  }, [audioContextRef, tempo, playTapClick, triggerScreenShake, reducedMotion]);
+  }, [reducedMotion]);

   // ---------------------------------------------------------------------------
   // Trail navigation
@@ -948,17 +1079,27 @@ function ArcadeRhythmGame() {
   const totalPossibleScore = TOTAL_PATTERNS * 100;
   const correctAnswers = patternScores.filter((s) => s >= 60).length;

-  // Keyboard handler: spacebar to tap during PLAYING
+  // Keyboard handler: spacebar to tap/hold during PLAYING
   useEffect(() => {
     const handleKeyDown = (e) => {
       if (e.code === "Space" && gamePhaseRef.current === GAME_PHASES.PLAYING) {
         e.preventDefault();
-        handleHitZoneTap();
+        if (e.repeat) return; // Ignore OS key-repeat while holding spacebar
+        handleHitZonePointerDown({ currentTarget: { setPointerCapture: () => {} }, pointerId: 0 });
+      }
+    };
+    const handleKeyUp = (e) => {
+      if (e.code === "Space") {
+        handleHitZonePointerUp();
       }
     };
     window.addEventListener("keydown", handleKeyDown);
-    return () => window.removeEventListener("keydown", handleKeyDown);
-  }, [handleHitZoneTap]);
+    window.addEventListener("keyup", handleKeyUp);
+    return () => {
+      window.removeEventListener("keydown", handleKeyDown);
+      window.removeEventListener("keyup", handleKeyUp);
+    };
+  }, [handleHitZonePointerDown, handleHitZonePointerUp]);

   // ---------------------------------------------------------------------------
   // Main game render
@@ -1009,7 +1150,9 @@ function ArcadeRhythmGame() {
         isShaking && !reducedMotion ? "animate-[shake_400ms_ease-in-out]" : ""
       }`}
       dir="ltr"
-      onPointerDown={isPlaying ? handleHitZoneTap : undefined}
+      onPointerDown={isPlaying ? handleHitZonePointerDown : undefined}
+      onPointerUp={isPlaying ? handleHitZonePointerUp : undefined}
+      onPointerCancel={isPlaying ? handleHitZonePointerUp : undefined}
       style={
         isShaking && !reducedMotion
           ? { animation: "shake 400ms ease-in-out" }
@@ -1140,7 +1283,13 @@ function ArcadeRhythmGame() {
                   willChange: "transform",
                 }}
                 aria-hidden="true"
-              />
+              >
+                {!tile.isRest && isHoldNote(tile.durationUnits) && (
+                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold uppercase tracking-wider text-white/60">
+                    Hold
+                  </span>
+                )}
+              </div>
             ))}
           </div>
         )}
@@ -1153,11 +1302,16 @@ function ArcadeRhythmGame() {
           gamePhase === GAME_PHASES.FEEDBACK) && (
           <div
             className="absolute bottom-0 left-0 right-0 h-12"
-            onPointerDown={isPlaying ? handleHitZoneTap : undefined}
+            onPointerDown={isPlaying ? handleHitZonePointerDown : undefined}
+            onPointerUp={isPlaying ? handleHitZonePointerUp : undefined}
+            onPointerCancel={isPlaying ? handleHitZonePointerUp : undefined}
             role="button"
             tabIndex={isPlaying ? 0 : -1}
             aria-label={t("games.rhythmReading.tapArea.tapHere", "Tap here!")}
-            style={{ cursor: isPlaying ? "pointer" : "default" }}
+            style={{
+              cursor: isPlaying ? "pointer" : "default",
+              touchAction: "none",
+            }}
           >
             {/* Visual hit zone line */}
             <div
@@ -1185,6 +1339,22 @@ function ArcadeRhythmGame() {
           </div>
         )}

+        {/* ---------------------------------------------------------------- */}
+        {/* Hold ring overlay (centered above hit zone during active hold) */}
+        {/* ---------------------------------------------------------------- */}
+        {isHoldActive && (
+          <div
+            className="absolute bottom-14 left-1/2 -translate-x-1/2"
+            style={{ width: 100, height: 100, pointerEvents: "none" }}
+          >
+            <HoldRing
+              ringRef={holdRingCircleRef}
+              isComplete={false}
+              reducedMotion={reducedMotion}
+            />
+          </div>
+        )}
+
         {/* ---------------------------------------------------------------- */}
         {/* Floating feedback (above hit zone) */}
         {/* ---------------------------------------------------------------- */}
diff --git a/src/data/units/rhythmUnit7Redesigned.js b/src/data/units/rhythmUnit7Redesigned.js
index 4c036ec..4efe457 100644
--- a/src/data/units/rhythmUnit7Redesigned.js
+++ b/src/data/units/rhythmUnit7Redesigned.js
@@ -371,7 +371,7 @@ export const rhythmUnit7Nodes = [
     skills: ["68_compound_meter", "dotted_quarter_note", "eighth_note"],
     xpReward: 150,
     accessoryUnlock: "compound_badge",
-    isBoss: false, // MINI_BOSS does NOT set isBoss: true
+    isBoss: true,
     isReview: false,
     reviewsUnits: [],
   },
diff --git a/src/data/units/rhythmUnit7Redesigned.test.js b/src/data/units/rhythmUnit7Redesigned.test.js
index 6ef12e9..8ae423b 100644
--- a/src/data/units/rhythmUnit7Redesigned.test.js
+++ b/src/data/units/rhythmUnit7Redesigned.test.js
@@ -71,7 +71,7 @@ describe("Rhythm Unit 7 — 6/8 Compound Meter", () => {
     expect(last.isBoss).toBe(false);
+    expect(last.isBoss).toBe(true);
   });

   it("regular nodes use rhythm category", () => {
```
