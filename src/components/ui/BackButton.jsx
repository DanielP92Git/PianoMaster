import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function BackButton({ to, name, styling }) {
  const navigate = useNavigate();
  const { i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(to, { replace: false });
  };

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait relative z-40 cursor-pointer ${styling || ""}`}
      title={name}
      aria-label={name}
    >
      <Arrow className="w-4 h-4" />
    </button>
  );
}

export default BackButton;
