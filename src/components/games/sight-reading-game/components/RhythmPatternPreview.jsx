import { useEffect, useRef, useId } from "react";
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Beam,
  Dot,
  Stem,
} from "vexflow";

/**
 * RhythmPatternPreview Component
 * Renders a small VexFlow staff snippet showing a rhythm pattern.
 *
 * @param {Object} props
 * @param {Array} props.events - Array of { type: 'note'|'rest', duration: 'q'|'8'|'16'|etc, dotted?: boolean }
 * @param {number} props.width - Width in pixels (default: 80)
 * @param {number} props.height - Height in pixels (default: 50)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.noteColor - Color for notes (default: "currentColor" for dark themes)
 */
export function RhythmPatternPreview({
  events = [],
  width = 80,
  height = 50,
  className = "",
  ariaLabel = "Rhythm pattern",
  noteColor = "#ffffff",
}) {
  const uniqueId = useId();
  const containerId = `rhythm-preview-${uniqueId.replace(/:/g, "-")}`;
  const containerRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || events.length === 0) {
      return;
    }

    // Clear previous rendering
    container.innerHTML = "";

    try {
      // Render at a larger size for better readability on mobile
      const renderWidth = 200;
      const renderHeight = 100;
      // Zoom factor so glyphs/stems are clearly legible in small tiles.
      // Implemented via viewBox "center crop" (not context transforms) because
      // VexFlow's SVG context doesn't expose translate/scale.
      // Higher values = larger notation, but too high clips stems.
      // With stems up, we need moderate zoom to avoid clipping.
      const ZOOM = 1.2;

      // Create SVG renderer at larger size
      const renderer = new Renderer(container, Renderer.Backends.SVG);
      renderer.resize(renderWidth, renderHeight);
      rendererRef.current = renderer;

      const context = renderer.getContext();

      // Create a stave for positioning but don't draw it (no staff lines needed)
      const staveWidth = renderWidth - 20;
      const staveX = 10;
      // Stave y is the *top* of the stave. With stems pointing up, we need more space above,
      // so position the stave slightly lower (larger Y value) to avoid clipping stems.
      // (VexFlow stave height is roughly ~40px for a standard 5-line stave.)
      const staveY = Math.max(0, Math.round((renderHeight - 40) / 2) + 8);

      const stave = new Stave(staveX, staveY, staveWidth);
      stave.setContext(context);
      // Don't draw the stave - we only want the rhythm notation

      // Build StaveNotes from events
      // According to VexFlow documentation (https://www.vexflow.com/build/docs/stem.html):
      // - Stem.UP = 1 (stem points upward, rendered to the right of notehead)
      // - Stem.DOWN = -1 (stem points downward, rendered to the left of notehead)
      // For rhythm-only displays, always use Stem.UP for consistency (per vexflow-guidelines.md)
      //
      // IMPORTANT: Use a note BELOW the middle line (line 3) so VexFlow's automatic
      // stem direction calculation gives UP. According to vexflow-tutorial.md lines 172-176:
      // - VexFlow sums line positions: if sum >= 0, uses Stem.DOWN; if sum < 0, uses Stem.UP
      // - b/4 is on line 3 (middle line), so sum=0 → Stem.DOWN (unwanted)
      // - g/4 is on line 2, so sum=-1 → Stem.UP (correct)
      const defaultKey = "g/4"; // Below middle line for automatic Stem.UP
      const staveNotes = events.map((event) => {
        const isRest = event.type === "rest";
        const baseDuration = event.duration || "q";
        const isDotted = event.dotted || false;

        // Build duration string
        let duration = baseDuration;
        if (isRest) {
          duration = `${baseDuration}r`;
        }

        const noteConfig = {
          keys: [isRest ? "b/4" : defaultKey],
          duration,
          clef: "treble",
        };

        const note = new StaveNote(noteConfig);

        // Set stem direction UP for all non-rest notes BEFORE beaming.
        // This ensures all notes have the correct direction before beam generation.
        if (!isRest) {
          note.setStemDirection(Stem.UP);
        }

        // Add dot if needed
        if (isDotted && !isRest) {
          Dot.buildAndAttach([note], { all: true });
        }

        return note;
      });

      // Generate beams with stem_direction: Stem.UP to force all beamed notes to use UP.
      // According to VexFlow Beam API (https://www.vexflow.com/build/docs/beam.html):
      // - Using stem_direction in config forces the direction for all beamed notes
      // - When notes are beamed, flags are automatically removed (replaced by beams)
      const beams = Beam.generateBeams(staveNotes, {
        stem_direction: Stem.UP,
      });

      // Force stem direction UP on each beam object directly.
      // This ensures the beam's internal stem_direction property is set correctly.
      beams.forEach((beam) => {
        beam.stem_direction = Stem.UP;
      });

      // For non-beamed notes, set stem direction to UP.
      // Beamed notes are handled by the beam's stem_direction.
      const beamedNotes = new Set(beams.flatMap((b) => b.getNotes()));
      staveNotes.forEach((note, idx) => {
        const event = events[idx];
        // Only set stem direction on actual notes (not rests) that aren't beamed
        // Rests don't have stems per VexFlow documentation
        if (event?.type !== "rest" && !beamedNotes.has(note)) {
          note.setStemDirection(Stem.UP);
        }
      });

      // Create voice and format
      // Calculate total duration in quarter notes for voice
      const totalTicks = events.reduce((sum, e) => {
        const durationTicks = {
          w: 16,
          h: 8,
          q: 4,
          8: 2,
          16: 1,
        };
        const base = durationTicks[e.duration] || 4;
        return sum + (e.dotted ? base * 1.5 : base);
      }, 0);

      // Use soft mode to allow partial measures
      const voice = new Voice({
        num_beats: Math.max(1, Math.ceil(totalTicks / 4)),
        beat_value: 4,
      }).setMode(Voice.Mode.SOFT);

      voice.addTickables(staveNotes);

      // Format and draw with appropriate spacing
      const formatWidth = staveWidth - 10;
      const formatter = new Formatter();
      formatter.joinVoices([voice]).format([voice], formatWidth, {
        align_rests: true,
      });
      voice.draw(context, stave);

      // Draw beams
      beams.forEach((beam) => beam.setContext(context).draw());

      // Fit the rendered SVG to the requested size using viewBox-based scaling.
      // IMPORTANT: avoid CSS transform scaling here — transforms don't affect flex layout size,
      // which can cause the (scaled) content to be clipped out of the visible container.
      const svg = container.querySelector("svg");
      if (svg) {
        // Get the bounding box of the actual rendered content to center it.
        // VexFlow renders content starting from staveX, so we need to find
        // where the content actually is and center the viewBox on it.
        const bbox = svg.getBBox();
        const safeZoom = Number.isFinite(ZOOM) && ZOOM > 0 ? ZOOM : 1;

        // Add padding around the content
        const padding = 4;
        const contentX = bbox.x - padding;
        const contentY = bbox.y - padding;
        const contentW = bbox.width + padding * 2;
        const contentH = bbox.height + padding * 2;

        // Apply zoom by expanding the viewBox (smaller zoom = larger viewBox = smaller content)
        const viewBoxW = contentW / safeZoom;
        const viewBoxH = contentH / safeZoom;
        // Center the zoomed viewBox on the content center
        const contentCenterX = contentX + contentW / 2;
        const contentCenterY = contentY + contentH / 2;
        const viewBoxX = contentCenterX - viewBoxW / 2;
        const viewBoxY = contentCenterY - viewBoxH / 2;

        svg.setAttribute(
          "viewBox",
          `${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`
        );
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.display = "block";

        // Apply color styling to all note elements
        if (noteColor) {
          const elements = svg.querySelectorAll("path, text, rect, line");
          elements.forEach((el) => {
            if (el.tagName === "text") {
              el.style.fill = noteColor;
            } else {
              // Many VexFlow paths are stroke-based; keep both set to ensure visibility.
              // (If a path intentionally has fill="none", setting fill is harmless.)
              el.style.fill = noteColor;
              el.style.stroke = noteColor;
            }
          });
        }
      }
    } catch (err) {
      console.error("RhythmPatternPreview render error:", err);
    }

    return () => {
      // Cleanup
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [events, width, height, containerId, noteColor]);

  return (
    <div
      ref={containerRef}
      id={containerId}
      className={`rhythm-pattern-preview ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        overflow: "visible",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      role="img"
      aria-label={ariaLabel}
    />
  );
}

export default RhythmPatternPreview;
