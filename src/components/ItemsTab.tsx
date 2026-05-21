import { motion } from "framer-motion";
import { useEvaluationStore } from "../store/evaluationStore";
import { contrastText } from "../utils/colors";

export function ItemsTab() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);

  const evaluatorById = Object.fromEntries(evaluators.map((e) => [e.id, e]));

  return (
    <div className="space-y-10">
      {tracks.map((track) => {
        const trackItems = items.filter((i) => i.trackId === track.id);
        return (
          <section key={track.id}>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">
              {track.name}
              <span className="ml-2 text-sm font-medium text-slate-500">
                ({trackItems.length})
              </span>
            </h2>

            {trackItems.length === 0 ? (
              <p className="text-slate-500 italic">No items yet.</p>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {trackItems.map((item, idx) => {
                  const presenter = evaluatorById[item.presenterId];
                  const color = presenter?.color ?? "#94a3b8";
                  return (
                    <motion.article
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.4 }}
                      className="rounded-2xl bg-white shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition"
                    >
                      <div
                        className="h-2"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-slate-800">
                          {item.name}
                        </h3>
                        {presenter && (
                          <div className="mt-3 flex items-center gap-2">
                            <span
                              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: color,
                                color: contrastText(color),
                              }}
                            >
                              <span
                                className="w-2 h-2 rounded-full bg-current opacity-80"
                                aria-hidden
                              />
                              {presenter.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
