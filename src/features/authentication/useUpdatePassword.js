import { useMutation } from "@tanstack/react-query";
import { updatePassword as updatePasswordApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export function useUpdatePassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    mutate: updatePassword,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: ({ password }) => updatePasswordApi({ password }),
    onSuccess: () => {
      toast.success(t("auth.resetPassword.successMessage"));
      // Delay navigation so the user sees the success state
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    },
    onError: () => {
      toast.error(t("auth.resetPassword.errorGeneric"));
    },
    retry: 0,
  });

  return { updatePassword, isPending, isSuccess };
}
