import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

function BackButton({ to, name }) {
  return (
    <Link
      to={to}
      className="flex items-center text-white hover:text-amber-50 mb-2"
    >
      <ChevronLeft className="w-5 h-5 mr-1" />
      {`Back to ${name}`}
    </Link>
  );
}

export default BackButton;
