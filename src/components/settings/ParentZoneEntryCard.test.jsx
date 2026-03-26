/**
 * ParentZoneEntryCard Tests
 *
 * Requirements: D-02, D-03, REQ-02
 *
 * Verified behaviors:
 *   - Renders with correct i18n text keys (title + subtitle)
 *   - Calls navigate('/parent-portal') on click
 *   - RTL: flex-row-reverse class applied when i18n.dir() returns 'rtl'
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// The i18n mock factory allows per-test direction override
let mockDir = 'ltr';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { dir: () => mockDir },
  }),
}));

// Import after mocks are hoisted
const { default: ParentZoneEntryCard } = await import('./ParentZoneEntryCard');

describe('ParentZoneEntryCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockDir = 'ltr';
  });

  it('D-02/REQ-02: renders title key navigation.links.parentZone', () => {
    render(<ParentZoneEntryCard />);
    expect(screen.getByText('navigation.links.parentZone')).toBeInTheDocument();
  });

  it('D-02/REQ-02: renders subtitle key parentPortal.entryCardSubtitle', () => {
    render(<ParentZoneEntryCard />);
    expect(screen.getByText('parentPortal.entryCardSubtitle')).toBeInTheDocument();
  });

  it('D-03: clicking the card navigates to /parent-portal', () => {
    render(<ParentZoneEntryCard />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/parent-portal');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('D-02: LTR layout does NOT apply flex-row-reverse', () => {
    mockDir = 'ltr';
    render(<ParentZoneEntryCard />);
    expect(screen.getByRole('button').className).not.toContain('flex-row-reverse');
  });

  it('D-02: RTL layout applies flex-row-reverse class', () => {
    mockDir = 'rtl';
    render(<ParentZoneEntryCard />);
    expect(screen.getByRole('button').className).toContain('flex-row-reverse');
  });
});
