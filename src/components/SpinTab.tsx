import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Trophy } from "lucide-react";
import { useEvaluationStore, useSessionStore } from "../store/evaluationStore";
import { Wheel } from "./Wheel";
import { PresenterCard } from "./PresenterCard";
import { celebrate } from "../utils/confetti";
import { useShortcut } from "../utils/useShortcut";

export function SpinTab() {
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const presentedIds = useSessionStore((s) => s.presentedEvaluatorIds);
  const currentPresenterId = useSessionStore((s) => s.currentPresenterId);
  const setCurrent = useSessionStore((s) => s.setCurrentPresenter);
  const markPresented = useSessionStore((s) => s.markPresented);
  const resetSpin = useSessionStore((s) => s.resetSpinSession);
  const setActiveTab = useSessionStore((s) => s.setActiveTab);

  const [spinning, setSpinning] = useState(false);
  const spinButtonRef = useRef<HTMLButtonElement | null>(null);

  useShortcut(
    " ",
    () => {
      if (currentPresenterId || spinning) return;
      spinButtonRef.current?.click();
    },
    !currentPresenterId,
  );

  const presentedSet = new Set(presentedIds);
  const remaining = evaluators.filter(
    (e) => !presentedSet.has(e.id) && e.id !== currentPresenterId,
  );
  const wheelSlices = (currentPresenterId
    ? evaluators.filter((e) => e.id === currentPresenterId)
    : remaining
  ).map((e) => ({ id: e.id, label: e.name, color: e.color }));

  const allDone =
    !currentPresenterId && remaining.length === 0 && evaluators.length > 0;

  const handleSpinEnd = (id: string) => {
    setSpinning(false);
    setCurrent(id);
    celebrate();
  };

  const handleDone = () => {
    if (currentPresenterId) markPresented(currentPresenterId);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-slate-800">
          {currentPresenterId
            ? "Presenter Spotlight"
            : allDone
              ? "All evaluators have presented!"
              : "Spin to pick the next presenter"}
        </h2>
        <p className="text-slate-500 mt-1">
          {presentedIds.length} of {evaluators.length} presented
        </p>
      </div>

      {!currentPresenterId && !allDone && (
        <Wheel
          slices={wheelSlices}
          spinning={spinning}
          onSpinStart={() => setSpinning(true)}
          onSpinEnd={handleSpinEnd}
          spinButtonRef={spinButtonRef}
        />
      )}

      {currentPresenterId && (
        <div className="max-w-3xl mx-auto">
          <PresenterCard
            presenterId={currentPresenterId}
            onDone={handleDone}
          />
        </div>
      )}

      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto text-center rounded-3xl bg-white shadow-xl p-8"
        >
          <Trophy className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <p className="text-slate-700 font-semibold mb-5">
            Time to score them in the carnival race.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setActiveTab("race")}
              className="rounded-full bg-linear-to-r from-fuchsia-600 to-orange-500 text-white font-bold px-5 py-2.5 shadow-md hover:opacity-95 transition"
            >
              Go to Race
            </button>
            <button
              onClick={resetSpin}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </motion.div>
      )}

      {presentedIds.length > 0 && !allDone && (
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Presented
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {presentedIds.map((id) => {
              const ev = evaluators.find((e) => e.id === id);
              if (!ev) return null;
              return (
                <span
                  key={id}
                  className="rounded-full px-3 py-1 text-xs font-bold opacity-60"
                  style={{
                    backgroundColor: ev.color,
                    color: "#fff",
                  }}
                >
                  ✓ {ev.name}
                </span>
              );
            })}
            <button
              onClick={resetSpin}
              className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Reset all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
