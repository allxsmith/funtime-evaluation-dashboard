import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppConfig,
  EvalItem,
  Evaluator,
  ID,
  PersistedState,
  RaceMode,
  ScoreKey,
  Section,
  SessionState,
  TabId,
  Track,
} from "../types";
import { scoreKey } from "../types";
import { buildSeed } from "../data/seedData";

type PersistedActions = {
  updateConfig: (patch: Partial<AppConfig>) => void;
  addTrack: (name: string) => void;
  updateTrack: (id: ID, patch: Partial<Track>) => void;
  deleteTrack: (id: ID) => void;
  addSection: (trackId: ID, name: string) => void;
  updateSection: (id: ID, patch: Partial<Section>) => void;
  deleteSection: (id: ID) => void;
  addEvaluator: (name: string, color: string) => void;
  updateEvaluator: (id: ID, patch: Partial<Evaluator>) => void;
  deleteEvaluator: (id: ID) => void;
  addItem: (item: Omit<EvalItem, "id">) => void;
  updateItem: (id: ID, patch: Partial<EvalItem>) => void;
  deleteItem: (id: ID) => void;
  setScore: (itemId: ID, sectionId: ID, value: number) => void;
  clearScore: (itemId: ID, sectionId: ID) => void;
  importState: (data: PersistedState) => void;
  resetToDefaults: () => void;
};

export type EvaluationStore = PersistedState & PersistedActions;

const newId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const useEvaluationStore = create<EvaluationStore>()(
  persist(
    (set) => ({
      ...buildSeed(),

      updateConfig: (patch) =>
        set((s) => ({ config: { ...s.config, ...patch } })),

      addTrack: (name) =>
        set((s) => ({
          tracks: [...s.tracks, { id: newId("trk"), name, sectionIds: [] }],
        })),

      updateTrack: (id, patch) =>
        set((s) => ({
          tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTrack: (id) =>
        set((s) => {
          const track = s.tracks.find((t) => t.id === id);
          if (!track) return s;
          const sectionsToRemove = new Set(track.sectionIds);
          const itemIdsToRemove = new Set(
            s.items.filter((i) => i.trackId === id).map((i) => i.id),
          );
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [itemId] = k.split("::") as [ID, ID];
            if (!itemIdsToRemove.has(itemId)) scores[k as ScoreKey] = v;
          }
          return {
            tracks: s.tracks.filter((t) => t.id !== id),
            sections: s.sections.filter((sec) => !sectionsToRemove.has(sec.id)),
            items: s.items.filter((i) => i.trackId !== id),
            scores,
          };
        }),

      addSection: (trackId, name) =>
        set((s) => {
          const id = newId("sec");
          return {
            sections: [...s.sections, { id, name, weight: 1 }],
            tracks: s.tracks.map((t) =>
              t.id === trackId
                ? { ...t, sectionIds: [...t.sectionIds, id] }
                : t,
            ),
          };
        }),

      updateSection: (id, patch) =>
        set((s) => ({
          sections: s.sections.map((sec) =>
            sec.id === id ? { ...sec, ...patch } : sec,
          ),
        })),

      deleteSection: (id) =>
        set((s) => {
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [, sectionId] = k.split("::") as [ID, ID];
            if (sectionId !== id) scores[k as ScoreKey] = v;
          }
          return {
            sections: s.sections.filter((sec) => sec.id !== id),
            tracks: s.tracks.map((t) => ({
              ...t,
              sectionIds: t.sectionIds.filter((sid) => sid !== id),
            })),
            scores,
          };
        }),

      addEvaluator: (name, color) =>
        set((s) => ({
          evaluators: [...s.evaluators, { id: newId("ev"), name, color }],
        })),

      updateEvaluator: (id, patch) =>
        set((s) => ({
          evaluators: s.evaluators.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        })),

      deleteEvaluator: (id) =>
        set((s) => {
          const itemIdsToRemove = new Set(
            s.items.filter((i) => i.presenterId === id).map((i) => i.id),
          );
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [itemId] = k.split("::") as [ID, ID];
            if (!itemIdsToRemove.has(itemId)) scores[k as ScoreKey] = v;
          }
          return {
            evaluators: s.evaluators.filter((e) => e.id !== id),
            items: s.items.filter((i) => i.presenterId !== id),
            scores,
          };
        }),

      addItem: (item) =>
        set((s) => ({ items: [...s.items, { id: newId("itm"), ...item }] })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),

      deleteItem: (id) =>
        set((s) => {
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [itemId] = k.split("::") as [ID, ID];
            if (itemId !== id) scores[k as ScoreKey] = v;
          }
          return { items: s.items.filter((i) => i.id !== id), scores };
        }),

      setScore: (itemId, sectionId, value) =>
        set((s) => ({
          scores: { ...s.scores, [scoreKey(itemId, sectionId)]: value },
        })),

      clearScore: (itemId, sectionId) =>
        set((s) => {
          const { [scoreKey(itemId, sectionId)]: _, ...rest } = s.scores;
          return { scores: rest };
        }),

      importState: (data) =>
        set(() => ({
          version: 1,
          config: data.config,
          tracks: data.tracks,
          sections: data.sections,
          evaluators: data.evaluators,
          items: data.items,
          scores: data.scores,
        })),

      resetToDefaults: () => set(() => ({ ...buildSeed() })),
    }),
    {
      name: "funtime-eval-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({
        version: s.version,
        config: s.config,
        tracks: s.tracks,
        sections: s.sections,
        evaluators: s.evaluators,
        items: s.items,
        scores: s.scores,
      }),
    },
  ),
);

