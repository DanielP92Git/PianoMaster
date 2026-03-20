import React, { useEffect, useMemo, useRef } from "react";
import { UnifiedGameSettings } from "../../shared/UnifiedGameSettings";
import { TREBLE_NOTES, BASS_NOTES } from "../constants/gameSettings";
import { TIME_SIGNATURES } from "../../rhythm-games/RhythmPatternGenerator";
import { normalizeSelectedNotes } from "../../shared/noteSelectionUtils";
import { getAllComplexPatternIds } from "../utils/rhythmPatterns";
import { filterNotesToKey } from "../utils/keySignatureUtils";

//
export function PreGameSetup({
  settings,
  onUpdateSettings,
  onStart,
  micStatus,
}) {
  const normalizedSelectedNotes = useMemo(
    () =>
      normalizeSelectedNotes({
        selectedNotes: settings.selectedNotes,
        clef: settings.clef,
        trebleNotes: TREBLE_NOTES,
        bassNotes: BASS_NOTES,
        targetField: "pitch",
        enableSharps: settings.enableSharps ?? false,
        enableFlats: settings.enableFlats ?? false,
      }),
    [
      settings.selectedNotes,
      settings.clef,
      settings.enableSharps,
      settings.enableFlats,
    ]
  );

  // Auto-filter selectedNotes to in-key pitches when the user changes keySignature.
  // Only filters when switching to a non-C key; preserves notes on C/null (no-op).
  const prevKeyRef = useRef(settings.keySignature);
  useEffect(() => {
    if (settings.keySignature !== prevKeyRef.current) {
      prevKeyRef.current = settings.keySignature;
      if (settings.keySignature && settings.keySignature !== "C") {
        const filtered = filterNotesToKey(
          settings.selectedNotes,
          settings.keySignature
        );
        if (filtered.length !== settings.selectedNotes.length) {
          onUpdateSettings({ ...settings, selectedNotes: filtered });
        }
      }
    }
  }, [settings.keySignature]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rhythm defaults (v1): straight values only (w/h/q/8/16), no rests by default.
  // All complex patterns are enabled by default for complex rhythm mode.
  const defaultRhythmSettings = {
    allowedNoteDurations: ["q", "8"],
    allowRests: false,
    allowedRestDurations: ["q", "8"],
    enabledComplexPatterns: getAllComplexPatternIds(),
  };

  const preparedInitialSettings = {
    ...settings,
    selectedNotes: normalizedSelectedNotes,
    rhythmSettings: settings.rhythmSettings ?? defaultRhythmSettings,
    rhythmComplexity: settings.rhythmComplexity ?? "simple",
  };
  const config = {
    gameType: "sight-reading",
    steps: [
      {
        id: "clef",
        title: "gameSettings.steps.labels.clef",
        component: "ClefSelection",
      },
      {
        id: "keySignature",
        title: "gameSettings.steps.labels.keySignature",
        component: "KeySignatureSelection",
      },
      {
        id: "notes",
        title: "gameSettings.steps.labels.notes",
        component: "NoteSelection",
        config: { showImages: true, minNotes: 2, noteIdField: "pitch" },
      },
      {
        id: "timeSignature",
        title: "gameSettings.steps.labels.rhythmSettings",
        component: "TimeSignatureSelection",
        config: {
          timeSignatures: [
            TIME_SIGNATURES.FOUR_FOUR,
            TIME_SIGNATURES.THREE_FOUR,
            TIME_SIGNATURES.TWO_FOUR,
          ],
          showRhythmOptions: true,
        },
      },
      {
        id: "barsPerExercise",
        title: "gameSettings.steps.labels.barsPerExercise",
        component: "BarsPerExerciseSelection",
        config: {
          options: [1, 2, 4, 8],
          enabledOptions: [1, 2, 4, 8], // Phase 2: enable 1/2/4/8 bars
        },
      },
      {
        id: "tempo",
        title: "gameSettings.steps.labels.tempo",
        component: "TempoSelection",
        config: { minTempo: 60, maxTempo: 180 },
      },
    ],
    initialSettings: preparedInitialSettings,
    onStart: (finalSettings) => {
      // Stop any mic test before starting the game
      if (micStatus.isListening) {
        micStatus.stopListening();
      }

      const preparedSettings = {
        ...finalSettings,
        selectedNotes: normalizeSelectedNotes({
          selectedNotes: finalSettings.selectedNotes,
          clef: finalSettings.clef,
          trebleNotes: TREBLE_NOTES,
          bassNotes: BASS_NOTES,
          targetField: "pitch",
          enableSharps: finalSettings.enableSharps ?? false,
          enableFlats: finalSettings.enableFlats ?? false,
        }),
        rhythmSettings: finalSettings.rhythmSettings ?? defaultRhythmSettings,
        rhythmComplexity: finalSettings.rhythmComplexity ?? "simple",
      };

      onUpdateSettings(preparedSettings);
      onStart(preparedSettings);
    },
    backRoute: "/notes-master-mode",
    noteData: {
      trebleNotes: TREBLE_NOTES,
      bassNotes: BASS_NOTES,
    },
  };

  return (
    <div className="relative">
      {/* Microphone Test Panel */}
      {/* <div className="fixed top-20 right-4 z-50 bg-white/10 backdrop-blur-lg rounded-lg p-4 shadow-xl border border-white/20 max-w-xs">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          {micStatus.isListening ? (
            <Mic className="w-5 h-5 text-green-400 animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-400" />
          )}
          Microphone Status
        </h3>
        
        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-white/70">Status: </span>
            <span className={`font-medium ${
              micMode === 'error' ? 'text-red-400' : 
              micStatus.isListening ? 'text-green-400' : 
              micMode === 'tested' ? 'text-green-300' :
              'text-white'
            }`}>
              {getMicStatusLabel()}
            </span>
          </div>

          {micStatus.isListening && (
            <div>
              <label className="text-xs text-white/70 mb-1 block">
                Audio Level
              </label>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(micStatus.audioLevel * 1000, 100)}%` }}
                />
              </div>
            </div>
          )}

          {micError && (
            <p className="text-xs text-red-400">{micError}</p>
          )}

          <button
            onClick={micStatus.isListening ? handleStopTest : handleTestMic}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              micStatus.isListening
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {micStatus.isListening ? 'Stop Test' : 'Test Microphone'}
          </button>

          <p className="text-xs text-white/60 mt-2">
            The microphone is required during gameplay to detect the notes you play.
          </p>
        </div>
      </div> */}

      <UnifiedGameSettings {...config} />
    </div>
  );
}
