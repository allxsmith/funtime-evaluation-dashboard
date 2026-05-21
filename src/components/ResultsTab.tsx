import { useEffect, useMemo } from "react";
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

  const sectionsById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  );
  const evaluatorById = useMemo(
    () => Object.fromEntries(evaluators.map((e) => [e.id, e])),
    [evaluators],
  );

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
        const scored = trackItems
          .map((item) => ({
            item,
            raw: rawTotal(scores, item, track.sectionIds),
            weighted: weightedTotal(
              scores,
              item,
              track.sectionIds,
              sectionsById,
            ),
          }))
          .sort((a, b) => b.weighted - a.weighted);
        const winner = scored[0];
        const runnerUp = scored[1];
        const maxRaw = rawMax(track.sectionIds);
        const maxWeighted = weightedMax(track.sectionIds, sectionsById);

        return (
          <section
            key={track.id}
            className="rounded-3xl bg-white shadow-md p-5 sm:p-6"
          >
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
              {track.name}
            </h2>

            {winner && winner.weighted > 0 ? (
              <WinnerStars
                winnerName={winner.item.name}
                winnerSubtitle={`${winner.weighted.toFixed(1)} / ${maxWeighted.toFixed(1)} weighted`}
                runnerUpName={runnerUp?.item.name}
                runnerUpSubtitle={
                  runnerUp
                    ? `${runnerUp.weighted.toFixed(1)} weighted`
                    : undefined
                }
              />
            ) : (
              <p className="text-slate-500 italic py-4">
                No scores entered yet for this track.
              </p>
            )}

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase text-slate-500">
                    <th className="px-3 py-2 sticky left-0 bg-white z-10">
                      Item · Presenter
                    </th>
                    {trackSections.map((s) => (
                      <th
                        key={s.id}
                        className="px-2 py-2 text-center min-w-[80px]"
                      >
                        <div>{s.name}</div>
                        <div className="font-medium text-slate-400 text-[10px] normal-case">
                          w = {s.weight}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center bg-slate-50">Raw</th>
                    <th className="px-3 py-2 text-center bg-amber-50">
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
                            ? "bg-amber-50 font-semibold"
                            : "border-t border-slate-100"
                        }
                      >
                        <td className="px-3 py-2 text-slate-800 sticky left-0 bg-inherit">
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
                            className="px-2 py-2 text-center text-slate-700"
                          >
                            {getScore(scores, item.id, s.id) || (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-extrabold text-slate-700 bg-slate-50">
                          {raw}/{maxRaw}
                        </td>
                        <td className="px-3 py-2 text-center font-extrabold text-amber-700 bg-amber-50">
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