// Session store — in-memory only, resets on reload
type SessionActions = {
  setHasEnteredApp: (v: boolean) => void;
  setActiveTab: (t: TabId) => void;
  setAdminOpen: (open: boolean) => void;
  markPresented: (evaluatorId: ID) => void;
  setCurrentPresenter: (evaluatorId: ID | null) => void;
  resetSpinSession: () => void;
  setRaceMode: (m: RaceMode | null) => void;
  revealNextForPresenter: (
    mode: RaceMode,
    presenterItems: Array<{ id: ID; max: number }>,
  ) => void;
  revealAllForPresenter: (
    mode: RaceMode,
    presenterItems: Array<{ id: ID; max: number }>,
  ) => void;
  resetRaceMode: (mode: RaceMode) => void;
  resetRace: () => void;
};

export const useSessionStore = create<SessionState & SessionActions>((set) => ({
  hasEnteredApp: false,
  activeTab: "items",
  adminOpen: false,
  presentedEvaluatorIds: [],
  currentPresenterId: null,
  raceMode: null,
  rawRevealedByItem: {},
  weightedRevealedByItem: {},

  setHasEnteredApp: (v) => set({ hasEnteredApp: v }),
  setActiveTab: (t) => set({ activeTab: t }),
  setAdminOpen: (open) => set({ adminOpen: open }),
  markPresented: (id) =>
    set((s) => ({
      presentedEvaluatorIds: [...s.presentedEvaluatorIds, id],
      currentPresenterId: null,
    })),
  setCurrentPresenter: (id) => set({ currentPresenterId: id }),
  resetSpinSession: () =>
    set({ presentedEvaluatorIds: [], currentPresenterId: null }),
  setRaceMode: (m) => set({ raceMode: m }),
  revealNextForPresenter: (mode, presenterItems) =>
    set((s) => {
      const key =
        mode === "raw" ? "rawRevealedByItem" : "weightedRevealedByItem";
      const curr = s[key];
      const next = { ...curr };
      for (const { id, max } of presenterItems) {
        next[id] = Math.min((curr[id] ?? 0) + 1, max);
      }
      return { [key]: next };
    }),
  revealAllForPresenter: (mode, presenterItems) =>
    set((s) => {
      const key =
        mode === "raw" ? "rawRevealedByItem" : "weightedRevealedByItem";
      const curr = s[key];
      const next = { ...curr };
      for (const { id, max } of presenterItems) {
        next[id] = max;
      }
      return { [key]: next };
    }),
  resetRaceMode: (mode) =>
    set(() =>
      mode === "raw"
        ? { rawRevealedByItem: {} }
        : { weightedRevealedByItem: {} },
    ),
  resetRace: () =>
    set({
      raceMode: null,
      rawRevealedByItem: {},
      weightedRevealedByItem: {},
    }),
}));
