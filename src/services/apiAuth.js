import supabase from "./supabase";

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

export async function signup({ email, password }) {
  // First check if user exists
  const { data: existingUser, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    throw new Error(
      "An account with this email already exists. Please log in instead."
    );
  }

  // If no existing user, proceed with signup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function socialAuth({ provider, mode = "login" }) {
  // First check if we're in an OAuth redirect
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If we already have a session, don't start a new OAuth flow
  if (session) return { session };

  const redirectTo =
    process.env.NODE_ENV === "production"
      ? "https://piano-master-nine.vercel.app/auth/v1/callback"
      : "http://localhost:3000/auth/v1/callback";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
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
