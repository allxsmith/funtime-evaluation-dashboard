import type { PersistedState, Section, SubSection, Track } from "../types";

// ── v1 shape ──────────────────────────────────────────────────────────
// In v1 a `Section` was the scored unit: { id, name, weight }, and a
// `Track` pointed straight at those sections via `sectionIds`.

type SectionV1 = { id: string; name: string; weight: number };
type TrackV1 = { id: string; name: string; sectionIds: string[] };
type PersistedStateV1 = Omit<
  PersistedState,
  "version" | "sections" | "subSections" | "tracks"
> & {
  version: 1;
  tracks: TrackV1[];
  sections: SectionV1[];
};

/**
 * Migrate a v1 persisted state to v2.
 *
 * Each v1 `Section` becomes a `SubSection` (keeping its id so existing score
 * keys `itemId::sectionId` stay valid). Each track's flat list of sections is
 * wrapped in a single new grouping `Section`.
 */
export function migrateV1ToV2(stateV1: PersistedStateV1): PersistedState {
  const subSections: SubSection[] = (stateV1.sections ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    weight: s.weight ?? 1,
    minPoints: 1,
    maxPoints: 5,
  }));

  const sections: Section[] = [];
  const tracks: Track[] = (stateV1.tracks ?? []).map((t) => {
    const groupId = `sec-${t.id}-default`;
    sections.push({
      id: groupId,
      name: "Criteria",
      subSectionIds: [...(t.sectionIds ?? [])],
    });
    return { id: t.id, name: t.name, sectionIds: [groupId] };
  });

  return {
    version: 2,
    config: stateV1.config,
    tracks,
    sections,
    subSections,
    evaluators: stateV1.evaluators,
    items: stateV1.items,
    scores: stateV1.scores ?? {},
    attendees:
      stateV1.attendees ?? stateV1.evaluators.map((e) => ({ ...e })),
    bets: stateV1.bets ?? {},
  };
}

/**
 * Persist-middleware migration entry point. zustand calls this with the bare
 * persisted blob and the stored version (missing version is treated as 0).
 */
export function migratePersisted(
  persisted: unknown,
  fromVersion: number,
): PersistedState {
  if (fromVersion >= 2) return persisted as PersistedState;
  return migrateV1ToV2(persisted as PersistedStateV1);
}
