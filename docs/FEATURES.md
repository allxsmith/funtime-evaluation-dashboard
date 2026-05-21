# Features

Checklist updated as each phase ships.

## Phase 1 — Scaffold & deploy pipeline ✅
- [x] Bun + React 19 + TypeScript project
- [x] Tailwind CSS v4 via `bun-plugin-tailwind` (configured in `bunfig.toml`)
- [x] Dev server with HMR (`bun run dev`, port 5173)
- [x] Production build (`bun run build`) → `dist/`
- [x] GitHub Actions workflow → GitHub Pages

## Phase 2 — Data model, store, seed ✅
- [x] Types: Track, Section, Evaluator, EvalItem, Scores, AppConfig, SessionState
- [x] Persisted Zustand store + in-memory session store
- [x] Seed data: 2 tracks, 5 evaluators, 9 items, 18 sections

## Phase 3 — Welcome splash + tab shell ✅
- [x] Animated welcome splash with configurable title/subtitle/track chips
- [x] Tab nav (Items, Spin, Race, Results) with active-pill styling
- [x] Admin gear icon (header + splash)

## Phase 4 — Items tab ✅
- [x] Items grouped by track, presenter chips with colors

## Phase 5 — Spin tab ✅
- [x] SVG wheel with colored slices, gold pointer
- [x] Spin animation (5-7 full rotations, easeOut)
- [x] Confetti burst on landing
- [x] Presenter card listing all of that presenter's items (across tracks)
- [x] Countdown timer (configurable, default 5 min) with pause/reset and color warning
- [x] Skip-already-presented (wheel re-renders with remaining only)
- [x] "Reset all" + per-evaluator presented chips

## Phase 6 — Race tab ✅
- [x] Carnival striped header with tent emoji, string lights, water-gun reveal button
- [x] Per-track lanes; horses advance one section at a time
- [x] **Per-presenter control** — race auto-follows current spin presenter; "Reveal next section" advances only their horses
- [x] Presenter status chip row showing each evaluator's progress; active presenter highlighted with ring
- [x] Active lanes get a fuchsia ring outline
- [x] "Reveal all" for current presenter (skip to their full score)
- [x] Raw mode → Weighted mode toggle (after everyone has scored in raw)
- [x] Score labels (`earned/max`) on each lane while racing
- [x] "Demo: Fill random scores" helper
- [x] Reset current mode / Reset full race

## Phase 7 — Results tab ✅
- [x] Animated gold star (winner) + silver star (runner-up) per track
- [x] Confetti from both sides on tab mount
- [x] Full table: rows = items, cols = each section's score + raw total + weighted total
- [x] Winner row highlighted

## Phase 8 — Admin panel ✅
- [x] Modal dialog (Radix) with 7 sub-tabs
- [x] Welcome: title, subtitle, presenter duration
- [x] Evaluators: CRUD with color picker
- [x] Tracks: CRUD (cascade-deletes sections + items)
- [x] Sections: per-track CRUD with weight (number input)
- [x] Items: CRUD with track + presenter dropdowns
- [x] Scores: 1–5 button grid per item-section, with clear button
- [x] Data: Export JSON download, Import JSON file picker, Reset to defaults

## Phase 9 — Polish ✅
- [x] Sound effects (Web Audio API tones: spin ticks, ding, reveal swoosh, fanfare). Toggle in header + `M` key.
- [x] Keyboard shortcuts: `Space` = spin / reveal next; `M` = toggle sound; `Esc` = close admin (Radix built-in)
- [x] String lights on race header
- [x] Active-presenter highlight rings on race lanes
