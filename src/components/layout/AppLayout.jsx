import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";  
import Header from "./Header";  
import MobileTabsNav from "./MobileTabsNav";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation("common");
  const direction = i18n.dir();
  const language = i18n.language || i18n.resolvedLanguage || "en";
  const isHebrew = language.startsWith("he");
  const isDashboard = location.pathname === "/dashboard";

  // Updated game routes to match actual URL structure
  const gameRoutes = [
    "/notes-master-mode/notes-recognition-game",
    "/notes-master-mode/memory-game",
    "/notes-master-mode/sight-reading-game",
    "/notes-master-mode/note-speed-cards",
    "/rhythm-mode/metronome-trainer",
    "/rhythm-mode/rhythm-reading-game",
    "/rhythm-mode/rhythm-dictation-game",
    "/rhythm-mode/arcade-rhythm-game",
    "/ear-training-mode/note-comparison-game",
    "/ear-training-mode/interval-game",
    "/rhythm-mode/visual-recognition-game",
    "/rhythm-mode/syllable-matching-game",
  ];

  // Routes that should hide the header (games + trail page)
  const isGameRoute = gameRoutes.includes(location.pathname);
  const isTrailPage = location.pathname === "/" || location.pathname === "/trail";

  // Map routes to page titles
  const getPageTitleKey = () => {
    if (location.pathname === "/notes-master-mode") return "pages.notesMaster";
    if (location.pathname === "/rhythm-mode") return "pages.rhythmMaster";
    if (location.pathname === "/practice-modes") return "pages.gameModes";
    if (location.pathname === "/practice-sessions") return "pages.practiceSessions.title";
    if (location.pathname === "/achievements") return "pages.achievements.title";
    if (location.pathname === "/settings") return "pages.settings.title";
    if (location.pathname === "/parent-portal") return "parentPortal.parentZoneTitle";
    // Add other routes as needed
    return null; // Default: show PianoMaster logo
  };

  const pageTitleKey = getPageTitleKey();
  const pageTitle = pageTitleKey ? t(pageTitleKey) : null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Trail page has its own dark background; everything else uses the app gradient
  const backgroundClass = isTrailPage
    ? "bg-[#1a1040]"
    : "bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900";

  return (
    <div
      className={`min-h-screen ${backgroundClass} flex flex-col ${
        isHebrew ? "font-hebrew" : ""
      }`}
      dir={direction}
      lang={language}
    >
      {!isGameRoute && !isDashboard && !isTrailPage && (
        <Header
          onMenuClick={toggleSidebar}
          pageTitle={pageTitle}
          showMenuButton={false}
          overlay={isDashboard}
        />
      )}
      {!isGameRoute && (
        <div className="hidden xl:block">
          <Sidebar
            isOpen={isSidebarOpen}
            isGameRoute={isGameRoute}
            onClose={() => setIsSidebarOpen(false)}
            onToggle={toggleSidebar}
          />
        </div>
      )}
      <main
        className={`${
          !isGameRoute
            ? direction === "rtl"
              ? isDashboard || isTrailPage
                ? "pt-0 xl:pr-[19rem]"
                : "pt-2 xl:pr-[19rem]"
              : isDashboard || isTrailPage
                ? "pt-0 xl:pl-[19rem]"
                : "pt-2 xl:pl-[19rem]"
            : ""
        } flex-1 ${
          !isGameRoute ? "pb-20 xl:pb-0" : ""
        } ${isGameRoute ? "min-h-0 overflow-hidden w-full" : ""}`}
      >
        <Outlet />
      </main>
      {!isGameRoute && <MobileTabsNav />}
    </div>
  );
}
