#!/usr/bin/env node

import { generatePatternData } from "../src/components/games/sight-reading-game/utils/patternBuilder.js";

const timeSignatures = [
  { name: "4/4", beats: 4, subdivision: 16 },
  { name: "3/4", beats: 3, subdivision: 12 },
  { name: "2/4", beats: 2, subdivision: 8 },
];

const difficulties = ["beginner", "intermediate", "advanced"];

const iterations = Number(process.argv[2]) || 10;
const clef = (process.argv[3] || "Treble").trim();

const formatNumber = (value) => Number(value).toFixed(2);

async function verifyPatterns() {
  console.log(
    `Running pattern verification (${iterations} iterations per difficulty/time signature, clef: ${clef})`
  );

  for (const difficulty of difficulties) {
    for (const timeSignature of timeSignatures) {
      const stats = {
        patternCount: 0,
        noteCount: 0,
        restCount: 0,
        uniquePitches: new Set(),
        durations: [],
      };

      for (let i = 0; i < iterations; i += 1) {
        const pattern = await generatePatternData({
          difficulty,
          timeSignature,
          tempo: 80,
          selectedNotes: [],
          clef,
          measuresPerPattern: 1,
        });

        stats.patternCount += 1;
        const playableNotes = pattern.notes.filter(
          (event) => event.type === "note"
        );
        stats.noteCount += playableNotes.length;
        stats.restCount += pattern.notes.filter(
          (event) => event.type === "rest"
        ).length;
        playableNotes.forEach((event) => {
          if (event.pitch) {
            stats.uniquePitches.add(event.pitch);
          }
        });
        stats.durations.push(pattern.totalDuration);
      }

      const averageNotes = stats.noteCount / stats.patternCount;
      const restRatio =
        stats.restCount / (stats.patternCount * timeSignature.beats);
      const durationSpread = `${Math.min(...stats.durations)}-${Math.max(
        ...stats.durations
      )}`;

      console.log(
        [
          `[${difficulty.toUpperCase()} | ${timeSignature.name}]`,
          `avg notes: ${formatNumber(averageNotes)}`,
          `unique pitches: ${stats.uniquePitches.size}`,
          `rest ratio: ${formatNumber(restRatio)}`,
          `duration range(beats): ${durationSpread}`,
        ].join("  •  ")
      );
    }
  }

  console.log("Pattern verification complete.\n");
}

verifyPatterns().catch((error) => {
  console.error("Pattern verification failed:", error);
  process.exit(1);
});
