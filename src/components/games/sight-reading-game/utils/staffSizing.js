/**
 * Pure size derivations for the VexFlow staff.
 *
 * These live outside the component so the memoized path and the synchronous pre-paint
 * measurement in the render layout-effect share ONE implementation. If the two ever
 * disagreed, the staff would be drawn at one size while the redraw guard compared against
 * another — the exact class of bug this module exists to prevent.
 */

/** Derive the drawing width from a measured container width. */
export function deriveResponsiveWidth(
  containerWidth,
  staffWidth,
  measuresPerPattern
) {
  if (!containerWidth) return staffWidth;
  const padding = 16; // allow for minimal card inner padding
  const availableWidth = Math.max(containerWidth - padding, 320);
  // Don't constrain to container width - allow horizontal scroll for multi-bar patterns.
  // Only use container width for single bar patterns.
  const totalBars = Math.max(1, Number(measuresPerPattern || 1));
  if (totalBars === 1) {
    const maxWidth = 1400;
    return Math.min(availableWidth, maxWidth);
  }
  // For multi-bar patterns the canvas width is recomputed per bar during rendering.
  return availableWidth;
}

/** Derive the drawing height from a measured container height. */
export function deriveResponsiveHeight(containerHeight) {
  const MIN_STAFF_HEIGHT = 180; // Minimum height for ledger lines
  const MAX_STAFF_HEIGHT = 320; // Prevent runaway heights; SVG will scale to slot
  if (!containerHeight) return MIN_STAFF_HEIGHT;
  return Math.max(MIN_STAFF_HEIGHT, Math.min(containerHeight, MAX_STAFF_HEIGHT));
}
