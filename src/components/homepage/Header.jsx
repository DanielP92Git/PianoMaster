import { Menu, Music2 } from "lucide-react";
import { Link } from "react-router-dom";

function Header({ onToggleMenu, selectedAvatar }) {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {selectedAvatar && (
            <img
              className="w-16 h-16 rounded-full object-cover ring-2 ring-white"
              src={`${selectedAvatar.image_url}`}
              alt=""
            />
          )}
          <Link to={"/"} className="flex items-center">
            <Music2 className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-gray-800">
              PianoMaster
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <button
              className="p-2 rounded-lg hover:bg-gray-100"
              onClick={onToggleMenu}
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
