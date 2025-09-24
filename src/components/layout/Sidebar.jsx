import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Music2,
  Settings,
  Trophy,
  Mic,
  GraduationCap,
} from "lucide-react";
import AuthButton from "../auth/AuthButton";
import { useUser } from "../../features/authentication/useUser";
import { useNewRecordingsCount } from "../../hooks/useNewRecordingsCount";

export default function Sidebar({ isOpen, onClose, isGameRoute }) {
  const { user, isTeacher, isStudent } = useUser();
  const { newCount } = useNewRecordingsCount(user?.id);

  // Don't render sidebar at all for game routes
  if (isGameRoute) {
    console.log("Sidebar should be hidden - isGameRoute is true");
    return null;
  }

  return (
    <aside
      className={`fixed left-0 lg:left-4 top-20 bottom-4 w-60 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 transition-transform duration-300 lg:translate-x-0 z-40 ${
        isOpen ? "translate-x-4" : "-translate-x-full"
      }`}
    >
      <nav className="h-full flex flex-col p-4">
        <div className="flex-1 space-y-2">
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          {/* Student-specific features */}
          {isStudent && (
            <>
              <NavLink
                to="/practice-modes"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Music2 className="h-5 w-5" />
                <span>Practice Games</span>
              </NavLink>

              <NavLink
                to="/practice-sessions"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-colors relative ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Mic className="h-5 w-5" />
                <span>Recordings</span>
                {newCount > 0 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold text-white bg-red-500 rounded-full px-1">
                    {newCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/achievements"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Trophy className="h-5 w-5" />
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
                `flex font-semibold items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-purple-500 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <GraduationCap className="h-5 w-5" />
              <span>Teacher Dashboard</span>
            </NavLink>
          )}

          {/* Common features for all users */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              `flex font-semibold   items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </NavLink>
        </div>

        <div className="mt-auto pt-4">
          <AuthButton className="w-full group flex items-center justify-center gap-2 p-2 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" />
        </div>
      </nav>
    </aside>
  );
}
