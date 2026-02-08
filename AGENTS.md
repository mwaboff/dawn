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

### Code
- **Access modifiers**: `readonly` for template-accessed injections, `private` for internals, `private readonly` for signal state
- **Signals**: descriptive nouns (`mobileDrawerOpen`, `currentUser`); computed: predicates (`isLoggedIn`, `isScrolled`)
- **Methods**: handlers `on{Event}()`, toggles `toggle{Feature}()`, setters `{verb}{Feature}()`
- **Navigation**: always close dropdowns/modals before `router.navigate()`
