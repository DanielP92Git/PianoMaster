import { useEffect, useState } from "react";
import { Bell, Clock } from "lucide-react";
import { dashboardReminderService } from "../../services/dashboardReminderService";

/**
 * Full-screen alarm modal that appears when practice reminder triggers
 * Shows while app is open, plays looping alarm sound
 */
function AlarmModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to alarm state changes
    const unsubscribe = dashboardReminderService.onAlarmStateChange(
      (isPlaying) => {
        setIsVisible(isPlaying);
      }
    );

    // Check initial state
    if (dashboardReminderService.isAlarmActive()) {
      setIsVisible(true);
    }

    return unsubscribe;
  }, []);

  const handleSnooze = () => {
    dashboardReminderService.snooze(15);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    dashboardReminderService.stopAlarm();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-2 sm:p-4">
      <div className="relative w-[95vw] max-w-lg h-auto max-h-[92vh] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 animate-in zoom-in duration-300 flex flex-col justify-center overflow-hidden">
        {/* Pulsing bell icon */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-white rounded-full p-2 sm:p-3">
              <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-2">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
            Time to Practice! 🎹
          </h2>
          <p className="text-white/90 text-xs sm:text-sm">
            Your practice reminder is here. Let's make some music!
          </p>
        </div>

        {/* Clock icon with time */}
        <div className="flex items-center justify-center gap-1.5 mb-3 text-white/80">
          <Clock className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Action buttons - Centered with max-width for better mobile UX */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            onClick={handleDismiss}
            className="w-full max-w-xs min-h-[42px] py-2 sm:py-2.5 px-4 bg-white text-purple-600 font-bold text-sm rounded-lg sm:rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Dismiss
          </button>
          <button
            onClick={handleSnooze}
            className="w-full max-w-xs min-h-[42px] py-2 sm:py-2.5 px-4 bg-white/20 backdrop-blur-sm text-white font-semibold text-sm rounded-lg sm:rounded-xl hover:bg-white/30 active:scale-95 transition-all duration-200 border-2 border-white/40"
          >
            Snooze (15 min)
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-28 h-28 sm:w-32 sm:h-32 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
}

export default AlarmModal;
