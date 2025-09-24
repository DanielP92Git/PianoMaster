import React from "react";

const Badge = React.forwardRef(
  (
    {
      children,
      variant = "default",
      size = "default",
      shape = "rounded",
      pulse = false,
      dot = false,
      count,
      maxCount = 99,
      position = "top-right",
      highContrast = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const displayCount = count > maxCount ? `${maxCount}+` : count;

    const baseClasses = `
    inline-flex items-center justify-center font-semibold font-rounded
    transition-all duration-300 whitespace-nowrap
  `;

    const variants = {
      default: highContrast
        ? "bg-highContrast-primary text-highContrast-bg border border-highContrast-text"
        : "bg-gradient-to-r from-kidsPrimary-500 to-kidsPrimary-600 text-white",

      secondary: highContrast
        ? "bg-highContrast-secondary text-highContrast-bg border border-highContrast-text"
        : "bg-gradient-to-r from-kidsSecondary-500 to-kidsSecondary-600 text-white",

      success: highContrast
        ? "bg-highContrast-success text-highContrast-bg border border-highContrast-text"
        : "bg-gradient-to-r from-kidsSuccess-500 to-kidsSuccess-600 text-white",

      warning: highContrast
        ? "bg-highContrast-warning text-highContrast-bg border border-highContrast-text"
        : "bg-gradient-to-r from-kidsWarning-500 to-kidsWarning-600 text-white",

      error: highContrast
        ? "bg-highContrast-error text-highContrast-bg border border-highContrast-text"
        : "bg-gradient-to-r from-kidsError-500 to-kidsError-600 text-white",

      outline: highContrast
        ? "border-2 border-highContrast-text text-highContrast-text bg-highContrast-bg"
        : "border-2 border-kidsPrimary-500 text-kidsPrimary-500 bg-transparent",

      ghost: highContrast
        ? "text-highContrast-text bg-highContrast-text/10"
        : "text-kidsPrimary-500 bg-kidsPrimary-100",

      rainbow:
        "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white",
    };

    const sizes = {
      small: dot ? "w-2 h-2" : "px-2 py-0.5 text-xs min-w-[1.25rem] h-5",
      default: dot ? "w-3 h-3" : "px-2.5 py-1 text-sm min-w-[1.5rem] h-6",
      large: dot ? "w-4 h-4" : "px-3 py-1.5 text-base min-w-[2rem] h-8",
    };

    const shapes = {
      rounded: "rounded-kids",
      pill: "rounded-full",
      square: "rounded-none",
    };

    const pulseAnimation = pulse ? "animate-pulse" : "";

    // For count badges
    if (typeof count === "number" && count > 0) {
      return (
        <span
          ref={ref}
          className={`
          ${baseClasses}
          ${variants[variant]}
          ${sizes[size]}
          ${shapes[shape]}
          ${pulseAnimation}
          ${className}
        `}
          {...props}
        >
          {displayCount}
        </span>
      );
    }

    // For dot badges
    if (dot) {
      return (
        <span
          ref={ref}
          className={`
          ${baseClasses}
          ${variants[variant]}
          ${sizes[size]}
          ${shapes[shape]}
          ${pulseAnimation}
          ${className}
        `}
          {...props}
        >
          <span className="sr-only">{children || "Notification"}</span>
        </span>
      );
    }

    // For regular text badges
    return (
      <span
        ref={ref}
        className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${shapes[shape]}
        ${pulseAnimation}
        ${className}
      `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

// BadgeWrapper component for positioning badges relative to other elements
const BadgeWrapper = React.forwardRef(
  (
    {
      children,
      badge,
      position = "top-right",
      offset = true,
      className = "",
      ...props
    },
    ref
  ) => {
    const positions = {
      "top-right": offset ? "-top-1 -right-1" : "top-0 right-0",
      "top-left": offset ? "-top-1 -left-1" : "top-0 left-0",
      "bottom-right": offset ? "-bottom-1 -right-1" : "bottom-0 right-0",
      "bottom-left": offset ? "-bottom-1 -left-1" : "bottom-0 left-0",
      "top-center": offset
        ? "-top-1 left-1/2 transform -translate-x-1/2"
        : "top-0 left-1/2 transform -translate-x-1/2",
      "bottom-center": offset
        ? "-bottom-1 left-1/2 transform -translate-x-1/2"
        : "bottom-0 left-1/2 transform -translate-x-1/2",
    };

    return (
      <div ref={ref} className={`relative inline-flex ${className}`} {...props}>
        {children}
        {badge && (
          <span className={`absolute z-10 ${positions[position]}`}>
            {badge}
          </span>
        )}
      </div>
    );
  }
);

BadgeWrapper.displayName = "BadgeWrapper";

// Achievement Badge component with special styling
const AchievementBadge = React.forwardRef(
  (
    {
      children,
      icon,
      earned = false,
      variant = "success",
      size = "large",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
        relative inline-flex flex-col items-center p-4 rounded-kids-xl
        transition-all duration-300 transform
        ${
          earned
            ? "bg-gradient-to-br from-kidsSuccess-100 to-kidsSuccess-200 scale-100 hover:scale-105"
            : "bg-gray-100 opacity-50 grayscale"
        }
        ${className}
      `}
        {...props}
      >
        {/* Icon */}
        {icon && (
          <div
            className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-3
          ${
            earned
              ? "bg-gradient-to-br from-kidsSuccess-500 to-kidsSuccess-600 text-white shadow-lg"
              : "bg-gray-300 text-gray-500"
          }
        `}
          >
            {React.cloneElement(icon, {
              className: "w-8 h-8",
              "aria-hidden": "true",
            })}
          </div>
        )}

        {/* Badge */}
        <Badge
          variant={earned ? variant : "ghost"}
          size={size}
          className={earned ? "shadow-lg" : ""}
        >
          {children}
        </Badge>

        {/* Sparkle effect for earned achievements */}
        {earned && (
          <div className="absolute -top-1 -right-1 w-4 h-4 text-kidsAccent-400 animate-pulse">
            ✨
          </div>
        )}
      </div>
    );
  }
);

AchievementBadge.displayName = "AchievementBadge";

export { Badge as default, Badge, BadgeWrapper, AchievementBadge };
