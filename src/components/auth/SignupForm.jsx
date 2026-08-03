import { useState } from "react";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SocialLogin } from "./SocialLogin";
import { useSignup } from "../../features/authentication/useSignup";
import { AgeGate } from "./AgeGate";
import { AgeBlockScreen } from "./AgeBlockScreen";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import AuthShell from "./AuthShell";
import AuthInput from "./AuthInput";
import AuthCta from "./AuthCta";
import CircleIconButton from "./CircleIconButton";
import RoleCard from "./RoleCard";

// Step sequences per role (D-01: role -> dob-gate -> credentials for BOTH
// branches, so the age gate cannot be dodged by picking Teacher; D-04 removes
// the old pre-gate/pre-credentials steps entirely)
const PARENT_STEPS = ["role", "dob-gate", "credentials"];
const TEACHER_STEPS = ["role", "dob-gate", "credentials"];

const BENEFIT_KEYS = [
  "auth.signup.benefits.games",
  "auth.signup.benefits.progress",
  "auth.signup.benefits.free",
];

/**
 * StepDots — progress indicator showing current position in the wizard.
 * Shows 3 dots for both roles now that both go through the dob-gate (D-01).
 */
function StepDots({ step, role, className = "" }) {
  const steps = role === "teacher" ? TEACHER_STEPS : PARENT_STEPS;
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

  // Step state: 'role' | 'dob-gate' | 'age-block' | 'credentials'
  const [step, setStep] = useState("role");

  // Data collected across steps
  const [role, setRole] = useState(null); // 'parent' | 'teacher' | null

  // Credentials form state (credentials step)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [parentName, setParentName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const { signup, isPending } = useSignup();
  const [error, setError] = useState(null);

  // --- Step navigation handlers ---

  // Step 1: Role selection (D-02) — selection only; `handleRoleContinue`
  // performs the navigation so the card design can show a selected state.
  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleRoleContinue = () => {
    if (!role) return;
    setStep("dob-gate"); // D-01: every role goes through the DOB gate — a
    // minor cannot pick Teacher to dodge the age check
  };

  // Step 2: DOB gate (both roles, D-01). DOB itself is never stored in
  // component state beyond this call (D-09) — AgeGate discards it internally.
  const handleDobSubmit = () => {
    setStep("credentials");
  };

  // Under-18 dead-end (D-10) — no data persisted, no account created.
  const handleUnder18 = () => setStep("age-block");
  const handleTryAgain = () => setStep("dob-gate");

  // The shell owns the single back affordance; each step just names its target.
  const backTargets = {
    role: onBackToLogin,
    "dob-gate": () => setStep("role"),
    "age-block": handleTryAgain,
    credentials: () => setStep("dob-gate"),
  };

  // Credentials form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    if (role === "teacher" && !firstName) return;

    try {
      await signup({
        email,
        password,
        role, // "parent" | "teacher"
        parentName: role === "parent" ? parentName || null : null,
        firstName: role === "teacher" ? firstName : null,
        lastName: role === "teacher" ? lastName || "" : null,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Title and subtitle per step ---
  const STEP_KEYS = {
    role: "role",
    "dob-gate": "dobGate",
    "age-block": "dobGate",
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

      {/* STEP 1: Role Selection (D-01, D-02) */}
      {step === "role" && (
        <div className="flex flex-col gap-3">
          <RoleCard
            selected={role === "parent"}
            onClick={() => handleRoleSelect("parent")}
            tileClassName="from-[#4f46e5] to-[#3b82f6]"
            emoji="🎹"
            label={t("auth.signup.role.parent")}
            description={t("auth.signup.role.parentDesc")}
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

          {/* Entry-screen Privacy link (D-12, SIGNUP-05) — same markup/classes
              as the existing credentials-step Terms/Privacy line below. */}
          <p className="text-center text-[11.5px] leading-[1.5] text-white/50">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 underline transition-colors hover:text-white"
            >
              {t("auth.signup.terms.privacyLink")}
            </a>
          </p>

          {alreadyHaveAccount}
        </div>
      )}

      {/* STEP 2: DOB Gate (both roles, D-01) */}
      {step === "dob-gate" && (
        <AgeGate
          onSubmit={handleDobSubmit}
          onUnder18={handleUnder18}
          disabled={isPending}
        />
      )}

      {/* STEP 2b: Under-18 dead-end (D-10, SIGNUP-02) */}
      {step === "age-block" && (
        <AgeBlockScreen
          onTryAgain={handleTryAgain}
          onBackToLogin={onBackToLogin}
        />
      )}

      {/* STEP 3: Credentials (parent-only fields, D-04/SIGNUP-04) */}
      {step === "credentials" && (
        <>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[14px] short:gap-2.5"
          >
            {role === "teacher" ? (
              <div className="grid grid-cols-2 gap-3">
                <AuthInput
                  id="signup-firstName"
                  type="text"
                  label={t("auth.signup.credentials.firstName")}
                  icon={User}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t(
                    "auth.signup.credentials.firstNamePlaceholder"
                  )}
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
            ) : (
              // Parent path (D-04/SIGNUP-04): optional parent name only —
              // no child first/last name is ever collected.
              <AuthInput
                id="signup-parentName"
                type="text"
                label={t("auth.signup.parentNameLabel")}
                icon={User}
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder={t("auth.signup.parentNameLabel")}
                disabled={isPending}
                autoComplete="name"
              />
            )}

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
                  : "auth.signup.credentials.submitParent"
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

          <SocialLogin mode="signup" role={role || "parent"} />

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
