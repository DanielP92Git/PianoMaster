import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TopBarToolGroup } from "./TopBarToolGroup";
import { TopBarIconButton } from "./TopBarIconButton";
import { SegmentedModeSwitch } from "./SegmentedModeSwitch";
import { StatChip } from "./StatChip";
import { StreakHero } from "./StreakHero";
import { TopBarProgress } from "./TopBarProgress";
import { TopBarExitButton } from "./TopBarExitButton";

/**
 * GameTopBar
 *
 * Shared game-screen top bar (design_handoff_gamified_topbar, "Playful &
 * Gamified"). Owns zone layout and responsive ordering only — it holds no
 * game state and reads no globals, so it renders in jsdom without mocks.
 *
 * Zones flow from the reading-start to the reading-end:
 *   [tools] [mode switch] [stats] [streak] … [progress] [exit]
 *
 * Every zone prop is optional and its zone is omitted entirely when absent,
 * so a game with only progress + exit can adopt this bar as:
 *   <GameTopBar progress={{ current, total }} exit={{ to, label }} />
 *
 * Direction-agnostic: uses logical properties (ms-/ps-/start-) throughout so
 * the same markup mirrors correctly in Hebrew (RTL).
 *
 * @param {Array}  [props.tools]   - [{ id, icon, onClick, active, disabled, title, priority }]
 * @param {object} [props.modeSwitch] - { value, options, onChange, disabled, label }
 * @param {Array}  [props.stats]   - [{ id, label, value, tone, hideOnPortrait }]
 * @param {object} [props.streak]  - { value, active, min }
 * @param {object} [props.progress] - { current, total, label }
 * @param {object} [props.exit]    - { to, onClick, label }
 * @param {React.ReactNode} [props.leadingSlot]  - Escape hatch at reading-start
 * @param {React.ReactNode} [props.statsSlot]    - Escape hatch beside stats
 * @param {React.ReactNode} [props.trailingSlot] - Escape hatch before the exit button
 * @param {boolean} [props.dense]  - Compact-landscape hint; tightens padding only
 */

// Portrait ordering. Tailwind's JIT needs complete literal class names, so the
// per-slot order classes are looked up rather than interpolated.
// Portrait rows, per the handoff:
//   row 1  streak · score · (gap) · settings · exit
//   row 2  mode switch · metronome · mic
//   row 3  progress (full width)
const PORTRAIT_ORDER = {
  streak: "max-lg:portrait:order-1",
  stat: "max-lg:portrait:order-2",
  primaryTool: "max-lg:portrait:order-3 max-lg:portrait:ms-auto",
  exit: "max-lg:portrait:order-4",
  breakOne: "max-lg:portrait:order-5",
  modeSwitch: "max-lg:portrait:order-6",
  breakTwo: "max-lg:portrait:order-11",
  progress: "max-lg:portrait:order-12 max-lg:portrait:basis-full",
};

// Secondary tools land on portrait row 2, in the order they were supplied.
// Four slots is well beyond what any current game needs; extras fall back to
// the last slot rather than silently jumping to the front (order defaults to 0).
const SECONDARY_TOOL_ORDER = [
  "max-lg:portrait:order-7",
  "max-lg:portrait:order-8",
  "max-lg:portrait:order-9",
  "max-lg:portrait:order-10",
];

export function GameTopBar({
  tools = [],
  modeSwitch,
  stats = [],
  streak,
  progress,
  exit,
  leadingSlot,
  statsSlot,
  trailingSlot,
  dense = false,
  className = "",
}) {
  const { t } = useTranslation("common");
  const barRef = useRef(null);

  // Publish the measured height so game layouts can size around the bar
  // instead of hardcoding a pixel constant that drifts when the bar changes.
  useEffect(() => {
    const node = barRef.current;
    if (!node || typeof ResizeObserver === "undefined") return undefined;

    const publish = () => {
      document.documentElement.style.setProperty(
        "--game-topbar-height",
        `${Math.round(node.getBoundingClientRect().height)}px`
      );
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(node);

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--game-topbar-height");
    };
  }, []);

  let secondaryToolIndex = 0;

  return (
    <header
      ref={barRef}
      aria-label={t("games.topBar.landmark")}
      className={`flex w-full flex-nowrap items-center gap-2.5 px-3.5 py-3 lg:gap-4 lg:px-5 max-lg:portrait:flex-wrap max-lg:portrait:gap-x-2 max-lg:portrait:gap-y-2.5 ${
        dense ? "py-2" : ""
      } ${className}`}
    >
      {leadingSlot}

      {tools.length > 0 && (
        <TopBarToolGroup>
          {tools.map((tool) => {
            const isPrimary = tool.priority === "primary";
            const orderClass = isPrimary
              ? PORTRAIT_ORDER.primaryTool
              : SECONDARY_TOOL_ORDER[
                  Math.min(
                    secondaryToolIndex++,
                    SECONDARY_TOOL_ORDER.length - 1
                  )
                ];
            return (
              <TopBarIconButton
                key={tool.id}
                icon={tool.icon}
                onClick={tool.onClick}
                active={tool.active}
                disabled={tool.disabled}
                title={tool.title}
                className={orderClass}
              />
            );
          })}
        </TopBarToolGroup>
      )}

      {modeSwitch && (
        <SegmentedModeSwitch
          value={modeSwitch.value}
          options={modeSwitch.options}
          onChange={modeSwitch.onChange}
          disabled={modeSwitch.disabled}
          label={modeSwitch.label}
          className={PORTRAIT_ORDER.modeSwitch}
        />
      )}

      {stats.map((stat) => (
        <StatChip
          key={stat.id}
          label={stat.label}
          value={stat.value}
          tone={stat.tone}
          className={`${PORTRAIT_ORDER.stat} ${
            stat.hideOnPortrait ? "max-lg:portrait:hidden" : ""
          }`}
        />
      ))}

      {statsSlot}

      {streak && (
        <StreakHero
          value={streak.value}
          active={streak.active}
          min={streak.min}
          className={PORTRAIT_ORDER.streak}
        />
      )}

      {/* Portrait row break: everything after this wraps to row 2. */}
      <span
        aria-hidden="true"
        className={`hidden w-full max-lg:portrait:block ${PORTRAIT_ORDER.breakOne}`}
      />
      {/* Portrait row break: progress occupies its own full-width row. */}
      <span
        aria-hidden="true"
        className={`hidden w-full max-lg:portrait:block ${PORTRAIT_ORDER.breakTwo}`}
      />

      {trailingSlot}

      {/* Reading-end cluster. Dissolves in portrait so progress and exit can be
          ordered onto different rows. */}
      <div className="ms-auto flex items-center gap-3 max-lg:portrait:contents">
        {progress && (
          <TopBarProgress
            current={progress.current}
            total={progress.total}
            label={progress.label}
            compact={dense}
            className={PORTRAIT_ORDER.progress}
          />
        )}
        {exit && (
          <TopBarExitButton
            to={exit.to}
            onClick={exit.onClick}
            label={exit.label}
            className={PORTRAIT_ORDER.exit}
          />
        )}
      </div>
    </header>
  );
}
