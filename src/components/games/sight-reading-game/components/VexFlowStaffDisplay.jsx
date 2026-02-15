
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
import { useVexFlowResize } from "../../../../hooks/useVexFlowResize";
import {
  Formatter,
  Stave,
  Voice,
  Beam,
  StaveNote,
  GhostNote,
  Accidental,
  Dot,
  StaveConnector,
  Barline,
  Stem,
} from "vexflow";
import {
  getDurationDefinition,
  resolveTimeSignature,
} from "../constants/durationConstants";

// Local helper: convert enriched notation objects into an EasyScore string.
// (We build tickables manually in many paths, but this is still used for padding + legacy parsing.)
const buildCompleteEasyScore = (enrichedNotation) =>
  (Array.isArray(enrichedNotation) ? enrichedNotation : [])
    .map((obj) => {
      const durationInfo = getDurationDefinition(obj?.notation);
      const duration = durationInfo?.vexflowCode || "q";

      if (obj?.type === "rest") {
        return `B4/${duration}/r`;
      }
      if (obj?.pitch) {
        return `${obj.pitch}/${duration}`;
      }
      return `C4/${duration}`;
    })
    .join(", ");

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
  const maxScrollRef = useRef(0); // Track maximum scroll position to prevent backward scrolling
  const scrollAnimationRef = useRef(null); // Track ongoing scroll animation frame
  const targetScrollRef = useRef(0); // Target scroll position for smooth interpolation
  const isScrollingRef = useRef(false); // Track if continuous scroll animation is active
  const [containerSize, setContainerSize] = useState(() => {
    // Initial estimate based on viewport to reduce layout shift on first render
    if (typeof window === "undefined") return { width: 0, height: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Estimate based on typical layout - container is ~80-90% of viewport width
    const estimatedWidth = Math.min(vw * 0.9, 1200);
    const estimatedHeight = Math.min(vh * 0.4, 320);
    return { width: estimatedWidth, height: estimatedHeight };
  });

  // Error state
  const [error, setError] = useState(null);

  // Memoize width calculation for performance
  const staffWidth = useMemo(() => {
    if (!pattern || !pattern.totalDuration) return 700;
    return calculateOptimalWidth(pattern.totalDuration, pattern.timeSignature);
  }, [pattern]);

  // Stable resize callback for debounced hook
  const handleContainerResize = useCallback(({ width, height }) => {
    setContainerSize((prev) => {
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  // Track container dimensions for responsive rendering with debounced resize
  useVexFlowResize(containerRef, handleContainerResize, 150);

  const responsiveWidth = useMemo(() => {
    if (!containerSize.width) return staffWidth;
    const padding = 16; // allow for minimal card inner padding
    const availableWidth = Math.max(containerSize.width - padding, 320);
    // Don't constrain to container width - allow horizontal scroll for multi-bar patterns
    // Only use container width for single bar patterns
    const totalBars = Math.max(1, Number(pattern?.measuresPerPattern || 1));
    if (totalBars === 1) {
      const maxWidth = 1400;
      return Math.min(availableWidth, maxWidth);
    }
    // For multi-bar patterns, use fixed width per bar to ensure consistent notation size
    return availableWidth; // Return available width but we'll override in canvasWidth calculation
  }, [containerSize.width, staffWidth, pattern?.measuresPerPattern]);

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

  const makeSvgResponsive = useCallback((svgWidth, svgHeight, totalBars = 1) => {
    if (!vexContainerRef.current) return;
    const svg = vexContainerRef.current.querySelector("svg");
    if (!svg) return;
    // ViewBox should match the renderer dimensions we initialized VexFlow with.
    // We already apply visual enlargement via `context.scale(STAFF_SCALE, STAFF_SCALE)`;
    // scaling the viewBox again would double-apply the scale and shrink the staff.
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);

    // CRITICAL FIX: For multi-bar patterns, use actual pixel width instead of percentage
    // to prevent SVG scaling/squeezing. Container will scroll horizontally instead.
    if (totalBars > 1) {
      svg.setAttribute("preserveAspectRatio", "xMinYMid meet"); // Left-align, center vertically
      svg.style.width = `${svgWidth}px`; // Use actual pixel width - no scaling
      svg.style.maxWidth = "none"; // Remove max-width constraint
      svg.style.height = "auto"; // Let height follow aspect ratio
      svg.style.display = "block";
      svg.style.overflow = "visible";
    } else {
      // Single bar: fit to container (original responsive behavior)
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); // Center horizontally and vertically
      svg.style.width = "100%";
      svg.style.maxWidth = "100%";
      svg.style.height = "auto"; // Let height follow aspect ratio
      svg.style.display = "block";
      svg.style.overflow = "visible";
    }
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

      // Render the FULL pattern for performance/display/count-in so bar 2+ exists.
      // The viewport reveal is handled by translateX in the wrapper (continuous scroll).
      const shouldRenderSingleBar = false;
      const currentBarIndex = 0;

      const expectedDuration = beatsPerMeasure * (shouldRenderSingleBar ? 1 : totalBars);

      // DEBUG: Log pattern details

      // Check if pattern needs padding (should rarely happen now that generator fills measures)
      const allNotesForScore = Array.isArray(pattern.notes) ? pattern.notes : [];
      const renderNotesForScore = shouldRenderSingleBar
        ? allNotesForScore.filter((n) => Number(n?.barIndex ?? 0) === currentBarIndex)
        : allNotesForScore;

      let easyscoreString = buildCompleteEasyScore(renderNotesForScore);
      const durationDiff = expectedDuration - (shouldRenderSingleBar ? beatsPerMeasure : pattern.totalDuration);

      // More lenient epsilon for floating point comparison
      if (Math.abs(durationDiff) > 0.001) {
        if (durationDiff > 0) {
          // Pattern is shorter than expected - this should not happen anymore since
          // the rhythm generator now fills measures completely. If it does happen,
          // Voice.Mode.SOFT will handle the incomplete measure gracefully without
          // throwing errors. We DO NOT add visual padding rests here.
          console.debug("[VexFlowStaffDisplay] Pattern shorter than expected - relying on SOFT mode", {
            expectedDuration,
            actualDuration: pattern.totalDuration,
            deficit: durationDiff,
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

      // Dynamic width calculation for multi-bar support with horizontal scroll
      // Set fixed width per bar to ensure consistent notation size regardless of number of bars
      const FIXED_STAVE_WIDTH_PER_BAR = 240; // Fixed width per bar for consistent notation
      const STAVE_X = 50;

      // For single bar, use responsive width; for multi-bar, use fixed width per bar
      const BASE_STAVE_WIDTH = totalBars === 1
        ? Math.max(responsiveWidth - 100, 240)
        : FIXED_STAVE_WIDTH_PER_BAR * totalBars;

      const requiredStaveWidth = BASE_STAVE_WIDTH;

      // Canvas width should accommodate the full notation width for multi-bar patterns
      // This enables horizontal scroll when patterns are wider than container
      const canvasWidth = totalBars === 1
        ? Math.max(requiredStaveWidth + 100, responsiveWidth || staffWidth)
        : requiredStaveWidth + 100; // For multi-bar, always use calculated width

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

        // Use VexFlow's GhostNote - an invisible note that takes up rhythmic space
        // but renders nothing. Perfect for grand staff alignment where we need
        // timing placeholders without visible rests.
        // For dotted notes, append 'd' to the duration (VexFlow convention)
        const ghostDuration = isDotted ? `${cleanDuration}d` : cleanDuration;
        const spacer = new GhostNote({ duration: ghostDuration });

        return spacer;
      };

      if (clefKey === "both") {
        // Grand staff rendering: treble + bass staves
        const ledgerLineSpaceTop = 30;
        const ledgerLineSpaceBottom = 100;
        const staffGap = Math.max(70, Math.min(110, canvasHeight * 0.28));
        const staffHeight = 50;
        const totalStaffHeight = staffGap + staffHeight;
        const totalNeededHeight =
          totalStaffHeight + ledgerLineSpaceTop + ledgerLineSpaceBottom;

        const TOTAL_STAVE_WIDTH = requiredStaveWidth;

        const verticalCenter =
          (canvasHeight - totalNeededHeight) / 2 + ledgerLineSpaceTop;
        const yTreble = Math.max(ledgerLineSpaceTop, verticalCenter);
        const yBass = yTreble + staffGap;

        // IMPORTANT: do NOT scale the viewBox; the context is already scaled.
        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y, totalBars);

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

        // Grand staff rendering (multiple staves for multi-bar with proper barline config)
        if (totalBars > 1) {
          // Use fixed width per bar for consistent notation size
          const staveWidthPerBar = FIXED_STAVE_WIDTH_PER_BAR;

          // Create all stave pairs first
          for (let barIdx = 0; barIdx < totalBars; barIdx++) {
            const xPos = STAVE_X + (barIdx * staveWidthPerBar);

            const trebleStave = new Stave(xPos, yTreble, staveWidthPerBar);
            const bassStave = new Stave(xPos, yBass, staveWidthPerBar);

            // Only first bar gets clef and time signature
            if (barIdx === 0) {
              trebleStave.addClef("treble");
              trebleStave.addTimeSignature(pattern.timeSignature);
              bassStave.addClef("bass");
              bassStave.addTimeSignature(pattern.timeSignature);
            } else {
              // Disable beginning barline for subsequent bars (already drawn by previous bar's end)
              trebleStave.setBegBarType(Barline.type.NONE);
              bassStave.setBegBarType(Barline.type.NONE);
            }

            // Set end barline type
            if (barIdx === totalBars - 1) {
              trebleStave.setEndBarType(Barline.type.DOUBLE);
              bassStave.setEndBarType(Barline.type.DOUBLE);
            } else {
              trebleStave.setEndBarType(Barline.type.SINGLE);
              bassStave.setEndBarType(Barline.type.SINGLE);
            }

            trebleStave.setContext(context).draw();
            bassStave.setContext(context).draw();

            // Connectors for grand staff
            try {
              if (barIdx === 0) {
                // Brace and left line only for first bar
                new StaveConnector(trebleStave, bassStave)
                  .setType(StaveConnector.type.BRACE)
                  .setContext(context)
                  .draw();
                new StaveConnector(trebleStave, bassStave)
                  .setType(StaveConnector.type.SINGLE_LEFT)
                  .setContext(context)
                  .draw();
              }

              // Connect barlines between staves at end of each bar
              if (barIdx === totalBars - 1) {
                new StaveConnector(trebleStave, bassStave)
                  .setType(StaveConnector.type.BOLD_DOUBLE_RIGHT)
                  .setContext(context)
                  .draw();
              } else {
                new StaveConnector(trebleStave, bassStave)
                  .setType(StaveConnector.type.SINGLE_RIGHT)
                  .setContext(context)
                  .draw();
              }
            } catch (err) {
              console.warn("Failed to draw stave connectors:", err);
            }

            // Get events for this bar
            const barEvents = events.filter(
              (e) => Number(e?.barIndex ?? 0) === barIdx
            );
            const barEventIndices = events
              .map((e, i) => ({ event: e, globalIdx: i }))
              .filter(({ event }) => Number(event?.barIndex ?? 0) === barIdx)
              .map(({ globalIdx }) => globalIdx);

            // Build tickables for this bar
            const trebleTickables = [];
            const bassTickables = [];

            barEvents.forEach((event, localIdx) => {
              const globalIdx = barEventIndices[localIdx];
              const duration = durations[globalIdx] || "q";
              const eventClef = String(event?.clef || "treble").toLowerCase();

              if (event.type === "rest") {
                if (eventClef === "treble") {
                  trebleTickables.push(buildStaveNote({
                    pitchStr: null,
                    duration: `${duration.replace(/r$/, "")}r`,
                    targetClef: "treble",
                  }));
                  bassTickables.push(buildSpacerRest(duration, "bass"));
                } else {
                  trebleTickables.push(buildSpacerRest(duration, "treble"));
                  bassTickables.push(buildStaveNote({
                    pitchStr: null,
                    duration: `${duration.replace(/r$/, "")}r`,
                    targetClef: "bass",
                  }));
                }
              } else if (eventClef === "treble") {
                trebleTickables.push(buildStaveNote({
                  pitchStr: event.pitch,
                  duration,
                  targetClef: "treble",
                }));
                bassTickables.push(buildSpacerRest(duration, "bass"));
              } else {
                trebleTickables.push(buildSpacerRest(duration, "treble"));
                bassTickables.push(buildStaveNote({
                  pitchStr: event.pitch,
                  duration,
                  targetClef: "bass",
                }));
              }
            });

            // Generate beams for this bar
            const noBeamIndicesForBar = new Set(
              barEvents
                .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
                .filter((i) => i !== null)
            );

            const trebleNotesOnly = trebleTickables.filter((tick, idx) => {
              const event = barEvents[idx];
              const eventClef = String(event?.clef || "treble").toLowerCase();
              return event?.type === "note" && eventClef === "treble" && !noBeamIndicesForBar.has(idx);
            });
            const bassNotesOnly = bassTickables.filter((tick, idx) => {
              const event = barEvents[idx];
              const eventClef = String(event?.clef || "treble").toLowerCase();
              return event?.type === "note" && eventClef === "bass" && !noBeamIndicesForBar.has(idx);
            });

            const trebleBeams = Beam.generateBeams(trebleNotesOnly);
            const bassBeams = Beam.generateBeams(bassNotesOnly);

            // Set stem direction for non-beamed notes
            const beamedTrebleNotes = new Set(trebleBeams.flatMap((b) => b.getNotes()));
            const beamedBassNotes = new Set(bassBeams.flatMap((b) => b.getNotes()));

            trebleTickables.forEach((tick, idx) => {
              const event = barEvents[idx];
              if (event?.type !== "note") return;
              const eventClef = String(event?.clef || "treble").toLowerCase();
              if (eventClef !== "treble") return;
              if (!beamedTrebleNotes.has(tick)) {
                tick.setStemDirection(getStemDirectionForPitch(event.pitch, "treble"));
              }
            });

            bassTickables.forEach((tick, idx) => {
              const event = barEvents[idx];
              if (event?.type !== "note") return;
              const eventClef = String(event?.clef || "treble").toLowerCase();
              if (eventClef !== "bass") return;
              if (!beamedBassNotes.has(tick)) {
                tick.setStemDirection(getStemDirectionForPitch(event.pitch, "bass"));
              }
            });

            // Create voices for this bar
            const trebleVoice = new Voice({
              num_beats: beatsPerMeasure,
              beat_value: 4,
            }).setMode(Voice.Mode.SOFT);
            trebleVoice.addTickables(trebleTickables);

            const bassVoice = new Voice({
              num_beats: beatsPerMeasure,
              beat_value: 4,
            }).setMode(Voice.Mode.SOFT);
            bassVoice.addTickables(bassTickables);

            // Calculate formatter width for this bar
            const barFormatterWidth = barIdx === 0
              ? Math.max(staveWidthPerBar - 100, 100)
              : Math.max(staveWidthPerBar - 20, 100);

            // Handle wrong pitch overlay
            let wrongTrebleVoice = null;
            let wrongBassVoice = null;

            if (gamePhase === "feedback" && performanceResults.length > 0) {
              const wrongPitchResults = performanceResults.filter(
                (r) => r.timingStatus === "wrong_pitch" && r.detected
              );

              if (wrongPitchResults.length > 0) {
                const wrongTrebleTickables = barEvents.map((event, localIdx) => {
                  const globalIdx = barEventIndices[localIdx];
                  const duration = durations[globalIdx] || "q";
                  const eventClef = String(event?.clef || "treble").toLowerCase();
                  const result = wrongPitchResults.find((r) => r.noteIndex === globalIdx);

                  if (result && event.type !== "rest" && eventClef === "treble") {
                    const wrong = buildStaveNote({
                      pitchStr: result.detected,
                      duration,
                      targetClef: "treble",
                    });
                    wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                    wrong.setStemDirection(getStemDirectionForPitch(result.detected, "treble"));
                    return wrong;
                  }
                  return buildSpacerRest(duration, "treble");
                });

                const wrongBassTickables = barEvents.map((event, localIdx) => {
                  const globalIdx = barEventIndices[localIdx];
                  const duration = durations[globalIdx] || "q";
                  const eventClef = String(event?.clef || "treble").toLowerCase();
                  const result = wrongPitchResults.find((r) => r.noteIndex === globalIdx);

                  if (result && event.type !== "rest" && eventClef === "bass") {
                    const wrong = buildStaveNote({
                      pitchStr: result.detected,
                      duration,
                      targetClef: "bass",
                    });
                    wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                    wrong.setStemDirection(getStemDirectionForPitch(result.detected, "bass"));
                    return wrong;
                  }
                  return buildSpacerRest(duration, "bass");
                });

                wrongTrebleVoice = new Voice({
                  num_beats: beatsPerMeasure,
                  beat_value: 4,
                }).setMode(Voice.Mode.SOFT);
                wrongTrebleVoice.addTickables(wrongTrebleTickables);

                wrongBassVoice = new Voice({
                  num_beats: beatsPerMeasure,
                  beat_value: 4,
                }).setMode(Voice.Mode.SOFT);
                wrongBassVoice.addTickables(wrongBassTickables);
              }
            }

            // Format and draw
            if (wrongTrebleVoice) {
              new Formatter().joinVoices([trebleVoice, wrongTrebleVoice]).format([trebleVoice, wrongTrebleVoice], barFormatterWidth);
            } else {
              new Formatter().joinVoices([trebleVoice]).format([trebleVoice], barFormatterWidth);
            }
            if (wrongBassVoice) {
              new Formatter().joinVoices([bassVoice, wrongBassVoice]).format([bassVoice, wrongBassVoice], barFormatterWidth);
            } else {
              new Formatter().joinVoices([bassVoice]).format([bassVoice], barFormatterWidth);
            }

            trebleVoice.draw(context, trebleStave);
            bassVoice.draw(context, bassStave);

            trebleBeams.forEach((beam) => beam.setContext(context).draw());
            bassBeams.forEach((beam) => beam.setContext(context).draw());

            if (wrongTrebleVoice) {
              wrongTrebleVoice.draw(context, trebleStave);
            }
            if (wrongBassVoice) {
              wrongBassVoice.draw(context, bassStave);
            }
          }
        } else {
          // Single bar grand staff
          const trebleStave = new Stave(STAVE_X, yTreble, TOTAL_STAVE_WIDTH);
          trebleStave.addClef("treble");
          trebleStave.addTimeSignature(pattern.timeSignature);
          trebleStave.setEndBarType(Barline.type.DOUBLE);
          trebleStave.setContext(context).draw();

          const bassStave = new Stave(STAVE_X, yBass, TOTAL_STAVE_WIDTH);
          bassStave.addClef("bass");
          bassStave.addTimeSignature(pattern.timeSignature);
          bassStave.setEndBarType(Barline.type.DOUBLE);
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
              .setType(StaveConnector.type.BOLD_DOUBLE_RIGHT)
              .setContext(context)
              .draw();
          } catch (err) {
            console.warn("Failed to draw stave connectors:", err);
          }

          const noBeamIndices = new Set(
            events
              .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
              .filter((i) => i !== null)
          );

          const trebleTickables = events.map((event, idx) => {
            const duration = durations[idx] || "q";
            const eventClef = String(event?.clef || "treble").toLowerCase();
            if (event.type === "rest") {
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

          const trebleNotesOnly = trebleTickables.filter((tick, idx) => {
            const event = events[idx];
            const eventClef = String(event?.clef || "treble").toLowerCase();
            return event?.type === "note" && eventClef === "treble" && !noBeamIndices.has(idx);
          });
          const bassNotesOnly = bassTickables.filter((tick, idx) => {
            const event = events[idx];
            const eventClef = String(event?.clef || "treble").toLowerCase();
            return event?.type === "note" && eventClef === "bass" && !noBeamIndices.has(idx);
          });

          const trebleBeams = Beam.generateBeams(trebleNotesOnly);
          const bassBeams = Beam.generateBeams(bassNotesOnly);

          const beamedTrebleNotes = new Set(trebleBeams.flatMap((b) => b.getNotes()));
          const beamedBassNotes = new Set(bassBeams.flatMap((b) => b.getNotes()));

          trebleTickables.forEach((tick, idx) => {
            const event = events[idx];
            if (event?.type !== "note") return;
            const eventClef = String(event?.clef || "treble").toLowerCase();
            if (eventClef !== "treble") return;
            if (!beamedTrebleNotes.has(tick)) {
              tick.setStemDirection(getStemDirectionForPitch(event.pitch, "treble"));
            }
          });

          bassTickables.forEach((tick, idx) => {
            const event = events[idx];
            if (event?.type !== "note") return;
            const eventClef = String(event?.clef || "treble").toLowerCase();
            if (eventClef !== "bass") return;
            if (!beamedBassNotes.has(tick)) {
              tick.setStemDirection(getStemDirectionForPitch(event.pitch, "bass"));
            }
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

          const isFeedback = gamePhase === "feedback" && performanceResults.length > 0;
          const wrongPitchResults = isFeedback
            ? performanceResults.filter((r) => r.timingStatus === "wrong_pitch" && r.detected)
            : [];

          let wrongTrebleVoice = null;
          let wrongBassVoice = null;

          if (wrongPitchResults.length > 0) {
            const wrongTrebleTickables = events.map((event, idx) => {
              const duration = durations[idx] || "q";
              const eventClef = String(event?.clef || "treble").toLowerCase();
              const result = wrongPitchResults.find((r) => r.noteIndex === idx);
              if (result && event.type !== "rest" && eventClef === "treble") {
                const wrong = buildStaveNote({
                  pitchStr: result.detected,
                  duration,
                  targetClef: "treble",
                });
                wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                wrong.setStemDirection(getStemDirectionForPitch(result.detected, "treble"));
                return wrong;
              }
              return buildSpacerRest(duration, "treble");
            });

            const wrongBassTickables = events.map((event, idx) => {
              const duration = durations[idx] || "q";
              const eventClef = String(event?.clef || "treble").toLowerCase();
              const result = wrongPitchResults.find((r) => r.noteIndex === idx);
              if (result && event.type !== "rest" && eventClef === "bass") {
                const wrong = buildStaveNote({
                  pitchStr: result.detected,
                  duration,
                  targetClef: "bass",
                });
                wrong.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                wrong.setStemDirection(getStemDirectionForPitch(result.detected, "bass"));
                return wrong;
              }
              return buildSpacerRest(duration, "bass");
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

          if (wrongTrebleVoice) {
            new Formatter().joinVoices([trebleVoice, wrongTrebleVoice]).format([trebleVoice, wrongTrebleVoice], formatterWidth);
          } else {
            new Formatter().joinVoices([trebleVoice]).format([trebleVoice], formatterWidth);
          }
          if (wrongBassVoice) {
            new Formatter().joinVoices([bassVoice, wrongBassVoice]).format([bassVoice, wrongBassVoice], formatterWidth);
          } else {
            new Formatter().joinVoices([bassVoice]).format([bassVoice], formatterWidth);
          }

          trebleVoice.draw(context, trebleStave);
          bassVoice.draw(context, bassStave);

          trebleBeams.forEach((beam) => beam.setContext(context).draw());
          bassBeams.forEach((beam) => beam.setContext(context).draw());

          if (wrongTrebleVoice) {
            wrongTrebleVoice.draw(context, trebleStave);
          }
          if (wrongBassVoice) {
            wrongBassVoice.draw(context, bassStave);
          }
        }
      } else {
        // Single staff rendering (multiple staves for multi-bar with proper barline config)
        const ledgerLineSpaceTop = 30;
        const ledgerLineSpaceBottom = 80;
        const staffHeight = 50;
        const totalNeededHeight =
          staffHeight + ledgerLineSpaceTop + ledgerLineSpaceBottom;

        const TOTAL_STAVE_WIDTH = requiredStaveWidth;

        const verticalCenter =
          (canvasHeight - totalNeededHeight) / 2 + ledgerLineSpaceTop;
        const yPosition = Math.max(ledgerLineSpaceTop, verticalCenter);

        // IMPORTANT: do NOT scale the viewBox; the context is already scaled.
        makeSvgResponsive(canvasWidth + PADDING_X, canvasHeight + PADDING_Y, totalBars);

        // Get all events for rendering
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

        if (totalBars > 1) {
          // Multi-bar: create separate staves for each bar
          // Use fixed width per bar for consistent notation size
          const staveWidthPerBar = FIXED_STAVE_WIDTH_PER_BAR;

          for (let barIdx = 0; barIdx < totalBars; barIdx++) {
            const xPos = STAVE_X + (barIdx * staveWidthPerBar);
            const stave = new Stave(xPos, yPosition, staveWidthPerBar);

            // Only first bar gets clef and time signature
            if (barIdx === 0) {
              stave.addClef(clef);
              stave.addTimeSignature(pattern.timeSignature);
            } else {
              // Disable beginning barline for subsequent bars
              stave.setBegBarType(Barline.type.NONE);
            }

            // Set end barline type
            if (barIdx === totalBars - 1) {
              stave.setEndBarType(Barline.type.DOUBLE);
            } else {
              stave.setEndBarType(Barline.type.SINGLE);
            }

            stave.setContext(context).draw();

            // Get events for this bar
            const barEvents = events.filter(
              (e) => Number(e?.barIndex ?? 0) === barIdx
            );
            const barEventIndices = events
              .map((e, i) => ({ event: e, globalIdx: i }))
              .filter(({ event }) => Number(event?.barIndex ?? 0) === barIdx)
              .map(({ globalIdx }) => globalIdx);

            // Build stave notes for this bar
            const barStaveNotes = [];
            const barPitchStrings = [];

            barEvents.forEach((event, localIdx) => {
              const globalIdx = barEventIndices[localIdx];
              const duration = durations[globalIdx] || "q";

              if (event.type === "rest") {
                barStaveNotes.push(buildStaveNote({
                  pitchStr: null,
                  duration: `${duration.replace(/r$/, "")}r`,
                  targetClef: clef,
                }));
                barPitchStrings.push(null);
              } else {
                barStaveNotes.push(buildStaveNote({
                  pitchStr: event.pitch,
                  duration,
                  targetClef: clef,
                }));
                barPitchStrings.push(event.pitch);
              }
            });

            // Generate beams for this bar
            const noBeamIndicesForBar = new Set(
              barEvents
                .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
                .filter((i) => i !== null)
            );

            const autoBeamNotes = barStaveNotes.filter(
              (note, idx) => !noBeamIndicesForBar.has(idx) && barEvents[idx]?.type === "note"
            );
            const barBeams = Beam.generateBeams(autoBeamNotes);

            // Set stem direction for non-beamed notes
            const beamedNotes = new Set(barBeams.flatMap((b) => b.getNotes()));
            barStaveNotes.forEach((note, idx) => {
              const pitchStr = barPitchStrings[idx];
              if (!pitchStr) return;
              if (!beamedNotes.has(note)) {
                note.setStemDirection(getStemDirectionForPitch(pitchStr, clef));
              }
            });

            // Create voice for this bar
            const voice = new Voice({
              num_beats: beatsPerMeasure,
              beat_value: 4,
            }).setMode(Voice.Mode.SOFT);
            voice.addTickables(barStaveNotes);

            // Calculate formatter width for this bar
            const barFormatterWidth = barIdx === 0
              ? Math.max(staveWidthPerBar - 100, 100)
              : Math.max(staveWidthPerBar - 20, 100);

            // Handle wrong pitch overlay
            let wrongVoice = null;
            if (gamePhase === "feedback" && performanceResults.length > 0) {
              const wrongPitchResults = performanceResults.filter(
                (r) => r.timingStatus === "wrong_pitch" && r.detected
              );

              if (wrongPitchResults.length > 0) {
                const wrongStaveNotes = barEvents.map((event, localIdx) => {
                  const globalIdx = barEventIndices[localIdx];
                  const duration = durations[globalIdx] || "q";
                  const result = wrongPitchResults.find((r) => r.noteIndex === globalIdx);

                  if (result && event.type !== "rest") {
                    const playedNote = result.detected;
                    const parsedPlayed = parsePitchForVexflow(playedNote);
                    const vexKey = parsedPlayed.key;
                    const cleanDuration = duration.replace(/r$/, "");

                    const wrongNote = new StaveNote({
                      keys: [vexKey],
                      duration: cleanDuration,
                      clef: clef,
                    });
                    if (parsedPlayed?.accidental) {
                      wrongNote.addModifier(new Accidental(parsedPlayed.accidental), 0);
                    }
                    wrongNote.setStemDirection(getStemDirectionForPitch(playedNote, clef));
                    wrongNote.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                    return wrongNote;
                  }
                  return buildSpacerRest(duration, clef);
                });

                wrongVoice = new Voice({
                  num_beats: beatsPerMeasure,
                  beat_value: 4,
                }).setMode(Voice.Mode.SOFT);
                wrongVoice.addTickables(wrongStaveNotes);
              }
            }

            // Format and draw
            if (wrongVoice) {
              new Formatter().joinVoices([voice, wrongVoice]).format([voice, wrongVoice], barFormatterWidth);
              voice.draw(context, stave);
              barBeams.forEach((beam) => beam.setContext(context).draw());
              wrongVoice.draw(context, stave);
            } else {
              new Formatter().joinVoices([voice]).format([voice], barFormatterWidth);
              voice.draw(context, stave);
              barBeams.forEach((beam) => beam.setContext(context).draw());
            }
          }
        } else {
          // Single bar: original behavior
          const stave = new Stave(STAVE_X, yPosition, TOTAL_STAVE_WIDTH);
          stave.addClef(clef);
          stave.addTimeSignature(pattern.timeSignature);
          stave.setEndBarType(Barline.type.DOUBLE);
          stave.setContext(context).draw();

          const noBeamIndices = new Set(
            events
              .map((e, i) => (e?.type === "note" && e?.noBeam ? i : null))
              .filter((i) => i !== null)
          );

          const pitchStrings = [];
          const staveNotes = events.map((event, idx) => {
            const duration = durations[idx] || "q";

            if (event.type === "rest") {
              pitchStrings.push(null);
              return buildStaveNote({
                pitchStr: null,
                duration: `${duration.replace(/r$/, "")}r`,
                targetClef: clef,
              });
            } else {
              pitchStrings.push(event.pitch);
              return buildStaveNote({
                pitchStr: event.pitch,
                duration,
                targetClef: clef,
              });
            }
          });

          const autoBeamNotes = staveNotes.filter(
            (note, idx) => !noBeamIndices.has(idx) && events[idx]?.type === "note"
          );
          const beams = Beam.generateBeams(autoBeamNotes);

          // Set stem direction for non-beamed notes
          const beamedNotes = new Set(beams.flatMap((b) => b.getNotes()));
          staveNotes.forEach((note, idx) => {
            const pitchStr = pitchStrings[idx];
            if (!pitchStr) return;
            if (!beamedNotes.has(note)) {
              note.setStemDirection(getStemDirectionForPitch(pitchStr, clef));
            }
          });

          const voice = new Voice({
            num_beats: pattern.totalDuration,
            beat_value: 4,
          }).setMode(Voice.Mode.SOFT);
          voice.addTickables(staveNotes);

          // Handle wrong pitch overlay
          let wrongVoice = null;
          if (gamePhase === "feedback" && performanceResults.length > 0) {
            const wrongPitchResults = performanceResults.filter(
              (r) => r.timingStatus === "wrong_pitch" && r.detected
            );

            if (wrongPitchResults.length > 0) {
              const wrongStaveNotes = events.map((event, idx) => {
                const duration = durations[idx] || "q";
                const result = wrongPitchResults.find((r) => r.noteIndex === idx);

                if (result && event.type !== "rest") {
                  const playedNote = result.detected;
                  const parsedPlayed = parsePitchForVexflow(playedNote);
                  const vexKey = parsedPlayed.key;
                  const cleanDuration = duration.replace(/r$/, "");

                  const wrongNote = new StaveNote({
                    keys: [vexKey],
                    duration: cleanDuration,
                    clef: clef,
                  });
                  if (parsedPlayed?.accidental) {
                    wrongNote.addModifier(new Accidental(parsedPlayed.accidental), 0);
                  }
                  wrongNote.setStemDirection(getStemDirectionForPitch(playedNote, clef));
                  wrongNote.setStyle({ fillStyle: "#EF4444", strokeStyle: "#EF4444" });
                  return wrongNote;
                }
                return buildSpacerRest(duration, clef);
              });

              wrongVoice = new Voice({
                num_beats: pattern.totalDuration,
                beat_value: 4,
              }).setMode(Voice.Mode.SOFT);
              wrongVoice.addTickables(wrongStaveNotes);
            }
          }

          // Format and draw
          if (wrongVoice) {
            new Formatter().joinVoices([voice, wrongVoice]).format([voice, wrongVoice], formatterWidth);
            voice.draw(context, stave);
            beams.forEach((beam) => beam.setContext(context).draw());
            wrongVoice.draw(context, stave);
          } else {
            new Formatter().joinVoices([voice]).format([voice], formatterWidth);
            voice.draw(context, stave);
            beams.forEach((beam) => beam.setContext(context).draw());
          }
        }
      }

      // Extract note elements for highlighting
      notesRef.current = extractNoteElements();
      console.debug("[VexFlowStaffDisplay]", {
        notesRef: notesRef.current.length,
      });

      // Fit SVG viewBox to rendered content after VexFlow completes drawing
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

  // Effect: Start continuous smooth scroll animation during performance phase
  useEffect(() => {
    // Only auto-scroll during performance phase
    if (gamePhase !== "performance") return;

    // Only auto-scroll for multi-bar patterns
    const totalBars = Math.max(1, Number(pattern?.measuresPerPattern || 1));
    if (totalBars <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    // Smooth interpolation constant - higher = snappier response
    const LERP_FACTOR = 0.18; // Increased from 0.12 for smoother, more responsive animation

    /**
     * Continuous scroll animation loop using linear interpolation (lerp)
     * This runs continuously during the entire performance phase, never stopping
     * Smoothly interpolates toward the target scroll position without pauses
     */
    const animateScroll = () => {
      const currentScroll = container.scrollLeft;
      const targetScroll = targetScrollRef.current;
      const delta = targetScroll - currentScroll;

      // Linear interpolation: move a fraction of the distance toward target
      // This creates smooth movement with natural deceleration as we approach target
      // Animation NEVER stops - it continuously runs even when at/near target
      const newScroll = currentScroll + delta * LERP_FACTOR;
      container.scrollLeft = newScroll;

      // Continue animation loop indefinitely during performance phase
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    };

    // Reset on first note (before performance starts)
    if (currentNoteIndex === 0) {
      maxScrollRef.current = 0;
      targetScrollRef.current = 0;
      container.scrollLeft = 0;
    }

    // Start the continuous animation loop (only once per performance phase)
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }

    // Update target scroll position based on current note
    if (notesRef.current && notesRef.current.length > 0) {
      if (currentNoteIndex >= 0 && currentNoteIndex < notesRef.current.length) {
        const currentNoteElement = notesRef.current[currentNoteIndex];

        if (currentNoteElement) {
          try {
            // Get the bounding box of the current note relative to the container
            const containerRect = container.getBoundingClientRect();
            const noteRect = currentNoteElement.getBoundingClientRect();

            // Calculate note position relative to container's scroll position
            const noteLeftRelativeToContainer = noteRect.left - containerRect.left + container.scrollLeft;

            // Target scroll position: position note at 30% from left edge
            // This gives users preview of upcoming notes while keeping current note visible
            const viewportWidth = containerRect.width;
            let newTarget = Math.max(0, noteLeftRelativeToContainer - (viewportWidth * 0.3));

            // Calculate maximum scroll position to prevent over-scrolling
            // The last measure should have the same padding from the right edge as the first measure has from the left edge
            const svg = vexContainerRef.current?.querySelector("svg");
            if (svg) {
              const svgWidth = svg.getBoundingClientRect().width;
              const contentWidth = svgWidth;

              // Get left padding from first stave (STAVE_X is used when creating staves)
              const leftPadding = 50; // STAVE_X constant from renderStaff

              // Maximum scroll = total content width - viewport width + left padding
              // This ensures the last measure is at the same distance from right edge as first measure is from left edge
              const maxAllowedScroll = Math.max(0, contentWidth - viewportWidth + leftPadding);

              // Clamp the target scroll position to not exceed maximum
              newTarget = Math.min(newTarget, maxAllowedScroll);
            }

            // Only scroll forward, never backward
            // Update target only if it's greater than our max (prevents backward scrolling)
            if (newTarget > maxScrollRef.current) {
              maxScrollRef.current = newTarget;
              targetScrollRef.current = newTarget;
            }
          } catch (err) {
            console.warn("Failed to calculate scroll position for current note:", err);
          }
        }
      }
    }

    // Cleanup function to cancel animation on unmount or phase change
    return () => {
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      isScrollingRef.current = false;
    };
  }, [currentNoteIndex, gamePhase, pattern?.measuresPerPattern]);

  // Effect: Reset scroll position when entering feedback phase
  useEffect(() => {
    if (gamePhase !== "feedback") return;

    const container = containerRef.current;
    if (!container) return;

    // Cancel any ongoing scroll animation
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    isScrollingRef.current = false;

    // Reset scroll tracking refs
    maxScrollRef.current = 0;
    targetScrollRef.current = 0;

    // Reset to start of pattern for feedback review
    container.scrollTo({
      left: 0,
      behavior: 'smooth',
    });
  }, [gamePhase]);

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
      style={{
        height: "100%",
        // Prevent horizontal scrollbar during non-feedback phases
        // The inner container handles feedback-phase scrolling
        overflowX: gamePhase === "feedback" ? "visible" : "hidden",
        overflowY: "hidden",
      }}
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
            overflowX: gamePhase === "feedback" ? "auto" : "hidden", // Scrollbar only during feedback; auto-scroll still works programmatically
            overflowY: "hidden", // Prevent vertical scroll
            WebkitOverflowScrolling: "touch", // iOS momentum scrolling
            // Note: We handle smooth scrolling via JS (scrollTo with behavior: 'smooth')
            // to have better control over scroll timing and prevent conflicts
          }}
          role="img"
          aria-label={`Musical notation: ${pattern.timeSignature} time signature with ${pattern.notes.length} notes`}
        >
          {/* VexFlow-only container - React never touches this */}
          <div
            id={containerId}
            ref={vexContainerRef}
            style={{
              minWidth: "100%", // Allow to grow beyond container width
              overflow: "visible",
              position: "relative",
            }}
          />
        </div>
      )}
    </div>
  );
}
