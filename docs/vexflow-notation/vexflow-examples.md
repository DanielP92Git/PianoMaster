## VexFlow – Practical Code Examples

This file collects concrete, copy‑pasteable examples for patterns we are likely to use in the sight‑reading game, based on the official VexFlow site (`https://www.vexflow.com/`) and the [VexFlow Tutorial](https://github.com/0xfe/vexflow/wiki/Tutorial).  
For API overviews and explanations, see `vexflow-tutorial.md`. Use this file when you just need working snippets.

---

### 1. Basic SVG Renderer + Empty Stave

```javascript
import Vex from "vexflow"; // or appropriate import for your bundler

const { Renderer, Stave } = Vex.Flow;

// Attach to an existing DIV element.
const div = document.getElementById("output");

// Create SVG renderer.
const renderer = new Renderer(div, Renderer.Backends.SVG);

// Size the drawing surface.
renderer.resize(500, 500);
const context = renderer.getContext();

// Create a stave and add clef + time signature.
const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();
```

**What this shows:** the minimal setup pattern we will reuse whenever we need to render a staff to an HTML container.

---

### 2. Single Voice with Notes and a Chord

```javascript
const { Stave, StaveNote, Voice, Formatter } = Vex.Flow;

// Assume renderer + context already exist (see example 1).
const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();

// Create notes (3 single notes + 1 chord).
const notes = [
  // Quarter‑note C.
  new StaveNote({ keys: ["c/4"], duration: "q" }),

  // Quarter‑note D.
  new StaveNote({ keys: ["d/4"], duration: "q" }),

  // Quarter‑note rest (vertical position via "key").
  new StaveNote({ keys: ["b/4"], duration: "qr" }),

  // C‑major chord.
  new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
];

// One voice in 4/4, with the notes.
const voice = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(notes);

// Format and draw.
new Formatter().joinVoices([voice]).format([voice], 350);
voice.draw(context, stave);
```

**What this shows:** how to turn a list of `StaveNote`s into a properly spaced measure using `Voice` and `Formatter`.

---

### 3. Two Voices in the Same Measure

```javascript
const { Stave, StaveNote, Voice, Formatter } = Vex.Flow;

const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();

const notes1 = [
  new StaveNote({ keys: ["c/5"], duration: "q" }),
  new StaveNote({ keys: ["d/4"], duration: "q" }),
  new StaveNote({ keys: ["b/4"], duration: "qr" }),
  new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
];

const notes2 = [new StaveNote({ keys: ["c/4"], duration: "w" })];

const voice1 = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(notes1);
const voice2 = new Voice({ numBeats: 4, beatValue: 4 }).addTickables(notes2);

const voices = [voice1, voice2];
new Formatter().joinVoices(voices).format(voices, 350);

voices.forEach((v) => v.draw(context, stave));
```

**What this shows:** polyphonic notation — two independent voices sharing a stave.

---

### 4. Accidentals and Dots

```javascript
const { Stave, StaveNote, Accidental, Dot, Formatter } = Vex.Flow;

const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();

function dotted(staveNote, noteIndex = -1) {
  if (noteIndex < 0) {
    Dot.buildAndAttach([staveNote], { all: true });
  } else {
    Dot.buildAndAttach([staveNote], { index: noteIndex });
  }
  return staveNote;
}

const notes = [
  dotted(
    new StaveNote({
      keys: ["e##/5"],
      duration: "8d",
    }).addModifier(new Accidental("##"))
  ),

  new StaveNote({
    keys: ["eb/5"],
    duration: "16",
  }).addModifier(new Accidental("b")),

  dotted(
    new StaveNote({
      keys: ["eb/4", "d/5"],
      duration: "h",
    }),
    0 // add dot to the note at index 0 only
  ),

  dotted(
    new StaveNote({
      keys: ["c/5", "eb/5", "g#/5"],
      duration: "q",
    })
      .addModifier(new Accidental("b"), 1)
      .addModifier(new Accidental("#"), 2)
  ),
];

Formatter.FormatAndDraw(context, stave, notes);
```

**What this shows:** explicit accidentals, adding one or more dots to individual notes or all notes in a chord.

---

### 5. Manual Beams and Automatic Beaming

```javascript
const { Stave, StaveNote, Accidental, Beam, Formatter, Dot } = Vex.Flow;

const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();

function dotted(note) {
  Dot.buildAndAttach([note]);
  return note;
}

const notes = [
  dotted(
    new StaveNote({ keys: ["e##/5"], duration: "8d" }).addModifier(
      new Accidental("##")
    )
  ),
  new StaveNote({ keys: ["b/4"], duration: "16" }).addModifier(
    new Accidental("b")
  ),
  new StaveNote({ keys: ["c/4"], duration: "8" }),
  new StaveNote({ keys: ["d/4"], duration: "16" }),
  new StaveNote({ keys: ["e/4"], duration: "16" }).addModifier(
    new Accidental("b")
  ),
  new StaveNote({ keys: ["d/4"], duration: "16" }),
  new StaveNote({ keys: ["e/4"], duration: "16" }).addModifier(
    new Accidental("#")
  ),
  new StaveNote({ keys: ["g/4"], duration: "32" }),
  new StaveNote({ keys: ["a/4"], duration: "32" }),
  new StaveNote({ keys: ["g/4"], duration: "16" }),
  new StaveNote({ keys: ["d/4"], duration: "q" }),
];

// Automatic beams for all beaming‑eligible notes.
const beams = Beam.generateBeams(notes);
Formatter.FormatAndDraw(context, stave, notes);
beams.forEach((b) => b.setContext(context).draw());
```

**What this shows:** how to let VexFlow compute beam groups and stem directions automatically using `Beam.generateBeams`.

---

### 6. Ties Between Notes

```javascript
const { Stave, StaveNote, Accidental, Beam, Dot, StaveTie, Formatter } =
  Vex.Flow;

const stave = new Stave(10, 40, 400);
stave.addClef("treble").addTimeSignature("4/4");
stave.setContext(context).draw();

function dotted(note) {
  Dot.buildAndAttach([note]);
  return note;
}

const notes = [
  dotted(
    new StaveNote({
      keys: ["e##/5"],
      duration: "8d",
    }).addModifier(new Accidental("##"))
  ),
  new StaveNote({
    keys: ["b/4"],
    duration: "16",
  }).addModifier(new Accidental("b")),
  new StaveNote({ keys: ["c/4"], duration: "8" }),
  new StaveNote({ keys: ["d/4"], duration: "16" }),
  new StaveNote({ keys: ["d/4"], duration: "16" }),
  new StaveNote({ keys: ["d/4"], duration: "q" }),
  new StaveNote({ keys: ["d/4"], duration: "q" }),
];

const beams = Beam.generateBeams(notes);
Formatter.FormatAndDraw(context, stave, notes);
beams.forEach((b) => b.setContext(context).draw());

const ties = [
  new StaveTie({
    first_note: notes[4],
    last_note: notes[5],
    first_indices: [0],
    last_indices: [0],
  }),
  new StaveTie({
    first_note: notes[5],
    last_note: notes[6],
    first_indices: [0],
    last_indices: [0],
  }),
];

ties.forEach((t) => t.setContext(context).draw());
```

**What this shows:** tying specific noteheads between successive notes using `StaveTie`.

---

### 7. Guitar Tablature (TabStave + TabNote)

```javascript
const { Renderer, TabStave, TabNote, Bend, Vibrato, Formatter } = Vex.Flow;

const div = document.getElementById("output");
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(500, 300);
const context = renderer.getContext();

const stave = new TabStave(10, 40, 400);
stave.addClef("tab").setContext(context).draw();

const notes = [
  // A single note.
  new TabNote({
    positions: [{ str: 3, fret: 7 }],
    duration: "q",
  }),

  // A chord with the note on the 3rd string bent.
  new TabNote({
    positions: [
      { str: 2, fret: 10 },
      { str: 3, fret: 9 },
    ],
    duration: "q",
  }).addModifier(new Bend("Full"), 1),

  // A single note with a harsh vibrato.
  new TabNote({
    positions: [{ str: 2, fret: 5 }],
    duration: "h",
  }).addModifier(new Vibrato().setHarsh(true).setVibratoWidth(70), 0),
];

Formatter.FormatAndDraw(context, stave, notes);
```

**What this shows:** basic guitar tab rendering, including `Bend` and `Vibrato` modifiers.

---

### 8. Multiple Measures on a Single Line

```javascript
const { Stave, StaveNote, Beam, Formatter, Renderer } = Vex.Flow;

const div = document.getElementById("output");
const renderer = new Renderer(div, Renderer.Backends.SVG);
renderer.resize(720, 130);
const context = renderer.getContext();

// Measure 1.
const stave1 = new Stave(10, 0, 300);
stave1.addClef("treble").setContext(context).draw();

const notesMeasure1 = [
  new StaveNote({ keys: ["c/4"], duration: "q" }),
  new StaveNote({ keys: ["d/4"], duration: "q" }),
  new StaveNote({ keys: ["b/4"], duration: "qr" }),
  new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "q" }),
];

Formatter.FormatAndDraw(context, stave1, notesMeasure1);

// Measure 2 placed adjacent to measure 1.
const stave2 = new Stave(stave1.x + stave1.width, 0, 400);
stave2.setContext(context).draw();

const notesMeasure2_part1 = [
  new StaveNote({ keys: ["c/4"], duration: "8" }),
  new StaveNote({ keys: ["d/4"], duration: "8" }),
  new StaveNote({ keys: ["b/4"], duration: "8" }),
  new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "8" }),
];

const notesMeasure2_part2 = [
  new StaveNote({ keys: ["c/4"], duration: "8" }),
  new StaveNote({ keys: ["d/4"], duration: "8" }),
  new StaveNote({ keys: ["b/4"], duration: "8" }),
  new StaveNote({ keys: ["c/4", "e/4", "g/4"], duration: "8" }),
];

const beam1 = new Beam(notesMeasure2_part1);
const beam2 = new Beam(notesMeasure2_part2);

const notesMeasure2 = notesMeasure2_part1.concat(notesMeasure2_part2);
Formatter.FormatAndDraw(context, stave2, notesMeasure2);

beam1.setContext(context).draw();
beam2.setContext(context).draw();
```

**What this shows:** the “one measure per `Stave`” pattern, plus how to position later measures adjacent to earlier ones.

---

### 9. Where to Look Up Valid Values

When generating examples or random exercises in the game, rely on VexFlow’s internal tables for valid strings:

- Clefs: `Flow.clefProperties.values`
- Notes: `Flow.keyProperties.note_values`
- Accidentals: `Flow.accidentalCodes.accidentals`
- Key signatures: `Flow.keySignatures.keySpecs`
- Durations: `Flow.durationToTicks`
- Articulations: `Flow.articulationCodes.articulations`
- Ornaments: `Flow.ornamentCodes.ornaments`

These are described in more detail in the [VexFlow Tutorial](https://github.com/0xfe/vexflow/wiki/Tutorial) and are important when we synthesize notation programmatically.
