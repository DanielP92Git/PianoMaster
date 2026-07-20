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
 * @param {Array}  [props.stats]   - [{ id, label, value, tone, hideWhenStacked }]
 * @param {object} [props.streak]  - { value, active, min }
 * @param {object} [props.progress] - { current, total, label }
 * @param {object} [props.exit]    - { to, onClick, label }
 * @param {React.ReactNode} [props.leadingSlot]  - Escape hatch at reading-start
 * @param {React.ReactNode} [props.statsSlot]    - Escape hatch beside stats
 * @param {React.ReactNode} [props.trailingSlot] - Escape hatch before the exit button
 * @param {boolean} [props.dense]  - Compact-landscape hint; tightens padding only
 */

/*
 * Stacked (narrow) layout ordering:
 *   row 1  streak · score · (gap) · settings · exit
 *   row 2  mode switch · metronome · mic
 *   row 3  progress (full width)
 *
 * The breakpoint is width-based (<= 700px), not orientation-based. The handoff
 * describes the stacked layout as "portrait", but orientation is only a proxy
 * for the real constraint: a single row needs roughly 700px to fit. Keying on
 * orientation left narrow landscape windows (e.g. 600x400) on the single-row
 * branch, where the bar overflowed horizontally. 760px landscape phones — the
 * handoff's landscape case — still get the single row.
 *
 * Tailwind's JIT needs complete literal class names, so the per-slot order
 * classes are looked up rather than interpolated.
 */
const STACKED_ORDER = {
  streak: "max-[700px]:order-1",
  stat: "max-[700px]:order-2",
  primaryTool: "max-[700px]:order-3 max-[700px]:ms-auto",
  exit: "max-[700px]:order-4",
  breakOne: "max-[700px]:order-5",
  modeSwitch: "max-[700px]:order-6",
  progress: "max-[700px]:order-12 max-[700px]:basis-full",
};

// Secondary tools land on stacked row 2, in the order they were supplied.
// Four slots is well beyond what any current game needs; extras fall back to
// the last slot rather than silently jumping to the front (order defaults to 0).
const SECONDARY_TOOL_ORDER = [
  "max-[700px]:order-7",
  "max-[700px]:order-8",
  "max-[700px]:order-9",
  "max-[700px]:order-10",
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
      className={`flex w-full flex-nowrap items-center gap-2.5 px-3.5 py-3 max-[700px]:flex-wrap max-[700px]:gap-x-2 max-[700px]:gap-y-2.5 lg:gap-4 lg:px-5 ${
        dense ? "py-2" : ""
      } ${className}`}
    >
      {leadingSlot}

      {tools.length > 0 && (
        <TopBarToolGroup>
          {tools.map((tool) => {
            const isPrimary = tool.priority === "primary";
            const orderClass = isPrimary
              ? STACKED_ORDER.primaryTool
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
          className={STACKED_ORDER.modeSwitch}
        />
      )}

      {stats.map((stat) => (
        <StatChip
          key={stat.id}
          label={stat.label}
          value={stat.value}
          tone={stat.tone}
          className={`${STACKED_ORDER.stat} ${
            stat.hideWhenStacked ? "max-[700px]:hidden" : ""
          }`}
        />
      ))}

      {statsSlot}

      {streak && (
        <StreakHero
          value={streak.value}
          active={streak.active}
          min={streak.min}
          className={STACKED_ORDER.streak}
        />
      )}

      {/* Stacked row break: everything after this wraps to row 2. Zero-height
          so the forced line costs nothing but the flex row-gap. Progress needs
          no equivalent break — its basis-full already forces its own line. */}
      <span
        aria-hidden="true"
        className={`hidden h-0 w-full max-[700px]:block ${STACKED_ORDER.breakOne}`}
      />

      {trailingSlot}

      {/* Centered zone: grows to fill the gap between the reading-start
          cluster and the exit button, so progress sits in the bar's middle
          rather than hugging the exit button. Dissolves when stacked so
          progress can wrap to its own row via STACKED_ORDER.progress. */}
      {progress && (
        <div className="flex min-w-0 flex-1 items-center justify-center max-[700px]:contents">
          <TopBarProgress
            current={progress.current}
            total={progress.total}
            label={progress.label}
            compact={dense}
            className={STACKED_ORDER.progress}
          />
        </div>
      )}

      {/* Reading-end cluster. Dissolves when stacked so exit can be ordered
          onto its own row. */}
      {exit && (
        <div className="ms-auto flex items-center max-[700px]:contents">
          <TopBarExitButton
            to={exit.to}
            onClick={exit.onClick}
            label={exit.label}
            className={STACKED_ORDER.exit}
          />
        </div>
      )}
    </header>
  );
}
