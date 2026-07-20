import React from "react";

/**
 * TopBarIconButton
 *
 * Square icon button for the game top bar tool cluster. Two visual states:
 * idle glass, and `active` blue-indigo gradient with glow (used by toggles
 * such as the metronome).
 *
 * Sizes step down across breakpoints per the design handoff:
 * 44px desktop / 40px landscape / 37-40px portrait.
 *
 * @param {React.ReactNode} props.icon    - Icon element to render
 * @param {() => void} props.onClick      - Click handler
 * @param {boolean} [props.active]        - Toggle-on styling (gradient + glow)
 * @param {boolean} [props.disabled]      - Disables the button
 * @param {string}  props.title           - Accessible name (also the tooltip)
 * @param {string}  [props.className]     - Extra classes (layout/order only)
 */
export function TopBarIconButton({
  icon,
  onClick,
  active = false,
  disabled = false,
  title,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      // `title` is intentionally kept alongside aria-label: existing tests
      // resolve this button by its accessible name via the title attribute.
      title={title}
      aria-label={title}
      aria-pressed={active}
      // The landscape variant is scoped under max-lg: a bare `landscape:`
      // outranks `lg:` in Tailwind's variant order, and desktop windows are
      // themselves landscape, so it would pin desktop to 40px and the handoff's
      // 44px desktop size would never render.
      className={`flex h-[37px] w-[37px] items-center justify-center rounded-[14px] border transition-all duration-200 lg:h-11 lg:w-11 max-lg:landscape:h-10 max-lg:landscape:w-10 ${
        active
          ? "border-transparent bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.55)]"
          : "border-white/10 bg-white/[0.08] text-white/80 hover:bg-white/15 hover:text-white"
      } ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:scale-[1.02] active:scale-95 motion-reduce:transform-none"
      } ${className}`}
    >
      {icon}
    </button>
  );
}
