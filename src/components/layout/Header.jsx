import { Menu, Music2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserProfile } from "../../hooks/useUserProfile";
import { ACCESSORY_SLOT_STYLES } from "../ui/AnimatedAvatar";
import { getAvatarImageSource } from "../../utils/avatarAssets";

export default function Header({
  onMenuClick,
  pageTitle,
  showMenuButton = true,
  overlay = false,
}) {
  const { data: profileData, isLoading } = useUserProfile();
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  const avatarUrl = getAvatarImageSource(
    profileData?.avatars || profileData?.avatar_url,
    profileData?.avatar_url
  );
  const layeredAccessories = Array.isArray(profileData?.equipped_accessories)
    ? profileData.equipped_accessories.filter((item) => item?.image_url)
    : [];

  return (
    <nav
      className={`${
        overlay && isDashboard ? "fixed top-0 z-50" : ""
      } left-0 right-0 ${
        isDashboard
          ? "bg-gradient-to-b from-black/40 to-transparent  shadow-none"
          : "shadow-lg"
      } ${isRTL ? "xl:mr-72" : "xl:ml-72"}`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          className={`relative flex h-16 items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {/* Show placeholder while loading */}
            {isLoading ? (
              <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
            ) : avatarUrl ? (
              <Link to="/avatars">
                <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded-full ring-2 ring-white/20 transition-all hover:ring-white">
                  <img
                    className="h-full w-full object-cover"
                    src={avatarUrl}
                    alt="User avatar"
                    loading="eager"
                  />
                  {layeredAccessories.map((item) => {
                    const slot = item.slot || item.category || "accessory";
                    const slotClass =
                      ACCESSORY_SLOT_STYLES[slot] ||
                      ACCESSORY_SLOT_STYLES.accessory;
                    return (
                      <img
                        key={`${item.accessory_id || item.image_url}-${slot}`}
                        src={item.image_url}
                        alt="Avatar accessory"
                        className={`${slotClass} pointer-events-none object-contain`}
                      />
                    );
                  })}
                </div>
              </Link>
            ) : null}
            {!pageTitle && (
              <Link
                to={"/"}
                className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
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
              <h1 className="whitespace-nowrap text-lg font-bold text-white sm:text-xl">
                {pageTitle}
              </h1>
            </div>
          )}

          <div
            className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {showMenuButton && onMenuClick && (
              <button
                className="rounded-lg p-2 transition-colors hover:bg-white/10 lg:hidden"
                onClick={onMenuClick}
                aria-label={t("navigation.menuTitle")}
              >
                <Menu className="h-6 w-6 text-white hover:text-gray-200" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
