# References Page Redesign — The Codex

**Date:** 2026-04-10
**Branch:** `implementing_reference_search`
**Status:** Design plan (pre-implementation)

## 1. Goal

Replace the current category-first compendium at `/reference` with a **search-first experience** that uses the new `GET /api/search` endpoint. Search is the primary input, but **browse remains a first-class fallback** for users who want to flip through everything of a given type. Per-type filters appear contextually in a left rail. Aesthetic direction: **"The Codex"** — a scholar's reference tome that extends the existing warm-tavern palette.

## 2. Confirmed Decisions

| Decision | Choice |
|---|---|
| Search model | **Hybrid**: mixed grouped results by default; promotes to focused single-type view when narrowed |
| Aesthetic | **Scholar's codex** — parchment result panel on dark wood, leather-tab type facets, wax-seal result badges |
| Filter layout | **Left rail** on desktop (260px sticky); slide-up "Refine" sheet on mobile |
| Result cards | **Full-width single-column `DaggerheartCard`** (and `AdversaryCard` for adversaries) in **all** states, matching the current reference page's `wide` layout — no condensed rows, no multi-column grids |

## 3. View States

The page has one template. Two orthogonal axes drive what's shown:

- **Data source axis** — `search` (query present) vs `browse` (query empty). Search uses `/api/search`; browse uses the per-type list endpoints.
- **Scope axis** — `mixed` (no single type selected, "All" active) vs `focused` (one type selected).

This yields four combinations, but only three are valid page states:

| Scope \ Source | Search (`q` present) | Browse (`q` empty) |
|---|---|---|
| **Mixed** | §3.1 Mixed Search | §3.3 Landing (no type, no query) |
| **Focused** | §3.2 Focused Search | §3.4 Focused Browse |

### 3.1 Mixed Search (query present, "All" tab active)

- Results grouped by `SearchableEntityType`, sections ordered by the **highest relevance score** in each group (so if the top hit is a weapon, WEAPONS appears first).
- Each section shows an **illuminated-capital header** (Cinzel, gold, large first letter overlapping a hairline rule) + the type name + match count.
- Each section renders up to **5 full-width cards** (real `DaggerheartCard` / `AdversaryCard` — same components used elsewhere).
- Below the 5 cards in a section: a **"View all 12 weapons ▸"** link that promotes the page to focused search for that type.
- Only **universal filters** are available in the left rail: `tier`, `expansion`, `isOfficial`. Type-specific filters are hidden because they'd only apply to a subset of the mixed results.

### 3.2 Focused Search (query present, single type selected)

Triggered by:
- Clicking a type facet tab while a query is present
- Clicking "View all N ▸" at the bottom of a section in mixed search
- Applying a type-specific filter (e.g. picking Trait = Agility auto-scopes to Weapons)

In this mode:
- Section headers disappear. Cards become a single vertical stream with full pagination at the bottom.
- Left rail expands to reveal **type-specific filters** for the active type (e.g. for WEAPON: tier, trait, range, burden, expansion, isOfficial).
- An "← All types" breadcrumb appears above the results so the user can return to mixed search.

### 3.3 Landing (no type, no query)

The initial view when the user first lands on `/reference`. Everything below the search panel is the **type onboarding grid** — 11 large tappable cards, one per browsable type, with short descriptive taglines:

- _Weapons — Swords, bows, and the weight they leave behind._
- _Adversaries — Creatures and foes the GM can unleash._
- _Domain Cards — Abilities and spells drawn from the twelve domains._
- …etc.

The left filter rail is hidden in this state (no results to filter yet). Typing in the search bar transitions to §3.1 Mixed Search. Clicking a type card transitions to §3.4 Focused Browse for that type.

### 3.4 Focused Browse (query empty, single type selected)

The "just show me everything" state. Reached by clicking a landing type card, by clicking a facet tab while the query is empty, or by clearing the query while a type is already focused.

