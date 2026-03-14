# Reference Page - Implementation Plan

## Context

The app needs a public reference/search page where users can browse 12 categories of Daggerheart game content. Currently, all card-fetching services live inside `create-character` and need extraction to shared locations. The backend limits card visibility based on user access (expansions, GM-only content), so unauthenticated users see only public/official content while logged-in users see their full library.

---

## Categories & Filter Matrix

| # | Category | Endpoint | Filters |
|---|----------|----------|---------|
| 1 | Classes | `GET /dh/classes` | Expansion |
| 2 | Subclasses | `GET /dh/cards/subclass` | Expansion, Class (dynamic), Subclass Path (dynamic), Level (Foundation/Specialization/Mastery), Official |
| 3 | Subclass Paths | `GET /dh/subclass-paths` | Expansion |
| 4 | Ancestries | `GET /dh/cards/ancestry` | Expansion, Official |
| 5 | Communities | `GET /dh/cards/community` | Expansion, Official |
| 6 | Domains | `GET /dh/domains` | Expansion |
| 7 | Domain Cards | `GET /dh/cards/domain` | Expansion, Domain (multi-select, dynamic), Type (Spell/Grimoire/Ability/Transformation/Wild), Level, Official |
| 8 | Weapons | `GET /dh/weapons` | Expansion, Trait (6 vals), Range (5 vals), Burden (1H/2H), Primary (toggle), Tier, Damage Type (Physical/Magic), Official |
| 9 | Armor | `GET /dh/armors` | Expansion, Tier, Official |
| 10 | Loot | `GET /dh/loot` | Expansion, Tier, Consumable (toggle), Official |
| 11 | Companions | `GET /dh/companions` | Expansion |
| 12 | Adversaries | `GET /dh/adversaries` | Expansion, Tier, Adversary Type (10 vals), Official |

---

## Phase 1: Service Extraction (Foundation)

**Goal**: Move 7 existing services + mappers + models from `create-character` to `shared/`.

### Files to move

| From (`features/create-character/`) | To (`shared/`) |
|---|---|
| `services/class.service.ts` (+spec) | `services/class.service.ts` (+spec) |
| `services/class.mapper.ts` (+spec) | `mappers/class.mapper.ts` (+spec) |
| `models/class-api.model.ts` | `models/class-api.model.ts` |
| `services/subclass.service.ts` (+spec) | `services/subclass.service.ts` (+spec) |
| `services/subclass.mapper.ts` (+spec) | `mappers/subclass.mapper.ts` (+spec) |
| `models/subclass-api.model.ts` | `models/subclass-api.model.ts` |
| `services/ancestry.service.ts` (+spec) | `services/ancestry.service.ts` (+spec) |
| `services/ancestry.mapper.ts` (+spec) | `mappers/ancestry.mapper.ts` (+spec) |
| `models/ancestry-api.model.ts` | `models/ancestry-api.model.ts` |
| `services/community.service.ts` (+spec) | `services/community.service.ts` (+spec) |
| `services/community.mapper.ts` (+spec) | `mappers/community.mapper.ts` (+spec) |
| `models/community-api.model.ts` | `models/community-api.model.ts` |
| `services/domain.service.ts` (+spec) | `services/domain.service.ts` (+spec) |
| `services/domain-card.mapper.ts` (+spec) | `mappers/domain-card.mapper.ts` (+spec) |
| `models/domain-card-api.model.ts` | `models/domain-card-api.model.ts` |
| `services/weapon.service.ts` (+spec) | `services/weapon.service.ts` (+spec) |
| `services/weapon.mapper.ts` (+spec) | `mappers/weapon.mapper.ts` (+spec) |
| `models/weapon-api.model.ts` | `models/weapon-api.model.ts` |
| `services/armor.service.ts` (+spec) | `services/armor.service.ts` (+spec) |
| `services/armor.mapper.ts` (+spec) | `mappers/armor.mapper.ts` (+spec) |
| `models/armor-api.model.ts` | `models/armor-api.model.ts` |

