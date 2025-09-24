import React from "react";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import Button from "./Button";
import { Container, Stack, Center } from "./Layout";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Home,
  ArrowLeft,
  Wifi,
  WifiOff,
  Frown,
  Meh,
  AlertOctagon,
} from "lucide-react";

// Error Icon Component with animated feedback
const ErrorIcon = ({
  type = "warning",
  size = "default",
  animated = true,
  highContrast = false,
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  const sizes = {
    small: "w-8 h-8",
    default: "w-12 h-12",
    large: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const icons = {
    warning: AlertTriangle,
    error: XCircle,
    info: AlertCircle,
    critical: AlertOctagon,
    network: WifiOff,
    sad: Frown,
    meh: Meh,
  };

  const colors = {
    warning: highContrast
      ? "text-highContrast-warning"
      : "text-kidsWarning-500",
    error: highContrast ? "text-highContrast-error" : "text-kidsError-500",
    info: highContrast ? "text-highContrast-primary" : "text-kidsPrimary-500",
    critical: highContrast ? "text-highContrast-error" : "text-red-600",
    network: highContrast ? "text-highContrast-text" : "text-gray-500",
    sad: highContrast ? "text-highContrast-warning" : "text-kidsWarning-500",
    meh: highContrast ? "text-highContrast-secondary" : "text-gray-400",
  };

  const IconComponent = icons[type];
  const animationClass = animated && !reducedMotion ? "animate-pulse" : "";

  return (
    <IconComponent
      className={`
        ${sizes[size]}
        ${colors[type]}
        ${animationClass}
        ${className}
      `}
      {...props}
    />
  );
};

// Error Message Component
const ErrorMessage = ({
  title,
  message,
  details,
  highContrast = false,
  className = "",
  ...props
}) => {
  return (
    <div className={`text-center space-y-2 ${className}`} {...props}>
      {title && (
        <h2
          className={`
          text-xl md:text-2xl font-bold font-rounded
          ${highContrast ? "text-highContrast-text" : "text-gray-800"}
        `}
        >
          {title}
        </h2>
      )}

      {message && (
        <p
          className={`
          text-base md:text-lg font-rounded
          ${highContrast ? "text-highContrast-text" : "text-gray-600"}
        `}
        >
          {message}
        </p>
      )}

      {details && (
        <details className="mt-4">
          <summary
            className={`
            cursor-pointer text-sm
            ${highContrast ? "text-highContrast-secondary" : "text-gray-500"}
            hover:underline
          `}
          >
            Show details
          </summary>
          <div
            className={`
            mt-2 p-3 rounded-kids text-xs text-left
            ${
              highContrast
                ? "bg-highContrast-secondary text-highContrast-bg"
                : "bg-gray-100 text-gray-700"
            }
          `}
          >
            {details}
          </div>
        </details>
      )}
    </div>
  );
};

// Action Buttons for Error Recovery
const ErrorActions = ({
  onRetry,
  onGoHome,
  onGoBack,
  showRetry = true,
  showHome = true,
  showBack = false,
  retryText = "Try Again",
  homeText = "Go Home",
  backText = "Go Back",
  customActions = [],
  highContrast = false,
  className = "",
  ...props
}) => {
  const actions = [
    showRetry &&
      onRetry && {
        label: retryText,
        onClick: onRetry,
        icon: RefreshCw,
        variant: "primary",
      },
    showBack &&
      onGoBack && {
        label: backText,
        onClick: onGoBack,
        icon: ArrowLeft,
        variant: "secondary",
      },
    showHome &&
      onGoHome && {
        label: homeText,
        onClick: onGoHome,
        icon: Home,
        variant: "outline",
      },
    ...customActions,
  ].filter(Boolean);

  if (actions.length === 0) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row gap-3 justify-center ${className}`}
      {...props}
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant}
          onClick={action.onClick}
          icon={action.icon}
          highContrast={highContrast}
          className="min-w-[120px]"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

// Main Error State Component
const ErrorState = ({
  type = "error",
  title,
  message,
  details,
  illustration,
  onRetry,
  onGoHome,
  onGoBack,
  showActions = true,
  fullScreen = false,
  className = "",
  children,
  ...props
}) => {
  const { highContrast } = useAccessibility();

  // Predefined error types with child-friendly messages
  const errorTypes = {
    network: {
      title: "Can't Connect to the Internet",
      message:
        "It looks like you're not connected to the internet. Check your connection and try again!",
      icon: "network",
    },
    notFound: {
      title: "Oops! Page Not Found",
      message:
        "We can't find the page you're looking for. Let's get you back to the fun stuff!",
      icon: "sad",
    },
    error: {
      title: "Something Went Wrong",
      message:
        "Don't worry! Sometimes things don't work as expected. Let's try again!",
      icon: "error",
    },
    permission: {
      title: "Access Not Allowed",
      message:
        "You don't have permission to view this page. Let's go somewhere you can play!",
      icon: "warning",
    },
    timeout: {
      title: "Taking Too Long",
      message: "This is taking longer than usual. Let's try again!",
      icon: "meh",
    },
    maintenance: {
      title: "We're Making Things Better!",
      message:
        "We're currently improving the app. Please check back in a little while!",
      icon: "info",
    },
    generic: {
      title: "Oops!",
      message: "Something unexpected happened. Don't worry, we can fix this!",
      icon: "warning",
    },
  };

  const errorConfig = errorTypes[type] || errorTypes.generic;
  const finalTitle = title || errorConfig.title;
  const finalMessage = message || errorConfig.message;

  const containerClasses = `
    ${fullScreen ? "min-h-screen" : "min-h-[400px]"}
    flex items-center justify-center
    ${className}
  `;

  return (
    <div className={containerClasses} {...props}>
      <Container size="md">
        <Center>
          <Stack spacing={6} align="center">
            {/* Error Icon/Illustration */}
            <div className="flex flex-col items-center space-y-4">
              {illustration || (
                <ErrorIcon
                  type={errorConfig.icon}
                  size="xl"
                  highContrast={highContrast}
                />
              )}
            </div>

            {/* Error Message */}
            <ErrorMessage
              title={finalTitle}
              message={finalMessage}
              details={details}
              highContrast={highContrast}
            />

            {/* Custom Content */}
            {children && <div className="text-center">{children}</div>}

            {/* Action Buttons */}
            {showActions && (
              <ErrorActions
                onRetry={onRetry}
                onGoHome={onGoHome}
                onGoBack={onGoBack}
                highContrast={highContrast}
              />
            )}
          </Stack>
        </Center>
      </Container>
    </div>
  );
};

// Inline Error Component for forms and smaller sections
const InlineError = ({
  message,
  icon = true,
  variant = "error",
  size = "default",
  className = "",
  ...props
}) => {
  const { highContrast } = useAccessibility();

  const sizes = {
    small: "text-xs",
    default: "text-sm",
    large: "text-base",
  };

  const variants = {
    error: highContrast ? "text-highContrast-error" : "text-kidsError-600",
    warning: highContrast
      ? "text-highContrast-warning"
      : "text-kidsWarning-600",
    info: highContrast ? "text-highContrast-primary" : "text-kidsPrimary-600",
  };

  return (
    <div className={`flex items-start space-x-2 ${className}`} {...props}>
      {icon && (
        <ErrorIcon
          type={variant}
          size="small"
          animated={false}
          highContrast={highContrast}
          className="mt-0.5 flex-shrink-0"
        />
      )}
      <span className={`${sizes[size]} ${variants[variant]} font-medium`}>
        {message}
      </span>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const {
        fallback: Fallback,
        onReset,
        resetKeys = [],
        ...errorStateProps
      } = this.props;

      // Custom fallback component
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
          />
        );
      }

      // Default error state
      return (
        <ErrorState
          type="error"
          title="Something Went Wrong"
          message="The app encountered an unexpected error. Don't worry, we can get you back on track!"
          details={
            process.env.NODE_ENV === "development"
              ? `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack}`
              : undefined
          }
          onRetry={() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            onReset?.();
          }}
          {...errorStateProps}
        />
      );
    }

    return this.props.children;
  }
}

// Toast Error Component
const ErrorToast = ({
  message,
  type = "error",
  onDismiss,
  autoClose = true,
  duration = 5000,
  className = "",
  ...props
}) => {
  const { highContrast } = useAccessibility();

  React.useEffect(() => {
    if (autoClose && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onDismiss]);

  const variants = {
    error: highContrast
      ? "bg-highContrast-error text-highContrast-bg border-highContrast-text"
      : "bg-kidsError-50 border-kidsError-200 text-kidsError-800",
    warning: highContrast
      ? "bg-highContrast-warning text-highContrast-bg border-highContrast-text"
      : "bg-kidsWarning-50 border-kidsWarning-200 text-kidsWarning-800",
    info: highContrast
      ? "bg-highContrast-primary text-highContrast-bg border-highContrast-text"
      : "bg-kidsPrimary-50 border-kidsPrimary-200 text-kidsPrimary-800",
  };

  return (
    <div
      className={`
        flex items-start space-x-3 p-4 rounded-kids-lg border-2
        ${variants[type]}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <ErrorIcon
        type={type}
        size="small"
        animated={false}
        highContrast={highContrast}
        className="flex-shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium font-rounded">{message}</p>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-current hover:opacity-75 transition-opacity"
          aria-label="Dismiss error"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export {
  ErrorState as default,
  ErrorState,
  ErrorIcon,
  ErrorMessage,
  ErrorActions,
  InlineError,
  ErrorBoundary,
  ErrorToast,
};
