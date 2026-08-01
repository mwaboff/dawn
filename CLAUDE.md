# Project Instructions for AI Agents

This file provides instructions and context for AI coding agents working on this project.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->


## Build & Test

```bash
npm start              # Dev server at http://localhost:4200
npm run test:run       # All tests once (ALWAYS use npm scripts, never bare `npx vitest` —
                       # bare vitest picks up stray worktree copies and reports phantom failures)
npm run test:only -- src/app/features/foo/   # Tests for one directory
npm run lint           # Lint (must be green)
npm run build          # Production build (must be green)
```

**Quality gate (mandatory after any code change):** `npm run lint && npm run test:run && npm run build` — all green.

## Architecture Overview

Angular 21 (standalone components, signals, zoneless, OnPush everywhere) + Tailwind 4 + Vitest. See `AGENTS.md` for the directory map, naming conventions, and dev commands, and `.agents/rules/` for binding Angular/component-design/testing standards. Refactor state and rationale: `.plans/quality-refactor-plan.md`.

- `src/app/core/` — services, guards, interceptors (cross-cutting HTTP concerns live here, not in per-service options)
- `src/app/shared/` — reusable components, models (the API contract), mappers, pipes, utils, styles
- `src/app/features/<name>/` — lazy-loaded features; child components under `components/`
- `src/app/layout/` — navbar, footer

## Conventions & Patterns

The rules below exist because each was violated at scale once and cost a cleanup. Follow them.

### Reuse before you build (the #1 rule)

- **Before writing any UI, check `src/app/shared/components/` and the feature's `components/` directory.** The worst historical defect class here was fully-built, fully-tested components sitting unused while their markup was hand-inlined half a dozen times.
- **Never copy an existing component/stylesheet and rename it to create a variant.** Parameterize the original (inputs like `idPrefix`, `ariaLabel`, `emptyText`, projected `<ng-content>` actions). Copy-rename forks here have always silently diverged.
- When you extract a child component or shared style, **wire it in and delete the inline copy in the same commit**. An extraction that isn't adopted is dead code with misleading passing tests.

### DRY, pragmatically

- Consolidate duplication only when it's a **maintenance hazard**: the same domain rule, API contract, or user-facing copy in 2+ places that must change in lockstep.
- Benign repetition is fine and sometimes preferred — per-service HTTP query-param blocks, small empty-state markup, similar-looking-but-independent components. Do not build a generic abstraction to unify things that merely look alike. `.plans/quality-refactor-plan.md` has a binding "leave alone" list.
- Domain rules (modifier math, equip constraints, tier rules) live in exactly one `shared/utils/` or feature `utils/` module with tests. Two implementations of one game rule is a bug factory, not duplication.

### HTTP & state

- HTTP cross-cutting concerns (`withCredentials`, base URL, error normalization, 401 handling) belong in `core/interceptors/` — never per-request options or per-service boilerplate.
- The API contract is defined **once** in `shared/models/`. Features never re-declare response interfaces; they extend/`Pick`/`Partial` the shared types. Shared code must never import from `features/`.
- For fetch-and-display data, use the shared request-state helper / `rxResource` rather than hand-rolling `loading`/`error`/`data` signal triples. Every fetch must have an error state — no silent `loading`-only handlers.
- Every subscription needs teardown: `takeUntilDestroyed`, `toSignal`, or a helper that bakes it in. No bare `.subscribe()` in components.
- Type RxJS error callbacks: `error: (err: unknown) =>` and narrow before property access.
- Immutable catalog data (classes, ancestries, domain cards…) goes through the shared catalog cache — no component-local "already loaded" memo flags.

### CSS

- Design tokens first: use the `--color-*`/`--font-*` variables (and alpha variants) from `src/styles.css` — no hard-coded hex/rgba literals for palette colors.
- Reuse `src/app/shared/styles/` (buttons, forms, roster, panels, page shells) before writing component CSS. Never redeclare a global class name (`.btn`, `.form-input`, `.panel`) locally with different values.
- **Encapsulation specificity rule:** a component-level rule always beats a global one. Migrating onto a shared class requires deleting the component's copy in the same commit, or the global silently loses.
- Keep component CSS under the 4 kB budget warning; a breach usually means dead rules or a missing shared style.

### Components

- Size thresholds and decomposition triggers: `.agents/rules/component-design.md` (~150 TS lines / ~80 template lines). Extract when a template section has independent state or the same block appears twice.
- Never duplicate a template block across `@if`/`@switch` branches — parameterize one block or extract a child.
- Lists of links/nav items are data (`@for` over a constant), never enumerated twice for desktop/mobile.
- Route paths referenced in code (e.g. building share URLs) derive from route constants, never re-typed string literals.

### Deleting is a feature

- Dead code is removed, not kept "just in case" — git history is the archive. This includes unused components, unreferenced CSS rules, uncalled methods, and unbound inputs.
- Don't ship half-built UI behind nothing (no dead inputs/handlers "for later") — file a bd issue instead.
