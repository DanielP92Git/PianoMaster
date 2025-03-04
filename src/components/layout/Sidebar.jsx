import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Music2, Settings, Trophy } from "lucide-react";
import AuthButton from "../auth/AuthButton";

export default function Sidebar({ isOpen, onClose, isGameRoute }) {

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
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to={"/practice-modes"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Music2 className="h-5 w-5 mr-3" />
            Practice Modes
          </NavLink>

          <NavLink
            to={"/achievements"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Trophy className="h-5 w-5 mr-3" />
            Achievements
          </NavLink>

          <NavLink
            to={"/settings"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </NavLink>
        </div>

        <div className="mt-auto pt-4">
          <AuthButton className="w-full group flex items-center justify-center gap-2 p-2 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" />
        </div>
      </nav>
    </aside>
  );
}
