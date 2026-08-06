import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so mock variables are available when vi.mock() factory runs
// (vi.mock is hoisted to the top of the file by Vitest's transform).
//
// D-05/D-14 shortened the parent_subscriptions read chain: fetchSubscriptionStatus now ends
// at .eq() (awaited directly, resolving to an array), and fetchSubscriptionDetail ends at
// .order() (also resolving to an array — .limit(1).maybeSingle() are both gone). The
// subscription_plans lookup inside fetchSubscriptionDetail is unaffected and still ends in
// .maybeSingle(), reusing the same .eq() mock (a fresh call, since it's a separate
// supabase.from(...) chain in the source).
const { mockMaybeSingle, mockOrder, mockEq, mockSelect, mockFrom } = vi.hoisted(
  () => {
    const mockMaybeSingle = vi.fn();
    const mockOrder = vi.fn();
    const mockEq = vi.fn();
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));
    return { mockMaybeSingle, mockOrder, mockEq, mockSelect, mockFrom };
  }
);

vi.mock("../supabase", () => ({
  default: { from: mockFrom },
}));

// Import after mock setup
import {
  fetchSubscriptionStatus,
  fetchSubscriptionDetail,
} from "../subscriptionService";

/**
 * Builds the object returned by the mocked .eq(...) call: a real Promise (so `await`ing it
 * directly resolves to `result`, matching fetchSubscriptionStatus's shortened chain) that also
 * carries `.order` and `.maybeSingle` properties so fetchSubscriptionDetail's longer chain
 * (`.eq().order()`) and the plan lookup (`.eq().maybeSingle()`) both keep working.
 */
function eqResult(result) {
  const promise = Promise.resolve(result);
  promise.order = mockOrder;
  promise.maybeSingle = mockMaybeSingle;
  return promise;
}

