import { useMemo, useState } from "react";
import { SightReadingLayout } from "./SightReadingLayout";
import { FeedbackSummary } from "./FeedbackSummary";
import { VexFlowStaffDisplay } from "./VexFlowStaffDisplay";

const PHASES = ["setup", "display", "count-in", "performance", "feedback"];

// Minimal pattern objects for the real-staff mode. VexFlowStaffDisplay only reads
// easyscoreString / timeSignature / totalDuration / measuresPerPattern for sizing, so these
// are enough to reproduce the geometry of a live session without needing auth.
// Two distinct patterns so `patternChanged` fires when advancing exercise 1 -> 2, which is
// the transition where the notation size inconsistency was reported.
const mockNotes = (pitches) =>
  pitches.map((pitch, index) => ({
    type: "note",
    pitch,
    notation: "quarter",
    clef: "treble",
    index,
  }));

const MOCK_PATTERNS = [
  {
    easyscoreString: "C4/q, D4/q, E4/q, F4/q",
    timeSignature: "4/4",
    totalDuration: 4,
    measuresPerPattern: 1,
    notes: mockNotes(["C4", "D4", "E4", "F4"]),
  },
  {
    easyscoreString: "G4/q, F4/q, E4/q, D4/q",
    timeSignature: "4/4",
    totalDuration: 4,
    measuresPerPattern: 1,
    notes: mockNotes(["G4", "F4", "E4", "D4"]),
  },
];

// Mirrors the reported screenshot: 3 correct + 1 wrong pitch -> 75% / 75%.
// Uses the REAL FeedbackSummary (not a placeholder) so the feedback column's height in
// short-landscape is measurable here rather than only in a live authenticated session.
// noteIndex is required: getNoteColor matches results to noteheads by it, so without it
// every note stays black and any colour assertion here would be vacuous.
const MOCK_PERFORMANCE_RESULTS = [
  {
    noteIndex: 0,
    isCorrect: true,
    timingStatus: "perfect",
    timing: { score: 1 },
  },
  {
    noteIndex: 1,
    isCorrect: true,
    timingStatus: "good",
    timing: { score: 0.8 },
  },
  {
    noteIndex: 2,
    isCorrect: true,
    timingStatus: "okay",
    timing: { score: 0.5 },
  },
  { noteIndex: 3, isCorrect: false, timingStatus: "wrong_pitch", timing: null },
];

const MOCK_SUMMARY_STATS = {
  pitchAccuracy: 75,
  rhythmAccuracy: 75,
  overallScore: 75,
};