### Additional extraction
- Move `PaginatedCards` interface from `weapon.service.ts` to `shared/models/api.model.ts` (alongside existing `PaginatedResponse`)
- Extract `DomainResponse` (currently inline in `domain.service.ts`) to `shared/models/domain-api.model.ts`

### Import path updates (no logic changes)
- `features/create-character/create-character.ts` — 5 service imports
- `features/create-character/create-character.spec.ts` — service imports
- `features/create-character/components/equipment-selector/components/weapon-section/weapon-section.ts` (+spec)
- `features/create-character/components/equipment-selector/components/armor-section/armor-section.ts` (+spec)
- `features/create-character/components/equipment-selector/equipment-selector.spec.ts`

All services use `providedIn: 'root'` — no module registration changes needed.

---

## Phase 2: New Shared Services

**Goal**: Create services for the 5 new categories + an expansion service for filter dropdowns.

### 2a. Expansion Service (used by all category filters)
- `shared/services/expansion.service.ts` (+spec)
- `shared/models/expansion-api.model.ts`
- Endpoint: `GET /dh/expansions`
- Returns: `Observable<ExpansionOption[]>` — `{ id: number, name: string }`
- Caching: cache the list (expansions rarely change)

### 2b. Domain List Extension
- Add `getDomains(): Observable<CardData[]>` method to the extracted `DomainService`
- Create `shared/mappers/domain.mapper.ts` (+spec) — maps `DomainResponse` to `CardData` with cardType `'domain'`
- Keeps existing `getDomainCardsForNames()` for character creation

### 2c. Subclass Path Service
- `shared/services/subclass-path.service.ts` (+spec)
- `shared/models/subclass-path-api.model.ts`
- `shared/mappers/subclass-path.mapper.ts` (+spec)
- Endpoint: `GET /dh/subclass-paths?expand=associatedDomains,spellcastingTrait`
- New cardType: `'subclassPath'`

### 2d. Loot Service
- `shared/services/loot.service.ts` (+spec)
- `shared/models/loot-api.model.ts`
- `shared/mappers/loot.mapper.ts` (+spec)
- Endpoint: `GET /dh/loot?expand=features,costTags`
- Filters: `tier`, `isConsumable`, `expansionId`, `isOfficial`
- Returns: `PaginatedCards` — new cardType: `'loot'`

### 2e. Companion Service
- `shared/services/companion.service.ts` (+spec)
- `shared/models/companion-api.model.ts`
- `shared/mappers/companion.mapper.ts` (+spec)
- Endpoint: `GET /dh/companions`
- New cardType: `'companion'`

### 2f. Adversary Service
- `shared/services/adversary.service.ts` (+spec)
- `shared/models/adversary-api.model.ts`
- `shared/mappers/adversary.mapper.ts` (+spec)
- Endpoint: `GET /dh/adversaries?expand=features,experiences`
- Filters: `tier`, `adversaryType`, `isOfficial`, `expansionId`
- Returns custom `AdversaryData` (not `CardData`) for the custom adversary card

---

## Phase 3: CardType Extension

**Goal**: Add new card types to the DaggerheartCard model.

### Files to modify

**`shared/components/daggerheart-card/daggerheart-card.model.ts`**:
- Extend `CardType` union: add `'loot' | 'companion' | 'subclassPath'`
- Extend `CARD_TYPE_LABELS`: `{ loot: 'Loot', companion: 'Companion', subclassPath: 'Subclass Path' }`

**`shared/components/daggerheart-card/daggerheart-card.css`**:
- Add accent color rules for new types:
  - `.card--type-loot` — amber/gold: `#c7a850`
  - `.card--type-companion` — warm green: `#6bad56`
  - `.card--type-subclassPath` — teal: `#56b4c7`

---

## Phase 4: Adversary Card Component

**Goal**: Custom card component for adversaries with a stat-block layout.

### New files
- `shared/components/adversary-card/adversary-card.ts`
- `shared/components/adversary-card/adversary-card.html`
- `shared/components/adversary-card/adversary-card.css`
- `shared/components/adversary-card/adversary-card.spec.ts`
- `shared/components/adversary-card/adversary-card.model.ts`

