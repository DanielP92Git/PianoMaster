/**
 * GameTopBar dev harness
 * ----------------------
 * Renders the shared game top bar with realistic mock state, with no auth,
 * no Supabase and no game engine, so its responsive/RTL behaviour can be
 * verified in isolation.
 *
 * Served in dev only at http://localhost:<port>/topbar-preview.html.
 * Vite's default build input is index.html, so this entry is never shipped.
 *
 * Why this exists: the Chrome automation available in this repo cannot resize
 * the browser window (resize_window is a no-op, outerWidth reports 0), so
 * mobile breakpoints are verified by loading this page inside a same-origin
 * iframe sized to the target viewport. An iframe evaluates media queries
 * against its own dimensions, which makes breakpoint checks independent of
 * the real window size.
 *
 * Query params:
 *   ?lang=he   render Hebrew / RTL
 *   ?combo=N   streak value (default 3; < 2 shows the dormant hero)
 *   ?fire=1    on-fire state
 */
/* eslint-disable react-refresh/only-export-components --
   This is a Vite entry point, not a component module; it mounts its own root. */
import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Settings, Mic } from "lucide-react";
import i18n from "../i18n/index.js";
import { GameTopBar } from "../components/games/shared/hud/topbar";
import MetronomeIcon from "../assets/icons/metronome.svg";
import "../index.css";

const params = new URLSearchParams(window.location.search);
const lang = params.get("lang") === "he" ? "he" : "en";
const combo = Number(params.get("combo") ?? 3);
const onFire = params.get("fire") === "1";

function Harness() {
  const { t } = { t: i18n.getFixedT(lang, "common") };

  useEffect(() => {
    i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "he" ? "rtl" : "ltr";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900">
      <GameTopBar
        tools={[
          {
            id: "settings",
            priority: "primary",
            icon: <Settings className="h-4 w-4 lg:h-5 lg:w-5" />,
            onClick: () => {},
            title: t("sightReading.changeSettings"),
          },
          {
            id: "metronome",
            icon: (
              <img
                src={MetronomeIcon}
                alt=""
                className="h-4 w-4 lg:h-5 lg:w-5"
              />
            ),
            onClick: () => {},
            active: true,
            title: t("sightReading.controls.toggleMetronome"),
          },
          {
            id: "input-mode",
            icon: <Mic className="h-4 w-4 lg:h-5 lg:w-5" />,
            onClick: () => {},
            title: t("sightReading.controls.switchToMic"),
          },
        ]}
        modeSwitch={{
          value: "practice",
          options: [
            {
              value: "practice",
              label: t("sightReading.controls.modePractice"),
            },
            { value: "test", label: t("sightReading.controls.modeTest") },
          ],
          onChange: () => {},
          label: t("sightReading.controls.modeToggleLabel"),
        }}
        stats={[
          {
            id: "bpm",
            label: t("games.topBar.bpmLabel"),
            value: 80,
            tone: "purple",
            hideWhenStacked: true,
          },
          {
            id: "score",
            label: t("games.score"),
            value: 120,
            tone: "gold",
          },
        ]}
        streak={{ value: combo, active: onFire }}
        progress={{ current: 3, total: 10 }}
        exit={{
          to: "/trail",
          label: t("games.topBar.exitTo", { name: "Trail" }),
        }}
      />

      {/* Stand-in for the staff card, so the bar is seen in context. */}
      <div className="px-3 pt-2">
        <div className="flex h-40 items-center justify-center rounded-2xl bg-white/95 text-sm text-gray-400">
          staff area
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <MemoryRouter>
    <Harness />
  </MemoryRouter>
);
