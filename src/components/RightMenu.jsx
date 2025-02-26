import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";
import Logout from "../features/authentication/Logout";
import Login from "../features/authentication/Login";

function RightMenu({ onToggleMenu, isMenuOpen }) {
  const { isAuthenticated } = useUser();
  return (
    <div
      className={`fixed top-0 right-0 h-full w-1/2 bg-white shadow-lg transform transition-transform duration-300 ${
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 50 }}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-end">
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={onToggleMenu}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <nav className="space-y-2 pt-10 flex-grow">
          <div className="flex flex-col space-y-8">
            <button className="w-full flex items-center justify-center p-3 bg-cyan-700 text-gray-100 rounded-lg hover:bg-cyan-600">
              Membership
            </button>
            <button className="w-full flex items-center justify-center p-3 bg-cyan-700 text-gray-100 rounded-lg hover:bg-cyan-600">
              Contact Us
            </button>
          </div>
        </nav>
        {isAuthenticated ? <Logout /> : <Login />}
      </div>
    </div>
  );
}

export default RightMenu;
