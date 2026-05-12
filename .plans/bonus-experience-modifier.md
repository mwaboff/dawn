# Plan: BONUS_EXPERIENCE_MODIFIER (Character Creation Only)

**Scope:** Frontend-only. Backend already supports `BONUS_EXPERIENCE_MODIFIER`. This plan covers:
1. Admin portal — expose the new target so admins can attach it to cards.
2. Character creation — detect selected cards with the modifier, prompt the player to distribute bonus points across their experiences, and apply the bonuses to experience `modifier` values when POSTing to `/api/dh/experiences`.

**Out of scope (deferred):** Level-up flow. Will be a separate task once backend changes land.

---

## 1. Shared: ModifierTarget union

**File:** `src/app/shared/utils/feature-modifier.utils.ts`

```diff
 export type ModifierTarget =
-  | 'BONUS_DOMAIN_CARD_SELECTIONS';
+  | 'BONUS_DOMAIN_CARD_SELECTIONS'
+  | 'BONUS_EXPERIENCE_MODIFIER';
```

No other changes needed — `sumFeatureModifier` is already target-agnostic.

## 2. Admin Portal

**File:** `src/app/features/admin/card-edit/components/card-edit-features/card-edit-features.ts` (line 16-22)

```diff
 const MODIFIER_TARGETS = [
   ...,
   'BONUS_DOMAIN_CARD_SELECTIONS',
+  'BONUS_EXPERIENCE_MODIFIER',
 ] as const;
```

Add a unit test entry in `card-edit-features.spec.ts` asserting the new value appears in the dropdown options.

## 3. API Models — expose modifiers on ancestry/community features

Backend already returns `modifiers` on all feature responses; the frontend interface is out of date.

**File:** `src/app/shared/models/ancestry-api.model.ts`

```diff
+import { ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';
+
 export interface AncestryFeatureResponse {
   id: number;
   ...
   costTags: AncestryCostTag[];
+  modifiers?: ModifierResponse[];
 }
```

**File:** `src/app/shared/models/community-api.model.ts` — same pattern.

## 4. Mappers — pass raw features through metadata

Mirrors existing subclass pattern (`subclass.mapper.ts:33`) so modifiers are reachable from the selected `CardData`.

**File:** `src/app/shared/mappers/ancestry.mapper.ts`

```diff
   return {
     id: response.id,
     ...
     features: features.length > 0 ? features : undefined,
-    metadata: { expansionId: response.expansionId },
+    metadata: {
+      expansionId: response.expansionId,
+      features: response.features ?? [],
+    },
   };
```

**File:** `src/app/shared/mappers/community.mapper.ts` — add metadata with raw features.

Mixed ancestry tempCard in `create-character.ts:188` already includes both features directly — we'll read from `metadata['features']` uniformly, so update that construction to stash raw features with modifiers into metadata too.

## 5. Character creation: new tab

**File:** `src/app/features/create-character/models/create-character.model.ts`

```diff
 export type TabId =
   ...
   | 'experiences'
+  | 'experience-bonuses'
   | 'domain-cards'
   | 'review';

 export const CHARACTER_TABS: Tab[] = [
   ...
   { id: 'experiences', label: 'Experiences' },
+  { id: 'experience-bonuses', label: 'Bonus Experience' },
   { id: 'domain-cards', label: 'Domain Cards' },
   ...
 ];
```

## 6. New component: ExperienceBonusAllocator

**Path:** `src/app/features/create-character/components/experience-bonus-allocator/`

Files: `.ts`, `.html`, `.css`, `.spec.ts`

**Inputs:**
- `experiences = input.required<Experience[]>()`
- `totalBonus = input.required<number>()`
- `initialAllocations = input<number[]>()` (per-experience bonus, aligned by index)

**Output:**
- `allocationsChanged = output<number[]>()`

**UI:**
For each experience row:
- Name (read-only)
- Base modifier display: `+2`
- Stepper: `−` / allocation / `+`
- Computed effective modifier: `+2 → +4` (using Cinzel for the arrow, matching level-up upgrade UX)

Footer:
- "Bonus points remaining: X / Y" — green when 0.
- Cannot decrement below 0 or exceed remaining points.

**State:** local `allocations = signal<number[]>(...)`, computed `used`, `remaining`.

## 7. Wire into CreateCharacter

