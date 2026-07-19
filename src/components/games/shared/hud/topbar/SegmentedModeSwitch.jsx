import React from "react";

/**
 * SegmentedModeSwitch
 *
 * Two-segment pill switch (e.g. Practice / Test). Exposed as a radiogroup
 * rather than a single toggle button, because both options are visible and
 * independently selectable — that is what a radiogroup describes.
 *
 * @param {string} props.value       - Currently selected option value
 * @param {Array}  props.options     - [{ value, label }], exactly two expected
 * @param {(v: string) => void} props.onChange - Called with the newly picked value
 * @param {boolean} [props.disabled] - Locks the whole group
 * @param {string} props.label       - Accessible name for the group
 */
export function SegmentedModeSwitch({
  value,
  options = [],
  onChange,
  disabled = false,
  label,
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      className={`flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.06] p-1 ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => {
              if (!disabled && !isActive) onChange?.(option.value);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 lg:px-[18px] lg:py-2 lg:text-sm ${
              isActive
                ? "bg-gradient-to-br from-green-500 to-green-600 font-bold text-white shadow-[0_3px_10px_rgba(34,197,94,0.5)]"
                : "text-white/60 hover:text-white/90"
            } ${disabled ? "cursor-not-allowed" : ""}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