export function SightReadingLayoutHarness() {
  const [phase, setPhase] = useState("display");
  const [hasKeyboard, setHasKeyboard] = useState(true);
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  const [isTallStaffLayout, setIsTallStaffLayout] = useState(false);
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [useRealStaff, setUseRealStaff] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  const isFeedbackPhase = phase === "feedback";

  const headerControls = (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-white/90">
      <div className="text-sm font-semibold">Debug: SightReadingLayout</div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="flex items-center gap-2 text-xs font-semibold">
          Phase
          <select
            className="rounded-md bg-white/10 px-2 py-1 text-white outline-none ring-1 ring-white/15"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
          >
            {PHASES.map((p) => (
              <option key={p} value={p} className="text-black">
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={hasKeyboard}
            onChange={(e) => setHasKeyboard(e.target.checked)}
          />
          hasKeyboard
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={isCompactLandscape}
            onChange={(e) => setIsCompactLandscape(e.target.checked)}
          />
          isCompactLandscape
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={isTallStaffLayout}
            onChange={(e) => setIsTallStaffLayout(e.target.checked)}
          />
          isTallStaffLayout
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={showSessionComplete}
            onChange={(e) => setShowSessionComplete(e.target.checked)}
          />
          sessionComplete
        </label>

        <label className="flex items-center gap-2 text-xs font-semibold">
          <input
            type="checkbox"
            checked={useRealStaff}
            onChange={(e) => setUseRealStaff(e.target.checked)}
          />
          realStaff
        </label>

        <button
          type="button"
          data-sr-harness="next-exercise"
          className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold ring-1 ring-white/15"
          onClick={() =>
            setExerciseIndex((i) => (i + 1) % MOCK_PATTERNS.length)
          }
        >
          exercise {exerciseIndex + 1}/{MOCK_PATTERNS.length} →
        </button>
      </div>
    </div>
  );

  const staff = useMemo(() => {
    // Real VexFlow render — used to measure actual staff geometry across exercises.
    if (useRealStaff) {
      return (
        <VexFlowStaffDisplay
          pattern={MOCK_PATTERNS[exerciseIndex]}
          currentNoteIndex={-1}
          clef="treble"
          performanceResults={isFeedbackPhase ? MOCK_PERFORMANCE_RESULTS : []}
          gamePhase={phase}
        />
      );
    }

    const heightClass = isTallStaffLayout ? "min-h-[300px]" : "";
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${heightClass}`}
      >
        <div className="w-full rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 p-4 text-center">
          <div className="text-sm font-bold text-slate-700">
            Staff content (mock) {isTallStaffLayout && "- TALL"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            This box should stretch to fill the staff band.
          </div>
        </div>
      </div>
    );
  }, [isTallStaffLayout, useRealStaff, exerciseIndex, isFeedbackPhase, phase]);

  const guidance = useMemo(() => {
    if (phase === "display") {
      return (
        <button className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
          Start Playing (mock)
        </button>
      );
    }
    if (phase === "count-in") {
      return (
        <div className="text-sm font-semibold text-slate-700">
          Listen to the count-in (mock)
        </div>
      );
    }
    if (phase === "performance") {
      return (
        <div className="text-sm font-semibold text-slate-700">
          Play the highlighted note! (mock)
        </div>
      );
    }
    return null;
  }, [phase]);

  const keyboard = useMemo(() => {
    if (!hasKeyboard) return null;
    return (
      <div className="flex h-full w-full items-center justify-center p-3">
        <div className="h-full w-full rounded-lg bg-white/70 p-3">
          <div className="text-xs font-bold text-slate-600">
            Keyboard content (mock)
          </div>
          <div className="mt-2 grid grid-cols-12 gap-1">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div key={idx} className="h-10 rounded bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }, [hasKeyboard]);

  const feedbackPanel = useMemo(() => {
    if (!isFeedbackPhase) return null;
    return (
      <>
        <FeedbackSummary
          performanceResults={MOCK_PERFORMANCE_RESULTS}
          summaryStats={MOCK_SUMMARY_STATS}
          onTryAgain={() => {}}
          onNextPattern={() => {}}
          onReview={() => {}}
          nextButtonLabel="Next Exercise"
        />
        {showSessionComplete && (
          <div className="mt-4 space-y-3 text-center short-landscape:mt-2 short-landscape:space-y-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 short-landscape:px-3 short-landscape:py-2">
              <p className="text-lg font-bold short-landscape:text-sm">
                Session complete (mock)
              </p>
              <p className="text-sm">Final XP: 75% — 3/4</p>
              <p className="mt-1 text-sm text-slate-600">
                You finished all 4 exercises!
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                Start new session
              </button>
            </div>
          </div>
        )}
      </>
    );
  }, [isFeedbackPhase, showSessionComplete]);

  return (
    <SightReadingLayout
      phase={phase}
      hasKeyboard={hasKeyboard}
      isFeedbackPhase={isFeedbackPhase}
      isCompactLandscape={isCompactLandscape}
      isTallStaffLayout={isTallStaffLayout}
      headerControls={headerControls}
      staff={staff}
      guidance={guidance}
      keyboard={keyboard}
      feedbackPanel={feedbackPanel}
    />
  );
}
