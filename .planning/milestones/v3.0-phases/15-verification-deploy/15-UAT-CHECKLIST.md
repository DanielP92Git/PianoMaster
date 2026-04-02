# Phase 15 UAT Checklist

**Source:** `.planning/milestones/v2.9-phases/08-audio-infrastructure-rhythm-games/08-HUMAN-UAT.md`
**Target devices:** Android Phone (PWA), iOS Phone (Safari/PWA), Desktop Browser (Chrome)
**Deployment URL:** `https://my-pianomaster.netlify.app`

## Instructions

For each of the 5 test items below:

1. Follow the **Prerequisites** to set up the test scenario
2. Execute each **Step** in order on each available device
3. Compare observed behavior against the **Expected Result**
4. Record **PASS** or **FAIL** in the Result table for each device
5. For any FAIL, add a note describing what went wrong (what you saw vs. what was expected)

After completing all items on all devices, report results back. Per D-09: any failures will be fixed within this phase before marking complete.

> **Important:** Item 5 (PWA Cache) MUST be tested on the live deployed PWA at `https://my-pianomaster.netlify.app`, NOT on localhost. Service worker behavior differs between development and production.

---

## Item 1: RhythmReadingGame -- Tap-Along Gameplay

**What this tests:** The rhythm tap-along game renders notation correctly, plays audio count-in, shows a moving cursor, and provides real-time tap feedback.

### Prerequisites

- Logged in as a student account
- Device volume turned up
- Either: (a) have a trail node with `exercise_type='rhythm_tap'` unlocked, OR (b) use free-play rhythm mode via Practice Modes

### Steps

1. Navigate to a rhythm trail node (Rhythm tab on Trail Map) or open rhythm free-play from Practice Modes
2. If using trail: tap a rhythm node, then tap "Start" in the node modal
3. Wait for the game screen to load
4. Observe the VexFlow staff -- you should see rhythm notation (quarter notes, eighth notes, rests, etc.) rendered on a musical staff
5. Listen for count-in clicks with a **3-2-1-GO** overlay before gameplay begins
6. Watch for the **indigo cursor** sweeping left-to-right across the staff, synced to the tempo
7. Tap/click along with the rhythm beats as the cursor passes over each note
8. Observe floating feedback text appearing: **PERFECT**, **GOOD**, or **MISS** after each tap
9. Listen for a click sound on each tap
10. Complete the exercise (play through all measures)

### Expected Result

- VexFlow rhythm staff is visible and renders cleanly (no broken/overlapping notation)
- Count-in clicks are audible with a 3-2-1-GO overlay displayed before gameplay
- Indigo cursor sweeps left-to-right synced to the tempo (smooth, not jerky)
- Each tap produces a click sound and shows PERFECT/GOOD/MISS floating text feedback
- Exercise completes and shows results (VictoryScreen or score)

### Results

| Device                   | Result (PASS/FAIL) | Notes |
| ------------------------ | ------------------ | ----- |
| Android Phone (PWA)      |                    |       |
| iOS Phone (Safari/PWA)   |                    |       |
| Desktop Browser (Chrome) |                    |       |

---

## Item 2: RhythmDictationGame -- Hear-and-Pick Gameplay

**What this tests:** The rhythm dictation game plays a rhythm pattern using piano tones, allows replay, and provides correct/incorrect card selection feedback.

### Prerequisites

- Logged in as a student account
- Device volume turned up
- Either: (a) have a trail node with `exercise_type='rhythm_dictation'` unlocked, OR (b) use free-play rhythm mode and select "Rhythm Dictation"

### Steps

1. Navigate to a rhythm dictation game (via trail node or free-play)
2. Wait for the first question to load
3. Listen -- **C4 piano notes** should play automatically, one for each beat of the rhythm pattern
4. Press the **Replay** button and verify the rhythm pattern replays (same C4 piano notes)
5. Look at the rhythm card choices displayed below the staff
6. **Select the correct rhythm card** (the one matching the pattern you heard) -- verify it **glows green**
7. Go to the next question
8. **Intentionally select a wrong rhythm card** -- verify it **flashes red**, then the correct card is highlighted/revealed with an **auto-replay** of the pattern

### Expected Result

- C4 piano notes play for each beat when a question loads (clear, audible piano tone)
- Replay button re-plays the same pattern
- Correct card selection: card glows green
- Wrong card selection: card flashes red, then the correct card is revealed with an auto-replay of the pattern

### Results

| Device                   | Result (PASS/FAIL) | Notes |
| ------------------------ | ------------------ | ----- |
| Android Phone (PWA)      |                    |       |
| iOS Phone (Safari/PWA)   |                    |       |
| Desktop Browser (Chrome) |                    |       |

---

## Item 3: Trail Node Navigation to Rhythm Games

**What this tests:** Trail nodes with rhythm exercise types route to the correct game components (not the ComingSoon placeholder page).

### Prerequisites

- Logged in as a student account
- Have trail nodes with both `exercise_type='rhythm_tap'` and `exercise_type='rhythm_dictation'` unlocked (check the Rhythm tab in Trail Map)
- If nodes are not unlocked, complete prerequisite nodes first or use a test account with progress

### Steps

