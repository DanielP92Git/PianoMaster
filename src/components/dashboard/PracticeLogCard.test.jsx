/**
 * PracticeLogCard Component Tests
 *
 * Tests 4 render states:
 *   1. Loading skeleton (queries loading)
 *   2. Active prompt (not yet logged, streak = 0)
 *   3. Active prompt with streak visible (streak >= 1)
 *   4. Completed state (already logged today)
 * Also tests:
 *   - Streak hidden at 0
 *   - Streak visible at 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PracticeLogCard from './PracticeLogCard';

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('../../features/authentication/useUser', () => ({
  useUser: vi.fn(),
}));

vi.mock('../../services/practiceLogService', () => ({
  practiceLogService: {
    getTodayStatus: vi.fn(),
    logPractice: vi.fn(),
    PRACTICE_XP_REWARD: 25,
  },
}));

vi.mock('../../services/practiceStreakService', () => ({
  practiceStreakService: {
    getPracticeStreak: vi.fn(),
    updatePracticeStreak: vi.fn(),
  },
}));

vi.mock('../../utils/dateUtils', () => ({
  getCalendarDate: vi.fn(() => '2026-03-24'),
}));

vi.mock('../../utils/useMotionTokens', () => ({
  useMotionTokens: vi.fn(() => ({
    reduce: false,
    snappy: { type: 'spring', stiffness: 520, damping: 34 },
    soft: { type: 'spring', stiffness: 360, damping: 28 },
    fade: { duration: 0.18, ease: 'easeOut' },
  })),
}));

// Framer Motion: render children directly (no animations in test environment)
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key, options) => {
      // Simple key resolution for test assertions
      const translations = {
        'practice.card.title': 'Practice Instrument',
        'practice.card.prompt': 'Did you practice today?',
        'practice.card.logButton': 'Yes, I practiced!',
        'practice.card.loggingText': 'Logged!',
        'practice.card.xpBadge': '+25 XP',
        'practice.card.completedHeading': 'Practiced today!',
        'practice.card.xpEarned': '+25 XP earned',
        'practice.streak.dayLabel': 'day practice streak',
      };
      return translations[key] ?? key;
    },
    i18n: {
      dir: () => 'ltr',
      language: 'en',
    },
  })),
}));

// ─── Test helpers ─────────────────────────────────────────────────────────────

import { useUser } from '../../features/authentication/useUser';
import { practiceLogService } from '../../services/practiceLogService';
import { practiceStreakService } from '../../services/practiceStreakService';

const TEST_USER_ID = 'test-user-uuid-12345';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable staleTime so tests get data immediately
        staleTime: 0,
      },
    },
  });
}

function renderCard(queryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <PracticeLogCard />
    </QueryClientProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PracticeLogCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default user mock
    useUser.mockReturnValue({ user: { id: TEST_USER_ID } });
  });

  it('renders loading skeleton while queries are pending', () => {
    // Queries never resolve (pending)
    practiceLogService.getTodayStatus.mockReturnValue(new Promise(() => {}));
    practiceStreakService.getPracticeStreak.mockReturnValue(new Promise(() => {}));

    const queryClient = makeQueryClient();
    renderCard(queryClient);

    // Loading skeleton: pulse divs (no heading text rendered)
    const pulseDivs = document.querySelectorAll('.animate-pulse');
    expect(pulseDivs.length).toBeGreaterThan(0);

    // Should NOT show button or completed heading during loading
    expect(screen.queryByText("Yes, I practiced!")).not.toBeInTheDocument();
    expect(screen.queryByText("Practiced today!")).not.toBeInTheDocument();
  });

  it('renders active prompt when not logged today (streak = 0)', async () => {
    practiceLogService.getTodayStatus.mockResolvedValue({ logged: false });
    practiceStreakService.getPracticeStreak.mockResolvedValue({
      streakCount: 0,
      lastPracticedOn: null,
    });

    const queryClient = makeQueryClient();
    renderCard(queryClient);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Yes, I practiced!')).toBeInTheDocument();
    });

    // Should show card title
    expect(screen.getByText('Practice Instrument')).toBeInTheDocument();

    // Should show prompt
    expect(screen.getByText('Did you practice today?')).toBeInTheDocument();

    // Should show log button with correct text
    const button = screen.getByRole('button', { name: 'Yes, I practiced!' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // Should NOT show completed heading
    expect(screen.queryByText('Practiced today!')).not.toBeInTheDocument();
  });

  it('renders completed state when already logged today', async () => {
    practiceLogService.getTodayStatus.mockResolvedValue({ logged: true });
    practiceStreakService.getPracticeStreak.mockResolvedValue({
      streakCount: 1,
      lastPracticedOn: '2026-03-24',
    });

    const queryClient = makeQueryClient();
    renderCard(queryClient);

    // Wait for data to load and settled state to activate
    await waitFor(() => {
      expect(screen.getByText('Practiced today!')).toBeInTheDocument();
    });

    // Should show completed heading
    expect(screen.getByText('Practiced today!')).toBeInTheDocument();

    // Should show XP earned
    expect(screen.getByText('+25 XP earned')).toBeInTheDocument();

    // Should NOT show active log button
    expect(screen.queryByRole('button', { name: 'Yes, I practiced!' })).not.toBeInTheDocument();
  });

  it('hides streak row when streakCount is 0', async () => {
    practiceLogService.getTodayStatus.mockResolvedValue({ logged: false });
    practiceStreakService.getPracticeStreak.mockResolvedValue({
      streakCount: 0,
      lastPracticedOn: null,
    });

    const queryClient = makeQueryClient();
    renderCard(queryClient);

    await waitFor(() => {
      expect(screen.getByText('Yes, I practiced!')).toBeInTheDocument();
    });

    // Streak label should NOT appear when count is 0
    expect(screen.queryByText('day practice streak')).not.toBeInTheDocument();
  });

  it('shows streak row when streakCount is 5', async () => {
    practiceLogService.getTodayStatus.mockResolvedValue({ logged: false });
    practiceStreakService.getPracticeStreak.mockResolvedValue({
      streakCount: 5,
      lastPracticedOn: '2026-03-23',
    });

    const queryClient = makeQueryClient();
    renderCard(queryClient);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    // Streak count and label should be visible
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('day practice streak')).toBeInTheDocument();
  });
});
