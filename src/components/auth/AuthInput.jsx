/**
 * Labelled 52px auth field with a leading Lucide icon and an optional
 * trailing slot (e.g. the password eye toggle).
 *
 * Padding and icon positions use `ltr:`/`rtl:` pairs so the field mirrors
 * correctly in Hebrew instead of pinning the icons to physical sides.
 */
function AuthInput({
  id,
  label,
  icon: Icon,
  trailing,
  className = "",
  ...props
}) {
  const inlineEndPadding = trailing
    ? "ltr:pr-[46px] rtl:pl-[46px]"
    : "ltr:pr-[14px] rtl:pl-[14px]";

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
        <input
          id={id}
          className={`h-[52px] w-full rounded-[14px] border-2 border-white/[0.18] bg-white/[0.12] text-base text-white outline-none transition-all duration-200 placeholder:text-white/50 focus:border-[rgba(96,165,250,0.7)] focus:bg-white/[0.18] disabled:cursor-not-allowed disabled:opacity-60 ltr:pl-[46px] rtl:pr-[46px] ${inlineEndPadding} ${className}`}
          {...props}
        />
        {trailing && (
          <div className="absolute top-1/2 -translate-y-1/2 ltr:right-[15px] rtl:left-[15px]">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthInput;
