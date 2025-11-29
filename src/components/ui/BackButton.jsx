import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function BackButton({ to, name, styling, iconOnly = false }) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Set navigating state for immediate visual feedback
    setIsNavigating(true);

    // Use setTimeout to ensure the loading state renders before navigation
    setTimeout(() => {
      navigate(to, { replace: false });
    }, 0);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating}
      className={`flex items-center text-white hover:text-amber-50 relative z-50 cursor-pointer disabled:opacity-50 disabled:cursor-wait ${styling}`}
      title={iconOnly ? `Back to ${name}` : undefined}
    >
      {isNavigating ? (
        <>
          <Loader2 className="w-5 h-5 mr-1 animate-spin" />
          {!iconOnly && "Navigating..."}
        </>
      ) : (
        <>
          <ArrowLeft className={`w-5 h-5 ${iconOnly ? "" : "mr-1"}`} />
          {!iconOnly && `Back to ${name}`}
        </>
      )}
    </button>
  );
}

export default BackButton;
