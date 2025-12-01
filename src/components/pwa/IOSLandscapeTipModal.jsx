import { createElement, useState } from "react";
import { X as CloseIcon, Share } from "lucide-react";

export default function IOSLandscapeTipModal({ onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    onClose({ dontShowAgain });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <style>{`
        @keyframes rotateDevice {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(90deg);
          }
        }
      `}</style>

      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Best experience tip</p>
              <h3 className="text-sm font-semibold">Use landscape on iPad</h3>
            </div>
            <button
              onClick={handleClose}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="Close tip"
            >
              {createElement(CloseIcon, { className: "h-4 w-4" })}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 text-sm text-gray-800">
          {/* Rotation Animation */}
          <div className="flex justify-center py-4">
            <div className="relative w-20 h-20">
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  animation: "rotateDevice 2s ease-in-out infinite",
                }}
              >
                <div className="w-12 h-16 border-2 border-indigo-600 rounded-md bg-indigo-50/50" />
              </div>
            </div>
          </div>

          <p>
            For the best PianoMaster experience on iPad, rotate your device to{" "}
            <strong>landscape</strong> and use the installed app from your{" "}
            <strong>Home Screen</strong>.
          </p>
          <p className="text-xs text-gray-600">
            Install the app by tapping the <strong>Share</strong> {"("}
            <Share className="inline h-3 w-3 text-blue-600 " />
            {") "}
            button in Safari and choosing <strong>Add to Home Screen</strong>,
            then open PianoMaster from the new icon.
          </p>

          <label className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={dontShowAgain}
              onChange={(event) => setDontShowAgain(event.target.checked)}
            />
            <span>
              Got it! Don&apos;t show it again<span aria-hidden="true">.</span>
            </span>
          </label>

          <div className="pt-2">
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
