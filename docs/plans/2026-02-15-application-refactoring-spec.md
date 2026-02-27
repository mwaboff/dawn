# Application Refactoring Specification

**Date**: 2026-02-15
**Scope**: Full application readability refactor and component decomposition
**Status**: Draft

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Current Architecture Assessment](#2-current-architecture-assessment)
3. [Identified Refactoring Opportunities](#3-identified-refactoring-opportunities)
4. [Phased Implementation Plan](#4-phased-implementation-plan)
5. [Phase 5: Update Project Rules and Memory](#5-phase-5-update-project-rules-and-memory)
6. [Appendix: Rule Placement Guide](#6-appendix-rule-placement-guide)

---

## 1. Application Overview

Oh Sheet is an Angular 21 + Tailwind CSS 4 Daggerheart character creation tool. The application is organized into:

| Area | Purpose | Files |
|------|---------|-------|
| `core/` | Shared services (auth) and route guards | 4 files |
| `features/auth/` | Login/signup dual-tab form | 4 files |
| `features/home/` | Landing page with hero + feature grid | 4 files |
| `features/create-character/` | 9-step character creation wizard | 20 files |
| `layout/` | Navbar + footer | 7 files |
| `shared/components/` | DaggerheartCard, CardSkeleton, CardError | 11 files |

**Total**: ~6,800 lines across 51 files. Tests comprise ~35% of the codebase.

### Component Complexity Rankings

| Component | TS Lines | HTML Lines | CSS Lines | Complexity |
|-----------|----------|------------|-----------|------------|
| CreateCharacter | 220 | 117 | 122 | Highest |
| TabNav | 118 | 60 | 252 | High |
| Auth | 120 | 144 | 275 | Medium-High |
| DaggerheartCard | 68 | 103 | 130 | Medium |
| Navbar | 80 | 36 | 206 | Medium |
| Home | 33 | 73 | 280 | Low |
| CharacterForm | 32 | 66 | 115 | Low |

---

## 2. Current Architecture Assessment

### Strengths

- Clean separation: `core/` -> `features/` -> `layout/` -> `shared/`
- Mappers decouple API responses from UI models
- Signal-based reactive state throughout (no unnecessary RxJS complexity)
- Lazy-loaded routes reduce initial bundle size
- Good test coverage with Arrange-Act-Assert patterns
- Models already extracted to `models/` directories
- Tab navigation already extracted to its own component

### Weaknesses

1. **CreateCharacter is a growing monolith** (220 lines) that manages tab state, class loading, subclass loading, subclass path grouping, card selection, and step invalidation
2. **DaggerheartCard template duplicates** the feature-item block (18 lines copy-pasted in collapsible vs. non-collapsible branches)
3. **Auth service co-locates** domain interfaces (`UserResponse`, `LoginRequest`, `RegisterRequest`) with service implementation
4. **`formatText` and `typeLabel`** are general-purpose utilities embedded in a component
5. **`PaginatedResponse`** is defined in `class-api.model.ts` but used cross-feature
6. **No shared loading state pattern** -- the data/loading/error signal triple is manually repeated
7. **Near-duplicate private methods** (`invalidateFromStep` vs `invalidateDownstreamOnly`)
8. **Navbar has dead code** (no-op `effect()` watching `scrollY`)

---

## 3. Identified Refactoring Opportunities

### 3.1 Component Decomposition

#### A. DaggerheartCard -> CardFeatureItem extraction

**Problem**: The feature-item rendering block (name, subtitle, description, tags) is duplicated identically in the collapsible and non-collapsible `@if` branches of `daggerheart-card.html` (lines 54-71 and 75-92).

**Solution**: Extract a `CardFeatureItem` child component.

**New component**: `src/app/shared/components/daggerheart-card/card-feature-item/`

```
card-feature-item/
  card-feature-item.ts        # inputs: feature (CardFeature), formatText fn reference
  card-feature-item.html      # the ~17 lines of feature-item markup
  card-feature-item.css        # .card__feature-item styles moved from parent
  card-feature-item.spec.ts
```

**What moves**:
- Template: Lines 55-70 from `daggerheart-card.html` (the `card__feature-item` div with header, description, tags)
- CSS: `.card__feature-item`, `.card__feature-header`, `.card__feature-name`, `.card__feature-subtitle`, `.card__feature-description`, `.card__feature-tags`, `.card__feature-tag` rules from `daggerheart-card.css`
- The `formatText` method moves to a shared utility (see 3.2.A) and both components import it

**After**: `daggerheart-card.html` uses `<app-card-feature-item>` in both branches, eliminating ~18 lines of duplication.

**Test impact**: Existing DaggerheartCard tests that verify feature rendering should still pass since the behavior is unchanged. New `card-feature-item.spec.ts` covers the extracted rendering in isolation.

#### B. CreateCharacter -> SubclassPathSelector extraction

**Problem**: The subclass tab has a complex inline template (lines 41-90 of `create-character.html`) with its own sub-tab system (Foundation/Specialization/Mastery) and dedicated state (`pathLevelTabs`, `subclassPaths`). This is a self-contained UI concern embedded in the parent.

**Solution**: Extract a `SubclassPathSelector` component.

**New component**: `src/app/features/create-character/components/subclass-path-selector/`

```
subclass-path-selector/
  subclass-path-selector.ts
  subclass-path-selector.html
  subclass-path-selector.css
  subclass-path-selector.spec.ts
```

**What moves from CreateCharacter**:
- **Signals**: `pathLevelTabs` signal
- **Computed**: `subclassPaths` computed signal
- **Methods**: `getPathLevelTab()`, `setPathLevelTab()`, `getPathCardForLevel()`
- **Template**: Lines 48-87 from `create-character.html` (the `tabbed-path` section)
- **CSS**: `.tabbed-path`, `.tabbed-path__tabs`, `.tabbed-path__tab`, `.tabbed-path__tab--active` rules from `create-character.css`

**Component API**:
```typescript
// Inputs
cards = input.required<CardData[]>();         // subclass cards for selected class
selectedCard = input<CardData>();              // currently selected subclass

// Outputs
cardSelected = output<CardData>();            // emits foundation card on select
```

**After**: `create-character.html` subclass case becomes:
```html
@case ('subclass') {
  @if (subclassCardsLoading()) {
    <app-card-skeleton [count]="4" />
  } @else if (subclassCardsError()) {
    <app-card-error />
  } @else {
    <app-subclass-path-selector
      [cards]="subclassCards()"
      [selectedCard]="selectedCards()['subclass']"
      (cardSelected)="onCardClicked($event)"
    />
  }
}
```

**Test impact**: Move subclass-path-specific tests from `create-character.spec.ts` to `subclass-path-selector.spec.ts`. Parent tests simplify to verifying the component renders and delegates.

#### C. CreateCharacter -> ClassCardGrid extraction (future-proofing)

**Problem**: The class tab content (lines 22-40 of `create-character.html`) follows a pattern that will repeat for ancestry, community, and domain-cards tabs. Each will need: loading state, error state, card grid with selection.

**Solution**: Extract a generic `CardSelectionGrid` component.

**New component**: `src/app/shared/components/card-selection-grid/`

```
card-selection-grid/
  card-selection-grid.ts
  card-selection-grid.html
  card-selection-grid.css
  card-selection-grid.spec.ts
```

**Component API**:
```typescript
cards = input.required<CardData[]>();
loading = input<boolean>(false);
error = input<boolean>(false);
selectedCard = input<CardData>();
skeletonCount = input<number>(6);
collapsibleFeatures = input<boolean>(false);
layout = input<'default' | 'wide'>('default');

cardSelected = output<CardData>();
```

**After**: Each tab case in `create-character.html` becomes:
```html
@case ('class') {
  <app-card-selection-grid
    [cards]="classCards()"
    [loading]="classCardsLoading()"
    [error]="classCardsError()"
    [selectedCard]="selectedCards()['class']"
    [skeletonCount]="9"
    [collapsibleFeatures]="true"
    layout="wide"
    (cardSelected)="onCardClicked($event)"
  />
}
```

**Test impact**: Loading/error/rendering tests move from `create-character.spec.ts` to `card-selection-grid.spec.ts`.

#### D. Auth -> LoginForm + SignupForm extraction (optional)

**Problem**: `auth.html` (144 lines) contains two parallel form structures with different fields but shared tab/error/loading patterns. The TS file (120 lines) manages both forms plus tab switching.

**Assessment**: At 120 TS lines and 144 HTML lines, this is at the threshold but not critical. The two forms share loading state and tab switching, which creates tight coupling that would require awkward prop threading if split. **Recommend deferring** this until a third form (e.g., password reset) is added, at which point extraction becomes clearly justified.

**If pursued**: Extract `LoginForm` and `SignupForm` as child components with their own form groups, exposing `(submitted)` and `(error)` outputs. The parent `Auth` component manages tab state and routing only.

### 3.2 Shared Utility Extraction

#### A. Text formatting utility

**Current**: `formatText()` in `daggerheart-card.ts:43-50`

**Extract to**: `src/app/shared/utils/text.utils.ts`

```typescript
export function escapeAndFormatHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return escaped.replace(/\n/g, '<br>');
}
```

**Test**: `src/app/shared/utils/text.utils.spec.ts` -- move relevant tests from `daggerheart-card.spec.ts`, add edge cases (empty string, only newlines, special chars).

#### B. Card type label constant

**Current**: `typeLabel()` method in `daggerheart-card.ts:52-67`

**Extract to**: `src/app/shared/components/daggerheart-card/daggerheart-card.model.ts`

```typescript
export const CARD_TYPE_LABELS: Record<CardType, string> = {
  class: 'Class',
  subclass: 'Subclass',
  heritage: 'Heritage',
  community: 'Community',
  ancestry: 'Ancestry',
  domain: 'Domain',
};
```

**Impact**: Replace `typeLabel(card().cardType)` with `CARD_TYPE_LABELS[card().cardType]` in template (or keep a one-line getter for readability). Tests update to verify the constant.

#### C. Auth model extraction

**Current**: `UserResponse`, `LoginRequest`, `RegisterRequest` in `auth.service.ts:6-28`

**Extract to**: `src/app/core/models/auth.model.ts`

**Impact**: `auth.service.ts` and `auth.ts` both import from the new model file. No behavioral change.

#### D. Paginated response model extraction

**Current**: `PaginatedResponse<T>` in `class-api.model.ts:30-36`

**Extract to**: `src/app/shared/models/api.model.ts`

**Impact**: Both `class.service.ts` and `subclass.service.ts` import from the shared location instead of cross-importing from class models.

### 3.3 Code Cleanup

#### A. Consolidate invalidation methods

**Current**: `invalidateFromStep` and `invalidateDownstreamOnly` in `create-character.ts:181-207` differ only by loop start index.

**Refactor to**:
```typescript
private invalidateSteps(fromTabId: TabId, inclusive: boolean): void {
  const tabIndex = this.tabs.findIndex((t) => t.id === fromTabId);
  const startIndex = inclusive ? tabIndex : tabIndex + 1;
  const updatedSteps = new Set(this.completedStepsSignal());
  const updatedCards = { ...this.selectedCards() };

  for (let i = startIndex; i < this.tabs.length; i++) {
    updatedSteps.delete(this.tabs[i].id);
    delete updatedCards[this.tabs[i].id];
  }

  this.completedStepsSignal.set(updatedSteps);
  this.selectedCards.set(updatedCards);
}
```

Callers: `this.invalidateSteps(currentTab, true)` and `this.invalidateSteps(currentTab, false)`.

#### B. Remove dead effect in Navbar

**Current**: `navbar.ts:37-39` -- `effect(() => { this.scrollY(); });`

**Action**: Delete these 3 lines. The signal is already reactive via OnPush.

#### C. Log error in Navbar logout

**Current**: `navbar.ts:73` -- `error: () => this.router.navigate(['/'])`

**Refactor to**: `error: (err) => { console.error('Logout failed:', err); this.router.navigate(['/']); }`

---

## 4. Phased Implementation Plan

### Phase 1: Shared utilities and model extraction (Low risk, no UI changes)

**Goal**: Extract shared code without changing any component behavior.

| Task | Source | Destination | Tests |
|------|--------|-------------|-------|
| Extract `escapeAndFormatHtml` | `daggerheart-card.ts:43-50` | `shared/utils/text.utils.ts` | New `text.utils.spec.ts` |
| Extract `CARD_TYPE_LABELS` | `daggerheart-card.ts:52-67` | `daggerheart-card.model.ts` | Update card spec |
| Extract auth interfaces | `auth.service.ts:6-28` | `core/models/auth.model.ts` | Update imports only |
| Extract `PaginatedResponse` | `class-api.model.ts:30-36` | `shared/models/api.model.ts` | Update imports only |
| Consolidate invalidation methods | `create-character.ts:181-207` | Same file, merged method | Update create-character spec |
| Remove dead effect | `navbar.ts:37-39` | Delete | Update navbar spec |
| Add error logging to logout | `navbar.ts:73` | Same file | Update navbar spec |

**Validation**: Run `npm run test:run`, `npm run lint`, `npm run build`.

**Estimated files changed**: 10-12

### Phase 2: DaggerheartCard decomposition (Medium risk, template change)

**Goal**: Extract `CardFeatureItem` to eliminate template duplication.

| Task | Details |
|------|---------|
| Create `card-feature-item/` component | New component under `shared/components/daggerheart-card/` |
| Move feature-item template | Lines 55-70 from `daggerheart-card.html` |
| Move feature-item CSS | `.card__feature-*` rules from `daggerheart-card.css` |
| Update `daggerheart-card.html` | Replace both `@for` blocks with `<app-card-feature-item>` |
| Write `card-feature-item.spec.ts` | Feature rendering, subtitle display, tag display, formatText |
| Update `daggerheart-card.spec.ts` | Adjust tests that directly queried feature-item DOM |

**Validation**: Run full test suite, visual regression check on class cards page.

**Estimated files changed**: 5-6 (new component: 4, modified: 2)

### Phase 3: CreateCharacter decomposition (Higher risk, logic moves)

**Goal**: Extract SubclassPathSelector and CardSelectionGrid.

#### 3a: SubclassPathSelector

| Task | Details |
|------|---------|
| Create `subclass-path-selector/` | New component under `create-character/components/` |
| Move subclass path state | `pathLevelTabs` signal, `subclassPaths` computed |
| Move subclass path methods | `getPathLevelTab`, `setPathLevelTab`, `getPathCardForLevel` |
| Move subclass path template | Lines 48-87 from `create-character.html` |
| Move subclass path CSS | `.tabbed-path*` rules from `create-character.css` |
| Move subclass path tests | Path-related tests from `create-character.spec.ts` |

**Estimated files changed**: 6-7

#### 3b: CardSelectionGrid (shared component)

| Task | Details |
|------|---------|
| Create `card-selection-grid/` | New component under `shared/components/` |
| Build loading/error/grid template | Encapsulates skeleton + error + card grid pattern |
| Update `create-character.html` | Replace class case with `<app-card-selection-grid>` |
| Write `card-selection-grid.spec.ts` | Loading, error, card rendering, selection, click output |
| Update `create-character.spec.ts` | Simplify to verify delegation |

**Estimated files changed**: 5-6

**Validation**: Full test suite after each sub-phase. Manual testing of class selection -> subclass loading -> subclass path tabs -> card selection flow.

### Phase 4: Housekeeping (Low risk)

| Task | Details |
|------|---------|
| Audit `daggerheart-card.css` size | After Phase 2, verify CSS budget compliance |
| Review test coverage | Run `npm run test:coverage` and fill gaps |
| Update project structure in AGENTS.md | Reflect new shared components and utilities |

---

## 5. Phase 5: Update Project Rules and Memory

**Goal**: Codify the patterns and lessons learned during Phases 1-4 into project rules so that future development follows these standards by default, eliminating the need for large refactors.

**Process**: As agents complete each phase, they should identify concrete before/after examples from the actual refactoring and use them to write clear, example-driven rules. Rules should go in the appropriate file based on the placement guide in [Appendix: Rule Placement Guide](#6-appendix-rule-placement-guide).

---

### 5.1 New file: `.agents/rules/component-design.md`

**Why a new file**: The existing `angular.md` covers coding patterns (signals, forms, routing). Component *architecture* rules (when to decompose, where files go, size limits) are a separate concern that deserves its own file with its own glob trigger.

```markdown
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
```

**Agents implementing Phases 1-3 should update this file** with additional examples discovered during refactoring. For instance, if consolidating the invalidation methods reveals a useful pattern, add it here.

---

### 5.2 Updates to `.agents/rules/angular.md`

Update the existing **API Integration** section (line 102) to fix the rule that caused interfaces to be co-located with services:

**Before** (current line 102):
```
- Define request/response interfaces in the service file
```

**After**:
```
- Define request/response interfaces in a dedicated model file (`models/{entity}.model.ts`), not inline in the service file
```

This is what led to `UserResponse`, `LoginRequest`, and `RegisterRequest` being defined inside `auth.service.ts` instead of `core/models/auth.model.ts`.

---

### 5.3 Updates to `AGENTS.md`

#### A. Add to Naming Conventions > Code subsection

Add these entries after the existing `- **Comments**: ...` line:

```markdown
- **Utility functions**: pure functions in `shared/utils/{name}.utils.ts` with corresponding `{name}.utils.spec.ts`
- **Model files**: interfaces/types in `models/{name}.model.ts`; constants (lookup maps, config arrays) alongside their related types
- **Child components**: nested under parent's `components/` directory; if reused across 2+ features, promote to `shared/components/`
```

**Why here**: Naming/placement conventions apply globally and should be visible to every agent, not just those triggered by glob patterns.

#### B. Update Project Structure tree

Update the `shared/` section to reflect the full structure after refactoring:

```markdown
│   └── shared/
│       ├── components/       # Reusable UI components
│       │   ├── daggerheart-card/
│       │   │   └── card-feature-item/  # Child component
│       │   ├── card-skeleton/
│       │   ├── card-error/
│       │   └── card-selection-grid/    # Loading + error + card grid pattern
│       ├── models/           # Shared TypeScript interfaces
│       │   └── api.model.ts  # PaginatedResponse, etc.
│       └── utils/            # Pure utility functions
│           └── text.utils.ts # escapeAndFormatHtml, etc.
```

**Why here**: The structure tree is the first thing agents read to understand where files go. If `shared/utils/` and `shared/models/` aren't in the tree, agents will invent their own locations.

#### C. Add to Naming Conventions > Files subsection

Add after the existing `Services: ... | Guards: ... | Tests: ...` line:

```markdown
- Utilities: `{name}.utils.ts` | Models: `{name}.model.ts` or `{name}-api.model.ts` | Mappers: `{name}.mapper.ts`
```

---

### 5.4 Updates to `.agents/rules/testing.md`

Add a new section after the existing **Edge Cases to Cover**:

```markdown
## When Extracting Components

When refactoring extracts a child component from a parent:
- Move tests that directly test the extracted behavior into the child's spec file
- Parent tests should verify the child component renders (exists in DOM) and receives correct inputs
- Do NOT duplicate assertions — if the child spec tests feature rendering, the parent spec should NOT also test feature rendering details
- Run `npm run test:run` after each extraction to catch broken selectors or missing imports
```

**Why here**: The testing rules file already covers what to test, but doesn't address how tests should move during decomposition. This caused uncertainty during the refactoring about which tests belong where.

---

### 5.5 Phase 5 Task Checklist

Each task should be completed by the agent finishing the corresponding phase:

| After Phase | Task | Target File | Details |
|-------------|------|-------------|---------|
| Phase 1 | Fix API integration rule about interface placement | `.agents/rules/angular.md` | Change line 102: "in the service file" -> "in a dedicated model file" |
| Phase 1 | Add utility/model naming conventions | `AGENTS.md` | Add 3 lines to Naming Conventions > Code |
| Phase 1 | Add utility/model file naming | `AGENTS.md` | Add 1 line to Naming Conventions > Files |
| Phase 2 | Create component-design.md with template duplication rule | `.agents/rules/component-design.md` | Include DaggerheartCard before/after example |
| Phase 2 | Add test extraction guidance | `.agents/rules/testing.md` | New "When Extracting Components" section |
| Phase 3 | Add size thresholds and decomposition triggers | `.agents/rules/component-design.md` | Include CreateCharacter before/after example |
| Phase 3 | Add data loading pattern rule | `.agents/rules/component-design.md` | Include loading triple example |
| Phase 4 | Update project structure tree | `AGENTS.md` | Show `shared/utils/`, `shared/models/`, child components |
| Phase 4 | Review all rules for accuracy | All rule files | Verify examples match actual refactored code |

**Critical instruction for agents**: When writing examples in rule files, use the actual code from the refactoring — not hypothetical examples. The before/after should be real file paths, real signal names, and real component names from this project. This makes rules concrete and immediately recognizable.

---

## 6. Appendix: Rule Placement Guide

Rules live in different locations based on their scope and trigger mechanism. Use this guide to decide where a new rule belongs.

### Decision Tree

```
Is the rule about project-wide context
(structure, commands, naming, workflow)?
  ├── YES → AGENTS.md
  │         (Always loaded. Visible to every agent.)
  │
  └── NO → Is the rule specific to certain file types?
            ├── YES → .agents/rules/{topic}.md
            │         (Loaded only when matching files are touched.)
            │         Choose the right topic file:
            │           - angular.md     → Angular/TS coding patterns
            │           - testing.md     → Test structure and coverage
            │           - component-design.md → Architecture, decomposition, sizing
            │
            └── NO → Is it session-specific or personal preference?
                      ├── YES → .claude/CLAUDE.md
                      │         (Claude-specific behavior overrides.)
                      └── NO → AGENTS.md (default)
```

### Placement Examples

| Rule | Goes In | Reason |
|------|---------|--------|
| "Components use `{feature}.ts` naming" | `AGENTS.md` | File naming = project-wide |
| "Use `OnPush` change detection" | `.agents/rules/angular.md` | Angular coding pattern, triggered by `.ts` files |
| "Arrange-Act-Assert in every test" | `.agents/rules/testing.md` | Test-specific, triggered by `.ts` files |
| "Extract child when template > 80 lines" | `.agents/rules/component-design.md` | Architecture concern, triggered by `.ts`/`.html` |
| "Pure functions go in `shared/utils/`" | `.agents/rules/component-design.md` | Architecture concern about file placement |
| "Utility file naming: `{name}.utils.ts`" | `AGENTS.md` | File naming = project-wide |
| "Always use AskUserQuestion for options" | `.claude/CLAUDE.md` | Claude-specific behavior |

### When to add a new `.agents/rules/` file

Create a new rules file when:
- You have 5+ rules on a distinct topic that doesn't fit existing files
- The rules should only trigger for specific file types (not always-on)
- The topic is orthogonal to existing rule files (e.g., accessibility, performance, i18n)

Keep the number of rule files small (3-5) to avoid fragmentation.