- Data source is the existing per-type list endpoint (e.g. `GET /api/dh/weapons`), routed through the new `CodexBrowseService`. **No call to `/api/search`** — that endpoint requires a non-empty `q`.
- Visually identical to §3.2 Focused Search: single stream of full-width cards, pagination, type-specific filter rail, "← All types" breadcrumb. The only difference is the data source and the absence of a `q`.
- The search input shows a contextual placeholder: _"Search within weapons…"_. Typing transitions to §3.2 Focused Search (same type, now with a query).
- All type-specific filters work the same way — they're passed as query params to the per-type list endpoint rather than `/api/search`. The per-type endpoints already support the relevant filter set (see §9).
- "← All types" returns to §3.3 Landing.

### State transitions diagram

```
                  ┌──────────────────────┐
                  │  §3.3  Landing       │
                  │  (no q, no type)     │
                  └──┬───────────────┬───┘
             type    │               │    type query
             card    │               │    in search
                     ▼               ▼
        ┌─────────────────┐   ┌─────────────────┐
        │ §3.4  Focused   │◀──│ §3.1  Mixed     │
        │      Browse     │   │      Search     │
        │  (no q, type)   │   │  (q, no type)   │
        └──┬────────────┬─┘   └─────┬───────────┘
      type │            │ type      │ type facet
      cleared           │ facet     │ or "view all"
           │            │ w/ query  │
           ▼            ▼           ▼
      §3.3 Landing   ┌─────────────────┐
                     │ §3.2  Focused   │
                     │      Search     │
                     │  (q, type)      │
                     └─────────────────┘
```

