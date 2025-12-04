import { Menu, Music2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../hooks/useUserProfile";

export default function Header({ onMenuClick, pageTitle }) {
  const { data: profileData, isLoading } = useUserProfile();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";

  const avatarUrl = profileData?.avatars?.image_url || profileData?.avatar_url;

  return (
    <nav className={`shadow-lg ${isRTL ? "lg:mr-72" : "lg:ml-72"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className={`flex justify-between items-center h-16 relative ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Show placeholder while loading */}
            {isLoading ? (
              <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
            ) : avatarUrl ? (
              <Link to="/avatars">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 hover:ring-white transition-all cursor-pointer"
                  src={avatarUrl}
                  alt="User avatar"
                  loading="eager"
                />
              </Link>
            ) : null}
            {!pageTitle && (
              <Link to={"/"} className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Music2 className="h-8 w-8 text-indigo-600" />
                <span className="text-xl font-bold text-white">
                  {t("app.title")}
                </span>
              </Link>
            )}
          </div>

          {/* Centered Page Title */}
          {pageTitle && (
            <div className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                {pageTitle}
              </h1>
            </div>
          )}

          <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              className="p-2 rounded-lg lg:hidden hover:bg-white/10 transition-colors"
              onClick={onMenuClick}
              aria-label={t("navigation.menuTitle")}
            >
              <Menu className="h-6 w-6 text-white hover:text-gray-200" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
