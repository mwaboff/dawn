---
globs:
  - "src/**/*.ts"
  - "src/**/*.html"
paths:
  - "src/**/*.ts"
  - "src/**/*.html"
trigger: glob
---

# Component Design Standards

## Size Thresholds

Before adding new logic to a component, check its size. If it exceeds these limits, decompose before continuing:

- **TypeScript**: ~150 lines — evaluate whether it manages multiple concerns
- **HTML template**: ~80 lines — look for extractable child components
- **CSS**: Keep under 4kB (the `anyComponentStyle` budget warning)

### Example: CreateCharacter grew to 220 lines

CreateCharacter managed tab state, class card loading, subclass card loading, subclass path grouping, card selection, and step invalidation — 6 distinct concerns. The subclass path logic (signals, computed, 3 methods, 40 lines of template) was a self-contained child component hiding inside the parent.

**Trigger to watch for**: When you're adding a new signal or method, count how many unrelated groups of state the component now manages. If it's 3+, extract.

## Template Duplication

Never duplicate template markup across `@if`/`@else` branches. If two branches render the same structure, extract a shared child component.

### Example: DaggerheartCard duplicated feature-item rendering

The collapsible and non-collapsible feature branches both rendered identical feature-item markup (name, subtitle, description, tags) — 18 lines copy-pasted. When this happens, future changes must be applied in both places, and divergence is inevitable.

**Fix pattern**: Extract a `CardFeatureItem` child component that both branches use via `<app-card-feature-item [feature]="feature" />`.

## Component Decomposition Triggers

Extract a child component when ANY of these apply:

- A template section has its own independent state (signals, forms, local toggles)
- The same markup block appears in 2+ places in the same template
- A `@switch` case has more than ~20 lines of template content
- A component manages loading/error/data signals for 2+ independent data sources

### Example: Subclass path tabs had independent state

The subclass section in CreateCharacter had its own `pathLevelTabs` signal, `subclassPaths` computed, and 3 helper methods — completely independent from the rest of the component. This is a child component waiting to be extracted.

## Data Loading Pattern

When a component loads async data, it typically needs three signals:

```typescript
readonly cards = signal<CardData[]>([]);
readonly cardsLoading = signal(true);
readonly cardsError = signal(false);
```

If a component manages 2+ of these triples (e.g., class cards AND subclass cards), either:
1. Extract each data source into its own child component, or
2. Use a shared loading utility

### Example: CreateCharacter had 2 loading triples

`classCards`/`classCardsLoading`/`classCardsError` AND `subclassCards`/`subclassCardsLoading`/`subclassCardsError` — 6 signals for 2 data sources. Each additional tab (ancestry, community, etc.) would add 3 more signals. The `CardSelectionGrid` shared component encapsulates this pattern.
