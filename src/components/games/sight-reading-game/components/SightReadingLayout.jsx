/**
 * SightReadingLayout (Phase 1 contract + Phase 4 tuning)
 * -----------------------------------
 * "Dumb" layout-only component for the sight-reading game UI.
 *
 * - Owns ONLY layout/overflow decisions (flex/grid, breakpoints).
 * - Knows NOTHING about game logic (audio/mic/scoring/timing/patterns).
 *
 * The parent (`SightReadingGame`) must:
 * - compute booleans (phase, keyboard visibility, orientation hints)
 * - provide region JSX (header/staff/guidance/keyboard/feedback)
 *
 * Props (contract):
 * - phase: "setup" | "display" | "count-in" | "performance" | "feedback" | "review"
 * - hasKeyboard: boolean (whether the keyboard region should be rendered/reserved)
 * - isFeedbackPhase: boolean (convenience; may influence stacking/spacing)
 * - isCompactLandscape?: boolean (layout hint computed by parent)
 * - isTallStaffLayout?: boolean (signals staff will be taller, e.g., both clefs)
 * - isMultiBar?: boolean (signals multi-bar pattern; enables horizontal scroll in feedback)
 * - headerControls: JSX (Back button, progress, toggles)
 * - staff: JSX (VexFlow staff region only; no keyboard/guidance logic)
 * - guidance: JSX (Start Playing button, small phase text, or — in the "review" phase —
 *   the ReviewDrillPanel supplied by the game; this component stays "dumb" and never
 *   imports ReviewDrillPanel itself, it only gives the "review" phase a dedicated,
 *   visible guidance region instead of the incidental fixed-top overlay)
 * - keyboard: JSX | null (KlavierKeyboard wrapper or null)
 * - feedbackPanel: JSX | null (FeedbackSummary card or null)
 *
 * Scrolling contract (Phase 0 principle):
 * - Desktop (>= md): no outer/page scrolling in the game route; fit into `h-screen`.
 * - Mobile (< md): allow at most ONE vertical scrollbar (root/page), avoid nested scrollers.
 * - EXCEPTION — feedback phase in `short-landscape` (see below): the two columns are
 *   side by side and the notation column must stay pinned, so a page scroll would be
 *   wrong. The root is locked (`overflow-y-hidden`) and the single permitted scroller
 *   moves *into* the feedback column. This is still one scrollbar, just not the page's.
 *
 * Short-landscape feedback layout:
 * - In portrait/tablet/desktop, feedback stacks below the notation card (unchanged).
 * - On short landscape phones (`@media (orientation: landscape) and (max-height: 500px)`,
 *   registered in tailwind.config.js) the stack becomes a ROW: notation card takes the
 *   flexible column, feedback takes a fixed 18rem column. `flex-direction: row` follows
 *   writing direction, so Hebrew RTL mirrors for free — no left/right, no order-*.
 * - Rationale for flipping here rather than letting the column shrink: the feedback slot
 *   is `flex-shrink-0`, so in a short viewport the notation card (the only shrinkable
 *   sibling, and it carries `min-h-0`) absorbed the entire deficit and collapsed to a
 *   ~10px sliver, with the card's `overflow: hidden` clipping the staff out of view.
 *
 * Phase 4 tuning:
 * - Uses CSS Grid on desktop to constrain vertical space allocation.
 * - Card wrapper has max-h tied to viewport, preventing staff from dominating.
 * - Root allows vertical scroll when content exceeds viewport (e.g., tall staff + feedback).
 */
