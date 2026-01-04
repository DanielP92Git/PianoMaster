import { useMemo, useState } from "react";
import { SightReadingLayout } from "./SightReadingLayout";

const PHASES = ["setup", "display", "count-in", "performance", "feedback"];

export function SightReadingLayoutHarness() {
  const [phase, setPhase] = useState("display");
  const [hasKeyboard, setHasKeyboard] = useState(true);
  const [isCompactLandscape, setIsCompactLandscape] = useState(false);
  const [isTallStaffLayout, setIsTallStaffLayout] = useState(false);

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
      </div>
    </div>
  );

  const staff = useMemo(() => {
    const heightClass = isTallStaffLayout ? "min-h-[300px]" : "";
    return (
      <div className={`flex h-full w-full items-center justify-center ${heightClass}`}>
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
  }, [isTallStaffLayout]);

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
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={idx}
                className="h-10 rounded bg-slate-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [hasKeyboard]);

  const feedbackPanel = useMemo(() => {
    if (!isFeedbackPhase) return null;
    return (
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <div className="text-sm font-bold text-slate-800">
          Feedback panel (mock)
        </div>
        <div className="mt-1 text-xs text-slate-600">
          This should appear in the feedback band below the card.
        </div>
      </div>
    );
  }, [isFeedbackPhase]);

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

