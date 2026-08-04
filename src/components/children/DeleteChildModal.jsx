import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import { deleteChildProfile } from "../../services/accountDeletionService";

/**
 * DeleteChildModal — red, name-confirmed, immediate per-child delete (D-12).
 *
 * Mirrors AccountDeletionModal's structure (warning banner ->
 * what-will-be-deleted summary -> name-confirmation input -> disabled-until
 * -match submit) but is scoped to ONE child: this delete is immediate and
 * permanent, with no waiting-period copy anywhere (unlike the whole-account
 * flow). Calls accountDeletionService.deleteChildProfile, which does NOT
 * sign the parent out (unlike the whole-account requestAccountDeletion
 * flow).
 */
export default function DeleteChildModal({
  isOpen,
  onClose,
  child,
  onDeleted,
}) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language?.startsWith("he");
  const [typed, setTyped] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !child) return null;

  const isConfirmationValid = () => {
    if (!child?.nickname || !typed.trim()) return false;
    return typed.trim().toLowerCase() === child.nickname.trim().toLowerCase();
  };

  const handleClose = () => {
    if (isProcessing) return;
    setTyped("");
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!isConfirmationValid()) return;

    setIsProcessing(true);
    try {
      await deleteChildProfile(child.id, typed.trim());
      toast.success(t("dataRights.delete.submit"));
      setTyped("");
      onDeleted?.();
    } catch (err) {
      toast.error(err?.message || t("common.errorRetryAskParent"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="fixed inset-0 bg-black/70"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm space-y-4 rounded-xl border border-red-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md">
        {/* Warning banner */}
        <div
          className={`flex items-start gap-3 rounded-lg border-2 border-red-700 bg-red-900/20 p-4 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-300">
            {t("dataRights.delete.confirm", { nickname: child.nickname })}
          </p>
        </div>

        {/* Name confirmation */}
        <div className="space-y-2">
          <p className="text-center text-lg font-bold text-white">
            {child.nickname}
          </p>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={child.nickname}
            aria-label={t("dataRights.delete.action")}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 transition-colors focus:border-red-400/70 focus:outline-none focus:ring-1 focus:ring-red-400/40"
            autoComplete="off"
          />
        </div>

        {/* Actions */}
        <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            {t("parentGate.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || !isConfirmationValid()}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("dataRights.delete.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