## 4. Page Anatomy (desktop, top to bottom)

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ℜ The Codex                                                        ║   <- Cinzel header w/ illuminated ℜ
║   Search the archives of adversaries, artifacts, & ancient lore.     ║   <- Lora italic subtitle
║                                                                      ║
║   ┌─────────────────────────────────────────────────────────────┐   ║
║   │ ✒  flame sword                                        ⌘ K   │   ║   <- Parchment search panel
║   └─────────────────────────────────────────────────────────────┘   ║      (see §5)
║                                                                      ║
║   ╭─ All(17) ─╮╭ Weapons(4) ╮╭ Adversaries(2) ╮╭ Features(3) ╮…     ║   <- Leather-tab type facets
║     ◆ tier:2 ×   ◆ expansion:Core ×    [ Clear all ]                ║   <- Active filter chips
║                                                                      ║
║  ┌─ REFINE ────┐  ┌─ RESULTS ─────────────────────────────────────┐ ║
║  │             │  │                                                │ ║
║  │  Tier       │  │  ℑ  WEAPONS  ·  4 matches                      │ ║   <- Section header
║  │  □ 1        │  │  ─────────────────────────────────────         │ ║
║  │  ■ 2        │  │                                                │ ║
║  │  □ 3        │  │  ┌──────────────────────────────────────┐     │ ║
║  │             │  │  │  [DaggerheartCard: Flame Sword]      │     │ ║   <- Full-width existing card
║  │  Expansion  │  │  └──────────────────────────────────────┘     │ ║
║  │  ▾ All      │  │  ┌──────────────────────────────────────┐     │ ║
║  │             │  │  │  [DaggerheartCard: Drake's Fang]     │     │ ║
║  │  □ Official │  │  └──────────────────────────────────────┘     │ ║
║  │    only     │  │  … up to 5                                     │ ║
║  │             │  │  View all 4 weapons ▸                          │ ║   <- Promote to focused
║  │             │  │                                                │ ║
║  │             │  │  ℵ  ADVERSARIES  ·  2 matches                  │ ║
║  │             │  │  ─────────────────────────────────────         │ ║
║  │             │  │  ┌──────────────────────────────────────┐     │ ║
║  │             │  │  │  [AdversaryCard: Flame Drake]        │     │ ║
║  │             │  │  └──────────────────────────────────────┘     │ ║
║  │             │  │  …                                             │ ║
║  └─────────────┘  └────────────────────────────────────────────────┘ ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

Layout grid: `max-width: 1400px`, `grid-template-columns: 260px 1fr`, 32px column gap. Rail is `position: sticky; top: 96px;`. Cards occupy the full width of the results column.

## 5. The Search Panel (the one thing people remember)

This is the focal point, and the piece that earns "The Codex" identity. Specifics:

- A single panel, `background: var(--color-parchment)` with subtle paper grain (use existing `.grain-overlay` technique), dropping a warm shadow onto the dark wood background.
- Inside: a large bare-bones input, Lora italic, ~1.25rem, no visible border, generous padding. A quill glyph (pseudo-element or inline SVG) sits left-aligned to the input. Placeholder reads _"Search the archives…"_.
- Right side of the panel shows a small `⌘K` / `Ctrl+K` hint, rendered as a gold-outlined pill. **Global hotkey**: from anywhere on the page, `⌘K` / `Ctrl+K` focuses this input.
- Below the input, **inside the same parchment panel**, a thin hairline rule separates the input from the active-filter chip row. Chips are small wax-seal-style badges (circular gold-outlined, dark fill, type name).
- When the input is focused, a subtle inner gold hairline appears; no glow, no gradient.
- **No debouncing gimmickry**: use a 250ms debounce on input → search. Treat blank input as "show nothing" (see §6 empty states).

## 6. States

| State | Treatment |
|---|---|
| **Landing (no q, no type)** | §3.3 — search panel centered; below it, the 11-type onboarding grid. No results area, no filter rail. Typing → §3.1 Mixed Search. Clicking a type card → §3.4 Focused Browse. |
| **Typing (< 3 chars)** | Hold previous results. Show "Keep typing…" subtle hint. Don't hit `/api/search` on 1-2 char queries. (Browse mode is unaffected — browse fires immediately on type selection.) |
| **Loading** | Existing `CardSkeleton` placed in the results column. Mixed view shows 3 skeletons (one per imagined section); focused view shows 6. Dim the left rail slightly (not disable — filter changes should cancel + reissue). |
| **Results** | As described in §3. |
| **Empty results (search)** | Inside the parchment results panel: Lora italic, _"The archives fall silent. No matches for 'xyzzy'."_ Below it, a "Try clearing filters" button if any filters are active. |
| **Empty results (browse)** | Only possible if filters are aggressive enough to exclude everything. Same parchment panel: _"No weapons match these filters."_ + "Clear filters" button. |
| **Error** | Reuse existing `.error-banner` style but wrap it in the parchment surface so it doesn't feel like a browser alert. Both search and browse share this treatment. |

## 7. Aesthetic Details

### Color (extends existing `src/styles.css` palette)

No new brand colors. Add **two new tokens** derived from the palette so existing CSS isn't polluted:

```css
:root {
  /* Existing (unchanged): --color-bg-dark, --color-accent, --color-parchment, --color-wood, ... */

  /* New — Codex page only */
  --color-parchment-shadow: oklch(from var(--color-parchment) 0.72 c h);  /* soft sepia ink */
  --color-seal-wax: oklch(from var(--color-accent) 0.48 0.12 h);          /* deeper gold for seals */
}
```

### Type facet tabs ("leather tabs")

- Rendered as `<button>` elements styled like the edge-tabs of a book. Inactive tabs: `background: var(--color-wood)`, thin gold top border, slightly lower top-position so they look "behind" the active tab. Active tab: `background: var(--color-parchment)` with gold border continuous to the results surface below (no visible seam — it should feel like the active tab "is the page").
- This is a pure CSS trick: `margin-bottom: -1px` on the tab strip, matching `border-bottom-color` on active tabs.
- Scrollable horizontally on narrow viewports with a fading gradient mask on the right edge.

### Section headers (illuminated capitals)

```
ℑ  WEAPONS · 4 matches
─────────────────
```

- The first letter is set in Cinzel at ~3rem, gold, dropped into the line with negative margin so it overlaps the bottom hairline.
- Type name in Cinzel 1.1rem uppercase letter-spacing 0.1em.
- Match count in Lora italic, sepia.
- The hairline is a gradient `linear-gradient(to right, var(--color-accent), transparent)`.

### Wax-seal result badge

- Each result card keeps its existing design. The type is surfaced via a small 32×32 circular "seal" pinned to the top-right corner of the card wrapper (not the card itself — added by the reference page, not DaggerheartCard):
  - `background: var(--color-seal-wax)`, `border: 1px solid var(--color-accent)`, a single decorative glyph inside in Cinzel at ~1.25rem.
  - `filter: drop-shadow(0 2px 0 rgba(0,0,0,.4))`.
- Glyph set (one per type):

  | Type | Glyph | Unicode | Meaning |
  |---|---|---|---|
  | Weapon | ⚔ | U+2694 | Crossed swords |
  | Armor | ⛨ | U+26E8 | Shield |
  | Loot | ◈ | U+25C8 | Treasure lozenge |
  | Adversary | ☗ | U+2617 | Tower / fortress |
  | Feature | ✦ | U+2726 | 4-point star (spark of ability) |
  | Companion | ❦ | U+2766 | Floral heart |
  | Class | ⚜ | U+269C | Fleur-de-lis (calling) |
  | Domain | ⬢ | U+2B22 | Hexagon (territory) |
  | Domain Card | ✧ | U+2727 | Small 4-point star |
  | Ancestry Card | ❀ | U+2740 | Flower (lineage / roots) |
  | Community Card | ⧫ | U+29EB | Diamond (gathering) |
  | Subclass Card | ✺ | U+273A | Ornate sun (specialization) |

  These glyphs render in serif fonts natively — no icon pack needed. If any render poorly in Cinzel during implementation, substitute with a sibling from the same Unicode block and note it in the implementation issue.
- The seal **only appears in mixed view** (where it aids scanning across types). In focused view it's redundant and hidden.

### Motion

- On mode switch (mixed → focused), use a `View Transitions API` cross-fade if available, else a 200ms opacity fade on the results column only (header and rail don't move).
- Section headers reveal with a 100ms staggered fade-up on initial search completion (`transform: translateY(4px) → 0`, `opacity: 0 → 1`). Respect `prefers-reduced-motion`.
- No bounces. No glows.

### Typography

- Header: Cinzel 2.75rem clamp, tracking tightly
- Subtitle: Lora italic 1rem, sepia
- Section headers: Cinzel 1.1rem uppercase
- Card content: unchanged (inherited from DaggerheartCard)
- Search input: Lora italic 1.25rem

## 8. Component Architecture

The current `Reference` component is 382 lines with 10 injected services and a 250-line `switch` in `fetchCards`. This redesign **consolidates that logic behind two services** — `SearchService` for search, `CodexBrowseService` for browse — and replaces the parent's dispatch with a small "which source do I call?" decision. Target: parent `Reference` component under 140 lines.

### New file layout

```
src/app/features/reference/
├── reference.ts                    (page container, < 140 lines)
├── reference.html
├── reference.css
├── reference.spec.ts
├── models/
│   └── search.model.ts             (SearchableEntityType, SearchFilters, typeLabels, typeGlyphs, etc.)
├── services/
│   └── codex-browse.service.ts     (NEW — wraps per-type list endpoints behind a unified interface)
├── mappers/
│   └── search-result.mapper.ts     (NEW — dispatches SearchResultResponse to existing per-type mappers)
└── components/
    ├── codex-search-bar/           (§5 — parchment search panel + ⌘K hotkey + active chips)
    ├── type-facet-tabs/            (§7 — leather-tab strip)
    ├── filter-rail/                (left rail; renders universal OR type-specific filter set)
    ├── result-section/             (illuminated header + 5-card group + "View all" link)
    ├── landing-type-grid/          (§3.3 — 11 type onboarding cards)
    ├── codex-empty-state/          (no-results states for both search and browse)
    └── codex-skeleton/             (skeleton for mixed / focused modes; wraps existing CardSkeleton)

src/app/shared/services/
└── search.service.ts               (NEW — single /api/search client)
```

### Parent `Reference` responsibilities

- Hold signals: `query`, `activeType`, `filters`, `currentPage`, plus result/loading/error signals.
- Expose a `viewMode` computed: `'landing' | 'mixedSearch' | 'focusedSearch' | 'focusedBrowse'`.
- React to input changes with an `effect()` that dispatches on `viewMode`:
  - `landing` → no fetch
  - `mixedSearch` / `focusedSearch` → `SearchService.search(...)` (debounced)
  - `focusedBrowse` → `CodexBrowseService.browse(type, filters, page)` (immediate)
- Handle facet selection, filter auto-promotion, "view all" clicks, and transitions back to landing.

### Services

**`SearchService`** (new, in `src/app/shared/services/`):

```ts
@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);

  search(params: SearchParams): Observable<SearchResponse> {
    let httpParams = new HttpParams().set('q', params.q).set('expand', 'all');
    if (params.types?.length) httpParams = httpParams.set('types', params.types.join(','));
    if (params.tier != null) httpParams = httpParams.set('tier', String(params.tier));
    if (params.trait) httpParams = httpParams.set('trait', params.trait);
    // … all 14 filters from search-api.md
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 20));

    return this.http.get<SearchResponse>(
      `${environment.apiUrl}/search`,
      { params: httpParams, withCredentials: true },
    );
  }
}
```

We pass `expand=all` (not `entity`) so each result's `expandedEntity` field is populated with the most detailed DTO the search endpoint can produce. The `search-result.mapper.ts` dispatches on `result.type` and calls the existing per-type mappers (`mapWeaponResponseToCardData`, etc.) so we reuse the same `DaggerheartCard` / `AdversaryCard` components unchanged.

⚠ **Verification required in phase 1.** The search-api.md docs state that `expand=entity` and `expand=all` both "include full entity response DTOs" but do not explicitly confirm whether `expand=all` also triggers **nested expansion** (features → costTags, modifiers; weapon → expansion). The existing `WeaponService` requests `expand=expansion,features,costTags,modifiers` to get the rich data the tiles need. If `expand=all` on search does not include these nested objects, the Codex tiles will render with **empty feature lists** — a regression from the current reference page.

**Action (phase 1):** Make a live API call against a local backend with a query that returns a weapon and inspect `expandedEntity`. Confirm that `features` (not just `featureIds`), `costTags`, `modifiers`, and `expansion` are all populated. If they are not:

1. File a backend beads issue to extend search's `expand` parameter to support comma-separated sub-field expansion like the per-type endpoints (preferred fix).
2. Until backend ships that, add a hydration step in `SearchService`: after search returns, for each result call the per-type `GET /{id}?expand=expansion,features,costTags,modifiers` in parallel to fill in the missing nested data. This keeps visual parity at the cost of N+1 requests per page.

Do not ship phase 1 without either (a) confirming `expand=all` returns nested data, or (b) implementing the hydration fallback and filing the backend issue.

**`CodexBrowseService`** (new, in `src/app/features/reference/services/`):

```ts
@Injectable({ providedIn: 'root' })
export class CodexBrowseService {
  private readonly weaponService = inject(WeaponService);
  private readonly armorService = inject(ArmorService);
  private readonly lootService = inject(LootService);
  private readonly adversaryService = inject(AdversaryService);
  private readonly classService = inject(ClassService);
  private readonly ancestryService = inject(AncestryService);
  private readonly communityService = inject(CommunityService);
  private readonly domainService = inject(DomainService);
  private readonly subclassService = inject(SubclassService);
  private readonly companionService = inject(CompanionService);
  // + feature service once it exists

  browse(
    type: BrowsableType,
    filters: Record<string, unknown>,
    page: number,
  ): Observable<BrowseResult> {
    switch (type) {
      case 'WEAPON':
        return this.weaponService
          .getWeapons({ page, ...filters })
          .pipe(map(r => ({ cards: r.cards, adversaries: [], totalPages: r.totalPages })));
      case 'ADVERSARY':
        return this.adversaryService
          .getAdversaries({ page, ...filters })
          .pipe(map(r => ({ cards: [], adversaries: r.adversaries, totalPages: r.totalPages })));
      // … one case per browsable type
    }
  }
}
```

`BrowseResult` has the same shape as what the search-result mapper produces, so the `Reference` component can feed both sources into one render pipeline.

**Why a wrapper service instead of injecting the per-type services directly into `Reference`?** The old `Reference` component had 10 injections and a 250-line switch — this plan pulls that dispatch one level down into `CodexBrowseService`. Parent stays lean; per-type service knowledge is isolated to one file that can grow without touching the page component. Existing per-type services and their mappers are **not** deleted — they're legitimately reused by character creation and now by browse mode.

### Filter parameter compatibility

Every type-specific filter in the new left rail needs to round-trip through **both** sources:

| Filter | `/api/search` param | Per-type endpoint param |
|---|---|---|
| `tier` | `?tier=2` | `?tier=2` (weapons, armor, loot, adversaries, cards) |
| `trait` | `?trait=AGILITY` | `?trait=AGILITY` (weapons) |
| `range` | `?range=MELEE` | `?range=MELEE` (weapons) |
| `burden` | `?burden=ONE_HANDED` | `?burden=ONE_HANDED` (weapons, armor) |
| `adversaryType` | `?adversaryType=BOSS` | `?adversaryType=BOSS` (adversaries) |
| `isOfficial` | `?isOfficial=true` | `?isOfficial=true` (all) |
| `isConsumable` | `?isConsumable=true` | `?isConsumable=true` (loot) |
| `expansionId` | `?expansionId=3` | `?expansionId=3` (all) |

The existing per-type services already expose most of these (see `weapon.service.ts`, `adversary.service.ts`, `loot.service.ts`). Audit the per-type services during phase 1; if any filter is supported by the endpoint but not exposed by the service, add it there.

## 9. API & Edge Cases

- **Empty query**: `/api/search` returns 400 if `q` is blank, so we **never call it without a query**. When `q` is empty and a type is selected (landing → focused browse), the page routes through `CodexBrowseService` which calls the existing per-type list endpoints (`GET /api/dh/weapons`, `GET /api/dh/adversaries`, etc.). When `q` is empty and no type is selected, the page shows the landing grid and makes no network calls.
- **Source switching**: The data source flips the instant the user's query string crosses the empty/non-empty boundary. Clearing the input while a type is focused transitions §3.2 Focused Search → §3.4 Focused Browse seamlessly; the result stream is replaced but the filter rail and type stay put. Filter values are preserved across the transition where they apply to both sources (most filters do, per the compatibility table in §8).
- **Filters that only apply to one type but user is in mixed view**: When the user picks Trait in the rail while in mixed view, auto-promote to focused Weapons view. This is intuitive — selecting a weapon-only filter implicitly means "I want weapons."
- **Pagination**: Mixed view shows 5 per type (no pagination). Focused view paginates 20 per page.
- **Type list**: Not all 17 `SearchableEntityType` values are shown as facet tabs. Collapse `CLASS` + `SUBCLASS_PATH` under "Classes", hide `CARD_COST_TAG`, `EXPANSION`, `BEASTFORM`, `QUESTION` from the facet strip (they can still appear in the "All" tab if they match). The 11 visible tabs match what's in the current `CATEGORY_CONFIGS`.
- **Access control**: handled server-side per the search API docs — no client work needed.
- **ESC**: pressing ESC inside the search input clears the query and returns to initial state.

## 10. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| ≥ 1100px | Full layout: 260px rail + results column |
| 768–1099px | Rail collapses into a "Refine" button that opens a left-side sheet; results take full width |
| < 768px | Same as above + facet tab strip becomes horizontally scrollable with fade mask; search panel becomes edge-to-edge (with side padding); section headers shrink to 1rem |

## 11. Accessibility

- Search input has a visible label (`<label class="sr-only">Search the archives</label>` + placeholder).
- Type facet tabs are an actual `role="tablist"` with `aria-selected` and keyboard arrow navigation.
- `⌘K` hotkey is announced via a `sr-only` hint once on page mount.
- Focus ring: inherit global `:focus-visible` treatment (existing project style).
- Wax-seal badges have `aria-hidden` (purely decorative — the type is already indicated by the section header and the card itself).
- Reduced motion: disable stagger and cross-fade.

## 12. Testing Strategy

Per `.agents/rules/testing.md`, every new component gets a spec. Minimum coverage:

- `SearchService.search` — URL, params, credentials flag, all 14 filter keys, pagination clamping behavior
- `Reference` — query debounce, mode transitions (initial → mixed → focused and back), filter auto-promotion, error path
- `CodexSearchBar` — `⌘K` hotkey, ESC clearing, active-chip removal, debounced output
- `TypeFacetTabs` — click selection, keyboard navigation, active state
- `FilterRail` — renders correct filter set per mode (universal vs type-specific)
- `ResultSection` — "View all N ▸" click event, empty state
- Mapper — each `SearchableEntityType` branch produces the correct `CardData` shape

Run `npm run test:only -- 'src/app/features/reference/**'` and `npm run lint:only -- 'src/app/features/reference/**'` after each component extraction.

## 13. Decommissioning

Files to delete at the end of implementation:

- `src/app/features/reference/components/category-selector/**` (replaced by onboarding type-card grid)
- The large `switch` in `reference.ts` and 9 of 10 injected per-category services (only keep `DomainService`/`ClassService` if the filter rail needs them for dropdown options — probably not, since expansions come from `ExpansionService` and we can fetch domain/class lookups on demand).
- `src/app/features/reference/models/reference.model.ts` — replaced by `models/search.model.ts`
- Existing `components/reference-filters/**` and `components/pagination-controls/**` may be reused verbatim or adapted; decide during implementation.

## 14. Resolved Decisions (previously open)

1. **Browse-without-query behavior** → Browse mode is first-class. Data source is determined by whether `q` is empty: empty + type → `CodexBrowseService` (per-type list endpoints); non-empty → `SearchService` (`/api/search`). Landing state (empty + no type) shows an 11-type onboarding grid with no network calls. Clicking a type card goes straight into §3.4 Focused Browse. Resolved §1, §3, §6, §8, §9.
2. **Card layout** → Full-width single-column `wide` layout in both mixed and focused views, matching the current reference page. Resolved §2.
3. **Seal-badge glyphs** → Single Unicode glyph per type (⚔ ⛨ ◈ ☗ ✦ ❦ ⚜ ⬢ ✧ ❀ ⧫ ✺). Full glyph table in §7. During implementation, swap any glyphs that render poorly in Cinzel for siblings in the same Unicode block and flag the swap in the implementation issue.

## 15. Implementation Phases (for beads issues)

Not filing issues yet — waiting on alignment on this doc first. Proposed phase breakdown:

1. `SearchService` + `CodexBrowseService` + `search.model.ts` + `search-result.mapper.ts` + tests. Audit per-type services for missing filter parameters (per §8 compatibility table) and add any that are supported by the endpoint but not exposed.
2. `Reference` parent skeleton: signal state machine (`viewMode` computed: landing / mixedSearch / focusedSearch / focusedBrowse), effect that dispatches to the right service, URL sync (query, type, filters in query params).
3. `CodexSearchBar` component (search panel + ⌘K + active chips).
4. `TypeFacetTabs` component (leather tabs).
5. `LandingTypeGrid` component (§3.3) — 11 onboarding type cards.
6. `FilterRail` component (adapt or replace existing `ReferenceFilters`). Must work for both search filters and browse filters using the same filter definitions.
7. `ResultSection` + mixed search rendering (§3.1).
8. Focused views (§3.2 search, §3.4 browse) + pagination wiring. Verify filter values survive the search ↔ browse transition when `q` is cleared / added.
9. Empty / loading / error states for both data sources.
10. Responsive pass (mobile Refine sheet, facet strip overflow).
11. A11y + reduced-motion + final polish + decommission old files.

## 16. Next Step

Review §4 (anatomy), §5 (search panel), §7 (aesthetic details), and the open questions in §14. Once those are confirmed, I'll file the phased beads issues and start on phase 1.

---

**Plan file:** `/home/michael/Documents/Projects/dawn/docs/plans/2026-04-10-references-search-redesign.md`
