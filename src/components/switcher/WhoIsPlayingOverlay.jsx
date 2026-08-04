import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { useActiveChild } from "../../contexts/ActiveChildContext";
import { getAvatar } from "../../services/apiAvatars";
import { getAvatarImageSource } from "../../utils/avatarAssets";

/**
 * WhoIsPlayingOverlay — the "Who's playing?" sibling switcher (PROFILE-04, D-01/D-02/D-03/D-07).
 *
 * Deliberately ungated in both directions: any sibling tile switches immediately with a single
 * tap (ActiveChildContext.switchChild clears cache/localStorage/singletons per Plan 02). The
 * ONLY gated path is "Add", which navigates to /manage-children?add=1 — a
 * ParentGateProtectedRoute enforces the gate there, so this component renders no gate itself.
 *
 * Props:
 *   open    - whether the overlay is visible
 *   onClose - called after a sibling switch or an Add navigation
 */
function WhoIsPlayingOverlay({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("he");
  const navigate = useNavigate();
  const { ownedChildren, activeChildId, switchChild } = useActiveChild();

  const { data: avatars = [] } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
  });

  if (!open) return null;

  // Paused children (is_active === false) are hidden from the ungated switcher (D-10).
  const activeChildren = ownedChildren.filter(
    (child) => child.is_active !== false
  );
  const isEmpty = activeChildren.length === 0;

  const resolveAvatarSrc = (avatarId) => {
    const avatar = avatars.find((a) => a.id === avatarId);
    return getAvatarImageSource(avatar);
  };

  const handleSelect = (childId) => {
    try {
      switchChild(childId);
      onClose?.();
    } catch {
      toast.error(t("common.errorRetryAskParent"));
    }
  };

  const handleAdd = () => {
    navigate("/manage-children?add=1");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg space-y-5 rounded-xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <h2 className="text-center font-rounded text-2xl font-bold text-white">
          {t("switcher.title")}
        </h2>

        {isEmpty && (
          <div className="space-y-2 text-center">
            <h3 className="font-rounded text-lg font-bold text-white">
              {t("switcher.emptyHeading")}
            </h3>
            <p className="text-sm text-white/70">{t("switcher.emptyBody")}</p>
          </div>
        )}

        <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-4">
          {activeChildren.map((child) => {
            const isActiveChild = child.id === activeChildId;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => handleSelect(child.id)}
                aria-label={child.nickname}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className={`h-18 w-18 overflow-hidden rounded-full border-2 transition-all ${
                    isActiveChild
                      ? "border-indigo-400 ring-2 ring-indigo-400"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  <img
                    src={resolveAvatarSrc(child.avatar_id)}
                    alt={child.nickname}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="max-w-[72px] truncate text-sm text-white/80">
                  {child.nickname}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleAdd}
            aria-label={t("switcher.addTile")}
            className="flex flex-col items-center gap-1"
          >
            <div className="flex h-18 w-18 items-center justify-center rounded-full border-2 border-dashed border-indigo-400/70">
              <UserPlus className="h-8 w-8 text-indigo-400" />
            </div>
            <span className="text-sm text-white/80">
              {t("switcher.addTile")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WhoIsPlayingOverlay;
