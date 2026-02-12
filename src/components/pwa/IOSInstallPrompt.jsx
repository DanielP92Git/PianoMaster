import React, { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";
import {
  isIOSDevice,
  isSafariBrowser,
  isInStandaloneMode,
} from "../../utils/pwaDetection";

const DISMISS_STORAGE_KEY = "ios-install-dismissed";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function shouldShowPrompt() {
  if (typeof window === "undefined") {
    return false;
  }

  if (!isIOSDevice() || !isSafariBrowser() || isInStandaloneMode()) {
    return false;
  }

  const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY);
  if (!dismissed) {
    return true;
  }

  const dismissedTime = Number(dismissed);
  return Number.isFinite(dismissedTime)
    ? Date.now() - dismissedTime > DISMISS_COOLDOWN_MS
    : true;
}

const InstructionStep = ({ number, icon, text }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 h-6 w-6 flex-shrink-0 rounded-full bg-blue-100 text-xs font-bold text-blue-600 flex items-center justify-center">
      {number}
    </div>
    <p className="text-sm text-gray-700 flex-1">
      {text}
      {icon}
    </p>
  </div>
);

export default function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowPrompt()) {
      return;
    }

    const timer = setTimeout(() => setIsVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismissPrompt = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎹</span>
              <div>
                <p className="text-xs text-white/80">Add to Home Screen</p>
                <h3 className="text-sm font-semibold">Install PianoMaster</h3>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="Dismiss install instructions"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <p className="text-sm text-gray-600">
              Install PianoMaster for offline practice, instant access, and a
              distraction-free experience.
            </p>
          </div>

          <div className="space-y-3">
            <InstructionStep
              number={1}
              text={
                <>
                  Tap the <strong>Share</strong> button
                </>
              }
              icon={
                <Share className="ml-2 inline h-4 w-4 text-blue-600 animate-pulse" />
              }
            />
            <InstructionStep
              number={2}
              text={
                <>
                  Choose <strong>Add to Home Screen</strong>
                </>
              }
              icon={<Plus className="ml-2 inline h-4 w-4 text-blue-600" />}
            />
            <InstructionStep
              number={3}
              text={
                <>
                  Tap <strong>Add</strong> to confirm
                </>
              }
            />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
            <Share className="h-4 w-4 text-blue-600 animate-bounce" />
            <span>
              Safari’s Share button lives at the top or the bottom of the screen
            </span>
          </div>

          <button
            onClick={dismissPrompt}
            className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
