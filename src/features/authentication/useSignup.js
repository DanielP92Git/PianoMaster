import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import supabase from "../../services/supabase";
import { useNavigate } from "react-router-dom";

export function useSignup() {
  const navigate = useNavigate();

  const { mutate: signup, isLoading } = useMutation({
    mutationFn: async ({ email, password, firstName, lastName, role }) => {
      try {
        // Create the auth user first
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: `${firstName} ${lastName}`.trim(),
                first_name: firstName,
                last_name: lastName,
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
                  first_name: firstName,
                  last_name: lastName,
                  email: email,
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
        } else {
          // Create student record - use upsert to handle potential duplicates
          const { error: studentError } = await supabase
            .from("students")
            .upsert(
              [
                {
                  id: userId,
                  first_name: firstName,
                  last_name: lastName || "", // Fix: Add the missing last_name field
                  email: email,
                  username: `${firstName.toLowerCase()}${Math.random().toString(36).substr(2, 4)}`,
                  level: "Beginner",
                  studying_year: "1st Year", // Fix: Add default studying_year
                },
              ],
              {
                onConflict: "id",
              }
            );

          if (studentError) {
            
            // Don't throw here - let the user complete signup even if profile creation fails  
            // The profile can be created later when they try to access student features
          }
        }

        return authData;
      } catch (error) {
        console.error("Signup error:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      const { role } = variables;
      toast.success(
        `${role === "teacher" ? "Teacher" : "Student"} account created successfully! Please check your email to confirm your account.`
      );
      navigate("/");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { signup, isLoading };
}