### AdversaryData model
```typescript
interface AdversaryData {
  id: number;
  name: string;
  description?: string;
  tier: number;
  adversaryType: string;      // MINION, BRUISER, etc.
  difficulty?: number;
  hitPointMax?: number;
  stressMax?: number;
  evasion?: number;
  majorThreshold?: number;
  severeThreshold?: number;
  attackModifier?: number;
  weaponName?: string;
  attackRange?: string;
  damage?: { notation: string; damageType: string };
  motivesAndTactics?: string;
  features?: CardFeature[];    // Reuse from daggerheart-card.model
}
```

### Card layout
- **Header**: Name + adversary type badge (e.g., "BRUISER") + tier indicator
- **Stat row**: HP | Stress | Evasion | Difficulty — compact stat blocks
- **Thresholds row**: Major | Severe — damage threshold indicators
- **Attack section**: Weapon name, range, damage notation (e.g., "2d10+5 phy")
- **Features section**: Reuse existing `CardFeatureItem` component
- **Description/Tactics**: Collapsible section
- **Accent color**: Menacing red `#c74040`
- **Aesthetic**: Same dark tavern card frame as DaggerheartCard

### Inputs
- `adversary: input.required<AdversaryData>()`
- `layout: input<'default' | 'wide'>()` — matches DaggerheartCard API

---

## Phase 5: Reference Page Feature

**Goal**: The main browsing page with category selection, filters, and card grid.

### New files
```
src/app/features/reference/
├── reference.ts / .html / .css / .spec.ts     # Parent page
├── models/
│   └── reference.model.ts                       # Category configs, filter types
└── components/
    ├── category-selector/
    │   └── category-selector.ts / .html / .css / .spec.ts
    ├── reference-filters/
    │   └── reference-filters.ts / .html / .css / .spec.ts
    └── pagination-controls/
        └── pagination-controls.ts / .html / .css / .spec.ts
```

### Route (in `app.routes.ts`)
```typescript
{ path: 'reference', loadComponent: () => import('./features/reference/reference').then(m => m.Reference) }
```
Place **outside** the auth guard — this is a public route.

### Category Selector component
- 12 category buttons in a responsive grid (4 cols desktop, 2 cols tablet, 1 col mobile)
- Each button: icon + label + brief description
- Active category gets gold border highlight
- Tavern/compendium aesthetic — parchment-toned cards with embossed feel
- Emits `categorySelected` output

### Reference Filters component
- Receives `FilterDefinition[]` based on active category
- Renders appropriate controls:
  - **Dropdown** (`<select>`) for enum filters (tier, type, range, trait, burden, damageType, adversaryType, level)
  - **Toggle** (`<button>`) for boolean filters (isOfficial, isPrimary, isConsumable)
  - **Multi-select** for domain selection on domain cards
  - **Dynamic dropdowns** that load options from API (expansion list via ExpansionService, class list via ClassService, domain list via DomainService)
- Filter bar slides in below category selector when a category is active
- Emits `filtersChanged` output with `Record<string, unknown>`
- "Clear filters" button to reset

### Pagination Controls component
- Inputs: `currentPage`, `totalPages`
- Output: `pageChanged`
- Only shown when `totalPages > 1`
- Prev/next buttons + page number display
- Gold accent styling consistent with tavern aesthetic

### Parent Reference component — state management
```typescript
// Signals
activeCategory = signal<ReferenceCategory | null>(null);
filters = signal<Record<string, unknown>>({});
cards = signal<CardData[]>([]);
adversaries = signal<AdversaryData[]>([]);
loading = signal(false);
error = signal(false);
currentPage = signal(0);
totalPages = signal(0);

// Category change → reset filters, fetch data
// Filter change → reset page, fetch data
// Page change → fetch data
```

### Card interaction
- **Expand in-place**: Clicking a card visually expands it to show full details (features, description). This leverages the existing `CardSelectionGrid` selection behavior with no extra work — the "selected" state already expands cards.
- For all categories except Adversaries: use `CardSelectionGrid` in browse mode
- For Adversaries: custom grid of `AdversaryCard` components with same responsive layout + expand-on-click behavior

