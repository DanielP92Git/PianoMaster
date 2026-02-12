import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BottomNavigation } from "../ui/Navigation";
import { useUser } from "../../features/authentication/useUser";
import { useStudentFeedbackNotifications } from "../../hooks/useStudentFeedbackNotifications";
import { getSidebarNavItems } from "./appNavigationConfig";

export default function MobileTabsNav() {
  const { t, i18n } = useTranslation("common");
  const { user, isTeacher, isStudent } = useUser();
  const isRTL = i18n.dir() === "rtl";

  const { newFeedbackCount } = useStudentFeedbackNotifications(
    isStudent ? user?.id : null
  );

  const tabIds = isStudent
    ? ["studentDashboard", "practiceGames", "recordings", "achievements", "settings"]
    : isTeacher
      ? ["teacherDashboard", "settings"]
      : ["settings"];

  const items = useMemo(() => {
    const sidebarItems = getSidebarNavItems({
      isStudent,
      isTeacher,
      newFeedbackCount,
    });

    return sidebarItems
      .filter((item) => tabIds.includes(item.id))
      .map((item) => {
        const Icon = item.icon;
        const label = t(item.labelKey);

        return {
          to: item.to,
          label,
          ariaLabel: label,
          icon: <Icon />,
          badge:
            item.id === "recordings" && (item.badgeCount || 0) > 0
              ? { count: item.badgeCount, variant: "error" }
              : undefined,
          badgePosition: isRTL ? "top-left" : "top-right",
        };
      });
  }, [isStudent, isTeacher, isRTL, newFeedbackCount, tabIds, t]);

  return (
    <BottomNavigation
      items={items}
      showLabels={false}
      hideAbove="xl:hidden"
      className="shadow-none"
    />
  );
}


