# Oh Sheet

A front-end application providing tools for Daggerheart players. Create characters, level them up, and run games.

Built with Angular 21, TypeScript, and Tailwind CSS.

## Prerequisites

- Node.js (with npm)
- Backend API running at `http://localhost:8080/api` (see `docs/BACKEND_API_REFERENCE.md`)

## Getting Started

```bash
npm install
npm start
```

The dev server runs at `http://localhost:4200` and hot-reloads on file changes.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at http://localhost:4200 |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run watch` | Development build in watch mode |
| `npm test` | Run all tests (watch mode) |
| `npm run test:run` | Run all tests once (no watch) |
| `npm run test:only -- src/app/navbar/` | Run tests for a specific component |
| `npm run test:coverage` | Run all tests with coverage report |
| `npm run lint` | Lint entire project |
| `npm run lint:only -- 'src/app/navbar/**'` | Lint a specific component |
| `npm run lint:fix` | Lint and auto-fix issues |

### Targeting Individual Components

Both `test:only` and `lint:only` accept paths after `--`:

```bash
# Testing
npm run test:only -- src/app/auth/
npm run test:only -- src/app/create-character/
npm run test:only -- src/app/home/

# Linting
npm run lint:only -- 'src/app/auth/**'
npm run lint:only -- 'src/app/create-character/**'
npm run lint:only -- 'src/app/home/**'
```
