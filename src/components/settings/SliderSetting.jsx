/**
 * Slider setting component with value display
 */
export function SliderSetting({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  disabled = false,
  showValue = true,
  className = "",
  isRTL = false,
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const rtlTransform = isRTL ? { transform: "scaleX(-1)" } : undefined;

  return (
    <div className={`py-3 ${className}`}>
      <div
        className={`flex items-center justify-between mb-2 ${isRTL ? "direction-rtl" : "direction-ltr"}`}
      >
        {/* Label - Always flexible */}
        <div
          className={`flex-1 ${isRTL ? "text-right pl-4" : "text-left pr-4"}`}
        >
          <label className="text-white font-medium text-sm block">
            {label}
          </label>
          {description && (
            <p className="text-white/60 text-xs mt-1">{description}</p>
          )}
        </div>

        {/* Value - Always on the opposite end */}
        {showValue && (
          <div className="text-white font-bold text-sm flex-shrink-0">
            {Math.round(value)}
            {unit}
          </div>
        )}
      </div>
      <div className="relative">
        {/* Track background */}
        <div
          className="h-2 bg-white/20 rounded-full overflow-hidden"
          style={RTLTrackStyle(isRTL)}
        >
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
            style={progressStyle(percentage, isRTL)}
          />
        </div>
        {/* Slider input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label={label}
          style={rtlTransform}
        />
      </div>
    </div>
  );
}

const RTLTrackStyle = (isRTL) =>
  isRTL
    ? {
        transform: "scaleX(-1)",
        transformOrigin: "center",
      }
    : undefined;

const progressStyle = (percentage, isRTL) =>
  isRTL
    ? {
        width: `${percentage}%`,
        transform: "scaleX(-1)",
        transformOrigin: "right center",
      }
    : { width: `${percentage}%` };

export default SliderSetting;
