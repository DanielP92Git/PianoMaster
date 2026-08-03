import { useTranslation } from "react-i18next";

/**
 * Minimal bare-parent landing (D-03 discretion).
 *
 * Rendered when a signed-in parent (isParent, no child profile yet — Phase 3
 * intentionally seeds none) reaches `/`. Uses the app's standard glassmorphism
 * page shell on the existing purple-gradient AppLayout background — this is a
 * post-login app screen, not part of the auth wizard.
 *
 * No child CRUD, no add-child CTA (Phase 4 scope), no new data fetching.
 */
export default function ParentPlaceholder() {
  const { t } = useTranslation("common");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-white/20 bg-white/10 p-6 text-center shadow-lg backdrop-blur-md">
        <h1 className="text-2xl font-semibold text-white">
          {t("parentPlaceholder.heading")}
        </h1>
        <p className="mt-2 text-white/70">{t("parentPlaceholder.body")}</p>
      </div>
    </div>
  );
}
