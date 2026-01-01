import {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useId,
  useState,
} from "react";
import {
  initializeVexFlow,
  calculateOptimalWidth,
} from "../utils/vexflowHelpers";
import {
  Formatter,
  Stave,
  Voice,
  StaveNote,
  Dot,
  StaveConnector,
} from "vexflow";

const NOTE_TO_SEMITONE = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

const noteNameToMidi = (pitch) => {
  if (!pitch) return null;
  const match = pitch.match(/^([A-Ga-g])([#b]?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const baseLetter = letter.toUpperCase();
  const noteKey =
    accidental === "b"
      ? (() => {
          const flatMap = {
            CB: "B",
            DB: "C#",
            EB: "D#",
            FB: "E",
            GB: "F#",
            AB: "G#",
            BB: "A#",
          };
          return flatMap[`${baseLetter}B`] || baseLetter;
        })()
      : `${baseLetter}${accidental === "#" ? "#" : ""}`;
  const semitone = NOTE_TO_SEMITONE[noteKey];
  if (semitone === undefined) return null;

  const octave = parseInt(octaveStr, 10);
  if (Number.isNaN(octave)) return null;

  return (octave + 1) * 12 + semitone;
};

const STEM_REFERENCE_MIDI = {
  treble: noteNameToMidi("B4"),
  bass: noteNameToMidi("D3"),
};

const getStemDirectionForPitch = (pitch, clef) => {
  const midi = noteNameToMidi(pitch);
  if (midi === null) return 1;
  const reference = STEM_REFERENCE_MIDI[clef] ?? STEM_REFERENCE_MIDI["treble"];
  return midi > reference ? -1 : 1;
};

/**
 * VexFlowStaffDisplay Component
 * Renders musical notation using VexFlow library
 *
 * @param {Object} pattern - Pattern object with easyscoreString, timeSignature, totalDuration, notes
 * @param {number} currentNoteIndex - Index of currently playing note for highlighting
 * @param {string} clef - 'treble' or 'bass' (default: 'treble')
 * @param {Array} performanceResults - Array of performance results for each note (optional, for feedback)
 */
export function VexFlowStaffDisplay({
  pattern,
  currentNoteIndex,
  clef = "treble",
  performanceResults = [],
  gamePhase,
  cursorTime = 0, // Elapsed time in seconds for smooth cursor movement
}) {
  // Generate unique ID for this component instance
  const uniqueId = useId();
  const containerId = `vexflow-staff-${uniqueId.replace(/:/g, "-")}`;

  // Refs
  const containerRef = useRef(null); // Outer React-managed container
  const vexContainerRef = useRef(null); // Inner VexFlow-only container
  const vfRef = useRef(null);
  const notesRef = useRef([]);
  const eventGeometryRef = useRef([]); // Store {startTime, endTime, centerX} for each event
  const prevPatternRef = useRef(null);
  const prevClefRef = useRef(null);
  const prevGamePhaseRef = useRef(null);
  const [cursorX, setCursorX] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Error state
  const [error, setError] = useState(null);

  // Memoize width calculation for performance
  const staffWidth = useMemo(() => {
    if (!pattern || !pattern.totalDuration) return 700;
    return calculateOptimalWidth(pattern.totalDuration, pattern.timeSignature);
  }, [pattern]);

  // Track container dimensions for responsive rendering
  useEffect(() => {
    if (typeof window === "undefined") return;
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize((prev) => {
        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);
        if (prev.width === roundedWidth && prev.height === roundedHeight) {
          return prev;
        }
        return {
          width: roundedWidth,
          height: roundedHeight,
        };
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const responsiveWidth = useMemo(() => {
    if (!containerSize.width) return staffWidth;
    const padding = 16; // allow for minimal card inner padding
    const availableWidth = Math.max(containerSize.width - padding, 320);
    const maxWidth = 1400;
    return Math.min(availableWidth, maxWidth);
  }, [containerSize.width, staffWidth]);

  const responsiveHeight = useMemo(() => {
    const MIN_STAFF_HEIGHT = 180; // Minimum height for ledger lines
    if (!containerSize.height) return MIN_STAFF_HEIGHT;
    // Use container height directly but enforce minimum for ledger lines
    // Parent container handles overflow
    return Math.max(containerSize.height, MIN_STAFF_HEIGHT);
  }, [containerSize.height]);

  /**
   * Extract note SVG elements from rendered VexFlow for highlighting
   * Only returns expected notes (not wrong note overlays)
   */
  const extractNoteElements = useCallback(() => {
    if (!vexContainerRef.current || !pattern?.notes) return [];

    try {
      const clefKey = String(clef || "treble").toLowerCase();
      const allNoteElements =
        vexContainerRef.current.querySelectorAll(".vf-stavenote");
      const noteElementsArray = Array.from(allNoteElements);
      const eventCount = pattern.notes.length;

      // Grand staff mode: we render two expected voices (treble first, bass second),
      // each with one tickable per event. Map each event to its staff element.
      if (clefKey === "both") {
        const trebleExpected = noteElementsArray.slice(0, eventCount);
        const bassExpected = noteElementsArray.slice(
          eventCount,
          eventCount * 2
        );

        // If we can't reliably split, fallback to the first eventCount.
        if (
          trebleExpected.length !== eventCount ||
          bassExpected.length !== eventCount
        ) {
          return noteElementsArray.slice(0, eventCount);
        }

        return pattern.notes.map((event, idx) => {
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (eventClef === "bass") {
            return bassExpected[idx] || trebleExpected[idx] || null;
          }
          return trebleExpected[idx] || bassExpected[idx] || null;
        });
      }

      // Single staff mode: the expected notes are the first pattern.notes.length elements.
      return noteElementsArray.slice(0, eventCount);
    } catch (err) {
      console.warn("Failed to extract note elements:", err);
      return [];
    }
  }, [pattern?.notes, clef]);

  /**
   * Build event geometry for time-based cursor interpolation
   */
  const buildEventGeometry = useCallback(() => {
    if (
      !pattern ||
      !pattern.notes ||
      !notesRef.current ||
      !containerRef.current
    ) {
      eventGeometryRef.current = [];
      return;
    }

    try {
      const containerRect = containerRef.current.getBoundingClientRect();
      eventGeometryRef.current = pattern.notes.map((event, idx) => {
        const noteElement = notesRef.current[idx];
        if (!noteElement || !noteElement.getBoundingClientRect) {
          return {
            startTime: event.startTime || 0,
            endTime: event.endTime || 0,
            centerX: 0,
          };
        }

        const noteRect = noteElement.getBoundingClientRect();
        const centerX = noteRect.left - containerRect.left + noteRect.width / 2;

        return {
          startTime: event.startTime || 0,
          endTime: event.endTime || 0,
          centerX,
        };
      });
    } catch (err) {
      console.warn("Failed to build event geometry:", err);
      eventGeometryRef.current = [];
    }
  }, [pattern]);

  const makeSvgResponsive = useCallback((svgWidth, svgHeight) => {
    if (!vexContainerRef.current) return;
    const svg = vexContainerRef.current.querySelector("svg");
    if (!svg) return;
    // ViewBox matches canvas size; use container height to prevent overflow
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Center horizontally and vertically
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
    svg.style.overflow = "visible"; // Allow overflow for ledger lines
    svg.style.paddingTop = "5px";
    svg.style.paddingBottom = "5px";
  }, []);

  /**
   * Render staff with VexFlow using lower-level API
   */
  const renderStaff = useCallback(() => {
    if (!vexContainerRef.current || !pattern?.easyscoreString) return;

    try {
      // Clear previous VexFlow rendering (only touches VexFlow container, not React children)
      vexContainerRef.current.innerHTML = "";

      // Calculate expected beats based on time signature
      const [beatsPerMeasure] = pattern.timeSignature.split("/").map(Number);
      const expectedDuration = beatsPerMeasure;

      // DEBUG: Log pattern details

      // Check if pattern needs padding
      let easyscoreString = pattern.easyscoreString;
      const durationDiff = expectedDuration - pattern.totalDuration;

      // More lenient epsilon for floating point comparison
      if (Math.abs(durationDiff) > 0.001) {
        if (durationDiff > 0) {
          // Pad with rest to complete the measure
          const remainingDuration = durationDiff;

          // More precise rest selection
          let restNotation;
          if (remainingDuration >= 3.5) {
            restNotation = "w"; // whole rest
          } else if (remainingDuration >= 2.5) {
            restNotation = "h."; // dotted half
          } else if (remainingDuration >= 1.5) {
            restNotation = "h"; // half rest
          } else if (remainingDuration >= 1.25) {
            restNotation = "q."; // dotted quarter
          } else if (remainingDuration >= 0.75) {
            restNotation = "q"; // quarter rest
          } else if (remainingDuration >= 0.625) {
            restNotation = "8."; // dotted eighth
          } else if (remainingDuration >= 0.375) {
            restNotation = "8"; // eighth rest
          } else {
            restNotation = "16"; // sixteenth rest
          }

          easyscoreString = `${pattern.easyscoreString}, B4/${restNotation}/r`;
          console.debug("[VexFlowStaffDisplay]", {
            easyscoreString,
            restNotation,
            remainingDuration,
          });
        } else {
          console.warn(`Pattern is ${Math.abs(durationDiff)} beats too long!`);
        }
      } else {
        console.debug("[VexFlowStaffDisplay]", {
          pattern,
          durationDiff,
        });
      }

      // Determine responsive canvas dimensions
      // Add extra height to account for ledger lines (especially bottom space for bass notes)
      const ledgerLineBuffer = 80; // Extra space for bottom ledger lines

      // Scale factor to enlarge staff and notes
      const STAFF_SCALE = 5.5;

      // Keep canvas dimensions in original coordinates (context scaling will handle rendering size)
      const canvasHeight = (responsiveHeight || 200) + ledgerLineBuffer;
      const canvasWidth = responsiveWidth || staffWidth;

      // Add padding to renderer size to prevent clipping (MOST IMPORTANT FIX)
      const PADDING_X = 60;
      const PADDING_Y = 80;

      // Initialize VexFlow with scaled dimensions + padding
      const vf = initializeVexFlow(
        containerId,
        canvasWidth + PADDING_X,
        canvasHeight + PADDING_Y
      );
      vfRef.current = vf;

      // Force SVG overflow visible immediately after renderer creation (CRITICAL FIX)
      const svg = vexContainerRef.current?.querySelector("svg");
      if (svg) {
        svg.style.overflow = "visible";
      }

      // Get the renderer context
      const context = vf.getContext();

      // Apply scale to context for larger rendering
      context.scale(STAFF_SCALE, STAFF_SCALE);

      // Calculate formatter width based on stave width (accounts for new padding)
      const STAVE_WIDTH_BASE = Math.max(canvasWidth - 60, 240);
      const formatterWidth = Math.max(STAVE_WIDTH_BASE - 140, 200);

      const clefKey = String(clef || "treble").toLowerCase();

      const parsePitchForVexflow = (pitchStr) => {
        if (!pitchStr) return { key: "c/4", accidental: null };
        const raw = String(pitchStr).trim().replace(/\s+/g, "");
        const match = raw.match(/^([A-Ga-g])([#b]?)(\d)$/);
        if (!match) return { key: "c/4", accidental: null };
        const [, letterRaw, accidentalRaw, octaveRaw] = match;
        const key = `${letterRaw.toLowerCase()}/${octaveRaw}`;
        const accidental =
          accidentalRaw === "#" ? "#" : accidentalRaw === "b" ? "b" : null;
        return { key, accidental };
      };

      const toVexKey = (pitchStr) => parsePitchForVexflow(pitchStr).key;

      const buildStaveNote = ({ pitchStr, duration, targetClef }) => {
        const isRest = String(duration || "").endsWith("r");
        const cleanDuration = String(duration || "q").replace(/r$/, "");
        const parsedPitch = isRest ? null : parsePitchForVexflow(pitchStr);
        const vexflowKey = isRest
          ? targetClef === "bass"
            ? "d/3"
            : "b/4"
          : parsedPitch.key;

        const noteConfig = {
          keys: [vexflowKey],
          duration: isRest ? `${cleanDuration}r` : cleanDuration,
          clef: targetClef,
        };

        const note = new StaveNote(noteConfig);
        if (!isRest && parsedPitch?.accidental) {
          // Add accidental glyph (e.g., b or #) when present in pitch string.
          note.addModifier(new Accidental(parsedPitch.accidental), 0);
        }
        if (!isRest && pitchStr) {
          note.setStemDirection(getStemDirectionForPitch(pitchStr, targetClef));
        }
        return note;
      };

      const buildSpacerRest = (duration, targetClef) => {
        const cleanDuration = String(duration || "q").replace(/r$/, "");
        const restKey = targetClef === "bass" ? "d/3" : "b/4";
        const spacer = new StaveNote({
          keys: [restKey],
          duration: `${cleanDuration}r`,
          clef: targetClef,
        });
        spacer.setStyle({
          fillStyle: "transparent",
          strokeStyle: "transparent",
        });
        return spacer;
      };

      if (clefKey === "both") {
        // Grand staff rendering: treble + bass staves
        // Add extra space for ledger lines above treble and below bass
        const ledgerLineSpaceTop = 30; // Reduced top space for ledger lines
        const ledgerLineSpaceBottom = 80; // Increased space below for bass ledger lines to prevent cropping
        const staffGap = Math.max(70, Math.min(110, canvasHeight * 0.28));
        const staffHeight = 50; // Increased from 40 to 50 for larger staff
        // Position the grand staff with reduced top space but ensuring bottom space
        // Calculate total height needed
        const totalStaffHeight = staffGap + staffHeight;
        const totalNeededHeight =
          totalStaffHeight + ledgerLineSpaceTop + ledgerLineSpaceBottom;
        // Center the staff vertically in the available canvas space
        // Stave positioning constants - move inward from edges to prevent clipping
        const STAVE_X = 30;
        const STAVE_WIDTH = Math.max(canvasWidth - 60, 240); // Leave 30px on each side

        // Center vertically: calculate available space and center the staff
        const verticalCenter =
          (canvasHeight - totalNeededHeight) / 2 + ledgerLineSpaceTop;
        const yTreble = Math.max(ledgerLineSpaceTop, verticalCenter);
        const yBass = yTreble + staffGap;

        const trebleStave = new Stave(STAVE_X, yTreble, STAVE_WIDTH);
        trebleStave.addClef("treble");
        trebleStave.addTimeSignature(pattern.timeSignature);
        trebleStave.setContext(context).draw();

        const bassStave = new Stave(STAVE_X, yBass, STAVE_WIDTH);
        bassStave.addClef("bass");
        bassStave.addTimeSignature(pattern.timeSignature);
        bassStave.setEndBarType(2);
        bassStave.setContext(context).draw();

        // Connectors for grand staff
        try {
          new StaveConnector(trebleStave, bassStave)
            .setType(StaveConnector.type.BRACE)
            .setContext(context)
            .draw();
          new StaveConnector(trebleStave, bassStave)
            .setType(StaveConnector.type.SINGLE_LEFT)
            .setContext(context)
            .draw();
          new StaveConnector(trebleStave, bassStave)
            .setType(StaveConnector.type.SINGLE_RIGHT)
            .setContext(context)
            .draw();
        } catch (err) {
          console.warn("Failed to draw stave connectors:", err);
        }

        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y);

        const events = Array.isArray(pattern.notes) ? pattern.notes : [];
        const durations =
          Array.isArray(pattern.vexflowNotes) &&
          pattern.vexflowNotes.length === events.length
            ? pattern.vexflowNotes.map((n) => n?.duration || "q")
            : events.map(() => "q");

        const trebleTickables = events.map((event, idx) => {
          const duration = durations[idx] || "q";
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (event.type === "rest") {
            return buildStaveNote({
              pitchStr: null,
              duration: `${duration.replace(/r$/, "")}r`,
              targetClef: "treble",
            });
          }
          if (eventClef === "treble") {
            return buildStaveNote({
              pitchStr: event.pitch,
              duration,
              targetClef: "treble",
            });
          }
          return buildSpacerRest(duration, "treble");
        });

        const bassTickables = events.map((event, idx) => {
          const duration = durations[idx] || "q";
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (event.type === "rest") {
            return buildSpacerRest(duration, "bass");
          }
          if (eventClef === "bass") {
            return buildStaveNote({
              pitchStr: event.pitch,
              duration,
              targetClef: "bass",
            });
          }
          return buildSpacerRest(duration, "bass");
        });

        const trebleVoice = new Voice({
          num_beats: pattern.totalDuration,
          beat_value: 4,
        }).setMode(Voice.Mode.SOFT);
        trebleVoice.addTickables(trebleTickables);

        const bassVoice = new Voice({
          num_beats: pattern.totalDuration,
          beat_value: 4,
        }).setMode(Voice.Mode.SOFT);
        bassVoice.addTickables(bassTickables);

        const isFeedback =
          gamePhase === "feedback" && performanceResults.length > 0;
        const wrongPitchResults = isFeedback
          ? performanceResults.filter(
              (r) => r.timingStatus === "wrong_pitch" && r.detected
            )
          : [];

        const hasWrong = wrongPitchResults.length > 0;

        let wrongTrebleVoice = null;
        let wrongBassVoice = null;

        if (hasWrong) {
          const wrongTrebleTickables = events.map((event, idx) => {
            const duration = durations[idx] || "q";
            const eventClef = String(event?.clef || "treble").toLowerCase();
            const result = wrongPitchResults.find((r) => r.noteIndex === idx);
            if (!result || event.type === "rest" || eventClef !== "treble") {
              return buildSpacerRest(duration, "treble");
            }
            const wrong = buildStaveNote({
              pitchStr: result.detected,
              duration,
              targetClef: "treble",
            });
            wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
            return wrong;
          });

          const wrongBassTickables = events.map((event, idx) => {
            const duration = durations[idx] || "q";
            const eventClef = String(event?.clef || "treble").toLowerCase();
            const result = wrongPitchResults.find((r) => r.noteIndex === idx);
            if (!result || event.type === "rest" || eventClef !== "bass") {
              return buildSpacerRest(duration, "bass");
            }
            const wrong = buildStaveNote({
              pitchStr: result.detected,
              duration,
              targetClef: "bass",
            });
            wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
            return wrong;
          });

          wrongTrebleVoice = new Voice({
            num_beats: pattern.totalDuration,
            beat_value: 4,
          }).setMode(Voice.Mode.SOFT);
          wrongTrebleVoice.addTickables(wrongTrebleTickables);

          wrongBassVoice = new Voice({
            num_beats: pattern.totalDuration,
            beat_value: 4,
          }).setMode(Voice.Mode.SOFT);
          wrongBassVoice.addTickables(wrongBassTickables);
        }

        // Format voices (expected + wrong per staff) to keep alignment
        if (wrongTrebleVoice) {
          const voices = [trebleVoice, wrongTrebleVoice];
          new Formatter().joinVoices(voices).format(voices, formatterWidth);
        } else {
          new Formatter()
            .joinVoices([trebleVoice])
            .format([trebleVoice], formatterWidth);
        }
        if (wrongBassVoice) {
          const voices = [bassVoice, wrongBassVoice];
          new Formatter().joinVoices(voices).format(voices, formatterWidth);
        } else {
          new Formatter()
            .joinVoices([bassVoice])
            .format([bassVoice], formatterWidth);
        }

        // Draw expected voices first
        trebleVoice.draw(context, trebleStave);
        bassVoice.draw(context, bassStave);

        // Draw wrong voices on top (if any)
        if (wrongTrebleVoice) {
          wrongTrebleVoice.draw(context, trebleStave);
        }
        if (wrongBassVoice) {
          wrongBassVoice.draw(context, bassStave);
        }
      } else {
        // Single staff rendering (existing behavior)
        // Add extra space for ledger lines above and below
        const ledgerLineSpaceTop = 30; // Reduced top space for ledger lines
        const ledgerLineSpaceBottom = 80; // Increased space below for bass ledger lines to prevent cropping
        const staffHeight = 50; // Increased from 40 to 50 for larger staff
        // Position the staff with reduced top space but ensuring bottom space
        const totalNeededHeight =
          staffHeight + ledgerLineSpaceTop + ledgerLineSpaceBottom;
        // Center the staff vertically in the available canvas space
        // Stave positioning constants - move inward from edges to prevent clipping
        const STAVE_X = 30;
        const STAVE_WIDTH = Math.max(canvasWidth - 60, 240); // Leave 30px on each side

        // Center vertically: calculate available space and center the staff
        const verticalCenter =
          (canvasHeight - totalNeededHeight) / 2 + ledgerLineSpaceTop;
        const yPosition = Math.max(ledgerLineSpaceTop, verticalCenter);

        const stave = new Stave(STAVE_X, yPosition, STAVE_WIDTH);
        stave.addClef(clef);
        stave.addTimeSignature(pattern.timeSignature);
        stave.setEndBarType(2); // Double barline
        stave.setContext(context).draw();
        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y);

        // Parse EasyScore string manually to create StaveNotes
        const staveNotes = easyscoreString.split(",").map((noteStr) => {
          noteStr = noteStr.trim();

          // Parse format: "C4/q" or "B4/q/r" or "C4/q."
          const isRest = noteStr.includes("/r");
          const parts = noteStr.split("/");
          const pitchStr = parts[0]; // e.g., "C4" or "B4"
          let duration = parts[1]; // e.g., "q", "h", "8", "q.", "h."

          // Check for dotted notes (e.g., "q.", "h.", "8.")
          const isDotted = duration && duration.endsWith(".");
          if (isDotted) {
            duration = duration.slice(0, -1); // Remove the dot: "q." -> "q"
          }

          // For rests, use the correct rest position key based on clef
          let vexflowKey;
          const parsedPitch = isRest ? null : parsePitchForVexflow(pitchStr);
          if (isRest) {
            vexflowKey = clef === "bass" ? "d/3" : "b/4";
          } else {
            vexflowKey = parsedPitch.key;
          }

          const noteConfig = {
            keys: [vexflowKey],
            duration: isRest ? `${duration}r` : duration,
            clef: clef,
          };

          const staveNote = new StaveNote(noteConfig);
          if (!isRest && parsedPitch?.accidental) {
            staveNote.addModifier(new Accidental(parsedPitch.accidental), 0);
          }

          if (!isRest) {
            const stemDirection = getStemDirectionForPitch(pitchStr, clef);
            staveNote.setStemDirection(stemDirection);
          }

          if (isDotted) {
            for (let i = 0; i < noteConfig.keys.length; i++) {
              staveNote.addModifier(new Dot(), i);
            }
          }

          return staveNote;
        });

        const voice = new Voice({
          num_beats: pattern.totalDuration,
          beat_value: 4,
        });
        voice.setMode(Voice.Mode.SOFT);
        voice.addTickables(staveNotes);

        let wrongVoice = null;
        if (gamePhase === "feedback" && performanceResults.length > 0) {
          const wrongPitchResults = performanceResults.filter(
            (r) => r.timingStatus === "wrong_pitch" && r.detected
          );

          if (wrongPitchResults.length > 0) {
            const wrongStaveNotes = staveNotes.map((expectedNote, idx) => {
              const result = performanceResults.find(
                (r) =>
                  r.noteIndex === idx &&
                  r.timingStatus === "wrong_pitch" &&
                  r.detected
              );

              if (result) {
                const playedNote = result.detected;
                const parsedPlayed = parsePitchForVexflow(playedNote);
                const vexKey = parsedPlayed.key;
                const duration = expectedNote.duration;
                const cleanDuration = duration.replace(/r$/, "");

                const wrongNote = new StaveNote({
                  keys: [vexKey],
                  duration: cleanDuration,
                  clef: clef,
                });
                if (parsedPlayed?.accidental) {
                  wrongNote.addModifier(
                    new Accidental(parsedPlayed.accidental),
                    0
                  );
                }

                const wrongStemDirection = getStemDirectionForPitch(
                  playedNote,
                  clef
                );
                wrongNote.setStemDirection(wrongStemDirection);

                wrongNote.setStyle({
                  fillStyle: "#EF4444",
                  strokeStyle: "#EF4444",
                });

                return wrongNote;
              }

              const duration = expectedNote.duration;
              const cleanDuration = duration.replace(/r$/, "");
              return buildSpacerRest(cleanDuration, clef);
            });

            wrongVoice = new Voice({
              num_beats: pattern.totalDuration,
              beat_value: 4,
            });
            wrongVoice.setMode(Voice.Mode.SOFT);
            wrongVoice.addTickables(wrongStaveNotes);
          }
        }

        if (wrongVoice) {
          const voices = [voice, wrongVoice];
          new Formatter().joinVoices(voices).format(voices, formatterWidth);
          voice.draw(context, stave);
          wrongVoice.draw(context, stave);
        } else {
          new Formatter().joinVoices([voice]).format([voice], formatterWidth);
          voice.draw(context, stave);
        }
      }

      // Extract note elements for highlighting
      notesRef.current = extractNoteElements();
      console.debug("[VexFlowStaffDisplay]", {
        notesRef: notesRef.current.length,
      });

      // Build event geometry for time-based cursor movement
      buildEventGeometry();

      // Clear any previous error
      setError(null);
    } catch (err) {
      console.error("VexFlow rendering error:", err);
      setError(err.message || "Rendering failed");
    }
  }, [
    containerId,
    staffWidth,
    responsiveWidth,
    responsiveHeight,
    pattern?.easyscoreString,
    pattern?.timeSignature,
    pattern?.totalDuration,
    pattern?.notes,
    clef,
    extractNoteElements,
    buildEventGeometry,
    gamePhase,
    performanceResults,
    makeSvgResponsive,
  ]);

  /**
   * Get color based on performance result (improved UX)
   * - GREEN: Correct pitch + perfect/good timing, OR expected note when wrong pitch played
   * - YELLOW/ORANGE: Correct pitch + early/late/okay timing
   * - RED (separate note): Wrong pitch played (shown as additional note on staff)
   * - DARK ORANGE/AMBER: Missed (no detection within window) - distinct from not attempted
   * - LIGHT GRAY: Not attempted yet
   * - PURPLE: Currently expected (active)
   */
  const getNoteColor = useCallback(
    (noteIndex) => {
      // Find the performance result for this specific note by matching noteIndex
      const result = performanceResults.find((r) => r.noteIndex === noteIndex);

      // If this is the current note being played and no result yet, show purple highlight
      // BUT only during PERFORMANCE phase (not in FEEDBACK/DISPLAY)
      if (
        noteIndex === currentNoteIndex &&
        !result &&
        gamePhase === "performance"
      ) {
        return {
          fill: "#8B5CF6",
          stroke: "#8B5CF6",
          class: "vf-note-active",
          animate: false,
        }; // Purple (no pulse)
      }

      // No result yet - black (default music notation color)
      if (!result) {
        return {
          fill: "#000000",
          stroke: "#000000",
          class: "",
          animate: false,
        }; // Black - not attempted (standard musical notation)
      }

      // Missed note - distinct dark orange/amber color
      if (result.timingStatus === "missed") {
        return {
          fill: "#ee24ccac",
          stroke: "#ee24ccac",
          class: "vf-note-missed",
          animate: false,
        }; // Dark orange/amber - missed (you didn't play this note)
      }

      // Wrong pitch - GREEN for expected note (clearer UX - shows what was expected)
      // The played wrong note is shown in RED separately
      if (!result.isCorrect || result.timingStatus === "wrong_pitch") {
        return {
          fill: "#10B981ac",
          stroke: "#10B981ac",
          class: "vf-note-incorrect",
          animate: false,
        }; // Green - expected note (what you should have played)
      }

      // Correct pitch with perfect/good timing - green
      if (result.timingStatus === "perfect" || result.timingStatus === "good") {
        return {
          fill: "#10B981",
          stroke: "#10B981",
          class: "vf-note-correct",
          animate: false,
        }; // Green - correct
      }

      // Correct pitch but timing off (early/late/okay) - yellow/orange
      return {
        fill: "#F59E0B",
        stroke: "#F59E0B",
        class: "vf-note-timing-off",
        animate: false,
      }; // Yellow/Orange - timing issue
    },
    [currentNoteIndex, performanceResults, gamePhase]
  );

  /**
   * Highlight and color notes based on performance
   * Optimized to only update when index or results change
   * Guards against stale refs during pattern changes
   */
  const highlightNote = useCallback(
    (noteIndex) => {
      if (!notesRef.current || notesRef.current.length === 0) {
        // No notes available yet, reset cursor
        setCursorX(null);
        return;
      }

      try {
        // Update all notes based on their status
        notesRef.current.forEach((noteElement, idx) => {
          if (noteElement) {
            const colorInfo = getNoteColor(idx);
            const { fill, stroke, class: className } = colorInfo;

            noteElement.setAttribute("class", `vf-stavenote ${className}`);
            noteElement.setAttribute("fill", fill);

            // Set stroke for stems (especially important for semi-transparent colors)
            if (stroke) {
              noteElement.setAttribute("stroke", stroke);
            } else {
              noteElement.setAttribute("stroke", fill);
            }

            // Remove any animation (pulsing effect removed as per user request)
            if (noteElement.style) {
              noteElement.style.animation = "";
            }
          }
        });

        // Update cursor position for the active note
        if (
          noteIndex >= 0 &&
          noteIndex < notesRef.current.length &&
          containerRef.current
        ) {
          const activeNote = notesRef.current[noteIndex];
          if (activeNote && activeNote.getBoundingClientRect) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const noteRect = activeNote.getBoundingClientRect();
            // Position cursor slightly before the note (12px offset)
            const x = noteRect.left - containerRect.left - 12;
            setCursorX(x);
          }
        } else {
          // Index out of bounds or no container, reset cursor
          setCursorX(null);
        }
      } catch (err) {
        console.warn("Failed to highlight note:", err);
        setCursorX(null);
      }
    },
    [getNoteColor]
  );

  // Effect: Render staff when pattern, clef, or game phase changes
  // Optimized to avoid unnecessary re-renders
  useEffect(() => {
    // Check if pattern or clef actually changed
    const patternChanged = prevPatternRef.current !== pattern?.easyscoreString;
    const clefChanged = prevClefRef.current !== clef;

    // Check if container is empty (StrictMode may have cleared it between renders)
    const containerEmpty =
      vexContainerRef.current && vexContainerRef.current.children.length === 0;

    // IMPORTANT: Re-render when TRANSITIONING TO feedback phase to show wrong notes
    const justEnteredFeedback =
      gamePhase === "feedback" &&
      prevGamePhaseRef.current !== "feedback" &&
      performanceResults.length > 0;

    // IMPORTANT: Re-render when EXITING feedback phase to clear wrong notes
    const justLeftFeedback =
      prevGamePhaseRef.current === "feedback" && gamePhase !== "feedback";

    if (
      patternChanged ||
      clefChanged ||
      containerEmpty ||
      justEnteredFeedback ||
      justLeftFeedback
    ) {
      console.debug("[VexFlowStaffDisplay]", {
        patternChanged,
        clefChanged,
        containerEmpty,
        justEnteredFeedback,
        justLeftFeedback,
        gamePhase,
        prevGamePhase: prevGamePhaseRef.current,
      });
      renderStaff();
      prevPatternRef.current = pattern?.easyscoreString;
      prevClefRef.current = clef;
    }

    // Always update prevGamePhaseRef
    prevGamePhaseRef.current = gamePhase;
  }, [
    pattern?.easyscoreString,
    clef,
    renderStaff,
    gamePhase,
    performanceResults.length,
  ]);

  // Effect: Update note highlighting when currentNoteIndex or performanceResults change
  useEffect(() => {
    highlightNote(currentNoteIndex);
  }, [currentNoteIndex, performanceResults, highlightNote]);

  // Effect: Update cursor position based on musical time (smooth movement through rests)
  useEffect(() => {
    if (
      !eventGeometryRef.current ||
      eventGeometryRef.current.length === 0 ||
      !pattern ||
      !containerRef.current
    ) {
      return;
    }

    const events = eventGeometryRef.current;

    // If cursorTime is 0 or before the first event, position cursor at the beginning of the staff
    if (
      events.length === 0 ||
      cursorTime <= 0 ||
      (events[0] && cursorTime < events[0].startTime)
    ) {
      // Position cursor at the beginning of the staff (after clef and time signature)
      // Calculate position relative to container, accounting for typical clef + time signature width
      if (containerRef.current && events.length > 0) {
        // Use the first event's position as reference, but position before it
        const firstEvent = events[0];
        if (firstEvent && firstEvent.centerX) {
          // Position cursor before the first note, accounting for clef + time signature space
          // Typically clef + time signature takes ~120-150px, so position at first note - 100px
          const STAFF_START_X = Math.max(50, firstEvent.centerX - 100);
          setCursorX(STAFF_START_X);
          return;
        }
      }
      // Fallback: use fixed position if we can't calculate from events
      setCursorX(150);
      return;
    }

    // Find the active event based on cursorTime - more robust logic
    let activeEventIdx = events.length - 1; // Default to last event

    for (let i = 0; i < events.length; i++) {
      const geom = events[i];
      // Check if cursorTime is within this event's time window
      if (cursorTime >= geom.startTime && cursorTime <= geom.endTime) {
        activeEventIdx = i;
        break;
      }
      // If cursorTime is before this event starts, use previous event (or stay at 0)
      if (cursorTime < geom.startTime) {
        activeEventIdx = Math.max(0, i - 1);
        break;
      }
    }

    const activeGeom = events[activeEventIdx];
    if (!activeGeom) return;

    // Determine target X position
    let targetX;
    if (activeEventIdx < events.length - 1) {
      // Not the last event: interpolate to 12px before next event's center
      targetX = events[activeEventIdx + 1].centerX - 12;
    } else {
      // Last event: move to the right edge of the staff container
      const containerRect = containerRef.current.getBoundingClientRect();
      targetX = containerRect.width - 50; // Leave 50px margin from edge
    }

    // Calculate progress within the current event
    const eventDuration = Math.max(
      activeGeom.endTime - activeGeom.startTime,
      0.001
    );
    const timeIntoEvent = cursorTime - activeGeom.startTime;
    const progressInEvent = Math.max(
      0,
      Math.min(1, timeIntoEvent / eventDuration)
    );

    // Linear interpolation from current event center to target
    // Start 12px before the note center for better visual clarity
    const startX = activeGeom.centerX - 12;
    const interpolatedX = startX + progressInEvent * (targetX - startX);

    setCursorX(interpolatedX);
  }, [cursorTime, pattern]);

  // Effect: Cleanup VexFlow content on unmount or pattern change
  useEffect(() => {
    const currentContainer = vexContainerRef.current;
    return () => {
      // Clean up VexFlow-only content (not React-managed children)
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
      // Reset refs
      notesRef.current = [];
      setCursorX(null);
    };
  }, [pattern?.easyscoreString]); // Re-run cleanup when pattern changes

  // Early return if no pattern
  if (!pattern || !pattern.notes) {
    return null;
  }

  return (
    <div
      className="relative mx-auto flex w-full max-w-6xl items-center justify-center"
      dir="ltr" // Force LTR for music notation - prevents RTL inheritance issues
      style={{ height: "100%" }}
    >
      {error ? (
        <div className="relative w-full rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">
            Unable to render musical notation
          </p>
          <p className="mt-1 text-xs text-red-400">{error}</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="vexflow-container relative flex h-full w-full items-center justify-center bg-transparent"
          style={{ height: "100%", overflowX: "hidden", overflowY: "visible" }}
          role="img"
          aria-label={`Musical notation: ${pattern.timeSignature} time signature with ${pattern.notes.length} notes`}
        >
          {/* VexFlow-only container - React never touches this */}
          <div
            id={containerId}
            ref={vexContainerRef}
            className="h-full w-full"
            style={{
              height: "100%",
              width: "100%",
              paddingTop: "5px",
              paddingBottom: "5px",
              overflowX: "hidden",
              overflowY: "visible",
              position: "relative",
            }}
          />

          {/* Cursor overlay - React-managed, centered on staff */}
          {cursorX !== null &&
            (gamePhase === "display" ||
              gamePhase === "count-in" ||
              gamePhase === "performance") && (
              <div
                className="pointer-events-none absolute border-l-2 border-violet-500"
                style={{
                  left: cursorX,
                  top:
                    String(clef || "").toLowerCase() === "both" ? "5%" : "50%",
                  transform:
                    String(clef || "").toLowerCase() === "both"
                      ? "none"
                      : "translateY(-50%)",
                  height:
                    String(clef || "").toLowerCase() === "both" ? "90%" : "85%",
                }}
              />
            )}
        </div>
      )}
    </div>
  );
}
