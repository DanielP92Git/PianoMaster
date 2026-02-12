import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Hook to update document.title dynamically based on current route
 * Follows PWA best practices for desktop window titles
 */
export function useDocumentTitle() {
  const location = useLocation();
  const { t } = useTranslation("common");

  useEffect(() => {
    const getPageTitle = () => {
      const path = location.pathname;

      // Map routes to translation keys
      const routeTitleMap = {
        "/": "app.title",
        "/practice-modes": "pages.gameModes",
        "/practice-sessions": "pages.practiceSessions.title",
        "/achievements": "pages.achievements.title",
        "/settings": "pages.settings.title",
        "/legal": "pages.legal.title",
        "/avatars": "pages.avatars.title",
        "/notes-master-mode": "pages.notesMaster",
        "/rhythm-mode": "pages.rhythmMaster",
        "/login": "pages.login.title",
        "/teacher": "pages.teacherDashboard.title",
      };

      // Check for exact matches first
      if (routeTitleMap[path]) {
        return t(routeTitleMap[path], { defaultValue: "PianoMaster" });
      }

      // Check for game routes
      if (path.includes("/memory-game")) {
        return `${t("pages.notesMaster", { defaultValue: "Notes Master" })} - ${t("games.memoryGame.title", { defaultValue: "Memory Game" })}`;
      }
      if (path.includes("/notes-recognition-game")) {
        return `${t("pages.notesMaster", { defaultValue: "Notes Master" })} - ${t("games.notesRecognition.title", { defaultValue: "Notes Recognition" })}`;
      }
      if (path.includes("/sight-reading-game")) {
        return `${t("pages.notesMaster", { defaultValue: "Notes Master" })} - ${t("games.sightReading.title", { defaultValue: "Sight Reading" })}`;
      }
      if (path.includes("/metronome-trainer")) {
        return `${t("pages.rhythmMaster", { defaultValue: "Rhythm Master" })} - ${t("games.metronomeTrainer.title", { defaultValue: "Metronome Trainer" })}`;
      }

      // Default fallback
      return t("app.title", { defaultValue: "PianoMaster" });
    };

    const title = getPageTitle();
    document.title = title;
  }, [location.pathname, t]);
}

