import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

function BackButton({ to, name }) {
  return (
    <Link
      to={to}
      className="flex items-center text-indigo-600 hover:text-indigo-800 mb-8"
    >
      <ArrowLeft className="h-5 w-5 mr-2" />
      {`Back to ${name}`}
    </Link>
  );
}

export default BackButton;
