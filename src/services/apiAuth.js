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
  // First try to upsert the student record
  const { data, error } = await supabase
    .from("students")
    .upsert(
      {
        id: userId, // This will be both the PK and FK to auth.users
        avatar_id: avatarId,
      },
      {
        onConflict: "id",
        ignoreDuplicates: false,
      }
    )
    .select("*, avatars(*)");

  if (error) {
    console.error("Error upserting avatar:", error);
    throw new Error("Failed to update avatar");
  }

  return data;
}
