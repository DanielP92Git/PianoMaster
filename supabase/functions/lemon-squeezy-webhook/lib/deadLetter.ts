// Takes an injected Supabase client — does NOT create its own client.
// This makes the function testable without a Deno environment.

import type { WebhookPayload } from "./extractPayload.ts";

/**
 * D-03: records an unresolvable webhook as a durable, human-reviewable audit row and
 * fires a loud, greppable alert. This is the safe failure mode on a billing path — a
 * paying customer's event that cannot be matched to a parent must never vanish silently.
 *
 * Alert first, insert second: the anomaly is visible in function logs even if the audit
 * insert itself fails. Never logs `rawBody` — it can contain a real parent's email address
 * (PII), so only the whitelisted, low-cardinality identifiers are logged.
 *
 * An insert failure is logged and swallowed — this function always resolves, it never
 * raises an exception. An audit-write failure must not change the HTTP response the caller
 * returns (mirrors the log-and-continue posture in process-account-deletions' write to
 * account_deletion_log).
 *
 * @param supabase - A Supabase client initialized with SUPABASE_SERVICE_ROLE_KEY
 * @param rawBody  - The full parsed webhook body (unknown shape) — persisted verbatim for debugging
 * @param payload  - The whitelisted WebhookPayload extracted from rawBody
 */
export async function recordUnresolvedWebhook(
  supabase: any,
  rawBody: unknown,
  payload: WebhookPayload
): Promise<void> {
  const attemptedId = payload.parent_id ?? payload.student_id ?? null;

  // Alert FIRST so the anomaly is visible even if the audit insert itself fails.
  // PII: never log rawBody — it can contain a real parent's email address.
  console.error("WEBHOOK_UNRESOLVED:", {
    event_name: payload.event_name,
    ls_subscription_id: payload.ls_subscription_id,
    attempted_id: attemptedId,
  });

  const { error } = await supabase.from("unresolved_webhook_log").insert({
    raw_payload: rawBody, // the FULL parsed body — the whole point is debugging an unknown shape
    event_name: payload.event_name,
    ls_subscription_id: payload.ls_subscription_id,
    attempted_id: attemptedId,
  });

  if (error) {
    // Audit-write failure must not change the caller's HTTP response
    // (matches process-account-deletions' log-and-continue posture).
    console.error("WEBHOOK_UNRESOLVED: dead-letter insert failed", error);
  }
}
