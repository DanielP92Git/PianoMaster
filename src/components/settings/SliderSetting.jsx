import React from "react";

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
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`py-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <label className="text-white font-medium text-sm block">
            {label}
          </label>
          {description && (
            <p className="text-white/60 text-xs mt-1">{description}</p>
          )}
        </div>
        {showValue && (
          <div className="text-white font-bold text-sm ml-4">
            {Math.round(value)}
            {unit}
          </div>
        )}
      </div>
      <div className="relative">
        {/* Track background */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-200"
            style={{ width: `${percentage}%` }}
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
        />
      </div>
    </div>
  );
}

export default SliderSetting;
