import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../features/authentication/useLogin";
import {
  Music,
  Piano,
  Sparkles,
  Star,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { SocialLogin } from "../../components/auth/SocialLogin";
import SignupForm from "../../components/auth/SignupForm";
// import Spinner from "../ui/Spinner";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();
  const { login, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password || isPending) return;
    login({ email, password });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements - simplified for landscape */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              opacity: 0.08,
            }}
          >
            <Piano className="w-12 h-12 text-white transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="w-full max-w-5xl h-full flex items-center justify-center relative py-4">
        {/* Decorative elements - positioned for landscape */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Star className="w-8 h-8 text-yellow-300 opacity-75" />
        </div>
        <div
          className="absolute bottom-4 right-4 animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          <Star className="w-8 h-8 text-purple-300 opacity-75" />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 w-full max-h-full overflow-y-auto">
          {isSignup ? (
            <SignupForm onBackToLogin={() => setIsSignup(false)} />
          ) : (
            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
                {/* Left side - Branding */}
                <div className="flex-shrink-0 text-center lg:text-left lg:w-1/3">
                  <div className="flex justify-center lg:justify-start items-center gap-2 relative mb-3">
                    <Piano
                      className="w-10 h-10 text-indigo-400 animate-bounce"
                      style={{ animationDuration: "2s" }}
                    />
                    <Music
                      className="w-8 h-8 text-purple-400 animate-bounce"
                      style={{
                        animationDuration: "2.5s",
                        animationDelay: "0.5s",
                      }}
                    />
                    <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 right-0 animate-pulse" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient mb-2">
                    PianoMaster
                  </h1>
                  <p className="text-white/80 text-sm lg:text-base">Begin your musical adventure!</p>
                </div>

                {/* Right side - Form */}
                <div className="flex-1 w-full lg:w-2/3">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                      <div className="group">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isPending}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div className="group">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                            className="w-full px-4 py-2.5 pr-12 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                            placeholder="Enter your password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors focus:outline-none"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full h-11 flex items-center justify-center px-6 text-base font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Login"
                      )}
                    </button>

                    <div className="text-center space-y-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-transparent text-white/60">
                            Or continue with
                          </span>
                        </div>
                      </div>

                      <div>
                        <SocialLogin />
                      </div>
                    </div>

                    <div className="text-center text-sm text-white/60 pt-2">
                      New to PianoMaster?{" "}
                      <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Create Account
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="mt-4 text-center text-xs text-white/60 border-t border-white/10 pt-4">
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
      </div>
    </div>
  );
}

export default LoginForm;
