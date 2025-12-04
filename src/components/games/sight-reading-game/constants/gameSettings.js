// Import note images for visual representation
import DoImageSvg from "../../../../assets/noteImages/treble-do-middle.svg?react";
import DoHighSvg from "../../../../assets/noteImages/treble-do-second.svg?react";
import DoUltraSvg from "../../../../assets/noteImages/treble-do-third.svg?react";
import ReImageSvg from "../../../../assets/noteImages/treble-re-first.svg?react";
import ReHighSvg from "../../../../assets/noteImages/treble-re-second.svg?react";
import MiImageSvg from "../../../../assets/noteImages/treble-mi-first.svg?react";
import MiHighSvg from "../../../../assets/noteImages/treble-mi-second.svg?react";
import FaImageSvg from "../../../../assets/noteImages/treble-fa-first.svg?react";
import FaHighSvg from "../../../../assets/noteImages/treble-fa-second.svg?react";
import SolImageSvg from "../../../../assets/noteImages/treble-sol-first.svg?react";
import SolLowSvg from "../../../../assets/noteImages/treble-sol-small.svg?react";
import SolHighSvg from "../../../../assets/noteImages/treble-sol-second.svg?react";
import LaImageSvg from "../../../../assets/noteImages/treble-la-first.svg?react";
import LaLowSvg from "../../../../assets/noteImages/treble-la-small.svg?react";
import LaHighSvg from "../../../../assets/noteImages/treble-la-second.svg?react";
import SiImageSvg from "../../../../assets/noteImages/treble-si-first.svg?react";
import SiLowSvg from "../../../../assets/noteImages/treble-si-small.svg?react";
import SiHighSvg from "../../../../assets/noteImages/treble-si-second.svg?react";
import BassDoImageSvg from "../../../../assets/noteImages/bass-do-middle.svg?react";
import BassDoSmallSvg from "../../../../assets/noteImages/bass-do-small.svg?react";
import BassDoBigSvg from "../../../../assets/noteImages/bass-do-big.svg?react";
import BassReImageSvg from "../../../../assets/noteImages/bass-re-small.svg?react";
import BassReBigSvg from "../../../../assets/noteImages/bass-re-big.svg?react";
import BassReFirstSvg from "../../../../assets/noteImages/bass-re-first.svg?react";
import BassMiImageSvg from "../../../../assets/noteImages/bass-mi-small.svg?react";
import BassMiBigSvg from "../../../../assets/noteImages/bass-mi-big.svg?react";
import BassMiFirstSvg from "../../../../assets/noteImages/bass-mi-first.svg?react";
import BassFaImageSvg from "../../../../assets/noteImages/bass-fa-small.svg?react";
import BassFaBigSvg from "../../../../assets/noteImages/bass-fa-big.svg?react";
import BassFaFirstSvg from "../../../../assets/noteImages/bass-fa-first.svg?react";
import BassSolImageSvg from "../../../../assets/noteImages/bass-sol-small.svg?react";
import BassSolBigSvg from "../../../../assets/noteImages/bass-sol-big.svg?react";
import BassLaImageSvg from "../../../../assets/noteImages/bass-la-small.svg?react";
import BassLaBigSvg from "../../../../assets/noteImages/bass-la-big.svg?react";
import BassSiImageSvg from "../../../../assets/noteImages/bass-si-small.svg?react";
import BassSiBigSvg from "../../../../assets/noteImages/bass-si-big.svg?react";
import BassSiContraSvg from "../../../../assets/noteImages/bass-si-contra.svg?react";
import { TREBLE_NOTE_DATA, BASS_NOTE_DATA } from "./noteDefinitions.js";

export const DIFFICULTY_LEVELS = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
};

// Treble clef note definitions with Hebrew names and visual components
const TREBLE_IMAGE_MAP = {
  G3: SolLowSvg,
  A3: LaLowSvg,
  B3: SiLowSvg,
  C4: DoImageSvg,
  D4: ReImageSvg,
  E4: MiImageSvg,
  F4: FaImageSvg,
  G4: SolImageSvg,
  A4: LaImageSvg,
  B4: SiImageSvg,
  C5: DoHighSvg,
  D5: ReHighSvg,
  E5: MiHighSvg,
  F5: FaHighSvg,
  G5: SolHighSvg,
  A5: LaHighSvg,
  B5: SiHighSvg,
  C6: DoUltraSvg,
};

const BASS_IMAGE_MAP = {
  B1: BassSiContraSvg,
  C2: BassDoBigSvg,
  D2: BassReBigSvg,
  E2: BassMiBigSvg,
  F2: BassFaBigSvg,
  G2: BassSolBigSvg,
  A2: BassLaBigSvg,
  B2: BassSiBigSvg,
  C3: BassDoSmallSvg,
  D3: BassReImageSvg,
  E3: BassMiImageSvg,
  F3: BassFaImageSvg,
  G3: BassSolImageSvg,
  A3: BassLaImageSvg,
  B3: BassSiImageSvg,
  C4: BassDoImageSvg,
  D4: BassReFirstSvg,
  E4: BassMiFirstSvg,
  F4: BassFaFirstSvg,
};

export const TREBLE_NOTES = TREBLE_NOTE_DATA.map((note) => ({
  ...note,
  ImageComponent: TREBLE_IMAGE_MAP[note.pitch] || null,
}));

export const BASS_NOTES = BASS_NOTE_DATA.map((note) => ({
  ...note,
  ImageComponent: BASS_IMAGE_MAP[note.pitch] || null,
}));

export const DEFAULT_SETTINGS = {
  clef: "Treble",
  selectedNotes: [],
  difficulty: DIFFICULTY_LEVELS.BEGINNER,
  timeSignature: { name: "4/4", beats: 4, subdivision: 16 },
  tempo: 80,
  measuresPerPattern: 1, // Number of measures to display
  includeRests: true, // Whether to include rests in patterns
};
