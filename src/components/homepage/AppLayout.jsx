import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Header from "./Header";
import Aside from "./SideBar";
import RightMenu from "../RightMenu";
import { Dashboard } from "./Dashboard";

export function AppLayout({ onPracticeModesClick, selectedAvatar }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 relative">
      <Header onToggleMenu={toggleMenu} selectedAvatar={selectedAvatar} />

      <div className="flex">
        <Aside onPracticeModesClick={onPracticeModesClick}  />

        <main className="flex-1 ml-64 p-8">
          <Outlet />
        </main>
      </div>

      <RightMenu onToggleMenu={toggleMenu} isMenuOpen={isMenuOpen} />

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={toggleMenu}
        ></div>
      )}
    </div>
  );
}
