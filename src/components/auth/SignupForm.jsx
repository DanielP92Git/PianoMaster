import { useState } from "react";
import {
  Music,
  Piano,
  Sparkles,
  Loader2,
  Users,
  GraduationCap,
} from "lucide-react";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";

function SignupForm({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("student"); // Default to student
  const { signup, isPending } = useSignup();
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !firstName) return;

    try {
      await signup({
        email,
        password,
        firstName,
        lastName: lastName || "",
        role,
      });
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
        {/* Role Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/90 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                role === "student"
                  ? "border-indigo-500 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="font-medium">Student</span>
                <span className="text-xs text-center">
                  Learn and practice piano
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                role === "teacher"
                  ? "border-purple-500 bg-purple-500/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                <span className="font-medium">Teacher</span>
                <span className="text-xs text-center">
                  Teach and track students
                </span>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label
                htmlFor="signup-firstName"
                className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
              >
                First Name
              </label>
              <input
                type="text"
                id="signup-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isPending}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="group">
              <label
                htmlFor="signup-lastName"
                className="block text-sm font-medium text-white/90 mb-1 group-hover:text-indigo-300 transition-colors"
              >
                Last Name
              </label>
              <input
                type="text"
                id="signup-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isPending}
                className="w-full px-4 py-3 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                placeholder="Enter your last name"
              />
            </div>
          </div>
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
            `Create ${role === "teacher" ? "Teacher" : "Student"} Account`
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
            <SocialLogin mode="signup" role={role} />
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
