// Pure function — zero imports
// Whitelists specific fields from the Lemon Squeezy webhook payload.
// Source: https://docs.lemonsqueezy.com/api/subscriptions/retrieve-subscription
//         https://docs.lemonsqueezy.com/guides/developer-guide/taking-payments#passing-custom-data

/**
 * The whitelisted fields extracted from a Lemon Squeezy webhook payload.
 * All other payload fields are ignored (data sanitization).
 */
export interface WebhookPayload {
  event_name: string;
  student_id: string | undefined;
  ls_subscription_id: string;
  ls_customer_id: string;
  ls_variant_id: string;
  status: string;
  parent_email: string | undefined;
  current_period_end: string | undefined;
}

/**
 * Extracts and whitelists fields from a raw Lemon Squeezy JSON:API webhook body.
 *
 * LS payload structure:
 *   meta.event_name              → event type string
 *   meta.custom_data.student_id  → our student UUID (set by Phase 16 checkout)
 *   data.id                      → ls_subscription_id
 *   data.attributes.customer_id  → ls_customer_id (integer in LS, converted to string)
 *   data.attributes.variant_id   → ls_variant_id (integer in LS, converted to string)
 *   data.attributes.status       → status string
 *   data.attributes.user_email   → parent email
 *   data.attributes.renews_at    → current_period_end (ISO 8601)
 *
 * @param body - The parsed JSON body (unknown type for safety)
 * @returns WebhookPayload with only the 8 whitelisted fields
 */
export function extractPayload(body: unknown): WebhookPayload {
  const { meta, data } = body as { meta: any; data: any };

  return {
    event_name: meta?.event_name as string,
    student_id: meta?.custom_data?.student_id as string | undefined,
    ls_subscription_id: data?.id as string,
    // customer_id and variant_id are integers in LS API — convert to string for DB storage
    ls_customer_id: String(data?.attributes?.customer_id ?? ''),
    ls_variant_id: String(data?.attributes?.variant_id ?? ''),
    status: data?.attributes?.status as string,
    parent_email: data?.attributes?.user_email as string | undefined,
    current_period_end: data?.attributes?.renews_at as string | undefined,
  };
}
