import { useMutation } from "@tanstack/react-query";
import { socialAuth } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { authErrorKey } from "./authErrorKey";

export function useSocialAuth() {
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  const { mutate: socialAuthMutation, isPending } = useMutation({
    mutationFn: ({ provider, mode, role }) =>
      socialAuth({ provider, mode, role }),
    onSuccess: (_user) => {
      toast.success(t("auth.errors.socialSuccess"));
      navigate("/");
    },
    onError: (err) => {
      const key = authErrorKey(err, "auth.errors.signInFailed");
      // "This email already has an account" is the one case worth dwelling on —
      // it needs a decision from the user, not just an acknowledgement.
      const options =
        key === "auth.errors.accountExists"
          ? { duration: 5000, icon: "⚠️" }
          : undefined;
      toast.error(t(key), options);
    },
  });

  return { socialAuth: socialAuthMutation, isPending };
}
