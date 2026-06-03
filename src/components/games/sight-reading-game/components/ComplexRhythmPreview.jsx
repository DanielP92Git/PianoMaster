/**
 * ComplexRhythmPreview Component
 *
 * Renders a mixed-duration rhythm pattern (the "complex" example tiles on the
 * rhythm settings screen) from hand-laid-out SVG geometry instead of VexFlow.
 *
 * Why not VexFlow: the VexFlow-based RhythmPatternPreview renders noteheads as
 * <text> glyphs and then small-renders + zooms via a viewBox crop, which
 * magnifies a sub-pixel font-baseline offset into a visible gap between each
 * notehead and its stem (reproduced on PC/Android/iOS; not fixable from
 * outside VexFlow). Here every notehead, stem, beam, flag and dot lives in one
 * SVG with shared coordinates, so a head can never detach from its stem — the
 * same guarantee the static simple-note tiles (StaticRhythmPreview) rely on.
 *
 * Supports exactly what the COMPLEX_EXAMPLE_PATTERNS need: filled noteheads
 * (quarter and shorter), up-stems, beam groups over consecutive eighths/
 * sixteenths (with secondary beams / stubs for sixteenths), flags on isolated
 * eighths/sixteenths, and augmentation dots.
 *
 * Color comes purely from CSS `currentColor` (set via `color` on the wrapper).
 *
 * @param {Object} props
 * @param {Array} props.events - [{ type:'note', duration:'q'|'8'|'16', dotted?:boolean }]
 * @param {number} props.width - Width in pixels (default: 100)
 * @param {number} props.height - Height in pixels (default: 54)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.ariaLabel - Accessibility label
 * @param {string} props.noteColor - CSS color for the glyph (default: "#ffffff")
 */

// --- Geometry constants (in a 100-tall viewBox) ---
const VB_H = 100;
const NOTE_CY = 74; // notehead vertical center
const STEM_TOP = 16; // top of stems / primary beam line
const STEM_W = 2.6;
const HEAD_RX = 7;
const HEAD_RY = 5.3;
const HEAD_ROT = -20; // degrees
const STEM_DX = 6.3; // stem offset from notehead center (right side, up-stem)
const BEAM_H = 7; // primary beam thickness
const BEAM2_DY = 9; // secondary beam offset below primary
const BEAM2_H = 6; // secondary beam thickness
const DOT_R = 2.3;
const LEFT_PAD = 9;
const RIGHT_PAD = 16; // room for a trailing flag

// Horizontal advance per note (looser for longer values).
function advanceFor(event) {
  const base = event.duration === "q" ? 34 : event.duration === "8" ? 24 : 18;
  return event.dotted ? base * 1.35 : base;
}

const isBeamable = (e) => e.duration === "8" || e.duration === "16";

/**
 * Split the events into maximal runs of consecutive beamable (8th/16th) notes.
 * Returns an array of runs, each run being an array of note indices.
 * Quarter notes (and any non-beamable) break runs.
 */
function beamRuns(events) {
  const runs = [];
  let current = [];
  events.forEach((e, i) => {
    if (isBeamable(e)) {
      current.push(i);
    } else if (current.length) {
      runs.push(current);
      current = [];
    }
  });
  if (current.length) runs.push(current);
  return runs;
}

