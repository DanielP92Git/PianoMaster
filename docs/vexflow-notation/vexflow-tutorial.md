## VexFlow Tutorial – Implementation Notes

Source: [VexFlow Tutorial](https://github.com/0xfe/vexflow/wiki/Tutorial)

This document distills the parts of the tutorial that are most relevant when implementing notation and sight‑reading features in this app.

---

### Core Concepts & Setup

- **Renderer & Context**
  - Import core classes (names differ slightly depending on bundling, but conceptually): `Renderer`, `Stave`, `StaveNote`, `Voice`, `Formatter`, plus others as needed.
  - Typical SVG setup:

    ```javascript
    const { Renderer, Stave } = Vex.Flow;

    const div = document.getElementById("output");
    const renderer = new Renderer(div, Renderer.Backends.SVG);

    renderer.resize(500, 500);
    const context = renderer.getContext();
    ```

  - **Renderer**: manages the drawing surface (SVG or Canvas).
  - **Context**: VexFlow’s 2D drawing wrapper; pass it to staves, beams, ties, etc. via `.setContext(context)`.

- **Staves (`Stave`)**
  - A `Stave` represents one measure (bar) of music.
  - Construct with position and width: `new Stave(x, y, width)`.
  - Configure clef and time signature:

    ```javascript
    const stave = new Stave(10, 40, 400);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(context).draw();
    ```

  - Multiple measures are rendered as separate `Stave` instances placed next to one another.

---

### Notes, Voices, and Formatting

- **Notes (`StaveNote`)**
  - Represents a single note or chord on a stave.
  - Construct with a config object specifying keys and duration:

    ```javascript
    const note = new StaveNote({ keys: ["c/4"], duration: "q" });
    const chord = new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" });
    ```

  - Keys are strings of the form `"pitch/octave"` (e.g. `"d/5"`, `"eb/4"`).
  - Durations are codes like `"w"`, `"h"`, `"q"`, `"8"`, `"16"`, `"qr"` (quarter rest), etc.

- **Voices (`Voice`)**
  - A `Voice` is an ordered sequence of notes that must fit into a given time signature.
  - Basic usage:

    ```javascript
    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.addTickables(notesArray);
    ```

  - When using multiple voices, create one `Voice` per line of rhythm and pass all voices to the `Formatter`.

- **Formatter (`Formatter`)**
  - Responsible for aligning and justifying notes within a stave.
  - Common pattern:

    ```javascript
    const formatter = new Formatter();
    formatter.joinVoices([voice]).format([voice], 350);
    voice.draw(context, stave);
    ```

  - There is also a helper `Formatter.FormatAndDraw(context, stave, notes)` that:
    - Creates an internal voice in 4/4,
    - Formats the notes,
    - Draws them in one call.

---

### Modifiers (Accidentals, Dots, etc.)

- **General Modifier Pattern**
  - Modifiers attach to notes and are self‑positioning to obey engraving rules.
  - Many modifiers inherit from `Modifier`; you typically use helper classes directly (e.g. `Accidental`, `Dot`).

- **Accidentals**
  - Add accidentals explicitly unless you use higher‑level helpers:

    ```javascript
    const { StaveNote, Accidental } = Vex.Flow;

    const note = new StaveNote({ keys: ["eb/5"], duration: "16" }).addModifier(
      new Accidental("b")
    );
    ```

  - Valid accidental strings include `"b"`, `"#"`, `"n"`, `"bb"`, `"##"`, etc.
  - For auto‑accidentals based on key signature, use `Accidental.applyAccidentals(...)` (not covered in detail in the tutorial, but mentioned).

- **Dots (`Dot`)**
  - Add dots to all noteheads in a chord or to a specific index:

    ```javascript
    function dotted(note, noteIndex = -1) {
      if (noteIndex < 0) {
        Dot.buildAndAttach([note], { all: true });
      } else {
        Dot.buildAndAttach([note], { index: noteIndex });
      }
      return note;
    }
    ```

  - Duration strings like `"8d"` (dotted 8th) affect rhythm, but you still call `Dot` to render the dot glyphs.

---

### Beaming (`Beam`)

- **Manual Beams**
  - Create `Beam` objects from contiguous groups of notes in the same voice:

    ```javascript
    const beam = new Beam(noteGroup);
    Formatter.FormatAndDraw(context, stave, allNotes);
    beam.setContext(context).draw();
    ```

  - Manual beams are useful when you control grouping explicitly.

- **Automatic Beaming**
  - Use `Beam.generateBeams(notes, config?)` for automatic grouping and stem direction:

    ```javascript
    const beams = Beam.generateBeams(notes);
    Formatter.FormatAndDraw(context, stave, notes);
    beams.forEach((beam) => beam.setContext(context).draw());
    ```

  - `generateBeams`:
    - Analyzes durations and positions,
    - Decides stem directions for the whole beam group,
    - Groups notes appropriately based on time signature and config.

---

### Ties (`StaveTie`)

- **Basic Tie Usage**
  - Ties connect specific noteheads across two `StaveNote` instances.
  - You must specify:
    - `first_note` and `last_note`,
    - `first_indices` and `last_indices`: arrays of notehead indices within each chord.

    ```javascript
    const tie = new StaveTie({
      first_note: notes[4],
      last_note: notes[5],
      first_indices: [0],
      last_indices: [0],
    });

    tie.setContext(context).draw();
    ```

  - Multiple ties can be created for chords by using more indices.

---

### Guitar Tablature (`TabStave`, `TabNote`)

- **Tab Stave**
  - Use `TabStave` instead of `Stave` to render tablature lines:

    ```javascript
    const { TabStave } = Vex.Flow;

    const tabStave = new TabStave(10, 40, 400);
    tabStave.addClef("tab").setContext(context).draw();
    ```

- **Tab Notes**
  - Use `TabNote` with `positions` instead of `keys`:

    ```javascript
    const { TabNote, Bend, Vibrato } = Vex.Flow;

    const notes = [
      new TabNote({
        positions: [{ str: 3, fret: 7 }],
        duration: "q",
      }),
      new TabNote({
        positions: [
          { str: 2, fret: 10 },
          { str: 3, fret: 9 },
        ],
        duration: "q",
      }).addModifier(new Bend("Full"), 1),
    ];
    ```

  - `positions` is an array of `{ str, fret }` objects.
  - Tab notes can also have modifiers such as `Bend` and `Vibrato`.
  - Use `Formatter.FormatAndDraw(context, tabStave, notes)` for layout.

---

### Multiple Measures & Barlines

- **One Measure per Stave**
  - The VexFlow tutorial recommends treating each `Stave` as a single measure.
  - To show multiple measures on a line:
    - Create a `Stave` for measure 1, draw it.
    - Create another `Stave` whose `x` coordinate starts at the end of the previous stave:

      ```javascript
      const stave1 = new Stave(10, 0, 300);
      stave1.addClef("treble").setContext(context).draw();

      const stave2 = new Stave(stave1.x + stave1.width, 0, 400);
      stave2.setContext(context).draw();
      ```

  - Beams and notes for each measure are formatted independently with `Formatter`.

---

### Useful Reference Tables

- **VexFlow Tables (central lookup for valid values)**
  - The tutorial points to internal tables (e.g. `Flow.clefProperties.values`, `Flow.keyProperties.note_values`, `Flow.accidentalCodes.accidentals`, etc.) that define:
    - Valid clef names,
    - Valid key signatures,
    - Valid note names and accidentals,
    - Duration codes and ticks,
    - Articulation and ornament codes.
  - When building higher‑level game logic (e.g. random note generation or validation), these are the authoritative lists to align with.

---

### Patterns to Reuse in This Project

- **General Rendering Flow**
  - Create or reuse a `Renderer` and `context` per visual staff area.
  - For each measure:
    - Create a `Stave` and draw it.
    - Prepare `StaveNote` or `TabNote` arrays.
    - Optional: group notes into voices for polyphony.
    - Use `Formatter` (or `Formatter.FormatAndDraw`) to lay out and draw notes.
    - Create beams with `Beam.generateBeams` where appropriate and draw them.
    - Add ties (`StaveTie`) and other modifiers as needed.

- **Game‑Specific Considerations**
  - Keep a clean separation between:
    - **Data model** (pitches, durations, fingering, etc.),
    - **VexFlow representation** (keys, durations, modifiers, positions),
    - **Rendering** (stave geometry, beaming, formatting).
  - Use helper functions (like `dotted(note, index)`) to encapsulate repetitive modifier logic.
  - Prefer automatic mechanisms (`Formatter`, `Beam.generateBeams`, modifier self‑positioning) instead of hard‑coding coordinates or manual layout.
