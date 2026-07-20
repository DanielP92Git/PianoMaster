/**
 * The frosted surface that carries auth form content.
 *
 * On mobile it is the rising bottom sheet, flush with the bottom edge. It is
 * `rounded-t-*` only, so there are no bottom corners to hide — do not
 * reintroduce a negative bottom margin to "bleed" it off-screen: inside the
 * shell's `overflow-y-auto` form region that margin does not shrink the box,
 * it just adds that many pixels of scrollable overflow on every screen.
 *
 * From `lg` up the desktop right panel is the container, so the sheet drops
 * its glass entirely and becomes a plain 372px form column.
 *
 * `variant="plain"` opts out of the sheet on mobile too (used by the
 * reset-sent screen, which is a centred success state with no sheet).
 */
function AuthSheet({ variant = "sheet", className = "", children }) {
  if (variant === "plain") {
    return (
      <div className={`w-full lg:max-w-[372px] ${className}`}>{children}</div>
    );
  }

  return (
    <div className="w-full rounded-t-[2rem] border border-white/20 bg-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.30)] backdrop-blur-[16px] lg:max-w-[372px] lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
      <div
        className={`flex flex-col px-6 pb-8 pt-[26px] lg:p-0 short:pb-5 short:pt-4 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export default AuthSheet;