### Design direction
- Page title: "Compendium" or "Reference" in Cinzel font
- Subtitle: "Browse the archives of Daggerheart" in Lora italic
- Background: dark brown (`#1a1207`) with subtle parchment texture
- Category cards: slightly lighter brown (`#2a1f0e`) with gold border on hover/active
- Filter bar: semi-transparent dark overlay that slides in
- Gold accents (`#d4a056`) for active states and interactive elements

---

## Phase 6: Navbar Update

**Goal**: Add "Reference" link visible to all users (authenticated and unauthenticated).

### Files to modify
- `src/app/layout/navbar/navbar.html` — Add `<a href="/reference" target="_blank">Reference</a>` in both the authenticated and unauthenticated nav sections
- `src/app/layout/navbar/navbar.css` — Style if needed (likely reuse existing link styles)
- `src/app/layout/navbar/navbar.spec.ts` — Test for link presence

---

## Parallelization & Agent Team Strategy

```
                    ┌─── Agent A: Phase 1 (service extraction) ───┐
                    │                                              │
Start ──────────────┼─── Agent B: Phase 3 + Phase 4 (card types   ├──→ Phase 5 (reference page)
                    │    + adversary card)                         │    (single agent after
                    │                                              │     all phases complete)
                    ├─── Agent C: Phase 2 (new services)  ────────┘
                    │
                    └─── Agent D: Phase 6 (navbar link)
```

**Agent A** — Service Extraction (Phase 1)
- Move all 7 services, 7 mappers, 7 models to shared/
- Update all import paths in create-character
- Extract PaginatedCards to shared/models/api.model.ts
- Validate: `npm run test:run` and `npm run build`

**Agent B** — Card Types & Adversary Card (Phase 3 + 4)
- Extend CardType enum and CSS for loot, companion, subclassPath
- Build AdversaryCard component with stat-block layout
- Write tests for AdversaryCard
- Validate: `npm run test:only -- 'src/app/shared/components/adversary-card/**'`

**Agent C** — New Services (Phase 2)
- Create ExpansionService, SubclassPathService, LootService, CompanionService, AdversaryService
- Create all associated mappers, models, and tests
- Extend DomainService with getDomains() + domain.mapper
- Validate: run tests for each new service

**Agent D** — Navbar (Phase 6)
- Add Reference link to navbar
- Update navbar tests

**After A + B + C complete** — Phase 5 (Reference Page)
- Can be split into sub-tasks:
  - 5a: Route + parent component scaffolding + category selector
  - 5b: Reference filters component
  - 5c: Pagination controls component
  - 5d: Integration wiring (connecting all services to the page)
  - 5e: Tests

---

## Verification

After all phases:
1. `npm run build` — must succeed
2. `npm run test:run` — all tests green
3. `npm run lint` — no new lint errors
4. Manual test: navigate to `/reference`, select each category, apply filters, verify cards load
5. Test unauthenticated: open in incognito, verify page loads and shows public content
6. Test navbar: verify "Reference" link appears for both logged-in and logged-out users, opens in new tab

---

## Key Reuse Points

| Existing Asset | Location | Reused For |
|---|---|---|
| `CardSelectionGrid` | `shared/components/card-selection-grid/` | Main card grid display |
| `CardSkeleton` | `shared/components/card-skeleton/` | Loading states |
| `CardError` | `shared/components/card-error/` | Error states |
| `DaggerheartCard` | `shared/components/daggerheart-card/` | All card types except adversary |
| `CardFeatureItem` | `shared/components/daggerheart-card/card-feature-item/` | Feature lists in adversary card |
| `PaginatedResponse<T>` | `shared/models/api.model.ts` | All paginated API responses |
| `DOMAIN_THEME_COLORS` | `shared/mappers/domain-card.mapper.ts` (after extraction) | Domain card accent colors |
| `escapeAndFormatHtml` | `shared/utils/text.utils.ts` | Description formatting |
