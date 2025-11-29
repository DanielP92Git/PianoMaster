import React, { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

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
  const getPageTitle = () => {
    if (location.pathname === "/notes-master-mode") return "Notes Master";
    if (location.pathname === "/rhythm-mode") return "Rhythm Master";
    if (location.pathname === "/practice-modes") return "Game Modes";
    // Add other routes as needed
    return null; // Default: show PianoMaster logo
  };

  const pageTitle = getPageTitle();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex flex-col">
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
      <main className={`${!isGameRoute ? "pt-2 lg:pl-72" : ""} flex-1`}>
        <Outlet />
      </main>
      {!isGameRoute && location.pathname === "/" && (
        <footer
          className={`${!isGameRoute ? "lg:pl-72" : ""} py-4 text-center border-t border-white/10`}
        >
          <Link
            to="/legal"
            className="text-white/50 hover:text-white/80 text-sm transition-colors duration-200 underline"
          >
            Legal & Attributions
          </Link>
        </footer>
      )}
    </div>
  );
}
