import { useState } from "react";
import {
  Music,
  Piano,
  Sparkles,
  Loader2,
  Users,
  GraduationCap,
  Eye,
  EyeOff,
} from "lucide-react";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";

function SignupForm({ onBackToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left side - Hero Image with Branding */}
        <div className="flex-shrink-0 text-center lg:text-left lg:w-1/3 relative">
          {/* Hero Image */}
          <div className="relative mb-4 rounded-xl overflow-hidden">
            <img
              src="/images/dashboard-hero.png"
              alt="PianoMaster"
              className="w-full h-auto object-cover rounded-xl shadow-lg"
              style={{ maxHeight: "400px" }}
            />
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent rounded-xl pointer-events-none" />
          </div>
          
          {/* Branding Text */}
          <div className="flex justify-center lg:justify-start items-center gap-2 relative mb-3">
            <Piano
              className="w-10 h-10 text-indigo-400 animate-bounce"
              style={{ animationDuration: "2s" }}
            />
            <Music
              className="w-8 h-8 text-purple-400 animate-bounce"
              style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
            />
            <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 right-0 animate-pulse" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient mb-2">
            Create Account
          </h1>
          <p className="text-white/80 text-sm lg:text-base">
            Join the musical journey!
          </p>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 w-full lg:w-2/3">
          {error && (
            <div className="p-3 text-sm text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/90">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    role === "student"
                      ? "border-indigo-500 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Users className="w-5 h-5" />
                    <span className="font-medium text-sm">Student</span>
                    <span className="text-xs text-center">
                      Learn and practice piano
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    role === "teacher"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <GraduationCap className="w-5 h-5" />
                    <span className="font-medium text-sm">Teacher</span>
                    <span className="text-xs text-center">
                      Teach and track students
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
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
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
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
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full px-4 py-2.5 pr-12 rounded-xl border-2 border-white/10 bg-white/5 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Create a password"
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
                `Create ${role === "teacher" ? "Teacher" : "Student"} Account`
              )}
            </button>

            <div className="text-center space-y-3">
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

              <div>
                <SocialLogin mode="signup" role={role} />
              </div>
            </div>

            <div className="text-center text-sm text-white/60 pt-2">
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
  );
}

export default SignupForm;
