import { FcGoogle } from "react-icons/fc";
import { useSocialAuth } from "../../features/authentication/useSocialAuth";

export function SocialLogin({ mode = "login", role = "student" }) {
  const { socialAuth, isPending } = useSocialAuth();

  const handleSocialAuth = (provider) => {
    socialAuth({ provider, mode, role });
  };

  return (
    <div className="space-y-4">
      <div className="text-center"></div>

      <div className="flex justify-center">
        <button
          onClick={() => handleSocialAuth("google")}
          disabled={isPending}
          className="flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-3 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
