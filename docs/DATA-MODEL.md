# Data model

All types live in `src/types.ts`. Two stores in `src/store/evaluationStore.ts`:

| Store | Persisted? | Shape |
|---|---|---|
| `useEvaluationStore` | Yes (localStorage, key `funtime-eval-v1`) | `PersistedState + actions` |
| `useSessionStore` | No (resets on reload) | `SessionState + actions` |

## Persisted state

```ts
type PersistedState = {
  version: 1;
  config: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    presenterDurationSeconds: number;
  };
  tracks: Track[];             // { id, name, sectionIds[] }
  sections: Section[];         // { id, name, weight }
  evaluators: Evaluator[];     // { id, name, color }
  items: EvalItem[];           // { id, trackId, name, presenterId }
  scores: Record<ScoreKey, number>;  // ScoreKey = `${itemId}::${sectionId}`, value 1-5
};
```

`scoreKey(itemId, sectionId)` from `src/types.ts` builds the lookup key.

## Session state

```ts
type SessionState = {
  hasEnteredApp: boolean;       // splash → main shell gate
  activeTab: "items" | "spin" | "race" | "results";
  adminOpen: boolean;
  presentedEvaluatorIds: string[];  // for skip-already-spun
  currentPresenterId: string | null;
  raceMode: "raw" | "weighted" | null;  // null = race not started
  revealedSectionIndex: number;     // 0..totalSteps across all tracks
};
```

## Seed data

`src/data/seedData.ts` exports `buildSeed()`, returning fresh defaults:
- Tracks: **Formatters** (8 sections), **Linters** (10 sections)
- Evaluators: Naggi (red), Ted (blue), Chandu (green), Matt (amber), Leo (violet)
- Items: 4 formatters, 5 linters; each owns the item(s) of its assigned presenter
- Scores: empty (use admin → Scores or admin → Data → Import, or race tab's "Fill random scores" demo helper)

## Cascade rules

- Deleting an **evaluator** also deletes their items and any scores for those items.
- Deleting a **track** also deletes its sections, items, and related scores.
- Deleting a **section** also deletes scores referencing that section.
- Deleting an **item** also deletes scores for that item.

## Score computation

`src/utils/scoring.ts`:
- `rawTotal(scores, item, sectionIds)` — sum of raw values.
- `weightedTotal(scores, item, sectionIds, sectionsById)` — sum of `score × weight`.
- `rawMax(sectionIds)` — `sectionIds.length * 5`.
- `weightedMax(sectionIds, sectionsById)` — `sum(5 × weight)`.
