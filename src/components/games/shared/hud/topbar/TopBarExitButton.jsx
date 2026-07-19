import React from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * TopBarExitButton
 *
 * Leaves the game. Sits at the reading-end of the bar, where the handoff
 * placed its gradient action button.
 *
 * Uses a LogOut glyph rather than the mock's arrow: the mock's button was a
 * "next question" control, and a forward arrow at the reading-end would read
 * as "advance" rather than "leave". Mirrored in RTL so the door/arrow points
 * outward in both directions.
 *
 * Navigation mirrors BackButton (`to` or history-back) but the shell is a
 * 50px gradient square rather than BackButton's 36px round glass, so the two
 * do not share markup.
 *
 * @param {string} [props.to]      - Route to navigate to; falls back to back()
 * @param {() => void} [props.onClick] - Overrides navigation entirely
 * @param {string} props.label     - Accessible name (also the tooltip)
 */
export function TopBarExitButton({ to, onClick, label, className = "" }) {
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to, { replace: false });
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(79,70,229,0.6)] transition-transform duration-200 hover:scale-[1.02] active:scale-95 motion-reduce:transform-none lg:h-[50px] lg:w-[50px] lg:rounded-[18px] landscape:h-[46px] landscape:w-[46px] ${className}`}
    >
      <LogOut className="h-5 w-5 lg:h-6 lg:w-6 rtl:-scale-x-100" />
    </button>
  );
}
