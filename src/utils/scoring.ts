import type { EvalItem, Scores, Section, SubSection } from "../types";
import { scoreKey } from "../types";

export function getScore(
  scores: Scores,
  itemId: string,
  subSectionId: string,
): number {
  return scores[scoreKey(itemId, subSectionId)] ?? 0;
}

/** Ordered sub-section IDs across a whole track (track → sections → sub-sections). */
export function trackSubSectionIds(
  track: { sectionIds: string[] },
  sectionsById: Record<string, Section>,
): string[] {
  return track.sectionIds.flatMap(
    (sid) => sectionsById[sid]?.subSectionIds ?? [],
  );
}

export function rawTotal(
  scores: Scores,
  item: EvalItem,
  subSectionIds: string[],
): number {
  return subSectionIds.reduce(
    (sum, id) => sum + getScore(scores, item.id, id),
    0,
  );
}

export function weightedTotal(
  scores: Scores,
  item: EvalItem,
  subSectionIds: string[],
  subSectionsById: Record<string, SubSection>,
): number {
  return subSectionIds.reduce(
    (sum, id) =>
      sum + getScore(scores, item.id, id) * (subSectionsById[id]?.weight ?? 1),
    0,
  );
}

export function rawMax(
  subSectionIds: string[],
  subSectionsById: Record<string, SubSection>,
): number {
  return subSectionIds.reduce(
    (sum, id) => sum + (subSectionsById[id]?.maxPoints ?? 5),
    0,
  );
}

export function weightedMax(
  subSectionIds: string[],
  subSectionsById: Record<string, SubSection>,
): number {
  return subSectionIds.reduce(
    (sum, id) =>
      sum +
      (subSectionsById[id]?.maxPoints ?? 5) *
        (subSectionsById[id]?.weight ?? 1),
    0,
  );
}

/** Simple average rating across sub-sections (unscored counted as 0). */
export function rawAverage(
  scores: Scores,
  item: EvalItem,
  subSectionIds: string[],
): number {
  if (subSectionIds.length === 0) return 0;
  const sum = subSectionIds.reduce(
    (acc, id) => acc + getScore(scores, item.id, id),
    0,
  );
  return sum / subSectionIds.length;
}

/** Weighted average rating: Σ(rating × weight) / Σ(weight). */
export function weightedAverage(
  scores: Scores,
  item: EvalItem,
  subSectionIds: string[],
  subSectionsById: Record<string, SubSection>,
): number {
  let num = 0;
  let den = 0;
  for (const id of subSectionIds) {
    const w = subSectionsById[id]?.weight ?? 1;
    num += getScore(scores, item.id, id) * w;
    den += w;
  }
  return den === 0 ? 0 : num / den;
}
