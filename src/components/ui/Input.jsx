import React from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

const Input = React.forwardRef(
  (
    {
      type = "text",
      label,
      placeholder,
      error,
      success,
      helperText,
      icon,
      iconPosition = "left",
      variant = "default",
      size = "default",
      disabled = false,
      required = false,
      highContrast = false,
      className = "",
      showPasswordToggle = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputType, setInputType] = React.useState(type);

    React.useEffect(() => {
      if (type === "password" && showPasswordToggle) {
        setInputType(showPassword ? "text" : "password");
      }
    }, [type, showPassword, showPasswordToggle]);

    const baseClasses = `
    w-full rounded-kids border-2 font-rounded transition-all duration-300
    focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-opacity-60 min-h-touch
  `;

    const variants = {
      default: highContrast
        ? `bg-highContrast-bg border-highContrast-text text-highContrast-text 
         focus:border-highContrast-primary focus:ring-highContrast-accent`
        : `bg-white/10 border-white/30 text-white placeholder:text-white/60
         focus:border-kidsPrimary-500 focus:ring-kidsPrimary-300 focus:bg-white/20`,

      solid: highContrast
        ? `bg-highContrast-text border-highContrast-text text-highContrast-bg
         focus:border-highContrast-primary focus:ring-highContrast-accent`
        : `bg-white border-gray-300 text-gray-900 placeholder:text-gray-500
         focus:border-kidsPrimary-500 focus:ring-kidsPrimary-300`,
    };

    const sizes = {
      small: "px-3 py-2 text-sm",
      default: "px-4 py-3 text-base",
      large: "px-5 py-4 text-lg",
    };

    const statusClasses = {
      error: highContrast
        ? "border-highContrast-error focus:border-highContrast-error focus:ring-highContrast-error"
        : "border-kidsError-500 focus:border-kidsError-500 focus:ring-kidsError-300",
      success: highContrast
        ? "border-highContrast-success focus:border-highContrast-success focus:ring-highContrast-success"
        : "border-kidsSuccess-500 focus:border-kidsSuccess-500 focus:ring-kidsSuccess-300",
      default: "",
    };

    const status = error ? "error" : success ? "success" : "default";

    const inputId =
      props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-semibold font-rounded mb-2 ${
              highContrast ? "text-highContrast-text" : "text-white/90"
            }`}
          >
            {label}
            {required && (
              <span
                className={
                  highContrast
                    ? "text-highContrast-error"
                    : "text-kidsError-400"
                }
                aria-label="required"
              >
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {/* Left Icon */}
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              {React.cloneElement(icon, {
                className: `w-5 h-5 ${
                  highContrast ? "text-highContrast-text" : "text-white/60"
                }`,
                "aria-hidden": "true",
              })}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                  ? `${inputId}-success`
                  : helperText
                    ? `${inputId}-helper`
                    : undefined
            }
            className={`
            ${baseClasses}
            ${variants[variant]}
            ${sizes[size]}
            ${statusClasses[status]}
            ${icon && iconPosition === "left" ? "pl-11" : ""}
            ${(icon && iconPosition === "right") || (type === "password" && showPasswordToggle) || status !== "default" ? "pr-11" : ""}
            ${className}
          `}
            {...props}
          />

          {/* Right Side Icons */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {/* Status Icon */}
            {status === "error" && (
              <AlertCircle
                className={`w-5 h-5 ${
                  highContrast
                    ? "text-highContrast-error"
                    : "text-kidsError-500"
                }`}
                aria-hidden="true"
              />
            )}
            {status === "success" && (
              <CheckCircle
                className={`w-5 h-5 ${
                  highContrast
                    ? "text-highContrast-success"
                    : "text-kidsSuccess-500"
                }`}
                aria-hidden="true"
              />
            )}

            {/* Password Toggle */}
            {type === "password" && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`p-1 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  highContrast
                    ? "text-highContrast-text focus:ring-highContrast-primary"
                    : "text-white/60 hover:text-white/80 focus:ring-kidsPrimary-300"
                }`}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Right Icon */}
            {icon &&
              iconPosition === "right" &&
              status === "default" &&
              React.cloneElement(icon, {
                className: `w-5 h-5 ${
                  highContrast ? "text-highContrast-text" : "text-white/60"
                }`,
                "aria-hidden": "true",
              })}
          </div>
        </div>

        {/* Helper/Error/Success Text */}
        {(error || success || helperText) && (
          <div className="mt-2">
            {error && (
              <p
                id={`${inputId}-error`}
                className={`text-sm font-rounded flex items-center gap-2 ${
                  highContrast
                    ? "text-highContrast-error"
                    : "text-kidsError-400"
                }`}
                role="alert"
              >
                <AlertCircle
                  className="w-4 h-4 flex-shrink-0"
                  aria-hidden="true"
                />
                {error}
              </p>
            )}

            {success && !error && (
              <p
                id={`${inputId}-success`}
                className={`text-sm font-rounded flex items-center gap-2 ${
                  highContrast
                    ? "text-highContrast-success"
                    : "text-kidsSuccess-400"
                }`}
              >
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0"
                  aria-hidden="true"
                />
                {success}
              </p>
            )}

            {helperText && !error && !success && (
              <p
                id={`${inputId}-helper`}
                className={`text-sm font-rounded ${
                  highContrast ? "text-highContrast-text/80" : "text-white/60"
                }`}
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
