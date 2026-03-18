import { Fraction } from "vexflow";

/**
 * Returns VexFlow beam groups for a given time signature name.
 * Returns null for time signatures that use VexFlow's default grouping (4/4, 3/4, 2/4).
 *
 * In compound time signatures (6/8, 9/8, 12/8), notes should be beamed in groups of 3
 * eighth notes to reflect the compound beat structure. VexFlow's default beaming groups
 * eighth notes in pairs (2+2+2 for 6/8), which is correct for simple time but wrong for
 * compound time where convention is 3+3 grouping.
 *
 * @param {string} timeSignatureName - e.g. "4/4", "3/4", "6/8"
 * @returns {import("vexflow").Fraction[] | null} - beam groups array, or null to use VexFlow default
 */
export function beamGroupsForTimeSignature(timeSignatureName) {
  switch (timeSignatureName) {
    case "6/8":
      // Compound duple: beam in groups of 3 eighth notes (3+3)
      return [new Fraction(3, 8), new Fraction(3, 8)];
    case "9/8":
      // Compound triple: three groups of 3 eighth notes (3+3+3)
      return [new Fraction(3, 8), new Fraction(3, 8), new Fraction(3, 8)];
    case "12/8":
      // Compound quadruple: four groups of 3 eighth notes (3+3+3+3)
      return [
        new Fraction(3, 8),
        new Fraction(3, 8),
        new Fraction(3, 8),
        new Fraction(3, 8),
      ];
    default:
      // Simple time (4/4, 3/4, 2/4) and unknown: VexFlow default handles correctly
      return null;
  }
}
