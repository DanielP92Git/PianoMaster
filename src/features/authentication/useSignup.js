import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authErrorKey } from "./authErrorKey";

const normalizeEmail = (value = "") => value.trim().toLowerCase();

export function useSignup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation("common");

  const { mutate: signup, isPending } = useMutation({
    mutationFn: async ({
      email,
      password,
      firstName,
      lastName,
      role,
      parentName,
    }) => {
      try {
        const normalizedEmail = normalizeEmail(email);
        const normalizedFirstName = firstName?.trim() || "";
        const normalizedLastName = lastName?.trim() || "";
        const normalizedParentName = parentName?.trim() || "";

        // Sign out any existing session to ensure clean signup state
        // This prevents issues where a previous user's session interferes
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore signout errors - continue with signup
        }

        // Create the auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: normalizedEmail,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name:
                  `${normalizedFirstName} ${normalizedLastName}`.trim(),
                first_name: normalizedFirstName,
                last_name: normalizedLastName,
                role: role,
              },
            },
          }
        );

        if (authError) {
          if (
            authError.message?.toLowerCase().includes("already exists") ||
            authError.message?.toLowerCase().includes("already registered") ||
            authError.status === 400
          ) {
            throw new Error(
              "An account with this email already exists. Please log in instead."
            );
          }
          throw new Error(authError.message);
        }

        if (!authData?.user) {
          throw new Error("Signup failed. Please try again.");
        }

        const userId = authData.user.id;

        // Create the appropriate profile record based on role
        if (role === "teacher") {
          const { error: teacherError } = await supabase
            .from("teachers")
            .upsert(
              [
                {
                  id: userId,
                  first_name: normalizedFirstName,
                  last_name: normalizedLastName,
                  email: normalizedEmail,
                  is_active: true,
                },
              ],
              {
                onConflict: "id",
              }
            );

          if (teacherError) {
            // Don't throw here - let the user complete signup even if profile creation fails
            // The profile can be created later when they try to access teacher features
          }
        } else if (role === "parent") {
          // Parent-only signup (D-04/SIGNUP-04): upsert ONLY into parents,
          // collecting zero child data. No students insert, no
          // promote_placeholder_student RPC.
          const { error: parentError } = await supabase.from("parents").upsert(
            [
              {
                id: userId,
                display_name: normalizedParentName || null,
                age_verified_at: new Date().toISOString(),
              },
            ],
            { onConflict: "id" }
          );

          if (parentError) {
            // Don't throw here - let the user complete signup even if profile creation fails
            // The profile can be created later when they try to access parent features
            console.warn("Parent record creation warning:", parentError);
          }
        }

        return { ...authData };
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      const { role } = variables;
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(
        t(
          role === "teacher"
            ? "auth.signup.successTeacher"
            : role === "parent"
              ? "auth.signup.successParent"
              : "auth.signup.successStudent"
        )
      );
      navigate("/");
    },
    onError: (error) => {
      // The English messages thrown inside mutationFn are internal signals that
      // authErrorKey matches on — they never reach the user directly.
      toast.error(t(authErrorKey(error, "auth.errors.signupFailed")));
    },
  });

  return { signup, isPending };
}
