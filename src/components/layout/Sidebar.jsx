import React, { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Music2,
  Settings,
  Trophy,
  Mic,
  GraduationCap,
  X,
} from "lucide-react";
import AuthButton from "../auth/AuthButton";
import { useUser } from "../../features/authentication/useUser";
import { useNewRecordingsCount } from "../../hooks/useNewRecordingsCount";

export default function Sidebar({ isOpen, onClose, isGameRoute }) {
  const { user, isTeacher, isStudent } = useUser();
  const { newCount } = useNewRecordingsCount(user?.id);
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
          fixed left-0 top-0 h-screen w-80 max-w-[85vw] 
          bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 
          transition-transform duration-300 ease-in-out z-50
          lg:fixed lg:left-4 lg:top-[5vh] lg:h-[90vh] lg:w-64 lg:bg-white/10 lg:backdrop-blur-md 
          lg:rounded-2xl lg:shadow-xl lg:border lg:border-white/20 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden h-full">
          <div className="flex-1 space-y-2 overflow-y-auto lg:space-y-1 min-h-0">
            <NavLink
              to="/"
              onClick={onClose}
              className={({ isActive }) =>
                `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                }`
              }
            >
              <Home className="h-5 w-5 flex-shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* Student-specific features */}
            {isStudent && (
              <>
                <NavLink
                  to="/practice-modes"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Music2 className="h-5 w-5 flex-shrink-0" />
                  <span>Practice Games</span>
                </NavLink>

                <NavLink
                  to="/practice-sessions"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Mic className="h-5 w-5 flex-shrink-0" />
                  <span>Recordings</span>
                  {newCount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 text-xs font-bold text-white bg-red-500 rounded-full px-1.5 shadow-sm">
                      {newCount}
                    </span>
                  )}
                </NavLink>

                <NavLink
                  to="/achievements"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-500 text-white shadow-lg"
                        : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                    }`
                  }
                >
                  <Trophy className="h-5 w-5 flex-shrink-0" />
                  <span>Achievements</span>
                </NavLink>
              </>
            )}

            {/* Teacher-specific features */}
            {isTeacher && (
              <NavLink
                to="/teacher"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-purple-500 text-white shadow-lg"
                      : "text-gray-700 hover:bg-purple-50 hover:text-purple-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                  }`
                }
              >
                <GraduationCap className="h-5 w-5 flex-shrink-0" />
                <span>Teacher Dashboard</span>
              </NavLink>
            )}

            {/* Common features for all users */}
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-lg"
                    : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 lg:text-gray-300 lg:hover:bg-white/10 lg:hover:text-white"
                }`
              }
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span>Settings</span>
            </NavLink>
          </div>

          {/* Auth Button */}
          <div className="mt-auto pt-4 border-t border-gray-200 lg:border-white/10 flex-shrink-0">
            <AuthButton />
          </div>
        </nav>
      </aside>
    </>
  );
}
