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
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return null;

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error("getCurrentUser error:", error);
      throw new Error(error.message);
    }

    if (!data?.user) return null;

    const user = data.user;

    // Determine user role and profile
    let userRole = null;
    let profile = null;

    // First check if we have role information in metadata
    const metadataRole = user.user_metadata?.role;

    if (metadataRole === "teacher") {
      // Only check teachers table for teachers
      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (teacherData && !teacherError) {
          userRole = "teacher";
          profile = teacherData;
        } else if (teacherError && teacherError.code === "PGRST116") {
          // Teacher profile doesn't exist, but user has teacher role in metadata
          userRole = "teacher";
          profile = null; // Will be created below
        }
      } catch (teacherQueryError) {
        console.warn("Teacher query failed:", teacherQueryError);
        userRole = "teacher";
        profile = null;
      }
    } else if (metadataRole === "student") {
      // Only check students table for students
      try {
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("*")
          .eq("id", user.id)
          .single();

        if (studentData && !studentError) {
          userRole = "student";
          profile = studentData;
        } else if (studentError && studentError.code === "PGRST116") {
          // Student profile doesn't exist, but user has student role in metadata
          userRole = "student";
          profile = null; // Will be created below
        }
      } catch (studentQueryError) {
        console.warn("Student query failed:", studentQueryError);
        userRole = "student";
        profile = null;
      }
    } else {
      // No role in metadata, check both tables (but handle errors gracefully)
      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from("teachers")
          .select("*")
          .eq("id", user.id)
          .single();

        if (teacherData && !teacherError) {
          userRole = "teacher";
          profile = teacherData;
        }
      } catch (teacherCheckError) {
        // Ignore errors when checking teacher table
      }

      // Only check students table if we haven't found a teacher
      if (!userRole) {
        try {
          const { data: studentData, error: studentError } = await supabase
            .from("students")
            .select("*")
            .eq("id", user.id)
            .single();

          if (studentData && !studentError) {
            userRole = "student";
            profile = studentData;
          }
        } catch (studentCheckError) {
          // Ignore errors when checking student table
        }
      }
    }

    // Create missing profile if we have a role but no profile
    if (userRole && !profile) {
      // Create the missing profile
      if (userRole === "teacher") {
        const { data: newTeacher, error: createTeacherError } = await supabase
          .from("teachers")
          .insert([
            {
              id: user.id,
              first_name:
                user.user_metadata?.first_name ||
                user.user_metadata?.full_name?.split(" ")[0] ||
                "Teacher",
              last_name:
                user.user_metadata?.last_name ||
                user.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
                "",
              email: user.email,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (!createTeacherError) {
          profile = newTeacher;
        }
      } else if (userRole === "student") {
        const { data: newStudent, error: createStudentError } = await supabase
          .from("students")
          .insert([
            {
              id: user.id,
              first_name:
                user.user_metadata?.first_name ||
                user.user_metadata?.full_name?.split(" ")[0] ||
                "Student",
              email: user.email,
              username: `user${Math.random().toString(36).substr(2, 4)}`,
              level: "Beginner",
            },
          ])
          .select()
          .single();

        if (!createStudentError) {
          profile = newStudent;
        }
      }
    }

    // If we still don't have a role, user needs to select one
    if (!userRole) {
      userRole = null;
      profile = null;
    }

    // Return enhanced user object with role and profile information
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

export async function logout() {
  const { err } = await supabase.auth.signOut();
  if (err) throw new Error(err.message);
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
