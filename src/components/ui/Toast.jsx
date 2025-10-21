import React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";

const Toast = ({
  children,
  type = "info",
  position = "top-right",
  duration = 5000,
  isVisible,
  onClose,
  title,
  actionButton,
  highContrast = false,
  className = "",
  showCloseButton = true,
  autoClose = true,
  ...props
}) => {
  const toastRef = React.useRef(null);

  // Auto close timer
  React.useEffect(() => {
    if (isVisible && autoClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  // Focus management for accessibility
  React.useEffect(() => {
    if (isVisible && toastRef.current) {
      toastRef.current.focus();
    }
  }, [isVisible]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const IconComponent = icons[type];

  const variants = {
    success: highContrast
      ? "bg-highContrast-success text-highContrast-bg border-highContrast-text"
      : "bg-gradient-to-r from-kidsSuccess-500 to-kidsSuccess-600 text-white",

    error: highContrast
      ? "bg-highContrast-error text-highContrast-bg border-highContrast-text"
      : "bg-gradient-to-r from-kidsError-500 to-kidsError-600 text-white",

    warning: highContrast
      ? "bg-highContrast-warning text-highContrast-bg border-highContrast-text"
      : "bg-gradient-to-r from-kidsWarning-500 to-kidsWarning-600 text-white",

    info: highContrast
      ? "bg-highContrast-primary text-highContrast-bg border-highContrast-text"
      : "bg-gradient-to-r from-kidsPrimary-500 to-kidsPrimary-600 text-white",
  };

  const positions = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  const animations = {
    "top-right": "animate-slideInRight",
    "top-left": "animate-slideInLeft",
    "top-center": "animate-slideInDown",
    "bottom-right": "animate-slideInRight",
    "bottom-left": "animate-slideInLeft",
    "bottom-center": "animate-slideInUp",
  };

  if (!isVisible) return null;

  const toastContent = (
    <div
      ref={toastRef}
      className={`
        fixed z-50 max-w-sm w-full shadow-2xl rounded-kids-lg p-4
        ${variants[type]}
        ${positions[position]}
        ${animations[position]}
        ${highContrast ? "border-2" : ""}
        ${className}
      `}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      {...props}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className="w-5 h-5" aria-hidden="true" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-bold font-rounded mb-1 leading-tight">
              {title}
            </h4>
          )}

          <div className="text-sm font-rounded leading-relaxed">{children}</div>

          {/* Action Button */}
          {actionButton && (
            <div className="mt-3">
              {React.cloneElement(actionButton, {
                className: `text-xs px-3 py-1 rounded-kids font-medium transition-colors ${
                  highContrast
                    ? "bg-highContrast-bg text-highContrast-text hover:bg-highContrast-text hover:text-highContrast-bg"
                    : "bg-white/20 text-white hover:bg-white/30"
                } ${actionButton.props.className || ""}`,
              })}
            </div>
          )}
        </div>

        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className={`
              flex-shrink-0 p-1 rounded-kids transition-all duration-200
              hover:scale-110 focus:outline-none focus:ring-2 
              ${
                highContrast
                  ? "text-highContrast-bg hover:bg-highContrast-bg hover:text-highContrast-text focus:ring-highContrast-bg"
                  : "text-white/80 hover:text-white hover:bg-white/20 focus:ring-white/30"
              }
            `}
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar for auto-close */}
      {autoClose && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-kids-lg overflow-hidden">
          <div
            className="h-full bg-white/40 transition-all ease-linear"
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );

  return createPortal(toastContent, document.body);
};

// Hook for managing multiple toasts
export const useToast = () => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id, isVisible: true };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = React.useCallback(
    (message, options = {}) => {
      return addToast({ type: "success", children: message, ...options });
    },
    [addToast]
  );

  const error = React.useCallback(
    (message, options = {}) => {
      return addToast({ type: "error", children: message, ...options });
    },
    [addToast]
  );

  const warning = React.useCallback(
    (message, options = {}) => {
      return addToast({ type: "warning", children: message, ...options });
    },
    [addToast]
  );

  const info = React.useCallback(
    (message, options = {}) => {
      return addToast({ type: "info", children: message, ...options });
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    clearAll,
    success,
    error,
    warning,
    info,
  };
};

// Toast Container component
export const ToastContainer = ({
  toasts,
  onRemove,
  position = "top-right",
  highContrast = false,
}) => {
  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          position={position}
          highContrast={highContrast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </>
  );
};

// Add keyframes to global CSS (you might want to add this to your index.css)
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInLeft {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInDown {
    from { transform: translate(-50%, -100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  
  @keyframes slideInUp {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

if (!document.head.querySelector("[data-toast-styles]")) {
  style.setAttribute("data-toast-styles", "");
  document.head.appendChild(style);
}

// Special function for points notifications
export const showPointsGain = (points, gameType = "game") => {
  const gameEmoji =
    gameType === "note-recognition"
      ? "🎵"
      : gameType === "rhythm-master"
        ? "🥁"
        : "🎮";

  toast.success(
    <div className="flex items-center gap-3">
      <div className="text-2xl">{gameEmoji}</div>
      <div>
        <div className="font-semibold text-green-600">
          +{points} points earned!
        </div>
        <div className="text-sm text-gray-600">
          Great job on your practice session!
        </div>
      </div>
    </div>,
    {
      duration: 4000,
      style: {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        color: "white",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
      },
      iconTheme: {
        primary: "#10b981",
        secondary: "#ffffff",
      },
    }
  );
};

export default Toast;
