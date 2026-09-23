# AGENTS.md — Contributor Guide for AI Coding Agents

iLmi is a macOS/iOS simulator (Next.js 15 App Router, React 18, Zustand, Tailwind v4)
that doubles as an interactive portfolio. Companion docs: `.cursorrules` (performance),
`CODE_QUALITY_PLAN.md` + `CODE_QUALITY_AUDIT.md` (decided history — read before refactoring).

## 0. Toolchain & gates

- Runtime: Node 22, pnpm 11 locally (CI uses pnpm 9 + Node 22, lockfile v9 — keep it that way).
- Gates, in this order (never run `build` concurrently with `tsc` — it resets `.next/` mid-check):
  `pnpm exec tsc --noEmit --incremental false` → `pnpm lint` (zero warnings)
  → `pnpm test` → `pnpm build`
- Browser tests: `PLAYWRIGHT_EDGE_EXE` must point at the on-disk Edge build, then
  `pnpm exec playwright test`. Desktop apps launch via dock (`Launch X`) or desktop
  icons (`Open X`, usually double-click). Each test gets a fresh browser context.
- Coverage (`@vitest/coverage-v8`) is report-only. No global % gate, ever.
  Behavior assertions beat line-chasing; leave unreachable defensive guards alone.

## 1. How to change code here

- Smallest diff that fixes the behavior. One task, one focused change; no drive-by refactors.
- Never change runtime behavior "while you're at it". If a behavior must change,
  say so explicitly and cover it with a test first (red → green, e.g. `filesync.spec.ts`).
- Formatting is not a task: several files predate Prettier config drift. Do not
  reformat whole files; match surrounding style. Never mix formatting with behavior fixes.
- Stage only intended files. `git status` routinely shows phantom modifications
  (line-ending stat noise with zero content diff) — verify with `git diff --numstat`
  and stage by path. Never commit, stash, or push without explicit permission.
- Commit style: `feat|fix|docs|test|chore(scope): concise imperative summary`.

## 2. Data integrity (non-negotiable)

- Distinguish **absent** (seed defaults), **valid-empty** (`[]` is legal, never reseed),
  **invalid** (render defaults but leave the stored payload untouched), and
  **unavailable/throwing** (report failure, never claim success).
- `save*` must return an observable boolean; callers surface failure in UI
  (dialog stays open, banner, draft preserved) — never silent-save.
- Legacy migration: write to the new key, **re-read to verify**, only then remove
  the old key. Known pairs: `notes`→`ilmi:notes:v1`, `fileSystem`→`ilmi_file_system`,
  old wallpapers→`.webp` (+ settings v1 schema).
- Same-document views do NOT get native `storage` events. After a successful
  `saveFileSystem`, notify via `subscribeFileSystemChanged` (`ilmi:filesystem-changed`).

## 3. Type safety

- `strict` + `noUncheckedIndexedAccess` are ON. Keep them green; never loosen config
  to silence errors.
- Index access needs a guard or a justified fallback: early-return on missing touch
  (`if (!touch) return`), `?.`/`??` on lookups. A `??` fallback must be provably
  unreachable at runtime — say so in a one-line comment.
- No `as unknown as` casts to paper over nullability; no `!` non-null assertions.
  Honest return types (`string | null | undefined`) over convenient lies.
- Prefer extracting pure, JSX-free helpers (e.g. `parseTerminalInput`,
  `resolveInitialNotes`, `componentNames.ts`) so logic is unit-testable without React.

## 4. Testing rules

- Unit (vitest, node env): mock `window`/`localStorage` per file (see `storage.test.ts`);
  restore in `afterEach`. Stores via `getState`/`setState`, no mounting.
- Browser (Playwright + Edge): scope locators per app (`.finder`, `.files-app`,
  `.clock-app`, `.terminal`); assert computed values (colors, fonts), not class names,
  except for utility presence (`pb-safe` rule scan pattern in `theme-visual.spec.ts`).
- New UI behavior needs a browser test; new pure logic needs unit tests.
  Touch the visual baselines only when the design intentionally changed.

## 5. UI, theme, styling

- The app toggle owns dark mode via `.dark` — never follow the OS preference.
  Verify both directions (OS light + app dark, OS dark + app light).
- Custom colors (`text-ios-blue`, Clock `#ff9f0a`) must render identically under both
  app themes; Terminal must keep a real `font-mono` stack (nothing may override
  font inheritance — the old `* { font-family }` bug).
- Bottom-anchored bars need a safe-area utility (`.pb-safe` / `.safe-area-bottom`);
  `env()` resolves to 0 on desktop, so assert rule presence, not pixels.
- Every modal dialog: focus trap + focus return to trigger + Escape to close.
  Use real `<button>`s with labels; keep `aria-hidden` on decorative icons.

## 6. Explicitly DO NOT

- No framework rewrites, no Zustand replacement, no class hierarchies for SOLID's sake.
- No shared slider/theme/store abstractions, no file-length limits, no hook-everything,
  no logger wrapper, no schema-migration-by-version-bump, no backend/auth/sync.
- No speculative perf work: measure on production builds first; lab numbers need a
  real-device cross-check before they justify changes.
- Do not "unify" palettes, cadences, or per-app rules that may be intentional.
  Difference is not duplication.

## 7. When stuck

Prefer asking the owner over guessing: product decisions (mock vs real hierarchy,
eviction vs refuse-to-save, shell-switch state policy) live with them, and real-device
checks (camera/mic, physical touch, screen reader, background throttling) cannot be
done headless — write the browser test, note the device gap, move on.
