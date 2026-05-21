import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Sparkles, X } from "lucide-react";
import { useEvaluationStore } from "../store/evaluationStore";
import { contrastText } from "../utils/colors";
import { sfx } from "../utils/sounds";
import type { Attendee, ID, Track } from "../types";

// Drag id encoding helpers
const CHIP_PREFIX = "chip:"; // chip:<trackId>:<attendeeId>
const ITEM_PREFIX = "item:"; // item:<itemId>
const POOL_PREFIX = "pool:"; // pool:<trackId>

function parseChip(id: string) {
  if (!id.startsWith(CHIP_PREFIX)) return null;
  const [trackId, attendeeId] = id.slice(CHIP_PREFIX.length).split("::");
  return { trackId, attendeeId };
}

function indexToLetters(idx: number): string {
  let n = idx;
  let out = "";
  do {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return out;
}

export function TheFieldTab() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const attendees = useEvaluationStore((s) => s.attendees);
  const bets = useEvaluationStore((s) => s.bets);
  const placeBet = useEvaluationStore((s) => s.placeBet);
  const clearBet = useEvaluationStore((s) => s.clearBet);
  const itemsForTrack = useEvaluationStore((s) => s.items);

  const evaluatorById = useMemo(
    () => Object.fromEntries(evaluators.map((e) => [e.id, e])),
    [evaluators],
  );
  const itemById = useMemo(
    () => Object.fromEntries(itemsForTrack.map((i) => [i.id, i])),
    [itemsForTrack],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  // For each (attendee, track) -> itemId picked, or undefined
  const pickFor = (attendeeId: ID, trackId: ID): ID | undefined =>
    bets[attendeeId]?.[trackId];

  // For each track, attendees with no pick yet (the available pool)
  const poolFor = (trackId: ID): Attendee[] =>
    attendees.filter((a) => !pickFor(a.id, trackId));

  // For each item, list of attendees that picked it
  const backersOf = (itemId: ID, trackId: ID): Attendee[] =>
    attendees.filter((a) => pickFor(a.id, trackId) === itemId);

  const handleDragEnd = (e: DragEndEvent) => {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    const chip = parseChip(activeId);
    if (!chip) return;
    const { trackId: srcTrack, attendeeId } = chip;

    if (!overId) return;

    if (overId.startsWith(ITEM_PREFIX)) {
      const itemId = overId.slice(ITEM_PREFIX.length);
      const item = itemById[itemId];
      if (!item || item.trackId !== srcTrack) return; // ignore cross-track drops
      placeBet(attendeeId, srcTrack, itemId);
      sfx.click();
    } else if (overId.startsWith(POOL_PREFIX)) {
      const poolTrack = overId.slice(POOL_PREFIX.length);
      if (poolTrack === srcTrack) {
        clearBet(attendeeId, srcTrack);
        sfx.click();
      }
    }
  };

  if (attendees.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-md p-10 text-center text-slate-500 dark:text-slate-400">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-amber-500" />
        <p className="text-lg font-semibold">
          No attendees yet. Add some in Settings → Attendees.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-10">
        {tracks.map((track) => {
          const trackItems = items.filter((i) => i.trackId === track.id);
          const pool = poolFor(track.id);
          return (
            <section key={track.id}>
              <div className="flex flex-wrap items-baseline gap-3 mb-3">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                  {track.name}
                </h2>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Drag a name onto a card to place your pick
                </span>
              </div>

              <PoolDropZone trackId={track.id}>
                {pool.length === 0 ? (
                  <span className="text-xs italic text-slate-400 dark:text-slate-500 px-2 py-1">
                    Everyone has placed their pick for this track.
                  </span>
                ) : (
                  pool.map((att) => (
                    <DraggableChip
                      key={att.id}
                      trackId={track.id}
                      attendee={att}
                    />
                  ))
                )}
              </PoolDropZone>

              <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {trackItems.map((item, idx) => (
                  <ItemCard
                    key={item.id}
                    track={track}
                    item={item}
                    idx={idx}
                    presenter={evaluatorById[item.presenterId]}
                    backers={backersOf(item.id, track.id)}
                    onClearBet={(aid) => clearBet(aid, track.id)}
                  />
                ))}
                {trackItems.length === 0 && (
                  <p className="text-slate-400 dark:text-slate-500 italic">
                    No items yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </DndContext>
  );
}

// ── Pool drop zone (per track) ───────────────────────────────────────

function PoolDropZone({
  trackId,
  children,
}: {
  trackId: ID;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${POOL_PREFIX}${trackId}`,
    data: { trackId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border-2 border-dashed px-4 py-3 flex flex-wrap items-center gap-2 transition ${
        isOver
          ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30"
          : "border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mr-1">
        Available
      </span>
      {children}
    </div>
  );
}

// ── Draggable attendee chip ─────────────────────────────────────────

function DraggableChip({
  trackId,
  attendee,
  inCard,
  onRemove,
}: {
  trackId: ID;
  attendee: Attendee;
  inCard?: boolean;
  onRemove?: () => void;
}) {
  const id = `${CHIP_PREFIX}${trackId}::${attendee.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style: React.CSSProperties = {
    backgroundColor: attendee.color,
    color: contrastText(attendee.color),
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none",
  };

  return (
    <span
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold shadow-sm cursor-grab active:cursor-grabbing select-none ${
        inCard ? "ring-2 ring-white/40" : ""
      }`}
      title={
        inCard
          ? `${attendee.name} (drag back to pool or click × to retract)`
          : `${attendee.name} (drag onto a card to bet)`
      }
    >
      <span
        className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
        aria-hidden
      />
      {attendee.name}
      {inCard && onRemove && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-black/20 p-0.5"
          aria-label={`Remove ${attendee.name}'s pick`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ── Item / contender card (drop target) ─────────────────────────────

function ItemCard({
  track,
  item,
  idx,
  presenter,
  backers,
  onClearBet,
}: {
  track: Track;
  item: { id: ID; name: string; presenterId: ID };
  idx: number;
  presenter: { id: ID; name: string; color: string } | undefined;
  backers: Attendee[];
  onClearBet: (attendeeId: ID) => void;
}) {
  const color = presenter?.color ?? "#94a3b8";
  const { isOver, setNodeRef } = useDroppable({
    id: `${ITEM_PREFIX}${item.id}`,
    data: { trackId: track.id, itemId: item.id },
  });

  return (
    <motion.article
      ref={setNodeRef}
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isOver ? 1.03 : 1,
      }}
      whileHover={{ y: -2 }}
      transition={{ delay: idx * 0.04, duration: 0.35 }}
      className={`relative rounded-3xl overflow-hidden shadow-lg dark:shadow-black/40 border-2 ${
        isOver
          ? "border-fuchsia-500 ring-4 ring-fuchsia-500/40"
          : "border-transparent"
      }`}
      style={{
        background: `linear-gradient(135deg, ${color}cc 0%, ${color}66 40%, #ffffff 40%)`,
      }}
    >
      {/* dark-mode card base */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `linear-gradient(135deg, ${color}b3 0%, ${color}66 40%, #0f172a 40%)`,
        }}
        aria-hidden
      />

      {/* Jersey letter (non-ranked identifier) */}
      <div
        className="absolute right-3 top-2 text-5xl sm:text-6xl font-black select-none leading-none"
        style={{
          color: "#fff",
          textShadow: "0 2px 6px rgba(0,0,0,.25)",
          fontFamily:
            'ui-rounded, "SF Pro Rounded", system-ui, "Segoe UI", sans-serif',
        }}
        aria-hidden
      >
        {indexToLetters(idx)}
      </div>

      <div className="relative p-5 pt-6 min-h-[200px] flex flex-col">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/85 drop-shadow">
          Contender
        </p>
        <h3
          className="mt-1 text-2xl sm:text-[26px] font-black leading-tight text-white drop-shadow"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,.35)" }}
        >
          {item.name}
        </h3>

        {/* Presenter row sits in the white half */}
        <div className="mt-auto pt-10">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
            Presenter
          </p>
          <div className="mt-1">
            {presenter ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold"
                style={{
                  backgroundColor: color,
                  color: contrastText(color),
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
                  aria-hidden
                />
                {presenter.name}
              </span>
            ) : (
              <span className="text-xs italic text-slate-400 dark:text-slate-500">
                Unassigned
              </span>
            )}
          </div>

          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300 mt-3">
            Backers ({backers.length})
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5 min-h-[28px]">
            {backers.length === 0 ? (
              <span className="text-xs italic text-slate-400 dark:text-slate-400">
                No one has picked yet — drag a name here
              </span>
            ) : (
              backers.map((b) => (
                <DraggableChip
                  key={b.id}
                  trackId={track.id}
                  attendee={b}
                  inCard
                  onRemove={() => onClearBet(b.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
