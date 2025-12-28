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
    <div className="p-3 md:p-4 lg:p-5 relative z-10">
      {/* Title + Subtitle at the top */}
      <div className="text-center mb-3 md:mb-4">
        <h1 className="text-xl md:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient mb-0.5">
          Create Account
        </h1>
        <p className="text-white/90 text-xs">
          Join the musical journey!
        </p>
      </div>

      {/* Two-column layout on desktop */}
      <div className="max-w-4xl lg:max-w-5xl mx-auto">
        {error && (
          <div className="p-2 md:p-3 text-xs md:text-sm text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg mb-3 md:mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Left Column: Form Fields */}
          <div className="flex-1 lg:pr-8">
            <div className="lg:border-r lg:border-white/20 lg:pr-8">
              <form id="signup-form" onSubmit={handleSubmit} className="space-y-2.5 md:space-y-3">
            {/* Role Selection */}
            <div className="space-y-1 md:space-y-1.5">
              <label className="block text-xs font-medium text-white/90">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-1.5 md:p-2 rounded-lg border-2 transition-all duration-300 ${
                    role === "student"
                      ? "border-indigo-500 bg-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5 md:gap-1">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="font-medium text-xs">Student</span>
                    <span className="text-[9px] md:text-[10px] text-center leading-tight">
                      Learn and practice piano
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`p-1.5 md:p-2 rounded-lg border-2 transition-all duration-300 ${
                    role === "teacher"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex flex-col items-center gap-0.5 md:gap-1">
                    <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span className="font-medium text-xs">Teacher</span>
                    <span className="text-[9px] md:text-[10px] text-center leading-tight">
                      Teach and track students
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-2 md:space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="group">
                  <label
                    htmlFor="signup-firstName"
                    className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="signup-firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isPending}
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="group">
                  <label
                    htmlFor="signup-lastName"
                    className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="signup-lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isPending}
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="group">
                <label
                  htmlFor="signup-email"
                  className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full px-2.5 md:px-3 py-1.5 md:py-2 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="group">
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-medium text-white/90 mb-0.5 group-hover:text-indigo-300 transition-colors"
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
                    className="w-full px-2.5 md:px-3 py-1.5 md:py-2 pr-9 md:pr-10 text-sm rounded-lg border-2 border-white/20 bg-white/15 backdrop-blur-sm focus:bg-white/25 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400/50 transition-all duration-300 text-white placeholder-white/70"
                    placeholder="Create a password"
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
            <button
              type="submit"
              form="signup-form"
              disabled={isPending}
              className="w-full h-9 md:h-10 lg:h-11 flex items-center justify-center px-4 text-xs md:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              ) : (
                `Create ${role === "teacher" ? "Teacher" : "Student"} Account`
              )}
            </button>

            <div className="text-center space-y-1.5 md:space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/10">
                    Or join with
                  </span>
                </div>
              </div>

              <div>
                <SocialLogin mode="signup" role={role} />
              </div>
            </div>

            <div className="text-center text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 border border-white/10 inline-block">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Log in
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupForm;
