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
import { Formatter, Stave, Voice, StaveNote, Dot, GhostNote } from "vexflow";

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
  const match = pitch.match(/^([A-Ga-g])(#?)(\d)$/);
  if (!match) return null;

  const [, letter, accidental, octaveStr] = match;
  const noteKey = `${letter.toUpperCase()}${accidental ? "#" : ""}`;
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
    if (!containerSize.height) return 220;
    return Math.max(containerSize.height - 8, 180);
  }, [containerSize.height]);

  /**
   * Extract note SVG elements from rendered VexFlow for highlighting
   * Only returns expected notes (not wrong note overlays)
   */
  const extractNoteElements = useCallback(() => {
    if (!vexContainerRef.current || !pattern?.notes) return [];

    try {
      // VexFlow renders notes with class 'vf-stavenote' or 'vf-note'
      // When we have a wrongVoice, VexFlow renders both voices' notes
      // We only want the first pattern.notes.length elements (expected notes)
      const allNoteElements =
        vexContainerRef.current.querySelectorAll(".vf-stavenote");
      const noteElementsArray = Array.from(allNoteElements);

      // Only take the first pattern.notes.length elements
      // These correspond to the expected notes from the main voice
      return noteElementsArray.slice(0, pattern.notes.length);
    } catch (err) {
      console.warn("Failed to extract note elements:", err);
      return [];
    }
  }, [pattern?.notes]);

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
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";
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
      console.log("=== VexFlow Rendering Debug ===");
      console.log("🎮 Game Phase:", gamePhase);
      console.log("📊 Performance Results Count:", performanceResults.length);
      console.log("Time signature:", pattern.timeSignature);
      console.log("Expected duration (beats):", expectedDuration);
      console.log("Pattern totalDuration:", pattern.totalDuration);
      console.log("EasyScore string:", pattern.easyscoreString);
      console.log("Pattern notes:", pattern.notes);

      // Check if pattern needs padding
      let easyscoreString = pattern.easyscoreString;
      const durationDiff = expectedDuration - pattern.totalDuration;

      console.log("Duration difference:", durationDiff);

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
          console.log(
            `Padded with ${restNotation} rest (${remainingDuration} beats needed)`
          );
        } else {
          console.warn(`Pattern is ${Math.abs(durationDiff)} beats too long!`);
        }
      } else {
        console.log(
          "Pattern duration matches time signature, no padding needed"
        );
      }

      console.log("Final EasyScore string:", easyscoreString);
      console.log("================================");

      // Determine responsive canvas dimensions
      const canvasHeight = responsiveHeight || 200;
      const canvasWidth = responsiveWidth || staffWidth;

      // Initialize VexFlow with responsive dimensions
      const vf = initializeVexFlow(containerId, canvasWidth, canvasHeight);
      vfRef.current = vf;

      // Get the renderer context
      const context = vf.getContext();

      // Center the stave vertically in the container
      // The staff itself needs space above for high notes and below for low notes
      // Position the top line of the staff at approximately 20% from the top
      // The 20 is the padding from the top of the container
      // CanvasHeight is the height of the canvas 
      // 0.2 is 20% of the canvas height
      // The formula is: Math.max(padding, canvasHeight * percentage)
      // Math.max means the maximum of the two values: 
      const yPosition = Math.max(20, canvasHeight * 0.2);

      const stave = new Stave(50, yPosition, Math.max(canvasWidth - 100, 240));
      stave.addClef(clef);
      stave.addTimeSignature(pattern.timeSignature);
      stave.setEndBarType(2); // Double barline
      stave.setContext(context).draw();
      makeSvgResponsive(canvasWidth, canvasHeight);

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
        // Treble: b/4, Bass: d/3
        let vexflowKey;
        if (isRest) {
          vexflowKey = clef === "bass" ? "d/3" : "b/4";
        } else {
          // Convert pitch from "C4" format to "c/4" format (VexFlow expects slash)
          const note = pitchStr.slice(0, -1).toLowerCase(); // "C" -> "c"
          const octave = pitchStr.slice(-1); // "4"
          vexflowKey = `${note}/${octave}`; // "c/4"
        }

        // Build StaveNote config
        const noteConfig = {
          keys: [vexflowKey],
          duration: isRest ? `${duration}r` : duration,
          clef: clef,
        };

        // Create the StaveNote
        const staveNote = new StaveNote(noteConfig);

        if (!isRest) {
          const stemDirection = getStemDirectionForPitch(pitchStr, clef);
          staveNote.setStemDirection(stemDirection);
        }

        // Add dot modifier for dotted notes
        if (isDotted) {
          // For each key in the note, add a dot
          for (let i = 0; i < noteConfig.keys.length; i++) {
            staveNote.addModifier(new Dot(), i);
          }
        }

        return staveNote;
      });

      // Create voice with SOFT mode
      const voice = new Voice({
        num_beats: pattern.totalDuration,
        beat_value: 4,
      });
      voice.setMode(Voice.Mode.SOFT); // Use SOFT mode constant
      voice.addTickables(staveNotes);

      const formatterWidth = Math.max(canvasWidth - 200, 200);

      // Build wrong notes voice (only during FEEDBACK phase and only if there are wrong pitches)
      let wrongVoice = null;
      if (gamePhase === "feedback" && performanceResults.length > 0) {
        // First, check if there are ANY wrong pitch results
        const wrongPitchResults = performanceResults.filter(
          (r) => r.timingStatus === "wrong_pitch" && r.detected
        );

        if (wrongPitchResults.length > 0) {
          console.log("=== Building Wrong Voice ===");
          console.log("Wrong pitch results:", wrongPitchResults);

          // Build a parallel array of wrong notes (same length as staveNotes)
          const wrongStaveNotes = staveNotes.map((expectedNote, idx) => {
            // Find if this note has a wrong pitch result
            const result = performanceResults.find(
              (r) =>
                r.noteIndex === idx &&
                r.timingStatus === "wrong_pitch" &&
                r.detected
            );

            if (result) {
              console.log(
                `Wrong note at index ${idx}: Expected ${result.expected}, Played ${result.detected}`
              );

              // Create a VexFlow note for the wrong pitch played
              const playedNote = result.detected; // e.g., "E4"
              const note = playedNote.slice(0, -1).toLowerCase();
              const octave = playedNote.slice(-1);
              const vexKey = `${note}/${octave}`;

              // Get the duration from the expected note, remove "r" if present
              const duration = expectedNote.duration;
              const cleanDuration = duration.replace(/r$/, "");

              const wrongNote = new StaveNote({
                keys: [vexKey],
                duration: cleanDuration,
                clef: clef,
              });

              const wrongStemDirection = getStemDirectionForPitch(
                playedNote,
                clef
              );
              wrongNote.setStemDirection(wrongStemDirection);

              // Style the wrong note red BEFORE adding to voice
              wrongNote.setStyle({
                fillStyle: "#EF4444",
                strokeStyle: "#EF4444",
              });

              console.log(
                `Created wrong note: ${vexKey} with duration ${cleanDuration}`
              );

              return wrongNote;
            } else {
              // No wrong note here - use an INVISIBLE rest with the same duration
              const duration = expectedNote.duration;
              const cleanDuration = duration.replace(/r$/, ""); // Remove "r" if present

              const ghost = new GhostNote(cleanDuration);

              // VexFlow GhostNotes have no visible glyph, but we still ensure styles stay transparent
              ghost.setStyle({
                fillStyle: "transparent",
                strokeStyle: "transparent",
              });

              return ghost;
            }
          });

          console.log("Wrong stave notes created:", wrongStaveNotes.length);

          // Create wrong notes voice
          wrongVoice = new Voice({
            num_beats: pattern.totalDuration,
            beat_value: 4,
          });
          wrongVoice.setMode(Voice.Mode.SOFT);
          wrongVoice.addTickables(wrongStaveNotes);
        } else {
          console.log("No wrong pitch results, skipping wrong voice creation");
        }
      }

      // Format and draw voices
      if (wrongVoice) {
        console.log("✨ Drawing wrong voice with main voice (FEEDBACK phase)");
        // Format both voices together so they align
        const voices = [voice, wrongVoice];
        new Formatter().joinVoices(voices).format(voices, formatterWidth);

        // Draw both voices
        voice.draw(context, stave);
        wrongVoice.draw(context, stave);
        console.log("Both voices drawn");

        // Debug: Check what was actually rendered
        const allNotesInDOM =
          vexContainerRef.current?.querySelectorAll(".vf-stavenote");
        console.log(
          `Total notes in DOM after drawing: ${allNotesInDOM?.length || 0}`
        );
        console.log(`Expected notes count: ${pattern.notes.length}`);
        console.log(
          `Wrong voice notes count: ${wrongVoice.getTickables().length}`
        );

        // Mark wrong notes in the DOM so they don't get recolored
        // We need to find which DOM indices correspond to actual wrong notes
        if (allNotesInDOM && allNotesInDOM.length > pattern.notes.length) {
          // Get the pattern indices that have wrong notes
          const wrongNoteIndices = performanceResults
            .filter((r) => r.timingStatus === "wrong_pitch" && r.detected)
            .map((r) => r.noteIndex);

          console.log(
            `Wrong note pattern indices: [${wrongNoteIndices.join(", ")}]`
          );

          // The wrong voice starts at pattern.notes.length in the DOM
          // We need to map pattern indices to DOM indices for the wrong voice
          wrongNoteIndices.forEach((patternIdx) => {
            const domIdx = pattern.notes.length + patternIdx;

            if (domIdx < allNotesInDOM.length) {
              const wrongNoteElement = allNotesInDOM[domIdx];

              wrongNoteElement.setAttribute("data-wrong-note", "true");
              // Ensure red color is applied to all child elements
              wrongNoteElement.setAttribute("fill", "#EF4444");
              wrongNoteElement.setAttribute("stroke", "#EF4444");

              // Also apply to all child path elements (note heads, stems, etc.)
              const paths = wrongNoteElement.querySelectorAll("path");
              paths.forEach((path) => {
                path.setAttribute("fill", "#EF4444");
                path.setAttribute("stroke", "#EF4444");
              });

              console.log(
                `Marked wrong note at pattern index ${patternIdx} (DOM index ${domIdx})`
              );
            }
          });
        }
      } else {
        // Format and draw only the main voice (no wrong notes)
        console.log(
          gamePhase === "feedback"
            ? "⚠️ No wrong voice (no wrong pitches in results)"
            : "📝 Drawing main voice only (not in feedback phase)"
        );
        new Formatter().joinVoices([voice]).format([voice], formatterWidth);
        voice.draw(context, stave);
      }

      // Extract note elements for highlighting
      notesRef.current = extractNoteElements();
      console.log(
        `Notes in notesRef after extraction: ${notesRef.current.length}`
      );

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
      console.log("🔄 Triggering renderStaff - Reason:", {
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
    <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center">
      {error ? (
        <div className="relative w-full bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">
            Unable to render musical notation
          </p>
          <p className="text-red-400 text-xs mt-1">{error}</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative w-full h-full bg-transparent vexflow-container flex items-center justify-center"
          role="img"
          aria-label={`Musical notation: ${pattern.timeSignature} time signature with ${pattern.notes.length} notes`}
        >
          {/* VexFlow-only container - React never touches this */}
          <div
            id={containerId}
            ref={vexContainerRef}
            className="w-full h-full"
            style={{ minHeight: "180px" }}
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
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: "85%",
                }}
              />
            )}
        </div>
      )}
    </div>
  );
}
