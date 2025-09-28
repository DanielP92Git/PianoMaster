import React, { useState, useEffect } from "react";
import { RefreshCw, X } from "lucide-react";
import { skipWaitingAndReload } from "../../utils/pwa";

const PWAUpdateNotification = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Global function that can be called from the service worker utilities
    window.showUpdateNotification = () => {
      setShowUpdate(true);
    };

    return () => {
      // Cleanup
      delete window.showUpdateNotification;
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      // Skip waiting and reload the app
      skipWaitingAndReload();
    } catch (error) {
      console.error("Update failed:", error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-down">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Update Available</h3>
                <p className="text-xs text-white/80">New version ready</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">
              🎹 PianoMaster Update
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              A new version of PianoMaster is available with improvements and
              bug fixes. Update now to get the latest features!
            </p>
          </div>

          {/* Update Features (you can customize this based on your actual updates) */}
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <h5 className="text-xs font-medium text-gray-700 mb-2">
              What's New:
            </h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                Performance improvements
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                Bug fixes and stability
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                Enhanced offline experience
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Update Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateNotification;
