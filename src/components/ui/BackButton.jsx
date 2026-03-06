import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function BackButton({ to, name, styling }) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const { i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavigating(true);
    setTimeout(() => {
      navigate(to, { replace: false });
    }, 0);
  };

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait relative z-40 cursor-pointer ${styling || ""}`}
      title={name}
      aria-label={name}
    >
      {isNavigating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Arrow className="w-4 h-4" />
      )}
    </button>
  );
}

export default BackButton;
