import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Updated game routes to match actual URL structure
  const gameRoutes = [
    "/note-recognition-mode/note-recognition-game",
    "/note-recognition-mode/memory-game",
    "/rhythm-mode/listen-and-repeat",
    "/rhythm-mode/create-own",
    "/rhythm-mode/metronome-trainer",
    "/rhythm-mode/enhanced",
  ];

  // Exact route matching
  const isGameRoute = gameRoutes.includes(location.pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      {!isGameRoute && <Header onMenuClick={toggleSidebar} />}
      {!isGameRoute && (
        <Sidebar
          isOpen={isSidebarOpen}
          isGameRoute={isGameRoute}
          onClose={() => setIsSidebarOpen(false)}
          onToggle={toggleSidebar}
        />
      )}
      <main className={`${!isGameRoute ? "pt-2 md:pl-64" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
