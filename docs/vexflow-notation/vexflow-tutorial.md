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

Source: [VexFlow Beam API](https://www.vexflow.com/build/docs/beam.html)

- **Overview**
  - Beams span over a set of `StemmableNotes` (e.g., `StaveNote`).
  - Beams automatically group notes and calculate stem directions based on note positions.
  - Beams are drawn after formatting notes with `Formatter`.

- **Manual Beams**
  - Create `Beam` objects from contiguous groups of notes in the same voice:

    ```javascript
    const beam = new Beam(noteGroup);
    Formatter.FormatAndDraw(context, stave, allNotes);
    beam.setContext(context).draw();
    ```

  - Manual beams are useful when you control grouping explicitly.

- **Automatic Beaming with `Beam.generateBeams()`**
  - Primary method for automatic beaming with configuration options:

    ```javascript
    const beams = Beam.generateBeams(notes, config);
    Formatter.FormatAndDraw(context, stave, notes);
    beams.forEach((beam) => beam.setContext(context).draw());
    ```

  - **Configuration Object** (`config`):
    - `groups`: Array of `Fraction` objects representing beat structure (e.g., `[new Fraction(2, 8)]` for beaming in groups of 2 eighth notes). Defaults to `[new Fraction(2, 8)]` if not provided.
    - `stem_direction`: Set to `Stem.UP` or `Stem.DOWN` to apply the same direction to all notes in beams.
    - `beam_rests`: Set to `true` to include rests in the beams.
    - `beam_middle_only`: Set to `true` to only beam rests in the middle of the beat.
    - `show_stemlets`: Set to `true` to draw stemlets for rests.
    - `maintain_stem_directions`: Set to `true` to preserve existing stem directions without applying new ones.

  - **How `generateBeams` works**:
    - Analyzes note durations and positions.
    - Groups notes based on time signature and `groups` configuration.
    - Calculates stem directions for the whole beam group (unless `maintain_stem_directions` is true).
    - Returns an array of `Beam` objects.

- **Helper Methods**
  - `Beam.getDefaultBeamGroups(time_sig)`: Returns default beam groupings for a time signature.
    - Examples: `'4/4'` → `['1/4']`, `'3/8'` → `['3/8']`, `'2/8'` → `['2/8']`.
    - Falls back to naive calculation if time signature not found in table.
  - `Beam.applyAndGetBeams(voice, stem_direction, groups)`: Helper to automatically build beams for a voice with specified stem direction and groups.

- **Stem Direction Calculation**
  - By default, beams calculate stem direction based on note positions:
    - Sums the line positions of all noteheads in the beam group.
    - If sum ≥ 0 (notes on or above middle line), uses `Stem.DOWN`.
    - If sum < 0 (notes below middle line), uses `Stem.UP`.
  - This automatic calculation can be overridden with `stem_direction` in config or `maintain_stem_directions: true`.

- **Beam Rendering Lifecycle**
  - **Pre-format**: `beam.preFormat()` - Called before note formatting.
  - **Post-format**: `beam.postFormat()` - Called after notes are formatted and have x/y positions. Calculates beam slope and applies stem extensions.
  - **Draw**: `beam.draw()` - Renders stems and beam lines. Must be called after formatting.

- **Beam Properties**
  - Beams automatically calculate slope based on first and last note positions.
  - Beams can be forced flat with `render_options.flat_beams`.
  - Beam width and spacing are configurable via `render_options`.

---

### Stems (`Stem`)

Source: [VexFlow Stem API](https://www.vexflow.com/build/docs/stem.html)

- **Overview**
  - The `Stem` object is generally handled by its parent `StemmableNote` (e.g., `StaveNote`).
  - Stems are automatically created for notes, but you can control their direction and properties.

- **Stem Directions**
  - Use constants to specify stem direction:
    - `Stem.UP` (value: `1`) - Stem points upward
    - `Stem.DOWN` (value: `-1`) - Stem points downward
  - Set stem direction on a `StaveNote`:
    ```javascript
    const note = new StaveNote({ keys: ["c/4"], duration: "q" });
    note.setStemDirection(Stem.UP);
    ```

- **Stem Properties**
  - **Position**: Up stems are rendered to the right of the notehead; down stems to the left.
  - **Height**: Stems automatically extend based on note position and any flags/beams.
  - **Extension**: Stems can have extensions for flags or beams via `setExtension(ext)`.

- **Working with Beams**
  - When using `Beam.generateBeams()`, stem directions are automatically calculated for beamed note groups.
  - To force a specific stem direction for all notes (including beamed ones):
    1. Set stem direction on notes before generating beams.
    2. Generate beams: `const beams = Beam.generateBeams(notes)`.
    3. After beaming, explicitly set stem direction again to ensure it's preserved:
       ```javascript
       const beams = Beam.generateBeams(notes);
       notes.forEach((note) => {
         if (!note.isRest()) {
           note.setStemDirection(Stem.UP);
         }
       });
       ```

- **Stem Methods**
  - `setDirection(direction)` - Set the stem direction (`Stem.UP` or `Stem.DOWN`).
  - `setExtension(ext)` - Set extension length for flags or beams.
  - `setYBounds(y_top, y_bottom)` - Set Y bounds for top and bottom noteheads (for chords).
  - `setNoteHeadXBounds(x_begin, x_end)` - Set X bounds for the notehead.
  - `getExtents()` - Returns `{ topY, baseY }` coordinates for the stem's full extent.
  - `setVisibility(isVisible)` - Show or hide the stem.
  - `setStyle(style)` - Apply custom drawing style (stroke, shadow, etc.).

- **Important Notes**
  - Stems are automatically created for notes with durations shorter than whole notes.
  - Rests do not have stems.
  - For chords, the stem direction affects all noteheads in the chord.
  - When manually setting stem direction, ensure consistency across beamed note groups.

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
