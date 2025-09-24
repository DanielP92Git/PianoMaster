import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

      // Provide more specific error messages
      if (error.message?.includes("Invalid login credentials")) {
        toast.error(
          "Invalid email or password. Please check your credentials and try again."
        );
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error(
          "Please check your email and click the confirmation link before signing in."
        );
      } else if (error.message?.includes("Too many requests")) {
        toast.error(
          "Too many login attempts. Please wait a moment and try again."
        );
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        toast.error(
          "Connection issue. Please check your internet and try again."
        );
      } else {
        toast.error("Sign in failed. Please try again.");
      }
    },
    retry: 2, // Allow up to 2 retries for network issues
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 2000),
  });

  return { login, isPending };
}
