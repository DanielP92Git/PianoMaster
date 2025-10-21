import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Collapsible section container for settings
 */
export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden ${className}`}
    >
      {/* Section Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white/70 mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-white/70" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/70" />
          )}
        </div>
      </button>

      {/* Section Content */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-4 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );
}

export default SettingsSection;
