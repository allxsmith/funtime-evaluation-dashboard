# Architecture

## Stack

| Concern | Choice |
|---|---|
| Runtime / bundler / dev server | Bun (no Vite) |
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (via `bun-plugin-tailwind`) |
| Animation | Framer Motion |
| Confetti | canvas-confetti |
| State + persistence | Zustand with `persist` middleware → localStorage |
| Accessible primitives | Radix UI (Tabs, Dialog, Slider) |
| Icons | lucide-react |
| Tab nav | Internal state (no router) |
| Deploy | GitHub Actions → GitHub Pages |

## Folder layout

```
funtime-evaluation-dashboard/
├── package.json
├── tsconfig.json
├── index.html              # bundler entry
├── build.ts                # production build script
├── src/
│   ├── main.tsx            # React mount
│   ├── App.tsx             # splash gate + tab shell
│   ├── styles.css          # Tailwind import
│   ├── dev.ts              # Bun.serve dev server
│   ├── types.ts            # shared types  (Phase 2)
│   ├── data/seedData.ts    # default tracks/items/sections  (Phase 2)
│   ├── store/              # Zustand store  (Phase 2)
│   ├── components/         # UI  (Phase 3+)
│   └── utils/              # scoring, colors  (Phase 6)
├── .github/workflows/deploy.yml
└── docs/                   # this directory
```

## Build pipeline

- **Dev**: `bun run dev` → `bun --hot src/dev.ts` starts `Bun.serve` with HMR on port 3000.
- **Production**: `bun run build` → `bun build` on `index.html` producing static files in `dist/`. Sets `publicPath` to `/funtime-evaluation-dashboard/` when `GITHUB_PAGES=true`.

Tailwind v4 is processed by `bun-plugin-tailwind`, registered via `Bun.plugin()` in both `src/dev.ts` and `build.ts`.

## State model

See [`DATA-MODEL.md`](./DATA-MODEL.md) for full shapes.

Two layers:
- **Persisted** (`useEvaluationStore` + Zustand `persist`): config, tracks, sections, evaluators, items, scores. Survives reload; exportable as JSON via Admin → Data.
- **Session** (`useSessionStore`, in-memory): which tab is active, who's currently presenting, race reveal index. Resets on reload.

## Components

- `App.tsx` — splash gate. Renders `WelcomeSplash` or `TabShell` based on `hasEnteredApp`. Always mounts `AdminPanel`.
- `TabShell.tsx` — header, Radix Tabs nav, admin-gear button.
- `ItemsTab`, `SpinTab`, `RaceTab`, `ResultsTab` — one per nav tab.
- `Wheel.tsx` — SVG conic wheel with spin physics (Framer Motion `animate` on a `useMotionValue` rotation).
- `HorseTrack.tsx` — single race lane with animated horse position.
- `WinnerStars.tsx` — gold + silver star reveal with confetti hook (see `utils/confetti.ts`).
- `AdminPanel.tsx` — Radix Dialog with 7 sub-tabs (Welcome / Evaluators / Tracks / Sections / Items / Scores / Data).