export function ComplexRhythmPreview({
  events = [],
  width = 100,
  height = 54,
  className = "",
  ariaLabel = "Rhythm pattern",
  noteColor = "#ffffff",
}) {
  if (!Array.isArray(events) || events.length === 0) {
    return (
      <div
        className={className}
        style={{ width: `${width}px`, height: `${height}px` }}
        role="img"
        aria-label={ariaLabel}
      />
    );
  }

  // Lay out note x-centers left to right.
  const cx = [];
  let cursor = LEFT_PAD + HEAD_RX;
  events.forEach((e, i) => {
    cx[i] = cursor;
    cursor += advanceFor(e);
    // Reserve a little extra after the last note if it carries a flag.
    if (i === events.length - 1) cursor += 0;
  });
  const vbW =
    cursor - advanceFor(events[events.length - 1]) + HEAD_RX + RIGHT_PAD;
  const stemX = cx.map((x) => x + STEM_DX);

  const runs = beamRuns(events);

  // Build secondary-beam (sixteenth-level) segments inside beamed runs.
  const secondaryBeams = [];
  runs
    .filter((r) => r.length >= 2)
    .forEach((run) => {
      run.forEach((idx, posInRun) => {
        if (events[idx].duration !== "16") return;
        const nextIdx = run[posInRun + 1];
        const prevIdx = run[posInRun - 1];
        const nextIs16 = nextIdx != null && events[nextIdx].duration === "16";
        const prevIs16 = prevIdx != null && events[prevIdx].duration === "16";
        if (nextIs16) {
          // Full secondary beam spanning this 16th and the next.
          secondaryBeams.push([stemX[idx], stemX[nextIdx]]);
        } else if (!prevIs16) {
          // Isolated 16th in the run (neighbour is an 8th): draw a stub
          // pointing toward the group it belongs to.
          const hasLeft = prevIdx != null;
          const stub = 8;
          secondaryBeams.push(
            hasLeft
              ? [stemX[idx] - stub, stemX[idx]]
              : [stemX[idx], stemX[idx] + stub]
          );
        }
        // (prevIs16 && !nextIs16) is already covered by the previous note's
        // full segment — skip to avoid double-drawing.
      });
    });

  // Flags for isolated beamable notes (runs of length 1).
  const flagged = runs.filter((r) => r.length === 1).map((r) => r[0]);

  const flagPath = (sx, level) => {
    const y = STEM_TOP + level * 8;
    return (
      `M ${sx} ${y} ` +
      `C ${sx + 9} ${y + 5} ${sx + 11} ${y + 13} ${sx + 5} ${y + 22} ` +
      `C ${sx + 9} ${y + 14} ${sx + 8} ${y + 8} ${sx} ${y + 9} Z`
    );
  };

  return (
    <div
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        color: noteColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox={`0 0 ${vbW} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ height: "100%", width: "auto", display: "block" }}
        aria-hidden="true"
      >
        {/* Stems */}
        {events.map((e, i) => (
          <line
            key={`stem-${i}`}
            x1={stemX[i]}
            y1={NOTE_CY - 1}
            x2={stemX[i]}
            y2={STEM_TOP}
            stroke="currentColor"
            strokeWidth={STEM_W}
            strokeLinecap="round"
          />
        ))}

        {/* Primary beams (one per beamed run of 2+) */}
        {runs
          .filter((r) => r.length >= 2)
          .map((run, i) => {
            const x1 = stemX[run[0]];
            const x2 = stemX[run[run.length - 1]];
            return (
              <rect
                key={`beam-${i}`}
                x={x1 - STEM_W / 2}
                y={STEM_TOP}
                width={x2 - x1 + STEM_W}
                height={BEAM_H}
                rx="1"
                fill="currentColor"
              />
            );
          })}

        {/* Secondary (sixteenth) beams + stubs */}
        {secondaryBeams.map(([x1, x2], i) => (
          <rect
            key={`beam2-${i}`}
            x={Math.min(x1, x2)}
            y={STEM_TOP + BEAM2_DY}
            width={Math.abs(x2 - x1)}
            height={BEAM2_H}
            rx="1"
            fill="currentColor"
          />
        ))}

        {/* Flags for isolated eighths/sixteenths */}
        {flagged.map((i) => {
          const levels = events[i].duration === "16" ? 2 : 1;
          return Array.from({ length: levels }).map((_, l) => (
            <path
              key={`flag-${i}-${l}`}
              d={flagPath(stemX[i], l)}
              fill="currentColor"
            />
          ));
        })}

        {/* Noteheads (filled) */}
        {events.map((e, i) => (
          <ellipse
            key={`head-${i}`}
            cx={cx[i]}
            cy={NOTE_CY}
            rx={HEAD_RX}
            ry={HEAD_RY}
            fill="currentColor"
            transform={`rotate(${HEAD_ROT} ${cx[i]} ${NOTE_CY})`}
          />
        ))}

        {/* Augmentation dots */}
        {events.map((e, i) =>
          e.dotted ? (
            <circle
              key={`dot-${i}`}
              cx={cx[i] + HEAD_RX + 5}
              cy={NOTE_CY}
              r={DOT_R}
              fill="currentColor"
            />
          ) : null
        )}
      </svg>
    </div>
  );
}

export default ComplexRhythmPreview;
