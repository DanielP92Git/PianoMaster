import { Menu, Music2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({ onMenuClick, selectedAvatar }) {
  return (
    <nav className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {selectedAvatar && (
            <img
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
              src={`${selectedAvatar.image_url}`}
              alt=""
            />
          )}
          <Link to={"/"} className="flex items-center">
            <Music2 className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-white">
              PianoMaster
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6 text-white hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

