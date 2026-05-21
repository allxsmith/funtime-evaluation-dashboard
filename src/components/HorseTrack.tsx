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
      {/* finish line */}
      <div
        className="absolute inset-y-0 right-2 w-3"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0 6px, #fff 6px 12px)",
        }}
        aria-hidden
      />
      <span
        className="absolute right-6 top-1 text-lg"
        role="img"
        aria-label="finish flag"
      >
        🏁
      </span>

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
  // Sideways horse head + neck, facing right.
  // viewBox 120 x 80; head is on the right, neck drops down-left.
  return (
    <svg
      viewBox="0 0 120 80"
      className="w-[92px] h-[60px] sm:w-[108px] sm:h-[72px] drop-shadow-md text-slate-800 dark:text-slate-100"
      aria-label="horse"
      role="img"
    >
      {/* Main silhouette: neck rises from bottom-left, curves up to crest,
          arches over crown, drops down forehead to a long muzzle on the right,
          tucks back under the jaw and throat down to the neck base. */}
      <path
        d="
          M 14 78
          C 14 60, 18 44, 28 32
          C 36 22, 48 16, 60 14
          L 64 6
          L 72 14
          C 86 16, 96 24, 104 36
          C 110 44, 114 48, 116 54
          L 110 62
          C 106 66, 98 66, 92 62
          L 84 58
          C 76 56, 72 50, 70 44
          C 64 46, 56 50, 48 56
          C 40 62, 34 70, 30 78
          Z
        "
        fill="currentColor"
      />
      {/* Mane: hair falling along the back of the neck */}
      <path
        d="
          M 60 14
          C 50 18, 42 26, 36 36
          C 30 48, 26 60, 24 78
          L 14 78
          C 14 60, 18 44, 28 32
          C 36 22, 48 16, 60 14
          Z
        "
        fill="currentColor"
        opacity="0.55"
      />
      {/* Inner ear highlight */}
      <path d="M 66 12 L 69 6 L 70 13 Z" fill="currentColor" opacity="0.5" />
      {/* Eye */}
      <circle cx="86" cy="32" r="2" fill="#ffffff" />
      <circle cx="86" cy="32" r="1.1" fill="#0f172a" />
      {/* Nostril */}
      <ellipse
        cx="108"
        cy="52"
        rx="1.8"
        ry="1.2"
        fill="#0f172a"
        opacity="0.6"
      />
      {/* Mouth line */}
      <path
        d="M 102 60 Q 108 60 112 58"
        stroke="#0f172a"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />

      {/* Harness noseband — wraps around the muzzle just above the nostril */}
      <path
        d="
          M 92 44
          C 100 42, 108 44, 116 48
          L 114 54
          C 106 51, 99 51, 92 52
          Z
        "
        fill={harnessColor}
      />
      {/* Cheek strap from noseband up toward crown */}
      <path
        d="M 90 28 Q 92 38 94 46"
        stroke={harnessColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Crownpiece over the top of the head behind the ears */}
      <path
        d="M 72 14 Q 84 18 90 28"
        stroke={harnessColor}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