**File:** `src/app/features/create-character/create-character.ts`

```typescript
readonly experienceBonusPoints = computed<number>(() => {
  const subclass = this.selectedSubclassCard();
  const ancestry = this.selectedAncestryCard();
  const community = this.selectedCommunityCard();
  const subFeatures = (subclass?.metadata?.['features'] as FeatureLike[] | undefined) ?? [];
  const ancFeatures = (ancestry?.metadata?.['features'] as FeatureLike[] | undefined) ?? [];
  const comFeatures = (community?.metadata?.['features'] as FeatureLike[] | undefined) ?? [];
  return (
    sumFeatureModifier(subFeatures, 'BONUS_EXPERIENCE_MODIFIER') +
    sumFeatureModifier(ancFeatures, 'BONUS_EXPERIENCE_MODIFIER') +
    sumFeatureModifier(comFeatures, 'BONUS_EXPERIENCE_MODIFIER')
  );
});

readonly experienceBonusAllocations = signal<number[]>([]);

readonly tabs = computed<Tab[]>(() =>
  this.experienceBonusPoints() > 0
    ? CHARACTER_TABS
    : CHARACTER_TABS.filter(t => t.id !== 'experience-bonuses'),
);
```

> **Note:** `tabs` changes from a plain property to a `computed`. `tab-nav` accepts it as an input — verify this still works. (The component explorer confirmed tabs are passed into TabNav.)

**Auto-complete when no bonus:** inside a `constructor` effect or in `onTabSelected`, when `experienceBonusPoints() === 0`, the step is simply absent from `tabs` so it is skipped without extra logic.

**Handler:**

```typescript
onExperienceBonusesChanged(allocations: number[]): void {
  this.experienceBonusAllocations.set(allocations);
  const used = allocations.reduce((s, n) => s + n, 0);
  const total = this.experienceBonusPoints();
  if (used === total) {
    this.markStepComplete('experience-bonuses');
  } else {
    const updated = new Set(this.completedStepsSignal());
    updated.delete('experience-bonuses');
    this.completedStepsSignal.set(updated);
  }
}
```

**Reset allocations when selections change:** when ancestry/community/subclass selections change (invalidating downstream steps), reset `experienceBonusAllocations` to `[]`. Plug into `invalidateSteps` / `onCardClicked`.

## 8. Apply bonuses on submit

**File:** `src/app/features/create-character/create-character.ts` — `onSubmitCharacter()`

Before calling `assembleCharacterSheet`, produce effective experiences:

```typescript
const baseExperiences = this.experienceAssignments();
const allocations = this.experienceBonusAllocations();
const effectiveExperiences: Experience[] = baseExperiences.map((exp, i) => ({
  name: exp.name,
  modifier: (exp.modifier ?? 0) + (allocations[i] ?? 0),
}));
```

Pass `effectiveExperiences` into `assembleCharacterSheet`. No changes required in `toCreateCharacterSheetRequest` or `createExperience` — the bonus is folded into `modifier`.

## 9. Template updates

**File:** `create-character.html` — add `@case ('experience-bonuses')` block rendering `<app-experience-bonus-allocator>` with the computed inputs.

## 10. Tests

- `feature-modifier.utils.spec.ts` — cover `BONUS_EXPERIENCE_MODIFIER` summing across heterogeneous feature arrays.
- `ancestry.mapper.spec.ts` / `community.mapper.spec.ts` — assert `metadata.features` is populated.
- `card-edit-features.spec.ts` — new modifier target appears in dropdown.
- `experience-bonus-allocator.spec.ts` — new component tests (stepper bounds, remaining points, output emission).
- `create-character.spec.ts` — `experienceBonusPoints` computed; tabs list filtering; bonuses applied to experiences on submit.

## 11. Validation

Run after each major edit:
```bash
npm run lint:fix
npm run test:run
npm run build
```

## Open Decisions

- **Tab label.** "Bonus Experience" vs "Experience Bonuses" vs "Bonuses".
- **UI pattern.** Stepper (+/−) vs dropdown of integer choices. Stepper matches D&D-style bonus point spending and scales better if a card ever grants +3.
- **Skip behavior.** Hide the tab entirely when bonus = 0 (proposed) vs always show with "no bonuses available" message. Hiding keeps the flow clean for the common case.
