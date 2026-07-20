import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";
import { useSocialAuth } from "../../features/authentication/useSocialAuth";
import AuthCta from "./AuthCta";

export function SocialLogin({ mode = "login", role = "student" }) {
  const { socialAuth, isPending } = useSocialAuth();
  const { t } = useTranslation("common");

  return (
    <AuthCta
      variant="ghost"
      loading={isPending}
      onClick={() => socialAuth({ provider: "google", mode, role })}
    >
      <FcGoogle className="h-5 w-5" aria-hidden="true" />
      <span className="whitespace-nowrap">
        {t(
          mode === "signup" ? "auth.signup.social.google" : "auth.login.google"
        )}
      </span>
    </AuthCta>
  );
}
