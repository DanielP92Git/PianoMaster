import { Link } from "react-router-dom";
import {SmilePlus } from "lucide-react";

function AppSettings() {
  return (
    <Link
      to={"/avatars"}
      className="flex bg-white w-70 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
    >
        <SmilePlus className="w-8 h-8 text-indigo-600 mr-2" />
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Choose your avatar
      </h3>
    </Link>
  );
}

export default AppSettings;
