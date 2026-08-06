/**
 * Vitest tests for cancel-subscription's D-06 "select -> classify -> decide" logic.
 *
 * selectActiveSubscription.ts lives under supabase/functions/ (Deno Edge Function lib)
 * but has zero non-portable imports, so it is imported directly into Vitest — the same
 * cross-runtime seam used by src/services/__tests__/webhookLogic.test.js for extractPayload.
 *
 * Run: npx vitest run src/services/__tests__/cancelSubscriptionLogic.test.js
 */

import { describe, it, expect, vi } from "vitest";
import {
  isQualifyingSubscription,
  selectActiveSubscription,
} from "../../../supabase/functions/cancel-subscription/lib/selectActiveSubscription";

const NOW = "2026-08-05T12:00:00.000Z";

function daysFromNow(days) {
  return new Date(
    new Date(NOW).getTime() + days * 24 * 60 * 60 * 1000
  ).toISOString();
}

/**
 * Builds a minimal mock Supabase client of the exact shape
 * selectActiveSubscription() calls: .from(table).select(cols).eq(col, val) resolving
 * directly to { data, error }. Deliberately no .maybeSingle() on the mock — a
 * regression that re-introduces it fails with a TypeError rather than passing silently.
 */
function buildMockClient({ data = null, error = null } = {}) {
  const calls = { from: [], select: [], eq: [] };

  const eq = vi.fn((col, val) => {
    calls.eq.push([col, val]);
    return Promise.resolve({ data, error });
  });
  const select = vi.fn((cols) => {
    calls.select.push(cols);
    return { eq };
  });
  const from = vi.fn((table) => {
    calls.from.push(table);
    return { select };
  });

  return { from, calls };
}

// ===========================================================================
// isQualifyingSubscription — Tests 1-8
// ===========================================================================

describe("isQualifyingSubscription", () => {
  it("Test 1: status active -> true regardless of current_period_end", () => {
    expect(
      isQualifyingSubscription(
        { status: "active", current_period_end: null, ls_subscription_id: "x" },
        NOW
      )
    ).toBe(true);
  });

  it("Test 2: status on_trial -> true", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "on_trial",
          current_period_end: null,
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(true);
  });

  it("Test 3: status cancelled with current_period_end in the future -> true", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "cancelled",
          current_period_end: daysFromNow(5),
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(true);
  });

  it("Test 4: status cancelled with current_period_end in the past -> false", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "cancelled",
          current_period_end: daysFromNow(-5),
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(false);
  });

  it("Test 5: status past_due with current_period_end 1 day ago -> true (inside 3-day grace)", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "past_due",
          current_period_end: daysFromNow(-1),
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(true);
  });

  it("Test 6: status past_due with current_period_end 4 days ago -> false (outside grace)", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "past_due",
          current_period_end: daysFromNow(-4),
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(false);
  });

  it("Test 7: status expired/paused/unknown -> false", () => {
    expect(
      isQualifyingSubscription(
        {
          status: "expired",
          current_period_end: null,
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(false);
    expect(
      isQualifyingSubscription(
        { status: "paused", current_period_end: null, ls_subscription_id: "x" },
        NOW
      )
    ).toBe(false);
    expect(
      isQualifyingSubscription(
        {
          status: "some_unknown_status",
          current_period_end: null,
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(false);
  });

  it("Test 8: current_period_end null with status cancelled -> false (no crash)", () => {
    expect(() =>
      isQualifyingSubscription(
        {
          status: "cancelled",
          current_period_end: null,
          ls_subscription_id: "x",
        },
        NOW
      )
    ).not.toThrow();
    expect(
      isQualifyingSubscription(
        {
          status: "cancelled",
          current_period_end: null,
          ls_subscription_id: "x",
        },
        NOW
      )
    ).toBe(false);
  });
});

// ===========================================================================
// selectActiveSubscription — Tests 9-15
// ===========================================================================

describe("selectActiveSubscription", () => {
  it('Test 9: DB error -> { outcome: "db_error", error }', async () => {
    const dbError = { message: "connection failed" };
    const client = buildMockClient({ data: null, error: dbError });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result).toEqual({ outcome: "db_error", error: dbError });
  });

  it('Test 10: zero rows returned -> { outcome: "none" }', async () => {
    const client = buildMockClient({ data: [], error: null });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result).toEqual({ outcome: "none" });
  });

  it('Test 11: rows exist but none qualify -> { outcome: "none" }', async () => {
    const client = buildMockClient({
      data: [
        {
          status: "expired",
          current_period_end: daysFromNow(-100),
          ls_subscription_id: "ls_1",
        },
        {
          status: "paused",
          current_period_end: null,
          ls_subscription_id: "ls_2",
        },
      ],
      error: null,
    });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result).toEqual({ outcome: "none" });
  });

  it('Test 12: exactly one qualifying row -> { outcome: "one", subscription: <that row> }', async () => {
    const activeRow = {
      status: "active",
      current_period_end: null,
      ls_subscription_id: "ls_1",
    };
    const client = buildMockClient({
      data: [
        activeRow,
        {
          status: "expired",
          current_period_end: daysFromNow(-100),
          ls_subscription_id: "ls_2",
        },
      ],
      error: null,
    });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result).toEqual({ outcome: "one", subscription: activeRow });
  });

  it('Test 13: two qualifying rows -> { outcome: "ambiguous", subscriptions: [both] }', async () => {
    const rowA = {
      status: "active",
      current_period_end: null,
      ls_subscription_id: "ls_1",
    };
    const rowB = {
      status: "on_trial",
      current_period_end: null,
      ls_subscription_id: "ls_2",
    };
    const client = buildMockClient({ data: [rowA, rowB], error: null });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result.outcome).toBe("ambiguous");
    expect(result.subscriptions).toEqual([rowA, rowB]);
  });

  it('Test 14: one qualifying row with a null ls_subscription_id -> { outcome: "missing_ls_id" }', async () => {
    const client = buildMockClient({
      data: [
        {
          status: "active",
          current_period_end: null,
          ls_subscription_id: null,
        },
      ],
      error: null,
    });

    const result = await selectActiveSubscription(client, "parent-1");

    expect(result).toEqual({ outcome: "missing_ls_id" });
  });

  it("Test 15: filters on parent_id, never on student_id, and does NOT call .maybeSingle()", async () => {
    const client = buildMockClient({
      data: [
        {
          status: "active",
          current_period_end: null,
          ls_subscription_id: "ls_1",
        },
      ],
      error: null,
    });

    await selectActiveSubscription(client, "parent-42");

    expect(client.calls.from).toContain("parent_subscriptions");
    expect(client.calls.eq).toHaveLength(1);
    expect(client.calls.eq[0]).toEqual(["parent_id", "parent-42"]);
    expect(client.calls.eq.some(([col]) => col === "student_id")).toBe(false);
    // The mock deliberately has no .maybeSingle() method — if the implementation
    // called it, this test would already have thrown a TypeError before reaching here.
  });
});
