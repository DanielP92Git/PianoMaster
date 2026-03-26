/**
 * appNavigationConfig Tests
 *
 * Requirements: D-01, REQ-01
 *
 * Verified behaviors:
 *   - APP_NAV_ITEMS.student contains a parentZone entry
 *   - parentZone has ShieldCheck icon, to: '/parent-portal', correct labelKey
 *   - parentZone is positioned after achievements in student array
 *   - getSidebarNavItems includes parentZone for students
 *   - getSidebarNavItems does NOT include parentZone for teachers
 */

import { describe, it, expect } from 'vitest';
import { APP_NAV_ITEMS, getSidebarNavItems } from './appNavigationConfig';

describe('APP_NAV_ITEMS.student contains parentZone', () => {
  it('D-01: student array contains an entry with id "parentZone"', () => {
    const ids = APP_NAV_ITEMS.student.map((item) => item.id);
    expect(ids).toContain('parentZone');
  });

  it('D-01: parentZone entry navigates to /parent-portal', () => {
    const entry = APP_NAV_ITEMS.student.find((item) => item.id === 'parentZone');
    expect(entry).toBeDefined();
    expect(entry.to).toBe('/parent-portal');
  });

  it('D-01: parentZone entry uses navigation.links.parentZone labelKey', () => {
    const entry = APP_NAV_ITEMS.student.find((item) => item.id === 'parentZone');
    expect(entry.labelKey).toBe('navigation.links.parentZone');
  });

  it('D-01: parentZone entry references ShieldCheck icon (lucide React component)', () => {
    const entry = APP_NAV_ITEMS.student.find((item) => item.id === 'parentZone');
    // lucide-react icons are forwardRef objects, so typeof is 'object', not 'function'
    // Verify it is truthy (not undefined/null) and has a displayName indicating ShieldCheck
    expect(entry.icon).toBeTruthy();
    const name = entry.icon.displayName || entry.icon.name || '';
    expect(name).toContain('ShieldCheck');
  });

  it('D-01: parentZone is positioned after achievements in student array', () => {
    const studentIds = APP_NAV_ITEMS.student.map((item) => item.id);
    const achievementsIndex = studentIds.indexOf('achievements');
    const parentZoneIndex = studentIds.indexOf('parentZone');
    expect(achievementsIndex).toBeGreaterThanOrEqual(0);
    expect(parentZoneIndex).toBeGreaterThan(achievementsIndex);
  });
});

describe('getSidebarNavItems includes parentZone for students', () => {
  it('REQ-01: getSidebarNavItems includes parentZone when isStudent=true', () => {
    const items = getSidebarNavItems({ isStudent: true, isTeacher: false, newFeedbackCount: 0 });
    const ids = items.map((item) => item.id);
    expect(ids).toContain('parentZone');
  });

  it('REQ-01: getSidebarNavItems does NOT include parentZone when isStudent=false', () => {
    const items = getSidebarNavItems({ isStudent: false, isTeacher: true, newFeedbackCount: 0 });
    const ids = items.map((item) => item.id);
    expect(ids).not.toContain('parentZone');
  });
});
