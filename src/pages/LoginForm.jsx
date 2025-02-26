import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../features/authentication/useLogin";
import { Music, Piano, Sparkles, Star, Loader2 } from "lucide-react";
// import Spinner from "../ui/Spinner";

function LoginForm() {
  const [email, setEmail] = useState("pagis.daniel@gmail.com");
  const [password, setPassword] = useState("piano1289");
  const navigate = useNavigate();
  const { login, isPending } = useLogin();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    login({ email, password });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1552422535-c45813c61732?q=80&w=2070&auto=format&fit=crop')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlend: "multiply",
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              opacity: 0.1,
            }}
          >
            <Piano className="w-16 h-16 text-white transform rotate-12" />
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Decorative elements */}
        <div className="absolute -top-6 -left-6 animate-pulse">
          <Star className="w-12 h-12 text-yellow-300 opacity-75" />
        </div>
        <div
          className="absolute -bottom-6 -right-6 animate-pulse"
          style={{ animationDelay: "1s" }}
        >
          <Star className="w-12 h-12 text-purple-300 opacity-75" />
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-8 border border-white/20 transform hover:scale-[1.01] transition-all duration-300">
          <div className="text-center space-y-2">
            <div className="flex justify-center items-center gap-2 relative">
              <Piano
                className="w-12 h-12 text-indigo-400 animate-bounce"
                style={{ animationDuration: "2s" }}
              />
              <Music
                className="w-10 h-10 text-purple-400 animate-bounce"
                style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
              />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-4 right-1/3 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              PianoMaster
            </h1>
            <p className="text-white/80">Begin your musical adventure!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
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
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-12 flex items-center justify-center px-6 text-lg font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "Login"
              )}
            </button>

            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-white/60">
                    Or join with
                  </span>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                {["Google", "Facebook", "Apple"].map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300 transform hover:scale-110 group"
                  >
                    <img
                      src={`https://www.${provider.toLowerCase()}.com/favicon.ico`}
                      alt={provider}
                      className="w-6 h-6 group-hover:animate-pulse"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-white/60">
              New to PianoMaster?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-white/60">
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
    </div>
  );
}

export default LoginForm;
