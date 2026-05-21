import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Play, RotateCcw, Sparkles, Trophy } from "lucide-react";
import {
  useEvaluationStore,
  useSessionStore,
} from "../store/evaluationStore";
import { HorseTrack } from "./HorseTrack";
import {
  getScore,
  rawMax,
  weightedMax,
} from "../utils/scoring";
import { sfx } from "../utils/sounds";
import { contrastText } from "../utils/colors";
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
  const rawRevealed = useSessionStore((s) => s.rawRevealedByItem);
  const weightedRevealed = useSessionStore((s) => s.weightedRevealedByItem);
  const revealNext = useSessionStore((s) => s.revealNextForPresenter);
  const revealAll = useSessionStore((s) => s.revealAllForPresenter);
  const resetMode = useSessionStore((s) => s.resetRaceMode);
  const resetRace = useSessionStore((s) => s.resetRace);
  const currentPresenterId = useSessionStore((s) => s.currentPresenterId);
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
  const revealedByItem = mode === "raw" ? rawRevealed : weightedRevealed;
  const otherRevealedByItem = mode === "raw" ? weightedRevealed : rawRevealed;

  const itemMaxSections = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return 0;
    return trackById[item.trackId]?.sectionIds.length ?? 0;
  };

  const presenterItems = (presenterId: string) =>
    items.filter((i) => i.presenterId === presenterId);

  const presenterRevealStatus = (presenterId: string) => {
    const pItems = presenterItems(presenterId);
    if (pItems.length === 0) return { total: 0, done: 0, allDone: true };
    let total = 0;
    let done = 0;
    for (const item of pItems) {
      const max = itemMaxSections(item.id);
      total += max;
      done += Math.min(revealedByItem[item.id] ?? 0, max);
    }
    return { total, done, allDone: done >= total && total > 0 };
  };

  const positionPct = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return { pct: 0, earned: 0, max: 0 };
    const track = trackById[item.trackId];
    if (!track) return { pct: 0, earned: 0, max: 0 };
    const n = Math.min(
      revealedByItem[item.id] ?? 0,
      track.sectionIds.length,
    );
    let earned = 0;
    for (let i = 0; i < n; i++) {
      const sid = track.sectionIds[i];
      const score = getScore(scores, item.id, sid);
      earned += mode === "raw"
        ? score
        : score * (sectionsById[sid]?.weight ?? 1);
    }
    const max =
      mode === "raw"
        ? rawMax(track.sectionIds)
        : weightedMax(track.sectionIds, sectionsById);
    return { pct: max === 0 ? 0 : (earned / max) * 100, earned, max };
  };

  const allPresenterIdsWithItems = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.presenterId);
    return evaluators.filter((e) => set.has(e.id)).map((e) => e.id);
  }, [items, evaluators]);

  const everyoneDone = allPresenterIdsWithItems.every(
    (pid) => presenterRevealStatus(pid).allDone,
  );

  const active = currentPresenterId
    ? evaluatorById[currentPresenterId]
    : null;
  const activeStatus = active ? presenterRevealStatus(active.id) : null;
  const activeItems = active ? presenterItems(active.id) : [];

  const handleStart = (m: "raw" | "weighted") => {
    setRaceMode(m);
    resetMode(m);
  };

  const handleRevealNext = () => {
    if (!active) return;
    const arr = activeItems.map((it) => ({
      id: it.id,
      max: itemMaxSections(it.id),
    }));
    revealNext(mode, arr);
    sfx.reveal();
  };

  useShortcut(
    " ",
    () => {
      if (raceMode === null) return;
      if (active && !activeStatus?.allDone) handleRevealNext();
    },
    raceMode !== null,
  );

  const handleRevealAllActive = () => {
    if (!active) return;
    const arr = activeItems.map((it) => ({
      id: it.id,
      max: itemMaxSections(it.id),
    }));
    revealAll(mode, arr);
    sfx.swoosh();
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
          🎪
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          Ready to Race
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          After each presenter finishes their pitch, come back here and reveal
          their sections one at a time. Their horse(s) will advance based on
          their scores.
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
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold px-4 py-3"
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
      {/* Carnival header */}
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
              🎪 Carnival Race —{" "}
              {mode === "raw" ? "Raw" : "Weighted"} Scores
            </h2>
            {active ? (
              <p className="text-sm opacity-95">
                Now revealing for{" "}
                <strong style={{ color: active.color }}>{active.name}</strong>
                {activeStatus && (
                  <>
                    {" "}
                    · {activeStatus.done}/{activeStatus.total} sections
                  </>
                )}
              </p>
            ) : (
              <p className="text-sm opacity-95">
                Pick a presenter on the <strong>Spin</strong> tab to start
                revealing scores.
              </p>
            )}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {active && !activeStatus?.allDone && (
              <>
                <button
                  onClick={handleRevealNext}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
                  title="Space"
                >
                  💦 Reveal next section
                </button>
                <button
                  onClick={handleRevealAllActive}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-2.5"
                >
                  Reveal all
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            {active && activeStatus?.allDone && (
              <button
                onClick={() => setActiveTab("spin")}
                className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
              >
                Done — Back to Spin
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {!active && everyoneDone && mode === "raw" && (
              <button
                onClick={handleSwitchToWeighted}
                className="inline-flex items-center gap-2 rounded-full bg-white text-pink-700 font-bold px-5 py-2.5 shadow-md hover:scale-105 transition"
              >
                <Trophy className="w-4 h-4" />
                Now Weighted Race
              </button>
            )}
            {!active && everyoneDone && mode === "weighted" && (
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
          </div>
        </div>
      </div>

      {/* Presenter status row */}
      <div className="flex flex-wrap gap-2">
        {allPresenterIdsWithItems.map((pid) => {
          const ev = evaluatorById[pid];
          if (!ev) return null;
          const status = presenterRevealStatus(pid);
          const isActive = currentPresenterId === pid;
          const otherStatus = (() => {
            // status using the OTHER mode's reveal map
            const items_ = presenterItems(pid);
            let t = 0;
            let d = 0;
            for (const item of items_) {
              const max = itemMaxSections(item.id);
              t += max;
              d += Math.min(otherRevealedByItem[item.id] ?? 0, max);
            }
            return { done: d, total: t };
          })();
          return (
            <span
              key={pid}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border-2 transition ${
                isActive
                  ? "ring-2 ring-offset-2 ring-fuchsia-500"
                  : "border-transparent"
              }`}
              style={{
                backgroundColor: status.allDone
                  ? ev.color
                  : `${ev.color}26`,
                color: status.allDone ? contrastText(ev.color) : ev.color,
                borderColor: isActive ? ev.color : "transparent",
              }}
              title={`Other mode: ${otherStatus.done}/${otherStatus.total} revealed`}
            >
              {status.allDone ? "✓" : "•"} {ev.name}
              <span className="opacity-80">
                {status.done}/{status.total}
              </span>
            </span>
          );
        })}
      </div>

      {/* Lanes */}
      {tracks.map((track) => {
        const trackItems = items.filter((i) => i.trackId === track.id);
        return (
          <section
            key={track.id}
            className="rounded-3xl bg-white dark:bg-slate-900 shadow-md p-5"
          >
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
              {track.name}
            </h3>
            <div className="space-y-2.5">
              {trackItems.map((item) => {
                const presenter = evaluatorById[item.presenterId];
                const { pct, earned, max } = positionPct(item.id);
                const isOnActive =
                  currentPresenterId && item.presenterId === currentPresenterId;
                const revealedN = revealedByItem[item.id] ?? 0;
                return (
                  <motion.div
                    key={item.id}
                    animate={
                      isOnActive
                        ? { boxShadow: "0 0 0 3px rgba(217, 70, 239, 0.45)" }
                        : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
                    }
                    className="rounded-xl"
                  >
                    <HorseTrack
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
                  </motion.div>
                );
              })}
              {trackItems.length === 0 && (
                <p className="text-slate-400 dark:text-slate-500 italic">No items in this track.</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
