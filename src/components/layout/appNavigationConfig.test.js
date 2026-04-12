/**
 * appNavigationConfig Tests
 *
 * Requirements: D-01, D-04, D-05, D-09, NAV-01, NAV-02, NAV-04
 *
 * Verified behaviors:
 *   - APP_NAV_ITEMS.student[0] is trail (first item, D-09)
 *   - Trail entry has correct route, icon, labelKey, theme, end:true
 *   - Student nav order matches D-05: trail, practiceGames, studentDashboard, recordings, achievements, parentZone
 *   - studentDashboard entry navigates to /dashboard (not /)
 *   - parentZone has ShieldCheck icon, to: '/parent-portal', correct labelKey
 *   - parentZone is positioned after achievements in student array
 *   - getSidebarNavItems includes trail and studentDashboard for students
 *   - getSidebarNavItems does NOT include trail for teachers
 *   - Trail entry end property is strictly true (NAV-04)
 *   - MobileTabsNav tab-filter mapping preserves end:true for trail (NAV-04 passthrough)
 */

import { describe, it, expect } from "vitest";
import { APP_NAV_ITEMS, getSidebarNavItems } from "./appNavigationConfig";

describe("APP_NAV_ITEMS.student trail as first item", () => {
  it("D-09: student array first item has id 'trail'", () => {
    expect(APP_NAV_ITEMS.student[0].id).toBe("trail");
  });

  it("D-11: trail entry navigates to /", () => {
    const trail = APP_NAV_ITEMS.student.find((item) => item.id === "trail");
    expect(trail).toBeDefined();
    expect(trail.to).toBe("/");
  });

  it("NAV-04: trail entry has end: true for correct NavLink matching", () => {
    const trail = APP_NAV_ITEMS.student.find((item) => item.id === "trail");
    expect(trail.end).toBe(true);
  });

  it("D-15: trail entry uses TrailIcon (PNG)", () => {
    const trail = APP_NAV_ITEMS.student.find((item) => item.id === "trail");
    expect(trail.icon).toBeTruthy();
    const name = trail.icon.displayName || trail.icon.name || "";
    expect(name).toContain("TrailIcon");
  });

  it("trail entry uses navigation.links.trail labelKey", () => {
    const trail = APP_NAV_ITEMS.student.find((item) => item.id === "trail");
    expect(trail.labelKey).toBe("navigation.links.trail");
  });

  it("trail entry uses indigo theme", () => {
    const trail = APP_NAV_ITEMS.student.find((item) => item.id === "trail");
    expect(trail.theme).toBe("indigo");
  });
});

describe("APP_NAV_ITEMS.student ordering (D-05)", () => {
  it("D-05: student items are in order: trail, practiceGames, studentDashboard, recordings, achievements, parentZone", () => {
    const ids = APP_NAV_ITEMS.student.map((item) => item.id);
    expect(ids).toEqual([
      "trail",
      "practiceGames",
      "studentDashboard",
      "recordings",
      "achievements",
      "parentZone",
    ]);
  });

  it("D-12: studentDashboard entry navigates to /dashboard", () => {
    const dashboard = APP_NAV_ITEMS.student.find(
      (item) => item.id === "studentDashboard"
    );
    expect(dashboard).toBeDefined();
    expect(dashboard.to).toBe("/dashboard");
  });
});

describe("APP_NAV_ITEMS.student contains parentZone", () => {
  it("D-01: student array contains an entry with id 'parentZone'", () => {
    const ids = APP_NAV_ITEMS.student.map((item) => item.id);
    expect(ids).toContain("parentZone");
  });

  it("D-01: parentZone entry navigates to /parent-portal", () => {
    const entry = APP_NAV_ITEMS.student.find(
      (item) => item.id === "parentZone"
    );
    expect(entry).toBeDefined();
    expect(entry.to).toBe("/parent-portal");
  });

  it("D-01: parentZone entry uses navigation.links.parentZone labelKey", () => {
    const entry = APP_NAV_ITEMS.student.find(
      (item) => item.id === "parentZone"
    );
    expect(entry.labelKey).toBe("navigation.links.parentZone");
  });

  it("D-01: parentZone entry references ShieldCheck icon (lucide React component)", () => {
    const entry = APP_NAV_ITEMS.student.find(
      (item) => item.id === "parentZone"
    );
    // lucide-react icons are forwardRef objects, so typeof is 'object', not 'function'
    // Verify it is truthy (not undefined/null) and has a displayName indicating ShieldCheck
    expect(entry.icon).toBeTruthy();
    const name = entry.icon.displayName || entry.icon.name || "";
    expect(name).toContain("ShieldCheck");
  });

  it("D-01: parentZone is positioned after achievements in student array", () => {
    const studentIds = APP_NAV_ITEMS.student.map((item) => item.id);
    const achievementsIndex = studentIds.indexOf("achievements");
    const parentZoneIndex = studentIds.indexOf("parentZone");
    expect(achievementsIndex).toBeGreaterThanOrEqual(0);
    expect(parentZoneIndex).toBeGreaterThan(achievementsIndex);
  });
});

describe("getSidebarNavItems", () => {
  it("includes trail and studentDashboard for students", () => {
    const items = getSidebarNavItems({
      isStudent: true,
      isTeacher: false,
      newFeedbackCount: 0,
    });
    const ids = items.map((item) => item.id);
    expect(ids).toContain("trail");
    expect(ids).toContain("studentDashboard");
  });

  it("includes parentZone for students", () => {
    const items = getSidebarNavItems({
      isStudent: true,
      isTeacher: false,
      newFeedbackCount: 0,
    });
    const ids = items.map((item) => item.id);
    expect(ids).toContain("parentZone");
  });

  it("does NOT include trail for teachers", () => {
    const items = getSidebarNavItems({
      isStudent: false,
      isTeacher: true,
      newFeedbackCount: 0,
    });
    const ids = items.map((item) => item.id);
    expect(ids).not.toContain("trail");
  });

  it("does NOT include parentZone for teachers", () => {
    const items = getSidebarNavItems({
      isStudent: false,
      isTeacher: true,
      newFeedbackCount: 0,
    });
    const ids = items.map((item) => item.id);
    expect(ids).not.toContain("parentZone");
  });
});

describe("MobileTabsNav tab item end prop passthrough", () => {
  it("NAV-04: trail tab item includes end: true when mapped from nav config", () => {
    // Replicate the MobileTabsNav mapping logic
    const studentTabIds = [
      "trail",
      "practiceGames",
      "studentDashboard",
      "achievements",
      "settings",
    ];
    const allItems = [...APP_NAV_ITEMS.student, ...APP_NAV_ITEMS.common];
    const tabItems = studentTabIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean);
    const trailTab = tabItems.find((item) => item.id === "trail");
    expect(trailTab).toBeDefined();
    expect(trailTab.end).toBe(true);
  });
});
