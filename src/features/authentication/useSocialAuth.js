import { useMutation } from "@tanstack/react-query";
import { socialAuth } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useSocialAuth() {
  const navigate = useNavigate();

  const { mutate: socialAuthMutation, isPending } = useMutation({
    mutationFn: socialAuth,
    onSuccess: (user) => {
      toast.success("Successfully authenticated!");
      navigate("/");
    },
    onError: (err) => {
      if (err.message.includes("already exists")) {
        toast.error(err.message, {
          duration: 5000,
          icon: "⚠️",
        });
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    },
  });

  return { socialAuth: socialAuthMutation, isPending };
}
