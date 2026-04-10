This is a website called **Oh Sheet** — a front-end for tools that help Daggerheart players create Characters, level them up, and run games.

## Critical Considerations

**MANDATORY:** After all code changes, you MUST validate tests are successful (all green), lint checks are successful (all green), and the application builds successfully.

## Technology Stack

- **Angular** 21.1.0 (standalone components, signals)
- **TypeScript** with strict configuration (ES2022 target)
- **Tailwind CSS** 4.1.12 via `@tailwindcss/postcss`
- **Vitest** 4.0.8 for unit testing
- **Backend API** at `http://localhost:8080/api` (see `docs/BACKEND_API_REFERENCE.md`)

## Project Structure

```
src/
├── app/
│   ├── app.ts / app.config.ts / app.routes.ts / app.html / app.css
│   ├── core/
│   │   ├── services/    # Shared services (auth.service)
│   │   └── guards/      # Route guards (auth-session.guard)
│   ├── features/
│   │   ├── auth/        # Authentication UI (login/signup)
│   │   ├── home/        # Home page
│   │   └── create-character/  # Character creation
│   ├── shared/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── daggerheart-card/
│   │   │   │   └── card-feature-item/  # Child component
│   │   │   ├── card-skeleton/
│   │   │   ├── card-error/
│   │   │   └── card-selection-grid/    # Loading + error + card grid pattern
│   │   ├── models/           # Shared TypeScript interfaces
│   │   │   └── api.model.ts  # PaginatedResponse, etc.
│   │   └── utils/            # Pure utility functions
│   │       └── text.utils.ts # escapeAndFormatHtml, etc.
│   └── layout/
│       ├── navbar/      # Navigation component
│       └── footer/      # Footer component
├── main.ts              # Bootstrap entry point
├── styles.css           # Global styles (Tailwind import)
└── index.html           # HTML entry point
docs/
└── BACKEND_API_REFERENCE.md  # Use when implementing backend integration
```

Each feature directory follows: `{feature}.ts`, `{feature}.html`, `{feature}.css`, `{feature}.spec.ts`

## Development Commands

```bash
npm start                                   # Dev server at http://localhost:4200
npm test                                    # All tests (watch mode)
npm run test:run                            # All tests once (no watch)
npm run test:only -- src/app/layout/navbar/  # Tests for a specific directory
npm run test:coverage                       # Tests with coverage report
npm run lint                                # Lint entire project
npm run lint:only -- 'src/app/layout/navbar/**'  # Lint a specific component
npm run lint:fix                            # Lint and auto-fix
npm run build                               # Production build (outputs to dist/)
```

## Naming Conventions

### Files
- Components: `{feature}.ts`, `{feature}.html`, `{feature}.css`
- Services: `{feature}.service.ts` | Guards: `{feature}.guard.ts` | Tests: `{feature}.spec.ts`
- Utilities: `{name}.utils.ts` | Models: `{name}.model.ts` or `{name}-api.model.ts` | Mappers: `{name}.mapper.ts`

### Code
- **Access modifiers**: `readonly` for template-accessed injections, `private` for internals, `private readonly` for signal state
- **Signals**: descriptive nouns (`mobileDrawerOpen`, `currentUser`); computed: predicates (`isLoggedIn`, `isScrolled`)
- **Methods**: handlers `on{Event}()`, toggles `toggle{Feature}()`, setters `{verb}{Feature}()`
- **Navigation**: always close dropdowns/modals before `router.navigate()`
- **Comments**: Do not add large section/banner comments (e.g., `/* ========== Section ========== */` or `// --- Section ---`). Keep comments minimal and only where logic isn't self-evident.
- **Utility functions**: pure functions in `shared/utils/{name}.utils.ts` with corresponding `{name}.utils.spec.ts`
- **Model files**: interfaces/types in `models/{name}.model.ts`; constants (lookup maps, config arrays) alongside their related types
- **Child components**: nested under parent's `components/` directory; if reused across 2+ features, promote to `shared/components/`

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
