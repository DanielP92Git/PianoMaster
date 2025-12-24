import React, { useEffect, useRef } from "react"; // eslint-disable-line
import { NavLink, useLocation } from "react-router-dom"; // eslint-disable-line
import {
  Home, // eslint-disable-line
  Music2, // eslint-disable-line
  Settings, // eslint-disable-line
  Trophy, // eslint-disable-line
  Mic, // eslint-disable-line
  GraduationCap, // eslint-disable-line
  X, // eslint-disable-line
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AuthButton from "../auth/AuthButton"; // eslint-disable-line
import { useUser } from "../../features/authentication/useUser";
import { useStudentFeedbackNotifications } from "../../hooks/useStudentFeedbackNotifications";

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
          lg:fixed lg:top-[5vh] lg:h-[90vh] lg:w-64 lg:bg-white/10 lg:backdrop-blur-md 
          lg:rounded-2xl lg:shadow-xl lg:border lg:border-white/20
          ${
            isRTL
              ? `right-0 border-l lg:right-4 ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`
              : `left-0 border-r lg:left-4 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`
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

        <nav className="flex-1 flex flex-col p-4 lg:p-6 min-h-0 overflow-hidden">
          <div
            className="space-y-2 lg:space-y-1 overflow-y-auto flex-shrink min-h-0 pb-4"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(156, 163, 175, 0.5) transparent",
            }}
          >
            {/* Student Dashboard - Only show for students */}
            {isStudent && (
              <NavLink
                to="/"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isRTL ? "direction-rtl text-right" : ""
                  } ${
                    isActive
                      ? "bg-indigo-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                  }`
                }
              >
                <Home className="h-5 w-5 flex-shrink-0" />
                <span>{t("navigation.links.studentDashboard")}</span>
              </NavLink>
            )}

            {/* Teacher Dashboard - Only show for teachers */}
            {isTeacher && (
              <NavLink
                to="/teacher"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isRTL ? "direction-rtl text-right" : ""
                  } ${
                    isActive
                      ? "bg-purple-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                  }`
                }
              >
                <GraduationCap className="h-5 w-5 flex-shrink-0" />
                <span>{t("navigation.links.teacherDashboard")}</span>
              </NavLink>
            )}

            {/* Student-specific features */}
            {isStudent && (
              <>
                <NavLink
                  to="/practice-modes"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isRTL ? "direction-rtl text-right" : ""
                    } ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Music2 className="h-5 w-5 flex-shrink-0" />
                  <span>{t("navigation.links.practiceGames")}</span>
                </NavLink>

                <NavLink
                  to="/practice-sessions"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                      isRTL ? "direction-rtl text-right" : ""
                    } ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Mic className="h-5 w-5 flex-shrink-0" />
                  <span>{t("navigation.links.recordings")}</span>
                  {newFeedbackCount > 0 && (
                    <span
                      className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 text-xs font-bold text-white bg-red-500 rounded-full px-1.5 shadow-sm ${isRTL ? "left-3" : "right-3"}`}
                    >
                      {newFeedbackCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/achievements"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isRTL ? "direction-rtl text-right" : ""
                    } ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Trophy className="h-5 w-5 flex-shrink-0" />
                  <span>{t("navigation.links.achievements")}</span>
                </NavLink>
              </>
            )}

            {/* Common features for all users */}
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex font-semibold items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isRTL ? "direction-rtl text-right" : ""
                } ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                }`
              }
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>{t("navigation.links.settings")}</span>
            </NavLink>
          </div>

          {/* Auth Button - Always at bottom */}
          <div className="mt-auto pt-4 border-t border-gray-200 lg:border-white/10 flex-shrink-0">
            <AuthButton />
          </div>
        </nav>
      </aside>
    </>
  );
}
