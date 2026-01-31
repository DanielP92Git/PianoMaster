import supabase from "./supabase";
import toast from "react-hot-toast";

export async function login({ email, password }) {
  try {
    // Add a timeout wrapper for the login request
    const loginPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), 15000)
    );

    const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

    if (error) {
      console.error("Supabase login error:", error);
      throw new Error(error.message);
    }

    if (!data?.user) {
      throw new Error("Login failed - no user data received");
    }

    // Ensure we have a valid session
    if (!data?.session) {
      throw new Error("Login failed - no session created");
    }

    return { data: { user: data.user, session: data.session } };
  } catch (error) {
    console.error("Login function error:", error);

    // Re-throw with more descriptive message for common issues
    if (error.message?.includes("timeout")) {
      throw new Error(
        "Connection timeout. Please check your internet connection and try again."
      );
    }

    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    // If the stored refresh token is invalid/revoked, Supabase may throw an
    // AuthApiError and log a 400 in the console during refresh.
    // Clear the local session so the app doesn't keep retrying/logging.
    if (sessionError) {
      const msg = String(sessionError.message || "");
      const isInvalidRefresh =
        /invalid refresh token/i.test(msg) ||
        /refresh token not found/i.test(msg);

      if (isInvalidRefresh) {
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          console.warn(
            "Failed to sign out after refresh token error:",
            signOutError
          );
        }
        return null;
      }

      throw new Error(sessionError.message);
    }

    if (!sessionData?.session) return null;

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("getCurrentUser error:", error);
      throw new Error(error.message);
    }

    if (!data?.user) return null;

    const user = data.user;

    // SECURITY: Determine user role ONLY from database table presence.
    // user_metadata is NOT trusted for authorization decisions.
    // Metadata is only used as a hint for query optimization (which table to check first).
    let userRole = null;
    let profile = null;

    // Use metadata as a hint for which table to query first (optimization only)
    const metadataHint = user.user_metadata?.role;
    const checkTeacherFirst = metadataHint === "teacher";

    if (checkTeacherFirst) {
      // Check teachers table first (optimization based on metadata hint)
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", user.id)
        .single();

      if (teacherData && !teacherError) {
        // VERIFIED: User exists in teachers table
        userRole = "teacher";
        profile = teacherData;
      } else {
        // Not found in teachers, check students table
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("id", user.id)
          .single();

        if (studentData && !studentError) {
          // VERIFIED: User exists in students table
          userRole = "student";
          profile = studentData;
        }
        // If not in either table, userRole remains null
      }
    } else {
      // Check students table first (default or metadata hint says student)
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single();

      if (studentData && !studentError) {
        // VERIFIED: User exists in students table
        userRole = "student";
        profile = studentData;
      } else {
        // Not found in students, check teachers table
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (teacherData && !teacherError) {
          // VERIFIED: User exists in teachers table
          userRole = "teacher";
          profile = teacherData;
        }
        // If not in either table, userRole remains null
      }
    }

    // If user has no profile in either table, they need to complete registration
    // SECURITY: Do NOT auto-create profiles based on metadata claims.
    // Profile creation should only happen through proper registration flows.
    if (!userRole) {
      // User is authenticated but has no profile - needs to select role
      // Return user without role so the app can redirect to role selection
      return {
        ...user,
        userRole: null,
        profile: null,
        isTeacher: false,
        isStudent: false,
        needsRoleSelection: true,
      };
    }

    // Return enhanced user object with VERIFIED role and profile information
    return {
      ...user,
      userRole,
      profile,
      isTeacher: userRole === "teacher",
      isStudent: userRole === "student",
    };
  } catch (error) {
    console.error("getCurrentUser function error:", error);
    throw new Error(`Failed to get user data: ${error.message}`);
  }
}

/**
 * Logs out the current user and clears all user-specific localStorage data.
 *
 * SECURITY: This function clears user-specific data to prevent data leakage
 * on shared devices (school computers, family tablets). App-wide preferences
 * like language and accessibility settings are preserved.
 *
 * UI NOTE: The calling component should show a confirmation dialog
 * ("Are you sure you want to log out?") before invoking this function,
 * especially on shared devices where accidental logout could be disruptive.
 *
 * @throws {Error} If Supabase signOut fails
 */