describe("fetchSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
  });

  it("returns isPremium: false for null parentId without making a Supabase call", async () => {
    const result = await fetchSubscriptionStatus(null);
    expect(result).toEqual({ isPremium: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns isPremium: false for undefined parentId without making a Supabase call", async () => {
    const result = await fetchSubscriptionStatus(undefined);
    expect(result).toEqual({ isPremium: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns isPremium: false on Supabase error (fails CLOSED) and logs the error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockEq.mockImplementation(() =>
      eqResult({ data: null, error: new Error("Database connection failed") })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: false });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns isPremium: false for an empty array (no subscription rows)", async () => {
    mockEq.mockImplementation(() => eqResult({ data: [], error: null }));

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("returns isPremium: true for a single 'active' row", async () => {
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "active", current_period_end: null }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: true for a single 'on_trial' row", async () => {
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "on_trial", current_period_end: null }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("D-05: returns isPremium: true when ANY of two rows qualifies (one expired, one active)", async () => {
    mockEq.mockImplementation(() =>
      eqResult({
        data: [
          { status: "expired", current_period_end: null },
          { status: "active", current_period_end: null },
        ],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: false when three rows exist and none qualify", async () => {
    const pastDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const fourDaysAgo = new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000
    ).toISOString();
    mockEq.mockImplementation(() =>
      eqResult({
        data: [
          { status: "expired", current_period_end: null },
          { status: "cancelled", current_period_end: pastDate },
          { status: "past_due", current_period_end: fourDaysAgo },
        ],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("returns isPremium: true for cancelled with future period end (grace period)", async () => {
    const futureDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "cancelled", current_period_end: futureDate }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: false for cancelled with past period end", async () => {
    const pastDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "cancelled", current_period_end: pastDate }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("returns isPremium: true for past_due 1 day past period end (within 3-day grace)", async () => {
    const oneDayAgo = new Date(
      Date.now() - 1 * 24 * 60 * 60 * 1000
    ).toISOString();
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "past_due", current_period_end: oneDayAgo }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: false for past_due 4 days past period end (outside 3-day grace)", async () => {
    const fourDaysAgo = new Date(
      Date.now() - 4 * 24 * 60 * 60 * 1000
    ).toISOString();
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "past_due", current_period_end: fourDaysAgo }],
        error: null,
      })
    );

    const result = await fetchSubscriptionStatus("parent-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("D-14: queries .eq('parent_id', ...) and does NOT call .order/.limit/.maybeSingle", async () => {
    mockEq.mockImplementation(() =>
      eqResult({
        data: [{ status: "active", current_period_end: null }],
        error: null,
      })
    );

    await fetchSubscriptionStatus("parent-uuid-123");

    expect(mockFrom).toHaveBeenCalledWith("parent_subscriptions");
    expect(mockSelect).toHaveBeenCalledWith("status, current_period_end");
    expect(mockEq).toHaveBeenCalledWith("parent_id", "parent-uuid-123");
    expect(mockOrder).not.toHaveBeenCalled();
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });
});

describe("fetchSubscriptionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
  });

  it("returns null for null parentId without making a Supabase call", async () => {
    const result = await fetchSubscriptionDetail(null);
    expect(result).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("D-07: returns the active row even when a newer non-qualifying row exists", async () => {
    mockEq.mockImplementation(() => eqResult(undefined)); // unused — .order() is the terminal call
    mockOrder.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            status: "expired",
            current_period_end: null,
            plan_id: null,
            ls_subscription_id: "newest-expired",
          },
          {
            status: "active",
            current_period_end: null,
            plan_id: null,
            ls_subscription_id: "older-active",
          },
        ],
        error: null,
      })
    );

    const result = await fetchSubscriptionDetail("parent-uuid-123");
    expect(result.status).toBe("active");
    expect(result.lsSubscriptionId).toBe("older-active");
  });

  it("D-07: falls back to the most-recent row when none qualify", async () => {
    mockEq.mockImplementation(() => eqResult(undefined));
    mockOrder.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            status: "expired",
            current_period_end: null,
            plan_id: null,
            ls_subscription_id: "most-recent",
          },
          {
            status: "expired",
            current_period_end: null,
            plan_id: null,
            ls_subscription_id: "older",
          },
        ],
        error: null,
      })
    );

    const result = await fetchSubscriptionDetail("parent-uuid-123");
    expect(result.status).toBe("expired");
    expect(result.lsSubscriptionId).toBe("most-recent");
  });

  it("returns null when zero rows exist", async () => {
    mockEq.mockImplementation(() => eqResult(undefined));
    mockOrder.mockImplementation(() =>
      Promise.resolve({ data: [], error: null })
    );

    const result = await fetchSubscriptionDetail("parent-uuid-123");
    expect(result).toBeNull();
  });

  it("returns null on Supabase error", async () => {
    mockEq.mockImplementation(() => eqResult(undefined));
    mockOrder.mockImplementation(() =>
      Promise.resolve({
        data: null,
        error: new Error("Database connection failed"),
      })
    );

    const result = await fetchSubscriptionDetail("parent-uuid-123");
    expect(result).toBeNull();
  });

  it("uses the chosen row's plan_id to drive the subscription_plans lookup and returns the exact key shape", async () => {
    mockEq.mockImplementation(() => eqResult(undefined));
    mockOrder.mockImplementation(() =>
      Promise.resolve({
        data: [
          {
            status: "active",
            current_period_end: "2026-09-01T00:00:00.000Z",
            plan_id: "plan-yearly-usd",
            ls_subscription_id: "ls-sub-1",
          },
        ],
        error: null,
      })
    );
    mockMaybeSingle.mockResolvedValue({
      data: {
        name: "Yearly",
        billing_period: "yearly",
        currency: "USD",
        amount_cents: 7990,
      },
      error: null,
    });

    const result = await fetchSubscriptionDetail("parent-uuid-123");

    expect(mockEq).toHaveBeenCalledWith("parent_id", "parent-uuid-123");
    expect(mockEq).toHaveBeenCalledWith("id", "plan-yearly-usd");
    expect(Object.keys(result).sort()).toEqual(
      [
        "status",
        "currentPeriodEnd",
        "planName",
        "billingPeriod",
        "currency",
        "amountCents",
        "lsSubscriptionId",
      ].sort()
    );
    expect(result).toEqual({
      status: "active",
      currentPeriodEnd: "2026-09-01T00:00:00.000Z",
      planName: "Yearly",
      billingPeriod: "yearly",
      currency: "USD",
      amountCents: 7990,
      lsSubscriptionId: "ls-sub-1",
    });
  });
});
