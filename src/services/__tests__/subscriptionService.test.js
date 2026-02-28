import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so mock variables are available when vi.mock() factory runs
// (vi.mock is hoisted to the top of the file by Vitest's transform)
const { mockMaybeSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockMaybeSingle, mockEq, mockSelect, mockFrom };
});

vi.mock("../supabase", () => ({
  default: { from: mockFrom },
}));

// Import after mock setup
import { fetchSubscriptionStatus } from "../subscriptionService";

describe("fetchSubscriptionStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-wire mock chain after clearAllMocks (clearAllMocks resets mock implementations)
    mockEq.mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
    mockSelect.mockImplementation(() => ({ eq: mockEq }));
    mockFrom.mockImplementation(() => ({ select: mockSelect }));
  });

  it("returns isPremium: false for null studentId without making a Supabase call", async () => {
    const result = await fetchSubscriptionStatus(null);
    expect(result).toEqual({ isPremium: false });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns isPremium: false when no subscription row exists", async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: false });
    expect(mockFrom).toHaveBeenCalledWith("parent_subscriptions");
    expect(mockSelect).toHaveBeenCalledWith("status, current_period_end");
    expect(mockEq).toHaveBeenCalledWith("student_id", "student-uuid-123");
  });

  it("returns isPremium: false on Supabase error", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: new Error("Database connection failed"),
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("returns isPremium: true for status 'active'", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { status: "active", current_period_end: null },
      error: null,
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: true for status 'on_trial'", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { status: "on_trial", current_period_end: null },
      error: null,
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: true for cancelled with future period end (grace period)", async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: { status: "cancelled", current_period_end: futureDate },
      error: null,
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });

  it("returns isPremium: false for cancelled with past period end", async () => {
    const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: { status: "cancelled", current_period_end: pastDate },
      error: null,
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: false });
  });

  it("returns isPremium: true for past_due within 3-day grace period", async () => {
    // period ended 1 day ago — within the 3-day grace window
    const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    mockMaybeSingle.mockResolvedValue({
      data: { status: "past_due", current_period_end: recentDate },
      error: null,
    });

    const result = await fetchSubscriptionStatus("student-uuid-123");
    expect(result).toEqual({ isPremium: true });
  });
});
