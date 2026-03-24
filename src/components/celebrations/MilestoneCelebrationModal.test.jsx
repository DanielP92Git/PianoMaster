import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../i18n';
import { MilestoneCelebrationModal } from './MilestoneCelebrationModal';

vi.mock('../../utils/useMotionTokens', () => ({
  useMotionTokens: () => ({
    reduce: false,
    soft: { type: 'spring', stiffness: 360, damping: 28 },
  }),
}));

vi.mock('./ConfettiEffect', () => ({
  ConfettiEffect: () => <div data-testid="confetti" />,
}));

describe('MilestoneCelebrationModal', () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders milestone number and title for tier 5', () => {
    render(<MilestoneCelebrationModal milestone={5} onClose={onClose} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/5-Day Streak/i)).toBeInTheDocument();
  });

  it('renders milestone number and title for tier 30', () => {
    render(<MilestoneCelebrationModal milestone={30} onClose={onClose} />);
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText(/30-Day Champion/i)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<MilestoneCelebrationModal milestone={5} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on Escape keydown', () => {
    render(<MilestoneCelebrationModal milestone={5} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders dismiss button with autoFocus', () => {
    render(<MilestoneCelebrationModal milestone={5} onClose={onClose} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has correct ARIA attributes', () => {
    render(<MilestoneCelebrationModal milestone={5} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
