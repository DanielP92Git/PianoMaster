import React from "react";

/**
 * Toggle switch setting component
 */
export function ToggleSetting({
  label,
  description,
  value,
  onChange,
  disabled = false,
  className = "",
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      <div className="flex-1 pr-4">
        <label className="text-white font-medium text-sm block">{label}</label>
        {description && (
          <p className="text-white/60 text-xs mt-1">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${value ? "bg-indigo-600" : "bg-white/20"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
            transition-transform duration-200 ease-in-out
            ${value ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

export default ToggleSetting;
