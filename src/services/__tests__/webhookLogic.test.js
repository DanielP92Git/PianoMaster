/**
 * Vitest tests for the Lemon Squeezy webhook Edge Function's pure business logic.
 *
 * The Edge Function lib modules are designed to be importable by Vitest:
 *   - extractPayload.ts: zero imports, tested by direct import
 *   - verifySignature.ts: imports timingSafeEqual from deno.land/std — this URL
 *     does not resolve in Node. We test the ALGORITHM correctness using a Node
 *     crypto equivalent (see verifySignatureNode helper below).
 *   - Event routing: tested as a simple Set assertion (inlined from index.ts)
 *   - redactEmail: inlined 4-line utility from index.ts
 *
 * Run: npx vitest run src/services/__tests__/webhookLogic.test.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac, timingSafeEqual as nodeTSE } from "crypto";

// ---------------------------------------------------------------------------
// Import extractPayload directly — it has zero imports so it loads in Node/Vitest
// ---------------------------------------------------------------------------
import { extractPayload } from "../../../supabase/functions/lemon-squeezy-webhook/lib/extractPayload";
import { resolveParent } from "../../../supabase/functions/lemon-squeezy-webhook/lib/resolveParent";
import { recordUnresolvedWebhook } from "../../../supabase/functions/lemon-squeezy-webhook/lib/deadLetter";
import { upsertSubscription } from "../../../supabase/functions/lemon-squeezy-webhook/lib/upsertSubscription";

// ---------------------------------------------------------------------------
// verifySignature — Node-compatible re-implementation for algorithm testing
// (The real implementation uses deno.land/std which doesn't resolve in Node)
// ---------------------------------------------------------------------------

/**
 * Node-compatible version of verifySignature using Node's built-in crypto.
 * Mirrors the exact same algorithm as the Deno version in verifySignature.ts.
 * This validates the HMAC-SHA256 logic is correct, not the Deno import.
 */
async function verifySignatureNode(rawBody, receivedHex, secret) {
  if (!receivedHex || !secret) return false;

  // Use WebCrypto (available in Node 20+) — same API as the Deno version
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(rawBody)
  );

  const computedHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const computedBytes = encoder.encode(computedHex);
  const receivedBytes = encoder.encode(receivedHex);

  if (computedBytes.length !== receivedBytes.length) return false;

  // Use Node's built-in timingSafeEqual for byte comparison
  return nodeTSE(computedBytes, receivedBytes);
}

/**
 * Computes a valid HMAC-SHA256 hex string for testing.
 * Used to generate the "correct" signature for test cases.
 */
