import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "../features/authentication/useUser";

function RightMenu({ onToggleMenu, isMenuOpen }) {
  const { isAuthenticated } = useUser();
  return (
    <div
      className={`fixed top-4 right-0 bottom-4 w-80 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl transform transition-transform duration-300 ${
        isMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ zIndex: 50 }}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-end">
          <button
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={onToggleMenu}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 pt-8">
          <div className="flex flex-col space-y-4">
            <button className="w-full flex items-center justify-center p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200">
              Membership
            </button>
            <button className="w-full flex items-center justify-center p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200">
              Contact Us
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default RightMenu;
