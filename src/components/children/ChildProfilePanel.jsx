import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import ChildProfileForm from "./ChildProfileForm";
import DeleteChildModal from "./DeleteChildModal";
import { setChildActive } from "../../services/apiChildProfiles";
import {
  exportStudentData,
  downloadStudentDataJSON,
} from "../../services/dataExportService";
import { useUser } from "../../features/authentication/useUser";

/**
 * ChildProfilePanel — per-child "Profile" + "Data & Privacy" sections
 * (D-09/D-10/D-11/D-12), rendered inside ManageChildrenScreen when a child
 * row is selected.
 *
 * Props:
 *   child   - the selected child_profiles row { id, nickname, avatar_id, is_active }
 *   onBack  - clears the parent's selection (in-page state, not a route change)
 */
export default function ChildProfilePanel({ child, onBack }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("he");
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isPaused = child.is_active === false;
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const invalidateChildProfiles = () => {
    queryClient.invalidateQueries({ queryKey: ["child-profiles", user?.id] });
  };

  const handleReview = async () => {
    setIsReviewing(true);
    try {
      const data = await exportStudentData(child.id);
      setReviewSummary(data);
    } catch (err) {
      toast.error(err?.message || t("common.errorRetryAskParent"));
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blobUrl = await downloadStudentDataJSON(child.id);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      const date = new Date().toISOString().split("T")[0];
      const safeName = (child.nickname || "child").replace(/\s+/g, "_");
      anchor.download = `${safeName}_data_export_${date}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(err?.message || t("common.errorRetryAskParent"));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePauseConfirm = async () => {
    setIsPausing(true);
    try {
      await setChildActive(child.id, false);
      invalidateChildProfiles();
      setShowPauseConfirm(false);
    } catch (err) {
      toast.error(err?.message || t("common.errorRetryAskParent"));
    } finally {
      setIsPausing(false);
    }
  };

  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      await setChildActive(child.id, true);
      invalidateChildProfiles();
    } catch (err) {
      toast.error(err?.message || t("common.errorRetryAskParent"));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDeleted = () => {
    invalidateChildProfiles();
    setShowDeleteModal(false);
    onBack?.();
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
      >
        <BackIcon className="h-4 w-4" />
        {t("common.actions.back")}
      </button>

      {/* Profile section */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("children.panel.sectionProfile")}
        </h2>
        <ChildProfileForm
          childId={child.id}
          initialNickname={child.nickname}
          initialAvatarId={child.avatar_id}
          onSaved={invalidateChildProfiles}
        />
      </section>

      {/* Data & Privacy section */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-white">
          {t("children.panel.sectionDataPrivacy")}
        </h2>
        <div className="space-y-3 rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
          {/* Review Data */}
          <button
            type="button"
            onClick={handleReview}
            disabled={isReviewing}
            className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isReviewing && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("dataRights.review")}
          </button>

          {reviewSummary && (
            <div className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
              {Object.entries(reviewSummary)
                .filter(([key]) => key !== "exportMetadata")
                .map(([table, info]) => (
                  <div
                    key={table}
                    className="flex items-center justify-between border-b border-white/10 py-1 last:border-0"
                  >
                    <span>{info.description}</span>
                    <span className="font-semibold">{info.recordCount}</span>
                  </div>
                ))}
            </div>
          )}

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {isDownloading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("dataRights.export")}
          </button>

          {/* Pause / Reactivate (amber, reversible — D-10) */}
          {!isPaused && !showPauseConfirm && (
            <button
              type="button"
              onClick={() => setShowPauseConfirm(true)}
              className="w-full rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-left font-medium text-amber-300 transition-colors hover:bg-amber-400/20"
            >
              {t("dataRights.deactivate.action")}
            </button>
          )}

          {!isPaused && showPauseConfirm && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="mb-3 text-sm text-amber-200">
                {t("dataRights.deactivate.confirm", {
                  nickname: child.nickname,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPauseConfirm(false)}
                  disabled={isPausing}
                  className="flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                >
                  {t("parentGate.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handlePauseConfirm}
                  disabled={isPausing}
                  className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-amber-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
                >
                  {isPausing && (
                    <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
                  )}
                  {t("dataRights.deactivate.action")}
                </button>
              </div>
            </div>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={isReactivating}
              className="w-full rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-3 text-left font-medium text-green-300 transition-colors hover:bg-green-400/20 disabled:opacity-50"
            >
              {isReactivating && (
                <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
              )}
              {t("dataRights.reactivate.action")}
            </button>
          )}

          {/* Delete — visually last/lowest, red, permanent (D-12) */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full rounded-lg border border-red-500/30 bg-red-600/10 px-4 py-3 text-left font-medium text-red-300 transition-colors hover:bg-red-600/20"
          >
            {t("dataRights.delete.action")}
          </button>
        </div>
      </section>

      <DeleteChildModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        child={child}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
