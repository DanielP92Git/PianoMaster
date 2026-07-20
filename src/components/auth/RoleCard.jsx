import { CheckCircle2 } from "lucide-react";

/**
 * A selectable Student/Teacher row (design screen 5).
 *
 * Shared by the signup wizard's role step and the standalone role-selection
 * interrupt that OAuth users without a profile land on.
 *
 * The label and description stay separate text nodes so they can be queried
 * independently.
 */
function RoleCard({
  selected,
  onClick,
  tileClassName,
  emoji,
  label,
  description,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-[16px] border-2 p-4 text-start transition-all duration-200 ${
        selected
          ? "border-[#60a5fa] bg-white/[0.18]"
          : "border-white/[0.18] bg-white/[0.12] hover:bg-white/[0.16]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br text-[22px] ${tileClassName}`}
          aria-hidden="true"
        >
          {emoji}
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-white">
            {label}
          </span>
          <span className="block text-[13px] text-white/60">{description}</span>
        </div>
        {selected ? (
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-[#60a5fa]"
            aria-hidden="true"
          />
        ) : (
          <span
            className="h-5 w-5 shrink-0 rounded-full border-2 border-white/30"
            aria-hidden="true"
          />
        )}
      </div>
    </button>
  );
}

export default RoleCard;
