import { useMutation } from "@tanstack/react-query";
import { resetPassword as resetPasswordApi } from "../../services/apiAuth";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export function useResetPassword() {
  const { t } = useTranslation();

  const {
    mutate: resetPassword,
    isPending,
    isSuccess,
    reset,
  } = useMutation({
    mutationFn: ({ email }) => resetPasswordApi({ email }),
    onError: () => {
      // Always show a generic message to prevent email enumeration
      toast.error(t("auth.forgotPassword.errorGeneric"));
    },
    retry: 0,
  });

  return { resetPassword, isPending, isSuccess, reset };
}
