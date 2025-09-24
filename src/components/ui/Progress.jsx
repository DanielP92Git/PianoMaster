import React from "react";

const Progress = React.forwardRef(
  (
    {
      value = 0,
      max = 100,
      variant = "default",
      size = "default",
      showLabel = false,
      label,
      showPercentage = false,
      animated = false,
      highContrast = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variants = {
      default: highContrast
        ? "bg-highContrast-primary"
        : "bg-gradient-to-r from-kidsPrimary-500 to-kidsPrimary-600",

      success: highContrast
        ? "bg-highContrast-success"
        : "bg-gradient-to-r from-kidsSuccess-500 to-kidsSuccess-600",

      warning: highContrast
        ? "bg-highContrast-warning"
        : "bg-gradient-to-r from-kidsWarning-500 to-kidsWarning-600",

      error: highContrast
        ? "bg-highContrast-error"
        : "bg-gradient-to-r from-kidsError-500 to-kidsError-600",

      rainbow:
        "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
    };

    const sizes = {
      small: "h-2",
      default: "h-3",
      large: "h-4",
      xl: "h-6",
    };

    const backgroundVariant = highContrast
      ? "bg-highContrast-bg border border-highContrast-text"
      : "bg-white/20";

    return (
      <div className="w-full">
        {/* Label */}
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-2">
            <span
              className={`text-sm font-semibold font-rounded ${
                highContrast ? "text-highContrast-text" : "text-white/90"
              }`}
            >
              {label || "Progress"}
            </span>
            {showPercentage && (
              <span
                className={`text-sm font-rounded ${
                  highContrast ? "text-highContrast-text" : "text-white/70"
                }`}
              >
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div
          ref={ref}
          className={`
          relative w-full rounded-kids overflow-hidden
          ${backgroundVariant}
          ${sizes[size]}
          ${className}
        `}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || "Progress"}
          {...props}
        >
          <div
            className={`
            h-full rounded-kids transition-all duration-500 ease-out
            ${variants[variant]}
            ${animated ? "animate-pulse" : ""}
          `}
            style={{ width: `${percentage}%` }}
          />

          {/* Shine effect for completed progress */}
          {percentage > 0 && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
              style={{ width: `${percentage}%` }}
            />
          )}
        </div>

        {/* Value display for screen readers */}
        <span className="sr-only">
          {value} out of {max} completed ({Math.round(percentage)}%)
        </span>
      </div>
    );
  }
);

Progress.displayName = "Progress";

// Circular Progress variant
const CircularProgress = React.forwardRef(
  (
    {
      value = 0,
      max = 100,
      size = 120,
      strokeWidth = 8,
      variant = "default",
      showLabel = false,
      label,
      showPercentage = true,
      highContrast = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const variants = {
      default: highContrast ? "#ffff00" : "#3b82f6",
      success: highContrast ? "#00ff00" : "#22c55e",
      warning: highContrast ? "#ffa500" : "#f59e0b",
      error: highContrast ? "#ff0000" : "#ef4444",
    };

    const backgroundStroke = highContrast
      ? "#ffffff"
      : "rgba(255, 255, 255, 0.2)";

    return (
      <div className={`relative ${className}`}>
        <svg
          ref={ref}
          width={size}
          height={size}
          className="transform -rotate-90"
          {...props}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundStroke}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={variants[variant]}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showPercentage && (
              <div
                className={`text-lg font-bold font-rounded ${
                  highContrast ? "text-highContrast-text" : "text-white"
                }`}
              >
                {Math.round(percentage)}%
              </div>
            )}
            {showLabel && label && (
              <div
                className={`text-xs font-rounded ${
                  highContrast ? "text-highContrast-text" : "text-white/70"
                }`}
              >
                {label}
              </div>
            )}
          </div>
        </div>

        {/* Screen reader content */}
        <span className="sr-only">
          {label && `${label}: `}
          {value} out of {max} completed ({Math.round(percentage)}%)
        </span>
      </div>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

export { Progress as default, Progress, CircularProgress };
