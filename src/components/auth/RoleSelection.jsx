import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { logout } from "../../services/apiAuth";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import AuthShell from "./AuthShell";
import AuthCta from "./AuthCta";
import BrandTile from "./BrandTile";
import RoleCard from "./RoleCard";
import { AgeGate } from "./AgeGate";
import { AgeBlockScreen } from "./AgeBlockScreen";

// Two-step internal flow: role pick, then the 18+ DOB gate (D-05/D-06).
// Mirrors SignupForm's StepDots progress affordance so this reads as one
// continuous step-flow rather than two disconnected screens (UI-SPEC).
const STEPS = ["role", "dob-gate"];

function StepDots({ step, className = "" }) {
  const currentIndex = STEPS.indexOf(step);
  return (
    <div className={`flex gap-2 ${className}`}>
      {STEPS.map((s, i) => (
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

/**
 * Full-screen interrupt for an authenticated user with no profile row — in
 * practice, a new OAuth sign-up. Rendered by AuthenticatedWrapper ahead of the
 * router, so it has no route of its own.
 *
 * Retrofitted (Phase 3, D-05/D-06/D-07) into a gated role -> DOB completion
 * flow: a returning user (has a profile — resolved by getCurrentUser) never
 * reaches this screen. A brand-new user must pick a role, then pass the 18+
 * DOB gate BEFORE any profile row is inserted. An under-18 user is shown the
 * block screen FIRST with their session still intact (WR-01 fix) and is only
 * signed out via logout() on explicit "Back to login" dismissal; no profile
 * row is ever created for them, leaving the Google-created auth.users row
 * profile-less and inert.
 *
 * There is deliberately no back affordance to /login: the user has a session
 * but no profile, so returning to /login would only bounce them straight
 * back here.
 */
export function RoleSelection({ user, onRoleSelected }) {
  const [step, setStep] = useState("role"); // "role" | "dob-gate"
  const [selectedRole, setSelectedRole] = useState(null); // "parent" | "teacher"
  const [blocked, setBlocked] = useState(false);
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation("common");
  const isHebrew = i18n.language?.startsWith("he");
  // Fredoka One has no Hebrew glyphs, so Hebrew headings fall back to an
  // arbitrary system face. Use the app's Hebrew stack at a heavy weight instead.
  const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: async ({ role }) => {
      const firstName =
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "";
      const lastName =
        user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "";

      if (role === "teacher") {
        const { data, error } = await supabase
          .from("teachers")
          .insert([
            {
              id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: user.email,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Parent branch (D-06) — the only insert reachable is downstream of
        // the AgeGate's onSubmit (18+ verified). No child data is written
        // here; the parent row takes only display_name + the age-verified
        // marker (D-09 — the DOB itself is never persisted).
        const { data, error } = await supabase
          .from("parents")
          .insert([
            {
              id: user.id,
              display_name: firstName || null,
              age_verified_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success(t("auth.roleSelection.successMessage"));
      // Invalidate user query to refetch with new profile
      queryClient.invalidateQueries({ queryKey: ["user"] });
      onRoleSelected && onRoleSelected();
    },
    onError: (error) => {
      toast.error(t("auth.roleSelection.errorGeneric"));
      console.error("Profile creation error:", error);
    },
  });

  const handleRoleContinue = () => {
    if (!selectedRole) return;
    setStep("dob-gate"); // D-05: every new OAuth account must pass the DOB gate
  };

  const handleDobSubmit = () => {
    // D-09: the DOB itself is discarded here — only the 18+ pass/fail result
    // (already evaluated inside AgeGate) reaches this callback.
    createProfile({ role: selectedRole });
  };

  const handleUnder18 = () => {
    // WR-01 fix: show the block screen FIRST, with the session still intact.
    // A pure state update (mirroring SignupForm's reliable email path) keeps
    // AuthenticatedWrapper (App.jsx:202) matching `user && !profile && !userRole`,
    // so this component — and the AgeBlockScreen below — stays mounted. The
    // sign-out is deferred to handleBackToLogin so the resulting SIGNED_OUT →
    // ["user"] invalidation → unmount/redirect chain can't race the screen off
    // the page before the under-18 user reads the guidance (SIGNUP-02).
    // No profile row is ever inserted, so no account is created for them.
    setBlocked(true);
  };

  const handleTryAgain = () => {
    setBlocked(false);
    setStep("dob-gate");
  };

  const handleBackToLogin = async () => {
    // D-07: sign out via the project's logout() wrapper (not raw signOut) so
    // the blocked under-18 session leaves no trace on a shared device. Deferred
    // to this explicit dismissal (WR-01 fix): the SIGNED_OUT event invalidates
    // the ["user"] query, which unmounts this screen and lets ProtectedRoute
    // redirect to /login — now AFTER the user has seen the guidance, not before.
    await logout();
  };

  const heading = (
    <>
      <h1 className={`text-[26px] text-white short:text-[22px] ${headingFont}`}>
        {t("auth.roleSelection.title")}
      </h1>
      <p className="mt-1 text-[14px] text-white/[0.82] short:text-[13px]">
        {t("auth.roleSelection.subtitle")}
      </p>
    </>
  );

  const desktopHero = (
    <>
      <div className="flex items-center gap-[14px]">
        <BrandTile className="h-[52px] w-[52px]" emojiClassName="text-[26px]" />
        <span className="font-playful text-[26px] text-white">PianoMaster</span>
      </div>
      <div>
        <h2
          className={`max-w-[380px] text-[44px] leading-[1.1] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.4)] ${headingFont}`}
        >
          {t("auth.brand.tagline")}
        </h2>
        <p className="mt-4 max-w-[360px] text-[17px] leading-[1.55] text-white/[0.82]">
          {t("auth.signup.desktopSubcopy")}
        </p>
      </div>
    </>
  );

  return (
    <AuthShell
      scrim="signup"
      topEnd={<AuthLanguageToggle />}
      desktopHero={desktopHero}
      sheetClassName="gap-[14px] short:gap-2.5"
      mobileHero={
        <div className="flex w-full flex-col items-center px-8 text-center">
          <BrandTile
            className="mb-4 h-16 w-16 short:mb-2 short:h-12 short:w-12"
            emojiClassName="text-[32px] leading-none short:text-[24px]"
          />
          {!blocked && <StepDots step={step} className="mb-3 justify-center" />}
          {heading}
        </div>
      }
    >
      <div className="mb-6 hidden lg:block">
        {!blocked && <StepDots step={step} className="mb-4 justify-start" />}
        {heading}
      </div>

      {blocked ? (
        <AgeBlockScreen
          onTryAgain={handleTryAgain}
          onBackToLogin={handleBackToLogin}
        />
      ) : step === "role" ? (
        <div className="flex flex-col gap-3">
          <RoleCard
            selected={selectedRole === "parent"}
            onClick={() => setSelectedRole("parent")}
            tileClassName="from-[#4f46e5] to-[#3b82f6]"
            emoji="🎹"
            label={t("auth.signup.role.parent")}
            description={t("auth.signup.role.parentDesc")}
          />
          <RoleCard
            selected={selectedRole === "teacher"}
            onClick={() => setSelectedRole("teacher")}
            tileClassName="from-[#c026d3] to-[#a21caf]"
            emoji="🎓"
            label={t("auth.signup.role.teacher")}
            description={t("auth.signup.role.teacherDesc")}
          />

          <AuthCta
            variant="secondary"
            onClick={handleRoleContinue}
            disabled={!selectedRole}
            className="mt-2"
          >
            {t("auth.signup.role.continue")}
          </AuthCta>
        </div>
      ) : (
        <AgeGate
          onSubmit={handleDobSubmit}
          onUnder18={handleUnder18}
          disabled={isPending}
        />
      )}
    </AuthShell>
  );
}
