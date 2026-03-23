import { useState } from "react";
import {
  Loader2,
  Users,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";
import { AgeGate } from "./AgeGate";
import { ParentEmailStep } from "./ParentEmailStep";

// Step sequences per role (D-01, D-02, D-03)
const STUDENT_STEPS = ["role", "birth-year", "parent-email", "credentials"];
const TEACHER_STEPS = ["role", "credentials"];

/**
 * StepDots — progress indicator showing current position in the wizard.
 * Shows 4 dots for students, 2 for teachers.
 * Before role is selected, optimistically shows 4 dots (common student path).
 */
function StepDots({ step, role }) {
  const steps = role === "teacher" ? TEACHER_STEPS : STUDENT_STEPS;
  const currentIndex = steps.indexOf(step);
  return (
    <div className="flex justify-center gap-2 mb-4">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i === currentIndex
              ? "bg-indigo-400 scale-125"
              : i < currentIndex
              ? "bg-indigo-400/50"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

function SignupForm({ onBackToLogin }) {
  // Step state: 'role' | 'birth-year' | 'parent-email' | 'credentials'
  const [step, setStep] = useState("role");

  // Data collected across steps
  const [role, setRole] = useState(null); // 'student' | 'teacher' | null
  const [birthYear, setBirthYear] = useState(null); // integer | null
  const [parentEmail, setParentEmail] = useState(null); // string | null

  // Credentials form state (credentials step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { signup, isPending } = useSignup();
  const [error, setError] = useState(null);

  // Derived: is the student under 13? (per D-10 January 1st convention)
  const isUnder13 = birthYear != null && (new Date().getFullYear() - birthYear) < 13;

  // --- Step navigation handlers ---

  // Step 1: Role selection (D-02, D-03)
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    // Reset downstream state when role changes (pitfall 1 from RESEARCH.md)
    setBirthYear(null);
    setParentEmail(null);
    if (selectedRole === "teacher") {
      setStep("credentials"); // D-03: teachers skip birth year + parent email
    } else {
      setStep("birth-year"); // D-02: students go to birth year
    }
  };

  // Step 2: Birth year (students only, D-02)
  const handleBirthYearSubmit = (year) => {
    setBirthYear(year);
    const under13 = (new Date().getFullYear() - year) < 13;
    if (under13) {
      setStep("parent-email"); // D-07: under-13 sees parent email step
    } else {
      setStep("credentials"); // 13+ skips parent email
    }
  };

  // Step 3: Parent email (under-13 students only, D-06, D-07)
  const handleParentEmailSubmit = (parentEmailValue) => {
    setParentEmail(parentEmailValue);
    setStep("credentials");
  };

  const handleParentEmailSkip = () => {
    setParentEmail(null); // D-07: skip sets null
    setStep("credentials");
  };

  // Back navigation (D-04)
  const handleBackFromCredentials = () => {
    if (role === "teacher") {
      setStep("role"); // Teacher: back to role
    } else if (isUnder13) {
      setStep("parent-email"); // Under-13 student: back to parent email
    } else {
      setStep("birth-year"); // 13+ student: back to birth year
    }
  };

  // Credentials form submit
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
        role: role || "student",
        birthYear: role === "teacher" ? null : birthYear, // D-15: teachers have no birth year
        parentEmail: parentEmail || null,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Title and subtitle per step ---
  const getTitle = () => {
    switch (step) {
      case "role":
        return "Join PianoMaster!";
      case "birth-year":
        return "Let's Get Started";
      case "parent-email":
        return "Almost There!";
      case "credentials":
      default:
        return "Create Account";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "role":
        return "How will you use PianoMaster?";
      case "birth-year":
        return "Tell us a bit about yourself";
      case "parent-email":
        return "One more optional step";
      case "credentials":
      default:
        return "Join the musical journey!";
    }
  };

  return (
    <div className="p-3 md:p-4 lg:p-5 relative z-10">
      {/* Step dots progress indicator (D-01) */}
      <StepDots step={step} role={role} />

      {/* Title + Subtitle */}
      <div className="text-center mb-3 md:mb-4">
        <h1 className="text-xl md:text-2xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient mb-0.5">
          {getTitle()}
        </h1>
        <p className="text-white/90 text-xs">{getSubtitle()}</p>
      </div>

      {/* Step-based rendering */}
      <div className="max-w-4xl lg:max-w-5xl mx-auto">
        {/* STEP 1: Role Selection (D-01, D-02, D-03) */}
        {step === "role" && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleRoleSelect("student")}
                className="w-full p-3 md:p-4 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-indigo-400/50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Users className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <span className="font-medium text-sm text-white block">
                      Student
                    </span>
                    <span className="text-xs text-white/60">
                      Learn and practice piano
                    </span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect("teacher")}
                className="w-full p-3 md:p-4 rounded-xl border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <GraduationCap className="w-5 h-5 text-purple-300" />
                  </div>
                  <div>
                    <span className="font-medium text-sm text-white block">
                      Teacher
                    </span>
                    <span className="text-xs text-white/60">
                      Teach and track students
                    </span>
                  </div>
                </div>
              </button>
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
        )}

        {/* STEP 2: Birth Year (students only, D-02) */}
        {step === "birth-year" && (
          <div className="max-w-md mx-auto">
            <AgeGate
              onSubmit={handleBirthYearSubmit}
              onBack={() => setStep("role")}
              disabled={isPending}
            />
          </div>
        )}

        {/* STEP 3: Parent Email (under-13 students only, D-06, D-07) */}
        {step === "parent-email" && (
          <div className="max-w-md mx-auto">
            <ParentEmailStep
              onSubmit={handleParentEmailSubmit}
              onSkip={handleParentEmailSkip}
              onBack={() => setStep("birth-year")}
              disabled={isPending}
            />
          </div>
        )}

        {/* STEP 4: Credentials + Name (D-08, D-09) */}
        {step === "credentials" && (
          <>
            {error && (
              <div className="p-2 md:p-3 text-xs md:text-sm text-red-200 bg-red-500/10 border border-red-200/20 rounded-lg mb-3 md:mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              {/* Left Column: Form Fields */}
              <div className="flex-1 lg:pr-8">
                <div className="lg:border-r lg:border-white/20 lg:pr-8">
                  <form
                    id="signup-form"
                    onSubmit={handleSubmit}
                    className="space-y-2.5 md:space-y-3"
                  >
                    {/* Back button (D-04) */}
                    <button
                      type="button"
                      onClick={handleBackFromCredentials}
                      className="flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors mb-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

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

                {/* Google OAuth (D-08, D-09) */}
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
                    <SocialLogin mode="signup" role={role || "student"} />
                  </div>
                </div>

                <p className="text-center text-[10px] text-white/50 leading-snug px-2">
                  By signing up, you agree to our{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200 underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200 underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>

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
          </>
        )}
      </div>
    </div>
  );
}

export default SignupForm;