export async function logout() {
  // Clear user-specific localStorage keys before signing out
  // This prevents data leakage on shared devices (school computers, family tablets)
  if (typeof window !== "undefined") {
    const keysToRemove = [];

    // Keys to preserve (app-wide preferences)
    const keysToPreserve = ["i18nextLng", "theme", "security_update_shown"];
    const prefixesToPreserve = ["accessibility_"];

    // UUID pattern for detecting user ID keys
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Skip preserved keys (app-wide preferences)
      if (keysToPreserve.includes(key)) continue;
      if (prefixesToPreserve.some((prefix) => key.startsWith(prefix))) continue;

      // Remove user-specific keys
      const shouldRemove =
        key.startsWith("migration_completed_") || // XP migration flags
        key.startsWith("trail_migration_") || // Trail migration flags (e.g., trail_migration_v2_<uuid>)
        key.startsWith("dashboard_reminder_") || // User-specific reminders
        key.includes("_student_") || // Student-related data
        key.includes("_user_") || // User-related data
        key === "xp_migration_complete" || // Legacy migration flag
        key === "cached_user_progress" || // Cached progress data
        key.startsWith("sb-") || // Supabase auth tokens
        uuidPattern.test(key); // Keys that are UUIDs (user IDs)

      if (shouldRemove) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Log cleanup count in development only
    if (process.env.NODE_ENV === "development") {
      console.log(
        `Logout: Cleared ${keysToRemove.length} user-specific localStorage keys`
      );
    }
  }

  // Then sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function socialAuth({
  provider,
  mode = "login",
  role = "student",
}) {
  // First check if we're in an OAuth redirect
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If we already have a session, don't start a new OAuth flow
  if (session) return { session };

  const isDevelopment = process.env.NODE_ENV === "development";
  const siteUrl = isDevelopment
    ? "http://localhost:5174"
    : "https://piano-master-nine.vercel.app";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: siteUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        ...(mode === "signup" && {
          signup_mode: true,
          role: role, // Pass the role in the query params
        }),
      },
    },
  });

  if (error) {
    if (error.message.includes("already exists")) {
      throw new Error(
        "An account with this email already exists. Please log in instead."
      );
    }
    throw new Error(error.message);
  }

  return data;
}

export async function updateUserAvatar(userId, avatarId) {
  try {
    // First determine if user is a teacher or student
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    let data, error;

    if (currentUser.isTeacher) {
      // For teachers, we need to get the avatar URL and update avatar_url column
      const { data: avatarData, error: avatarError } = await supabase
        .from("avatars")
        .select("image_url")
        .eq("id", avatarId)
        .single();

      if (avatarError) {
        throw new Error("Failed to get avatar URL");
      }

      // Update teacher avatar_url
      ({ data, error } = await supabase
        .from("teachers")
        .update({ avatar_url: avatarData.image_url })
        .eq("id", userId)
        .select("*"));
    } else if (currentUser.isStudent) {
      // Update student avatar_id
      ({ data, error } = await supabase
        .from("students")
        .update({ avatar_id: avatarId })
        .eq("id", userId)
        .select("*, avatars(*)"));
    } else {
      throw new Error("User role not determined");
    }

    if (error) {
      throw new Error("Failed to update avatar");
    }

    return data;
  } catch (error) {
    throw new Error("Failed to update avatar");
  }
}

export async function checkUserPermissions() {
  // Only allow in development mode - prevents exposing permission info in production
  if (process.env.NODE_ENV !== "development") {
    console.warn("checkUserPermissions is only available in development mode");
    return { error: "Not available in production" };
  }

  try {
    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return { authenticated: false, message: "No active session" };
    }

    // Check if the user can read from the students table
    const { data: readData, error: readError } = await supabase
      .from("students")
      .select("id")
      .limit(1);

    // Check if the user can write to the students table
    const testId = session.user.id;
    const { data: writeData, error: writeError } = await supabase
      .from("students")
      .upsert(
        { id: testId, last_check: new Date().toISOString() },
        { onConflict: "id", returning: "minimal" }
      );

    return {
      authenticated: true,
      userId: session.user.id,
      canRead: !readError,
      readError: readError
        ? {
            code: readError.code,
            message: readError.message,
            details: readError.details,
          }
        : null,
      canWrite: !writeError,
      writeError: writeError
        ? {
            code: writeError.code,
            message: writeError.message,
            details: writeError.details,
          }
        : null,
    };
  } catch (error) {
    console.error("Error checking permissions:", error);
    return {
      authenticated: false,
      error: error.message,
    };
  }
}

export async function checkDatabaseStructure() {
  // Only allow in development mode - prevents exposing database structure info in production
  if (process.env.NODE_ENV !== "development") {
    console.warn("checkDatabaseStructure is only available in development mode");
    return { error: "Not available in production" };
  }

  try {
    // Check if the students table exists
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .limit(1);

    // Check if the avatars table exists
    const { data: avatarsData, error: avatarsError } = await supabase
      .from("avatars")
      .select("id")
      .limit(1);

    // Check if the foreign key relationship works
    const { data: relationData, error: relationError } = await supabase
      .from("students")
      .select("*, avatars(*)")
      .limit(1);

    return {
      studentsTableExists: !studentsError,
      studentsError: studentsError
        ? {
            code: studentsError.code,
            message: studentsError.message,
          }
        : null,
      avatarsTableExists: !avatarsError,
      avatarsError: avatarsError
        ? {
            code: avatarsError.code,
            message: avatarsError.message,
          }
        : null,
      relationWorks: !relationError,
      relationError: relationError
        ? {
            code: relationError.code,
            message: relationError.message,
          }
        : null,
      studentsData: studentsData,
      avatarsData: avatarsData,
      relationData: relationData,
    };
  } catch (error) {
    console.error("Error checking database structure:", error);
    return {
      error: error.message,
    };
  }
}
