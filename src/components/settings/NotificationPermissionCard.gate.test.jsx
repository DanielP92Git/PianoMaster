/**
 * NotificationPermissionCard — shared parental gate migration tests (D-06)
 *
 * Verifies:
 *   1. When the shared gate is already `passed`, clicking Enable proceeds
 *      directly to subscription (no re-solve) and no ParentGateMath renders
 *      (the card no longer holds its own gate/mounts its own math prompt).
 *   2. When the shared gate is NOT passed, clicking Enable defers to the
 *      shared gate (calls `pass`) and does NOT subscribe ungated.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mock: react-i18next ─────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// ─── Mock: shared ParentGateContext (Plan 05) ────────────────────────────────
let mockPassed = false;
const mockPass = vi.fn();

vi.mock("../../contexts/ParentGateContext", () => ({
  useParentGate: () => ({ passed: mockPassed, pass: mockPass }),
}));

// ─── Mock: notificationService ───────────────────────────────────────────────
const mockRequestNotificationPermission = vi.fn().mockResolvedValue("granted");
const mockSubscribeToPushNotifications = vi
  .fn()
  .mockResolvedValue({ endpoint: "https://push.example/sub" });
const mockSavePushSubscription = vi.fn().mockResolvedValue(undefined);
const mockGetPushSubscriptionStatus = vi.fn().mockResolvedValue({
  is_enabled: false,
  parent_consent_granted: false,
});

vi.mock("../../services/notificationService", () => ({
  isPushNotificationSupported: () => true,
  getNotificationPermission: () => "default",
  requestNotificationPermission: (...args) =>
    mockRequestNotificationPermission(...args),
  subscribeToPushNotifications: (...args) =>
    mockSubscribeToPushNotifications(...args),
  savePushSubscription: (...args) => mockSavePushSubscription(...args),
  removePushSubscription: vi.fn(),
  getPushSubscriptionStatus: (...args) =>
    mockGetPushSubscriptionStatus(...args),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import { NotificationPermissionCard } from "./NotificationPermissionCard";

describe("NotificationPermissionCard — shared gate migration (D-06)", () => {
  beforeEach(() => {
    mockPassed = false;
    mockPass.mockReset();
    mockRequestNotificationPermission.mockClear();
    mockSubscribeToPushNotifications.mockClear();
    mockSavePushSubscription.mockClear();
    mockGetPushSubscriptionStatus.mockClear();
    mockGetPushSubscriptionStatus.mockResolvedValue({
      is_enabled: false,
      parent_consent_granted: false,
    });

    // checkIosInstallRequired() calls window.matchMedia — jsdom doesn't
    // implement it by default (throws), so stub it as a non-iOS desktop browser.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("passed=true: clicking Enable subscribes directly, no ParentGateMath rendered", async () => {
    mockPassed = true;
    render(<NotificationPermissionCard studentId="child-123" />);

    const enableButton = await screen.findByRole("button", {
      name: "pages.settings.notifications.pushNotifications.enableButton",
    });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockSubscribeToPushNotifications).toHaveBeenCalled();
    });
    expect(mockSavePushSubscription).toHaveBeenCalledWith(
      "child-123",
      expect.anything()
    );
    // The card must never render its own math modal — no such testid/text exists
    expect(screen.queryByText(/parent.*gate/i)).not.toBeInTheDocument();
    expect(mockPass).not.toHaveBeenCalled();
  });

  it("passed=false: clicking Enable defers to the shared gate, does NOT subscribe ungated", async () => {
    mockPassed = false;
    render(<NotificationPermissionCard studentId="child-123" />);

    const enableButton = await screen.findByRole("button", {
      name: "pages.settings.notifications.pushNotifications.enableButton",
    });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(mockPass).toHaveBeenCalled();
    });
    expect(mockSubscribeToPushNotifications).not.toHaveBeenCalled();
    expect(mockSavePushSubscription).not.toHaveBeenCalled();
  });
});