function computeValidSignature(rawBody, secret) {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

// ---------------------------------------------------------------------------
// Inline the HANDLED_EVENTS Set from index.ts (tests the routing logic spec)
// ---------------------------------------------------------------------------
const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

// ---------------------------------------------------------------------------
// Inline redactEmail from index.ts (4-line utility, COPPA-compliance test)
// ---------------------------------------------------------------------------
function redactEmail(email) {
  const at = email.indexOf("@");
  if (at < 0) return "***";
  return email[0] + "***@" + email.slice(at + 1);
}

// ---------------------------------------------------------------------------
// Mock Lemon Squeezy payload builder
// ---------------------------------------------------------------------------
function buildMockPayload(overrides = {}) {
  return {
    meta: {
      event_name: "subscription_created",
      custom_data: {
        student_id: "abc123-student-uuid",
      },
      ...overrides.meta,
    },
    data: {
      type: "subscriptions",
      id: "sub_12345",
      attributes: {
        status: "active",
        customer_id: 98765,
        variant_id: 54321,
        user_email: "parent@example.com",
        renews_at: "2026-03-27T00:00:00.000000Z",
        ends_at: null,
        cancelled: false,
        trial_ends_at: "2026-03-01T00:00:00.000000Z", // extra field — should be ignored
        created_at: "2026-02-27T00:00:00.000000Z", // extra field — should be ignored
        ...overrides.attributes,
      },
      ...overrides.data,
    },
  };
}

// ===========================================================================
// 1. extractPayload tests
// ===========================================================================

describe("extractPayload", () => {
  it("extracts all 9 whitelisted fields from a valid LS payload", () => {
    const body = buildMockPayload({
      meta: {
        custom_data: {
          parent_id: "parent-uuid-1",
          student_id: "abc123-student-uuid",
        },
      },
    });
    const result = extractPayload(body);

    expect(result.event_name).toBe("subscription_created");
    expect(result.parent_id).toBe("parent-uuid-1");
    expect(result.student_id).toBe("abc123-student-uuid");
    expect(result.ls_subscription_id).toBe("sub_12345");
    expect(result.ls_customer_id).toBe("98765");
    expect(result.ls_variant_id).toBe("54321");
    expect(result.status).toBe("active");
    expect(result.parent_email).toBe("parent@example.com");
    expect(result.current_period_end).toBe("2026-03-27T00:00:00.000000Z");
  });

  it("Test 1: meta.custom_data.parent_id present -> the returned object's parent_id equals it", () => {
    const body = buildMockPayload({
      meta: { custom_data: { parent_id: "the-parent-uuid" } },
    });
    const result = extractPayload(body);

    expect(result.parent_id).toBe("the-parent-uuid");
  });

  it("Test 2: meta.custom_data.parent_id absent -> parent_id is undefined and student_id still extracts (no regression on the legacy shape)", () => {
    const body = buildMockPayload({
      meta: { custom_data: { student_id: "legacy-student-uuid" } },
    });
    const result = extractPayload(body);

    expect(result.parent_id).toBeUndefined();
    expect(result.student_id).toBe("legacy-student-uuid");
  });

  it("returns undefined student_id when meta.custom_data is absent", () => {
    const body = {
      meta: {
        event_name: "subscription_created",
        // no custom_data key at all
      },
      data: buildMockPayload().data,
    };
    const result = extractPayload(body);

    expect(result.student_id).toBeUndefined();
  });

  it("returns undefined student_id when custom_data exists but student_id is missing", () => {
    const body = {
      meta: {
        event_name: "subscription_created",
        custom_data: { some_other_key: "value" },
      },
      data: buildMockPayload().data,
    };
    const result = extractPayload(body);

    expect(result.student_id).toBeUndefined();
  });

  it("returns undefined parent_email and current_period_end when optional fields are absent", () => {
    const body = buildMockPayload();
    // Remove optional fields from attributes
    delete body.data.attributes.user_email;
    delete body.data.attributes.renews_at;

    const result = extractPayload(body);

    expect(result.parent_email).toBeUndefined();
    expect(result.current_period_end).toBeUndefined();
  });

  it("converts numeric customer_id and variant_id to strings", () => {
    const body = buildMockPayload();
    body.data.attributes.customer_id = 12345;
    body.data.attributes.variant_id = 67890;

    const result = extractPayload(body);

    expect(result.ls_customer_id).toBe("12345");
    expect(result.ls_variant_id).toBe("67890");
    expect(typeof result.ls_customer_id).toBe("string");
    expect(typeof result.ls_variant_id).toBe("string");
  });

  it("converts zero customer_id and variant_id to empty-like strings", () => {
    const body = buildMockPayload();
    body.data.attributes.customer_id = 0;
    body.data.attributes.variant_id = 0;

    const result = extractPayload(body);

    expect(result.ls_customer_id).toBe("0");
    expect(result.ls_variant_id).toBe("0");
  });

  it("ignores extra payload fields not in the whitelist", () => {
    const body = buildMockPayload();
    // These extra fields exist in the mock (trial_ends_at, created_at, cancelled, ends_at)
    const result = extractPayload(body);

    expect(result).not.toHaveProperty("trial_ends_at");
    expect(result).not.toHaveProperty("created_at");
    expect(result).not.toHaveProperty("cancelled");
    expect(result).not.toHaveProperty("ends_at");
    expect(Object.keys(result)).toHaveLength(9);
  });

  it("Test 4: an entirely unrelated custom_data key is discarded (whitelist integrity)", () => {
    const body = buildMockPayload({
      meta: {
        custom_data: {
          parent_id: "the-parent-uuid",
          student_id: "the-student-uuid",
          some_unrelated_key: "should-not-appear-anywhere",
        },
      },
    });
    const result = extractPayload(body);

    expect(result).not.toHaveProperty("some_unrelated_key");
    expect(JSON.stringify(result)).not.toContain("should-not-appear-anywhere");
  });

  it("handles null/undefined body gracefully without throwing", () => {
    // extractPayload receives unknown type — should not throw on malformed input
    expect(() => extractPayload({})).not.toThrow();
    expect(() => extractPayload({ meta: null, data: null })).not.toThrow();
  });
});

// ===========================================================================
// 2. verifySignature tests (Node-compatible algorithm verification)
// ===========================================================================

describe("verifySignature (Node-equivalent HMAC-SHA256 algorithm)", () => {
  const TEST_SECRET = "test-signing-secret-12345";
  const TEST_BODY = JSON.stringify({
    meta: { event_name: "subscription_created" },
  });

  it("returns true for a valid HMAC-SHA256 signature", async () => {
    const validHex = computeValidSignature(TEST_BODY, TEST_SECRET);
    const result = await verifySignatureNode(TEST_BODY, validHex, TEST_SECRET);

    expect(result).toBe(true);
  });

  it("returns false for an invalid (wrong) signature", async () => {
    const wrongHex =
      "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const result = await verifySignatureNode(TEST_BODY, wrongHex, TEST_SECRET);

    expect(result).toBe(false);
  });

  it("returns false for an empty signature string", async () => {
    const result = await verifySignatureNode(TEST_BODY, "", TEST_SECRET);

    expect(result).toBe(false);
  });

  it("returns false for an empty secret", async () => {
    const validHex = computeValidSignature(TEST_BODY, TEST_SECRET);
    const result = await verifySignatureNode(TEST_BODY, validHex, "");

    expect(result).toBe(false);
  });

  it("returns false when signature is correct for a different body", async () => {
    const differentBody = JSON.stringify({
      meta: { event_name: "subscription_cancelled" },
    });
    const hexForDifferentBody = computeValidSignature(
      differentBody,
      TEST_SECRET
    );
    const result = await verifySignatureNode(
      TEST_BODY,
      hexForDifferentBody,
      TEST_SECRET
    );

    expect(result).toBe(false);
  });

  it("returns false when signature is correct for a different secret", async () => {
    const hexForDifferentSecret = computeValidSignature(
      TEST_BODY,
      "other-secret"
    );
    const result = await verifySignatureNode(
      TEST_BODY,
      hexForDifferentSecret,
      TEST_SECRET
    );

    expect(result).toBe(false);
  });

  it("handles empty body correctly (signature of empty string)", async () => {
    const emptyBodyHex = computeValidSignature("", TEST_SECRET);
    const result = await verifySignatureNode("", emptyBodyHex, TEST_SECRET);

    expect(result).toBe(true);
  });
});

// ===========================================================================
// 3. Event routing logic tests (HANDLED_EVENTS Set)
// ===========================================================================

describe("HANDLED_EVENTS routing set", () => {
  it("contains exactly the 4 core subscription lifecycle events", () => {
    expect(HANDLED_EVENTS.has("subscription_created")).toBe(true);
    expect(HANDLED_EVENTS.has("subscription_updated")).toBe(true);
    expect(HANDLED_EVENTS.has("subscription_cancelled")).toBe(true);
    expect(HANDLED_EVENTS.has("subscription_expired")).toBe(true);
    expect(HANDLED_EVENTS.size).toBe(4);
  });

  it("does not handle payment lifecycle events (those return 200 silently)", () => {
    expect(HANDLED_EVENTS.has("subscription_payment_success")).toBe(false);
    expect(HANDLED_EVENTS.has("subscription_payment_failed")).toBe(false);
    expect(HANDLED_EVENTS.has("subscription_payment_recovered")).toBe(false);
    expect(HANDLED_EVENTS.has("subscription_payment_refunded")).toBe(false);
  });

  it("does not handle paused/resumed/unpaused events", () => {
    expect(HANDLED_EVENTS.has("subscription_paused")).toBe(false);
    expect(HANDLED_EVENTS.has("subscription_resumed")).toBe(false);
    expect(HANDLED_EVENTS.has("subscription_unpaused")).toBe(false);
  });

  it("does not handle unknown/arbitrary event names", () => {
    expect(HANDLED_EVENTS.has("order_created")).toBe(false);
    expect(HANDLED_EVENTS.has("license_key_created")).toBe(false);
    expect(HANDLED_EVENTS.has("")).toBe(false);
  });
});

// ===========================================================================
// 4. redactEmail tests (COPPA-compliant email logging)
// ===========================================================================

describe("redactEmail", () => {
  it("redacts a standard email correctly", () => {
    expect(redactEmail("john@example.com")).toBe("j***@example.com");
  });

  it("handles email without @ symbol", () => {
    expect(redactEmail("invalid")).toBe("***");
  });

  it("handles single-character local part", () => {
    expect(redactEmail("a@b.com")).toBe("a***@b.com");
  });

  it("handles email with subdomain", () => {
    expect(redactEmail("parent@mail.school.org")).toBe("p***@mail.school.org");
  });

  it("preserves the full domain portion after @", () => {
    const result = redactEmail("user@example.com");
    expect(result).toMatch(/^u\*\*\*@example\.com$/);
  });

  it("handles email with multiple characters before @", () => {
    // Only the first character is preserved
    expect(redactEmail("longemail@example.com")).toBe("l***@example.com");
  });
});

// ===========================================================================
// 5. resolveParent / recordUnresolvedWebhook — D-01 resolve-chain + D-03 dead-letter
// ===========================================================================

/**
 * Local mock Supabase client factory. Satisfies the two chains exercised by this file's
 * lib modules:
 *   .from(table).select(cols).eq(col, val).maybeSingle()  (resolveParent's two probes)
 *   .from(table).insert(obj)                              (recordUnresolvedWebhook's dead-letter write)
 *
 * Records every from()/eq() call so tests can assert probe order and exact arguments.
 */
function createMockSupabase({ parents, childProfiles, insert } = {}) {
  const calls = { from: [], eq: [], insertedObject: undefined };
  return {
    calls,
    from(table) {
      calls.from.push(table);
      const chain = {
        select() {
          return chain;
        },
        eq(col, val) {
          calls.eq.push({ table, col, val });
          return chain;
        },
        maybeSingle: async () => {
          if (table === "parents")
            return parents ?? { data: null, error: null };
          if (table === "child_profiles")
            return childProfiles ?? { data: null, error: null };
          return { data: null, error: null };
        },
        insert: async (obj) => {
          calls.insertedObject = obj;
          return insert ?? { data: null, error: null };
        },
      };
      return chain;
    },
  };
}

describe("resolveParent", () => {
  it("Test 1: returns unresolved and makes NO database call when candidateId is undefined", async () => {
    const supabase = createMockSupabase();
    const result = await resolveParent(supabase, undefined);

    expect(result).toEqual({ unresolved: true });
    expect(supabase.calls.from).toHaveLength(0);
  });

  it("Test 2: candidateId matches parents.id -> parentId, and child_profiles is NEVER probed", async () => {
    const supabase = createMockSupabase({
      parents: { data: { id: "parent-uuid-1" }, error: null },
    });
    const result = await resolveParent(supabase, "parent-uuid-1");

    expect(result).toEqual({ parentId: "parent-uuid-1" });
    expect(supabase.calls.from).toEqual(["parents"]);
  });

  it("Test 3: candidateId misses parents but matches child_profiles.id with a set parent_id", async () => {
    const supabase = createMockSupabase({
      parents: { data: null, error: null },
      childProfiles: {
        data: { parent_id: "resolved-parent-uuid" },
        error: null,
      },
    });
    const result = await resolveParent(supabase, "child-uuid-1");

    expect(result).toEqual({ parentId: "resolved-parent-uuid" });
  });

  it("Test 4: candidateId matches a child_profiles row whose parent_id IS NULL -> unresolved", async () => {
    const supabase = createMockSupabase({
      parents: { data: null, error: null },
      childProfiles: { data: { parent_id: null }, error: null },
    });
    const result = await resolveParent(supabase, "teacher-owned-child-uuid");

    expect(result).toEqual({ unresolved: true });
  });

  it("Test 5: both probes miss entirely -> unresolved", async () => {
    const supabase = createMockSupabase({
      parents: { data: null, error: null },
      childProfiles: { data: null, error: null },
    });
    const result = await resolveParent(supabase, "nonexistent-uuid");

    expect(result).toEqual({ unresolved: true });
  });

  it("Test 6: probe 1 returns a transient error with null data -> falls through to probe 2; if that also misses, returns unresolved and never throws", async () => {
    const supabase = createMockSupabase({
      parents: { data: null, error: { message: "transient DB error" } },
      childProfiles: { data: null, error: null },
    });

    await expect(resolveParent(supabase, "some-uuid")).resolves.toEqual({
      unresolved: true,
    });
  });

  it("Test 7: .eq() is called with the exact candidate id on both probes, tables queried are exactly parents then child_profiles in that order", async () => {
    const supabase = createMockSupabase({
      parents: { data: null, error: null },
      childProfiles: { data: null, error: null },
    });
    await resolveParent(supabase, "candidate-id-xyz");

    expect(supabase.calls.from).toEqual(["parents", "child_profiles"]);
    expect(supabase.calls.eq).toEqual([
      { table: "parents", col: "id", val: "candidate-id-xyz" },
      { table: "child_profiles", col: "id", val: "candidate-id-xyz" },
    ]);
  });
});

describe("recordUnresolvedWebhook", () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const buildPayload = (overrides = {}) => ({
    event_name: "subscription_created",
    parent_id: undefined,
    student_id: "legacy-student-uuid",
    ls_subscription_id: "sub_99999",
    ls_customer_id: "111",
    ls_variant_id: "222",
    status: "active",
    parent_email: "parent@example.com",
    current_period_end: "2026-04-01T00:00:00.000000Z",
    ...overrides,
  });

  it("Test 8: inserts into unresolved_webhook_log with raw_payload set to the FULL parsed body, plus event_name, ls_subscription_id, attempted_id", async () => {
    const supabase = createMockSupabase();
    const rawBody = {
      meta: { event_name: "subscription_created" },
      data: { id: "sub_99999" },
    };
    const payload = buildPayload();

    await recordUnresolvedWebhook(supabase, rawBody, payload);

    expect(supabase.calls.from).toContain("unresolved_webhook_log");
    expect(supabase.calls.insertedObject).toEqual({
      raw_payload: rawBody,
      event_name: payload.event_name,
      ls_subscription_id: payload.ls_subscription_id,
      attempted_id: payload.student_id,
    });
  });

  it("Test 9: attempted_id is payload.parent_id ?? payload.student_id ?? null", async () => {
    const supabase = createMockSupabase();

    // parent_id present -> preferred
    await recordUnresolvedWebhook(
      supabase,
      {},
      buildPayload({
        parent_id: "preferred-parent-uuid",
        student_id: "legacy-student-uuid",
      })
    );
    expect(supabase.calls.insertedObject.attempted_id).toBe(
      "preferred-parent-uuid"
    );

    // only student_id present -> falls back
    await recordUnresolvedWebhook(
      supabase,
      {},
      buildPayload({ parent_id: undefined, student_id: "legacy-student-uuid" })
    );
    expect(supabase.calls.insertedObject.attempted_id).toBe(
      "legacy-student-uuid"
    );

    // neither present -> null
    await recordUnresolvedWebhook(
      supabase,
      {},
      buildPayload({ parent_id: undefined, student_id: undefined })
    );
    expect(supabase.calls.insertedObject.attempted_id).toBeNull();
  });

  it("Test 10: a failing insert is logged and swallowed — the function resolves, never throws", async () => {
    const supabase = createMockSupabase({
      insert: { data: null, error: { message: "insert failed" } },
    });

    await expect(
      recordUnresolvedWebhook(supabase, {}, buildPayload())
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("Test 11: emits the alert with the exact greppable prefix WEBHOOK_UNRESOLVED:, including event_name, ls_subscription_id, attempted_id, and never the raw payload", async () => {
    const supabase = createMockSupabase();
    const rawBody = {
      meta: { event_name: "subscription_created" },
      secret: "parent@example.com-should-not-leak",
    };
    const payload = buildPayload({ parent_id: "the-parent-uuid" });

    await recordUnresolvedWebhook(supabase, rawBody, payload);

    expect(consoleErrorSpy).toHaveBeenCalledWith("WEBHOOK_UNRESOLVED:", {
      event_name: payload.event_name,
      ls_subscription_id: payload.ls_subscription_id,
      attempted_id: "the-parent-uuid",
    });

    // Never logs the raw payload (PII risk)
    for (const call of consoleErrorSpy.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("should-not-leak");
    }
  });
});

// ===========================================================================
// 6. upsertSubscription — D-14 parent_id-only writer
// ===========================================================================

/**
 * Local mock Supabase client for upsertSubscription's two-chain sequence:
 *   .from('subscription_plans').select().eq().maybeSingle()
 *   .from('parent_subscriptions').upsert(obj, opts)
 */
function createUpsertMockSupabase({ plan, upsertError } = {}) {
  const calls = {
    from: [],
    upsertedObject: undefined,
    upsertOptions: undefined,
  };
  return {
    calls,
    from(table) {
      calls.from.push(table);
      if (table === "subscription_plans") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => plan ?? { data: null, error: null },
            }),
          }),
        };
      }
      if (table === "parent_subscriptions") {
        return {
          upsert: async (obj, opts) => {
            calls.upsertedObject = obj;
            calls.upsertOptions = opts;
            return upsertError
              ? { data: null, error: upsertError }
              : { data: null, error: null };
          },
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

function buildUpsertPayload(overrides = {}) {
  return {
    event_name: "subscription_created",
    parent_id: undefined,
    student_id: "legacy-student-uuid",
    ls_subscription_id: "sub_54321",
    ls_customer_id: "555",
    ls_variant_id: "861115",
    status: "active",
    parent_email: "parent@example.com",
    current_period_end: "2026-05-01T00:00:00.000000Z",
    ...overrides,
  };
}

describe("upsertSubscription", () => {
  it("Test 5: called with a resolved parent id, the upserted object contains parent_id and does NOT contain a student_id key (D-14)", async () => {
    const supabase = createUpsertMockSupabase({
      plan: { data: { id: "plan-uuid" }, error: null },
    });
    const payload = buildUpsertPayload();

    await upsertSubscription(supabase, payload, "resolved-parent-uuid");

    expect(supabase.calls.upsertedObject.parent_id).toBe(
      "resolved-parent-uuid"
    );
    expect(Object.keys(supabase.calls.upsertedObject)).not.toContain(
      "student_id"
    );
  });

  it("Test 6: onConflict is still exactly 'ls_subscription_id'", async () => {
    const supabase = createUpsertMockSupabase();
    const payload = buildUpsertPayload();

    await upsertSubscription(supabase, payload, "resolved-parent-uuid");

    expect(supabase.calls.upsertOptions).toEqual({
      onConflict: "ls_subscription_id",
    });
  });

  it("Test 7: a DB error is still re-thrown so index.ts can return 500 and let LS retry", async () => {
    const supabase = createUpsertMockSupabase({
      upsertError: { message: "db error" },
    });
    const payload = buildUpsertPayload();

    await expect(
      upsertSubscription(supabase, payload, "resolved-parent-uuid")
    ).rejects.toEqual({ message: "db error" });
  });
});
