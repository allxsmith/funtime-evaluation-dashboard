import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw, Trophy } from "lucide-react";
import {
  useEvaluationStore,
  useSessionStore,
} from "../store/evaluationStore";
import { HorseTrack } from "./HorseTrack";
import {
  getScore,
  rawMax,
  trackSubSectionIds,
  weightedMax,
} from "../utils/scoring";
import { sfx } from "../utils/sounds";
import { bigCelebrate } from "../utils/confetti";
import { useShortcut } from "../utils/useShortcut";

export function RaceTab() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const sections = useEvaluationStore((s) => s.sections);
  const subSections = useEvaluationStore((s) => s.subSections);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const scores = useEvaluationStore((s) => s.scores);
  const autoPlayIntervalSeconds = useEvaluationStore(
    (s) => s.config.autoPlayIntervalSeconds,
  );
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
  const subSectionsById = useMemo(
    () => Object.fromEntries(subSections.map((s) => [s.id, s])),
    [subSections],
  );
  // Flat, ordered sub-section IDs per track — the race reveals these one at a time.
  const subIdsByTrack = useMemo(
    () =>
      Object.fromEntries(
        tracks.map((t) => [t.id, trackSubSectionIds(t, sectionsById)]),
      ),
    [tracks, sectionsById],
  );
  const sectionIdBySubId = useMemo(
    () =>
      Object.fromEntries(
        sections.flatMap((sec) =>
          sec.subSectionIds.map((id) => [id, sec.id]),
        ),
      ),
    [sections],
  );
  const evaluatorById = useMemo(
    () => Object.fromEntries(evaluators.map((e) => [e.id, e])),
    [evaluators],
  );

  const mode = raceMode ?? "raw";
  const revealedByTrack = mode === "raw" ? rawRevealed : weightedRevealed;

  // Per-track auto-play. Component-local so it resets when leaving the tab.
  const [autoByTrack, setAutoByTrack] = useState<Record<string, boolean>>({});

  // Reset auto-play when switching between raw and weighted modes.
  useEffect(() => {
    setAutoByTrack({});
  }, [mode]);

  // Spawn one setInterval per track with auto-play enabled. Auto-stops when
  // the track is fully revealed.
  useEffect(() => {
    const timers: number[] = [];
    for (const t of tracks) {
      if (!autoByTrack[t.id]) continue;
      const subs = subIdsByTrack[t.id] ?? [];
      const total = subs.length;
      const revealed = revealedByTrack[t.id] ?? 0;
      if (revealed >= total) {
        setAutoByTrack((p) => ({ ...p, [t.id]: false }));
        continue;
      }
      const id = window.setInterval(() => {
        revealNextSection(mode, t.id, total);
        sfx.reveal();
      }, Math.max(1, autoPlayIntervalSeconds) * 1000);
      timers.push(id);
    }
    return () => {
      for (const id of timers) window.clearInterval(id);
    };
  }, [
    autoByTrack,
    mode,
    revealedByTrack,
    subIdsByTrack,
    tracks,
    autoPlayIntervalSeconds,
    revealNextSection,
  ]);

  function revealedCountForTrack(trackId: string): number {
    return revealedByTrack[trackId] ?? 0;
  }

  function positionPctForItem(item: {
    id: string;
    trackId: string;
  }): { pct: number; earned: number; max: number } {
    const subIds = subIdsByTrack[item.trackId] ?? [];
    const n = Math.min(revealedCountForTrack(item.trackId), subIds.length);
    let earned = 0;
    for (let i = 0; i < n; i++) {
      const id = subIds[i];
      const score = getScore(scores, item.id, id);
      earned +=
        mode === "raw" ? score : score * (subSectionsById[id]?.weight ?? 1);
    }
    const max =
      mode === "raw"
        ? rawMax(subIds, subSectionsById)
        : weightedMax(subIds, subSectionsById);
    return { pct: max === 0 ? 0 : (earned / max) * 100, earned, max };
  }

  function currentSectionForTrack(track: { id: string }) {
    const subIds = subIdsByTrack[track.id] ?? [];
    const n = revealedCountForTrack(track.id);
    if (n >= subIds.length) return null;
    const subId = subIds[n];
    const parentId = sectionIdBySubId[subId];
    return {
      sectionIdx: n,
      subSectionName: subSectionsById[subId]?.name ?? "",
      parentName: parentId ? (sectionsById[parentId]?.name ?? "") : "",
      sectionTotal: subIds.length,
    };
  }

  const everyoneDone = tracks.every(
    (t) => revealedCountForTrack(t.id) >= (subIdsByTrack[t.id]?.length ?? 0),
  );

  // Spacebar reveals the next sub-section of the first track that still has
  // remaining sub-sections (Formatters first, then Linters).
  useShortcut(
    " ",
    () => {
      if (raceMode === null) return;
      for (const t of tracks) {
        const total = subIdsByTrack[t.id]?.length ?? 0;
        const n = revealedCountForTrack(t.id);
        if (n < total) {
          revealNextSection(mode, t.id, total);
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
            Start Race
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
        const subIds = subIdsByTrack[track.id] ?? [];
        const current = currentSectionForTrack(track);
        const revealedN = revealedCountForTrack(track.id);
        const trackDone = revealedN >= subIds.length;

        return (
          <section
            key={track.id}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            {/* Carnival header (per track) — solid gradient */}
            <div className="relative bg-linear-to-r from-red-700 via-red-600 to-red-700 dark:from-red-950 dark:via-red-900 dark:to-red-950">
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
              <div className="relative text-white p-4 pt-5 flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold drop-shadow">
                    🎪 {track.name}
                  </h3>
                  {current ? (
                    <p className="text-sm opacity-95 mt-0.5">
                      <span className="opacity-80">
                        {current.sectionIdx + 1} of {current.sectionTotal}
                        {current.parentName
                          ? ` · ${current.parentName}`
                          : ""}{" "}
                        ·{" "}
                      </span>
                      <strong className="text-amber-200">
                        {current.subSectionName}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-sm opacity-95 mt-0.5">
                      All {subIds.length} sub-sections revealed.
                    </p>
                  )}
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  {!trackDone && (
                    <>
                      <button
                        onClick={() => {
                          revealNextSection(mode, track.id, subIds.length);
                          sfx.reveal();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-4 py-2 shadow-md hover:scale-105 transition"
                        title={`Reveal next sub-section for ${track.name}`}
                      >
                        💦 Reveal next
                      </button>
                      <button
                        onClick={() =>
                          setAutoByTrack((p) => ({
                            ...p,
                            [track.id]: !p[track.id],
                          }))
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold px-3 py-2 text-sm"
                        title={
                          autoByTrack[track.id]
                            ? `Pause auto-play for ${track.name}`
                            : `Auto-play ${track.name} every ${autoPlayIntervalSeconds}s`
                        }
                      >
                        {autoByTrack[track.id] ? (
                          <>
                            <Pause className="w-4 h-4" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" /> Auto play
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          revealAllSections(mode, track.id, subIds.length);
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
                {revealedN}/{subIds.length} sub-sections revealed
              </div>
              <div className="space-y-3">
                {(() => {
                  // Precompute every horse's position so we can find the
                  // current leader and slide the finish line there.
                  const rows = trackItems.map((item) => ({
                    item,
                    ...positionPctForItem(item),
                  }));
                  const leaderPct = rows.reduce(
                    (mx, r) => (r.pct > mx ? r.pct : mx),
                    0,
                  );
                  return rows.map(({ item, pct, earned, max }) => {
                    const presenter = evaluatorById[item.presenterId];
                    return (
                      <HorseTrack
                        key={item.id}
                        itemName={item.name}
                        presenterName={presenter?.name ?? ""}
                        presenterColor={presenter?.color ?? "#94a3b8"}
                        positionPct={pct}
                        finishLinePct={revealedN > 0 ? leaderPct : undefined}
                        scoreLabel={
                          revealedN > 0
                            ? mode === "raw"
                              ? `${earned}/${max}`
                              : `${earned.toFixed(1)}/${max.toFixed(1)}`
                            : undefined
                        }
                      />
                    );
                  });
                })()}
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
