import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { AuthLanguageToggle } from "./AuthLanguageToggle";
import AuthShell from "./AuthShell";
import AuthCta from "./AuthCta";
import BrandTile from "./BrandTile";
import RoleCard from "./RoleCard";

/**
 * Full-screen interrupt for an authenticated user with no profile row — in
 * practice, a new OAuth sign-up. Rendered by AuthenticatedWrapper ahead of the
 * router, so it has no route of its own.
 *
 * There is deliberately no back affordance: the user has a session but no
 * profile, so returning to /login would only bounce them straight back here.
 */
export function RoleSelection({ user, onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation("common");
  const isHebrew = i18n.language?.startsWith("he");
  // Fredoka One has no Hebrew glyphs, so Hebrew headings fall back to an
  // arbitrary system face. Use the app's Hebrew stack at a heavy weight instead.
  const headingFont = isHebrew ? "font-hebrew font-extrabold" : "font-playful";

  const { mutate: createProfile, isPending } = useMutation({
    mutationFn: async (role) => {
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
        const { data, error } = await supabase
          .from("students")
          .insert([
            {
              id: user.id,
              first_name: firstName,
              email: user.email,
              username: `user${Math.random().toString(36).substr(2, 4)}`,
              level: "Beginner",
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedRole) return;
    createProfile(selectedRole);
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
          {heading}
        </div>
      }
    >
      <div className="mb-6 hidden lg:block">{heading}</div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <RoleCard
          selected={selectedRole === "student"}
          onClick={() => setSelectedRole("student")}
          tileClassName="from-[#4f46e5] to-[#3b82f6]"
          emoji="🎹"
          label={t("auth.roleSelection.student")}
          description={t("auth.roleSelection.studentDesc")}
        />
        <RoleCard
          selected={selectedRole === "teacher"}
          onClick={() => setSelectedRole("teacher")}
          tileClassName="from-[#c026d3] to-[#a21caf]"
          emoji="🎓"
          label={t("auth.roleSelection.teacher")}
          description={t("auth.roleSelection.teacherDesc")}
        />

        <AuthCta
          variant="secondary"
          type="submit"
          loading={isPending}
          disabled={!selectedRole}
          className="mt-2"
        >
          {t("auth.roleSelection.continue")}
        </AuthCta>
      </form>
    </AuthShell>
  );
}
