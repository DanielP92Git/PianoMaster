import React from "react";
import { useAccessibility } from "../../contexts/AccessibilityContext";

// Animated wrapper component
const AnimatedWrapper = ({
  children,
  animation = "fadeIn",
  duration = "normal",
  delay = 0,
  trigger = "mount",
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();
  const [isVisible, setIsVisible] = React.useState(trigger === "mount");
  const ref = React.useRef(null);

  const durations = {
    fast: "duration-150",
    normal: "duration-300",
    slow: "duration-500",
    slower: "duration-700",
  };

  const animations = {
    fadeIn: "animate-fadeIn",
    slideUp: "animate-slideUp",
    slideDown: "animate-slideDown",
    slideLeft: "animate-slideLeft",
    slideRight: "animate-slideRight",
    scaleIn: "animate-scaleIn",
    bounce: "animate-bounce",
    pulse: "animate-pulse",
    wiggle: "animate-wiggle",
    float: "animate-float",
    gradient: "animate-gradient",
  };

  // Intersection Observer for scroll-triggered animations
  React.useEffect(() => {
    if (trigger === "scroll" && ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setTimeout(() => setIsVisible(true), delay);
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [trigger, delay]);

  // Manual trigger
  React.useEffect(() => {
    if (trigger === "manual") {
      setTimeout(() => setIsVisible(true), delay);
    }
  }, [trigger, delay]);

  const animationClass = reducedMotion ? "" : animations[animation];
  const durationClass = reducedMotion ? "" : durations[duration];

  return (
    <div
      ref={ref}
      className={`
        transition-all
        ${durationClass}
        ${isVisible ? animationClass : "opacity-0"}
        ${className}
      `}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
};

// Success celebration animation
const SuccessAnimation = ({
  show = false,
  onComplete,
  size = "default",
  variant = "confetti",
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  React.useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show || reducedMotion) return null;

  const sizes = {
    small: "w-16 h-16",
    default: "w-24 h-24",
    large: "w-32 h-32",
  };

  if (variant === "confetti") {
    return (
      <div
        className={`fixed inset-0 pointer-events-none z-50 ${className}`}
        {...props}
      >
        <div className="relative w-full h-full">
          {/* Confetti particles */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`
                absolute w-3 h-3 rounded-kids
                bg-gradient-to-r from-kidsPrimary-400 to-kidsSecondary-400
                animate-bounce
              `}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1000}ms`,
                animationDuration: `${1000 + Math.random() * 1000}ms`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "star") {
    return (
      <div className={`${sizes[size]} mx-auto ${className}`} {...props}>
        <div className="relative w-full h-full">
          <div className="absolute inset-0 text-kidsAccent-500 animate-spin">
            ⭐
          </div>
          <div className="absolute inset-0 text-kidsPrimary-500 animate-pulse">
            ✨
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Interactive hover animation
const HoverAnimation = ({
  children,
  effect = "scale",
  disabled = false,
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  const effects = {
    scale: "hover:scale-105 active:scale-95",
    lift: "hover:-translate-y-1 hover:shadow-lg",
    glow: "hover:shadow-lg hover:shadow-kidsPrimary-500/25",
    tilt: "hover:rotate-1",
    wiggle: "hover:animate-wiggle",
    float: "hover:animate-float",
  };

  const hoverClass = !disabled && !reducedMotion ? effects[effect] : "";

  return (
    <div
      className={`
        transition-all duration-200 transform-gpu
        ${hoverClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

// Staggered list animation
const StaggeredList = ({
  children,
  stagger = 100,
  animation = "fadeIn",
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  if (reducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={className} {...props}>
      {React.Children.map(children, (child, index) => (
        <AnimatedWrapper
          key={index}
          animation={animation}
          delay={index * stagger}
          trigger="mount"
        >
          {child}
        </AnimatedWrapper>
      ))}
    </div>
  );
};

// Parallax scroll effect
const ParallaxElement = ({
  children,
  speed = 0.5,
  className = "",
  ...props
}) => {
  const [offset, setOffset] = React.useState(0);
  const { reducedMotion } = useAccessibility();

  React.useEffect(() => {
    if (reducedMotion) return;

    const handleScroll = () => {
      setOffset(window.pageYOffset * speed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed, reducedMotion]);

  const transform = reducedMotion ? "none" : `translateY(${offset}px)`;

  return (
    <div className={className} style={{ transform }} {...props}>
      {children}
    </div>
  );
};

// Page transition wrapper
const PageTransition = ({
  children,
  direction = "right",
  className = "",
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  const directions = {
    up: "animate-slideUp",
    down: "animate-slideDown",
    left: "animate-slideLeft",
    right: "animate-slideRight",
    fade: "animate-fadeIn",
  };

  const animationClass = reducedMotion
    ? "animate-fadeIn"
    : directions[direction];

  return (
    <div className={`${animationClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Ripple effect component
const RippleEffect = ({
  onClick,
  children,
  color = "rgba(255, 255, 255, 0.6)",
  className = "",
  ...props
}) => {
  const [ripples, setRipples] = React.useState([]);
  const { reducedMotion } = useAccessibility();

  const addRipple = (event) => {
    if (reducedMotion) {
      onClick?.(event);
      return;
    }

    const rippleContainer = event.currentTarget;
    const size = rippleContainer.offsetWidth;
    const pos = rippleContainer.getBoundingClientRect();
    const x = event.clientX - pos.x - size / 2;
    const y = event.clientY - pos.y - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);
    onClick?.(event);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onClick={addRipple}
      {...props}
    >
      {children}

      {!reducedMotion &&
        ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="absolute animate-ping pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: "50%",
              backgroundColor: color,
              transform: "scale(0)",
              animation: "ripple 0.6s linear",
            }}
          />
        ))}
    </div>
  );
};

// Floating notification
const FloatingNotification = ({
  message,
  type = "info",
  position = "top-right",
  duration = 3000,
  onClose,
  className = "",
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { highContrast } = useAccessibility();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const positions = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  const types = {
    success: highContrast
      ? "bg-highContrast-success text-highContrast-bg"
      : "bg-kidsSuccess-500 text-white",
    error: highContrast
      ? "bg-highContrast-error text-highContrast-bg"
      : "bg-kidsError-500 text-white",
    warning: highContrast
      ? "bg-highContrast-warning text-highContrast-bg"
      : "bg-kidsWarning-500 text-white",
    info: highContrast
      ? "bg-highContrast-primary text-highContrast-bg"
      : "bg-kidsPrimary-500 text-white",
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed z-50 px-4 py-3 rounded-kids-lg shadow-lg
        transition-all duration-300 transform
        ${positions[position]}
        ${types[type]}
        ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium font-rounded">{message}</span>
        {onClose && (
          <button
            onClick={() => setIsVisible(false)}
            className="ml-2 hover:opacity-75 transition-opacity"
            aria-label="Close notification"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// SVG Icon Animations
const AnimatedIcon = ({
  icon: IconComponent,
  animation = "none",
  trigger = "hover",
  size = "default",
  className = "",
  ...props
}) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const { reducedMotion } = useAccessibility();

  const sizes = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
  };

  const animations = {
    none: "",
    spin: "animate-spin",
    bounce: "animate-bounce",
    pulse: "animate-pulse",
    wiggle: "animate-wiggle",
    float: "animate-float",
  };

  const triggerAnimation = () => {
    if (reducedMotion) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  };

  const handleInteraction = () => {
    if (trigger === "click" || trigger === "hover") {
      triggerAnimation();
    }
  };

  React.useEffect(() => {
    if (trigger === "mount") {
      triggerAnimation();
    }
  }, [trigger]);

  const animationClass =
    !reducedMotion && (trigger === "always" || isAnimating)
      ? animations[animation]
      : "";

  const eventHandlers =
    trigger === "hover"
      ? { onMouseEnter: handleInteraction }
      : trigger === "click"
        ? { onClick: handleInteraction }
        : {};

  return (
    <IconComponent
      className={`
        ${sizes[size]}
        ${animationClass}
        transition-all duration-200
        ${className}
      `}
      {...eventHandlers}
      {...props}
    />
  );
};

export {
  AnimatedWrapper,
  SuccessAnimation,
  HoverAnimation,
  StaggeredList,
  ParallaxElement,
  PageTransition,
  RippleEffect,
  FloatingNotification,
  AnimatedIcon,
};
