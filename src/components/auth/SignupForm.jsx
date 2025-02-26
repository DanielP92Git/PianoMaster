import { useState } from "react";
import { Music, Piano, Sparkles, Loader2 } from "lucide-react";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";

function SignupForm({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isPending } = useSignup();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;

    try {
      await signup({ email, password });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
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
          Create Account
        </h1>
        <p className="text-white/80">Join the musical journey!</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="group">
            <label
              htmlFor="signup-email"
              className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
            >
              Email
            </label>
            <input
              type="email"
              id="signup-email"
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
              htmlFor="signup-password"
              className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
            >
              Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
              placeholder="Create a password"
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
            "Create Account"
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

          <div className="mt-6">
            <SocialLogin mode="signup" />
          </div>
        </div>

        <div className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Log in
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupForm;
