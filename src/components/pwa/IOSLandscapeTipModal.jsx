import { X } from "lucide-react";

export default function IOSLandscapeTipModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80">Best experience tip</p>
              <h3 className="text-sm font-semibold">Use landscape on iPad</h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/20"
              aria-label="Close tip"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3 text-sm text-gray-800">
          <p>
            For the best PianoMaster experience on iPad, rotate your device to{" "}
            <strong>landscape</strong> and use the installed app from your{" "}
            <strong>Home Screen</strong>.
          </p>
          <p className="text-xs text-gray-600">
            Install the app by tapping the <strong>Share</strong> button in
            Safari and choosing <strong>Add to Home Screen</strong>, then open
            PianoMaster from the new icon.
          </p>

          <div className="pt-2">
            <button
              onClick={onClose}
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


