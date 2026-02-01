import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../features/authentication/useLogin";
import {
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { SocialLogin } from "../../components/auth/SocialLogin";
import SignupForm from "../../components/auth/SignupForm";
import { lockOrientation } from "../../utils/pwa";
import { useTranslation } from "react-i18next";
// import Spinner from "../ui/Spinner";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(null);
  const navigate = useNavigate();
  const { login, isPending } = useLogin();
  const { t } = useTranslation("common");

  useEffect(() => {
    lockOrientation("portrait-primary");
  }, []);

  // Check if user was logged out due to inactivity
  useEffect(() => {
    const reason = sessionStorage.getItem('logoutReason');
    if (reason === 'inactivity') {
      setLogoutMessage(t('auth.login.inactivityLogout', 'You were logged out due to inactivity'));
      sessionStorage.removeItem('logoutReason');
    }
  }, [t]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || isPending) return;
    login({ email, password });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-5xl h-full flex items-center justify-center relative py-4">
        <div
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md md:max-w-2xl lg:max-w-5xl relative overflow-hidden h-[64vh] md:h-[66vh] lg:h-[70vh] max-h-[820px] min-h-[520px]"
          style={{
            backgroundImage: 'url("/images/dashboard-hero.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Dark overlay for better text readability - lighter and more balanced */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/50 to-violet-900/60 rounded-2xl pointer-events-none" />

          {isSignup ? (
            <SignupForm onBackToLogin={() => setIsSignup(false)} />
          ) : (
            <div className="p-3 md:p-4 lg:p-5 relative z-10 h-full flex flex-col">
              {/* Inactivity logout message */}
              {logoutMessage && (
                <div className="mb-3 p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 text-sm text-center backdrop-blur-sm">
                  {logoutMessage}
                </div>
              )}

              {/* Title + Subtitle at the top (kept pinned to top) */}
              <div className="text-center mb-3 md:mb-4">
                <h1 className="text-xl md:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient mb-0.5">
                  PianoMaster
                </h1>
                <p className="text-white/90 text-xs">
                  {t("auth.login.subtitle")}
                </p>
              </div>

              {/* Two-column layout on desktop - centered vertically below the title */}
              <div className="flex-1 flex items-center">
                <div className="max-w-4xl lg:max-w-5xl mx-auto w-full">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-center">
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
                                className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
                              >
                                {t("auth.login.emailLabel")}
                              </label>
                              <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isPending}
                                className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                                placeholder={t("auth.login.emailPlaceholder")}
                                required
                              />
                            </div>
                            <div className="group">
                              <label
                                htmlFor="password"
                                className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
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
                                  className="w-full px-2.5 md:px-3 py-1.5 md:py-2 pr-9 md:pr-10 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                                  placeholder={t(
                                    "auth.login.passwordPlaceholder"
                                  )}
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors focus:outline-none"
                                  tabIndex={-1}
                                >
                                  {showPassword ? (
                                    <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Right Column: Actions and Links */}
                    <div className="flex flex-col justify-start lg:justify-center space-y-3 md:space-y-4 lg:min-w-[300px] lg:pl-0">
                      <form onSubmit={handleSubmit}>
                        <button
                          type="submit"
                          form="login-form"
                          disabled={isPending}
                          className="w-full h-9 md:h-10 lg:h-11 flex items-center justify-center px-4 text-xs md:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                          ) : (
                            t("auth.login.submit")
                          )}
                        </button>
                      </form>

                      <div className="text-center space-y-1.5 md:space-y-2">
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/10">
                              {t("auth.login.orSocial")}
                            </span>
                          </div>
                        </div>

                        <div>
                          <SocialLogin />
                        </div>
                      </div>

                      <div className="text-center text-xs pt-1">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/10 inline-block">
                          {t("auth.login.noAccountPrompt")}{" "}
                          <button
                            type="button"
                            onClick={() => setIsSignup(true)}
                            className="font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
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

      {/* Terms text pinned to bottom of screen on signup only */}
      {isSignup && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto max-w-xl text-center text-[11px] md:text-xs text-white/80 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-3 py-1">
            By joining, you agree to our{" "}
            <a
              href="#"
              className="underline hover:text-indigo-300 transition-colors"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="underline hover:text-indigo-300 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
