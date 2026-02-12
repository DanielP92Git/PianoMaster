import { Factory, Renderer } from 'vexflow';

/**
 * Initialize VexFlow renderer with specified dimensions
 * @param {string} containerId - DOM element ID for rendering
 * @param {number} width - Canvas width in pixels
 * @param {number} height - Canvas height in pixels
 * @returns {Object} VexFlow Factory instance
 */
export const initializeVexFlow = (containerId, width, height) => {
  return new Factory({
    renderer: {
      elementId: containerId,
      width,
      height,
      backend: Renderer.Backends.SVG
    }
  });
};

/**
 * Calculate optimal staff width based on pattern duration
 * @param {number} totalDuration - Total duration in beats
 * @param {string} timeSignature - Time signature (e.g., "4/4")
 * @returns {number} Calculated width in pixels
 */
export const calculateOptimalWidth = (totalDuration, timeSignature) => {
  const baseWidth = 500; // Minimum width (clef + time sig + margins)
  const pixelsPerBeat = 90; // Spacing per quarter note
  
  const calculatedWidth = baseWidth + (totalDuration * pixelsPerBeat);
  const maxWidth = 1200; // Responsive max width
  
  return Math.min(calculatedWidth, maxWidth);
};

/**
 * Apply visual highlighting to active note
 * @param {SVGElement} noteElement - SVG element to highlight
 * @param {boolean} isActive - Whether note should be highlighted
 */
export const applyNoteHighlight = (noteElement, isActive) => {
  if (!noteElement) return;
  
  if (isActive) {
    noteElement.setAttribute('class', 'vf-note vf-note-active');
    noteElement.setAttribute('fill', '#8B5CF6'); // Purple highlight
    noteElement.style.animation = 'pulse 0.5s ease-in-out';
  } else {
    noteElement.setAttribute('class', 'vf-note');
    noteElement.setAttribute('fill', '#000000');
    noteElement.style.animation = '';
  }
};

/**
 * Placeholder for pattern-to-EasyScore conversion
 * Will be implemented in Phase 2
 * @param {Array} notationObjects - Array of notation objects
 * @returns {string} EasyScore format string
 */
export const convertToEasyScoreFormat = (notationObjects) => {
  // TODO: Implement in Phase 2
  return '';
};

