import { useTranslation } from "react-i18next";
import AuthSheet from "./AuthSheet";

/**
 * Shared frame for every auth view.
 *
 * Mobile: full-bleed brand hero with a per-view gradient scrim and a frosted
 * bottom sheet carrying the form.
 * Desktop (`lg`+): 47/53 split — hero panel left, focused form column right.
 *
 * The form (`children`) is rendered exactly once so input ids and form
 * submission stay unique; only the decorative hero content differs between
 * the two layouts.
 */
const MOBILE_SCRIMS = {
  login:
    "linear-gradient(180deg, rgba(15,13,40,0.35) 0%, rgba(20,16,55,0.45) 30%, rgba(30,27,75,0.85) 62%, #1e1b4b 86%)",
  signup:
    "linear-gradient(180deg, rgba(15,13,40,0.35) 0%, rgba(20,16,55,0.5) 24%, rgba(30,27,75,0.88) 52%, #1e1b4b 78%)",
  forgot:
    "linear-gradient(180deg, rgba(15,13,40,0.4) 0%, rgba(20,16,55,0.5) 30%, rgba(30,27,75,0.88) 60%, #1e1b4b 84%)",
  sent: "linear-gradient(180deg, rgba(15,13,40,0.55) 0%, rgba(20,16,55,0.6) 40%, rgba(30,27,75,0.8) 100%)",
};

const DESKTOP_SCRIM =
  "linear-gradient(150deg, rgba(30,27,75,0.55) 0%, rgba(49,46,129,0.72) 55%, rgba(15,13,40,0.92) 100%)";

function AuthShell({
  scrim = "login",
  layout = "sheet",
  mobileHero,
  desktopHero,
  topStart,
  topEnd,
  sheetClassName = "",
  children,
}) {
  const { i18n } = useTranslation("common");
  // `startsWith` rather than `=== "he"` — a strict match breaks for `he-IL`.
  const isHebrew = i18n.language?.startsWith("he");

  return (
    <div
      dir={i18n.dir()}
      lang={i18n.language}
      className={`relative min-h-[100dvh] overflow-hidden bg-[#1e1b4b] font-outfit lg:flex lg:h-[100dvh] ${
        isHebrew ? "font-hebrew" : ""
      }`}
    >
      {/* Hero panel — full-bleed backdrop on mobile, left column on desktop */}
      <div className="absolute inset-0 lg:relative lg:inset-auto lg:flex lg:flex-[0_0_47%] lg:flex-col lg:overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center lg:hidden"
          style={{ backgroundImage: 'url("/images/dashboard-hero.webp")' }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center lg:block"
          style={{
            backgroundImage: 'url("/images/desktop-dashboard-hero.webp")',
          }}
        />
        <div
          className="absolute inset-0 lg:hidden"
          style={{ backgroundImage: MOBILE_SCRIMS[scrim] }}
        />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{ backgroundImage: DESKTOP_SCRIM }}
        />

        {desktopHero && (
          <div className="relative z-[5] hidden flex-1 flex-col justify-between p-[52px] lg:flex">
            {desktopHero}
          </div>
        )}
      </div>

      {topStart && (
        <div className="absolute top-[62px] z-[6] lg:top-[26px] ltr:left-[18px] lg:ltr:left-[30px] rtl:right-[18px] lg:rtl:right-[30px]">
          {topStart}
        </div>
      )}
      {topEnd && (
        <div className="absolute top-14 z-[6] lg:top-[26px] ltr:right-[18px] lg:ltr:right-[30px] rtl:left-[18px] lg:rtl:left-[30px]">
          {topEnd}
        </div>
      )}

      {/* Form region — bottom sheet on mobile, right panel on desktop */}
      <div
        className={`relative z-[5] flex min-h-[100dvh] flex-col items-center overflow-y-auto lg:min-h-0 lg:flex-1 lg:justify-center lg:bg-[radial-gradient(700px_500px_at_70%_0%,#312e81,#1e1b4b_70%)] lg:p-10 ${
          layout === "sheet"
            ? "justify-end"
            : "justify-center px-[38px] lg:px-10"
        }`}
      >
        {/*
         * The mobile hero sits in flow above the sheet rather than pinned to a
         * fixed offset, so it centres on tall phones and compresses on short
         * ones instead of colliding with the sheet.
         */}
        {mobileHero && (
          <div className="flex min-h-0 w-full flex-1 shrink flex-col items-center justify-center pt-16 lg:hidden short:pt-3">
            {mobileHero}
          </div>
        )}
        <AuthSheet
          variant={layout === "sheet" ? "sheet" : "plain"}
          className={sheetClassName}
        >
          {children}
        </AuthSheet>
      </div>
    </div>
  );
}

export default AuthShell;
