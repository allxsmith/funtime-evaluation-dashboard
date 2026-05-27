export type ID = string;

export type Track = {
  id: ID;
  name: string;
  sectionIds: ID[];
};

// A Section is a named grouping; the scored unit is the SubSection.
export type Section = {
  id: ID;
  name: string;
  subSectionIds: ID[];
};

export type SubSection = {
  id: ID;
  name: string;
  weight: number;
  minPoints: number;
  maxPoints: number;
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

// Score keys are `${itemId}::${subSectionId}`.
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
  weightMin: number;
  weightMax: number;
  autoPlayIntervalSeconds: number;
};

export type PersistedState = {
  version: 2;
  config: AppConfig;
  tracks: Track[];
  sections: Section[];
  subSections: SubSection[];
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

export const scoreKey = (itemId: ID, subSectionId: ID): ScoreKey =>
  `${itemId}::${subSectionId}` as ScoreKey;
