// Debug component to display diagnostic information in production
import React from "react";

export function DebugPanel({
  trebleNotes = [],
  bassNotes = [],
  clef = "Unknown",
}) {
  if (import.meta.env.MODE === "development") {
    return null; // Don't show in dev
  }

  const info = {
    environment: import.meta.env.MODE,
    trebleNotesLength: trebleNotes.length,
    bassNotesLength: bassNotes.length,
    clef,
    trebleFirst: trebleNotes[0]
      ? {
          note: trebleNotes[0].note,
          hasImageComponent: !!trebleNotes[0].ImageComponent,
          imageComponentType: typeof trebleNotes[0].ImageComponent,
        }
      : null,
    bassFirst: bassNotes[0]
      ? {
          note: bassNotes[0].note,
          hasImageComponent: !!bassNotes[0].ImageComponent,
          imageComponentType: typeof bassNotes[0].ImageComponent,
        }
      : null,
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-sm z-50 max-h-96 overflow-auto">
      <div className="font-bold mb-2">Debug Info (Production Only)</div>
      <pre className="whitespace-pre-wrap">{JSON.stringify(info, null, 2)}</pre>
      <button
        onClick={() => {
          const debugPanel = document.querySelector(
            '[class*="fixed bottom-4 right-4"]'
          );
          if (debugPanel) debugPanel.style.display = "none";
        }}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Hide
      </button>
    </div>
  );
}
