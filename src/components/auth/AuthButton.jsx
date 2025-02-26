import { Link } from "react-router-dom";
import { useUser } from "../../features/authentication/useUser";
import { useLogout } from "../../features/authentication/useLogout";
import { Loader2, LogOut } from "lucide-react";

function AuthButton({ className }) {
  const { isAuthenticated } = useUser();
  const { logout, isPending } = useLogout();

  if (isAuthenticated)
    return (
      <button onClick={logout} disabled={isPending} className={className}>
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Log out</span>
          </>
        )}
      </button>
    );

  return (
    <div className="space-y-4">
      <Link to="/login" className={className}>
        Log in
      </Link>
    </div>
  );
}

export default AuthButton;
