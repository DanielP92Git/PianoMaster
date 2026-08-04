import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAvatar } from "../../services/apiAvatars";
import {
  createChildProfile,
  renameChildProfile,
  updateChildAvatar,
} from "../../services/apiChildProfiles";
import { looksLikeFullName } from "../../utils/nicknameHeuristic";

/**
 * ChildProfileForm — reusable create/edit form for a child profile (Phase 4).
 *
 * Preset-avatar only (PROFILE-02, D-13) — no upload affordance anywhere.
 * Nickname guidance is always visible (D-14); the full-name heuristic
 * warning is a soft, non-blocking nudge that never disables submit.
 *
 * Props:
 *   childId?         - present in edit mode; absent in create mode
 *   initialNickname?  - pre-fills the nickname field (edit mode)
 *   initialAvatarId?  - pre-selects an avatar tile (edit mode)
 *   onSaved           - called with the saved child profile row on success
 */
function ChildProfileForm({
  childId,
  initialNickname = "",
  initialAvatarId = null,
  onSaved,
}) {
  const { t, i18n } = useTranslation();
  const isEdit = Boolean(childId);
  const isRTL = i18n.language?.startsWith("he");

  const [nickname, setNickname] = useState(initialNickname);
  const [avatarId, setAvatarId] = useState(initialAvatarId);

  const { data: avatars = [], isPending: avatarsLoading } = useQuery({
    queryKey: ["avatars"],
    queryFn: getAvatar,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        await renameChildProfile(childId, nickname);
        return updateChildAvatar(childId, avatarId);
      }
      return createChildProfile({ nickname, avatarId });
    },
    onSuccess: (result) => {
      onSaved?.(result);
    },
    onError: (error) => {
      toast.error(error?.message || t("common.errorRetryAskParent"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const showFullNameWarning = looksLikeFullName(nickname);
  const canSubmit = nickname.trim().length > 0 && Boolean(avatarId);

  return (
    <div
      className="w-full space-y-4 rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nickname field */}
        <div>
          <input
            id="child-nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 transition-colors focus:border-indigo-400/70 focus:outline-none focus:ring-1 focus:ring-indigo-400/40"
            autoComplete="off"
          />

          {/* Always-visible helper text (D-14) */}
          <p className="mt-2 text-sm text-white/70">
            {t("children.form.nicknameHelper")}
          </p>

          {/* Soft, non-blocking full-name warning (D-14) */}
          {showFullNameWarning && (
            <p
              className="mt-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-2 text-sm text-amber-400"
              role="status"
            >
              {t("children.form.nicknameFullNameWarning")}
            </p>
          )}
        </div>

        {/* Compact preset-avatar grid (D-13) */}
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="avatar-picker"
        >
          {avatarsLoading && (
            <p className="text-sm text-white/60">{t("common.loading")}</p>
          )}
          {avatars.map((avatar) => {
            const selected = avatar.id === avatarId;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setAvatarId(avatar.id)}
                aria-pressed={selected}
                aria-label={avatar.name || "avatar"}
                className={`h-14 w-14 overflow-hidden rounded-full border transition-all ${
                  selected
                    ? "border-indigo-400 ring-2 ring-indigo-400"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {avatar.image_url ? (
                  <img
                    src={avatar.image_url}
                    alt={avatar.name || "avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!canSubmit || saveMutation.isPending}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t(
            isEdit ? "children.form.updateSubmit" : "children.form.createSubmit"
          )}
        </button>
      </form>
    </div>
  );
}

export default ChildProfileForm;