1. Open the **Trail Map** (tap the trail icon in the sidebar or navigate to `/trail`)
2. Switch to the **Rhythm** tab
3. Find and tap a trail node whose exercise type is **rhythm_tap** (these are the tap-along nodes)
4. In the node modal, tap **Start** / **Play**
5. Verify that the **RhythmReadingGame** opens (you see a VexFlow staff with rhythm notation and a start/count-in)
6. Navigate back to the Trail Map (use the back button or trail link)
7. Find and tap a trail node whose exercise type is **rhythm_dictation** (these are the listen-and-pick nodes)
8. In the node modal, tap **Start** / **Play**
9. Verify that the **RhythmDictationGame** opens (you see rhythm cards to choose from and hear a pattern)

### Expected Result

- `rhythm_tap` nodes open the RhythmReadingGame (NOT a "Coming Soon" page)
- `rhythm_dictation` nodes open the RhythmDictationGame (NOT a "Coming Soon" page)
- Both games load without errors or blank screens

### Results

| Device                   | Result (PASS/FAIL) | Notes |
| ------------------------ | ------------------ | ----- |
| Android Phone (PWA)      |                    |       |
| iOS Phone (Safari/PWA)   |                    |       |
| Desktop Browser (Chrome) |                    |       |

---

## Item 4: Piano Tone Quality

**What this tests:** The `usePianoSampler` hook produces recognizable piano tones through device speakers, particularly on iOS Safari where AudioContext may be suspended.

### Prerequisites

- Device volume turned up to at least 50%
- Logged in as a student account
- Headphones optional but device speakers must work

### Steps

1. Navigate to any game that plays piano tones -- recommended: **Rhythm Dictation** (plays C4 piano notes on question load) or **Note Recognition** game
2. If using Rhythm Dictation: wait for a question to load and listen for the piano tones
3. If using Note Recognition: answer a question and listen for the feedback tone
4. Evaluate the tone quality through device speakers:
   - Is it audible? (not silent)
   - Does it sound piano-like? (not a buzzy sine wave or distorted)
   - Is the volume reasonable? (not extremely quiet or clipping)
5. On iOS specifically: if no sound plays on first load, tap anywhere on the screen first (to unlock AudioContext), then retry

### Expected Result

- Piano-like tone is audible through device speakers (not buzzy, not silent, recognizable as piano)
- On iOS Safari: AudioContext activates after user gesture, tones play after first tap interaction
- Volume is appropriate (not extremely quiet, not clipping/distorted)

### Results

| Device                   | Result (PASS/FAIL) | Notes |
| ------------------------ | ------------------ | ----- |
| Android Phone (PWA)      |                    |       |
| iOS Phone (Safari/PWA)   |                    |       |
| Desktop Browser (Chrome) |                    |       |

---

## Item 5: PWA Cache Invalidation

**What this tests:** After a service worker update, new game routes (rhythm, ear training) are served from the current cache (`pianomaster-v9`), not from stale assets that would cause 404s or broken pages.

### Prerequisites

- The app must be installed as a PWA from `https://my-pianomaster.netlify.app` (NOT from localhost)
- If not already installed: visit the URL in Chrome/Safari, use "Add to Home Screen" or install prompt
- Wait for the PWA to fully install before testing

### Steps

1. Open the installed PWA from the home screen (not from the browser)
2. Navigate to the **Rhythm** section -- either via Trail Map (Rhythm tab) or Practice Modes
3. Verify that rhythm game routes load correctly (not a 404, not a blank page, not a stale cached page showing old content)
4. Try opening an ear training game if available (Trail Map Ear Training tab, or Practice Modes)
5. Verify ear training routes also load (not 404 or stale)
6. **Desktop only (DevTools check):** Open DevTools (F12) > Application tab > Cache Storage
   - Verify `pianomaster-v9` cache exists in the list
   - Check that cached entries include paths for rhythm and ear training routes
7. Close the PWA completely
8. Wait approximately 30 seconds
9. Reopen the PWA from the home screen
10. Navigate to rhythm games again -- verify they still load correctly (the service worker did not revert to a stale cache)

### Expected Result

- New game routes (rhythm, ear training) are accessible and render correctly in the PWA
- `pianomaster-v9` cache is active (visible in Desktop DevTools)
- No stale assets blocking access to v2.9 rhythm or ear training game routes
- App works correctly after close-and-reopen cycle

### Results

| Device                   | Result (PASS/FAIL) | Notes |
| ------------------------ | ------------------ | ----- |
| Android Phone (PWA)      |                    |       |
| iOS Phone (Safari/PWA)   |                    |       |
| Desktop Browser (Chrome) |                    |       |

**Mobile DevTools note:** To inspect service workers on mobile:

- Firefox Android: `about:serviceworkers`
- Chrome Android: `chrome://serviceworker-internals`
- iOS Safari: Settings > Safari > Advanced > Web Inspector (requires Mac with Safari)

---

## Reporting Results

After testing all 5 items on all available devices:

1. Report each item as **PASS** or **FAIL** per device
2. For any FAIL, describe:
   - What you observed (e.g., "no sound played", "game showed blank screen")
   - What device and browser version you tested on
   - Any error messages visible in the console (if accessible)
3. If a device is unavailable, note it as **NOT TESTED** with the reason

**Example report format:**

```
Item 1 (RhythmReadingGame): PASS on Android, PASS on Desktop, NOT TESTED on iOS
Item 2 (RhythmDictationGame): PASS on all devices
Item 3 (Trail navigation): PASS on all devices
Item 4 (Piano tone): PASS on Android, FAIL on iOS -- no sound plays even after tapping
Item 5 (PWA cache): PASS on Desktop, NOT TESTED on mobile (not installed as PWA)
```

Per D-09: Any failing items will be fixed within this phase before marking the milestone complete. Report ALL results before any fixes begin.
