import Spinner from "../../ui/Spinner";
import { useLogout } from "./useLogout";

function Logout() {
  const { logout, isPending } = useLogout();

  return (
    <>
      {isPending ? (
        <Spinner />
      ) : (
        <button
          onClick={logout}
          disabled={isPending}
          className="w-full flex items-center justify-center p-3 bg-purple-500 text-gray-100 rounded-lg hover:bg-purple-400"
        >
          Log out
        </button>
      )}
    </>
  );
}

export default Logout;
