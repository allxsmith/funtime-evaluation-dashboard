import { motion } from "framer-motion";
import { contrastText } from "../utils/colors";

const TRACK_START_PCT = 4;
const TRACK_END_PCT = 88;

export function HorseTrack({
  itemName,
  presenterName,
  presenterColor,
  positionPct,
  scoreLabel,
}: {
  itemName: string;
  presenterName: string;
  presenterColor: string;
  positionPct: number;
  scoreLabel?: string;
}) {
  const clampedPct = Math.max(0, Math.min(100, positionPct));
  const horseLeft =
    TRACK_START_PCT + (clampedPct / 100) * (TRACK_END_PCT - TRACK_START_PCT);

  return (
    <div className="relative h-16 rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 bg-linear-to-b from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-950/80">
      {/* lane stripes */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(120, 53, 15, 0.18) 38px, rgba(120, 53, 15, 0.18) 40px)",
        }}
        aria-hidden
      />
      {/* finish line */}
      <div
        className="absolute inset-y-0 right-2 w-3"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0 5px, #fff 5px 10px)",
        }}
        aria-hidden
      />
      <span
        className="absolute right-6 top-1 text-base"
        role="img"
        aria-label="finish flag"
      >
        🏁
      </span>

      {/* Item label */}
      <div className="absolute left-2 top-1 flex items-center gap-2 z-0">
        <span className="text-[11px] font-extrabold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
          {itemName}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: presenterColor,
            color: contrastText(presenterColor),
          }}
        >
          {presenterName}
        </span>
      </div>

      {scoreLabel && (
        <div className="absolute right-10 top-1 text-xs font-extrabold text-amber-900 dark:text-amber-100 bg-white/70 dark:bg-black/40 rounded-md px-1.5">
          {scoreLabel}
        </div>
      )}

      {/* Horse */}
      <motion.div
        className="absolute bottom-1 text-3xl select-none"
        initial={false}
        animate={{ left: `${horseLeft}%` }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transform: "translateX(-50%)" }}
      >
        🐎
      </motion.div>
    </div>
  );
}
