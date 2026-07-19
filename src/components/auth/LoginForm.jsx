import React, { useState, useEffect } from "react";
import { useLogin } from "../../features/authentication/useLogin";
import { useResetPassword } from "../../features/authentication/useResetPassword";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import { SocialLogin } from "../../components/auth/SocialLogin";
import SignupForm from "../../components/auth/SignupForm";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import AuthShell from "./AuthShell";
import AuthInput from "./AuthInput";
import AuthCta from "./AuthCta";
import CircleIconButton from "./CircleIconButton";
import { lockOrientation } from "../../utils/pwa";
import { Trans, useTranslation } from "react-i18next";

const formatCountdown = (totalSeconds) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

function BrandTile({ className = "", emojiClassName = "" }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[20px] bg-gradient-to-br from-[#4f46e5] to-[#c026d3] shadow-[0_8px_28px_rgba(192,38,211,0.5)] motion-safe:animate-pmfloat ${className}`}
    >
      <span className={emojiClassName} aria-hidden="true">
        🎹
      </span>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(null);
  const [view, setView] = useState("login"); // 'login' | 'forgotPassword' | 'resetSent'
  const [resetEmail, setResetEmail] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { login, isPending } = useLogin();
  const { t, i18n } = useTranslation("common");
  const isHebrew = i18n.language?.startsWith("he");
  // Fredoka One has no Hebrew glyphs, so Hebrew headings fall back to an
  // arbitrary system face. Use the app's Hebrew stack at a heavy weight instead.
  const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";
  const {
    resetPassword,
    isPending: isResetPending,
    isSuccess: isResetSuccess,
    reset: resetMutation,
  } = useResetPassword();

  useEffect(() => {
    lockOrientation("portrait-primary");
  }, []);

  // Check if user was logged out due to inactivity
  useEffect(() => {
    const reason = sessionStorage.getItem("logoutReason");
    if (reason === "inactivity") {
      setLogoutMessage(true);
      sessionStorage.removeItem("logoutReason");
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // When reset email is sent successfully, switch to success view and start cooldown
  useEffect(() => {
    if (isResetSuccess) {
      setView("resetSent");
      setCooldownSeconds(60);
    }
  }, [isResetSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || isPending) return;
    login({ email, password });
  };

  const handleResetSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail || isResetPending || cooldownSeconds > 0) return;
    resetPassword({ email: resetEmail });
  };

  const backToLogin = () => {
    setView("login");
    resetMutation();
  };

  // Signup keeps its 4-step COPPA wizard; it now owns its own AuthShell.
  if (isSignup) {
    return <SignupForm onBackToLogin={() => setIsSignup(false)} />;
  }

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

  if (view === "forgotPassword") {
    return (
      <AuthShell
        scrim="forgot"
        topStart={
          <CircleIconButton
            onClick={backToLogin}
            label={t("auth.forgotPassword.backToLogin")}
          >
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </CircleIconButton>
        }
        desktopHero={desktopHero}
        sheetClassName="gap-4"
        mobileHero={
          <div className="flex flex-col items-center px-10 text-center">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-[rgba(96,165,250,0.4)] bg-[rgba(37,99,235,0.25)] text-[#93c5fd]">
              <Mail className="h-[34px] w-[34px]" strokeWidth={1.8} />
            </div>
            <h1 className={`mt-[18px] text-2xl text-white ${headingFont}`}>
              {t("auth.forgotPassword.heading")}
            </h1>
            <p className="mt-1.5 text-[14.5px] leading-[1.5] text-white/[0.78]">
              {t("auth.forgotPassword.body")}
            </p>
          </div>
        }
      >
        <div className="mb-6 hidden lg:block">
          <h1 className={`text-[30px] text-white ${headingFont}`}>
            {t("auth.forgotPassword.heading")}
          </h1>
          <p className="mt-1 text-[15px] text-white/60">
            {t("auth.forgotPassword.body")}
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <AuthInput
            id="reset-email"
            type="email"
            label={t("auth.forgotPassword.emailLabel")}
            icon={Mail}
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder={t("auth.forgotPassword.emailPlaceholder")}
            disabled={isResetPending}
            autoComplete="email"
            required
          />

          <AuthCta
            type="submit"
            loading={isResetPending}
            disabled={cooldownSeconds > 0 || !resetEmail}
          >
            {t("auth.forgotPassword.submitButton")}
          </AuthCta>
        </form>

        <p className="mt-4 text-center text-sm text-white/70">
          <button
            type="button"
            onClick={backToLogin}
            className="font-semibold text-[#93c5fd] transition-colors hover:text-white"
          >
            {t("auth.forgotPassword.backToLogin")}
          </button>
        </p>
      </AuthShell>
    );
  }

  if (view === "resetSent") {
    return (
      <AuthShell scrim="sent" layout="centered" desktopHero={desktopHero}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-[rgba(134,239,172,0.4)] bg-[rgba(34,197,94,0.18)] shadow-[0_0_40px_rgba(34,197,94,0.35)] motion-safe:animate-pmfloat">
            <CheckCircle2
              className="h-[52px] w-[52px] text-[#86efac]"
              strokeWidth={2}
            />
          </div>

          <h1 className={`mt-7 text-[27px] text-white ${headingFont}`}>
            {t("auth.forgotPassword.sentTitle")}
          </h1>
          <p className="mt-2.5 max-w-[280px] text-[15px] leading-[1.6] text-white/[0.82]">
            <Trans
              t={t}
              i18nKey="auth.forgotPassword.sentBody"
              values={{ email: resetEmail }}
              components={{
                strong: <span className="font-semibold text-white" />,
              }}
            />
          </p>

          <div className="mt-9 w-full max-w-[300px]">
            <AuthCta variant="ghost" onClick={backToLogin}>
              {t("auth.forgotPassword.backToLogin")}
            </AuthCta>
          </div>

          {cooldownSeconds > 0 && (
            <p className="mt-[18px] text-[13px] text-white/55">
              <Trans
                t={t}
                i18nKey="auth.forgotPassword.resendIn"
                values={{ time: formatCountdown(cooldownSeconds) }}
                components={{
                  time: <span className="font-semibold text-[#fcd34d]" />,
                }}
              />
            </p>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      scrim="login"
      topEnd={<AuthLanguageToggle />}
      desktopHero={desktopHero}
      sheetClassName="gap-[15px] short:gap-2.5"
      mobileHero={
        <div className="flex flex-col items-center">
          <BrandTile
            className="h-16 w-16 short:h-12 short:w-12"
            emojiClassName="text-[32px] leading-none short:text-[24px]"
          />
          <h1 className="mt-4 font-playful text-[34px] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.4)] short:mt-2 short:text-[26px]">
            PianoMaster
          </h1>
          <p className="mt-0.5 text-[14.5px] text-white/[0.82] short:text-[13px]">
            {t("auth.brand.tagline")}
          </p>
        </div>
      }
    >
      {logoutMessage && (
        <div className="mb-1 rounded-xl border border-blue-400/30 bg-blue-500/20 p-3 text-center text-sm text-blue-100 backdrop-blur-sm">
          {t("auth.login.inactivityLogout")}
        </div>
      )}

      <div className="text-center lg:text-start">
        <h2 className={`text-[22px] text-white lg:text-[30px] ${headingFont}`}>
          {t("auth.login.heading")}
        </h2>
        <p className="mt-0.5 text-sm text-white/60 lg:mt-1 lg:text-[15px]">
          {t("auth.login.headingSub")}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[15px] short:gap-2.5"
      >
        <AuthInput
          id="email"
          type="email"
          label={t("auth.login.emailLabel")}
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.login.emailPlaceholder")}
          disabled={isPending}
          autoComplete="email"
          required
        />

        <AuthInput
          id="password"
          type={showPassword ? "text" : "password"}
          label={t("auth.login.passwordLabel")}
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.login.passwordPlaceholder")}
          disabled={isPending}
          autoComplete="current-password"
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={t(
                showPassword
                  ? "auth.login.hidePassword"
                  : "auth.login.showPassword"
              )}
              className="flex text-white/55 transition-colors hover:text-white focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          }
        />

        <div className="-mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setView("forgotPassword");
              setResetEmail(email);
              resetMutation();
            }}
            className="text-[13px] font-medium text-[#93c5fd] transition-colors hover:text-white"
          >
            {t("auth.forgotPassword.link")}
          </button>
        </div>

        <AuthCta type="submit" loading={isPending}>
          {t("auth.login.cta")}
        </AuthCta>
      </form>

      <div className="my-0.5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/15" />
        <span className="text-xs font-medium text-white/50">
          {t("auth.login.or")}
        </span>
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <SocialLogin />

      <p className="mt-1 text-center text-sm text-white/70">
        {t("auth.login.newHere")}{" "}
        <button
          type="button"
          onClick={() => setIsSignup(true)}
          className="font-semibold text-[#f0abfc] transition-colors hover:text-white"
        >
          {t("auth.login.createAccount")}
        </button>
      </p>
    </AuthShell>
  );
}

export default LoginForm;
