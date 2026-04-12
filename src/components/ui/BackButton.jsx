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
    if (to) {
      navigate(to, { replace: false });
    } else {
      navigate(-1);
    }
  };

  const Arrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <button
      onClick={handleClick}
      className={`relative z-40 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-wait disabled:opacity-50 ${styling || ""}`}
      title={name}
      aria-label={name}
    >
      <Arrow className="h-4 w-4" />
    </button>
  );
}

export default BackButton;
