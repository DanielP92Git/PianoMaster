import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Header from "./Header";
import SideBar from "./SideBar";
import { Dashboard } from "./Dashboard";
import { ModalProvider } from "../../context/ModalContext";

export function AppLayout({ onPracticeModesClick, selectedAvatar }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative">
        <Header
          onToggleSidebar={toggleSidebar}
          selectedAvatar={selectedAvatar}
        />

        <div className="flex">
          <SideBar
            onPracticeModesClick={onPracticeModesClick}
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />

          <main className="flex-1 ml-0 lg:ml-72 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ModalProvider>
  );
}
