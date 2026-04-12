import { GraduationCap } from "lucide-react";
import trailIconSrc from "../../assets/icons/Trail.svg";
import houseIconSrc from "../../assets/icons/House.svg";
import gameHubIconSrc from "../../assets/icons/Game-Hub.svg";
import achievementsIconSrc from "../../assets/icons/Achievements.svg";
import settingsIconSrc from "../../assets/icons/Settings.svg";
import micIconSrc from "../../assets/icons/Mic.svg";
import parentIconSrc from "../../assets/icons/Parent.svg";

function TrailIcon({ className: _className, ...props }) {
  return <img src={trailIconSrc} alt="" className="h-8 w-8" {...props} />;
}

function DashboardIcon({ className: _className, ...props }) {
  return <img src={houseIconSrc} alt="" className="h-8 w-8" {...props} />;
}

function GameHubIcon({ className: _className, ...props }) {
  return <img src={gameHubIconSrc} alt="" className="h-8 w-8" {...props} />;
}

function AchievementsIcon({ className: _className, ...props }) {
  return (
    <img src={achievementsIconSrc} alt="" className="h-8 w-8" {...props} />
  );
}

function SettingsIcon({ className: _className, ...props }) {
  return <img src={settingsIconSrc} alt="" className="h-8 w-8" {...props} />;
}

function MicIcon({ className: _className, ...props }) {
  return <img src={micIconSrc} alt="" className="h-8 w-8" {...props} />;
}

function ParentIcon({ className: _className, ...props }) {
  return <img src={parentIconSrc} alt="" className="h-8 w-8" {...props} />;
}

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
      id: "trail",
      to: "/",
      icon: TrailIcon,
      labelKey: "navigation.links.trail",
      theme: "indigo",
      end: true,
    },
    {
      id: "practiceGames",
      to: "/practice-modes",
      icon: GameHubIcon,
      labelKey: "navigation.links.practiceGames",
      theme: "indigo",
    },
    {
      id: "studentDashboard",
      to: "/dashboard",
      icon: DashboardIcon,
      labelKey: "navigation.links.studentDashboard",
      theme: "indigo",
    },
    {
      id: "recordings",
      to: "/practice-sessions",
      icon: MicIcon,
      labelKey: "navigation.links.recordings",
      theme: "indigo",
      badgeKey: "studentFeedback",
    },
    {
      id: "achievements",
      to: "/achievements",
      icon: AchievementsIcon,
      labelKey: "navigation.links.achievements",
      theme: "indigo",
    },
    {
      id: "parentZone",
      to: "/parent-portal",
      icon: ParentIcon,
      labelKey: "navigation.links.parentZone",
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
      icon: SettingsIcon,
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
