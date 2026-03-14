# Part 1: Add Domain Cards to Character Creator Stepper

## Overview

Add the "Domain Cards" step to the character creation stepper. Players select **2 domain cards** filtered by the domains associated with their previously selected subclass, showing only **level 1** cards. Each domain has a unique theme color.

---

## Prerequisites

- Subclass step must store domain names in card metadata (currently only displayed as subtitle)
- A mapping from domain names to domain IDs is needed since the subclass API returns `domainNames` (strings) but the domain cards API filters by `associatedDomainIds` (numeric IDs)

---

## Implementation Steps

### 1. Update Subclass Mapper to Store Domain Names in Metadata

**File:** `src/app/features/create-character/services/subclass.mapper.ts`

Add `domainNames` to the metadata object so the create-character component can extract domain names programmatically (not just from the subtitle string):

```typescript
const metadata: Record<string, unknown> = {
  subclassPathId: response.subclassPathId,
  level: response.level,
  domainNames: response.domainNames ?? [],  // ADD THIS
};
```

### 2. Create Domain Service

**New file:** `src/app/features/create-character/services/domain.service.ts`

This service has two responsibilities:
1. Fetch all domains and build a name-to-ID lookup map
2. Fetch level-1 domain cards filtered by domain IDs

```typescript
@Injectable({ providedIn: 'root' })
export class DomainService {
  private readonly http = inject(HttpClient);
  private readonly domainsUrl = `${environment.apiUrl}/dh/domains`;
  private readonly domainCardsUrl = `${environment.apiUrl}/dh/cards/domain`;

  private domainNameToId = new Map<string, number>();

  /**
   * Fetches all domains and builds a name -> ID lookup.
   * Cache the result so we only fetch once per session.
   */
  loadDomainLookup(): Observable<Map<string, number>> { ... }

  /**
   * Resolves domain names (from subclass) to domain IDs.
   */
  resolveDomainIds(domainNames: string[]): number[] { ... }

  /**
   * Fetches level-1 domain cards for the given domain IDs.
   * Uses: GET /api/dh/cards/domain?associatedDomainIds=X,Y&levels=1&expand=features,costTags,associatedDomain
   */
  getDomainCards(domainIds: number[], page = 0, size = 100): Observable<CardData[]> { ... }
}
```

**API call details:**
- Endpoint: `GET /api/dh/cards/domain`
- Query params:
  - `associatedDomainIds`: comma-separated domain IDs
  - `levels`: `1`
  - `expand`: `features,costTags,associatedDomain`
  - `size`: `100` (to get all level-1 cards for the domains)
  - `page`: `0`
- `withCredentials: true`

### 3. Create Domain Card API Model

**New file:** `src/app/features/create-character/models/domain-card-api.model.ts`

```typescript
export type DomainCardType = 'SPELL' | 'GRIMOIRE' | 'ABILITY' | 'TRANSFORMATION' | 'WILD';

export interface DomainCardCostTag {
  id: number;
  label: string;
  category: string;
}

export interface DomainCardModifierResponse {
  id: number;
  target: string;
  operation: string;
  value: number;
}

export interface DomainCardFeatureResponse {
  id: number;
  name: string;
  description: string;
  featureType: string;
  expansionId: number;
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  modifierIds: number[];
  modifiers: DomainCardModifierResponse[];
}

export interface DomainCardResponse {
  id: number;
  name: string;
  description: string;
  cardType: 'DOMAIN';
  expansionId: number;
  isOfficial: boolean;
  featureIds: number[];
  features: DomainCardFeatureResponse[];
  costTagIds: number[];
  costTags: DomainCardCostTag[];
  associatedDomainId: number;
  associatedDomain?: {
    id: number;
    name: string;
    description: string;
    expansionId: number;
  };
  level: number;
  recallCost: number;
  type: DomainCardType;
  createdAt: string;
  lastModifiedAt: string;
}
```

### 4. Create Domain Card Mapper

**New file:** `src/app/features/create-character/services/domain-card.mapper.ts`

Maps `DomainCardResponse` to `CardData`:

```typescript
export function mapDomainCardResponseToCardData(response: DomainCardResponse): CardData {
  const features: CardFeature[] = (response.features ?? []).map(mapFeature);
  const domainName = response.associatedDomain?.name ?? '';

  return {
    id: response.id,
    name: response.name,
    description: response.description ?? '',
    cardType: 'domain',
    subtitle: domainName,
    tags: buildTags(response),     // e.g., ['SPELL', 'Recall: 1']
    features: features.length > 0 ? features : undefined,
    metadata: {
      domainName,
      domainId: response.associatedDomainId,
      type: response.type,
      level: response.level,
      recallCost: response.recallCost,
      modifiers: extractModifiers(response),
    },
  };
}

function buildTags(response: DomainCardResponse): string[] {
  const tags: string[] = [formatTitleCase(response.type)];
  if (response.recallCost > 0) {
    tags.push(`Recall: ${response.recallCost}`);
  }
  return tags;
}
```

### 5. Enhance CardSelectionGrid for Multi-Select

**File:** `src/app/shared/components/card-selection-grid/card-selection-grid.ts`

Add multi-select support while maintaining backward compatibility:

```typescript
// New inputs
maxSelections = input<number>(1);
selectedCards = input<CardData[]>([]);

// New output (alongside existing cardSelected)
cardsSelected = output<CardData[]>();
```

**Behavior:**
- When `maxSelections === 1` (default): existing single-select behavior unchanged
- When `maxSelections > 1`: clicking a card toggles it in the `selectedCards` array
  - If card already selected, remove it
  - If not selected and under max, add it
  - If at max, do nothing (or optionally deselect oldest)
