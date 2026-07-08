import { useEffect, useState } from "react";
import { useMicSignal } from "../../../../hooks/useMicSignal";

/**
 * Transient volume meter shown for a few seconds after mic recovery. Subscribes
 * to the pitch-detection signal in isolation so the live level animates here
 * WITHOUT re-rendering SightReadingGame every frame (PERF-1).
 */
export function MicVolumeMeter({ subscribe }) {
  const { level } = useMicSignal(subscribe);
  return (
    <div className="fixed right-3 top-3 z-40 flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-1 shadow-sm backdrop-blur-sm transition-opacity">
      <div
        className="h-2 rounded-full bg-green-500 transition-all duration-75"
        style={{
          width: `${Math.min(100, (level || 0) * 400)}%`,
          maxWidth: "64px",
          minWidth: "4px",
        }}
      />
      <span className="text-xs text-gray-600">mic</span>
    </div>
  );
}

/**
 * Dev-only mic debug overlay (localStorage `debug-mic=1`). Polls the live FSM
 * snapshot via `getDebug()` on each throttled signal tick and reads detected
 * note/frequency/level from the subscription — all isolated to this leaf so the
 * dev panel never forces a game re-render (PERF-1).
 */
export function MicDebugPanel({ subscribe, getDebug, isListening }) {
  const { level, note, frequency } = useMicSignal(subscribe);
  const [fsm, setFsm] = useState(() =>
    typeof getDebug === "function" ? getDebug() : {}
  );

  // Refresh the FSM snapshot on every signal tick (throttled by useMicSignal).
  useEffect(() => {
    if (typeof getDebug !== "function") return;
    setFsm(getDebug());
  }, [getDebug, level, note, frequency]);

  return (
    <div className="pointer-events-none absolute bottom-2 right-2 z-50 w-[260px] rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white backdrop-blur">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-semibold">Mic Debug</div>
        <div className="text-white/70">
          {isListening ? "listening" : "stopped"}
        </div>
      </div>
      <div className="space-y-1 text-white/90">
        <div className="flex justify-between">
          <span className="text-white/70">audioLevel</span>
          <span>{Number(level || 0).toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">detected</span>
          <span>
            {note ?? "—"} {frequency > 0 ? `(${frequency.toFixed(1)}Hz)` : ""}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">current</span>
          <span>{fsm?.currentNote ?? "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/70">candidate</span>
          <span>
            {fsm?.candidateNote ?? "—"}{" "}
            {fsm?.candidateFrames ? `(${fsm.candidateFrames})` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
