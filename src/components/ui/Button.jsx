import React from "react";
import { Loader2 } from "lucide-react";

const Button = React.forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "default",
      disabled = false,
      loading = false,
      icon,
      iconPosition = "left",
      className = "",
      onClick,
      type = "button",
      highContrast = false,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-kids-lg
    transition-all duration-300 transform focus:outline-none focus:ring-4
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95 hover:scale-105
    min-h-touch min-w-touch
  `;

    const variants = {
      primary: highContrast
        ? "bg-highContrast-primary text-highContrast-bg border-2 border-highContrast-text hover:bg-highContrast-secondary focus:ring-highContrast-accent"
        : "bg-gradient-to-r from-kidsPrimary-500 to-kidsPrimary-600 text-white hover:from-kidsPrimary-400 hover:to-kidsPrimary-500 focus:ring-kidsPrimary-300 shadow-lg hover:shadow-xl",

      secondary: highContrast
        ? "bg-highContrast-secondary text-highContrast-bg border-2 border-highContrast-text hover:bg-highContrast-accent focus:ring-highContrast-primary"
        : "bg-gradient-to-r from-kidsSecondary-500 to-kidsSecondary-600 text-white hover:from-kidsSecondary-400 hover:to-kidsSecondary-500 focus:ring-kidsSecondary-300 shadow-lg hover:shadow-xl",

      success: highContrast
        ? "bg-highContrast-success text-highContrast-bg border-2 border-highContrast-text hover:brightness-110 focus:ring-highContrast-text"
        : "bg-gradient-to-r from-kidsSuccess-500 to-kidsSuccess-600 text-white hover:from-kidsSuccess-400 hover:to-kidsSuccess-500 focus:ring-kidsSuccess-300 shadow-lg hover:shadow-xl",

      warning: highContrast
        ? "bg-highContrast-warning text-highContrast-bg border-2 border-highContrast-text hover:brightness-110 focus:ring-highContrast-text"
        : "bg-gradient-to-r from-kidsWarning-500 to-kidsWarning-600 text-white hover:from-kidsWarning-400 hover:to-kidsWarning-500 focus:ring-kidsWarning-300 shadow-lg hover:shadow-xl",

      error: highContrast
        ? "bg-highContrast-error text-highContrast-bg border-2 border-highContrast-text hover:brightness-110 focus:ring-highContrast-text"
        : "bg-gradient-to-r from-kidsError-500 to-kidsError-600 text-white hover:from-kidsError-400 hover:to-kidsError-500 focus:ring-kidsError-300 shadow-lg hover:shadow-xl",

      outline: highContrast
        ? "border-2 border-highContrast-text text-highContrast-text bg-highContrast-bg hover:bg-highContrast-text hover:text-highContrast-bg focus:ring-highContrast-primary"
        : "border-2 border-kidsPrimary-500 text-kidsPrimary-500 bg-transparent hover:bg-kidsPrimary-500 hover:text-white focus:ring-kidsPrimary-300",

      ghost: highContrast
        ? "text-highContrast-text hover:bg-highContrast-text hover:text-highContrast-bg focus:ring-highContrast-primary"
        : "text-kidsPrimary-500 hover:bg-kidsPrimary-100 focus:ring-kidsPrimary-300",
    };

    const sizes = {
      small: "px-4 py-2 text-sm gap-2",
      default: "px-6 py-3 text-base gap-3",
      large: "px-8 py-4 text-lg gap-4",
      xl: "px-10 py-5 text-xl gap-5",
    };

    const handleClick = (e) => {
      if (disabled || loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    const IconComponent = loading ? Loader2 : icon;

    return (
      <button
        ref={ref}
        type={type}
        className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        {...props}
      >
        {IconComponent && iconPosition === "left" && (
          <IconComponent
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        )}

        <span className="font-rounded font-semibold">{children}</span>

        {IconComponent && iconPosition === "right" && (
          <IconComponent
            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
