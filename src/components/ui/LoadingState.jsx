import React from "react";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { Loader2, Music, Piano, Volume2 } from "lucide-react";

// Spinner component with child-friendly design
const Spinner = ({
  size = "default",
  variant = "primary",
  highContrast = false,
  className = "",
  ...props
}) => {
  const sizes = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const variants = {
    primary: highContrast
      ? "text-highContrast-primary"
      : "text-kidsPrimary-500",
    secondary: highContrast
      ? "text-highContrast-secondary"
      : "text-kidsSecondary-500",
    success: highContrast
      ? "text-highContrast-success"
      : "text-kidsSuccess-500",
    rainbow:
      "text-transparent bg-gradient-to-r from-kidsPrimary-500 via-kidsSecondary-500 to-kidsAccent-500 bg-clip-text",
  };

  return (
    <Loader2
      className={`
        ${sizes[size]} 
        ${variants[variant]} 
        animate-spin
        ${className}
      `}
      {...props}
    />
  );
};

// Musical note loading animation
const MusicalNoteLoader = ({
  highContrast = false,
  className = "",
  ...props
}) => {
  return (
    <div className={`relative ${className}`} {...props}>
      <div className="flex items-center justify-center space-x-2">
        <Music
          className={`w-6 h-6 ${highContrast ? "text-highContrast-primary" : "text-kidsPrimary-500"} animate-bounce`}
          style={{ animationDelay: "0ms" }}
        />
        <Music
          className={`w-6 h-6 ${highContrast ? "text-highContrast-secondary" : "text-kidsSecondary-500"} animate-bounce`}
          style={{ animationDelay: "150ms" }}
        />
        <Music
          className={`w-6 h-6 ${highContrast ? "text-highContrast-primary" : "text-kidsAccent-500"} animate-bounce`}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
};

// Piano keys loading animation
const PianoKeysLoader = ({
  highContrast = false,
  className = "",
  ...props
}) => {
  const keys = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div
      className={`flex items-end justify-center space-x-1 ${className}`}
      {...props}
    >
      {keys.map((key) => (
        <div
          key={key}
          className={`
            w-3 h-8 rounded-t-kids
            ${
              highContrast
                ? "bg-highContrast-primary"
                : "bg-gradient-to-t from-kidsPrimary-400 to-kidsPrimary-600"
            }
            animate-pulse
          `}
          style={{
            animationDelay: `${key * 100}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
};

// Dots loader for simple loading states
const DotsLoader = ({
  size = "default",
  variant = "primary",
  highContrast = false,
  className = "",
  ...props
}) => {
  const sizes = {
    small: "w-2 h-2",
    default: "w-3 h-3",
    large: "w-4 h-4",
  };

  const variants = {
    primary: highContrast ? "bg-highContrast-primary" : "bg-kidsPrimary-500",
    secondary: highContrast
      ? "bg-highContrast-secondary"
      : "bg-kidsSecondary-500",
    rainbow:
      "bg-gradient-to-r from-kidsPrimary-500 via-kidsSecondary-500 to-kidsAccent-500",
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`} {...props}>
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className={`
            ${sizes[size]}
            ${variants[variant]}
            rounded-full
            animate-bounce
          `}
          style={{
            animationDelay: `${dot * 150}ms`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
};

// Pulse loader for content loading
const PulseLoader = ({
  lines = 3,
  width = "full",
  height = "default",
  highContrast = false,
  className = "",
  ...props
}) => {
  const heights = {
    small: "h-3",
    default: "h-4",
    large: "h-6",
  };

  const widths = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/4": "w-1/4",
  };

  return (
    <div className={`space-y-3 ${className}`} {...props}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`
            ${heights[height]}
            ${i === lines - 1 ? widths["3/4"] : widths[width]}
            ${
              highContrast
                ? "bg-highContrast-secondary"
                : "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
            }
            rounded-kids
            animate-pulse
          `}
          style={{
            animationDelay: `${i * 200}ms`,
            animationDuration: "2s",
          }}
        />
      ))}
    </div>
  );
};

// Main Loading State Component
const LoadingState = ({
  type = "spinner",
  size = "default",
  variant = "primary",
  message = "Loading...",
  showMessage = true,
  fullScreen = false,
  overlay = false,
  className = "",
  children,
  ...props
}) => {
  const { highContrast, reducedMotion } = useAccessibility();

  const loaderComponents = {
    spinner: (
      <Spinner size={size} variant={variant} highContrast={highContrast} />
    ),
    musical: <MusicalNoteLoader highContrast={highContrast} />,
    piano: <PianoKeysLoader highContrast={highContrast} />,
    dots: (
      <DotsLoader size={size} variant={variant} highContrast={highContrast} />
    ),
    pulse: <PulseLoader highContrast={highContrast} />,
  };

  // Use simpler loader for reduced motion
  const selectedLoader = reducedMotion
    ? loaderComponents.dots
    : loaderComponents[type];

  const containerClasses = `
    flex flex-col items-center justify-center
    ${fullScreen ? "min-h-screen" : "p-8"}
    ${overlay ? "absolute inset-0 bg-white/80 backdrop-blur-sm z-50" : ""}
    ${className}
  `;

  const content = (
    <div className="flex flex-col items-center space-y-4">
      {selectedLoader}

      {showMessage && (
        <div className="text-center">
          <p
            className={`
            text-lg font-semibold font-rounded
            ${highContrast ? "text-highContrast-text" : "text-gray-700"}
          `}
          >
            {message}
          </p>
          {children && (
            <div
              className={`
              text-sm mt-2
              ${highContrast ? "text-highContrast-text" : "text-gray-500"}
            `}
            >
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (overlay || fullScreen) {
    return (
      <div className={containerClasses} {...props}>
        {content}
      </div>
    );
  }

  return (
    <div className={containerClasses} {...props}>
      {content}
    </div>
  );
};

// Loading Button Component
const LoadingButton = ({
  loading = false,
  children,
  loadingText = "Loading...",
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  return (
    <button
      className={`
        relative overflow-hidden
        ${loading ? "cursor-not-allowed" : "cursor-pointer"}
        ${className}
      `}
      disabled={loading}
      {...props}
    >
      <span
        className={`
        transition-opacity duration-200
        ${loading ? "opacity-0" : "opacity-100"}
      `}
      >
        {children}
      </span>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            {!reducedMotion && <Spinner size="small" />}
            <span>{loadingText}</span>
          </div>
        </div>
      )}
    </button>
  );
};

// Loading Overlay for specific sections
const LoadingOverlay = ({
  loading = false,
  children,
  message = "Loading...",
  type = "spinner",
  className = "",
  ...props
}) => {
  if (!loading) {
    return children;
  }

  return (
    <div className={`relative ${className}`} {...props}>
      {children}
      <LoadingState
        type={type}
        message={message}
        overlay={true}
        showMessage={true}
      />
    </div>
  );
};

// Skeleton loading for content
const SkeletonLoader = ({
  type = "text",
  count = 1,
  className = "",
  ...props
}) => {
  const { highContrast } = useAccessibility();

  const skeletonTypes = {
    text: "h-4 w-full",
    title: "h-6 w-3/4",
    avatar: "h-12 w-12 rounded-full",
    card: "h-32 w-full",
    button: "h-10 w-24",
  };

  return (
    <div className={`space-y-3 ${className}`} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`
            ${skeletonTypes[type]}
            ${
              highContrast
                ? "bg-highContrast-secondary"
                : "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
            }
            rounded-kids
            animate-pulse
          `}
          style={{
            animationDelay: `${i * 100}ms`,
            animationDuration: "2s",
          }}
        />
      ))}
    </div>
  );
};

export {
  LoadingState as default,
  LoadingState,
  Spinner,
  MusicalNoteLoader,
  PianoKeysLoader,
  DotsLoader,
  PulseLoader,
  LoadingButton,
  LoadingOverlay,
  SkeletonLoader,
};
