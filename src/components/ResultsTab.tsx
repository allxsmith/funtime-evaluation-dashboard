import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, PartyPopper } from "lucide-react";
import { useEvaluationStore } from "../store/evaluationStore";
import { WinnerStars } from "./WinnerStars";
import {
  getScore,
  rawMax,
  rawTotal,
  weightedMax,
  weightedTotal,
} from "../utils/scoring";
import { bigCelebrate } from "../utils/confetti";
import { contrastText } from "../utils/colors";

export function ResultsTab() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const sections = useEvaluationStore((s) => s.sections);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const scores = useEvaluationStore((s) => s.scores);
  const attendees = useEvaluationStore((s) => s.attendees);
  const bets = useEvaluationStore((s) => s.bets);

  const sectionsById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  );
  const evaluatorById = useMemo(
    () => Object.fromEntries(evaluators.map((e) => [e.id, e])),
    [evaluators],
  );
  const itemById = useMemo(
    () => Object.fromEntries(items.map((i) => [i.id, i])),
    [items],
  );
  const [openPicks, setOpenPicks] = useState<Record<string, boolean>>({});
  const [winnerBy, setWinnerBy] = useState<Record<string, "raw" | "weighted">>(
    {},
  );
  const winnerModeFor = (trackId: string) => winnerBy[trackId] ?? "weighted";

  useEffect(() => {
    bigCelebrate();
  }, []);

  return (
    <div className="space-y-10">
      {tracks.map((track) => {
        const trackItems = items.filter((i) => i.trackId === track.id);
        const trackSections = track.sectionIds
          .map((id) => sectionsById[id])
          .filter(Boolean);
        const scoredAll = trackItems.map((item) => ({
          item,
          raw: rawTotal(scores, item, track.sectionIds),
          weighted: weightedTotal(
            scores,
            item,
            track.sectionIds,
            sectionsById,
          ),
        }));
        const maxRaw = rawMax(track.sectionIds);
        const maxWeighted = weightedMax(track.sectionIds, sectionsById);

        const wMode = winnerModeFor(track.id);
        const scored = [...scoredAll].sort((a, b) =>
          wMode === "raw" ? b.raw - a.raw : b.weighted - a.weighted,
        );
        const winner = scored[0];
        const runnerUp = scored[1];

        // Highlight "winners differ!" when raw and weighted disagree.
        const rawWinner = [...scoredAll].sort((a, b) => b.raw - a.raw)[0];
        const weightedWinner = [...scoredAll].sort(
          (a, b) => b.weighted - a.weighted,
        )[0];
        const winnersDiffer =
          rawWinner &&
          weightedWinner &&
          rawWinner.raw > 0 &&
          weightedWinner.weighted > 0 &&
          rawWinner.item.id !== weightedWinner.item.id;

        const winnerScore =
          wMode === "raw"
            ? `${winner?.raw ?? 0} / ${maxRaw} raw`
            : `${winner?.weighted.toFixed(1) ?? 0} / ${maxWeighted.toFixed(1)} weighted`;
        const runnerUpScore = runnerUp
          ? wMode === "raw"
            ? `${runnerUp.raw} raw`
            : `${runnerUp.weighted.toFixed(1)} weighted`
          : undefined;
        const hasResults =
          winner && (wMode === "raw" ? winner.raw > 0 : winner.weighted > 0);

        return (
          <section
            key={track.id}
            className="rounded-3xl bg-white dark:bg-slate-900 shadow-md p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {track.name}
              </h2>
              <div className="inline-flex items-center gap-2">
                {winnersDiffer && (
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300"
                    title="Raw and weighted scores produced different winners!"
                  >
                    Winners differ ⚡
                  </span>
                )}
                <div
                  role="group"
                  aria-label="Winner scoring method"
                  className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold"
                >
                  <button
                    onClick={() =>
                      setWinnerBy((p) => ({ ...p, [track.id]: "raw" }))
                    }
                    className={
                      wMode === "raw"
                        ? "rounded-full px-3 py-1 bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50"
                        : "rounded-full px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }
                  >
                    Raw winner
                  </button>
                  <button
                    onClick={() =>
                      setWinnerBy((p) => ({ ...p, [track.id]: "weighted" }))
                    }
                    className={
                      wMode === "weighted"
                        ? "rounded-full px-3 py-1 bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-slate-50"
                        : "rounded-full px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }
                  >
                    Weighted winner
                  </button>
                </div>
              </div>
            </div>

            {hasResults ? (
              <WinnerStars
                winnerName={winner.item.name}
                winnerSubtitle={winnerScore}
                runnerUpName={runnerUp?.item.name}
                runnerUpSubtitle={runnerUpScore}
              />
            ) : (
              <p className="text-slate-500 dark:text-slate-400 italic py-4">
                No scores entered yet for this track.
              </p>
            )}

            {hasResults && (
              <BettorsCallout
                trackId={track.id}
                trackName={track.name}
                winnerItemId={winner.item.id}
                winnerItemName={winner.item.name}
                winnerMode={wMode}
                attendees={attendees}
                bets={bets}
                itemById={itemById}
                isOpen={!!openPicks[track.id]}
                onToggle={() =>
                  setOpenPicks((p) => ({ ...p, [track.id]: !p[track.id] }))
                }
              />
            )}

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    <th className="px-3 py-2 sticky left-0 bg-white dark:bg-slate-900 z-10">
                      Item · Presenter
                    </th>
                    {trackSections.map((s) => (
                      <th
                        key={s.id}
                        className="px-2 py-2 text-center min-w-[80px]"
                      >
                        <div>{s.name}</div>
                        <div className="font-medium text-slate-400 dark:text-slate-500 text-[10px] normal-case">
                          w = {s.weight}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center bg-slate-50 dark:bg-slate-800 sticky right-28 z-20 w-20 min-w-[80px] shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                      Raw
                    </th>
                    <th className="px-3 py-2 text-center bg-amber-50 dark:bg-amber-900/40 sticky right-0 z-20 w-28 min-w-[112px]">
                      Weighted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scored.map(({ item, raw, weighted }, idx) => {
                    const presenter = evaluatorById[item.presenterId];
                    const isWinner = idx === 0 && weighted > 0;
                    return (
                      <tr
                        key={item.id}
                        className={
                          isWinner
                            ? "bg-amber-50 dark:bg-amber-950/40 font-semibold"
                            : "border-t border-slate-100 dark:border-slate-800"
                        }
                      >
                        <td className="px-3 py-2 text-slate-800 dark:text-slate-100 sticky left-0 bg-inherit">
                          <span className="font-bold">{item.name}</span>
                          {presenter && (
                            <span
                              className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                backgroundColor: presenter.color,
                                color: contrastText(presenter.color),
                              }}
                            >
                              {presenter.name}
                            </span>
                          )}
                        </td>
                        {trackSections.map((s) => (
                          <td
                            key={s.id}
                            className="px-2 py-2 text-center text-slate-700 dark:text-slate-300"
                          >
                            {getScore(scores, item.id, s.id) || (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-extrabold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 sticky right-28 z-10 w-20 min-w-[80px] shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]">
                          {raw}/{maxRaw}
                        </td>
                        <td className="px-3 py-2 text-center font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 sticky right-0 z-10 w-28 min-w-[112px]">
                          {weighted.toFixed(1)}/{maxWeighted.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Winning Bettors callout ─────────────────────────────────────────

function BettorsCallout({
  trackId,
  trackName,
  winnerItemId,
  winnerItemName,
  winnerMode,
  attendees,
  bets,
  itemById,
  isOpen,
  onToggle,
}: {
  trackId: string;
  trackName: string;
  winnerItemId: string;
  winnerItemName: string;
  winnerMode: "raw" | "weighted";
  attendees: { id: string; name: string; color: string }[];
  bets: Record<string, Record<string, string>>;
  itemById: Record<string, { id: string; name: string }>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const winners = attendees.filter(
    (a) => bets[a.id]?.[trackId] === winnerItemId,
  );
  const total = attendees.filter((a) => bets[a.id]?.[trackId]).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <PartyPopper className="w-5 h-5 text-amber-600 dark:text-amber-300" />
        <span className="font-extrabold text-amber-900 dark:text-amber-200">
          Winning Bettors
        </span>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
          picked <strong>{winnerItemName}</strong> (by {winnerMode})
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {winners.length === 0 ? (
          <span className="text-sm italic text-amber-700/80 dark:text-amber-300/80">
            No one called it. 😅
          </span>
        ) : (
          winners.map((w) => (
            <span
              key={w.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm"
              style={{
                backgroundColor: w.color,
                color: contrastText(w.color),
              }}
            >
              🎉 {w.name}
            </span>
          ))
        )}
      </div>

      {total > 0 && (
        <button
          onClick={onToggle}
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {isOpen ? "Hide" : "Show"} all {trackName} picks ({total})
        </button>
      )}

      {isOpen && (
        <ul className="mt-2 space-y-1">
          {attendees.map((a) => {
            const pick = bets[a.id]?.[trackId];
            if (!pick) return null;
            const correct = pick === winnerItemId;
            const picked = itemById[pick];
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200"
              >
                <span
                  className="inline-block rounded-full px-2 py-0.5 font-extrabold"
                  style={{
                    backgroundColor: a.color,
                    color: contrastText(a.color),
                  }}
                >
                  {a.name}
                </span>
                <span>→</span>
                <span className="font-semibold">{picked?.name ?? "?"}</span>
                <span className={correct ? "text-emerald-600" : "text-red-600"}>
                  {correct ? "✓" : "✗"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
