import { Link } from "react-router-dom";
import { SmilePlus } from "lucide-react";
import BackButton from "../components/ui/BackButton";

function AppSettings() {
  return (
    <div>
      <BackButton to="/" name="Dashboard" />
      <Link
        to={"/avatars"}
        className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 hover:bg-white/20 transition-all duration-300"
      >
        <SmilePlus className="w-8 h-8 text-white/80 mr-4" />
        <h3 className="text-xl font-bold text-white">Choose your avatar</h3>
      </Link>
    </div>
  );
}

export default AppSettings;
