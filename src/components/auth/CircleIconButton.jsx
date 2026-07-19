/**
 * 40px circular glass button used for the "back" affordance in the top-start
 * corner of the auth shell.
 */
function CircleIconButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.22] bg-white/[0.12] text-white backdrop-blur-[8px] transition-colors hover:bg-white/[0.2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]"
    >
      {children}
    </button>
  );
}

export default CircleIconButton;
