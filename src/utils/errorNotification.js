import { toast } from "react-hot-toast";
import { Sentry } from "../services/sentryService";

/**
 * Notify the user of an error with a friendly toast and report to Sentry.
 * @param {Error} error - The error object
 * @param {string} context - What was being attempted (e.g., "saving progress")
 */
export function notifyError(error, context = "operation") {
  // Report to Sentry
  Sentry.captureException(error, { extra: { context } });

  // Determine user-facing message
  const message = getUserMessage(error, context);
  toast.error(message);
}

function getUserMessage(error, context) {
  const msg = error?.message?.toLowerCase() || "";

  if (msg.includes("networkerror") || msg.includes("failed to fetch") || msg.includes("network")) {
    return "No internet connection. Your progress will sync when you reconnect.";
  }
  if (msg.includes("jwt") || msg.includes("auth") || msg.includes("401")) {
    return "Session expired. Please log in again.";
  }
  if (msg.includes("rate") || msg.includes("429")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return `Something went wrong while ${context}. Please try again.`;
}
