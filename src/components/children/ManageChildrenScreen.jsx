import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useChildProfiles } from "../../hooks/useChildProfiles";
import { useActiveChild } from "../../contexts/ActiveChildContext";
import { getAvatar } from "../../services/apiAvatars";
import BackButton from "../ui/BackButton";
import ChildProfileForm from "./ChildProfileForm";
import ChildProfilePanel from "./ChildProfilePanel";

/**
 * ManageChildrenScreen — /manage-children (gated, D-09).
 *
 * Lists the parent's children (active + paused, unlike the "Who's playing?"
 * switcher which hides paused children) and drills into a per-child panel.
 * `?add=1` opens the create form; on create, auto-switches into the new
 * child and lands on the dashboard (D-15).
 *
 * Mirrors ParentPortalPage's page shell (BackButton + glass container +
 * Display-typography title). The route is wrapped in
 * ParentGateProtectedRoute at the App.jsx level, so this component does not
 * hold its own gate state.
 */
function StatusPill({ isPaused, t }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center rounded-full border px-3 py-1 text-sm font-medium ${
        isPaused
          ? "border-amber-400/30 bg-amber-400/20 text-amber-300"
          : "border-green-400/30 bg-green-400/20 text-green-300"
      }`}
    >
      {isPaused
        ? t("children.manage.statusPaused")
        : t("children.manage.statusActive")}
    </span>
  );
}

export default function ManageChildrenScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("he");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: children = [], isLoading } = useChildProfiles();
  const { data: avatars = [] } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
  });
  const { switchChild } = useActiveChild();
  const [selectedChildId, setSelectedChildId] = useState(null);

  const isAdding = searchParams.get("add") === "1";
  const selectedChild =
    children.find((child) => child.id === selectedChildId) || null;

  const avatarById = (avatarId) =>
    avatars.find((avatar) => avatar.id === avatarId);

  const handleCreated = (newChild) => {
    if (newChild?.id) {
      switchChild(newChild.id);
    }
    navigate("/dashboard");
  };

  const handleAddClick = () => {
    setSearchParams({ add: "1" });
  };

  const handleBackFromPanel = () => {
    setSelectedChildId(null);
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-lg px-4 py-6">
        <BackButton styling="mb-6 md:hidden" />

        <h1 className="mb-6 text-2xl font-bold text-white">
          {t("children.manage.title")}
        </h1>

        {selectedChild ? (
          <ChildProfilePanel
            child={selectedChild}
            onBack={handleBackFromPanel}
          />
        ) : isAdding ? (
          <ChildProfileForm onSaved={handleCreated} />
        ) : (
          <div className="space-y-3">
            {isLoading && (
              <p className="text-white/70">{t("common.loading")}</p>
            )}

            {!isLoading && children.length === 0 && (
              <p className="text-white/70">{t("children.manage.empty")}</p>
            )}

            {children.map((child) => {
              const isPaused = child.is_active === false;
              const avatar = avatarById(child.avatar_id);
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedChildId(child.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition-colors hover:bg-white/15 ${
                    isRTL ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/5">
                    {avatar?.image_url ? (
                      <img
                        src={avatar.image_url}
                        alt={avatar.name || child.nickname}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="flex-1 font-semibold text-white">
                    {child.nickname}
                  </span>
                  <StatusPill isPaused={isPaused} t={t} />
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleAddClick}
              className="w-full rounded-xl border border-dashed border-white/30 bg-white/5 p-4 text-center font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              {t("children.addChild")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
