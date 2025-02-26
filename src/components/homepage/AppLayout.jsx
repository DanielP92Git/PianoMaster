import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Header from "./Header";
import Aside from "./SideBar";
import RightMenu from "../RightMenu";
import { Dashboard } from "./Dashboard";
import { ModalProvider } from "../../context/ModalContext";

export function AppLayout({ onPracticeModesClick, selectedAvatar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <ModalProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 relative">
        <Header onToggleMenu={toggleMenu} selectedAvatar={selectedAvatar} />

        <div className="flex">
          <Aside onPracticeModesClick={onPracticeModesClick} />

          <main className="flex-1 ml-72 p-6">
            <Outlet />
          </main>
        </div>

        <RightMenu onToggleMenu={toggleMenu} isMenuOpen={isMenuOpen} />

        {/* Menu Overlay */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={toggleMenu}
            style={{ zIndex: 40 }}
          ></div>
        )}
      </div>
    </ModalProvider>
  );
}
