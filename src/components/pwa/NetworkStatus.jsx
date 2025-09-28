import React, { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { NetworkStatus as NetworkStatusUtil } from "../../utils/pwa";

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const networkStatus = new NetworkStatusUtil();

    networkStatus.onOffline(() => {
      setIsOnline(false);
      setShowOfflineToast(true);
      setShowOnlineToast(false);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowOfflineToast(false);
      }, 5000);
    });

    networkStatus.onOnline(() => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setShowOfflineToast(false);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowOnlineToast(false);
      }, 3000);
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  return (
    <>
      {/* Offline Toast */}
      {showOfflineToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">You're Offline</div>
              <div className="text-xs text-red-100">
                Some features may be limited
              </div>
            </div>
            <button
              onClick={() => setShowOfflineToast(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Online Toast */}
      {showOnlineToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[280px]">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">Back Online</div>
              <div className="text-xs text-green-100">
                All features are now available
              </div>
            </div>
            <button
              onClick={() => setShowOnlineToast(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Persistent Offline Indicator (optional) */}
      {!isOnline && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-gray-800 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs">
            <WifiOff className="w-3 h-3" />
            <span>Offline Mode</span>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkStatus;
