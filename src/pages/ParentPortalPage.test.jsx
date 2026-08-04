/**
 * ParentPortalPage Tests
 *
 * Requirements: COPPA-01, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-13, REQ-03, REQ-05, REQ-06
 *
 * Verified behaviors (post-split, D-08):
 *   - Quick Stats + practice heatmap render immediately WITHOUT solving the gate (ungated read-only)
 *   - Stat queries are keyed on the active child id (useActiveChildId), not the parent user id
 *   - Subscription management + notification settings are locked (gated) until the shared
 *     ParentGateContext reports `passed` — clicking the lock affordance opens the math prompt,
 *     and solving it calls the shared `pass()` (no page-local gateOpen state)
 *   - The embedded NotificationPermissionCard only mounts once the shared gate is passed
 *   - Weekend pass toggle calls streakService.setWeekendPass directly (no sub-gate, out of scope)
 *   - The Privacy Policy link renders in the parent-settings area, opens /privacy in a new tab
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── Mock: react-router-dom ──────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

// ─── Mock: react-i18next ─────────────────────────────────────────────────────
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => "ltr", language: "en" },
  }),
}));

// ─── Mock: react-hot-toast ───────────────────────────────────────────────────
vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  default: { error: vi.fn(), success: vi.fn() },
}));

// ─── Mock: ParentGateMath — lightweight stub with Consent/Cancel buttons ─────
vi.mock("../components/settings/ParentGateMath", () => ({
  default: ({ onConsent, onCancel }) => (
    <div data-testid="parent-gate">
      <button data-testid="gate-consent" onClick={onConsent}>
        Consent
      </button>
      <button data-testid="gate-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

// ─── Mock: shared ParentGateContext (Plan 05) ────────────────────────────────
let mockPassed = false;
const mockPass = vi.fn(() => {
  mockPassed = true;
});

vi.mock("../contexts/ParentGateContext", () => ({
  useParentGate: () => ({ passed: mockPassed, pass: mockPass }),
}));

// ─── Mock: useActiveChildId (Plan 02) ────────────────────────────────────────
vi.mock("../hooks/useActiveChildId", () => ({
  useActiveChildId: () => ({ childId: "active-child-456", ready: true }),
}));

// ─── Mock: QuickStatsGrid ─────────────────────────────────────────────────────
vi.mock("../components/parent/QuickStatsGrid", () => ({
  default: () => <div data-testid="quick-stats-grid" />,
}));

// ─── Mock: PracticeHeatmapCard ───────────────────────────────────────────────
vi.mock("../components/parent/PracticeHeatmapCard", () => ({
  default: () => <div data-testid="practice-heatmap-card" />,
}));

// ─── Mock: NotificationPermissionCard ────────────────────────────────────────
vi.mock("../components/settings/NotificationPermissionCard", () => ({
  default: () => <div data-testid="notification-permission-card" />,
}));

// ─── Mock: ToggleSetting ─────────────────────────────────────────────────────
vi.mock("../components/settings/ToggleSetting", () => ({
  default: ({ label, onChange, value }) => (
    <div data-testid="toggle-setting">
      <span>{label}</span>
      <button data-testid="toggle-btn" onClick={() => onChange(!value)}>
        toggle
      </button>
    </div>
  ),
  ToggleSetting: ({ label, onChange, value }) => (
    <div data-testid="toggle-setting">
      <span>{label}</span>
      <button data-testid="toggle-btn" onClick={() => onChange(!value)}>
        toggle
      </button>
    </div>
  ),
}));

// ─── Mock: BackButton ─────────────────────────────────────────────────────────
vi.mock("../components/ui/BackButton", () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

// ─── Mock: TimePicker ────────────────────────────────────────────────────────
vi.mock("../components/settings/TimePicker", () => ({
  default: () => <div data-testid="time-picker" />,
}));

// ─── Mock: SettingsSection ───────────────────────────────────────────────────
vi.mock("../components/settings/SettingsSection", () => ({
  default: ({ title, children }) => (
    <div data-testid="settings-section">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

// ─── Mock: AccountDeletionModal ──────────────────────────────────────────────
vi.mock("../components/teacher/AccountDeletionModal", () => ({
  default: () => null,
}));

// ─── Mock: useUser ────────────────────────────────────────────────────────────
vi.mock("../features/authentication/useUser", () => ({
  useUser: () => ({ user: { id: "test-user-123" } }),
}));

// ─── Mock: SubscriptionContext ────────────────────────────────────────────────
vi.mock("../contexts/SubscriptionContext", () => ({
  useSubscription: () => ({ isLoading: false, isPremium: false }),
}));

// ─── Mock: SettingsContext ────────────────────────────────────────────────────
vi.mock("../contexts/SettingsContext", () => ({
  useSettings: () => ({
    preferences: {
      notifications_enabled: false,
      notification_types: {},
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00",
      daily_reminder_enabled: false,
      daily_reminder_time: "16:00",
    },
    updatePreference: vi.fn(),
    updateNotificationType: vi.fn(),
  }),
}));

// ─── Mock: subscriptionService ────────────────────────────────────────────────
vi.mock("../services/subscriptionService", () => ({
  fetchSubscriptionDetail: vi.fn().mockResolvedValue(null),
}));

// ─── Mock: xpSystem ──────────────────────────────────────────────────────────
const mockGetStudentXP = vi.fn().mockResolvedValue(null);
vi.mock("../utils/xpSystem", () => ({
  getStudentXP: (...args) => mockGetStudentXP(...args),
}));

// ─── Mock: skillProgressService ──────────────────────────────────────────────
const mockGetStudentProgress = vi.fn().mockResolvedValue([]);
vi.mock("../services/skillProgressService", () => ({
  getStudentProgress: (...args) => mockGetStudentProgress(...args),
}));

// ─── Mock: streakService ─────────────────────────────────────────────────────
const mockSetWeekendPass = vi.fn().mockResolvedValue(undefined);
const mockGetStreakState = vi
  .fn()
  .mockResolvedValue({ streakCount: 5, weekendPassEnabled: false });

vi.mock("../services/streakService", () => ({
  streakService: {
    getStreakState: (...args) => mockGetStreakState(...args),
    setWeekendPass: (...args) => mockSetWeekendPass(...args),
  },
}));

// ─── Mock: supabase ──────────────────────────────────────────────────────────
vi.mock("../services/supabase", () => ({
  default: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

// ─── Helper ──────────────────────────────────────────────────────────────────
function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

// ─── Import after mocks ───────────────────────────────────────────────────────
import ParentPortalPage from "./ParentPortalPage";

function renderPortal() {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ParentPortalPage />
    </QueryClientProvider>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("ParentPortalPage — ungated read-only stats (D-08)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPassed = false;
    mockPass.mockClear();
    mockGetStudentXP.mockClear();
    mockGetStudentProgress.mockClear();
    mockGetStreakState.mockClear();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it("D-08: Quick Stats grid renders on mount WITHOUT the gate being passed", () => {
    renderPortal();
    expect(screen.getByTestId("quick-stats-grid")).toBeInTheDocument();
  });

  it("D-08: practice heatmap renders on mount WITHOUT the gate being passed", () => {
    renderPortal();
    expect(screen.getByTestId("practice-heatmap-card")).toBeInTheDocument();
  });

  it("D-08: no ParentGateMath prompt appears on mount (only on-demand, via lock click)", () => {
    renderPortal();
    expect(screen.queryByTestId("parent-gate")).not.toBeInTheDocument();
  });

  it("stat queries are keyed on the active child id, not the parent user id", async () => {
    renderPortal();
    await waitFor(() => {
      expect(mockGetStudentXP).toHaveBeenCalledWith("active-child-456");
      expect(mockGetStudentProgress).toHaveBeenCalledWith("active-child-456");
      expect(mockGetStreakState).toHaveBeenCalledWith("active-child-456");
    });
  });
});

describe("ParentPortalPage — gated action rows (D-08/COPPA-01)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPassed = false;
    mockPass.mockClear();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it("subscription action content is NOT rendered until the gate is passed", () => {
    renderPortal();
    // Locked state renders a lock affordance, not the real subscription content
    expect(
      screen.queryByText("parentPortal.cancelSubscription")
    ).not.toBeInTheDocument();
  });

  it("the embedded NotificationPermissionCard does NOT mount until the gate is passed", () => {
    renderPortal();
    expect(
      screen.queryByTestId("notification-permission-card")
    ).not.toBeInTheDocument();
  });

  it("clicking the lock affordance opens the shared ParentGateMath prompt", () => {
    renderPortal();
    const lockButtons = screen.getAllByText("parentPortal.unlockToManage");
    expect(lockButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(lockButtons[0]);
    expect(screen.getByTestId("parent-gate")).toBeInTheDocument();
  });

  it("solving the gate calls the shared pass() (no page-local gateOpen state)", () => {
    renderPortal();
    const lockButtons = screen.getAllByText("parentPortal.unlockToManage");
    fireEvent.click(lockButtons[0]);
    fireEvent.click(screen.getByTestId("gate-consent"));
    expect(mockPass).toHaveBeenCalled();
  });

  it("cancelling the gate prompt closes it without granting access", () => {
    renderPortal();
    const lockButtons = screen.getAllByText("parentPortal.unlockToManage");
    fireEvent.click(lockButtons[0]);
    fireEvent.click(screen.getByTestId("gate-cancel"));
    expect(screen.queryByTestId("parent-gate")).not.toBeInTheDocument();
    expect(mockPass).not.toHaveBeenCalled();
  });
});

describe("ParentPortalPage — action rows visible when gate is passed (D-06)", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPassed = true;
    mockPass.mockClear();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it("D-11/REQ-05: NotificationPermissionCard renders once the shared gate is passed", () => {
    renderPortal();
    expect(
      screen.getByTestId("notification-permission-card")
    ).toBeInTheDocument();
  });

  it("no lock affordance is shown once the shared gate is passed", () => {
    renderPortal();
    expect(
      screen.queryByText("parentPortal.unlockToManage")
    ).not.toBeInTheDocument();
  });
});

describe("ParentPortalPage — always-visible sections", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockPassed = false;
    mockPass.mockClear();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it("D-13/REQ-06: weekend pass toggle calls streakService.setWeekendPass directly (no sub-gate)", async () => {
    renderPortal();
    const weekendPassLabel = screen.getByText("streak.weekendPassLabel");
    const toggleContainer = weekendPassLabel.closest(
      '[data-testid="toggle-setting"]'
    );
    const toggleBtn = toggleContainer.querySelector(
      '[data-testid="toggle-btn"]'
    );
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(mockSetWeekendPass).toHaveBeenCalledWith(true);
    });
    // Crucially, no ParentGateMath gate should appear for this ungated toggle
    expect(screen.queryByTestId("parent-gate")).not.toBeInTheDocument();
  });

  it("SIGNUP-05/D-12: Privacy Policy link renders in the parent-settings area, opens /privacy in a new tab", () => {
    renderPortal();
    const privacyLink = screen.getByText("auth.signup.terms.privacyLink");
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(privacyLink).toHaveAttribute("target", "_blank");
  });

  it("D-09: portal heading uses parentPortal.parentZoneTitle i18n key", () => {
    renderPortal();
    expect(
      screen.getByText("parentPortal.parentZoneTitle")
    ).toBeInTheDocument();
  });

  it("D-09: Quick Stats section heading uses parentPortal.quickStatsHeading", () => {
    renderPortal();
    expect(
      screen.getByText("parentPortal.quickStatsHeading")
    ).toBeInTheDocument();
  });

  it("D-09: Parent Settings section heading uses parentPortal.parentSettingsHeading", () => {
    renderPortal();
    expect(
      screen.getByText("parentPortal.parentSettingsHeading")
    ).toBeInTheDocument();
  });
});
