/**
 * Maps an auth error to a translation key in the `auth.errors.*` bucket.
 *
 * Matching is against the raw English message Supabase returns. That text is
 * locale-independent — it does not change when the app language does — so
 * matching on it stays correct now that the *output* is localised.
 *
 * Callers pass a screen-appropriate `fallback` ("we couldn't sign you in" vs
 * "we couldn't create your account") for errors that match nothing here.
 */
export function authErrorKey(error, fallback = "auth.errors.generic") {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials")) {
    return "auth.errors.invalidCredentials";
  }
  if (message.includes("email not confirmed")) {
    return "auth.errors.emailNotConfirmed";
  }
  if (message.includes("too many requests")) {
    return "auth.errors.tooManyRequests";
  }
  if (
    message.includes("already exists") ||
    message.includes("already registered")
  ) {
    return "auth.errors.accountExists";
  }
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout")
  ) {
    return "auth.errors.network";
  }

  return fallback;
}
