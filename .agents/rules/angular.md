---
globs:
  - "src/**/*.ts"
  - "src/**/*.html"
  - "src/**/*.css"
paths:
  - "src/**/*.ts"
  - "src/**/*.html"
  - "src/**/*.css"
trigger: glob
---

# Angular & TypeScript Standards

## TypeScript
- Strict type checking; prefer type inference when obvious
- Never use `any` — use `unknown` when type is uncertain

## Angular Rules

**MUST:**
- Use standalone components (do NOT set `standalone: true` — it's the default in Angular v21)
- Use `changeDetection: ChangeDetectionStrategy.OnPush` on all components
- Use `input()` / `output()` functions instead of `@Input` / `@Output` decorators
- Use `inject()` for dependency injection instead of constructor injection
- Use signals for state, `computed()` for derived state
- Use `update()` or `set()` on signals (never `mutate`)
- Use native control flow (`@if`, `@for`, `@switch`) in templates
- Use `NgOptimizedImage` for all static images (not for inline base64)
- Use Reactive forms (not template-driven)
- Lazy-load all feature routes with `loadComponent`
- Check `isPlatformBrowser()` before accessing browser APIs (`window`, `document`)
- Pass all AXE checks and meet WCAG AA (focus management, color contrast, ARIA)

**MUST NOT:**
- Use `@HostBinding` / `@HostListener` — use `host: {}` in decorator instead
- Use `ngClass` / `ngStyle` — use `class` / `style` bindings instead
- Use `*ngIf` / `*ngFor` / `*ngSwitch` — use `@if` / `@for` / `@switch`
- Write arrow functions in templates (unsupported)
- Assume globals like `new Date()` are available in templates

## Component Pattern

```typescript
@Component({
  selector: 'app-feature',
  imports: [ReactiveFormsModule],
  templateUrl: './feature.html',   // Relative paths
  styleUrl: './feature.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class Feature {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly authService = inject(AuthService); // readonly = template-accessible

  // Signals: private readonly for state, computed for derived
  private readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  // Reactive forms: nonNullable group
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
  });
}
```

## Service Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly http = inject(HttpClient);
  private readonly state = signal<Data | null>(null);
  readonly data = computed(() => this.state());
}
```

## Routing Pattern

```typescript
// Lazy-loaded routes with functional guards
{
  path: 'feature',
  loadComponent: () => import('./feature/feature').then(m => m.Feature)
}
{
  path: '',
  canActivateChild: [authSessionGuard],
  children: [...]
}
```

## API Integration

- JWT auth in HttpOnly cookies — always include `{ withCredentials: true }`
- Pagination: `page` and `size` query params (default: page 0, size 20)
- Use `expand` query param for related objects
- Define request/response interfaces in the service file
- See `docs/BACKEND_API_REFERENCE.md` for endpoints
