import React, { useEffect, useRef } from "react"; // eslint-disable-line
import { NavLink, useLocation } from "react-router-dom"; // eslint-disable-line
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../features/authentication/useUser";
import { useStudentFeedbackNotifications } from "../../hooks/useStudentFeedbackNotifications";
import { getSidebarNavItems } from "./appNavigationConfig";

export default function Sidebar({ isOpen, onClose, isGameRoute }) {
  const { user, isTeacher, isStudent } = useUser();
  const { newFeedbackCount } = useStudentFeedbackNotifications(
    isStudent ? user?.id : null
  );
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const sidebarRef = useRef(null);
  const location = useLocation();
  const prevPathname = useRef(location.pathname);

  const navItems = getSidebarNavItems({ isStudent, isTeacher, newFeedbackCount });
  const mainNavItems = navItems.filter((item) => item.id !== "settings");
  const bottomNavItems = navItems.filter((item) => item.id === "settings");

  const getNavLinkClasses = (theme) => {
    const activeClasses =
      theme === "purple"
        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
        : "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30";

    const inactiveClasses =
      theme === "purple"
        ? "text-gray-700 hover:bg-purple-50 hover:text-purple-700 lg:text-white/80 lg:hover:bg-white/10 lg:hover:text-white"
        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-white/80 lg:hover:bg-white/10 lg:hover:text-white";

    return ({ isActive }) =>
      `flex font-semibold items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 text-lg ${
        isRTL ? "direction-rtl text-right" : ""
      } ${isActive ? activeClasses : inactiveClasses}`;
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (location.pathname !== prevPathname.current && isOpen) {
      onClose();
    }
    prevPathname.current = location.pathname;
  }, [location.pathname, isOpen, onClose]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open on mobile
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && sidebarRef.current) {
      const firstFocusableElement = sidebarRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, [isOpen]);

  // Don't render sidebar at all for game routes
  if (isGameRoute) {
    return null;
  }

  return (
    <>
      {/* Backdrop Overlay - Mobile Only */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 h-screen w-80 max-w-[85vw] safe-area-padding-top
          bg-white/95 backdrop-blur-xl shadow-2xl border-white/20 
          transition-transform duration-300 ease-in-out z-50 flex flex-col
          xl:fixed xl:top-6 xl:bottom-6 xl:h-auto xl:max-h-none xl:w-64 xl:bg-white/10 xl:backdrop-blur-md
          xl:rounded-[2rem] xl:shadow-xl xl:border xl:border-white/20
          ${
            isRTL
              ? `right-0 border-l xl:right-6 ${isOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}`
              : `left-0 border-r xl:left-6 ${isOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"}`
          }
        `}
        aria-label={t("navigation.menuTitle")}
        role="navigation"
      >
        {/* Mobile Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-white/20 lg:hidden flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <h2 className="text-lg font-semibold text-gray-800">
            {t("navigation.menuTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label={t("navigation.closeMenu")}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col p-4 xl:p-6">
          <div className="flex flex-1 flex-col justify-between gap-8">
            <div
              className="space-y-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(156, 163, 175, 0.5) transparent",
              }}
            >
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const hasBadge = item.badgeCount > 0;

                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => {
                      const base = getNavLinkClasses(item.theme)({ isActive });
                      return item.id === "recordings" ? `${base} relative` : base;
                    }}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                    {item.id === "recordings" && hasBadge && (
                      <span
                        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 text-xs font-bold text-white bg-red-500 rounded-full px-1.5 shadow-sm ${
                          isRTL ? "left-4" : "right-4"
                        }`}
                      >
                        {item.badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            <div className="space-y-2">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={onClose}
                    className={getNavLinkClasses(item.theme)}
                  >
                    <Icon className="h-6 w-6 flex-shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
