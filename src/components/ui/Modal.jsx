import React from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

const Modal = ({
  children,
  isOpen,
  onClose,
  title,
  size = "default",
  variant = "default",
  highContrast = false,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = "",
  overlayClassName = "",
  ...props
}) => {
  const modalRef = React.useRef(null);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && closeOnEscape && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Focus management
  React.useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal
      modalRef.current.focus();
    }
  }, [isOpen]);

  const sizes = {
    small: "max-w-md",
    default: "max-w-lg",
    large: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  const variants = {
    default: highContrast
      ? "bg-highContrast-bg border-2 border-highContrast-text text-highContrast-text"
      : "bg-white/95 backdrop-blur-xl border border-white/20 text-gray-900",

    primary: highContrast
      ? "bg-highContrast-primary border-2 border-highContrast-text text-highContrast-bg"
      : "bg-gradient-to-br from-kidsPrimary-50 to-kidsPrimary-100 border border-kidsPrimary-200 text-kidsPrimary-900",

    fun: "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 text-white",
  };

  const overlayVariant = highContrast
    ? "bg-highContrast-bg/80"
    : "bg-black/50 backdrop-blur-sm";

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayVariant} ${overlayClassName}`}
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizes[size]} max-h-[90vh] overflow-auto
          rounded-kids-xl shadow-2xl transform transition-all duration-300
          animate-fadeIn custom-scrollbar
          ${variants[variant]}
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-current/10">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold font-rounded leading-tight"
              >
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 rounded-kids hover:scale-110 transition-all duration-200
                  focus:outline-none focus:ring-4 min-h-touch min-w-touch
                  ${
                    highContrast
                      ? "text-highContrast-text hover:bg-highContrast-text hover:text-highContrast-bg focus:ring-highContrast-accent"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-kidsPrimary-300"
                  }
                `}
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Modal sub-components for better composition
const ModalHeader = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
);

ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef(
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

ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef(
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

ModalDescription.displayName = "ModalDescription";

const ModalContent = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div ref={ref} className={`${className}`} {...props}>
      {children}
    </div>
  )
);

ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef(
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`mt-6 pt-4 border-t border-current/10 flex items-center justify-end gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

ModalFooter.displayName = "ModalFooter";

// Export all components
export {
  Modal as default,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
};
