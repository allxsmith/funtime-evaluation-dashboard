export type ID = string;

export type Track = {
  id: ID;
  name: string;
  sectionIds: ID[];
};

export type Section = {
  id: ID;
  name: string;
  weight: number;
};

export type Evaluator = {
  id: ID;
  name: string;
  color: string;
};

export type EvalItem = {
  id: ID;
  trackId: ID;
  name: string;
  presenterId: ID;
};

export type ScoreKey = `${ID}::${ID}`;
export type Scores = Record<ScoreKey, number>;

export type AppConfig = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  presenterDurationSeconds: number;
  soundEnabled: boolean;
};

export type PersistedState = {
  version: 1;
  config: AppConfig;
  tracks: Track[];
  sections: Section[];
  evaluators: Evaluator[];
  items: EvalItem[];
  scores: Scores;
};

export type TabId = "items" | "spin" | "race" | "results";

export type RaceMode = "raw" | "weighted";

export type SessionState = {
  hasEnteredApp: boolean;
  activeTab: TabId;
  adminOpen: boolean;
  presentedEvaluatorIds: ID[];
  currentPresenterId: ID | null;
  raceMode: RaceMode | null;
  rawRevealedByItem: Record<ID, number>;
  weightedRevealedByItem: Record<ID, number>;
};

export const scoreKey = (itemId: ID, sectionId: ID): ScoreKey =>
  `${itemId}::${sectionId}` as ScoreKey;
