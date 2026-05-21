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

export type Attendee = {
  id: ID;
  name: string;
  color: string;
};

// attendeeId -> trackId -> itemId (one pick per attendee per track)
export type Bets = Record<ID, Record<ID, ID>>;

export type ThemeMode = "system" | "light" | "dark";

export type AppConfig = {
  welcomeTitle: string;
  welcomeSubtitle: string;
  presenterDurationSeconds: number;
  soundEnabled: boolean;
  theme: ThemeMode;
};

export type PersistedState = {
  version: 1;
  config: AppConfig;
  tracks: Track[];
  sections: Section[];
  evaluators: Evaluator[];
  items: EvalItem[];
  scores: Scores;
  attendees: Attendee[];
  bets: Bets;
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
  rawRevealedByTrack: Record<ID, number>;
  weightedRevealedByTrack: Record<ID, number>;
};

export const scoreKey = (itemId: ID, sectionId: ID): ScoreKey =>
  `${itemId}::${sectionId}` as ScoreKey;
