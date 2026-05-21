import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import { Download, Plus, Trash2, Upload, X } from "lucide-react";
import {
  useEvaluationStore,
  useSessionStore,
} from "../store/evaluationStore";
import type { PersistedState } from "../types";
import { DEFAULT_PALETTE, contrastText } from "../utils/colors";
import { getScore } from "../utils/scoring";

const SUB_TABS = [
  { id: "welcome", label: "Welcome" },
  { id: "evaluators", label: "Evaluators" },
  { id: "attendees", label: "Attendees" },
  { id: "tracks", label: "Tracks" },
  { id: "sections", label: "Sections" },
  { id: "items", label: "Items" },
  { id: "scores", label: "Scores" },
  { id: "data", label: "Data" },
] as const;

export function AdminPanel() {
  const open = useSessionStore((s) => s.adminOpen);
  const setOpen = useSessionStore((s) => s.setAdminOpen);
  const [activeSubTab, setActiveSubTab] = useState<string>("welcome");

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(96vw,1000px)] max-h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-3">
            <Dialog.Title className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              Settings
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <Tabs.Root
            value={activeSubTab}
            onValueChange={setActiveSubTab}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <Tabs.List
              aria-label="Settings sections"
              className="flex flex-wrap gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40"
            >
              {SUB_TABS.map((t) => (
                <Tabs.Trigger
                  key={t.id}
                  value={t.id}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 data-[state=active]:bg-slate-800 data-[state=active]:text-white dark:data-[state=active]:bg-fuchsia-600 hover:bg-slate-200 dark:hover:bg-slate-800 data-[state=active]:hover:bg-slate-800 transition"
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="overflow-y-auto p-5 flex-1">
              <Tabs.Content value="welcome">
                <WelcomeSettings />
              </Tabs.Content>
              <Tabs.Content value="evaluators">
                <EvaluatorsSettings />
              </Tabs.Content>
              <Tabs.Content value="attendees">
                <AttendeesSettings />
              </Tabs.Content>
              <Tabs.Content value="tracks">
                <TracksSettings />
              </Tabs.Content>
              <Tabs.Content value="sections">
                <SectionsSettings />
              </Tabs.Content>
              <Tabs.Content value="items">
                <ItemsSettings />
              </Tabs.Content>
              <Tabs.Content value="scores">
                <ScoresSettings />
              </Tabs.Content>
              <Tabs.Content value="data">
                <DataSettings />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500";
const btnCls =
  "inline-flex items-center gap-1.5 rounded-full bg-slate-800 dark:bg-fuchsia-600 hover:bg-slate-900 dark:hover:bg-fuchsia-500 text-white text-sm font-semibold px-3 py-1.5 transition";
const dangerBtnCls =
  "inline-flex items-center gap-1.5 rounded-full bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold px-2.5 py-1 transition";

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
      )}
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────

function WelcomeSettings() {
  const config = useEvaluationStore((s) => s.config);
  const updateConfig = useEvaluationStore((s) => s.updateConfig);

  return (
    <div className="space-y-4 max-w-lg">
      <SectionHeader
        title="Welcome screen"
        description="What attendees see on the splash."
      />
      <Field label="Title">
        <input
          className={inputCls}
          value={config.welcomeTitle}
          onChange={(e) => updateConfig({ welcomeTitle: e.target.value })}
        />
      </Field>
      <Field label="Subtitle">
        <input
          className={inputCls}
          value={config.welcomeSubtitle}
          onChange={(e) => updateConfig({ welcomeSubtitle: e.target.value })}
        />
      </Field>
      <Field
        label={`Presenter duration (seconds) — currently ${config.presenterDurationSeconds}s`}
      >
        <input
          type="number"
          min={30}
          step={30}
          className={inputCls}
          value={config.presenterDurationSeconds}
          onChange={(e) =>
            updateConfig({
              presenterDurationSeconds: Math.max(30, Number(e.target.value) || 0),
            })
          }
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Evaluators ───────────────────────────────────────────────────────

function EvaluatorsSettings() {
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const addEvaluator = useEvaluationStore((s) => s.addEvaluator);
  const updateEvaluator = useEvaluationStore((s) => s.updateEvaluator);
  const deleteEvaluator = useEvaluationStore((s) => s.deleteEvaluator);
  const [newName, setNewName] = useState("");

  const nextColor =
    DEFAULT_PALETTE[evaluators.length % DEFAULT_PALETTE.length];

  return (
    <div>
      <SectionHeader
        title="Evaluators"
        description="People who present. Each owns one or more items. Adding an evaluator also adds them as an attendee."
      />
      <div className="space-y-2 mb-4">
        {evaluators.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
          >
            <input
              type="color"
              value={ev.color}
              onChange={(e) =>
                updateEvaluator(ev.id, { color: e.target.value })
              }
              className="w-9 h-9 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label={`Color for ${ev.name}`}
            />
            <input
              className="flex-1 bg-transparent border-0 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 rounded px-2 py-1"
              value={ev.name}
              onChange={(e) =>
                updateEvaluator(ev.id, { name: e.target.value })
              }
            />
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete ${ev.name}? Their items and scores will also be removed.`,
                  )
                )
                  deleteEvaluator(ev.id);
              }}
              className={dangerBtnCls}
              aria-label="Delete evaluator"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 max-w-md">
        <input
          className={inputCls}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New evaluator name"
        />
        <button
          onClick={() => {
            const n = newName.trim();
            if (!n) return;
            addEvaluator(n, nextColor);
            setNewName("");
          }}
          className={btnCls}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Attendees ────────────────────────────────────────────────────────

function AttendeesSettings() {
  const attendees = useEvaluationStore((s) => s.attendees);
  const addAttendee = useEvaluationStore((s) => s.addAttendee);
  const updateAttendee = useEvaluationStore((s) => s.updateAttendee);
  const deleteAttendee = useEvaluationStore((s) => s.deleteAttendee);
  const syncEvaluators = useEvaluationStore(
    (s) => s.syncEvaluatorsToAttendees,
  );
  const [newName, setNewName] = useState("");

  const nextColor =
    DEFAULT_PALETTE[attendees.length % DEFAULT_PALETTE.length];

  return (
    <div>
      <SectionHeader
        title="Attendees"
        description="People in the room who can place bets on The Field. Evaluators are auto-added; add observers here too."
      />
      <div className="space-y-2 mb-4">
        {attendees.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
          >
            <input
              type="color"
              value={att.color}
              onChange={(e) =>
                updateAttendee(att.id, { color: e.target.value })
              }
              className="w-9 h-9 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
              aria-label={`Color for ${att.name}`}
            />
            <input
              className="flex-1 bg-transparent border-0 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 rounded px-2 py-1"
              value={att.name}
              onChange={(e) =>
                updateAttendee(att.id, { name: e.target.value })
              }
            />
            <button
              onClick={() => {
                if (
                  confirm(
                    `Remove ${att.name} from attendees? Their bets will be cleared.`,
                  )
                )
                  deleteAttendee(att.id);
              }}
              className={dangerBtnCls}
              aria-label="Delete attendee"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-2 max-w-md flex-1 min-w-[260px]">
          <input
            className={inputCls}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New attendee name"
          />
          <button
            onClick={() => {
              const n = newName.trim();
              if (!n) return;
              addAttendee(n, nextColor);
              setNewName("");
            }}
            className={btnCls}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <button
          onClick={syncEvaluators}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold px-3 py-1.5 transition"
          title="Re-add any evaluators not currently in this list"
        >
          Sync evaluators
        </button>
      </div>
    </div>
  );
}

// ─── Tracks ───────────────────────────────────────────────────────────

function TracksSettings() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const addTrack = useEvaluationStore((s) => s.addTrack);
  const updateTrack = useEvaluationStore((s) => s.updateTrack);
  const deleteTrack = useEvaluationStore((s) => s.deleteTrack);
  const [newName, setNewName] = useState("");

  return (
    <div>
      <SectionHeader
        title="Tracks"
        description="Categories of items (e.g., Formatters, Linters). Each track has its own sections."
      />
      <div className="space-y-2 mb-4">
        {tracks.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
          >
            <input
              className="flex-1 bg-transparent border-0 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 rounded px-2 py-1"
              value={t.name}
              onChange={(e) => updateTrack(t.id, { name: e.target.value })}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {t.sectionIds.length} sections
            </span>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Delete track "${t.name}"? Its sections, items, and scores will also be removed.`,
                  )
                )
                  deleteTrack(t.id);
              }}
              className={dangerBtnCls}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 max-w-md">
        <input
          className={inputCls}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New track name"
        />
        <button
          onClick={() => {
            const n = newName.trim();
            if (!n) return;
            addTrack(n);
            setNewName("");
          }}
          className={btnCls}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────

function SectionsSettings() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const sections = useEvaluationStore((s) => s.sections);
  const addSection = useEvaluationStore((s) => s.addSection);
  const updateSection = useEvaluationStore((s) => s.updateSection);
  const deleteSection = useEvaluationStore((s) => s.deleteSection);
  const [newNameByTrack, setNewNameByTrack] = useState<Record<string, string>>(
    {},
  );

  const sectionsById = Object.fromEntries(sections.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Sections & weights"
        description="Scoring categories per track. Weight multiplies the raw score for weighted totals."
      />
      {tracks.map((track) => (
        <section key={track.id}>
          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 mb-2">{track.name}</h4>
          <div className="space-y-2 mb-3">
            {track.sectionIds.map((sid) => {
              const sec = sectionsById[sid];
              if (!sec) return null;
              return (
                <div
                  key={sid}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
                >
                  <input
                    className="flex-1 bg-transparent font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 rounded px-2 py-1"
                    value={sec.name}
                    onChange={(e) =>
                      updateSection(sid, { name: e.target.value })
                    }
                  />
                  <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    weight
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      className="w-20 rounded border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm"
                      value={sec.weight}
                      onChange={(e) =>
                        updateSection(sid, {
                          weight: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (confirm(`Delete section "${sec.name}"?`))
                        deleteSection(sid);
                    }}
                    className={dangerBtnCls}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 max-w-md">
            <input
              className={inputCls}
              value={newNameByTrack[track.id] ?? ""}
              onChange={(e) =>
                setNewNameByTrack((p) => ({
                  ...p,
                  [track.id]: e.target.value,
                }))
              }
              placeholder={`New section for ${track.name}`}
            />
            <button
              onClick={() => {
                const n = (newNameByTrack[track.id] ?? "").trim();
                if (!n) return;
                addSection(track.id, n);
                setNewNameByTrack((p) => ({ ...p, [track.id]: "" }));
              }}
              className={btnCls}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Items ────────────────────────────────────────────────────────────

function ItemsSettings() {
  const tracks = useEvaluationStore((s) => s.tracks);
  const items = useEvaluationStore((s) => s.items);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const addItem = useEvaluationStore((s) => s.addItem);
  const updateItem = useEvaluationStore((s) => s.updateItem);
  const deleteItem = useEvaluationStore((s) => s.deleteItem);
  const [newName, setNewName] = useState("");
  const [newTrackId, setNewTrackId] = useState(tracks[0]?.id ?? "");
  const [newPresenterId, setNewPresenterId] = useState(evaluators[0]?.id ?? "");

  return (
    <div>
      <SectionHeader
        title="Items"
        description="The things being evaluated. Each item lives in a track and has a presenter."
      />
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
          >
            <input
              className="flex-1 min-w-[180px] bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 rounded px-2 py-1"
              value={item.name}
              onChange={(e) => updateItem(item.id, { name: e.target.value })}
            />
            <select
              className="text-sm rounded border border-slate-300 dark:border-slate-700 px-2 py-1"
              value={item.trackId}
              onChange={(e) =>
                updateItem(item.id, { trackId: e.target.value })
              }
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <select
              className="text-sm rounded border border-slate-300 dark:border-slate-700 px-2 py-1"
              value={item.presenterId}
              onChange={(e) =>
                updateItem(item.id, { presenterId: e.target.value })
              }
            >
              {evaluators.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (confirm(`Delete item "${item.name}"?`)) deleteItem(item.id);
              }}
              className={dangerBtnCls}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 max-w-3xl">
        <input
          className={inputCls + " flex-1 min-w-[200px]"}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New item name"
        />
        <select
          className="rounded border border-slate-300 dark:border-slate-700 px-2 py-2 text-sm"
          value={newTrackId}
          onChange={(e) => setNewTrackId(e.target.value)}
        >
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="rounded border border-slate-300 dark:border-slate-700 px-2 py-2 text-sm"
          value={newPresenterId}
          onChange={(e) => setNewPresenterId(e.target.value)}
        >
          {evaluators.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const n = newName.trim();
            if (!n || !newTrackId || !newPresenterId) return;
            addItem({
              name: n,
              trackId: newTrackId,
              presenterId: newPresenterId,
            });
            setNewName("");
          }}
          className={btnCls}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Scores ───────────────────────────────────────────────────────────

function ScoresSettings() {
  const items = useEvaluationStore((s) => s.items);
  const tracks = useEvaluationStore((s) => s.tracks);
  const sections = useEvaluationStore((s) => s.sections);
  const evaluators = useEvaluationStore((s) => s.evaluators);
  const scores = useEvaluationStore((s) => s.scores);
  const setScore = useEvaluationStore((s) => s.setScore);
  const clearScore = useEvaluationStore((s) => s.clearScore);

  const [selectedItemId, setSelectedItemId] = useState<string>(
    items[0]?.id ?? "",
  );

  const item = items.find((i) => i.id === selectedItemId);
  const track = tracks.find((t) => t.id === item?.trackId);
  const presenter = evaluators.find((e) => e.id === item?.presenterId);
  const sectionsById = Object.fromEntries(sections.map((s) => [s.id, s]));

  return (
    <div>
      <SectionHeader
        title="Scores"
        description="Enter a score (1–5) per item per section. Leave blank for no score."
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Item
        </label>
        <select
          className="rounded border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-semibold"
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
        >
          {items.map((i) => {
            const t = tracks.find((tr) => tr.id === i.trackId);
            const ev = evaluators.find((e) => e.id === i.presenterId);
            return (
              <option key={i.id} value={i.id}>
                {i.name} · {t?.name} · {ev?.name}
              </option>
            );
          })}
        </select>
        {presenter && (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{
              backgroundColor: presenter.color,
              color: contrastText(presenter.color),
            }}
          >
            {presenter.name}
          </span>
        )}
      </div>

      {item && track ? (
        <div className="space-y-2 max-w-2xl">
          {track.sectionIds.map((sid) => {
            const sec = sectionsById[sid];
            if (!sec) return null;
            const value = getScore(scores, item.id, sid);
            return (
              <div
                key={sid}
                className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2"
              >
                <span className="flex-1 font-medium text-slate-800 dark:text-slate-100">
                  {sec.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">w={sec.weight}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(item.id, sid, n)}
                      className={`w-8 h-8 rounded font-bold text-sm transition ${
                        value === n
                          ? "bg-fuchsia-600 text-white"
                          : "bg-white border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  {value > 0 && (
                    <button
                      onClick={() => clearScore(item.id, sid)}
                      className="ml-1 rounded p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-200"
                      aria-label="Clear"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 italic">Pick an item to score.</p>
      )}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────

function DataSettings() {
  const importState = useEvaluationStore((s) => s.importState);
  const resetToDefaults = useEvaluationStore((s) => s.resetToDefaults);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = () => {
    const state = useEvaluationStore.getState();
    const data: PersistedState = {
      version: 1,
      config: state.config,
      tracks: state.tracks,
      sections: state.sections,
      evaluators: state.evaluators,
      items: state.items,
      scores: state.scores,
      attendees: state.attendees,
      bets: state.bets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funtime-eval-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (
        typeof parsed !== "object" ||
        !parsed ||
        parsed.version !== 1 ||
        !Array.isArray(parsed.tracks) ||
        !Array.isArray(parsed.sections) ||
        !Array.isArray(parsed.evaluators) ||
        !Array.isArray(parsed.items) ||
        typeof parsed.config !== "object" ||
        typeof parsed.scores !== "object"
      ) {
        setError("That file doesn't look like a valid Funtime export.");
        return;
      }
      importState(parsed as PersistedState);
      setError(null);
      alert("Imported successfully.");
    } catch (e) {
      setError(
        `Couldn't read file: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <SectionHeader
        title="Data"
        description="Back up or restore the full configuration and scores."
      />

      <div className="space-y-3">
        <button onClick={handleExport} className={btnCls}>
          <Download className="w-4 h-4" />
          Export JSON
        </button>

        <div>
          <button
            onClick={() => fileRef.current?.click()}
            className={btnCls + " bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200"}
          >
            <Upload className="w-4 h-4" />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = "";
            }}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <button
          onClick={() => {
            if (
              confirm(
                "Reset everything to the default Java tooling demo? This deletes your customizations.",
              )
            )
              resetToDefaults();
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2"
        >
          <Trash2 className="w-4 h-4" />
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
