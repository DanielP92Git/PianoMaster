import React from "react";

/**
 * TopBarToolGroup
 *
 * Glass pill that groups the tool icon buttons on wider viewports.
 *
 * At <= 700px the wrapper collapses to `display: contents`, so its children
 * become direct flex items of the bar and can be reordered onto separate rows
 * (the handoff's narrow layout has bare buttons split across two rows with no
 * surrounding pill). This keeps one DOM tree instead of duplicating markup per
 * breakpoint.
 *
 * The wrapper is purely decorative — no role, no label — so dissolving it
 * carries no accessibility cost.
 */
export function TopBarToolGroup({ children, className = "" }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.05] p-1 max-[700px]:contents lg:gap-[9px] lg:p-1.5 ${className}`}
    >
      {children}
    </div>
  );
}
