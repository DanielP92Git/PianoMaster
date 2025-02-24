import { BarChart2, Music2, Trophy, Users, Settings } from "lucide-react";

import { Link } from "react-router-dom";

function Aside({ onPracticeModesClick }) {
  return (
    <aside className="w-64 bg-white h-screen shadow-lg fixed left-0 top-16">
      <div className="p-4">
        <nav className="space-y-2">
          <Link
            to={"/practice-modes"}
            onClick={onPracticeModesClick}
            className="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-indigo-50"
          >
            <Music2 className="h-5 w-5 mr-3" />
            Practice Modes
          </Link>
          <Link
            to={"/achievements"}
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-indigo-50"
          >
            <Trophy className="h-5 w-5 mr-3" />
            Achievements
          </Link>

          {/* <button
            // onClick={onCommunityClick}
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-indigo-50"
          >
            <Users className="h-5 w-5 mr-3" />
            Community
          </button> */}
          <button
            // onClick={onProgressClick}
            href="#"
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-indigo-50"
          >
            <BarChart2 className="h-5 w-5 mr-3" />
            Progress
          </button>
          <Link
            to={"/settings"}
            className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-indigo-50"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Link>
        </nav>
      </div>
    </aside>
  );
}

export default Aside;
