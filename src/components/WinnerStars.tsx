import { motion } from "framer-motion";
import { Star } from "lucide-react";

export function WinnerStars({
  winnerName,
  winnerSubtitle,
  runnerUpName,
  runnerUpSubtitle,
}: {
  winnerName: string;
  winnerSubtitle?: string;
  runnerUpName?: string;
  runnerUpSubtitle?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="relative text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 -z-10 bg-amber-300 blur-3xl opacity-60 rounded-full"
          aria-hidden
        />
        <div className="relative">
          <Star
            className="w-36 h-36 text-amber-400 drop-shadow-2xl"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 px-5">
            <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">
              Winner
            </div>
            <div className="text-sm font-extrabold leading-tight">
              {winnerName}
            </div>
          </div>
        </div>
        {winnerSubtitle && (
          <div className="mt-2 text-xs font-bold text-amber-800">
            {winnerSubtitle}
          </div>
        )}
      </motion.div>

      {runnerUpName && (
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 0.85, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 14,
            delay: 0.2,
          }}
          className="relative text-center"
        >
          <div className="relative">
            <Star
              className="w-28 h-28 text-slate-400 dark:text-slate-500 drop-shadow-xl"
              fill="currentColor"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-900 px-3">
              <div className="text-[9px] font-extrabold uppercase tracking-widest opacity-70">
                Runner up
              </div>
              <div className="text-xs font-extrabold leading-tight">
                {runnerUpName}
              </div>
            </div>
          </div>
          {runnerUpSubtitle && (
            <div className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {runnerUpSubtitle}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
