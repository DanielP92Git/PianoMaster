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
  isRTL = false,
}) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`}>
      {/* Text label - Always starts from the natural reading direction */}
      <div className={`flex-1 ${isRTL ? "pl-4 text-right" : "pr-4 text-left"}`}>
        <label className="text-white font-medium text-sm block">{label}</label>
        {description && (
          <p className="text-white/60 text-xs mt-1">{description}</p>
        )}
      </div>

      {/* Toggle button - Always on the opposite side (left in RTL, right in LTR) */}
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0
          transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${value ? "bg-indigo-600" : "bg-white/20"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 rounded-full bg-white shadow-lg
            transition-all duration-200 ease-in-out
            ${
              isRTL
                ? value
                  ? "translate-x-[-0.2rem]"
                  : "translate-x-[-1.5rem]"
                : value
                  ? "translate-x-6"
                  : "translate-x-1"
            }
          `}
        />
      </button>
    </div>
  );
}

export default ToggleSetting;
