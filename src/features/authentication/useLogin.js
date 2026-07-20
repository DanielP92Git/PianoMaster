import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { authErrorKey } from "./authErrorKey";

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const { mutate: login, isPending } = useMutation({
    mutationFn: ({ email, password }) => loginApi({ email, password }),
    onSuccess: (data) => {
      // Clear any existing user data first
      queryClient.removeQueries({ queryKey: ["user"] });

      // Set the new user data
      queryClient.setQueryData(["user"], data.user);

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error(t(authErrorKey(error, "auth.errors.signInFailed")));
    },
    retry: 2, // Allow up to 2 retries for network issues
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000),
  });

  return { login, isPending };
}
