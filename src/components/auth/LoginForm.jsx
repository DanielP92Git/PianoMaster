import React, { useState, useEffect } from "react";
import { useLogin } from "../../features/authentication/useLogin";
import { useResetPassword } from "../../features/authentication/useResetPassword";
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SocialLogin } from "../../components/auth/SocialLogin";
import SignupForm from "../../components/auth/SignupForm";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import { lockOrientation } from "../../utils/pwa";
import { useTranslation } from "react-i18next";
// import Spinner from "../ui/Spinner";

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
  const isRTL = i18n.dir() === "rtl";
  const isHebrew = i18n.language === "he";
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

  return (
    <div
      className={`relative flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 p-4 ${isHebrew ? "font-hebrew" : ""}`}
      dir={i18n.dir()}
      lang={i18n.language}
    >
      {/* Language toggle */}
      <div className={`absolute top-4 z-20 ${isRTL ? "left-4" : "right-4"}`}>
        <AuthLanguageToggle />
      </div>

      <div className="relative flex h-full w-full max-w-5xl items-center justify-center py-4">
        <div
          className="relative h-[64vh] max-h-[820px] min-h-[520px] w-full max-w-md overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-lg md:h-[66vh] md:max-w-2xl lg:h-[70vh] lg:max-w-5xl"
          style={{
            backgroundImage: 'url("/images/dashboard-hero.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark overlay for better text readability - lighter and more balanced */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-violet-900/60" />

          {isSignup ? (
            <SignupForm onBackToLogin={() => setIsSignup(false)} />
          ) : view === "forgotPassword" || view === "resetSent" ? (
            <div className="relative z-10 flex h-full flex-col items-center justify-center p-3 md:p-4 lg:p-5">
              {view === "forgotPassword" ? (
                /* Forgot Password Email Form */
                <div className="w-full max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      resetMutation();
                    }}
                    className="mb-4 flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                    {t("auth.forgotPassword.backToLogin")}
                  </button>

                  <h2 className="mb-1 text-lg font-semibold text-white">
                    {t("auth.forgotPassword.title")}
                  </h2>

                  <form onSubmit={handleResetSubmit} className="mt-4 space-y-3">
                    <div className="group">
                      <label
                        htmlFor="reset-email"
                        className="mb-0.5 block text-xs font-medium text-white/90 transition-colors group-hover:text-indigo-300"
                      >
                        {t("auth.forgotPassword.emailLabel")}
                      </label>
                      <input
                        type="email"
                        id="reset-email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        disabled={isResetPending}
                        className="w-full rounded-lg border-2 border-white/20 bg-white/15 px-2.5 py-1.5 text-sm text-white placeholder-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400/50 focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 md:px-3 md:py-2"
                        placeholder={t("auth.forgotPassword.emailPlaceholder")}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isResetPending || cooldownSeconds > 0 || !resetEmail
                      }
                      className="flex h-9 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm"
                    >
                      {isResetPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("auth.forgotPassword.submitButton")
                      )}
                    </button>

                    {cooldownSeconds > 0 && (
                      <p className="text-center text-xs text-white/50">
                        {t("auth.forgotPassword.cooldownMessage", {
                          seconds: cooldownSeconds,
                        })}
                      </p>
                    )}
                  </form>
                </div>
              ) : (
                /* Reset Sent Success State */
                <div className="flex w-full max-w-sm flex-col items-center text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-400" />
                  <h2 className="text-center text-lg font-semibold text-white">
                    {t("auth.forgotPassword.successTitle")}
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-center text-sm text-white/70">
                    {t("auth.forgotPassword.successMessage")}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      resetMutation();
                    }}
                    className="mt-4 text-sm font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                  >
                    {t("auth.forgotPassword.backToLogin")}
                  </button>

                  {cooldownSeconds > 0 && (
                    <p className="mt-2 text-xs text-white/50">
                      {t("auth.forgotPassword.cooldownMessage", {
                        seconds: cooldownSeconds,
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex h-full flex-col p-3 md:p-4 lg:p-5">
              {/* Inactivity logout message */}
              {logoutMessage && (
                <div className="mb-3 rounded-lg border border-blue-400/30 bg-blue-500/20 p-3 text-center text-sm text-blue-200 backdrop-blur-sm">
                  {t("auth.login.inactivityLogout")}
                </div>
              )}

              {/* Title + Subtitle at the top (kept pinned to top) */}
              <div className="mb-3 text-center md:mb-4">
                <h1 className="animate-gradient mb-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-xl font-bold text-transparent md:text-2xl lg:text-2xl">
                  PianoMaster
                </h1>
                <p className="text-xs text-white/90">
                  {t("auth.login.subtitle")}
                </p>
              </div>

              {/* Two-column layout on desktop - centered vertically below the title */}
              <div className="flex flex-1 items-center">
                <div className="mx-auto w-full max-w-4xl lg:max-w-5xl">
                  <div className="flex flex-col items-center gap-4 lg:flex-row lg:gap-8">
                    {/* Left Column: Form Fields */}
                    <div className="flex-1 lg:pr-8">
                      <div className="lg:border-r lg:border-white/20 lg:pr-8">
                        <form
                          id="login-form"
                          onSubmit={handleSubmit}
                          className="space-y-2.5 md:space-y-3"
                        >
                          <div className="space-y-2 md:space-y-2.5">
                            <div className="group">
                              <label
                                htmlFor="email"
                                className="mb-0.5 block text-xs font-medium text-white/90 transition-colors group-hover:text-indigo-300"
                              >
                                {t("auth.login.emailLabel")}
                              </label>
                              <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isPending}
                                className="w-full rounded-lg border-2 border-white/20 bg-white/15 px-2.5 py-1.5 text-sm text-white placeholder-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400/50 focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 md:px-3 md:py-2"
                                placeholder={t("auth.login.emailPlaceholder")}
                                required
                              />
                            </div>
                            <div className="group">
                              <label
                                htmlFor="password"
                                className="mb-0.5 block text-xs font-medium text-white/90 transition-colors group-hover:text-indigo-300"
                              >
                                {t("auth.login.passwordLabel")}
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  id="password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  disabled={isPending}
                                  className="w-full rounded-lg border-2 border-white/20 bg-white/15 px-2.5 py-1.5 pr-9 text-sm text-white placeholder-white/70 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400/50 focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 md:px-3 md:py-2 md:pr-10"
                                  placeholder={t(
                                    "auth.login.passwordPlaceholder"
                                  )}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 transition-colors hover:text-white/90 focus:outline-none"
                                  tabIndex={-1}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Forgot password link - right-aligned, subtle */}
                          <div className="mt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setView("forgotPassword");
                                setResetEmail(email);
                                resetMutation();
                              }}
                              className="text-xs text-white/60 transition-colors hover:text-white/90"
                            >
                              {t("auth.forgotPassword.link")}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: Actions and Links */}
                    <div className="flex flex-col justify-start space-y-3 md:space-y-4 lg:min-w-[300px] lg:justify-center lg:pl-0">
                      <form onSubmit={handleSubmit}>
                        <button
                          type="submit"
                          form="login-form"
                          disabled={isPending}
                          className="flex h-9 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm lg:h-11"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                          ) : (
                            t("auth.login.submit")
                          )}
                        </button>
                      </form>

                      <div className="space-y-1.5 text-center md:space-y-2">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-white/80 backdrop-blur-sm">
                              {t("auth.login.orSocial")}
                            </span>
                          </div>
                        </div>

                        <div>
                          <SocialLogin />
                        </div>
                      </div>

                      <div className="pt-1 text-center text-xs">
                        <span className="inline-block rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-white/80 backdrop-blur-sm">
                          {t("auth.login.noAccountPrompt")}{" "}
                          <button
                            type="button"
                            onClick={() => setIsSignup(true)}
                            className="font-medium text-indigo-300 transition-colors hover:text-indigo-200"
                          >
                            {t("auth.login.signupLink")}
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms text pinned near bottom of screen on signup only */}
      {isSignup && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-4">
          <div className="pointer-events-auto max-w-xl rounded-full border border-white/15 bg-white/10 px-3 py-1 text-center text-[11px] text-white/80 backdrop-blur-sm md:text-xs">
            {t("auth.signup.terms.text")}{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-indigo-300"
            >
              {t("auth.signup.terms.termsLink")}
            </a>{" "}
            {t("auth.signup.terms.and")}{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-indigo-300"
            >
              {t("auth.signup.terms.privacyLink")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
