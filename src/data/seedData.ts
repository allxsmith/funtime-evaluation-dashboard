import type { PersistedState, Section, SubSection } from "../types";

// Each track is a list of sections; each section groups scored sub-sections.
// A sub-section carries a weight and a point range (min..max).
type SubSpec = { name: string; weight: number; max: number };
type SecSpec = { name: string; subSections: SubSpec[] };

const FORMATTER_STRUCTURE: SecSpec[] = [
  {
    name: "Java Syntax Coverage",
    subSections: [
      { name: "Core Java syntax (classes, methods, fields)", weight: 10, max: 5 },
      { name: "Lambdas & streams", weight: 10, max: 5 },
      { name: "Generics & complex type declarations", weight: 9, max: 5 },
      { name: "Annotations", weight: 8, max: 5 },
      { name: "Records, sealed classes, pattern matching", weight: 10, max: 5 },
      { name: "Text blocks & string handling", weight: 9, max: 5 },
    ],
  },
  {
    name: "Formatting Consistency & Quality",
    subSections: [
      { name: "Deterministic output (same input → same format)", weight: 20, max: 5 },
      { name: "Readability of formatted code", weight: 12, max: 5 },
      { name: "Line wrapping logic", weight: 12, max: 5 },
      { name: "Handling of long expressions & method chains", weight: 12, max: 5 },
      { name: "Indentation rules", weight: 13, max: 5 },
    ],
  },
  {
    name: "Configuration & Flexibility",
    subSections: [
      { name: "Configurability vs opinionated defaults", weight: 18, max: 5 },
      { name: "Style guide support", weight: 13, max: 5 },
      { name: "Ability to selectively enable/disable rules", weight: 13, max: 5 },
      { name: "Configuration Method: Code-based", weight: 16, max: 5 },
      { name: "Configuration Method: File-based (XML, YAML, properties)", weight: 12, max: 5 },
      { name: "Configuration Method: Not configurable", weight: 10, max: 5 },
    ],
  },
  {
    name: "Developer Experience",
    subSections: [
      { name: "IDE integration", weight: 3, max: 5 },
      { name: "IntelliJ IDEA", weight: 8, max: 5 },
      { name: "Eclipse", weight: 6, max: 5 },
      { name: "VS Code", weight: 7, max: 5 },
      { name: "Formatting on save", weight: 6, max: 5 },
      { name: "Headless CLI (IDE-independent)", weight: 18, max: 5 },
      { name: "Performance in IDE", weight: 6, max: 5 },
    ],
  },
  {
    name: "Developer Experience: Ease of Adoption",
    subSections: [
      { name: "Setup simplicity", weight: 18, max: 5 },
      { name: "Documentation quality", weight: 12, max: 5 },
      { name: "Time to productivity", weight: 8, max: 5 },
      { name: "Error messages & guidance", weight: 11, max: 5 },
    ],
  },
  {
    name: "Automation & CI/CD Support",
    subSections: [
      { name: "Maven integration", weight: 20, max: 5 },
      { name: "Gradle integration", weight: 6, max: 5 },
      { name: "GitHub Actions / Azure DevOps / GitLab", weight: 19, max: 5 },
      { name: "Fail build on formatting violations", weight: 12, max: 5 },
      { name: "Auto-apply formatting in pipeline", weight: 12, max: 5 },
    ],
  },
  {
    name: "Performance & Scalability",
    subSections: [
      { name: "Speed on small projects", weight: 12, max: 5 },
      { name: "Speed on large/monorepo codebases", weight: 16, max: 5 },
      { name: "Incremental formatting support", weight: 17, max: 5 },
    ],
  },
  {
    name: "Compatibility",
    subSections: [
      { name: "Toolchain compatibility", weight: 20, max: 5 },
      { name: "Backward compatibility", weight: 11, max: 5 },
      { name: "Formatting stability across versions", weight: 18, max: 5 },
    ],
  },
];

