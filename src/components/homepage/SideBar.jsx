import { BarChart2, Music2, Trophy, Users, Settings, Home } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

function Aside({ onPracticeModesClick }) {
  return (
    <aside className="fixed left-4 top-20 bottom-4 w-60 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
      <nav className="h-full flex flex-col p-4">
        <div className="space-y-2">
          <NavLink
            to="/"
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
            onClick={onPracticeModesClick}
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
      </nav>
    </aside>
  );
}

export default Aside;
