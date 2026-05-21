import type { PersistedState } from "../types";

export const FORMATTER_SECTIONS = [
  "Java Syntax Coverage",
  "Formatting Consistency & Quality",
  "Configuration & Flexibility",
  "Developer Experience",
  "Ease of Adoption",
  "Automation & CI/CD Support",
  "Performance & Scalability",
  "Compatibility",
] as const;

export const LINTER_SECTIONS = [
  "Functional Capabilities",
  "Developer Experience",
  "CI/CD Integration",
  "Performance & Scalability",
  "Security & Compliance",
  "Reporting & Visibility",
  "Adoption & Maintainability",
  "Support & Community",
  "Licensing & Cost",
  "Risk & Limitations",
] as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function buildSeed(): PersistedState {
  const evaluators = [
    { id: "ev-naggi", name: "Naggi", color: "#ef4444" },
    { id: "ev-ted", name: "Ted", color: "#3b82f6" },
    { id: "ev-chandu", name: "Chandu", color: "#22c55e" },
    { id: "ev-matt", name: "Matt", color: "#f59e0b" },
    { id: "ev-leo", name: "Leo", color: "#a855f7" },
  ];

  const formatterSections = FORMATTER_SECTIONS.map((name) => ({
    id: `sec-fmt-${slug(name)}`,
    name,
    weight: 1,
  }));

  const linterSections = LINTER_SECTIONS.map((name) => ({
    id: `sec-lint-${slug(name)}`,
    name,
    weight: 1,
  }));

  const tracks = [
    {
      id: "trk-formatters",
      name: "Formatters",
      sectionIds: formatterSections.map((s) => s.id),
    },
    {
      id: "trk-linters",
      name: "Linters",
      sectionIds: linterSections.map((s) => s.id),
    },
  ];

  const items = [
    // Formatters
    {
      id: "itm-google-java-formatter",
      trackId: "trk-formatters",
      name: "Google Java Formatter",
      presenterId: "ev-naggi",
    },
    {
      id: "itm-palantir-java-formatter",
      trackId: "trk-formatters",
      name: "Palantir Java Formatter",
      presenterId: "ev-ted",
    },
    {
      id: "itm-prettier",
      trackId: "trk-formatters",
      name: "Prettier",
      presenterId: "ev-chandu",
    },
    {
      id: "itm-eclipse-formatter",
      trackId: "trk-formatters",
      name: "Eclipse Formatter",
      presenterId: "ev-matt",
    },
    // Linters
    {
      id: "itm-checkstyle",
      trackId: "trk-linters",
      name: "Checkstyle",
      presenterId: "ev-matt",
    },
    {
      id: "itm-pmd",
      trackId: "trk-linters",
      name: "PMD",
      presenterId: "ev-ted",
    },
    {
      id: "itm-spotbugs",
      trackId: "trk-linters",
      name: "SpotBugs",
      presenterId: "ev-leo",
    },
    {
      id: "itm-errorprone",
      trackId: "trk-linters",
      name: "ErrorProne",
      presenterId: "ev-naggi",
    },
    {
      id: "itm-sonarqube",
      trackId: "trk-linters",
      name: "SonarQube",
      presenterId: "ev-chandu",
    },
  ];

  return {
    version: 1,
    config: {
      welcomeTitle: "Java Tooling Evaluation",
      welcomeSubtitle: "Linters & Formatters Showdown",
      presenterDurationSeconds: 300,
      soundEnabled: true,
      theme: "system",
    },
    tracks,
    sections: [...formatterSections, ...linterSections],
    evaluators,
    items,
    scores: {},
    attendees: evaluators.map((e) => ({ ...e })),
    bets: {},
  };
}
