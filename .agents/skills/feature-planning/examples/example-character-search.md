# Character Search Feature

**Created:** 2026-02-04
**Status:** Ready for Implementation
**Branch:** feature/character-search

---

## 1. Overview

Add a search interface to find characters by name, class, ancestry, or other attributes. Users can quickly locate characters in their collection without scrolling through lists.

**User Story:**
> As a Daggerheart player, I want to search for characters by various criteria so that I can quickly find specific characters in my collection.

**Context:**
As the number of characters grows, users need a way to filter and find specific characters without manually scrolling. This is especially important for GMs managing multiple campaign characters or players with many character builds.

**Scope:**
- **In Scope:** Name search, class/ancestry/level filters, real-time results, character cards
- **Out of Scope:** Advanced filtering (date ranges), saved searches, search history, fuzzy matching

---

## 2. Technical Approach

### Architecture Overview
Create a reusable search component that integrates with the existing character list. Use Angular signals for reactive state management and debouncing for performance. Backend API provides filtered results based on query parameters.

### Approach Selection
**Selected Approach:** Component with Service

**Why this approach:**
- Separates concerns between UI (component) and data fetching (service)
- Follows existing patterns in the codebase
- Enables reuse of search service in other contexts

**Alternatives Considered:**
| Approach | Trade-offs | Why Not Selected |
|----------|------------|------------------|
| Inline search | Simpler, but not reusable | Would duplicate logic if search needed elsewhere |
| NgRx store | More scalable, but complex | Overkill for this feature size |

### File Changes Overview

**Files to Create:**
- `src/app/characters/character-search/character-search.ts` - Search component
- `src/app/characters/character-search/character-search.html` - Search template
- `src/app/characters/character-search/character-search.css` - Search styles
- `src/app/characters/character-search/character-search.service.ts` - Search service
- `src/app/characters/character-search/character-search.spec.ts` - Tests

**Files to Modify:**
- `src/app/characters/characters.ts` - Integrate search component
- `src/app/characters/characters.html` - Add search to layout
- `docs/BACKEND_API_REFERENCE.md` - Document search endpoint

---

### Interfaces & Types

```typescript
// src/app/characters/character-search/character-search.types.ts

export interface CharacterSearchParams {
  query?: string;           // Name search
  class?: string[];         // Filter by classes
  ancestry?: string[];      // Filter by ancestries
  minLevel?: number;        // Minimum level
  maxLevel?: number;        // Maximum level
  page?: number;            // Pagination
  size?: number;            // Results per page
}

export interface CharacterSearchResult {
  id: number;
  name: string;
  class: string;
  ancestry: string;
  level: number;
  avatarUrl?: string;
}

export interface CharacterSearchResponse {
  results: CharacterSearchResult[];
  total: number;
  page: number;
  size: number;
}
```

### API Endpoints

**GET /api/characters/search**
- **Description:** Searches characters with filters
- **Auth:** Required (JWT via HttpOnly cookie)
- **Query Parameters:** `q`, `class`, `ancestry`, `minLevel`, `maxLevel`, `page`, `size`
- **Response:** `CharacterSearchResponse`
- **Errors:** 400 (invalid params), 401 (unauthorized), 500 (server error)

---

## 4. Service Implementation

### Service Structure

```typescript
// src/app/characters/character-search/character-search.service.ts

@Injectable({ providedIn: 'root' })
export class CharacterSearchService {
  private readonly http = inject(HttpClient);

  // Signal-based state
  private readonly _results = signal<CharacterSearchResult[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasResults = computed(() => this._results().length > 0);

  search(params: CharacterSearchParams): Observable<CharacterSearchResponse> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<CharacterSearchResponse>(`${API_URL}/characters/search`, {
      params: this.buildParams(params),
      withCredentials: true
    }).pipe(
      tap(response => {
        this._results.set(response.results);
        this._loading.set(false);
      }),
      catchError(error => {
        this._error.set('Unable to search. Please try again.');
        this._loading.set(false);
        return throwError(() => error);
      })
    );
  }

  clearResults(): void {
    this._results.set([]);
    this._error.set(null);
  }

  private buildParams(params: CharacterSearchParams): HttpParams {
    // Build query params from CharacterSearchParams
  }
}
```

### State Management
- `_results`: Current search results array
- `_loading`: Whether a search is in progress
- `_error`: Error message if search failed
- `hasResults`: Computed signal for conditional UI

---

## 5. Component Implementation

### Component Structure

```typescript
// src/app/characters/character-search/character-search.ts

@Component({
  selector: 'app-character-search',
  imports: [ReactiveFormsModule],
  templateUrl: './character-search.html',
  styleUrl: './character-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSearch {
  private readonly searchService = inject(CharacterSearchService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchForm = new FormControl('');
  readonly results = this.searchService.results;
  readonly loading = this.searchService.loading;
  readonly error = this.searchService.error;

  constructor() {
    this.searchForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => this.onSearch(query));
  }

  onSearch(query: string | null): void {
    if (query && query.length > 0) {
      this.searchService.search({ query }).subscribe();
    } else {
      this.searchService.clearResults();
    }
  }

  onClear(): void {
    this.searchForm.setValue('');
    this.searchService.clearResults();
  }
}
```

### User Flow
1. User types in search input
2. After 300ms debounce, search API is called
3. Results display below search bar
4. User clicks a result to navigate to character details

---

## 6. Edge Cases & Error Handling

### Error Scenarios

| Scenario | User Impact | Handling Strategy |
|----------|-------------|-------------------|
| Network failure | Cannot search | Show error message with retry button |
| Empty results | No matches found | Show "No characters found" with suggestions |
| Invalid filters | minLevel > maxLevel | Disable search, show validation error |
| Slow response | Perceived lag | Show spinner after 200ms, timeout at 10s |

### Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Empty state (no characters) | Show CTA to create first character |
| Single result | Display normally (no auto-navigate) |
| 1000+ results | Paginate with "Load more" button |
| Special characters in query | Properly escape, no injection |
| Rapid typing | Debounce cancels previous requests |

---

## 7. Testing Strategy

### Unit Tests

**Service Tests (`character-search.service.spec.ts`):**
- [ ] Test `search()` returns correct data on success
- [ ] Test `search()` sets error signal on failure
- [ ] Test `clearResults()` resets all state
- [ ] Test `buildParams()` creates correct query string

**Component Tests (`character-search.spec.ts`):**
- [ ] Test initial render shows empty search input
- [ ] Test typing triggers debounced search
- [ ] Test clear button resets form and results
- [ ] Test loading state displays spinner

### Integration Tests

- [ ] Test component-service integration for search flow
- [ ] Test error handling displays error message

### E2E Tests

- [ ] Test complete flow: type query → see results → click character
- [ ] Test filter + search combination
- [ ] Test clear all functionality

---

## 8. Implementation Phases

### Phase 1: Foundation

**Goal:** Create basic component structure and service shell

**Tasks:**
1. [ ] Create directory `src/app/characters/character-search/`
2. [ ] Create types file with interfaces - `character-search.types.ts`
3. [ ] Create service shell - `character-search.service.ts`
4. [ ] Create component shell - `character-search.ts`, `.html`, `.css`
5. [ ] Add component to characters page

**Code Examples:**
```typescript
// character-search.types.ts - Complete as shown in Section 3

// character-search.service.ts - Shell
@Injectable({ providedIn: 'root' })
export class CharacterSearchService {
  private readonly http = inject(HttpClient);
  private readonly _results = signal<CharacterSearchResult[]>([]);
  readonly results = this._results.asReadonly();
}

// character-search.ts - Shell
@Component({
  selector: 'app-character-search',
  template: `<input type="text" placeholder="Search characters..." />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSearch {}
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Component renders on characters page

---

### Phase 2: Service Layer

**Goal:** Implement complete search service with API integration

**Tasks:**
1. [ ] Implement `search()` method with HTTP call
2. [ ] Add loading and error signals
3. [ ] Implement `clearResults()` method
4. [ ] Add `buildParams()` helper
5. [ ] Write unit tests for service

**Code Examples:**
```typescript
// character-search.service.ts - Complete as shown in Section 4
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Service unit tests pass (`npm test`)
- [ ] No regression in existing tests

---

### Phase 3: Component Integration

**Goal:** Connect component to service with reactive search

**Tasks:**
1. [ ] Add FormControl with debounced valueChanges
2. [ ] Connect to search service
3. [ ] Display results from service signals
4. [ ] Add clear button functionality
5. [ ] Implement loading and error states in template

**Code Examples:**
```typescript
// character-search.ts - Complete as shown in Section 5
```

```html
<!-- character-search.html -->
<div class="search-container">
  <input
    type="text"
    [formControl]="searchForm"
    placeholder="Search characters..."
    aria-label="Search characters"
  />
  @if (searchForm.value) {
    <button (click)="onClear()" aria-label="Clear search">×</button>
  }
</div>

@if (loading()) {
  <div class="loading">Searching...</div>
}

@if (error()) {
  <div class="error" role="alert">{{ error() }}</div>
}

<div class="results" role="list">
  @for (character of results(); track character.id) {
    <div class="result-card" role="listitem">
      <span>{{ character.name }}</span>
      <span>{{ character.class }} · {{ character.ancestry }}</span>
    </div>
  }
</div>
```

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Component unit tests pass (`npm test`)
- [ ] Manual test: typing triggers search, results display

---

### Phase 4: Polish & Accessibility

**Goal:** Style component, add accessibility, ensure responsiveness

**Tasks:**
1. [ ] Style with Tailwind CSS
2. [ ] Add responsive breakpoints
3. [ ] Add ARIA labels and roles
4. [ ] Implement keyboard navigation
5. [ ] Run accessibility audit

**Phase Verification:**
- [ ] Code compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] All unit tests pass (`npm test`)
- [ ] Accessibility audit passes (aXe)
- [ ] Manual test on mobile viewport

---

## 9. Acceptance Criteria

### Specification Requirements
- [ ] User can search by character name (partial, case-insensitive)
- [ ] User can filter by class, ancestry, and level range
- [ ] Search results update in real-time with debouncing
- [ ] Clear button resets all filters and search query
- [ ] Empty state shows helpful message
- [ ] Loading state displays while fetching results
- [ ] Keyboard navigation works (tab, arrow keys, enter)
- [ ] Screen reader announces search results count

### Quality Gates
- [ ] **Linting:** All checks pass (`npm run lint`)
- [ ] **Unit Tests:** All pass, no regressions (`npm test`)
- [ ] **Integration Tests:** All pass (`npm run test:integration`)
- [ ] **E2E Tests:** All pass (`npm run test:e2e`)
- [ ] **Build:** Application builds successfully (`npm run build`)
- [ ] **Accessibility:** Passes aXe audit (WCAG AA)

### Final Verification
- [ ] Feature works on Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Error handling covers all documented scenarios
- [ ] Code review approved

---

## Appendix

### Dependencies & Blockers
- [ ] Backend search endpoint must be implemented
- [ ] Character card component should be reusable

### References
- [Character list component design]
- [Backend API requirements]
- [Issue #123: Add character search]

### Decision Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | Use service + component pattern | Follows codebase patterns, enables reuse |
| 2026-02-04 | 300ms debounce | Standard UX practice, balances responsiveness vs. API load |
