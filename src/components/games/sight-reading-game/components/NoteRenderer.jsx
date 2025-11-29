import clsx from "clsx";

const NOTE_COLORS = {
  perfect: "fill-emerald-400 stroke-emerald-500",
  good: "fill-emerald-300 stroke-emerald-400",
  okay: "fill-amber-300 stroke-amber-400",
  early: "fill-orange-300 stroke-orange-400",
  late: "fill-orange-300 stroke-orange-400",
  wrong_pitch: "fill-rose-400 stroke-rose-500",
  missed: "fill-slate-400 stroke-slate-500",
  pending: "fill-white stroke-slate-400",
};

const NOTE_GLOW = {
  perfect: "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]",
  good: "drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]",
  okay: "drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]",
  early: "drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]",
  late: "drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]",
  wrong_pitch: "drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]",
  missed: "drop-shadow-[0_0_6px_rgba(148,163,184,0.5)]",
  pending: "drop-shadow-[0_0_6px_rgba(148,163,184,0.4)]",
};

const DURATION_STROKES = {
  whole: 0,
  half: 1,
  quarter: 1,
  eighth: 1,
  sixteenth: 1,
};

export function NoteRenderer({
  note,
  isActive = false,
  status = "pending",
  indicator = "",
  indicatorColor = "#ffffff",
  showLabel = false,
  label = "",
  className,
  style,
  scale = 1,
}) {
  const durationKey = note?.notation ?? "quarter";
  const showStem = DURATION_STROKES[durationKey] !== 0;

  const containerStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "center",
    ...style,
  };

  const noteStyles = clsx(
    NOTE_COLORS[status] || NOTE_COLORS.pending,
    isActive ? NOTE_GLOW[status] : "",
    "transition-all duration-150 ease-out"
  );

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-start pointer-events-none select-none gap-0.5",
        className
      )}
      style={containerStyle}
    >
      {indicator && (
        <div
          className="text-xs font-semibold drop-shadow-sm"
          style={{ color: indicatorColor }}
        >
          {indicator}
        </div>
      )}

      <svg width="42" height="80" viewBox="0 0 42 80" className={noteStyles}>
        <ellipse cx="21" cy="50" rx="17" ry="12" />
        {showStem && <rect x="30" y="0" width="4" height="50" />}
        {note?.isDotted && <circle cx="42" cy="50" r="3" />}
      </svg>

      {showLabel && (
        <div className="text-[10px] font-semibold text-slate-200">{label}</div>
      )}
    </div>
  );
}
