## VexFlow Notation – Implementation Guidelines

These guidelines are for the agent when implementing VexFlow‑based notation and sight‑reading features in this project.  
They summarize best practices from `https://www.vexflow.com/`, the [VexFlow Tutorial](https://github.com/0xfe/vexflow/wiki/Tutorial), `vexflow-tutorial.md`, and `vexflow-examples.md`.

---

### Overall Principles

- **Prefer declarative VexFlow APIs over manual positioning**
  - Use `Renderer`, `Stave`, `StaveNote`, `Voice`, `Formatter`, `Beam`, `StaveTie`, `TabStave`, `TabNote`, and modifiers as intended.
  - Let `Formatter`, `Beam.generateBeams`, and modifier self‑positioning handle spacing and layout.
- **Separate concerns**
  - **Game / data model**: notes, durations, timing, correctness logic.
  - **VexFlow representation**: keys (`'c/4'`), durations (`'q'`, `'8'`, `'qr'`), modifiers (accidentals, dots).
  - **Rendering**: staves, voices, beams, ties, tablature.
- **Use one file per purpose**
  - **Concept reference**: `vexflow-tutorial.md`.
  - **Code snippets**: `vexflow-examples.md`.
  - **Rules for implementation**: this `vexflow-guidelines.md`.

---

### Environment & Setup

- **Renderer choice**
  - Default to **SVG** via `new Renderer(div, Renderer.Backends.SVG)` unless the project explicitly requires Canvas.
  - Reuse a renderer and context when redrawing within the same DOM container to avoid unnecessary DOM churn.
- **Basic pattern**
  - Always follow this order:
    1. Get container `div`.
    2. Create `Renderer` (SVG backend).
    3. Call `renderer.resize(width, height)` appropriate to content.
    4. Get `context` via `renderer.getContext()`.
    5. Create `Stave` / `TabStave`, configure clef / time signature.
    6. Set context on stave and draw it.
- **Imports**
  - Use the same import style as in `vexflow-examples.md` (e.g. `import Vex from 'vexflow'; const { Renderer, Stave, StaveNote, ... } = Vex.Flow;`) unless the existing codebase dictates another pattern.

---

### Staves, Measures, and Layout

- **One measure per stave**
  - Follow the tutorial’s model: treat each `Stave` as **one bar / measure**.
  - For multiple measures in a line:
    - Create `stave1` at `(x, y)`.
    - Create `stave2` at `(stave1.x + stave1.width, y)`.
    - Repeat for subsequent measures.
- **Clefs and time signatures**
  - Always explicitly set clef and time signature for the first stave in a system:
    - `stave.addClef('treble').addTimeSignature('4/4');`
  - For later measures in the same system, only add clef/time sig if they actually change.
- **Dimensions**
  - Choose stave widths so that `Formatter` has enough horizontal room to space notes (e.g. 300–400px per measure by default; adjust based on density).

---

### Notes, Durations, and Voices

- **Note representation**
  - Use **VexFlow key strings** of the form `"pitch/octave"` (e.g. `'c/4'`, `'d/5'`, `'eb/4'`).
  - Use **duration codes** consistent with VexFlow tables: `'w'`, `'h'`, `'q'`, `'8'`, `'16'`, `'32'`, and rest variants like `'qr'`.
  - For chords, provide multiple keys: `['c/4', 'e/4', 'g/4']`.
- **Voices and time signatures**
  - Always put `StaveNote`s inside a `Voice` (or use `Formatter.FormatAndDraw`) and match voice timing to the time signature:
    - `new Voice({ numBeats: 4, beatValue: 4 })` for `4/4`.
  - Check that the sum of note durations per voice equals the measure’s total beats.
- **Multiple voices**
  - When using polyphony:
    - One `Voice` per rhythmic line.
    - Use `new Formatter().joinVoices(voices).format(voices, width)` and then draw each voice on the same stave.

---

### Modifiers: Accidentals, Dots, etc.

- **Accidentals**
  - Add accidentals explicitly with `new Accidental(...)`:
    - Example: `.addModifier(new Accidental('b'))`.
  - Valid accidental strings include: `'b'`, `'#'`, `'n'`, `'bb'`, `'##'`, etc.
  - Only rely on `Accidental.applyAccidentals(...)` if you intentionally want automatic accidentals based on key signature.
- **Dots**
  - Use `Dot.buildAndAttach` instead of manually drawing dots:
    - To dot all noteheads in a chord: `Dot.buildAndAttach([note], { all: true });`
    - To dot a specific notehead index: `Dot.buildAndAttach([note], { index })`.
  - Even when using dotted duration strings (e.g. `'8d'`), still call `Dot` so the glyphs appear correctly.
- **Helper functions**
  - Encapsulate repeated dotting logic in small helpers (as in `vexflow-examples.md`) instead of re‑duplicating it in each component.

---

### Beaming Strategy

- **Preferred: automatic beaming**
  - Use `Beam.generateBeams(notes)` whenever possible:
    - It groups adjacent notes and calculates stem directions for you.
    - Draw them after formatting: `beams.forEach(beam => beam.setContext(context).draw());`
- **Manual beams (when needed)**
  - Only construct `new Beam(noteGroup)` manually when you specifically need custom groupings that differ from the default.
- **Ordering**
  - Pattern to follow per measure:
    1. Create notes.
    2. Generate beams `const beams = Beam.generateBeams(notes)` (or create manual beams).
    3. Use `Formatter` to layout notes.
    4. Draw beams.

---

### Ties

- **When to use `StaveTie`**
  - Use ties to visually connect identical pitches across note boundaries within a voice.
- **Configuration**
  - Always specify:
    - `first_note` and `last_note` (the actual `StaveNote` objects),
    - `first_indices` and `last_indices` as arrays of notehead indices.
  - Example pattern:
    - `new StaveTie({ first_note: notes[4], last_note: notes[5], first_indices: [0], last_indices: [0] });`
- **Multiple tied notes**
  - For chords, create separate `StaveTie` objects per notehead as needed.

---

### Guitar Tablature

- **When to use**
  - Only use `TabStave` / `TabNote` for **tab view**, not for standard notation.
- **Core rules**
  - Use `TabStave` instead of `Stave`.
  - Use `TabNote` with `positions: [{ str, fret }]` instead of `keys`.
  - Duration codes are the same as for `StaveNote`.
- **Modifiers**
  - Use `Bend` and `Vibrato` modifiers as in the examples when needed for expressive notation.

---

### Mapping App Logic to VexFlow

- **Use VexFlow tables for validation**
  - When generating or validating notes, clefs, durations, and accidentals, cross‑check against:
    - `Flow.clefProperties.values`
    - `Flow.keyProperties.note_values`
    - `Flow.accidentalCodes.accidentals`
    - `Flow.keySignatures.keySpecs`
    - `Flow.durationToTicks`
    - `Flow.articulationCodes.articulations`
    - `Flow.ornamentCodes.ornaments`
- **Avoid hard‑coded strings**
  - Where possible, centralize mappings between your app’s pitch representation and VexFlow key strings to a single utility module.
- **Sight‑reading game specifics**
  - The game logic should:
    - Decide which pitches/durations to show.
    - Convert them into VexFlow notes (`StaveNote`/`TabNote`) via a single conversion layer.
    - Let VexFlow handle the engraving details (beams, spacing, modifier layout).

---

### Performance, Updates, and Debugging

- **Re‑rendering**
  - For dynamic exercises (e.g. next question), prefer:
    - Clearing/replacing the contents of the same SVG container and reusing the `Renderer`, or
    - Recreating a fresh `Renderer` only when necessary (e.g. container size change).
- **Avoid manual coordinates**
  - Do **not** hand‑position notes, accidentals, or beams with explicit x/y offsets unless there is a strong, documented reason.
  - Use VexFlow’s abstractions and let it compute positions.
- **Debugging**
  - When layout is off, test a minimal reproduction by copy‑pasting into a standalone page using the examples from `vexflow-examples.md`.
  - Compare against patterns in the official Tutorial to ensure API usage is correct.
