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
 * - phase: "setup" | "display" | "count-in" | "performance" | "feedback"
 * - hasKeyboard: boolean (whether the keyboard region should be rendered/reserved)
 * - isFeedbackPhase: boolean (convenience; may influence stacking/spacing)
 * - isCompactLandscape?: boolean (layout hint computed by parent)
 * - isTallStaffLayout?: boolean (NEW: signals staff will be taller, e.g., both clefs)
 * - headerControls: JSX (Back button, progress, toggles)
 * - staff: JSX (VexFlow staff region only; no keyboard/guidance logic)
 * - guidance: JSX (Start Playing button or small phase text)
 * - keyboard: JSX | null (KlavierKeyboard wrapper or null)
 * - feedbackPanel: JSX | null (FeedbackSummary card or null)
 *
 * Scrolling contract (Phase 0 principle):
 * - Desktop (>= md): no outer/page scrolling in the game route; fit into `h-screen`.
 * - Mobile (< md): allow at most ONE vertical scrollbar (root/page), avoid nested scrollers.
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
  headerControls,
  staff,
  guidance,
  keyboard,
  feedbackPanel,
}) {
  const hasDockedKeyboard = Boolean(hasKeyboard) && !isFeedbackPhase;
  // In feedback phase, show the feedback panel in the bottom dock (where keyboard normally is)
  const hasDockedBottom =
    hasDockedKeyboard || (isFeedbackPhase && Boolean(feedbackPanel));
  const bottomDockContent = isFeedbackPhase ? feedbackPanel : keyboard;

  // Show guidance as an overlay to prevent it from affecting card layout
  // In DISPLAY phase: button is rendered over keyboard (see keyboard dock section)
  // In other phases: small text shown as centered overlay
  const showGuidanceOverlay =
    guidance && !isFeedbackPhase && phase !== "display";

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
  // Mobile and desktop need to account for keyboard/feedback dock when present
  // Mobile: subtract header (~64px) and keyboard dock height
  // Desktop: subtract header (~50px) and keyboard dock height with extra spacing
  const cardMaxHeightClass = hasDockedBottom
    ? "max-h-[calc(100dvh-64px-var(--sr-kb-height))] md:max-h-[calc(100vh-50px-var(--sr-kb-height))]"
    : "max-h-[calc(100dvh-64px)] md:max-h-[calc(100vh-100px)]";

  // Step 3: Grid-based vertical allocation on desktop
  // Mobile uses flex, desktop uses grid to prevent staff from dominating
  // The card only has staff (no guidance inside to avoid clipping issues)
  const cardInteriorClass =
    "flex flex-col md:grid md:grid-rows-[minmax(180px,1fr)]";

  return (
    <div
      className={`relative flex h-[100dvh] min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 ${
        isFeedbackPhase ? "overflow-y-auto" : "overflow-y-hidden"
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
          // 38vh scales nicely; min 130px for very short screens, max 280px for tall screens
          "--sr-kb-height": hasDockedBottom
            ? "clamp(130px, 38vh, 280px)"
            : "0px",
        })
      }
    >
      {/* Header - fixed height, no flex grow */}
      <div className="flex-shrink-0">{headerControls}</div>

      {/* Main content area */}
      <div className="relative min-h-0 flex-1">
        <div
          className={`flex h-full flex-col items-center px-2 sm:px-0 ${mainGap}`}
          style={{
            paddingBottom:
              "calc(var(--sr-kb-height) + env(safe-area-inset-bottom))",
          }}
        >
          <div
            className={`flex min-h-0 w-full max-w-5xl flex-1 flex-col ${stackGap}`}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Card with constrained height and grid interior */}
              <div
                className={`relative flex-1 rounded-2xl bg-white/95 shadow-2xl backdrop-blur-sm ${cardMaxHeightClass}`}
                data-sr-region="card"
                style={{ overflow: "visible" }}
              >
                <div className={`h-full ${cardInteriorClass}`}>
                  {/* Staff band - full height, guidance shown as overlay */}
                  <div
                    className="relative z-0 flex min-h-[120px] w-full flex-1 items-center justify-center px-2 py-1 sm:px-3 sm:py-2"
                    data-sr-region="staff"
                    style={{ overflow: "visible" }}
                  >
                    {staff}
                  </div>
                </div>
              </div>
            </div>
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
            className="h-full w-full pb-[env(safe-area-inset-bottom)]"
            style={{
              paddingLeft: "env(safe-area-inset-left)",
              paddingRight: "env(safe-area-inset-right)",
            }}
          >
            <div className="h-full w-full">{bottomDockContent}</div>
          </div>
        </div>
      ) : null}

      {/* Guidance overlay: for count-in and performance phase text */}
      {showGuidanceOverlay ? (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-24"
          data-sr-region="guidance-overlay"
          style={{
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
