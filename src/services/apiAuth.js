import supabase from "./supabase";
import toast from "react-hot-toast";

export async function login({ email, password }) {
  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  return { data };
}

export async function getCurrentUser() {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;

  const { data, error } = await supabase.auth.getUser();

  console.log(data);

  if (error) throw new Error(error.message);

  return data?.user;
}

export async function logout() {
  const { err } = await supabase.auth.signOut();
  if (err) throw new Error(err.message);
}

export async function socialAuth({ provider, mode = "login" }) {
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

  console.log("Environment:", process.env.NODE_ENV);
  console.log("Site URL:", siteUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: siteUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        ...(mode === "signup" && {
          signup_mode: true,
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
    // First try to upsert the student record
    const { data, error } = await supabase
      .from("students")
      .upsert(
        {
          id: userId,
          avatar_id: avatarId,
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      )
      .select("*, avatars(*)");

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
