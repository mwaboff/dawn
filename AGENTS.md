This is a website called Oh Sheet. This is the front-end for a site that provides tools for Daggerheart players. You can create Characters, level them up, and run games.

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

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
│   ├── app.ts              # Root component
│   ├── app.config.ts       # Application configuration
│   ├── app.routes.ts       # Routing configuration
│   ├── app.html            # Root template
│   └── app.css             # Root component styles
├── main.ts                 # Bootstrap entry point
├── styles.css              # Global styles (Tailwind import)
└── index.html              # HTML entry point
docs/
└── BACKEND_API_REFERENCE.md # API documentation
```

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v21.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## API Integration

- Backend uses JWT authentication stored in HttpOnly cookies
- Include credentials in all HTTP requests: `{ withCredentials: true }`
- Use HTTP interceptors for auth handling and 401 redirects
- Pagination uses `page` and `size` query parameters (default: page 0, size 20)
- Use `expand` query param to include related objects in responses
- See `docs/BACKEND_API_REFERENCE.md` for endpoint details

## Testing

- Use Vitest for unit tests (run with `npm test`)
- Test files use `.spec.ts` suffix
- Use `TestBed.configureTestingModule()` for component setup
- Import standalone components directly in test configuration