- Emit updated array via `cardsSelected`
- Visual: selected cards get the existing `.selected` class; multi-select cards get a selection counter badge (e.g., "1/2")

**Important:** Update existing tests to ensure backward compatibility.

### 6. Domain Color Theming

**Domain-to-color mapping** (stored as a constant in the domain card mapper or a new model file):

```typescript
export const DOMAIN_THEME_COLORS: Record<string, string> = {
  'Arcana': '#7c3aed',    // purple
  'Blade': '#dc2626',     // red
  'Bone': '#9ca3af',      // grey
  'Codex': '#2563eb',     // blue
  'Grace': '#ec4899',     // pink
  'Midnight': '#374151',  // dark grey
  'Sage': '#16a34a',      // green
  'Splendor': '#eab308',  // yellow
  'Valor': '#ea580c',     // orange
};
```

**Application approach:** Set a CSS custom property `--domain-accent` on each card based on its domain name. The `DaggerheartCard` component already uses `--card-accent` for domain type cards. Either:
- Pass the color via metadata and apply via `[style.--card-accent]` on the card container
- Or add a `domainColor` input to the card component

### 7. Wire Up in CreateCharacter Component

**File:** `src/app/features/create-character/create-character.ts`

Add signals and logic:

```typescript
// New signals
readonly domainCards = signal<CardData[]>([]);
readonly domainCardsLoading = signal(false);
readonly domainCardsError = signal(false);
readonly selectedDomainCards = signal<CardData[]>([]);

// Inject DomainService
private readonly domainService = inject(DomainService);
```

**Load domain cards when entering the domain-cards tab:**

```typescript
onTabSelected(tabId: TabId): void {
  // ... existing logic
  if (tabId === 'domain-cards') {
    this.loadDomainCards();
  }
}

loadDomainCards(): void {
  const subclass = this.selectedCards()['subclass'];
  const domainNames = (subclass?.metadata?.['domainNames'] as string[]) ?? [];
  if (domainNames.length === 0) return;

  // Resolve domain names to IDs, then fetch domain cards
  this.domainCardsLoading.set(true);
  this.domainService.loadDomainLookup().pipe(
    switchMap(() => {
      const domainIds = this.domainService.resolveDomainIds(domainNames);
      return this.domainService.getDomainCards(domainIds);
    })
  ).subscribe({
    next: (cards) => {
      this.domainCards.set(cards);
      this.domainCardsLoading.set(false);
    },
    error: () => {
      this.domainCardsError.set(true);
      this.domainCardsLoading.set(false);
    },
  });
}
```

**Domain card selection handler:**

```typescript
onDomainCardsSelected(cards: CardData[]): void {
  this.selectedDomainCards.set(cards);
  if (cards.length === 2) {
    this.markStepComplete('domain-cards');
  } else {
    const updated = new Set(this.completedStepsSignal());
    updated.delete('domain-cards');
    this.completedStepsSignal.set(updated);
  }
}
```

### 8. Update Template

**File:** `src/app/features/create-character/create-character.html`

Replace the placeholder:

```html
@case ('domain-cards') {
  <app-card-selection-grid
    [cards]="domainCards()"
    [loading]="domainCardsLoading()"
    [error]="domainCardsError()"
    [selectedCards]="selectedDomainCards()"
    [maxSelections]="2"
    [skeletonCount]="6"
    [collapsibleFeatures]="true"
    layout="wide"
    (cardsSelected)="onDomainCardsSelected($event)"
  />
}
```

### 9. Update CharacterSelections

**File:** `src/app/features/create-character/models/create-character.model.ts`

Add `domainCards` to `CharacterSelections`:

```typescript
export interface CharacterSelections {
  // ... existing
  domainCards?: string;  // e.g., "Rune Ward, Unleash Chaos"
}
```

Update `characterSelections` computed in `create-character.ts` to include domain card names.

---

## New Files

| File | Type | Description |
|------|------|-------------|
| `services/domain.service.ts` | Service | Domain lookup + domain card fetching |
| `services/domain.service.spec.ts` | Test | Service tests |
| `services/domain-card.mapper.ts` | Mapper | DomainCardResponse → CardData |
| `services/domain-card.mapper.spec.ts` | Test | Mapper tests |
| `models/domain-card-api.model.ts` | Model | API response interfaces |

## Modified Files

| File | Change |
|------|--------|
| `services/subclass.mapper.ts` | Add `domainNames` to metadata |
| `services/subclass.mapper.spec.ts` | Update tests for new metadata |
| `shared/components/card-selection-grid/card-selection-grid.ts` | Add multi-select support |
| `shared/components/card-selection-grid/card-selection-grid.spec.ts` | Add multi-select tests |
| `create-character.ts` | Add domain card signals, loading, selection |
| `create-character.html` | Replace placeholder with grid |
| `models/create-character.model.ts` | Add `domainCards` to selections, domain-cards to TabId |

---

## Validation Checklist

- [ ] Domain cards load when entering the Domain Cards tab
- [ ] Only level 1 cards are shown
- [ ] Cards are filtered by the subclass's associated domains
- [ ] Player can select exactly 2 cards (multi-select)
- [ ] Each domain's cards have the correct theme color
- [ ] Deselecting a card works correctly
- [ ] Step is marked complete when 2 cards are selected
- [ ] Step is incomplete when fewer than 2 cards are selected
- [ ] Changing subclass invalidates domain card selections
- [ ] Loading, error, and empty states work correctly
- [ ] Existing single-select CardSelectionGrid usage is unaffected
- [ ] All tests pass, lint passes, build succeeds
