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
  Beam,
  StaveNote,
  Accidental,
  Dot,
  StaveConnector,
  Stem,
} from "vexflow";
import { resolveTimeSignature } from "../constants/durationConstants";

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
  if (midi === null) return Stem.UP;
  const reference = STEM_REFERENCE_MIDI[clef] ?? STEM_REFERENCE_MIDI["treble"];
  return midi > reference ? Stem.DOWN : Stem.UP;
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
}) {
  // Generate unique ID for this component instance
  const uniqueId = useId();
  const containerId = `vexflow-staff-${uniqueId.replace(/:/g, "-")}`;

  // Refs
  const containerRef = useRef(null); // Outer React-managed container
  const vexContainerRef = useRef(null); // Inner VexFlow-only container
  const vfRef = useRef(null);
  const notesRef = useRef([]);
  const prevPatternRef = useRef(null);
  const prevClefRef = useRef(null);
  const prevGamePhaseRef = useRef(null);
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
    const MAX_STAFF_HEIGHT = 320; // Prevent runaway heights; SVG will scale to slot
    if (!containerSize.height) return MIN_STAFF_HEIGHT;
    return Math.max(
      MIN_STAFF_HEIGHT,
      Math.min(containerSize.height, MAX_STAFF_HEIGHT)
    );
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

  const makeSvgResponsive = useCallback((svgWidth, svgHeight) => {
    if (!vexContainerRef.current) return;
    const svg = vexContainerRef.current.querySelector("svg");
    if (!svg) return;
    // ViewBox should match the renderer dimensions we initialized VexFlow with.
    // We already apply visual enlargement via `context.scale(STAFF_SCALE, STAFF_SCALE)`;
    // scaling the viewBox again would double-apply the scale and shrink the staff.
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Center horizontally and vertically
    // The SVG should scale to fit its container width while maintaining aspect ratio.
    // The parent flexbox will handle vertical centering.
    svg.style.width = "100%";
    svg.style.maxWidth = "100%";
    svg.style.height = "auto"; // Let height follow aspect ratio
    svg.style.display = "block";
    // Let the layout/card decide clipping; the SVG should render naturally.
    svg.style.overflow = "visible";
  }, []);

  /**
   * Fit the SVG viewBox to the rendered notation bounds (prevents internal SVG cropping).
   * This keeps all staff elements (clefs, braces, ledger lines, barlines) visible even
   * when the available slot is short; the SVG will scale down uniformly to fit.
   */
  const fitSvgViewBoxToContent = useCallback(() => {
    if (!vexContainerRef.current) return;
    const svg = vexContainerRef.current.querySelector("svg");
    if (!svg) return;
    try {
      const bbox = svg.getBBox?.();
      if (!bbox || bbox.width <= 0 || bbox.height <= 0) return;

      const padX = 40;
      // Increase vertical padding to ensure low bass notes with ledger lines are visible
      const padY = 60;
      const x = Math.floor(bbox.x - padX);
      const y = Math.floor(bbox.y - padY);
      const w = Math.ceil(bbox.width + padX * 2);
      const h = Math.ceil(bbox.height + padY * 2);

      svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
    } catch (err) {
      // Some browsers may throw if the SVG isn't fully laid out yet.
      console.warn("Failed to fit SVG viewBox to content:", err);
    }
  }, []);

  /**
   * Render staff with VexFlow using lower-level API
   */
  const renderStaff = useCallback(() => {
    if (!vexContainerRef.current || !pattern?.easyscoreString) return;

    try {
      // Development assertion: check for overlapping events in pattern.notes
      if (process.env.NODE_ENV === "development" && pattern?.notes) {
        const occupiedSlots = new Set();
        for (const note of pattern.notes) {
          const start = note.startPosition ?? 0;
          const units = note.sixteenthUnits ?? 4;
          for (let slot = start; slot < start + units; slot++) {
            if (occupiedSlots.has(slot)) {
              console.warn(
                "[VexFlowStaffDisplay] OVERLAP DETECTED: slot",
                slot,
                "already occupied. Event:",
                note
              );
            }
            occupiedSlots.add(slot);
          }
        }
      }

      // Clear previous VexFlow rendering (only touches VexFlow container, not React children)
      vexContainerRef.current.innerHTML = "";

      // Calculate expected beats based on time signature
      const [beatsPerMeasure] = pattern.timeSignature.split("/").map(Number);
      const totalBars = Math.max(1, Number(pattern.measuresPerPattern || 1));

      // Phase 1 multi-bar rendering:
      // - During DISPLAY/COUNT_IN/PERFORMANCE, show ONE bar at a time.
      // - During FEEDBACK, keep full pattern visible (so noteIndex mapping to performanceResults stays intact).
      const shouldRenderSingleBar =
        totalBars > 1 && gamePhase !== "feedback";
      const currentBarIndex = shouldRenderSingleBar
        ? gamePhase === "performance"
          ? Number(pattern?.notes?.[currentNoteIndex]?.barIndex ?? 0)
          : 0
        : 0;

      const expectedDuration = beatsPerMeasure * (shouldRenderSingleBar ? 1 : totalBars);

      // DEBUG: Log pattern details

      // Check if pattern needs padding
      const allNotesForScore = Array.isArray(pattern.notes) ? pattern.notes : [];
      const renderNotesForScore = shouldRenderSingleBar
        ? allNotesForScore.filter((n) => Number(n?.barIndex ?? 0) === currentBarIndex)
        : allNotesForScore;

      let easyscoreString = buildCompleteEasyScore(renderNotesForScore);
      const durationDiff = expectedDuration - (shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration);

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

          easyscoreString = `${easyscoreString}, B4/${restNotation}/r`;
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

      const clefKey = String(clef || "treble").toLowerCase();

      // Determine responsive canvas dimensions.
      // Add extra height to account for ledger lines (especially bottom space for bass notes).
      // When the available slot is tight, reduce buffers so the notation can scale down cleanly.
      const isTightHeight =
        (responsiveHeight || 0) > 0 && responsiveHeight < 220;
      const ledgerLineBuffer =
        clefKey === "both"
          ? isTightHeight
            ? 130 // Increased for low bass notes visibility in tight layouts
            : 160
          : isTightHeight
            ? 70
            : 90;

      // Scale factor: keep subtle. We will fit the SVG viewBox to the actual rendered bounds,
      // so the final SVG scales down to the available slot without cropping.
      const STAFF_SCALE =
        clefKey === "both"
          ? isTightHeight
            ? 1.0
            : 1.1
          : isTightHeight
            ? 1.0
            : 1.15;

      // Keep canvas dimensions in original coordinates (context scaling will handle rendering size)
      const canvasHeight = (responsiveHeight || 200) + ledgerLineBuffer;
      const canvasWidth = responsiveWidth || staffWidth;

      // Add padding to renderer size to prevent clipping (MOST IMPORTANT FIX)
      const PADDING_X = 100;
      const PADDING_Y = 100;

      // Initialize VexFlow with scaled dimensions + padding
      const vf = initializeVexFlow(
        containerId,
        canvasWidth + PADDING_X,
        canvasHeight + PADDING_Y
      );
      vfRef.current = vf;

      // Get the renderer context
      const context = vf.getContext();

      // Apply mild scale; viewBox fitting (below) ensures no cropping.
      context.scale(STAFF_SCALE, STAFF_SCALE);

      // Calculate formatter width based on stave width (accounts for new padding)
      const STAVE_WIDTH_BASE = Math.max(canvasWidth - 100, 240);
      const formatterWidth = Math.max(STAVE_WIDTH_BASE - 140, 200);

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

      const buildStaveNote = ({ pitchStr, duration, targetClef }) => {
        const isRest = String(duration || "").endsWith("r");
        let cleanDuration = String(duration || "q").replace(/r$/, "");
        
        // Check for dotted notes (e.g., "q.", "h.", "8.")
        const isDotted = cleanDuration && cleanDuration.endsWith(".");
        if (isDotted) {
          cleanDuration = cleanDuration.slice(0, -1); // Remove the dot: "q." -> "q"
        }
        
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
        
        // Add dot modifier if this is a dotted note
        if (isDotted) {
          for (let i = 0; i < noteConfig.keys.length; i++) {
            note.addModifier(new Dot(), i);
          }
        }
        
        // Note: Stem direction and length are set AFTER beaming via Beam.generateBeams()
        // for beamed notes. For non-beamed notes, stem direction is set below.
        return note;
      };

      const buildSpacerRest = (duration, targetClef) => {
        let cleanDuration = String(duration || "q").replace(/r$/, "");
        
        // Check for dotted durations (e.g., "q.", "h.", "8.")
        const isDotted = cleanDuration && cleanDuration.endsWith(".");
        if (isDotted) {
          cleanDuration = cleanDuration.slice(0, -1); // Remove the dot: "q." -> "q"
        }
        
        // Ensure we have a valid duration (fallback to "q" if empty)
        if (!cleanDuration || cleanDuration === "") {
          cleanDuration = "q";
        }
        
        const restKey = targetClef === "bass" ? "d/3" : "b/4";
        const spacer = new StaveNote({
          keys: [restKey],
          duration: `${cleanDuration}r`,
          clef: targetClef,
        });
        
        // Add dot modifier if this was a dotted duration
        if (isDotted) {
          for (let i = 0; i < spacer.getKeys().length; i++) {
            spacer.addModifier(new Dot(), i);
          }
        }
        
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
        const ledgerLineSpaceBottom = 100; // Extra space below for bass ledger lines to prevent cropping
        const staffGap = Math.max(70, Math.min(110, canvasHeight * 0.28));
        const staffHeight = 50; // Increased from 40 to 50 for larger staff
        // Position the grand staff with reduced top space but ensuring bottom space
        // Calculate total height needed
        const totalStaffHeight = staffGap + staffHeight;
        const totalNeededHeight =
          totalStaffHeight + ledgerLineSpaceTop + ledgerLineSpaceBottom;
        // Center the staff vertically in the available canvas space
        // Stave positioning constants - move inward from edges to prevent clipping
        const STAVE_X = 50;
        const STAVE_WIDTH = Math.max(canvasWidth - 100, 240); // Leave 50px on each side

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
          // Continuous double bar line spanning both staves
          new StaveConnector(trebleStave, bassStave)
            .setType(StaveConnector.type.BOLD_DOUBLE_RIGHT)
            .setContext(context)
            .draw();
        } catch (err) {
          console.warn("Failed to draw stave connectors:", err);
        }

        // IMPORTANT: do NOT scale the viewBox; the context is already scaled.
        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y);

        const allEvents = Array.isArray(pattern.notes) ? pattern.notes : [];
        const events = shouldRenderSingleBar
          ? allEvents.filter((e) => Number(e?.barIndex ?? 0) === currentBarIndex)
          : allEvents;
        const noBeamIndices = new Set(
          events
            .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
            .filter((i) => i !== null)
        );
        const durations =
          Array.isArray(pattern.vexflowNotes) &&
          pattern.vexflowNotes.length === allEvents.length
            ? (shouldRenderSingleBar
                ? pattern.vexflowNotes
                    .filter((_, i) => Number(allEvents?.[i]?.barIndex ?? 0) === currentBarIndex)
                    .map((n) => n?.duration || "q")
                : pattern.vexflowNotes.map((n) => n?.duration || "q"))
            : events.map(() => "q");

        const unitsPerBeat = resolveTimeSignature(
          pattern.timeSignature
        ).unitsPerBeat;

        const trebleTickables = events.map((event, idx) => {
          const duration = durations[idx] || "q";
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (event.type === "rest") {
            // Only render a visible rest on the staff the event belongs to.
            // The other staff should get an invisible spacer rest (no “fake” rests).
            if (eventClef === "treble") {
              return buildStaveNote({
                pitchStr: null,
                duration: `${duration.replace(/r$/, "")}r`,
                targetClef: "treble",
                isDotted: !!event?.isDotted,
              });
            }
            return buildSpacerRest(duration, "treble");
          }
          if (eventClef === "treble") {
            return buildStaveNote({
              pitchStr: event.pitch,
              duration,
              targetClef: "treble",
              isDotted: !!event?.isDotted,
            });
          }
          return buildSpacerRest(duration, "treble");
        });

        const bassTickables = events.map((event, idx) => {
          const duration = durations[idx] || "q";
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (event.type === "rest") {
            // Only render a visible rest on the staff the event belongs to.
            // The other staff should get an invisible spacer rest (no “fake” rests).
            if (eventClef === "bass") {
              return buildStaveNote({
                pitchStr: null,
                duration: `${duration.replace(/r$/, "")}r`,
                targetClef: "bass",
                isDotted: !!event?.isDotted,
              });
            }
            return buildSpacerRest(duration, "bass");
          }
          if (eventClef === "bass") {
            return buildStaveNote({
              pitchStr: event.pitch,
              duration,
              targetClef: "bass",
              isDotted: !!event?.isDotted,
            });
          }
          return buildSpacerRest(duration, "bass");
        });

        // Manual beaming for kid-friendly patterns:
        // Ensure | 1/8 1/16 1/16 | (2,1,1) and | 1/16 1/16 1/8 | (1,1,2)
        // are connected as a single beam group within the pattern.
        const patternIndices = new Map();
        events.forEach((e, i) => {
          const pid = e?.patternId ?? i;
          if (!patternIndices.has(pid)) patternIndices.set(pid, []);
          patternIndices.get(pid).push(i);
        });

        const manualBeamIndices = new Set();
        const manualTrebleBeams = [];
        const manualBassBeams = [];

        for (const [, idxs] of patternIndices) {
          if (idxs.length !== 3) continue;
          const seq = idxs.map((i) => events[i]);
          if (seq.some((e) => e?.type !== "note")) continue;

          const units = seq.map((e) => e?.sixteenthUnits);
          const isTargetPattern =
            (units[0] === 2 && units[1] === 1 && units[2] === 1) ||
            (units[0] === 1 && units[1] === 1 && units[2] === 2);
          if (!isTargetPattern) continue;

          const clefs = seq.map((e) => String(e?.clef || "treble").toLowerCase());
          const staff = clefs[0];
          if (!clefs.every((c) => c === staff)) continue;

          if (staff === "treble") {
            const notes = idxs.map((i) => trebleTickables[i]).filter(Boolean);
            if (notes.length === 3) {
              manualTrebleBeams.push(new Beam(notes));
              idxs.forEach((i) => manualBeamIndices.add(i));
            }
          } else if (staff === "bass") {
            const notes = idxs.map((i) => bassTickables[i]).filter(Boolean);
            if (notes.length === 3) {
              manualBassBeams.push(new Beam(notes));
              idxs.forEach((i) => manualBeamIndices.add(i));
            }
          }
        }

        // Use Beam.generateBeams for automatic beaming, stem direction, and stem length
        // per VexFlow guidelines (see docs/vexflow-notation/vexflow-guidelines.md)
        // Filter to only actual notes (not spacer rests) for each staff
        const trebleNotesOnly = trebleTickables.filter((tick, idx) => {
          const event = events[idx];
          const eventClef = String(event?.clef || "treble").toLowerCase();
          return (
            event?.type === "note" &&
            eventClef === "treble" &&
            !noBeamIndices.has(idx) &&
            !manualBeamIndices.has(idx)
          );
        });
        const bassNotesOnly = bassTickables.filter((tick, idx) => {
          const event = events[idx];
          const eventClef = String(event?.clef || "treble").toLowerCase();
          return (
            event?.type === "note" &&
            eventClef === "bass" &&
            !noBeamIndices.has(idx) &&
            !manualBeamIndices.has(idx)
          );
        });

        // Generate beams automatically - VexFlow handles stem direction and length for beamed notes
        const trebleAutoBeams = Beam.generateBeams(trebleNotesOnly);
        const bassAutoBeams = Beam.generateBeams(bassNotesOnly);
        const trebleBeams = [...trebleAutoBeams, ...manualTrebleBeams];
        const bassBeams = [...bassAutoBeams, ...manualBassBeams];

        // Set stem direction for non-beamed notes (those not included in any beam)
        const beamedTrebleNotes = new Set(
          trebleBeams.flatMap((b) => b.getNotes())
        );
        const beamedBassNotes = new Set(bassBeams.flatMap((b) => b.getNotes()));

        trebleTickables.forEach((tick, idx) => {
          const event = events[idx];
          if (event?.type !== "note") return;
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (eventClef !== "treble") return;
          if (!beamedTrebleNotes.has(tick)) {
            // Non-beamed note: set stem direction based on pitch
            tick.setStemDirection(
              getStemDirectionForPitch(event.pitch, "treble")
            );
          }
        });

        bassTickables.forEach((tick, idx) => {
          const event = events[idx];
          if (event?.type !== "note") return;
          const eventClef = String(event?.clef || "treble").toLowerCase();
          if (eventClef !== "bass") return;
          if (!beamedBassNotes.has(tick)) {
            // Non-beamed note: set stem direction based on pitch
            tick.setStemDirection(
              getStemDirectionForPitch(event.pitch, "bass")
            );
          }
        });

        const trebleVoice = new Voice({
          num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
          beat_value: 4,
        }).setMode(Voice.Mode.SOFT);
        trebleVoice.addTickables(trebleTickables);

        const bassVoice = new Voice({
          num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
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
            // Set stem direction for wrong notes (not beamed, so we set manually)
            if (!duration.includes("r")) {
              wrong.setStemDirection(
                getStemDirectionForPitch(result.detected, "treble")
              );
            }
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
            // Set stem direction for wrong notes (not beamed, so we set manually)
            if (!duration.includes("r")) {
              wrong.setStemDirection(
                getStemDirectionForPitch(result.detected, "bass")
              );
            }
            return wrong;
          });

          wrongTrebleVoice = new Voice({
            num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
            beat_value: 4,
          }).setMode(Voice.Mode.SOFT);
          wrongTrebleVoice.addTickables(wrongTrebleTickables);

          wrongBassVoice = new Voice({
            num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
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

        // Draw beams (expected only) after notes are positioned
        trebleBeams.forEach((beam) => beam.setContext(context).draw());
        bassBeams.forEach((beam) => beam.setContext(context).draw());

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
        const STAVE_X = 50;
        const STAVE_WIDTH = Math.max(canvasWidth - 100, 240); // Leave 50px on each side

        // Center vertically: calculate available space and center the staff
        const verticalCenter =
          (canvasHeight - totalNeededHeight) / 2 + ledgerLineSpaceTop;
        const yPosition = Math.max(ledgerLineSpaceTop, verticalCenter);

        const stave = new Stave(STAVE_X, yPosition, STAVE_WIDTH);
        stave.addClef(clef);
        stave.addTimeSignature(pattern.timeSignature);
        stave.setEndBarType(2); // Double barline
        stave.setContext(context).draw();
        // IMPORTANT: do NOT scale the viewBox; the context is already scaled.
        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y);

        // Parse EasyScore string manually to create StaveNotes
        const allEvents = Array.isArray(pattern.notes) ? pattern.notes : [];
        const events = shouldRenderSingleBar
          ? allEvents.filter((e) => Number(e?.barIndex ?? 0) === currentBarIndex)
          : allEvents;
        const durations =
          Array.isArray(pattern.vexflowNotes) &&
          pattern.vexflowNotes.length === allEvents.length
            ? (shouldRenderSingleBar
                ? pattern.vexflowNotes
                    .filter((_, i) => Number(allEvents?.[i]?.barIndex ?? 0) === currentBarIndex)
                    .map((n) => n?.duration || "q")
                : pattern.vexflowNotes.map((n) => n?.duration || "q"))
            : events.map(() => "q");
        const noBeamIndices = new Set(
          events
            .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
            .filter((i) => i !== null)
        );
        const unitsPerBeat = resolveTimeSignature(
          pattern.timeSignature
        ).unitsPerBeat;

        // Store pitch strings for stem direction calculation later
        const pitchStrings = [];

        const staveNotes = easyscoreString.split(",").map((noteStr) => {
          noteStr = noteStr.trim();

          // Parse format: "C4/q" or "B4/q/r" or "C4/q."
          const isRest = noteStr.includes("/r");
          const parts = noteStr.split("/");
          const pitchStr = parts[0]; // e.g., "C4" or "B4"
          let duration = parts[1]; // e.g., "q", "h", "8", "q.", "h."

          // Store pitch for later stem direction calculation
          pitchStrings.push(isRest ? null : pitchStr);

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

          // Note: Stem direction is set AFTER beaming via Beam.generateBeams()
          // for beamed notes. For non-beamed notes, stem direction is set below.

          if (isDotted) {
            for (let i = 0; i < noteConfig.keys.length; i++) {
              staveNote.addModifier(new Dot(), i);
            }
          }

          return staveNote;
        });

        // Use Beam.generateBeams for automatic beaming, stem direction, and stem length
        // per VexFlow guidelines (see docs/vexflow-notation/vexflow-guidelines.md)
        // Manual beaming for kid-friendly patterns:
        // Ensure | 1/8 1/16 1/16 | (2,1,1) and | 1/16 1/16 1/8 | (1,1,2)
        // are connected as a single beam group within the pattern.
        const patternIndices = new Map();
        events.forEach((e, i) => {
          const pid = e?.patternId ?? i;
          if (!patternIndices.has(pid)) patternIndices.set(pid, []);
          patternIndices.get(pid).push(i);
        });

        const manualBeamIndices = new Set();
        const manualBeams = [];
        for (const [, idxs] of patternIndices) {
          if (idxs.length !== 3) continue;
          const seq = idxs.map((i) => events[i]);
          if (seq.some((e) => e?.type !== "note")) continue;

          const units = seq.map((e) => e?.sixteenthUnits);
          const isTargetPattern =
            (units[0] === 2 && units[1] === 1 && units[2] === 1) ||
            (units[0] === 1 && units[1] === 1 && units[2] === 2);
          if (!isTargetPattern) continue;

          const notes = idxs.map((i) => staveNotes[i]).filter(Boolean);
          if (notes.length === 3) {
            manualBeams.push(new Beam(notes));
            idxs.forEach((i) => manualBeamIndices.add(i));
          }
        }

        const autoBeamNotes = staveNotes.filter(
          (note, idx) => !noBeamIndices.has(idx) && !manualBeamIndices.has(idx)
        );
        const autoBeams = Beam.generateBeams(autoBeamNotes);
        const beams = [...autoBeams, ...manualBeams];

        // Set stem direction for non-beamed notes (those not included in any beam)
        const beamedNotes = new Set(beams.flatMap((b) => b.getNotes()));
        staveNotes.forEach((note, idx) => {
          const pitchStr = pitchStrings[idx];
          if (!pitchStr) return; // Skip rests
          if (!beamedNotes.has(note)) {
            // Non-beamed note: set stem direction based on pitch
            note.setStemDirection(getStemDirectionForPitch(pitchStr, clef));
          }
        });

        const voice = new Voice({
          num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
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

                // Set stem direction for wrong notes (not beamed, so set manually)
                wrongNote.setStemDirection(
                  getStemDirectionForPitch(playedNote, clef)
                );

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
              num_beats: shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration,
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
          beams.forEach((beam) => beam.setContext(context).draw());
          wrongVoice.draw(context, stave);
        } else {
          new Formatter().joinVoices([voice]).format([voice], formatterWidth);
          voice.draw(context, stave);
          beams.forEach((beam) => beam.setContext(context).draw());
        }
      }

      // Extract note elements for highlighting
      notesRef.current = extractNoteElements();
      console.debug("[VexFlowStaffDisplay]", {
        notesRef: notesRef.current.length,
      });

      // Fit the viewBox to content after rendering
      requestAnimationFrame(() => {
        fitSvgViewBoxToContent();
      });

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
    pattern,
    clef,
    extractNoteElements,
    gamePhase,
    performanceResults,
    makeSvgResponsive,
    fitSvgViewBoxToContent,
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
      // IMPORTANT: No highlighting during performance (kids mode UX).
      // Only apply feedback coloring once the exercise is finished (feedback phase).
      if (gamePhase !== "feedback") {
        return {
          fill: "#000000",
          stroke: "#000000",
          class: "",
          animate: false,
        };
      }

      // Find the performance result for this specific note by matching noteIndex
      const result = performanceResults.find((r) => r.noteIndex === noteIndex);

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
   * Highlight and color notes based on performance.
   * Colors the notehead and stem (via fill/stroke on the .vf-stavenote group).
   * During performance phase, the current note is colored purple; all others are black.
   * During feedback phase, notes are colored based on performance results.
   */
  const highlightNote = useCallback(
    (noteIndex) => {
      if (!notesRef.current || notesRef.current.length === 0) {
        return;
      }

      try {
        // Update all notes based on their status
        notesRef.current.forEach((noteElement, idx) => {
          if (noteElement) {
            const colorInfo = getNoteColor(idx);
            const { fill, stroke, class: className } = colorInfo;

            // Setting fill/stroke on the .vf-stavenote group colors both notehead and stem
            noteElement.setAttribute("class", `vf-stavenote ${className}`);
            noteElement.setAttribute("fill", fill);
            noteElement.setAttribute("stroke", stroke || fill);
          }
        });
      } catch (err) {
        console.warn("Failed to highlight note:", err);
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
    };
  }, [pattern?.easyscoreString]); // Re-run cleanup when pattern changes

  // Early return if no pattern
  if (!pattern || !pattern.notes) {
    return null;
  }

  return (
    <div
      className="relative mx-auto flex w-full max-w-6xl items-center justify-center px-4"
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
          className="vexflow-container relative flex w-full items-center justify-center bg-transparent"
          style={{
            maxHeight: "100%",
            overflow: "visible",
          }}
          role="img"
          aria-label={`Musical notation: ${pattern.timeSignature} time signature with ${pattern.notes.length} notes`}
        >
          {/* VexFlow-only container - React never touches this */}
          <div
            id={containerId}
            ref={vexContainerRef}
            className="w-full"
            style={{
              width: "100%",
              overflow: "visible",
              position: "relative",
            }}
          />
        </div>
      )}
    </div>
  );
}
