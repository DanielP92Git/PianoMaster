import { useReducedMotion, motion } from "framer-motion";

// ─── SVG layout (full octave: 7 white + 5 black keys) ───────────
const VIEWBOX = "0 0 100 85";
const KEY_TOP = 35;
const WK_W = 13;   // white key width
const WK_H = 48;   // white key height
const BK_W = 8;    // black key width
const BK_H = 30;   // black key height

// C  D  E  F  G  A  B — 7 white keys, 0.5 gap between each
const WHITE_KEYS = [
  { x: 3 },     // C
  { x: 16.5 },  // D
  { x: 30 },    // E
  { x: 43.5 },  // F
  { x: 57 },    // G
  { x: 70.5 },  // A
  { x: 84 },    // B
];

// 2-black group (C#, D#) + gap + 3-black group (F#, G#, A#)
const BLACK_KEYS = [
  { x: 12.5 },  // C#
  { x: 26 },    // D#
  { x: 53 },    // F#
  { x: 66.5 },  // G#
  { x: 80 },    // A#
];

// ─── Animation config (module-level, no re-creation) ─────────────
const MELODY = [0, 2, 4, 6, 5, 3, 1]; // C E G B A F D — up thirds, down
const CYCLE = 3.0;
const GAP = 0.3;
const PRESS_DUR = 0.35;
const PRESS_Y = 4;
const BOUNCE_EASE = [0.34, 1.56, 0.64, 1];

// Pre-compute per-key animation timing
const KEY_ANIMATIONS = WHITE_KEYS.map((_, i) => {
  const seq = MELODY.indexOf(i);
  return {
    active: seq >= 0,
    delay: seq >= 0 ? seq * GAP : 0,
    repeatDelay: CYCLE - PRESS_DUR,
  };
});

// Floating eighth-note definitions
const NOTES = [
  { x: 10, delay: 0.1, fill: "rgb(165,180,252)", rot: -15 },  // indigo-300
  { x: 45, delay: 1.0, fill: "rgb(216,180,254)", rot: 10 },   // purple-300
  { x: 78, delay: 1.9, fill: "rgb(249,168,212)", rot: -8 },   // pink-300
];
const NOTE_DUR = 1.6;
const NOTE_REPEAT_DELAY = CYCLE - NOTE_DUR + 0.4;

// Size map
const SIZES = {
  sm: "w-20",       // ~80px
  md: "w-[120px]",  // 120px
  lg: "w-40",       // 160px
};

/**
 * MusicLoader — piano-themed loading animation.
 *
 * Renders an inline SVG of piano keys with Framer Motion press
 * animation and floating eighth-note glyphs.  Falls back to a
 * static `animate-pulse` piano when the OS prefers-reduced-motion
 * flag is set (no provider dependency — safe outside React context
 * trees).
 *
 * @param {{ size?: 'sm'|'md'|'lg', text?: string, className?: string }} props
 */
export default function MusicLoader({ size = "md", text, className = "" }) {
  const reducedMotion = useReducedMotion();
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div
      role="status"
      aria-label={text || "Loading"}
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
    >
      <div className={sizeClass}>
        <svg
          viewBox={VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={reducedMotion ? "animate-pulse" : undefined}
        >
          {/* White keys */}
          {WHITE_KEYS.map((key, i) => {
            const anim = KEY_ANIMATIONS[i];
            return reducedMotion || !anim.active ? (
              <rect
                key={`w${i}`}
                x={key.x}
                y={KEY_TOP}
                width={WK_W}
                height={WK_H}
                rx={2}
                fill="rgba(255,255,255,0.3)"
              />
            ) : (
              <motion.g
                key={`w${i}`}
                animate={{
                  y: [0, PRESS_Y, 0],
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: PRESS_DUR,
                  delay: anim.delay,
                  repeat: Infinity,
                  repeatDelay: anim.repeatDelay,
                  ease: BOUNCE_EASE,
                }}
              >
                <rect
                  x={key.x}
                  y={KEY_TOP}
                  width={WK_W}
                  height={WK_H}
                  rx={2}
                  fill="rgba(255,255,255,0.3)"
                />
              </motion.g>
            );
          })}

          {/* Black keys (static) */}
          {BLACK_KEYS.map((key, i) => (
            <rect
              key={`b${i}`}
              x={key.x}
              y={KEY_TOP}
              width={BK_W}
              height={BK_H}
              rx={1.5}
              fill="rgb(30,27,75)"
            />
          ))}

          {/* Floating eighth notes */}
          {!reducedMotion &&
            NOTES.map((note, i) => (
              <motion.g
                key={`n${i}`}
                animate={{
                  y: [0, -28],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  y: {
                    duration: NOTE_DUR,
                    delay: note.delay,
                    repeat: Infinity,
                    repeatDelay: NOTE_REPEAT_DELAY,
                    ease: "easeOut",
                  },
                  opacity: {
                    duration: NOTE_DUR,
                    delay: note.delay,
                    repeat: Infinity,
                    repeatDelay: NOTE_REPEAT_DELAY,
                    times: [0, 0.15, 0.7, 1],
                    ease: "easeOut",
                  },
                }}
              >
                <g
                  transform={`translate(${note.x},${KEY_TOP - 2}) rotate(${note.rot},4,8)`}
                >
                  {/* Notehead */}
                  <ellipse cx="3.5" cy="12" rx="3.5" ry="2.5" fill={note.fill} />
                  {/* Stem */}
                  <rect x="6" y="1" width="1.2" height="11" fill={note.fill} />
                  {/* Flag */}
                  <path
                    d="M7.2,1 C10,0 10,4 8,7"
                    stroke={note.fill}
                    strokeWidth="1.2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              </motion.g>
            ))}
        </svg>
      </div>

      {text && <p className="text-sm text-white/70">{text}</p>}
    </div>
  );
}
