/**
 * ParentPortalPage Tests
 *
 * Requirements: D-04, D-05, D-06, D-07, D-09, D-10, D-11, D-13, REQ-03, REQ-05, REQ-06
 *
 * Verified behaviors:
 *   - Gate (ParentGateMath) renders on mount (gateOpen=true initial state)
 *   - Portal content is hidden while gate is open
 *   - After gate consent, portal content is visible with 4 sections
 *   - Gate cancel calls navigate(-1)
 *   - Portal contains QuickStatsGrid, PracticeHeatmapCard, NotificationPermissionCard, ToggleSetting for weekend pass
 *   - Weekend pass toggle calls streakService.setWeekendPass directly (no sub-gate)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock: react-router-dom ──────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ─── Mock: react-i18next ─────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => 'ltr', language: 'en' },
  }),
}));

// ─── Mock: react-hot-toast ───────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  default: { error: vi.fn(), success: vi.fn() },
}));

// ─── Mock: ParentGateMath — lightweight stub with Consent/Cancel buttons ─────
vi.mock('../components/settings/ParentGateMath', () => ({
  default: ({ onConsent, onCancel }) => (
    <div data-testid="parent-gate">
      <button data-testid="gate-consent" onClick={onConsent}>Consent</button>
      <button data-testid="gate-cancel" onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// ─── Mock: QuickStatsGrid ─────────────────────────────────────────────────────
vi.mock('../components/parent/QuickStatsGrid', () => ({
  default: () => <div data-testid="quick-stats-grid" />,
}));

// ─── Mock: PracticeHeatmapCard ───────────────────────────────────────────────
vi.mock('../components/parent/PracticeHeatmapCard', () => ({
  default: () => <div data-testid="practice-heatmap-card" />,
}));

// ─── Mock: NotificationPermissionCard ────────────────────────────────────────
vi.mock('../components/settings/NotificationPermissionCard', () => ({
  default: () => <div data-testid="notification-permission-card" />,
}));

// ─── Mock: ToggleSetting ─────────────────────────────────────────────────────
vi.mock('../components/settings/ToggleSetting', () => ({
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
vi.mock('../components/ui/BackButton', () => ({
  default: () => <button data-testid="back-button">Back</button>,
}));

// ─── Mock: useUser ────────────────────────────────────────────────────────────
vi.mock('../features/authentication/useUser', () => ({
  useUser: () => ({ user: { id: 'test-user-123' } }),
}));

// ─── Mock: SubscriptionContext ────────────────────────────────────────────────
vi.mock('../contexts/SubscriptionContext', () => ({
  useSubscription: () => ({ isLoading: false, isPremium: false }),
}));

// ─── Mock: subscriptionService ────────────────────────────────────────────────
vi.mock('../services/subscriptionService', () => ({
  fetchSubscriptionDetail: vi.fn().mockResolvedValue(null),
}));

// ─── Mock: xpSystem ──────────────────────────────────────────────────────────
vi.mock('../utils/xpSystem', () => ({
  getStudentXP: vi.fn().mockResolvedValue(null),
}));

// ─── Mock: skillProgressService ──────────────────────────────────────────────
vi.mock('../services/skillProgressService', () => ({
  getStudentProgress: vi.fn().mockResolvedValue([]),
}));

// ─── Mock: streakService ─────────────────────────────────────────────────────
const mockSetWeekendPass = vi.fn().mockResolvedValue(undefined);
const mockGetStreakState = vi.fn().mockResolvedValue({ streakCount: 5, weekendPassEnabled: false });

vi.mock('../services/streakService', () => ({
  streakService: {
    getStreakState: () => mockGetStreakState(),
    setWeekendPass: (...args) => mockSetWeekendPass(...args),
  },
}));

// ─── Mock: supabase ──────────────────────────────────────────────────────────
vi.mock('../services/supabase', () => ({
  default: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

// ─── Helper ──────────────────────────────────────────────────────────────────
function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  const qc = makeQueryClient();
  // Dynamic import to pick up all mocks
  const { default: ParentPortalPage } = vi.importActual('../pages/ParentPortalPage');
  return render(
    <QueryClientProvider client={qc}>
      <ParentPortalPage />
    </QueryClientProvider>
  );
}

// ─── Import after mocks ───────────────────────────────────────────────────────
import ParentPortalPage from './ParentPortalPage';

function renderPortal() {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ParentPortalPage />
    </QueryClientProvider>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('ParentPortalPage — Gate behavior', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it('D-04/D-06/REQ-03: math gate renders on initial mount', () => {
    renderPortal();
    expect(screen.getByTestId('parent-gate')).toBeInTheDocument();
  });

  it('D-07: portal content is hidden while gate is open', () => {
    renderPortal();
    expect(screen.queryByTestId('quick-stats-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('practice-heatmap-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notification-permission-card')).not.toBeInTheDocument();
  });

  it('D-05: gate cancel calls navigate(-1)', () => {
    renderPortal();
    fireEvent.click(screen.getByTestId('gate-cancel'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('D-04/D-07: after gate consent, portal content becomes visible', async () => {
    renderPortal();
    fireEvent.click(screen.getByTestId('gate-consent'));

    await waitFor(() => {
      expect(screen.queryByTestId('parent-gate')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('quick-stats-grid')).toBeInTheDocument();
  });
});

describe('ParentPortalPage — Portal sections after consent', () => {
  async function renderAndUnlock() {
    renderPortal();
    fireEvent.click(screen.getByTestId('gate-consent'));
    await waitFor(() => {
      expect(screen.queryByTestId('parent-gate')).not.toBeInTheDocument();
    });
  }

  beforeEach(() => {
    mockNavigate.mockReset();
    mockSetWeekendPass.mockReset();
    mockSetWeekendPass.mockResolvedValue(undefined);
  });

  it('D-09: QuickStatsGrid renders in Section 1 after consent', async () => {
    await renderAndUnlock();
    expect(screen.getByTestId('quick-stats-grid')).toBeInTheDocument();
  });

  it('D-09: PracticeHeatmapCard renders in Section 2 after consent', async () => {
    await renderAndUnlock();
    expect(screen.getByTestId('practice-heatmap-card')).toBeInTheDocument();
  });

  it('D-11/REQ-05: NotificationPermissionCard renders in Section 4 after consent', async () => {
    await renderAndUnlock();
    expect(screen.getByTestId('notification-permission-card')).toBeInTheDocument();
  });

  it('D-10/REQ-06: ToggleSetting for weekend pass renders in Section 4 after consent', async () => {
    await renderAndUnlock();
    expect(screen.getByTestId('toggle-setting')).toBeInTheDocument();
    // The toggle label uses the streak.weekendPassLabel i18n key
    expect(screen.getByText('streak.weekendPassLabel')).toBeInTheDocument();
  });

  it('D-13/REQ-06: weekend pass toggle calls streakService.setWeekendPass directly (no sub-gate)', async () => {
    await renderAndUnlock();
    // Click the toggle button — should call streakService.setWeekendPass with true
    fireEvent.click(screen.getByTestId('toggle-btn'));
    await waitFor(() => {
      expect(mockSetWeekendPass).toHaveBeenCalledWith(true);
    });
    // Crucially, no new ParentGateMath gate should appear
    expect(screen.queryByTestId('parent-gate')).not.toBeInTheDocument();
  });

  it('D-09: portal heading uses parentPortal.parentZoneTitle i18n key', async () => {
    await renderAndUnlock();
    expect(screen.getByText('parentPortal.parentZoneTitle')).toBeInTheDocument();
  });

  it('D-09: Quick Stats section heading uses parentPortal.quickStatsHeading', async () => {
    await renderAndUnlock();
    expect(screen.getByText('parentPortal.quickStatsHeading')).toBeInTheDocument();
  });

  it('D-09: Parent Settings section heading uses parentPortal.parentSettingsHeading', async () => {
    await renderAndUnlock();
    expect(screen.getByText('parentPortal.parentSettingsHeading')).toBeInTheDocument();
  });
});
