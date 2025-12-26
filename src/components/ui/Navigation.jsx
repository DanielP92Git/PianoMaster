import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Home } from "lucide-react";
import Button from "./Button";
import Badge from "./Badge";

// Main Navigation Bar Component
const NavigationBar = React.forwardRef(
  (
    {
      brand,
      items = [],
      actions,
      variant = "default",
      position = "static",
      blur = true,
      highContrast = false,
      className = "",
      onMenuToggle,
      isMobileMenuOpen = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: highContrast
        ? "bg-highContrast-bg border-b-2 border-highContrast-text text-highContrast-text"
        : "bg-white/10 backdrop-blur-md border-b border-white/20 text-white",

      solid: highContrast
        ? "bg-highContrast-text text-highContrast-bg border-b-2 border-highContrast-bg"
        : "bg-white text-gray-900 border-b border-gray-200 shadow-lg",

      transparent: "bg-transparent text-white",
    };

    const positions = {
      static: "relative",
      fixed: "fixed top-0 left-0 right-0 z-50",
      sticky: "sticky top-0 z-50",
    };

    const safeAreaClass = position === "fixed" || position === "sticky" ? "safe-area-padding-top" : "";

    return (
      <nav
        ref={ref}
        className={`
        ${positions[position]}
        ${variants[variant]}
        ${safeAreaClass}
        ${className}
      `}
        {...props}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand/Logo */}
            <div className="flex items-center">{brand}</div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {items.map((item, index) => (
                  <NavigationItem
                    key={index}
                    {...item}
                    highContrast={highContrast}
                  />
                ))}
              </div>
            </div>

            {/* Actions & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              {actions && (
                <div className="hidden md:flex items-center gap-3">
                  {actions}
                </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="small"
                  icon={isMobileMenuOpen ? X : Menu}
                  onClick={onMenuToggle}
                  aria-label="Toggle menu"
                  highContrast={highContrast}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div
            className={`md:hidden ${
              highContrast
                ? "bg-highContrast-bg border-t border-highContrast-text"
                : "bg-white/95 backdrop-blur-md border-t border-white/20"
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {items.map((item, index) => (
                <NavigationItem
                  key={index}
                  {...item}
                  mobile
                  highContrast={highContrast}
                />
              ))}

              {/* Mobile Actions */}
              {actions && (
                <div className="pt-4 pb-3 border-t border-current/10">
                  <div className="flex flex-col gap-3 px-2">{actions}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    );
  }
);

NavigationBar.displayName = "NavigationBar";

// Navigation Item Component
const NavigationItem = React.forwardRef(
  (
    {
      to,
      label,
      icon,
      badge,
      dropdown,
      mobile = false,
      highContrast = false,
      className = "",
      onClick,
      ...props
    },
    ref
  ) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const location = useLocation();
    const isActive = to && location.pathname === to;

    const baseClasses = mobile
      ? `block px-3 py-2 rounded-kids text-base font-medium font-rounded transition-colors ${
          isActive
            ? highContrast
              ? "bg-highContrast-primary text-highContrast-bg"
              : "bg-kidsPrimary-500 text-white"
            : highContrast
              ? "text-highContrast-text hover:bg-highContrast-text hover:text-highContrast-bg"
              : "text-gray-600 hover:text-kidsPrimary-500 hover:bg-kidsPrimary-100"
        }`
      : `px-3 py-2 rounded-kids text-sm font-medium font-rounded transition-colors inline-flex items-center gap-2 ${
          isActive
            ? highContrast
              ? "bg-highContrast-primary text-highContrast-bg"
              : "bg-kidsPrimary-500 text-white"
            : highContrast
              ? "text-highContrast-text hover:bg-highContrast-text hover:text-highContrast-bg"
              : "text-white/80 hover:text-white hover:bg-white/10"
        }`;

    const handleClick = (e) => {
      if (dropdown) {
        e.preventDefault();
        setIsDropdownOpen(!isDropdownOpen);
      }
      onClick?.(e);
    };

    const content = (
      <>
        {icon &&
          React.cloneElement(icon, {
            className: "w-4 h-4",
            "aria-hidden": "true",
          })}
        <span>{label}</span>
        {badge && <Badge {...badge} />}
        {dropdown && (
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        )}
      </>
    );

    if (to && !dropdown) {
      return (
        <NavLink
          ref={ref}
          to={to}
          className={`${baseClasses} ${className}`}
          onClick={handleClick}
          {...props}
        >
          {content}
        </NavLink>
      );
    }

    return (
      <div className="relative">
        <button
          ref={ref}
          className={`${baseClasses} ${className}`}
          onClick={handleClick}
          aria-expanded={dropdown ? isDropdownOpen : undefined}
          {...props}
        >
          {content}
        </button>

        {dropdown && isDropdownOpen && (
          <div
            className={`
          absolute top-full left-0 mt-1 w-48 rounded-kids-lg shadow-lg z-50
          ${
            highContrast
              ? "bg-highContrast-bg border border-highContrast-text"
              : "bg-white border border-gray-200"
          }
        `}
          >
            <div className="py-1">
              {dropdown.map((item, index) => (
                <NavigationItem
                  key={index}
                  {...item}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  highContrast={highContrast}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

NavigationItem.displayName = "NavigationItem";

// Bottom Navigation for Mobile
const BottomNavigation = React.forwardRef(
  (
    {
      items = [],
      highContrast = false,
      className = "",
      showLabels = true,
      hideAbove = "md:hidden",
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        className={`
        fixed bottom-0 left-0 right-0 z-50 ${hideAbove} safe-area-padding-bottom
        ${highContrast ? "bg-highContrast-bg border-t-2 border-highContrast-text" : ""}
        ${!highContrast ? "border-t border-white/10 bg-gradient-to-t from-indigo-950/85 via-purple-950/70 to-violet-950/40 backdrop-blur-xl" : ""}
        ${!highContrast ? "shadow-[0_-12px_40px_rgba(0,0,0,0.45)]" : ""}
        ${className}
      `}
        {...props}
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-3">
          {items.map((item, index) => {
            const badgePositionClass =
              item.badgePosition === "top-left"
                ? "-top-1 -left-1"
                : "-top-1 -right-1";

            return (
              <NavLink
                key={index}
                to={item.to}
                aria-label={item.ariaLabel || item.label}
                className={({ isActive }) => `
                  group relative flex min-w-[60px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2
                  font-rounded transition-all duration-200
                  ${
                    isActive
                      ? highContrast
                        ? "text-highContrast-primary"
                        : "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                      : highContrast
                        ? "text-highContrast-text"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                {item.icon &&
                  React.cloneElement(item.icon, {
                    className: `h-6 w-6 transition-transform duration-200 group-hover:scale-[1.06] ${
                      showLabels ? "mb-0.5" : ""
                    }`,
                    "aria-hidden": "true",
                  })}
                {showLabels ? (
                  <span className="text-[11px] font-semibold leading-none">
                    {item.label}
                  </span>
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
                {item.badge && (
                  <div className={`absolute ${badgePositionClass}`}>
                    <Badge {...item.badge} size="small" />
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";

// Breadcrumb Navigation
const Breadcrumb = React.forwardRef(
  (
    {
      items = [],
      separator = "/",
      highContrast = false,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        className={`${className}`}
        aria-label="Breadcrumb"
        {...props}
      >
        <ol className="flex items-center space-x-2 text-sm font-rounded">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span
                  className={`mx-2 ${
                    highContrast ? "text-highContrast-text" : "text-white/60"
                  }`}
                >
                  {separator}
                </span>
              )}

              {item.to ? (
                <NavLink
                  to={item.to}
                  className={`hover:underline transition-colors ${
                    highContrast
                      ? "text-highContrast-text hover:text-highContrast-primary"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.icon &&
                    React.cloneElement(item.icon, {
                      className: "w-4 h-4 mr-1 inline",
                      "aria-hidden": "true",
                    })}
                  {item.label}
                </NavLink>
              ) : (
                <span
                  className={`${
                    highContrast ? "text-highContrast-text" : "text-white"
                  } font-semibold`}
                >
                  {item.icon &&
                    React.cloneElement(item.icon, {
                      className: "w-4 h-4 mr-1 inline",
                      "aria-hidden": "true",
                    })}
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumb.displayName = "Breadcrumb";

// Navigation Hook for managing mobile menu state
export const useNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = React.useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Close mobile menu on route change
  const location = useLocation();
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return {
    isMobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
  };
};

export {
  NavigationBar as default,
  NavigationBar,
  NavigationItem,
  BottomNavigation,
  Breadcrumb,
};
