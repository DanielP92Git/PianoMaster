import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Monitor } from "lucide-react";
import { PWAInstaller } from "../../utils/pwa";

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installer, setInstaller] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const pwaInstaller = new PWAInstaller();

    // Override the onInstallAvailable method
    pwaInstaller.onInstallAvailable = () => {
      setShowPrompt(true);
    };

    // Override the onInstalled method
    pwaInstaller.onInstalled = () => {
      setShowPrompt(false);
      setIsInstalling(false);

      // Show success toast (you can integrate with your toast system)
      if (window.toast && window.toast.success) {
        window.toast.success("PianoMaster installed successfully! 🎹");
      }
    };

    setInstaller(pwaInstaller);

    // Check if already installed or if prompt should be shown
    if (pwaInstaller.isInstalled) {
      setShowPrompt(false);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  const handleInstall = async () => {
    if (!installer) return;

    setIsInstalling(true);

    try {
      const accepted = await installer.showInstallPrompt();

      if (!accepted) {
        setIsInstalling(false);
      }
      // If accepted, the onInstalled callback will handle the state
    } catch (error) {
      console.error("Installation failed:", error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // Remember user dismissed (optional - store in localStorage)
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if user recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      if (dismissedTime > oneDayAgo) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-lg">🎹</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">Install PianoMaster</h3>
                <p className="text-xs text-white/80">
                  Get the full app experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">
                Add to Home Screen
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Install PianoMaster for quick access, offline practice, and a
                native app experience.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span>Offline Practice</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span>Quick Access</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
              <span>Push Notifications</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span>No App Store</span>
            </div>
          </div>

          {/* Device Icons */}
          <div className="flex items-center justify-center gap-4 mb-4 py-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Smartphone className="w-4 h-4" />
              <span>Mobile</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Monitor className="w-4 h-4" />
              <span>Desktop</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
