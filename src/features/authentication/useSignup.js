import { useMutation } from "@tanstack/react-query";
import { signup as signupApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useSignup() {
  const navigate = useNavigate();

  const { mutate: signup, isPending } = useMutation({
    mutationFn: signupApi,
    onSuccess: (user) => {
      toast.success(
        "Account created successfully! Please check your email to confirm your account."
      );
      navigate("/");
    },
    onError: (err) => {
      if (err.message.includes("already exists")) {
        toast.error(err.message, {
          duration: 5000,
          icon: "⚠️",
        });
      } else {
        toast.error("Failed to create account. Please try again.");
      }
    },
  });

  return { signup, isPending };
}
