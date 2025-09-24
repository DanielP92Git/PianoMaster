import React from "react";

const Card = React.forwardRef(
  (
    {
      children,
      variant = "default",
      className = "",
      highContrast = false,
      hover = false,
      padding = "default",
      ...props
    },
    ref
  ) => {
    const baseClasses = `
    rounded-kids-xl border transition-all duration-300
    focus:outline-none focus-visible:ring-4
  `;

    const variants = {
      default: highContrast
        ? "bg-highContrast-bg border-highContrast-text text-highContrast-text"
        : "bg-white/10 backdrop-blur-md border-white/20 text-white",

      solid: highContrast
        ? "bg-highContrast-text text-highContrast-bg border-highContrast-text"
        : "bg-white text-gray-900 border-gray-200 shadow-lg",

      primary: highContrast
        ? "bg-highContrast-primary text-highContrast-bg border-highContrast-text"
        : "bg-gradient-to-br from-kidsPrimary-50 to-kidsPrimary-100 border-kidsPrimary-200 text-kidsPrimary-900",

      secondary: highContrast
        ? "bg-highContrast-secondary text-highContrast-bg border-highContrast-text"
        : "bg-gradient-to-br from-kidsSecondary-50 to-kidsSecondary-100 border-kidsSecondary-200 text-kidsSecondary-900",

      success: highContrast
        ? "bg-highContrast-success text-highContrast-bg border-highContrast-text"
        : "bg-gradient-to-br from-kidsSuccess-50 to-kidsSuccess-100 border-kidsSuccess-200 text-kidsSuccess-900",

      warning: highContrast
        ? "bg-highContrast-warning text-highContrast-bg border-highContrast-text"
        : "bg-gradient-to-br from-kidsWarning-50 to-kidsWarning-100 border-kidsWarning-200 text-kidsWarning-900",

      error: highContrast
        ? "bg-highContrast-error text-highContrast-bg border-highContrast-text"
        : "bg-gradient-to-br from-kidsError-50 to-kidsError-100 border-kidsError-200 text-kidsError-900",
    };

    const hoverEffects = hover
      ? highContrast
        ? "hover:brightness-110 hover:scale-[1.02] cursor-pointer"
        : "hover:scale-[1.02] hover:shadow-xl cursor-pointer"
      : "";

    const paddingClasses = {
      none: "",
      small: "p-4",
      default: "p-6",
      large: "p-8",
      xl: "p-10",
    };

    return (
      <div
        ref={ref}
        className={`
        ${baseClasses}
        ${variants[variant]}
        ${hoverEffects}
        ${paddingClasses[padding]}
        ${className}
      `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Sub-components for better composition
const CardHeader = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(
  ({ children, className = "", as: Component = "h3", ...props }, ref) => (
    <Component
      ref={ref}
      className={`text-xl font-bold font-rounded leading-tight ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
);

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm opacity-80 font-rounded leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-4 pt-4 border-t border-current/10 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

// Export all components
export {
  Card as default,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
