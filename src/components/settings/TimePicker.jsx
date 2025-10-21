import { Clock } from "lucide-react";

/**
 * Time picker component with native HTML5 time input
 * Styled to match the app's gradient/glassmorphism design
 */
export function TimePicker({
  label,
  description,
  value,
  onChange,
  disabled = false,
  className = "",
}) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className={`py-3 ${className}`}>
      <label className="text-white font-medium text-sm block mb-2">
        {label}
      </label>
      {description && (
        <p className="text-white/60 text-xs mb-3">{description}</p>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <input
          type="time"
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full pl-16 pr-4 py-3
            bg-gradient-to-r from-slate-800/50 to-slate-700/50 
            border border-white/20 rounded-xl
            text-white font-medium text-base
            placeholder:text-white/40
            hover:from-slate-700/50 hover:to-slate-600/50
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            shadow-lg
            tabular-nums
            [color-scheme:dark]
          `}
        />
      </div>
    </div>
  );
}

export default TimePicker;
