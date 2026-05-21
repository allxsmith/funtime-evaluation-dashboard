import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEvaluationStore } from "../store/evaluationStore";
import { contrastText } from "../utils/colors";
import { PresenterTimer } from "./PresenterTimer";

export function PresenterCard({
  presenterId,
  onDone,
}: {
  presenterId: string;
  onDone: () => void;
}) {
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const allItems = useEvaluationStore((s) => s.items);
  const tracks = useEvaluationStore((s) => s.tracks);
  const duration = useEvaluationStore((s) => s.config.presenterDurationSeconds);

  const presenter = evaluators.find((e) => e.id === presenterId);
  const items = allItems.filter((i) => i.presenterId === presenterId);

  if (!presenter) return null;

  const trackName = (id: string) => tracks.find((t) => t.id === id)?.name ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border-4 overflow-hidden"
      style={{ borderColor: presenter.color }}
    >
      <div
        className="px-6 py-5"
        style={{
          backgroundColor: presenter.color,
          color: contrastText(presenter.color),
        }}
      >
        <p className="text-xs uppercase tracking-widest opacity-80">
          Presenting now
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold">{presenter.name}</h2>
      </div>

      <div className="p-6 grid gap-6 sm:grid-cols-[1fr_auto] items-center">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Items
          </p>
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2.5"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: presenter.color }}
                  aria-hidden
                />
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {item.name}
                </span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">
                  {trackName(item.trackId)}
                </span>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-slate-400 dark:text-slate-500 italic">No items assigned.</li>
            )}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-4 sm:border-l sm:border-slate-200 dark:sm:border-slate-700 sm:pl-6">
          <PresenterTimer
            durationSeconds={duration}
            presenterId={presenterId}
          />
          <button
            onClick={onDone}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 shadow-md transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            Done Presenting
          </button>
        </div>
      </div>
    </motion.div>
  );
}
