import { motion } from "framer-motion";
import { contrastText } from "../utils/colors";

const TRACK_START_PCT = 5;
const TRACK_END_PCT = 88;

export function HorseTrack({
  itemName,
  presenterName,
  presenterColor,
  positionPct,
  scoreLabel,
  finishLinePct,
}: {
  itemName: string;
  presenterName: string;
  presenterColor: string;
  positionPct: number;
  scoreLabel?: string;
  /** 0–100. When omitted or 0, the finish line stays at the right edge. */
  finishLinePct?: number;
}) {
  const clampedPct = Math.max(0, Math.min(100, positionPct));
  const horseLeft =
    TRACK_START_PCT + (clampedPct / 100) * (TRACK_END_PCT - TRACK_START_PCT);

  // Default the finish line to the right edge when there's no leader yet.
  const hasLeader = finishLinePct !== undefined && finishLinePct > 0;
  const clampedFinish = hasLeader
    ? Math.max(0, Math.min(100, finishLinePct!))
    : 100;
  const finishLeft = hasLeader
    ? TRACK_START_PCT +
      (clampedFinish / 100) * (TRACK_END_PCT - TRACK_START_PCT)
    : 100;

  return (
    <div className="relative h-20 sm:h-24 rounded-xl overflow-hidden border-2 border-amber-300 dark:border-amber-700 bg-linear-to-b from-amber-100 to-amber-200 dark:from-amber-900/60 dark:to-amber-950/80">
      {/* lane stripes */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(120, 53, 15, 0.18) 38px, rgba(120, 53, 15, 0.18) 40px)",
        }}
        aria-hidden
      />
      {/* finish line — slides to the current leader's position */}
      <motion.div
        className="absolute inset-y-0 w-3 -translate-x-1/2"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0 6px, #fff 6px 12px)",
        }}
        initial={false}
        animate={{ left: hasLeader ? `${finishLeft}%` : `calc(100% - 8px)` }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        aria-hidden
      />
      <motion.span
        className="absolute top-1 text-lg"
        role="img"
        aria-label="finish flag"
        initial={false}
        animate={{
          left: hasLeader ? `calc(${finishLeft}% + 6px)` : `calc(100% - 28px)`,
        }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
      >
        🏁
      </motion.span>

      {/* Item label */}
      <div className="absolute left-2 top-1 flex items-center gap-2 z-10">
        <span className="text-[12px] font-extrabold text-amber-900 dark:text-amber-100 uppercase tracking-wide">
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
        <div className="absolute right-12 top-1 text-xs font-extrabold text-amber-900 dark:text-amber-100 bg-white/80 dark:bg-black/50 rounded-md px-1.5">
          {scoreLabel}
        </div>
      )}

      {/* Horse */}
      <motion.div
        className="absolute bottom-1"
        initial={false}
        animate={{ left: `${horseLeft}%` }}
        transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transform: "translateX(-50%)" }}
      >
        <HorseHead harnessColor={presenterColor} />
      </motion.div>
    </div>
  );
}

function HorseHead({ harnessColor }: { harnessColor: string }) {
  // Sideways horse head + neck facing right, drawn as a single unified
  // silhouette path so there are no seams between head / muzzle / neck.
  return (
    <svg
      viewBox="0 0 140 80"
      className="w-[100px] h-[58px] sm:w-[120px] sm:h-[70px] drop-shadow-md text-slate-800 dark:text-slate-100"
      aria-label="horse"
      role="img"
    >
      {/* Outline: bottom-left → up back of neck → over crest → up to ear tip →
          down ear front → across forehead → forward to muzzle → around muzzle
          tip → back under chin → up to throat → down front of neck →
          bottom-right → close. */}
      <path
        d="
          M 10 78
          C 8 60, 14 42, 28 30
          C 38 22, 48 18, 56 16
          L 58 4
          L 64 14
          C 76 12, 88 16, 100 28
          C 110 36, 120 42, 128 50
          C 132 56, 128 62, 120 64
          C 112 66, 104 64, 96 60
          L 88 58
          C 84 56, 80 52, 78 46
          C 72 44, 66 44, 60 46
          C 52 48, 44 54, 36 62
          L 28 78
          Z
        "
        fill="currentColor"
      />

      {/* Mane: separate semi-transparent overlay flowing along the back of the
          neck. Gives texture without breaking the silhouette. */}
      <path
        d="
          M 28 30
          C 22 44, 16 60, 14 78
          L 4 78
          C 4 58, 12 36, 24 22
          Z
        "
        fill="currentColor"
        opacity="0.45"
      />

      {/* Inner ear highlight */}
      <path d="M 60 10 L 60 16 L 64 16 Z" fill="#ffffff" opacity="0.25" />

      {/* Eye */}
      <circle cx="90" cy="28" r="2.4" fill="#ffffff" />
      <circle cx="90" cy="28" r="1.3" fill="#0f172a" />

      {/* Nostril */}
      <ellipse
        cx="118"
        cy="56"
        rx="2"
        ry="1.4"
        fill="#0f172a"
        opacity="0.6"
      />

      {/* Mouth line */}
      <path
        d="M 108 61 Q 116 62 122 60"
        stroke="#0f172a"
        strokeWidth="0.9"
        fill="none"
        opacity="0.45"
        strokeLinecap="round"
      />

      {/* HARNESS */}
      {/* Solid colored noseband wrapping around the muzzle */}
      <path
        d="
          M 94 46
          L 124 52
          L 122 60
          L 94 56
          Z
        "
        fill={harnessColor}
      />
      {/* Cheek strap from noseband up the side of the head */}
      <path
        d="M 88 24 Q 92 38 98 50"
        stroke={harnessColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Crown piece across the top of the head, behind the ear */}
      <path
        d="M 66 14 Q 82 18 88 24"
        stroke={harnessColor}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
