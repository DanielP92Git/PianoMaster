import { Loader2 } from "lucide-react";

/**
 * Full-width 52px call-to-action used across every auth view.
 *
 * Deliberately auth-local rather than an extension of `components/ui/Button`:
 * that button is gradient-based, sizes to `min-h-touch`, and has no class
 * merging, so the design's flat 52px / 14px-radius spec can't be layered on
 * without risking its existing call sites.
 */
const VARIANTS = {
  primary: "bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg",
  secondary: "bg-[#c026d3] hover:bg-[#a21caf] text-white shadow-lg",
  ghost:
    "bg-white/[0.12] border border-white/20 backdrop-blur-sm hover:bg-white/[0.18] text-white",
};

function AuthCta({
  children,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] text-base font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}

export default AuthCta;
