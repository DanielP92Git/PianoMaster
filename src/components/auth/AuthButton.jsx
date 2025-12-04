import { Link } from "react-router-dom";
import { useUser } from "../../features/authentication/useUser";
import { useLogout } from "../../features/authentication/useLogout";
import { Loader2, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

function AuthButton({ className = "" }) {
  const { isAuthenticated, user } = useUser();
  const { logout, isPending } = useLogout();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  if (isAuthenticated) {
    return (
      <button
        onClick={logout}
        disabled={isPending}
        className={`
          group flex items-center justify-center gap-3 w-full
          px-4 py-3 text-white font-semibold
          bg-gradient-to-r from-red-500 to-red-600 
          hover:from-red-600 hover:to-red-700
          disabled:from-red-400 disabled:to-red-500
          rounded-xl shadow-lg hover:shadow-xl
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          ${isRTL ? "flex-row-reverse" : ""}
          ${className}
        `}
        aria-label={isPending ? t("auth.loggingOut") : t("auth.logOut")}
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
            <span>{t("auth.loggingOut")}</span>
          </>
        ) : (
          <>
            <LogOut className={`w-5 h-5 flex-shrink-0 transition-transform ${isRTL ? "group-hover:translate-x-1" : "group-hover:-translate-x-1"}`} />
            <span>{t("auth.logOut")}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      to="/login"
      className={`
        flex items-center justify-center gap-3 w-full
        px-4 py-3 text-white font-semibold
        bg-gradient-to-r from-indigo-500 to-indigo-600 
        hover:from-indigo-600 hover:to-indigo-700
        rounded-xl shadow-lg hover:shadow-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        ${isRTL ? "flex-row-reverse" : ""}
        ${className}
      `}
    >
      <span>{t("auth.logIn")}</span>
    </Link>
  );
}

export default AuthButton;
