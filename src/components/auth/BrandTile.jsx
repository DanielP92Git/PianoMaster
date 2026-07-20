/**
 * The floating gradient app mark. Sized by the caller, since it appears at
 * 52px in desktop hero rows and 64px (48px on short screens) above the mobile
 * sheet.
 *
 * The float is `motion-safe:` only — it stops for reduced-motion users.
 */
function BrandTile({ className = "", emojiClassName = "" }) {
  return (
    <div
      className={`flex items-center justify-center rounded-[20px] bg-gradient-to-br from-[#4f46e5] to-[#c026d3] shadow-[0_8px_28px_rgba(192,38,211,0.5)] motion-safe:animate-pmfloat ${className}`}
    >
      <span className={emojiClassName} aria-hidden="true">
        🎹
      </span>
    </div>
  );
}

export default BrandTile;