export function SightReadingLayout({
  phase,
  hasKeyboard,
  isFeedbackPhase,
  isCompactLandscape,
  isTallStaffLayout,
  isMultiBar: _isMultiBar = false,
  headerControls,
  staff,
  guidance,
  keyboard,
  feedbackPanel,
}) {
  const hasDockedKeyboard = Boolean(hasKeyboard) && !isFeedbackPhase;
  // Feedback panel renders inline (not docked) for consistent width with notation card
  const hasDockedBottom = hasDockedKeyboard;
  const bottomDockContent = keyboard;

  // REVIEW is a real, active in-exercise phase (like DISPLAY/PERFORMANCE) — its guidance
  // (the game-supplied ReviewDrillPanel) gets a dedicated, visible region below the staff
  // card rather than the incidental fixed-top overlay used for count-in/performance hints.
  const isReviewPhase = phase === "review";

  // Show guidance as an overlay to prevent it from affecting card layout
  // In DISPLAY phase: button is rendered over keyboard (see keyboard dock section)
  // In REVIEW phase: guidance renders inline/prominent (see review-guidance region below)
  // In other phases: small text shown as centered overlay
  const showGuidanceOverlay =
    guidance && !isFeedbackPhase && !isReviewPhase && phase !== "display";

  // In DISPLAY phase without a bottom dock (e.g., mic mode with keyboard hidden),
  // render Start Playing as a floating overlay so it's still accessible.
  const showDisplayGuidanceOverlay =
    phase === "display" && guidance && !isFeedbackPhase && !hasDockedBottom;

  // Feedback phase should not waste vertical space: the staff card can size to
  // content so the feedback panel is reachable within the viewport.
  const mainGap = isFeedbackPhase
    ? isCompactLandscape
      ? "gap-2 pb-2 sm:gap-3 sm:pb-3"
      : "gap-2 pb-3 sm:gap-3 sm:pb-4"
    : "gap-2 pb-0 sm:gap-3";

  const stackGap = isFeedbackPhase
    ? isCompactLandscape
      ? "gap-2 sm:gap-3"
      : "gap-2 sm:gap-3"
    : "gap-2.5 sm:gap-3";

  // Step 2: Constrain card height to prevent overflow
  // Subtracts the live top bar height and the keyboard/feedback dock height.
  // --game-topbar-height is published by GameTopBar via ResizeObserver; the
  // fallbacks match the pre-GameTopBar constants so first paint (and any game
  // not yet using GameTopBar) still lays out sanely. Desktop keeps its extra
  // ~50px of breathing room below the card.
  // In short-landscape the card owns its whole column, so the 45dvh cap (only ~185px at
  // 412px tall) must not apply.
  const cardMaxHeightClass = isFeedbackPhase
    ? "max-h-[45dvh] md:max-h-[45vh] short-landscape:max-h-full"
    : hasDockedBottom
      ? "max-h-[calc(100dvh-var(--game-topbar-height,64px)-var(--sr-kb-height))] md:max-h-[calc(100vh-var(--game-topbar-height,50px)-var(--sr-kb-height))]"
      : "max-h-[calc(100dvh-var(--game-topbar-height,64px))] md:max-h-[calc(100vh-var(--game-topbar-height,50px)-50px)]";

  // Step 3: Grid-based vertical allocation on desktop
  // Mobile uses flex, desktop uses grid to prevent staff from dominating
  // The card only has staff (no guidance inside to avoid clipping issues)
  const cardInteriorClass =
    "flex flex-col md:grid md:grid-rows-[minmax(180px,1fr)]";

  return (
    <div
      className={`relative flex h-[100dvh] min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 ${
        isFeedbackPhase
          ? "overflow-y-auto short-landscape:overflow-y-hidden"
          : "overflow-y-hidden"
      }`}
      data-sr-phase={phase}
      data-sr-has-keyboard={hasKeyboard ? "true" : "false"}
      data-sr-feedback={isFeedbackPhase ? "true" : "false"}
      data-sr-compact-landscape={isCompactLandscape ? "true" : "false"}
      data-sr-tall-staff={isTallStaffLayout ? "true" : "false"}
      style={
        /** @type {import("react").CSSProperties} */ ({
          // Bottom dock height: responsive to viewport height
          // Used for keyboard in play phases and feedback panel in feedback phase
          // Reduced from 38vh to 32vh to give more space to staff notation on compact viewports
          // Min 110px (reduced from 130px) for very short screens like iPhone SE landscape
          "--sr-kb-height": hasDockedBottom
            ? "clamp(110px, 32vh, 260px)"
            : "0px",
        })
      }
    >
      {/* Header - fixed height, no flex grow. The bar owns its own padding
          (GameTopBar), so no extra landscape padding is added here. */}
      <div className="flex-shrink-0">{headerControls}</div>

      {/* Main content area */}
      <div className="relative min-h-0 flex-1">
        <div
          className={`flex h-full flex-col items-center px-2 sm:px-0 landscape:px-4 ${mainGap}`}
          style={{
            paddingBottom:
              "calc(var(--sr-kb-height) + env(safe-area-inset-bottom) + 0.5rem)",
          }}
        >
          <div
            className={`flex min-h-0 w-full max-w-5xl ${isFeedbackPhase ? "" : "flex-1"} flex-col ${stackGap} ${
              isFeedbackPhase
                ? "short-landscape:h-full short-landscape:flex-1 short-landscape:flex-row short-landscape:items-stretch"
                : ""
            }`}
          >
            {/* `min-w-0` is load-bearing: without it this flex item's default
                `min-width: auto` floors at the staff SVG's intrinsic width and pushes the
                feedback column off the inline edge. */}
            <div
              className={`flex min-h-0 ${isFeedbackPhase ? "" : "flex-1"} flex-col ${
                isFeedbackPhase
                  ? "short-landscape:min-w-0 short-landscape:flex-1"
                  : ""
              }`}
            >
              {/* Card with constrained height and grid interior */}
              <div
                className={`relative ${isFeedbackPhase ? "" : "flex-1"} rounded-2xl bg-white/95 shadow-2xl backdrop-blur-sm ${cardMaxHeightClass} ${
                  isFeedbackPhase ? "short-landscape:h-full" : ""
                }`}
                data-sr-region="card"
                style={{
                  overflowX: "hidden",
                  overflowY: "hidden",
                }}
              >
                <div className={`h-full ${cardInteriorClass}`}>
                  {/* Staff band - full height, guidance shown as overlay */}
                  <div
                    className="relative z-0 flex min-h-[120px] w-full flex-1 items-center justify-center px-2 py-1 sm:px-3 sm:py-2 landscape:py-1"
                    data-sr-region="staff"
                    style={{
                      overflowX: "hidden",
                      overflowY: "hidden",
                    }}
                  >
                    {staff}
                  </div>
                </div>
              </div>
            </div>
            {/* Feedback panel - inline below card (same max-w-5xl width), or a fixed
                18rem side column in short-landscape.

                grow-0/shrink/basis-72 are deliberately three LONGHANDS: `flex-none` would
                emit the `flex` shorthand, which resets `flex-basis: auto` and then races
                `basis-72` on stylesheet order. flex-basis also beats the base `w-full`
                cleanly, since basis wins over `width` for a flex item's main size.
                `shrink` (not `shrink-0`) lets the column give ground on narrow viewports.

                overflow-y-auto is the safety valve for the session-complete block, which
                cannot fit by any amount of compaction — see the scrolling contract above. */}
            {isFeedbackPhase && feedbackPanel && (
              <div
                className="w-full flex-shrink-0 short-landscape:h-full short-landscape:min-h-0 short-landscape:min-w-0 short-landscape:shrink short-landscape:grow-0 short-landscape:basis-72 short-landscape:overflow-y-auto short-landscape:overscroll-contain"
                data-sr-region="feedback-panel"
              >
                {feedbackPanel}
              </div>
            )}
            {/* Review guidance - inline below card, same max-w-5xl width. Prominent
                dedicated region (not a fixed overlay) so the ReviewDrillPanel the game
                passes via `guidance` is fully visible and interactive. */}
            {isReviewPhase && guidance && (
              <div
                className="w-full flex-shrink-0"
                data-sr-region="review-guidance"
              >
                {guidance}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Docked bottom: keyboard in play phases, feedback panel in feedback phase */}
      {hasDockedBottom ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40"
          data-sr-region={isFeedbackPhase ? "feedback-dock" : "keyboard-dock"}
          style={{ height: "var(--sr-kb-height)" }}
        >
          {/* Start Playing button overlay - positioned over keyboard top */}
          {phase === "display" && guidance && !isFeedbackPhase ? (
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-50 flex justify-center"
              data-sr-region="guidance-over-keyboard"
              style={{
                transform: "translateY(10%)",
              }}
            >
              <div className="pointer-events-auto">{guidance}</div>
            </div>
          ) : null}

          <div
            className="flex h-full items-center justify-center px-2 pb-[env(safe-area-inset-bottom)] sm:px-0 landscape:px-4"
            style={{
              paddingLeft: "env(safe-area-inset-left)",
              paddingRight: "env(safe-area-inset-right)",
            }}
          >
            <div className="h-full w-full max-w-5xl">{bottomDockContent}</div>
          </div>
        </div>
      ) : null}

      {/* Start Playing button overlay (DISPLAY phase, no keyboard dock) */}
      {showDisplayGuidanceOverlay ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
          data-sr-region="guidance-float"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)",
          }}
        >
          <div className="pointer-events-auto">{guidance}</div>
        </div>
      ) : null}

      {/* Guidance overlay: for count-in and performance phase text */}
      {showGuidanceOverlay ? (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center"
          data-sr-region="guidance-overlay"
          style={{
            // Clear the top bar rather than assuming a fixed 6rem header.
            paddingTop: "calc(var(--game-topbar-height, 64px) + 2rem)",
            paddingBottom:
              "calc(var(--sr-kb-height) + env(safe-area-inset-bottom))",
          }}
        >
          <div className="pointer-events-auto">{guidance}</div>
        </div>
      ) : null}
    </div>
  );
}
