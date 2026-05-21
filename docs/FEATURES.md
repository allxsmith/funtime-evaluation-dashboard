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

## Phase 4 — The Field tab ✅ (was: Items)
- [x] Renamed to **The Field** (horse-racing term for the lineup of contenders)
- [x] Flashier "race card" design: tinted diagonal gradient per presenter color, big jersey numbers (#1, #2, …), bold CONTENDER / PRESENTER / BACKERS labels
- [x] **Drag-and-drop betting** with `@dnd-kit/core`: drag attendee chips from the per-track "Available" pool onto a card to place a pick; drag back to retract; one pick per attendee per track
- [x] Click `×` on a placed chip as a fallback retract (keyboard/touch-friendly)

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
- [x] **Winning Bettors** callout per track — chips for attendees who picked correctly (with 🎉) and a disclosure to see all picks with ✓/✗

## Phase 8 — Admin panel ✅
- [x] Modal dialog (Radix) with 8 sub-tabs
- [x] Welcome: title, subtitle, presenter duration
- [x] Evaluators: CRUD with color picker (auto-mirrors new evaluators into Attendees)
- [x] **Attendees**: CRUD for everyone who can place bets, with "Sync evaluators" helper
- [x] Tracks: CRUD (cascade-deletes sections + items + bets)
- [x] Sections: per-track CRUD with weight (number input)
- [x] Items: CRUD with track + presenter dropdowns (cascade-deletes related bets)
- [x] Scores: 1–5 button grid per item-section, with clear button
- [x] Data: Export JSON download (now includes attendees + bets), Import JSON, Reset to defaults

## Phase 9 — Polish ✅
- [x] Sound effects (Web Audio API tones: spin ticks, ding, reveal swoosh, fanfare). Toggle in header + `M` key.
- [x] Keyboard shortcuts: `Space` = spin / reveal next; `M` = toggle sound; `T` = cycle theme; `Esc` = close admin (Radix built-in)
- [x] String lights on race header
- [x] Active-presenter highlight rings on race lanes

## Phase 10 — Themes & visual redesign ✅
- [x] **Tri-state theme toggle** (System / Light / Dark) in header, cycles on click or `T` key
- [x] Persists in `config.theme`; "System" listens to `prefers-color-scheme` and reacts live
- [x] Tailwind v4 `@variant dark (&:where(.dark, .dark *))` for explicit toggling
- [x] Dark-mode variants across every component
- [x] Race-card visual redesign for The Field (jersey numbers, diagonal color split, bolder typography)
