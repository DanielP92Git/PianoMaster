import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";
import { AgeGate } from "./AgeGate";
import { ParentEmailStep } from "./ParentEmailStep";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import AuthShell from "./AuthShell";
import AuthInput from "./AuthInput";
import AuthCta from "./AuthCta";
import CircleIconButton from "./CircleIconButton";
import RoleCard from "./RoleCard";

// Step sequences per role (D-01, D-02, D-03)
const STUDENT_STEPS = ["role", "birth-year", "parent-email", "credentials"];
const TEACHER_STEPS = ["role", "credentials"];

const BENEFIT_KEYS = [
  "auth.signup.benefits.games",
  "auth.signup.benefits.progress",
  "auth.signup.benefits.free",
];

/**
 * StepDots — progress indicator showing current position in the wizard.
 * Shows 4 dots for students, 2 for teachers.
 * Before role is selected, optimistically shows 4 dots (common student path).
 */
function StepDots({ step, role, className = "" }) {
  const steps = role === "teacher" ? TEACHER_STEPS : STUDENT_STEPS;
  const currentIndex = steps.indexOf(step);
  return (
    <div className={`flex gap-2 ${className}`}>
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            i === currentIndex
              ? "scale-125 bg-indigo-400"
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
  const { t, i18n } = useTranslation("common");
  // `startsWith` rather than `=== "he"` — a strict match breaks for `he-IL`.
  const isHebrew = i18n.language?.startsWith("he");
  // Fredoka One has no Hebrew glyphs, so Hebrew headings fall back to an
  // arbitrary system face. Use the app's Hebrew stack at a heavy weight instead.
  const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";

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
  const isUnder13 =
    birthYear != null && new Date().getFullYear() - birthYear < 13;

  // --- Step navigation handlers ---

  // Step 1: Role selection (D-02, D-03) — selection only; `handleRoleContinue`
  // performs the navigation so the card design can show a selected state.
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    // Reset downstream state when role changes (pitfall 1 from RESEARCH.md)
    setBirthYear(null);
    setParentEmail(null);
  };

  const handleRoleContinue = () => {
    if (!role) return;
    if (role === "teacher") {
      setStep("credentials"); // D-03: teachers skip birth year + parent email
    } else {
      setStep("birth-year"); // D-02: students go to birth year
    }
  };

  // Step 2: Birth year (students only, D-02)
  const handleBirthYearSubmit = (year) => {
    setBirthYear(year);
    const under13 = new Date().getFullYear() - year < 13;
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

  // The shell owns the single back affordance; each step just names its target.
  const backTargets = {
    role: onBackToLogin,
    "birth-year": () => setStep("role"),
    "parent-email": () => setStep("birth-year"),
    credentials: handleBackFromCredentials,
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
  const STEP_KEYS = {
    role: "role",
    "birth-year": "birthYear",
    "parent-email": "parentEmail",
    credentials: "credentials",
  };
  const stepKey = STEP_KEYS[step] || "credentials";
  const title = t(`auth.signup.titles.${stepKey}`);
  const subtitle = t(`auth.signup.subtitles.${stepKey}`);

  const alreadyHaveAccount = (
    <p className="text-center text-sm text-white/70">
      {t("auth.signup.alreadyHaveAccount")}{" "}
      <button
        type="button"
        onClick={onBackToLogin}
        className="font-semibold text-[#93c5fd] transition-colors hover:text-white"
      >
        {t("auth.signup.logIn")}
      </button>
    </p>
  );

  const desktopHero = (
    <>
      <div className="flex items-center gap-[14px]">
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#c026d3] shadow-[0_8px_24px_rgba(192,38,211,0.5)] motion-safe:animate-pmfloat"
          aria-hidden="true"
        >
          <span className="text-[26px]">🎹</span>
        </div>
        <span className="font-playful text-[26px] text-white">PianoMaster</span>
      </div>
      <div>
        <h2
          className={`max-w-[380px] text-[44px] leading-[1.1] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.4)] ${headingFont}`}
        >
          {t("auth.signup.desktopHeadline")}
        </h2>
        <p className="mt-4 max-w-[360px] text-[17px] leading-[1.55] text-white/[0.82]">
          {t("auth.signup.desktopSubcopy")}
        </p>
        <ul className="mt-[30px] flex flex-col gap-3">
          {BENEFIT_KEYS.map((key) => (
            <li
              key={key}
              className="flex items-center gap-3 text-[15px] text-white/90"
            >
              <Check
                className="h-5 w-5 shrink-0 text-[#86efac]"
                strokeWidth={2.4}
                aria-hidden="true"
              />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <AuthShell
      scrim="signup"
      sheetClassName="gap-[14px] short:gap-2.5"
      topStart={
        <CircleIconButton
          onClick={backTargets[step]}
          label={t("auth.signup.back")}
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
        </CircleIconButton>
      }
      topEnd={<AuthLanguageToggle />}
      desktopHero={desktopHero}
      mobileHero={
        <div className="flex w-full flex-col items-center px-8 text-center">
          <StepDots step={step} role={role} className="justify-center" />
          <h1
            className={`mt-4 text-[26px] text-white short:mt-2 short:text-[22px] ${headingFont}`}
          >
            {title}
          </h1>
          <p className="mt-0.5 text-[14px] text-white/[0.82] short:text-[13px]">
            {subtitle}
          </p>
        </div>
      }
    >
      {/* Desktop repeats the step heading inside the form column */}
      <div className="mb-6 hidden lg:block">
        <StepDots step={step} role={role} className="justify-start" />
        <h1 className={`mt-4 text-[30px] text-white ${headingFont}`}>
          {title}
        </h1>
        <p className="mt-1 text-[15px] text-white/60">{subtitle}</p>
      </div>

      {error && (
        <div className="rounded-[14px] border border-red-300/25 bg-red-500/15 p-3 text-[13px] text-red-100">
          {error}
        </div>
      )}

      {/* STEP 1: Role Selection (D-01, D-02, D-03) */}
      {step === "role" && (
        <div className="flex flex-col gap-3">
          <RoleCard
            selected={role === "student"}
            onClick={() => handleRoleSelect("student")}
            tileClassName="from-[#4f46e5] to-[#3b82f6]"
            emoji="🎹"
            label={t("auth.signup.role.student")}
            description={t("auth.signup.role.studentDesc")}
          />
          <RoleCard
            selected={role === "teacher"}
            onClick={() => handleRoleSelect("teacher")}
            tileClassName="from-[#c026d3] to-[#a21caf]"
            emoji="🎓"
            label={t("auth.signup.role.teacher")}
            description={t("auth.signup.role.teacherDesc")}
          />

          <AuthCta
            variant="secondary"
            onClick={handleRoleContinue}
            disabled={!role}
            className="mt-1"
          >
            {t("auth.signup.role.continue")}
          </AuthCta>

          {alreadyHaveAccount}
        </div>
      )}

      {/* STEP 2: Birth Year (students only, D-02) */}
      {step === "birth-year" && (
        <AgeGate onSubmit={handleBirthYearSubmit} disabled={isPending} />
      )}

      {/* STEP 3: Parent Email (under-13 students only, D-06, D-07) */}
      {step === "parent-email" && (
        <ParentEmailStep
          onSubmit={handleParentEmailSubmit}
          onSkip={handleParentEmailSkip}
          disabled={isPending}
        />
      )}

      {/* STEP 4: Credentials + Name (D-08, D-09) */}
      {step === "credentials" && (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[14px] short:gap-2.5"
          >
            <div className="grid grid-cols-2 gap-3">
              <AuthInput
                id="signup-firstName"
                type="text"
                label={t("auth.signup.credentials.firstName")}
                icon={User}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("auth.signup.credentials.firstNamePlaceholder")}
                disabled={isPending}
                autoComplete="given-name"
                required
              />
              <AuthInput
                id="signup-lastName"
                type="text"
                label={t("auth.signup.credentials.lastName")}
                icon={User}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("auth.signup.credentials.lastNamePlaceholder")}
                disabled={isPending}
                autoComplete="family-name"
              />
            </div>

            <AuthInput
              id="signup-email"
              type="email"
              label={t("auth.signup.credentials.email")}
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.signup.credentials.emailPlaceholder")}
              disabled={isPending}
              autoComplete="email"
              required
            />

            <AuthInput
              id="signup-password"
              type={showPassword ? "text" : "password"}
              label={t("auth.signup.credentials.password")}
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.signup.credentials.passwordPlaceholder")}
              disabled={isPending}
              autoComplete="new-password"
              required
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={t(
                    showPassword
                      ? "auth.login.hidePassword"
                      : "auth.login.showPassword"
                  )}
                  className="flex text-white/55 transition-colors hover:text-white focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              }
            />

            <AuthCta variant="secondary" type="submit" loading={isPending}>
              {t(
                role === "teacher"
                  ? "auth.signup.credentials.submitTeacher"
                  : "auth.signup.credentials.submitStudent"
              )}
            </AuthCta>
          </form>

          <div className="my-0.5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/15" />
            <span className="text-xs font-medium text-white/50">
              {t("auth.signup.social.divider")}
            </span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <SocialLogin mode="signup" role={role || "student"} />

          {alreadyHaveAccount}

          <p className="text-center text-[11.5px] leading-[1.5] text-white/50">
            {t("auth.signup.terms.text")}{" "}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 underline transition-colors hover:text-white"
            >
              {t("auth.signup.terms.termsLink")}
            </a>{" "}
            {t("auth.signup.terms.and")}{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 underline transition-colors hover:text-white"
            >
              {t("auth.signup.terms.privacyLink")}
            </a>
          </p>
        </>
      )}
    </AuthShell>
  );
}

export default SignupForm;
