import { ChevronDown } from "lucide-react";

/**
 * Select twin of `AuthInput` — same 52px glass shell, label wiring and
 * `ltr:`/`rtl:` mirroring, but renders a native `<select>` with an
 * `appearance-none` chevron overlay on the inline-end side.
 *
 * Option colours come from the global `select option` rule in `index.css`,
 * so options don't need per-element classes here.
 */
function AuthSelect({
  id,
  label,
  icon: Icon,
  className = "",
  children,
  ...props
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-[7px] block text-[13px] font-medium text-white/85"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/55 ltr:left-[15px] rtl:right-[15px]"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
        <select
          id={id}
          className={`h-[52px] w-full appearance-none rounded-[14px] border-2 border-white/[0.18] bg-white/[0.12] text-base text-white outline-none transition-all duration-200 focus:border-[rgba(96,165,250,0.7)] focus:bg-white/[0.18] disabled:cursor-not-allowed disabled:opacity-60 ltr:pr-[42px] rtl:pl-[42px] ${
            Icon ? "ltr:pl-[46px] rtl:pr-[46px]" : "ltr:pl-[14px] rtl:pr-[14px]"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/55 ltr:right-[15px] rtl:left-[15px]"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export default AuthSelect;
