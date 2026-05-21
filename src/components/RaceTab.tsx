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
  const rawRevealed = useSessionStore((s) => s.rawRevealedByTrack);
  const weightedRevealed = useSessionStore((s) => s.weightedRevealedByTrack);
  const revealNextSection = useSessionStore((s) => s.revealNextSection);
  const revealAllSections = useSessionStore((s) => s.revealAllSections);
  const resetTrack = useSessionStore((s) => s.resetRaceTrack);
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

  const mode = raceMode ?? "raw";
  const revealedByTrack = mode === "raw" ? rawRevealed : weightedRevealed;

  function revealedCountForTrack(trackId: string): number {
    return revealedByTrack[trackId] ?? 0;
  }

  function positionPctForItem(
    item: { id: string; trackId: string },
    track: { sectionIds: string[] },
  ): { pct: number; earned: number; max: number } {
    const n = Math.min(
      revealedCountForTrack(item.trackId),
      track.sectionIds.length,
    );
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

  function currentSectionForTrack(track: {
    id: string;
    sectionIds: string[];
  }) {
    const n = revealedCountForTrack(track.id);
    if (n >= track.sectionIds.length) return null;
    const sid = track.sectionIds[n];
    return {
      sectionIdx: n,
      sectionName: sectionsById[sid]?.name ?? "",
      sectionTotal: track.sectionIds.length,
    };
  }

  const everyoneDone = tracks.every(
    (t) => revealedCountForTrack(t.id) >= t.sectionIds.length,
  );

  // Spacebar reveals the next section of the first track that still has
  // remaining sections (Formatters first, then Linters).
  useShortcut(
    " ",
    () => {
      if (raceMode === null) return;
      for (const t of tracks) {
        const n = revealedCountForTrack(t.id);
        if (n < t.sectionIds.length) {
          revealNextSection(mode, t.id, t.sectionIds.length);
          sfx.reveal();
          return;
        }
      }
    },
    raceMode !== null,
  );

  const handleStart = (m: "raw" | "weighted") => {
    setRaceMode(m);
    resetMode(m);
  };

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
      const track = tracks.find((t) => t.id === item.trackId);
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
          After everyone has presented, reveal sections one at a time. Each
          track has its own controls and runs independently. We do Raw first,
          then Weighted.
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
      {/* Top summary header */}
      <div className="rounded-3xl bg-white dark:bg-slate-800 dark:ring-1 dark:ring-slate-700 shadow-md p-4 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
          🐎 The Race — {mode === "raw" ? "Raw" : "Weighted"} Scores
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Each track has its own controls below.
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          {everyoneDone && mode === "raw" && (
            <button
              onClick={handleSwitchToWeighted}
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-600 to-orange-500 text-white font-bold px-4 py-2 shadow hover:opacity-95 transition"
            >
              <Trophy className="w-4 h-4" />
              Now Weighted Race
            </button>
          )}
          {everyoneDone && mode === "weighted" && (
            <button
              onClick={handleSeeResults}
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-fuchsia-600 to-orange-500 text-white font-bold px-4 py-2 shadow hover:opacity-95 transition"
            >
              <Trophy className="w-4 h-4" />
              See Results
            </button>
          )}
          <button
            onClick={() => {
              if (
                confirm(
                  `Reset all horses in ${mode === "raw" ? "Raw" : "Weighted"} mode back to start?`,
                )
              ) {
                resetMode(mode);
              }
            }}
            className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-semibold inline-flex items-center gap-1"
            title="Reset all horses in current mode"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset mode
          </button>
          <button
            onClick={() => {
              if (confirm("Reset both Raw and Weighted races back to intro?")) {
                resetRace();
              }
            }}
            className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-semibold"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* Per-track section */}
      {tracks.map((track) => {
        const trackItems = items.filter((i) => i.trackId === track.id);
        const current = currentSectionForTrack(track);
        const revealedN = revealedCountForTrack(track.id);
        const trackDone = revealedN >= track.sectionIds.length;

        return (
          <section
            key={track.id}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            {/* Carnival striped header (per track) */}
            <div className="relative">
              <div
                className="absolute inset-0 dark:hidden"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, #dc2626 0 30px, #fbbf24 30px 60px)",
                }}
                aria-hidden
              />
              <div
                className="absolute inset-0 hidden dark:block"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, #7f1d1d 0 30px, #92400e 30px 60px)",
                }}
                aria-hidden
              />
              {/* String lights */}
              <div
                className="absolute top-1 left-0 right-0 h-2 flex justify-around items-center pointer-events-none"
                aria-hidden
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{
                      backgroundColor: [
                        "#fef08a",
                        "#fca5a5",
                        "#bbf7d0",
                        "#bfdbfe",
                      ][i % 4],
                      animationDelay: `${(i * 100) % 1200}ms`,
                      boxShadow: "0 0 6px currentColor",
                    }}
                  />
                ))}
              </div>
              <div className="relative bg-black/45 dark:bg-black/65 text-white p-4 pt-5 flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold drop-shadow">
                    🎪 {track.name}
                  </h3>
                  {current ? (
                    <p className="text-sm opacity-95 mt-0.5">
                      <span className="opacity-80">
                        Section {current.sectionIdx + 1} of{" "}
                        {current.sectionTotal} ·{" "}
                      </span>
                      <strong className="text-amber-200">
                        {current.sectionName}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-sm opacity-95 mt-0.5">
                      All {track.sectionIds.length} sections revealed.
                    </p>
                  )}
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  {!trackDone && (
                    <>
                      <button
                        onClick={() => {
                          revealNextSection(
                            mode,
                            track.id,
                            track.sectionIds.length,
                          );
                          sfx.reveal();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-4 py-2 shadow-md hover:scale-105 transition"
                        title={`Reveal next section for ${track.name}`}
                      >
                        💦 Reveal next
                      </button>
                      <button
                        onClick={() => {
                          revealAllSections(
                            mode,
                            track.id,
                            track.sectionIds.length,
                          );
                          sfx.swoosh();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold px-3 py-2 text-sm"
                      >
                        Reveal all
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (
                        confirm(`Reset ${track.name} horses back to start?`)
                      ) {
                        resetTrack(mode, track.id);
                      }
                    }}
                    className="rounded-full bg-white/20 hover:bg-white/30 text-white p-2"
                    aria-label={`Reset ${track.name}`}
                    title={`Reset ${track.name}`}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lanes */}
            <div className="bg-white dark:bg-slate-800 p-5 dark:ring-1 dark:ring-slate-700">
              <div className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {revealedN}/{track.sectionIds.length} sections revealed
              </div>
              <div className="space-y-3">
                {trackItems.map((item) => {
                  const presenter = evaluatorById[item.presenterId];
                  const { pct, earned, max } = positionPctForItem(item, track);
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
