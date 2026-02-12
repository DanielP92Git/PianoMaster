// Y-coordinates for notes on the treble staff
// Based on treble-staff.svg viewBox="0 0 5669 1417"
// Staff line spacing: approximately 95 units between lines
export const STAFF_LINE_SPACING = 95; // Space between two staff lines (or two spaces)
const HALF_SPACE = STAFF_LINE_SPACING / 2; // 47.5 units - half of staff space

export const STAFF_POSITIONS = {
  // Lines (from bottom to top)
  E4: { y: 1040, type: "line", ledger: false }, // Bottom staff line
  G4: { y: 945, type: "line", ledger: false }, // 2nd staff line
  B4: { y: 850, type: "line", ledger: false }, // 3rd staff line (middle)
  D5: { y: 755, type: "line", ledger: false }, // 4th staff line
  F5: { y: 660, type: "line", ledger: false }, // Top staff line

  // Spaces (from bottom to top)
  F4: { y: 1040 - HALF_SPACE, type: "space", ledger: false }, // 992.5
  A4: { y: 945 - HALF_SPACE, type: "space", ledger: false }, // 897.5
  C5: { y: 850 - HALF_SPACE, type: "space", ledger: false }, // 802.5
  E5: { y: 755 - HALF_SPACE, type: "space", ledger: false }, // 707.5

  // Ledger lines (below staff) - maintaining consistent spacing
  D4: { y: 1040 + HALF_SPACE, type: "space", ledger: true }, // 1087.5 (space below E4)
  C4: { y: 1040 + STAFF_LINE_SPACING, type: "line", ledger: true }, // 1135 (ledger line)
  B3: {
    y: 1040 + STAFF_LINE_SPACING + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1182.5
  A3: { y: 1040 + STAFF_LINE_SPACING * 2, type: "line", ledger: true }, // 1230 (2nd ledger line)
  G3: {
    y: 1040 + STAFF_LINE_SPACING * 2 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1277.5
  F3: {
    y: 1040 + STAFF_LINE_SPACING * 3,
    type: "line",
    ledger: true,
  }, // 1325
  E3: {
    y: 1040 + STAFF_LINE_SPACING * 3 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1372.5
  D3: {
    y: 1040 + STAFF_LINE_SPACING * 4,
    type: "line",
    ledger: true,
  }, // 1420
  C3: {
    y: 1040 + STAFF_LINE_SPACING * 4 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1467.5
  B2: {
    y: 1040 + STAFF_LINE_SPACING * 5,
    type: "line",
    ledger: true,
  }, // 1515
  A2: {
    y: 1040 + STAFF_LINE_SPACING * 5 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1562.5
  G2: {
    y: 1040 + STAFF_LINE_SPACING * 6,
    type: "line",
    ledger: true,
  }, // 1610
  F2: {
    y: 1040 + STAFF_LINE_SPACING * 6 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1657.5
  E2: {
    y: 1040 + STAFF_LINE_SPACING * 7,
    type: "line",
    ledger: true,
  }, // 1705
  D2: {
    y: 1040 + STAFF_LINE_SPACING * 7 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1752.5
  C2: {
    y: 1040 + STAFF_LINE_SPACING * 8,
    type: "line",
    ledger: true,
  }, // 1800
  B1: {
    y: 1040 + STAFF_LINE_SPACING * 8 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1847.5

  // Ledger lines (above staff) - maintaining consistent spacing
  G5: { y: 660 - HALF_SPACE, type: "space", ledger: true }, // 612.5 (space above F5)
  A5: { y: 660 - STAFF_LINE_SPACING, type: "line", ledger: true }, // 565 (ledger line)
  B5: { y: 660 - STAFF_LINE_SPACING - HALF_SPACE, type: "space", ledger: true }, // 517.5
  C6: { y: 660 - STAFF_LINE_SPACING * 2, type: "line", ledger: true }, // 470
};

// Y-coordinates for notes on the bass staff
// Based on bass-staff.svg (same viewBox dimensions)
// Bass clef staff lines (from bottom to top): G2, B2, D3, F3, A3
export const BASS_STAFF_POSITIONS = {
  // Lines (from bottom to top)
  G2: { y: 1040, type: "line", ledger: false }, // Bottom staff line
  B2: { y: 945, type: "line", ledger: false }, // 2nd staff line
  D3: { y: 850, type: "line", ledger: false }, // 3rd staff line (middle)
  F3: { y: 755, type: "line", ledger: false }, // 4th staff line
  A3: { y: 660, type: "line", ledger: false }, // Top staff line

  // Spaces (from bottom to top)
  A2: { y: 1040 - HALF_SPACE, type: "space", ledger: false }, // 992.5
  C3: { y: 945 - HALF_SPACE, type: "space", ledger: false }, // 897.5 (between B2 and D3)
  E3: { y: 850 - HALF_SPACE, type: "space", ledger: false }, // 802.5 (between D3 and F3)
  G3: { y: 755 - HALF_SPACE, type: "space", ledger: false }, // 707.5 (between F3 and A3)
  B3: { y: 660 - HALF_SPACE, type: "space", ledger: true }, // 612.5 (space above A3)

  // Ledger lines (below staff) - maintaining consistent spacing
  F2: { y: 1040 + HALF_SPACE, type: "space", ledger: true }, // 1087.5 (space below G2)
  E2: { y: 1040 + STAFF_LINE_SPACING, type: "line", ledger: true }, // 1135 (ledger line)
  D2: {
    y: 1040 + STAFF_LINE_SPACING + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1182.5
  C2: { y: 1040 + STAFF_LINE_SPACING * 2, type: "line", ledger: true }, // 1230 (2nd ledger line)
  B1: {
    y: 1040 + STAFF_LINE_SPACING * 2 + HALF_SPACE,
    type: "space",
    ledger: true,
  }, // 1277.5

  // Ledger lines (above staff) - maintaining consistent spacing
  C4: { y: 660 - HALF_SPACE, type: "space", ledger: true }, // 612.5 (space above A3)
  D4: { y: 660 - STAFF_LINE_SPACING, type: "line", ledger: true }, // 565 (ledger line)
  E4: { y: 660 - STAFF_LINE_SPACING - HALF_SPACE, type: "space", ledger: true }, // 517.5
  F4: { y: 660 - STAFF_LINE_SPACING * 2, type: "line", ledger: true }, // 470
};

// Helper function to get staff position based on clef
export function getStaffPosition(pitch, clef = "Treble") {
  const isBass = clef.toLowerCase() === "bass";
  const positions = isBass ? BASS_STAFF_POSITIONS : STAFF_POSITIONS;
  return positions[pitch] || null;
}

// Note head dimensions (based on staff space)
// Note head should fit within one staff space
export const NOTE_HEAD = {
  width: STAFF_LINE_SPACING * 0.95, // Slightly less than space height
  height: STAFF_LINE_SPACING * 0.7, // Narrower for proper note head shape
  rotation: -20, // Standard note head rotation in degrees
};

// Note stem dimensions
export const NOTE_STEM = {
  width: STAFF_LINE_SPACING * 0.08, // Thin stem
  height: STAFF_LINE_SPACING * 3.5, // Standard stem height (3.5 spaces)
  offsetX: NOTE_HEAD.width * 0.45, // Stem position on right side of note head
};

// Note frequency mappings (A4 = 440Hz)
export const NOTE_FREQUENCIES = {
  B1: 61.74,
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
};

// X-coordinate spacing for notes
export const NOTE_SPACING = {
  startX: 1200, // Start position after clef and time signature
  spacing: 400, // Horizontal space between notes
};
