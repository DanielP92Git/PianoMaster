import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, AlertCircle } from "lucide-react";
import { useUpdatePassword } from "../features/authentication/useUpdatePassword";
import { useTranslation } from "react-i18next";
import supabase from "../services/supabase";
import AuthShell from "../components/auth/AuthShell";
import AuthInput from "../components/auth/AuthInput";
import AuthCta from "../components/auth/AuthCta";
import BrandTile from "../components/auth/BrandTile";
import { AuthLanguageToggle } from "../components/auth/AuthLanguageToggle";

const SESSION_TIMEOUT_MS = 10000;

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");
  const isHebrew = i18n.language?.startsWith("he");
  // Fredoka One has no Hebrew glyphs, so Hebrew headings fall back to an
  // arbitrary system face. Use the app's Hebrew stack at a heavy weight instead.
  const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";
  const { updatePassword, isPending, isSuccess } = useUpdatePassword();

  // Detect recovery session from Supabase auth
  useEffect(() => {
    // If no auth params in URL, show expired immediately (user navigated here directly)
    const hasAuthParams =
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("type=recovery") ||
      window.location.search.includes("code=");
    if (!hasAuthParams) {
      // Check for existing session first (page reload after token was consumed)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsSessionReady(true);
        } else {
          setIsExpired(true);
        }
      });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsSessionReady(true);
      }
    });

    // Also check if already in a session (page reload case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsSessionReady(true);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Timeout: if session not detected within 3 seconds, show expired state
  useEffect(() => {
    if (isSessionReady) return;

    const timeout = setTimeout(() => {
      if (!isSessionReady) {
        setIsExpired(true);
      }
    }, SESSION_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isSessionReady]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    if (password.length < 6) {
      setValidationError(t("auth.resetPassword.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    updatePassword({ password });
  };

  const desktopHero = (
    <>
      <div className="flex items-center gap-[14px]">
        <BrandTile className="h-[52px] w-[52px]" emojiClassName="text-[26px]" />
        <span className="font-playful text-[26px] text-white">PianoMaster</span>
      </div>
      <div>
        <h2
          className={`max-w-[380px] text-[44px] leading-[1.1] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.4)] ${headingFont}`}
        >
          {t("auth.brand.tagline")}
        </h2>
        <p className="mt-4 max-w-[360px] text-[17px] leading-[1.55] text-white/[0.82]">
          {t("auth.login.desktopSubcopy")}
        </p>
      </div>
    </>
  );

  const backToLogin = (
    <p className="mt-4 text-center text-sm text-white/70">
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="font-semibold text-[#93c5fd] transition-colors hover:text-white"
      >
        {t("auth.forgotPassword.backToLogin")}
      </button>
    </p>
  );

  // Expired/invalid link state
  if (isExpired && !isSessionReady) {
    return (
      <AuthShell scrim="sent" layout="centered" desktopHero={desktopHero}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-[rgba(252,211,77,0.4)] bg-[rgba(245,158,11,0.18)] shadow-[0_0_40px_rgba(245,158,11,0.3)]">
            <AlertCircle
              className="h-[52px] w-[52px] text-[#fcd34d]"
              strokeWidth={2}
            />
          </div>

          <h1 className={`mt-7 text-[27px] text-white ${headingFont}`}>
            {t("auth.resetPassword.title")}
          </h1>
          <p className="mt-2.5 max-w-[280px] text-[15px] leading-[1.6] text-white/[0.82]">
            {t("auth.resetPassword.errorExpiredLink")}
          </p>

          <div className="mt-9 w-full max-w-[300px]">
            <AuthCta variant="ghost" onClick={() => navigate("/login")}>
              {t("auth.forgotPassword.backToLogin")}
            </AuthCta>
          </div>
        </div>
      </AuthShell>
    );
  }

  // Loading state while waiting for session detection. Rendered inside the
  // shell so the backdrop doesn't flash between this and the form.
  if (!isSessionReady) {
    return (
      <AuthShell scrim="forgot" layout="centered" desktopHero={desktopHero}>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#93c5fd]" />
        </div>
      </AuthShell>
    );
  }

  const passwordToggle = (visible, setVisible) => (
    <button
      type="button"
      onClick={() => setVisible(!visible)}
      aria-label={t(
        visible ? "auth.login.hidePassword" : "auth.login.showPassword"
      )}
      className="flex text-white/55 transition-colors hover:text-white focus:outline-none"
      tabIndex={-1}
    >
      {visible ? (
        <EyeOff className="h-[18px] w-[18px]" />
      ) : (
        <Eye className="h-[18px] w-[18px]" />
      )}
    </button>
  );

  return (
    <AuthShell
      scrim="forgot"
      topEnd={<AuthLanguageToggle />}
      desktopHero={desktopHero}
      sheetClassName="gap-4 short:gap-2.5"
      mobileHero={
        <div className="flex flex-col items-center px-10 text-center">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[rgba(96,165,250,0.4)] bg-[rgba(37,99,235,0.25)] text-[#93c5fd] short:h-14 short:w-14">
            <Lock
              className="h-[34px] w-[34px] short:h-7 short:w-7"
              strokeWidth={1.8}
            />
          </div>
          <h1
            className={`mt-[18px] text-2xl text-white short:mt-3 short:text-xl ${headingFont}`}
          >
            {t("auth.resetPassword.title")}
          </h1>
        </div>
      }
    >
      <div className="mb-6 hidden lg:block">
        <h1 className={`text-[30px] text-white ${headingFont}`}>
          {t("auth.resetPassword.title")}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 short:gap-2.5"
      >
        <AuthInput
          id="new-password"
          type={showPassword ? "text" : "password"}
          label={t("auth.resetPassword.newPasswordLabel")}
          icon={Lock}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setValidationError(null);
          }}
          placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
          disabled={isPending || isSuccess}
          autoComplete="new-password"
          trailing={passwordToggle(showPassword, setShowPassword)}
        />

        <AuthInput
          id="confirm-password"
          type={showConfirmPassword ? "text" : "password"}
          label={t("auth.resetPassword.confirmPasswordLabel")}
          icon={Lock}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setValidationError(null);
          }}
          placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
          disabled={isPending || isSuccess}
          autoComplete="new-password"
          trailing={passwordToggle(showConfirmPassword, setShowConfirmPassword)}
        />

        {validationError && (
          <div className="flex items-center gap-2 rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {validationError}
          </div>
        )}

        <AuthCta
          type="submit"
          loading={isPending}
          disabled={isSuccess || (!password && !confirmPassword)}
        >
          {t("auth.resetPassword.submitButton")}
        </AuthCta>
      </form>

      {backToLogin}
    </AuthShell>
  );
}

export default ResetPasswordPage;
