import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, AlertCircle } from "lucide-react";
import { useUpdatePassword } from "../features/authentication/useUpdatePassword";
import { useTranslation } from "react-i18next";
import supabase from "../services/supabase";

const SESSION_TIMEOUT_MS = 3000;

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation("common");
  const { updatePassword, isPending, isSuccess } = useUpdatePassword();

  // Detect recovery session from Supabase auth
  useEffect(() => {
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

  // Expired/invalid link state
  if (isExpired && !isSessionReady) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6 md:p-8 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-white mb-2">
            {t("auth.resetPassword.title")}
          </h1>
          <p className="text-white/70 text-sm mb-6">
            {t("auth.resetPassword.errorExpiredLink")}
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-indigo-300 hover:text-indigo-200 text-sm font-medium transition-colors"
          >
            {t("auth.forgotPassword.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  // Loading state while waiting for session detection
  if (!isSessionReady) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-w-md p-6 md:p-8">
        <Lock className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white text-center mb-6">
          {t("auth.resetPassword.title")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Field */}
          <div className="group">
            <label
              htmlFor="new-password"
              className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
            >
              {t("auth.resetPassword.newPasswordLabel")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidationError(null);
                }}
                disabled={isPending || isSuccess}
                className="w-full px-2.5 md:px-3 py-1.5 md:py-2 pr-9 md:pr-10 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
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

          {/* Confirm Password Field */}
          <div className="group">
            <label
              htmlFor="confirm-password"
              className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
            >
              {t("auth.resetPassword.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setValidationError(null);
                }}
                disabled={isPending || isSuccess}
                className="w-full px-2.5 md:px-3 py-1.5 md:py-2 pr-9 md:pr-10 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {validationError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isSuccess || (!password && !confirmPassword)}
            className="w-full h-9 md:h-10 flex items-center justify-center px-4 text-xs md:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("auth.resetPassword.submitButton")
            )}
          </button>
        </form>

        {/* Back to login link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-white/60 hover:text-white/90 text-sm transition-colors"
          >
            {t("auth.forgotPassword.backToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
