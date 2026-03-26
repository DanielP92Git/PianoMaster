/**
 * AppSettings Cleanup Tests
 *
 * Requirements: D-12, D-14, REQ-07, REQ-08
 *
 * Verified behaviors:
 *   - ParentZoneEntryCard is rendered
 *   - FeedbackForm is rendered (D-14)
 *   - No "subscriptionTitle" section rendered (D-12/REQ-07)
 *   - No "streakSettingsTitle" section rendered (REQ-08)
 *   - No NotificationPermissionCard rendered (D-11 moved to portal)
 *   - No showParentGate-style gate for weekend pass flow (REQ-08)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock: react-router-dom ──────────────────────────────────────────────────
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

// ─── Mock: react-i18next ─────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => 'ltr', language: 'en', changeLanguage: vi.fn() },
  }),
}));

// ─── Mock: react-hot-toast ───────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  default: { error: vi.fn(), success: vi.fn() },
}));

// ─── Mock: Authentication ─────────────────────────────────────────────────────
vi.mock('../features/authentication/useUser', () => ({
  useUser: () => ({
    user: { id: 'test-user-id', email: 'test@test.com', user_metadata: { first_name: 'Test' } },
  }),
}));

// ─── Mock: Settings Context ───────────────────────────────────────────────────
vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({
    preferences: {
      notifications_enabled: false,
      notify_practice_reminder: false,
      notify_achievements: false,
      notify_weekly_summary: false,
      notify_streak_at_risk: false,
      notify_new_content: false,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
      daily_reminder_time: '18:00',
      web_push_enabled: false,
    },
    updatePreference: vi.fn(),
    updateNotificationType: vi.fn(),
    isLoading: false,
  }),
}));

// ─── Mock: Accessibility Context ─────────────────────────────────────────────
vi.mock('../contexts/AccessibilityContext', () => ({
  useAccessibility: () => ({
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    extendedTimeouts: false,
    actions: {
      toggleHighContrast: vi.fn(),
      toggleReducedMotion: vi.fn(),
      toggleScreenReader: vi.fn(),
      toggleExtendedTimeouts: vi.fn(),
    },
  }),
}));

// ─── Mock: Audio Settings ─────────────────────────────────────────────────────
vi.mock('../hooks/useGlobalAudioSettings', () => ({
  default: () => ({
    effectiveVolume: 0.7,
    shouldPlaySound: () => true,
    masterEnabled: true,
    actions: { setMasterEnabled: vi.fn(), setVolume: vi.fn() },
  }),
}));

// ─── Mock: Subscription Context ──────────────────────────────────────────────
vi.mock('../contexts/SubscriptionContext', () => ({
  useSubscription: () => ({ isLoading: false, isPremium: false }),
}));

// ─── Mock: pwaDetection ──────────────────────────────────────────────────────
vi.mock('../utils/pwaDetection', () => ({
  isAndroidDevice: () => false,
  isChromeBrowser: () => false,
  isIOSDevice: () => false,
  isSafariBrowser: () => false,
  isInStandaloneMode: () => false,
}));

// ─── Mock: supabase ──────────────────────────────────────────────────────────
vi.mock('../services/supabase', () => ({
  default: {
    from: () => ({ upsert: vi.fn().mockResolvedValue({ error: null }) }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
  },
}));

// ─── Mock: AuthButton ────────────────────────────────────────────────────────
vi.mock('../components/auth/AuthButton', () => ({
  default: () => <button data-testid="auth-button">Logout</button>,
}));

// ─── Mock: ProfileForm ────────────────────────────────────────────────────────
vi.mock('../components/settings/ProfileForm', () => ({
  default: () => <div data-testid="profile-form" />,
}));

// ─── Mock: LanguageSelector ───────────────────────────────────────────────────
vi.mock('../components/settings/LanguageSelector', () => ({
  default: () => <div data-testid="language-selector" />,
}));

// ─── Mock: ParentZoneEntryCard ────────────────────────────────────────────────
vi.mock('../components/settings/ParentZoneEntryCard', () => ({
  default: () => <div data-testid="parent-zone-entry-card">Parent Zone Entry</div>,
}));

// ─── Mock: FeedbackForm ───────────────────────────────────────────────────────
vi.mock('../components/settings/FeedbackForm', () => ({
  default: () => <div data-testid="feedback-form">Feedback</div>,
}));

// ─── Mock: ParentGateMath ─────────────────────────────────────────────────────
vi.mock('../components/settings/ParentGateMath', () => ({
  default: ({ onConsent, onCancel }) => (
    <div data-testid="parent-gate-math">
      <button onClick={onConsent}>Consent</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// ─── Mock: AccountDeletionModal ───────────────────────────────────────────────
vi.mock('../components/teacher/AccountDeletionModal', () => ({
  default: () => <div data-testid="account-deletion-modal" />,
}));

// ─── Mock: SettingsSection — renders children only when open ─────────────────
vi.mock('../components/settings/SettingsSection', () => ({
  default: ({ title, children }) => (
    <div data-testid="settings-section">
      <span data-testid="section-title">{title}</span>
      {children}
    </div>
  ),
}));

// ─── Mock: ToggleSetting ─────────────────────────────────────────────────────
vi.mock('../components/settings/ToggleSetting', () => ({
  default: ({ label }) => <div data-testid="toggle-setting">{label}</div>,
  ToggleSetting: ({ label }) => <div data-testid="toggle-setting">{label}</div>,
}));

// ─── Mock: SliderSetting ─────────────────────────────────────────────────────
vi.mock('../components/settings/SliderSetting', () => ({
  default: ({ label }) => <div data-testid="slider-setting">{label}</div>,
}));

// ─── Mock: TimePicker ─────────────────────────────────────────────────────────
vi.mock('../components/settings/TimePicker', () => ({
  default: ({ label }) => <div data-testid="time-picker">{label}</div>,
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import AppSettings from './AppSettings';

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AppSettings />
    </QueryClientProvider>
  );
}

describe('AppSettings — Phase 06 cleanup (D-12, D-14, REQ-07, REQ-08)', () => {
  it('REQ-02/REQ-07: ParentZoneEntryCard is rendered', () => {
    renderSettings();
    expect(screen.getByTestId('parent-zone-entry-card')).toBeInTheDocument();
  });

  it('D-14: FeedbackForm is rendered', () => {
    renderSettings();
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument();
  });

  it('D-12/REQ-07: no "subscriptionTitle" section is rendered', () => {
    renderSettings();
    // i18n key pages.settings.subscriptionTitle should not appear in any section title
    const sectionTitles = screen.queryAllByTestId('section-title').map((el) => el.textContent);
    expect(sectionTitles).not.toContain('pages.settings.subscriptionTitle');
  });

  it('REQ-08: no "streakSettingsTitle" section is rendered', () => {
    renderSettings();
    const sectionTitles = screen.queryAllByTestId('section-title').map((el) => el.textContent);
    expect(sectionTitles).not.toContain('streak.streakSettingsTitle');
  });

  it('D-11: NotificationPermissionCard is NOT rendered in AppSettings', () => {
    renderSettings();
    // NotificationPermissionCard moved to ParentPortalPage — should NOT appear here
    expect(screen.queryByTestId('notification-permission-card')).not.toBeInTheDocument();
  });

  it('REQ-08: no showParentGate-style overlay for weekend pass (parent-gate-math not shown on load)', () => {
    renderSettings();
    // ParentGateMath should NOT be rendered on initial load (only renders for account deletion)
    expect(screen.queryByTestId('parent-gate-math')).not.toBeInTheDocument();
  });
});
