import { ArrowLeft } from "lucide-react";
import { NavLink } from "react-router-dom";

function BackButton({ to, name, styling }) {
  return (
    <NavLink
      to={to}
      className={`flex items-center text-white hover:text-amber-50 ${styling}`}
    >
      <ArrowLeft className="w-5 h-5 mr-1" />
      {`Back to ${name}`}
    </NavLink>
  );
}

export default BackButton;
