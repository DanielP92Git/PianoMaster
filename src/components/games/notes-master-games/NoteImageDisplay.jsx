export function NoteImageDisplay({ note, className = "" }) {
  if (!note) return null;

  const ImageComponent = note.ImageComponent;
  const primaryLabel = note.note || note.englishName || note.pitch || "Note";
  const englishLabel =
    note.englishName && note.englishName !== primaryLabel
      ? note.englishName
      : null;
  const pitchLabel =
    note.pitch &&
    note.pitch !== primaryLabel &&
    note.pitch !== englishLabel
      ? note.pitch
      : null;
  const secondaryLabel = englishLabel || pitchLabel;

  const clefHint =
    note.__clef === "bass"
      ? "מפתח פה"
      : note.__clef === "treble"
        ? "מפתח סול"
        : null;

  return (
    <div
      className={`flex h-full w-full items-center justify-center ${className}`}
    >
      {ImageComponent ? (
        <ImageComponent
          className="h-full w-full object-contain"
          aria-label={`${primaryLabel}${clefHint ? ` (${clefHint})` : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center text-center">
          <span className="text-3xl font-semibold text-slate-800">
            {primaryLabel}
          </span>
          {secondaryLabel ? (
            <span className="text-base text-slate-500">{secondaryLabel}</span>
          ) : null}
          {clefHint ? (
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {clefHint}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

