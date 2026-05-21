import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

export function PresenterTimer({
  durationSeconds,
  presenterId,
}: {
  durationSeconds: number;
  presenterId: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    setElapsed(0);
    setRunning(true);
    lastTsRef.current = null;
  }, [presenterId, durationSeconds]);

  useEffect(() => {
    if (!running) {
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setElapsed((e) => {
        const next = e + dt;
        return next > durationSeconds ? durationSeconds : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, durationSeconds]);

  const remaining = Math.max(0, durationSeconds - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(Math.floor(remaining % 60)).padStart(2, "0");
  const pct = durationSeconds > 0 ? (elapsed / durationSeconds) * 100 : 0;
  const warning = remaining < 30 && remaining > 0;
  const expired = remaining === 0;

  const color = expired
    ? "text-red-600"
    : warning
      ? "text-orange-500"
      : "text-slate-800";
  const barColor = expired
    ? "bg-red-500"
    : warning
      ? "bg-orange-400"
      : "bg-emerald-500";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`font-mono text-5xl sm:text-6xl font-extrabold tabular-nums ${color} ${expired ? "animate-pulse" : ""}`}
      >
        {mm}:{ss}
      </div>
      <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-[width] duration-200 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-full bg-slate-100 hover:bg-slate-200 p-2.5"
          aria-label={running ? "Pause" : "Resume"}
        >
          {running ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => {
            setElapsed(0);
            setRunning(true);
            lastTsRef.current = null;
          }}
          className="rounded-full bg-slate-100 hover:bg-slate-200 p-2.5"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
