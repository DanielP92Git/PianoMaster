import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { useNavigate } from "react-router-dom";

export function useSignup() {
  const navigate = useNavigate();

  const { mutate: signup, isLoading } = useMutation({
    mutationFn: async ({ email, password }) => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          console.log("Supabase error:", error); // Debug log
          // Check for various "user exists" error patterns
          if (
            error.message?.toLowerCase().includes("already exists") ||
            error.message?.toLowerCase().includes("already registered") ||
            error.status === 400
          ) {
            throw new Error(
              "An account with this email already exists. Please log in instead."
            );
          }
          throw new Error(error.message);
        }

        if (!data?.user) {
          throw new Error("Signup failed. Please try again.");
        }

        return data;
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        "Account created successfully! Please check your email to confirm your account."
      );
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { signup, isLoading };
}
