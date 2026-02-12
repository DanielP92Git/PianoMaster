/**
 * Music Symbol Canvas Drawing Functions
 *
 * Drawing functions for custom confetti particles shaped as music notation symbols.
 * Each function receives a CanvasRenderingContext2D and draws a symbol centered at (0, 0).
 *
 * Usage with react-confetti's drawShape prop:
 *   <Confetti drawShape={(ctx) => getRandomMusicShape()(ctx)} />
 *
 * All functions:
 * - Use relative coordinates centered at origin (0, 0)
 * - Scale to approximately 8-12px for confetti particle visibility
 * - Respect ctx.fillStyle and ctx.strokeStyle set by react-confetti (no hardcoded colors)
 * - Call ctx.save() at start and ctx.restore() at end
 */

/**
 * Draws a quarter note: filled oval note head + vertical stem
 * @param {CanvasRenderingContext2D} ctx
 */
export const drawQuarterNote = (ctx) => {
  ctx.save();

  // Note head — slightly tilted ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 2.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Stem — vertical line from right side of note head going up
  ctx.beginPath();
  ctx.moveTo(3, -1);
  ctx.lineTo(3, -11);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
};

/**
 * Draws an eighth note: filled oval note head + stem + flag curve
 * @param {CanvasRenderingContext2D} ctx
 */
export const drawEighthNote = (ctx) => {
  ctx.save();

  // Note head — slightly tilted ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 2.5, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.beginPath();
  ctx.moveTo(3, -1);
  ctx.lineTo(3, -11);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Flag — curved line from top of stem
  ctx.beginPath();
  ctx.moveTo(3, -11);
  ctx.bezierCurveTo(6, -9, 7, -6, 5, -4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
};

/**
 * Draws a simplified treble clef: recognizable S-curve using bezier curves
 * @param {CanvasRenderingContext2D} ctx
 */
export const drawTrebleClef = (ctx) => {
  ctx.save();
  ctx.lineWidth = 1.5;

  // Main S-curve of the clef
  ctx.beginPath();
  // Start from bottom curl
  ctx.moveTo(1, 8);
  // Bottom curl
  ctx.bezierCurveTo(-3, 7, -4, 4, -2, 2);
  // Middle ascending curve
  ctx.bezierCurveTo(0, 0, 3, -2, 3, -5);
  // Top curve
  ctx.bezierCurveTo(3, -8, 0, -10, -2, -8);
  // Descend back
  ctx.bezierCurveTo(-3, -7, -2, -5, 0, -4);
  ctx.stroke();

  // Vertical stem through center
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(0, 7);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Small dot at the bottom
  ctx.beginPath();
  ctx.arc(0, 8, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

/**
 * Draws a sharp symbol: two vertical lines + two angled horizontal lines (#)
 * @param {CanvasRenderingContext2D} ctx
 */
export const drawSharp = (ctx) => {
  ctx.save();
  ctx.lineWidth = 1.5;

  // Two vertical lines
  ctx.beginPath();
  ctx.moveTo(-2, -6);
  ctx.lineTo(-2, 6);
  ctx.moveTo(2, -6);
  ctx.lineTo(2, 6);
  ctx.stroke();

  // Two angled horizontal lines (slightly tilted like a real sharp)
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(5, -3);
  ctx.moveTo(-5, 2);
  ctx.lineTo(5, 1);
  ctx.stroke();

  ctx.restore();
};

/**
 * Draws a flat symbol: vertical line + small curved bump (b shape)
 * @param {CanvasRenderingContext2D} ctx
 */
export const drawFlat = (ctx) => {
  ctx.save();
  ctx.lineWidth = 1.5;

  // Vertical line (tall stem)
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.lineTo(-2, 4);
  ctx.stroke();

  // Curved bump (the round part of the flat)
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.bezierCurveTo(2, -1, 4, 1, 3, 3);
  ctx.bezierCurveTo(2, 5, -1, 5, -2, 4);
  ctx.fill();

  ctx.restore();
};

/**
 * Array of all music shape drawing functions for random selection.
 */
export const MUSIC_SHAPES = [
  drawQuarterNote,
  drawEighthNote,
  drawTrebleClef,
  drawSharp,
  drawFlat,
];

/**
 * Returns a random music shape drawing function.
 * @returns {(ctx: CanvasRenderingContext2D) => void}
 */
export const getRandomMusicShape = () => {
  const index = Math.floor(Math.random() * MUSIC_SHAPES.length);
  return MUSIC_SHAPES[index];
};
