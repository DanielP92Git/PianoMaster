import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom"; // eslint-disable-line
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar"; // eslint-disable-line
import Header from "./Header"; // eslint-disable-line

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation("common");
  const direction = i18n.dir();
  const language = i18n.language || i18n.resolvedLanguage || "en";

  // Updated game routes to match actual URL structure
  const gameRoutes = [
    "/notes-master-mode/notes-recognition-game",
    "/notes-master-mode/memory-game",
    "/notes-master-mode/sight-reading-game",
    "/rhythm-mode/metronome-trainer",
  ];

  // Exact route matching
  const isGameRoute = gameRoutes.includes(location.pathname);

  // Map routes to page titles
  const getPageTitleKey = () => {
    if (location.pathname === "/notes-master-mode") return "pages.notesMaster";
    if (location.pathname === "/rhythm-mode") return "pages.rhythmMaster";
    if (location.pathname === "/practice-modes") return "pages.gameModes";
    // Add other routes as needed
    return null; // Default: show PianoMaster logo
  };

  const pageTitleKey = getPageTitleKey();
  const pageTitle = pageTitleKey ? t(pageTitleKey) : null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex flex-col"
      dir={direction}
      lang={language}
    >
      {!isGameRoute && (
        <Header onMenuClick={toggleSidebar} pageTitle={pageTitle} />
      )}
      {!isGameRoute && (
        <Sidebar
          isOpen={isSidebarOpen}
          isGameRoute={isGameRoute}
          onClose={() => setIsSidebarOpen(false)}
          onToggle={toggleSidebar}
        />
      )}
      <main className={`${!isGameRoute ? (direction === "rtl" ? "pt-2 lg:pr-72" : "pt-2 lg:pl-72") : ""} flex-1`}>
        <Outlet />
      </main>
      {!isGameRoute && location.pathname === "/" && (
        <footer
          className={`${!isGameRoute ? (direction === "rtl" ? "lg:pr-72" : "lg:pl-72") : ""} py-4 text-center border-t border-white/10`}
        >
          <Link
            to="/legal"
            className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200 underline"
          >
            {t("navigation.links.legal")}
          </Link>
        </footer>
      )}
    </div>
  );
}
