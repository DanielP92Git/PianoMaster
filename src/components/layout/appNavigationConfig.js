import {
  GraduationCap,
  Home,
  Mic,
  Music2,
  Settings,
  Trophy,
} from "lucide-react";

/**
 * Shared navigation definitions used by:
 * - Desktop sidebar
 * - Mobile bottom tabs
 *
 * Notes:
 * - `labelKey` must exist under `common.navigation.links.*`
 * - `theme` is used to keep the sidebar’s current color semantics.
 */

export const APP_NAV_ITEMS = {
  student: [
    {
      id: "studentDashboard",
      to: "/",
      icon: Home,
      labelKey: "navigation.links.studentDashboard",
      theme: "indigo",
    },
    {
      id: "practiceGames",
      to: "/practice-modes",
      icon: Music2,
      labelKey: "navigation.links.practiceGames",
      theme: "indigo",
    },
    {
      id: "recordings",
      to: "/practice-sessions",
      icon: Mic,
      labelKey: "navigation.links.recordings",
      theme: "indigo",
      badgeKey: "studentFeedback",
    },
    {
      id: "achievements",
      to: "/achievements",
      icon: Trophy,
      labelKey: "navigation.links.achievements",
      theme: "indigo",
    },
  ],
  teacher: [
    {
      id: "teacherDashboard",
      to: "/teacher",
      icon: GraduationCap,
      labelKey: "navigation.links.teacherDashboard",
      theme: "purple",
    },
  ],
  common: [
    {
      id: "settings",
      to: "/settings",
      icon: Settings,
      labelKey: "navigation.links.settings",
      theme: "indigo",
    },
  ],
};

export function getSidebarNavItems({ isStudent, isTeacher, newFeedbackCount }) {
  const items = [];

  if (isStudent) {
    items.push(
      ...APP_NAV_ITEMS.student.map((item) => {
        if (item.badgeKey === "studentFeedback") {
          return { ...item, badgeCount: newFeedbackCount || 0 };
        }
        return item;
      })
    );
  }

  if (isTeacher) {
    items.push(...APP_NAV_ITEMS.teacher);
  }

  items.push(...APP_NAV_ITEMS.common);

  return items;
}





