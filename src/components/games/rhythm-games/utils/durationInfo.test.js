/**
 * durationInfo.test.js
 *
 * Tests for DURATION_INFO lookup table and generateQuestions utility.
 * Covers: duration metadata correctness, question generation, syllable dedup.
 */

import { describe, it, expect } from "vitest";
import {
  DURATION_INFO,
  ALL_DURATION_CODES,
  generateQuestions,
} from "./durationInfo.js";

describe("DURATION_INFO lookup", () => {
  it("has exactly 11 entries", () => {
    expect(Object.keys(DURATION_INFO)).toHaveLength(11);
  });

  it("contains all expected duration codes", () => {
    const expected = ["q", "h", "w", "8", "16", "qd", "hd", "qr", "hr", "wr"];
    expected.forEach((code) => {
      expect(DURATION_INFO[code]).toBeDefined();
    });
  });

  it("each entry has svgFilename, i18nKey, durationUnits, and isRest fields", () => {
    Object.entries(DURATION_INFO).forEach(([code, info]) => {
      expect(info).toHaveProperty("svgFilename");
      expect(info).toHaveProperty("i18nKey");
      expect(info).toHaveProperty("durationUnits");
      expect(info).toHaveProperty("isRest");
      expect(typeof info.svgFilename).toBe("string");
      expect(typeof info.i18nKey).toBe("string");
      expect(typeof info.durationUnits).toBe("number");
      expect(typeof info.isRest).toBe("boolean");
    });
  });

  it("durationUnits values are correct", () => {
    expect(DURATION_INFO["q"].durationUnits).toBe(4);
    expect(DURATION_INFO["h"].durationUnits).toBe(8);
    expect(DURATION_INFO["w"].durationUnits).toBe(16);
    expect(DURATION_INFO["8"].durationUnits).toBe(2);
    expect(DURATION_INFO["16"].durationUnits).toBe(1);
    expect(DURATION_INFO["qd"].durationUnits).toBe(6);
    expect(DURATION_INFO["hd"].durationUnits).toBe(12);
    expect(DURATION_INFO["qr"].durationUnits).toBe(4);
    expect(DURATION_INFO["hr"].durationUnits).toBe(8);
    expect(DURATION_INFO["wr"].durationUnits).toBe(16);
  });

  it("isRest is true only for qr, hr, wr", () => {
    const restCodes = ["qr", "hr", "wr"];
    const noteCodes = ["q", "h", "w", "8", "16", "qd", "hd"];

    restCodes.forEach((code) => {
      expect(DURATION_INFO[code].isRest).toBe(true);
    });

    noteCodes.forEach((code) => {
      expect(DURATION_INFO[code].isRest).toBe(false);
    });
  });
});

describe("ALL_DURATION_CODES", () => {
  it("contains all 11 duration codes", () => {
    expect(ALL_DURATION_CODES).toHaveLength(11);
    expect(ALL_DURATION_CODES).toContain("q");
    expect(ALL_DURATION_CODES).toContain("wr");
    expect(ALL_DURATION_CODES).toContain("8_pair");
  });
});

describe("generateQuestions", () => {
  it("returns 5 questions when questionCount=5 with single pool item", () => {
    const questions = generateQuestions(["q"], ALL_DURATION_CODES, 5);
    expect(questions).toHaveLength(5);
  });

  it('each question has correct="q" and 4 choices when pool=["q"]', () => {
    const questions = generateQuestions(["q"], ALL_DURATION_CODES, 5);
    questions.forEach((q) => {
      expect(q.correct).toBe("q");
      expect(q.choices).toHaveLength(4);
    });
  });

  it('cycles correct answers q,h,q,h,q when pool=["q","h"]', () => {
    const questions = generateQuestions(["q", "h"], ALL_DURATION_CODES, 5);
    expect(questions[0].correct).toBe("q");
    expect(questions[1].correct).toBe("h");
    expect(questions[2].correct).toBe("q");
    expect(questions[3].correct).toBe("h");
    expect(questions[4].correct).toBe("q");
  });

  it("every question choices array contains the correct answer exactly once", () => {
    const questions = generateQuestions(
      ["q", "h", "w"],
      ALL_DURATION_CODES,
      10
    );
    questions.forEach((q) => {
      const correctCount = q.choices.filter((c) => c === q.correct).length;
      expect(correctCount).toBe(1);
    });
  });

  it("no distractor equals the correct answer in any question", () => {
    const questions = generateQuestions(["q"], ALL_DURATION_CODES, 5);
    questions.forEach((q) => {
      const distractors = q.choices.filter((c) => c !== q.correct);
      expect(distractors).toHaveLength(3);
      distractors.forEach((d) => {
        expect(d).not.toBe(q.correct);
      });
    });
  });

  it("with syllable dedup, filters distractors with duplicate syllables", () => {
    // "h" has durationUnits=8, syllable "ta-a"
    // "qd" has durationUnits=6, syllable "ta-a"
    // With dedup, if correct is "h", "qd" should not appear as distractor (same syllable)
    const questions = generateQuestions(["h"], ALL_DURATION_CODES, 5, {
      dedupSyllables: true,
    });
    questions.forEach((q) => {
      expect(q.correct).toBe("h");
      // "qd" should not be in choices (same syllable "ta-a")
      const distractors = q.choices.filter((c) => c !== q.correct);
      distractors.forEach((d) => {
        // Get syllable for correct and distractor
        const correctUnits = DURATION_INFO[q.correct].durationUnits;
        const correctIsRest = DURATION_INFO[q.correct].isRest;
        const dUnits = DURATION_INFO[d].durationUnits;
        const dIsRest = DURATION_INFO[d].isRest;
        // Only check same syllable for non-rest notes
        if (!correctIsRest && !dIsRest) {
          // They should have different syllables (different durationUnits)
          // unless we couldn't find enough distractors
          // At minimum, qd should be excluded when correct=h
          if (d === "qd") {
            // This would mean dedup failed — qd has same syllable as h
            // But only fail if there were enough alternatives
            const availableDistractors = ALL_DURATION_CODES.filter(
              (c) => c !== "h" && c !== "qd"
            );
            if (availableDistractors.length >= 3) {
              expect(d).not.toBe("qd");
            }
          }
        }
      });
    });
  });

  it("returns default 5 questions when questionCount not specified", () => {
    const questions = generateQuestions(["q", "h"], ALL_DURATION_CODES);
    expect(questions).toHaveLength(5);
  });
});
