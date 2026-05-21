import type { EvalItem, Scores, Section } from "../types";
import { scoreKey } from "../types";

export function getScore(
  scores: Scores,
  itemId: string,
  sectionId: string,
): number {
  return scores[scoreKey(itemId, sectionId)] ?? 0;
}

export function rawTotal(
  scores: Scores,
  item: EvalItem,
  sectionIds: string[],
): number {
  return sectionIds.reduce(
    (sum, sid) => sum + getScore(scores, item.id, sid),
    0,
  );
}

export function weightedTotal(
  scores: Scores,
  item: EvalItem,
  sectionIds: string[],
  sectionsById: Record<string, Section>,
): number {
  return sectionIds.reduce(
    (sum, sid) =>
      sum + getScore(scores, item.id, sid) * (sectionsById[sid]?.weight ?? 1),
    0,
  );
}

export function rawMax(sectionIds: string[]): number {
  return sectionIds.length * 5;
}

export function weightedMax(
  sectionIds: string[],
  sectionsById: Record<string, Section>,
): number {
  return sectionIds.reduce(
    (sum, sid) => sum + 5 * (sectionsById[sid]?.weight ?? 1),
    0,
  );
}
