import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppConfig,
  Attendee,
  Bets,
  EvalItem,
  Evaluator,
  ID,
  PersistedState,
  RaceMode,
  ScoreKey,
  Section,
  SubSection,
  SessionState,
  TabId,
  Track,
} from "../types";
import { scoreKey } from "../types";
import { buildSeed } from "../data/seedData";
import { migratePersisted } from "../data/migrate";

type PersistedActions = {
  updateConfig: (patch: Partial<AppConfig>) => void;
  addTrack: (name: string) => void;
  updateTrack: (id: ID, patch: Partial<Track>) => void;
  deleteTrack: (id: ID) => void;
  addSection: (trackId: ID, name: string) => void;
  updateSection: (id: ID, patch: Partial<Section>) => void;
  deleteSection: (id: ID) => void;
  addSubSection: (sectionId: ID, name: string) => void;
  updateSubSection: (id: ID, patch: Partial<SubSection>) => void;
  deleteSubSection: (id: ID) => void;
  addEvaluator: (name: string, color: string) => void;
  updateEvaluator: (id: ID, patch: Partial<Evaluator>) => void;
  deleteEvaluator: (id: ID) => void;
  addItem: (item: Omit<EvalItem, "id">) => void;
  updateItem: (id: ID, patch: Partial<EvalItem>) => void;
  deleteItem: (id: ID) => void;
  setScore: (itemId: ID, subSectionId: ID, value: number) => void;
  clearScore: (itemId: ID, subSectionId: ID) => void;
  addAttendee: (name: string, color: string) => void;
  updateAttendee: (id: ID, patch: Partial<Attendee>) => void;
  deleteAttendee: (id: ID) => void;
  syncEvaluatorsToAttendees: () => void;
  placeBet: (attendeeId: ID, trackId: ID, itemId: ID) => void;
  clearBet: (attendeeId: ID, trackId: ID) => void;
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
          const subSectionsToRemove = new Set(
            s.sections
              .filter((sec) => sectionsToRemove.has(sec.id))
              .flatMap((sec) => sec.subSectionIds),
          );
          const itemIdsToRemove = new Set(
            s.items.filter((i) => i.trackId === id).map((i) => i.id),
          );
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [itemId] = k.split("::") as [ID, ID];
            if (!itemIdsToRemove.has(itemId)) scores[k as ScoreKey] = v;
          }
          // Remove bets for this track
          const bets: Bets = {};
          for (const [aid, perTrack] of Object.entries(s.bets)) {
            const { [id]: _, ...rest } = perTrack;
            if (Object.keys(rest).length > 0) bets[aid] = rest;
          }
          return {
            tracks: s.tracks.filter((t) => t.id !== id),
            sections: s.sections.filter((sec) => !sectionsToRemove.has(sec.id)),
            subSections: s.subSections.filter(
              (sub) => !subSectionsToRemove.has(sub.id),
            ),
            items: s.items.filter((i) => i.trackId !== id),
            scores,
            bets,
          };
        }),

      addSection: (trackId, name) =>
        set((s) => {
          const id = newId("sec");
          return {
            sections: [...s.sections, { id, name, subSectionIds: [] }],
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
          const section = s.sections.find((sec) => sec.id === id);
          const subIds = new Set(section?.subSectionIds ?? []);
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [, subSectionId] = k.split("::") as [ID, ID];
            if (!subIds.has(subSectionId)) scores[k as ScoreKey] = v;
          }
          return {
            sections: s.sections.filter((sec) => sec.id !== id),
            subSections: s.subSections.filter((sub) => !subIds.has(sub.id)),
            tracks: s.tracks.map((t) => ({
              ...t,
              sectionIds: t.sectionIds.filter((sid) => sid !== id),
            })),
            scores,
          };
        }),

      addSubSection: (sectionId, name) =>
        set((s) => {
          const id = newId("sub");
          return {
            subSections: [
              ...s.subSections,
              { id, name, weight: 1, minPoints: 1, maxPoints: 5 },
            ],
            sections: s.sections.map((sec) =>
              sec.id === sectionId
                ? { ...sec, subSectionIds: [...sec.subSectionIds, id] }
                : sec,
            ),
          };
        }),

      updateSubSection: (id, patch) =>
        set((s) => ({
          subSections: s.subSections.map((sub) => {
            if (sub.id !== id) return sub;
            const next = { ...sub, ...patch };
            const minPoints = Math.max(
              1,
              Math.round(Number(next.minPoints) || 1),
            );
            const maxPoints = Math.max(
              minPoints,
              Math.round(Number(next.maxPoints) || minPoints),
            );
            const weight = Math.max(0, Number(next.weight) || 0);
            return { ...next, minPoints, maxPoints, weight };
          }),
        })),

      deleteSubSection: (id) =>
        set((s) => {
          const scores: Record<ScoreKey, number> = {};
          for (const [k, v] of Object.entries(s.scores)) {
            const [, subSectionId] = k.split("::") as [ID, ID];
            if (subSectionId !== id) scores[k as ScoreKey] = v;
          }
          return {
            subSections: s.subSections.filter((sub) => sub.id !== id),
            sections: s.sections.map((sec) => ({
              ...sec,
              subSectionIds: sec.subSectionIds.filter((sid) => sid !== id),
            })),
            scores,
          };
        }),

      addEvaluator: (name, color) =>
        set((s) => {
          const id = newId("ev");
          const newEv: Evaluator = { id, name, color };
          // Auto-mirror: add a matching attendee with the same id
          const newAttendees =
            s.attendees.some((a) => a.id === id)
              ? s.attendees
              : [...s.attendees, { id, name, color }];
          return {
            evaluators: [...s.evaluators, newEv],
            attendees: newAttendees,
          };
        }),

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
          // Remove any bets pointing at this item
          const bets: Bets = {};
          for (const [aid, perTrack] of Object.entries(s.bets)) {
            const cleaned: Record<ID, ID> = {};
            for (const [tid, iid] of Object.entries(perTrack)) {
              if (iid !== id) cleaned[tid] = iid;
            }
            if (Object.keys(cleaned).length > 0) bets[aid] = cleaned;
          }
          return { items: s.items.filter((i) => i.id !== id), scores, bets };
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

      addAttendee: (name, color) =>
        set((s) => ({
          attendees: [...s.attendees, { id: newId("att"), name, color }],
        })),

      updateAttendee: (id, patch) =>
        set((s) => ({
          attendees: s.attendees.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        })),

      deleteAttendee: (id) =>
        set((s) => {
          const { [id]: _, ...bets } = s.bets;
          return {
            attendees: s.attendees.filter((a) => a.id !== id),
            bets,
          };
        }),

      syncEvaluatorsToAttendees: () =>
        set((s) => {
          const have = new Set(s.attendees.map((a) => a.id));
          const additions = s.evaluators
            .filter((e) => !have.has(e.id))
            .map((e) => ({ id: e.id, name: e.name, color: e.color }));
          if (additions.length === 0) return s;
          return { attendees: [...s.attendees, ...additions] };
        }),

      placeBet: (attendeeId, trackId, itemId) =>
        set((s) => {
          const curr = s.bets[attendeeId] ?? {};
          return {
            bets: { ...s.bets, [attendeeId]: { ...curr, [trackId]: itemId } },
          };
        }),

      clearBet: (attendeeId, trackId) =>
        set((s) => {
          const curr = s.bets[attendeeId];
          if (!curr) return s;
          const { [trackId]: _, ...rest } = curr;
          const bets: Bets = { ...s.bets };
          if (Object.keys(rest).length === 0) delete bets[attendeeId];
          else bets[attendeeId] = rest;
          return { bets };
        }),

      importState: (data) =>
        set(() => ({
          version: 2,
          config: data.config,
          tracks: data.tracks,
          sections: data.sections,
          subSections: data.subSections ?? [],
          evaluators: data.evaluators,
          items: data.items,
          scores: data.scores,
          attendees: data.attendees ?? data.evaluators.map((e) => ({ ...e })),
          bets: data.bets ?? {},
        })),

      resetToDefaults: () => set(() => ({ ...buildSeed() })),
    }),
    {
      name: "funtime-eval-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: migratePersisted,
      partialize: (s): PersistedState => ({
        version: s.version,
        config: s.config,
        tracks: s.tracks,
        sections: s.sections,
        subSections: s.subSections,
        evaluators: s.evaluators,
        items: s.items,
        scores: s.scores,
        attendees: s.attendees,
        bets: s.bets,
      }),
      merge: (persisted, current) => {
        // Backfill new fields if a prior version of localStorage is missing them.
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return {
          ...current,
          ...p,
          config: {
            ...current.config,
            ...(p.config ?? {}),
          },
          subSections: p.subSections ?? current.subSections,
          attendees:
            p.attendees && p.attendees.length > 0
              ? p.attendees
              : (p.evaluators ?? current.evaluators).map((e) => ({ ...e })),
          bets: p.bets ?? {},
        } as typeof current;
      },
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
  revealNextSection: (mode: RaceMode, trackId: ID, max: number) => void;
  revealAllSections: (mode: RaceMode, trackId: ID, max: number) => void;
  resetRaceTrack: (mode: RaceMode, trackId: ID) => void;
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
  rawRevealedByTrack: {},
  weightedRevealedByTrack: {},

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
  revealNextSection: (mode, trackId, max) =>
    set((s) => {
      const key =
        mode === "raw" ? "rawRevealedByTrack" : "weightedRevealedByTrack";
      const curr = s[key];
      const next = Math.min((curr[trackId] ?? 0) + 1, max);
      return { [key]: { ...curr, [trackId]: next } };
    }),
  revealAllSections: (mode, trackId, max) =>
    set((s) => {
      const key =
        mode === "raw" ? "rawRevealedByTrack" : "weightedRevealedByTrack";
      return { [key]: { ...s[key], [trackId]: max } };
    }),
  resetRaceTrack: (mode, trackId) =>
    set((s) => {
      const key =
        mode === "raw" ? "rawRevealedByTrack" : "weightedRevealedByTrack";
      const { [trackId]: _, ...rest } = s[key];
      return { [key]: rest };
    }),
  resetRaceMode: (mode) =>
    set(() =>
      mode === "raw"
        ? { rawRevealedByTrack: {} }
        : { weightedRevealedByTrack: {} },
    ),
  resetRace: () =>
    set({
      raceMode: null,
      rawRevealedByTrack: {},
      weightedRevealedByTrack: {},
    }),
}));
