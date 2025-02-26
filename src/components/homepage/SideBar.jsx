import { BarChart2, Music2, Trophy, Users, Settings, Home } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import AuthButton from "../auth/AuthButton";

function SideBar({ onPracticeModesClick, isOpen, onToggle }) {
  const handleNavClick = () => {
    // Only close sidebar on mobile
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Overlay for mobile - Only shows when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 lg:left-4 top-20 bottom-4 w-60 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 transition-transform duration-300 lg:translate-x-0 z-40 ${
          isOpen ? "translate-x-4" : "-translate-x-full"
        }`}
      >
        <nav className="h-full flex flex-col p-4">
          <div className="flex-1 space-y-2">
            <NavLink
              to="/"
              onClick={handleNavClick}
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
              onClick={(e) => {
                handleNavClick();
                onPracticeModesClick?.(e);
              }}
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
              onClick={handleNavClick}
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

            {/* <button
              // onClick={onCommunityClick}
              className="flex items-center p-3 text-white/90 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <Users className="h-5 w-5 mr-3" />
              Community
            </button> */}

            {/* <NavLink
              // onClick={onProgressClick}
              to=""
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <BarChart2 className="h-5 w-5 mr-3" />
              Progress
            </NavLink> */}

            <NavLink
              to={"/settings"}
              onClick={handleNavClick}
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
    </>
  );
}

export default SideBar;
