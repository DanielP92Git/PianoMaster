# Microphone Piano Input — Testing & Tuning Checklist

This doc is for validating and tuning the **microphone-based acoustic piano input**.

## Quick enable debug overlay (Sight Reading)

In the browser console:

- `localStorage.setItem("debug-mic", "1")`
- Refresh the page

Disable:

- `localStorage.removeItem("debug-mic")`

## What “good” looks like

- **No random note triggers** when not playing.
- **One played note → one note-on event** (no rapid flipping).
- **Soft playing still works**, especially for children.
- **Legato transitions** do not cause false extra notes.
- **Wrong pitch** is detected reliably and doesn’t “snap” to the expected note too often.

## Test matrix (minimum)

### Environment

- Room: quiet and moderately noisy (fan/AC).
- Device: at least 1 laptop + 1 mobile/tablet if supported.
- Piano: acoustic upright (preferred) + optionally digital through speakers.

### Notes

Test across registers:

- Low: around A2–C3
- Mid: around C4–A4
- High: around C6

### Playing patterns

- Single note staccato: repeat same pitch 10x
- Single note sustained: hold 1–2s
- Scale fragments: C–D–E–F–G and back
- Simple melody: 5–10 notes, moderate tempo

## Tuning knobs (where to change)

- `src/hooks/micInputPresets.js`
  - `rmsThreshold`
  - `tolerance`
  - `onFrames`, `changeFrames`
  - `offMs`
  - `minInterOnMs`

## How to tune (rules of thumb)

### If notes trigger when you’re not playing (false positives)

- Increase `rmsThreshold` slightly.
- Increase `onFrames` (needs longer stability).
- Decrease `tolerance` (tighter matching).

### If soft playing doesn’t register (false negatives)

- Decrease `rmsThreshold` slightly.
- Decrease `onFrames` by 1 (faster acceptance).
- Increase `tolerance` slightly (more forgiving).

### If notes “flutter” between neighbors (e.g. C4/B3)

- Increase `changeFrames`.
- Increase `minInterOnMs`.
- Consider slightly lowering `tolerance`.

### If note-off feels too slow / too fast

- Decrease `offMs` for faster note-off.
- Increase `offMs` to avoid cutting sustained notes.
