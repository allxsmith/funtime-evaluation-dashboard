import { useMemo } from "react";
import { Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import {
  useEvaluationStore,
  useSessionStore,
} from "../store/evaluationStore";
import { HorseTrack } from "./HorseTrack";
import { getScore, rawMax, weightedMax } from "../utils/scoring";
import { sfx } from "../utils/sounds";
import { bigCelebrate } from "../utils/confetti";
import { useShortcut } from "../utils/useShortcut";

export function RaceTab() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const sections = useEvaluationStore((s) => s.sections);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const scores = useEvaluationStore((s) => s.scores);
  const setScore = useEvaluationStore((s) => s.setScore);
  const raceMode = useSessionStore((s) => s.raceMode);
  const setRaceMode = useSessionStore((s) => s.setRaceMode);
  const rawRevealedIdx = useSessionStore((s) => s.rawRevealedSectionIndex);
  const weightedRevealedIdx = useSessionStore(
    (s) => s.weightedRevealedSectionIndex,
  );
  const revealNextSection = useSessionStore((s) => s.revealNextSection);
  const revealAllSections = useSessionStore((s) => s.revealAllSections);
  const resetMode = useSessionStore((s) => s.resetRaceMode);
  const resetRace = useSessionStore((s) => s.resetRace);
  const setActiveTab = useSessionStore((s) => s.setActiveTab);

  const sectionsById = useMemo(
    () => Object.fromEntries(sections.map((s) => [s.id, s])),
    [sections],
  );
  const evaluatorById = useMemo(
    () => Object.fromEntries(evaluators.map((e) => [e.id, e])),
    [evaluators],
  );
  const trackById = useMemo(
    () => Object.fromEntries(tracks.map((t) => [t.id, t])),
    [tracks],
  );

  const mode = raceMode ?? "raw";
  const revealedIdx = mode === "raw" ? rawRevealedIdx : weightedRevealedIdx;

  const trackOrder = tracks;
  const sectionCountByTrack = trackOrder.map((t) => t.sectionIds.length);
  const totalSteps = sectionCountByTrack.reduce((a, b) => a + b, 0);
  const allRevealed = revealedIdx >= totalSteps;

  function revealedCountForTrack(trackIdx: number): number {
    let priorSum = 0;
    for (let i = 0; i < trackIdx; i++) priorSum += sectionCountByTrack[i];
    const within = revealedIdx - priorSum;
    return Math.max(0, Math.min(within, sectionCountByTrack[trackIdx]));
  }

  function positionPct(itemId: string): {
    pct: number;
    earned: number;
    max: number;
  } {
    const item = items.find((i) => i.id === itemId);
    if (!item) return { pct: 0, earned: 0, max: 0 };
    const track = trackById[item.trackId];
    if (!track) return { pct: 0, earned: 0, max: 0 };
    const trackIdx = trackOrder.findIndex((t) => t.id === track.id);
    const n = revealedCountForTrack(trackIdx);
    let earned = 0;
    for (let i = 0; i < n; i++) {
      const sid = track.sectionIds[i];
      const score = getScore(scores, item.id, sid);
      earned +=
        mode === "raw" ? score : score * (sectionsById[sid]?.weight ?? 1);
    }
    const max =
      mode === "raw"
        ? rawMax(track.sectionIds)
        : weightedMax(track.sectionIds, sectionsById);
    return { pct: max === 0 ? 0 : (earned / max) * 100, earned, max };
  }

  function currentSectionInfo() {
    if (allRevealed) return null;
    let priorSum = 0;
    for (let ti = 0; ti < trackOrder.length; ti++) {
      const within = revealedIdx - priorSum;
      if (within < sectionCountByTrack[ti]) {
        const sectionId = trackOrder[ti].sectionIds[within];
        return {
          trackIdx: ti,
          trackName: trackOrder[ti].name,
          sectionIdx: within,
          sectionName: sectionsById[sectionId]?.name ?? "",
          sectionTotalInTrack: sectionCountByTrack[ti],
        };
      }
      priorSum += sectionCountByTrack[ti];
    }
    return null;
  }
  const current = currentSectionInfo();

  const handleStart = (m: "raw" | "weighted") => {
    setRaceMode(m);
    resetMode(m);
  };

  const handleRevealNext = () => {
    revealNextSection(mode, totalSteps);
    sfx.reveal();
  };

  const handleRevealAll = () => {
    revealAllSections(mode, totalSteps);
    sfx.swoosh();
  };

  useShortcut(
    " ",
    () => {
      if (raceMode === null || allRevealed) return;
      handleRevealNext();
    },
    raceMode !== null,
  );

  const handleSwitchToWeighted = () => {
    setRaceMode("weighted");
    resetMode("weighted");
    sfx.fanfare();
  };

  const handleSeeResults = () => {
    bigCelebrate();
    setActiveTab("results");
  };

  const handleRandomFill = () => {
    for (const item of items) {
      const track = trackById[item.trackId];
      if (!track) continue;
      for (const sid of track.sectionIds) {
        setScore(item.id, sid, 1 + Math.floor(Math.random() * 5));
      }
    }
  };

  // ── Intro screen ──────────────────────────────────────────────
  if (raceMode === null) {
    return (
      <div className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-slate-900 shadow-xl p-8 text-center">
        <div className="text-6xl mb-3" aria-hidden>
          🐎
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          The Race
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          After everyone has presented, reveal sections one at a time. All
          horses for the current category advance based on their scores. We run
          Raw first, then Weighted.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => handleStart("raw")}
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-600 to-orange-500 text-white font-bold px-6 py-3 shadow-md hover:opacity-95 transition"
          >
            <Play className="w-4 h-4" />
            Start Raw Race
          </button>
          <button
            onClick={handleRandomFill}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-3"
          >
            <Sparkles className="w-4 h-4" />
            Demo: Fill random scores
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Race header */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #dc2626 0 30px, #fbbf24 30px 60px)",
          }}
          aria-hidden
        />
        {/* String-lights decoration */}
        <div
          className="absolute top-1 left-0 right-0 h-2 flex justify-around items-center pointer-events-none"
          aria-hidden
        >
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: ["#fef08a", "#fca5a5", "#bbf7d0", "#bfdbfe"][
                  i % 4
                ],
                animationDelay: `${(i * 100) % 1200}ms`,
                boxShadow: "0 0 6px currentColor",
              }}
            />
          ))}
        </div>
        <div className="relative bg-black/45 text-white p-5 pt-6 flex flex-wrap items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold drop-shadow">
              🐎 The Race — {mode === "raw" ? "Raw" : "Weighted"} Scores
            </h2>
            {current ? (
              <p className="text-sm sm:text-base opacity-95 mt-0.5">
                <span className="font-bold">{current.trackName}</span>
                <span className="opacity-80">
                  {" "}
                  · Section {current.sectionIdx + 1} of{" "}
                  {current.sectionTotalInTrack} ·{" "}
                </span>
                <strong className="text-amber-200">
                  {current.sectionName}
                </strong>
              </p>
            ) : mode === "raw" ? (
              <p className="text-sm opacity-95 mt-0.5">
                All sections revealed — ready for the weighted run.
              </p>
            ) : (
              <p className="text-sm opacity-95 mt-0.5">
                All scoring complete — head to Results.
              </p>
            )}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {!allRevealed && (
              <>
                <button
                  onClick={handleRevealNext}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
                  title="Space"
                >
                  💦 Reveal next section
                </button>
                <button
                  onClick={handleRevealAll}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5"
                  title="Skip ahead"
                >
                  Reveal all
                </button>
              </>
            )}
            {allRevealed && mode === "raw" && (
              <button
                onClick={handleSwitchToWeighted}
                className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
              >
                <Trophy className="w-4 h-4" />
                Now Weighted Race
              </button>
            )}
            {allRevealed && mode === "weighted" && (
              <button
                onClick={handleSeeResults}
                className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
              >
                <Trophy className="w-4 h-4" />
                See Results
              </button>
            )}
            <button
              onClick={() => {
                if (
                  confirm(
                    `Reset the ${mode === "raw" ? "Raw" : "Weighted"} race? Horses go back to start.`,
                  )
                ) {
                  resetMode(mode);
                }
              }}
              className="rounded-full bg-white/20 hover:bg-white/30 text-white p-2.5"
              aria-label="Reset current mode"
              title="Reset this mode"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Reset both Raw and Weighted races back to the intro?",
                  )
                ) {
                  resetRace();
                }
              }}
              className="rounded-full bg-white/20 hover:bg-white/30 text-white px-3 py-2.5 text-xs font-semibold"
              aria-label="Reset all"
              title="Reset all"
            >
              Reset all
            </button>
          </div>
        </div>
      </div>

      {/* Lanes */}
      {tracks.map((track, ti) => {
        const trackItems = items.filter((i) => i.trackId === track.id);
        return (
          <section
            key={track.id}
            className="rounded-3xl bg-white dark:bg-slate-900 shadow-md p-5"
          >
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
              {track.name}
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                ({revealedCountForTrack(ti)}/{sectionCountByTrack[ti]} sections
                revealed)
              </span>
            </h3>
            <div className="space-y-3">
              {trackItems.map((item) => {
                const presenter = evaluatorById[item.presenterId];
                const { pct, earned, max } = positionPct(item.id);
                const revealedN = revealedCountForTrack(ti);
                return (
                  <HorseTrack
                    key={item.id}
                    itemName={item.name}
                    presenterName={presenter?.name ?? ""}
                    presenterColor={presenter?.color ?? "#94a3b8"}
                    positionPct={pct}
                    scoreLabel={
                      revealedN > 0
                        ? mode === "raw"
                          ? `${earned}/${max}`
                          : `${earned.toFixed(1)}/${max.toFixed(1)}`
                        : undefined
                    }
                  />
                );
              })}
              {trackItems.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 italic">
                  No items in this track.
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
