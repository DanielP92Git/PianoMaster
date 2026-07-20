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
 * gradient square rather than BackButton's 36px round glass, so the two do not
 * share markup.
 *
 * Sized identically to TopBarIconButton (37/40/44px) so the bar reads as one
 * set of controls; the gradient and glow are what mark it as the primary
 * action, not extra bulk.
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
      className={`flex h-[37px] w-[37px] flex-shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_6px_20px_rgba(79,70,229,0.6)] transition-transform duration-200 hover:scale-[1.02] active:scale-95 motion-reduce:transform-none lg:h-11 lg:w-11 max-lg:landscape:h-10 max-lg:landscape:w-10 ${className}`}
    >
      <LogOut className="h-[18px] w-[18px] lg:h-5 lg:w-5 rtl:-scale-x-100" />
    </button>
  );
}