const LINTER_STRUCTURE: SecSpec[] = [
  {
    name: "Functional Capabilities",
    subSections: [
      { name: "Language & Framework Support", weight: 11, max: 5 },
      { name: "Rule Coverage & Quality", weight: 12, max: 5 },
      { name: "Custom Rules & Extensibility", weight: 10, max: 5 },
      { name: "Configuration & Policy Management", weight: 12, max: 5 },
    ],
  },
  {
    name: "Developer Experience",
    subSections: [
      { name: "Ease of Use", weight: 9, max: 5 },
      { name: "IDE Integration", weight: 6, max: 5 },
      { name: "CLI & Local Workflow", weight: 18, max: 5 },
    ],
  },
  {
    name: "CI/CD Integration",
    subSections: [
      { name: "CI/CD Compatibility", weight: 20, max: 5 },
      { name: "SCM Integration", weight: 18, max: 5 },
    ],
  },
  {
    name: "Performance & Scalability",
    subSections: [
      { name: "Performance & Scalability", weight: 14, max: 5 },
    ],
  },
  {
    name: "Security & Compliance (if applicable)",
    subSections: [
      { name: "Security & Compliance (if applicable)", weight: 9, max: 5 },
    ],
  },
  {
    name: "Reporting & Visibility",
    subSections: [
      { name: "Reporting & Visibility", weight: 12, max: 5 },
    ],
  },
  {
    name: "Adoption & Maintainability",
    subSections: [
      { name: "Adoption & Maintainability", weight: 11, max: 5 },
    ],
  },
  {
    name: "Support & Community",
    subSections: [
      { name: "Vendor/Community Support", weight: 10, max: 5 },
    ],
  },
  {
    name: "Licensing & Cost",
    subSections: [
      { name: "Licensing & Cost", weight: 8, max: 5 },
    ],
  },
  {
    name: "Risks & Limitations",
    subSections: [
      { name: "Risks & Limitations", weight: 10, max: 5 },
    ],
  },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function buildTrackStructure(
  prefix: string,
  structure: SecSpec[],
): { sections: Section[]; subSections: SubSection[] } {
  const sections: Section[] = [];
  const subSections: SubSection[] = [];
  for (const sec of structure) {
    const subSectionIds: string[] = [];
    for (const sub of sec.subSections) {
      const subId = `sub-${prefix}-${slug(sub.name)}`;
      subSections.push({
        id: subId,
        name: sub.name,
        weight: sub.weight,
        minPoints: 1,
        maxPoints: sub.max,
      });
      subSectionIds.push(subId);
    }
    sections.push({
      id: `sec-${prefix}-${slug(sec.name)}`,
      name: sec.name,
      subSectionIds,
    });
  }
  return { sections, subSections };
}

export function buildSeed(): PersistedState {
  const evaluators = [
    { id: "ev-naggi", name: "Naggi", color: "#ef4444" },
    { id: "ev-ted", name: "Ted", color: "#3b82f6" },
    { id: "ev-chandu", name: "Chandu", color: "#22c55e" },
    { id: "ev-matt", name: "Matt", color: "#f59e0b" },
    { id: "ev-leo", name: "Leo", color: "#a855f7" },
  ];

  const formatter = buildTrackStructure("fmt", FORMATTER_STRUCTURE);
  const linter = buildTrackStructure("lint", LINTER_STRUCTURE);

  const tracks = [
    {
      id: "trk-formatters",
      name: "Formatters",
      sectionIds: formatter.sections.map((s) => s.id),
    },
    {
      id: "trk-linters",
      name: "Linters",
      sectionIds: linter.sections.map((s) => s.id),
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
    version: 2,
    config: {
      welcomeTitle: "Java Tooling Evaluation",
      welcomeSubtitle: "Linters & Formatters Showdown",
      presenterDurationSeconds: 300,
      soundEnabled: true,
      theme: "system",
      weightMin: 1,
      weightMax: 20,
      autoPlayIntervalSeconds: 2,
    },
    tracks,
    sections: [...formatter.sections, ...linter.sections],
    subSections: [...formatter.subSections, ...linter.subSections],
    evaluators,
    items,
    scores: {},
    attendees: evaluators.map((e) => ({ ...e })),
    bets: {},
  };
}
