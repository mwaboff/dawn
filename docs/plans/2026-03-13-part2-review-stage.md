# Part 2: Add a Review Stage Before Submission

## Overview

Add a "Review" tab as the final step of the character creator stepper. This tab displays all collected character information in a readable summary, calculates derived stats (evasion, armor score, damage thresholds), and prepares the data for submission.

---

## Prerequisites

- Part 1 (Domain Cards step) must be complete
- Class mapper must store `startingEvasion` and `startingHitPoints` in card metadata

---

## Implementation Steps

### 1. Update Class Mapper to Store Stats in Metadata

**File:** `src/app/features/create-character/services/class.mapper.ts`

Currently, `startingEvasion` and `startingHitPoints` are only stored as display tags. Add them to metadata for programmatic access:

```typescript
export function mapClassResponseToCardData(response: ClassResponse): CardData {
  // ... existing tag logic ...

  return {
    id: response.id,
    name: response.name,
    description: response.description,
    cardType: 'class',
    tags: tags.length > 0 ? tags : undefined,
    features: features.length > 0 ? features : undefined,
    metadata: {
      startingEvasion: response.startingEvasion,
      startingHitPoints: response.startingHitPoints,
    },
  };
}
```

Update `class.mapper.spec.ts` to verify the metadata fields.

### 2. Add 'review' Tab

**File:** `src/app/features/create-character/models/create-character.model.ts`

```typescript
export type TabId =
  | 'class'
  | 'subclass'
  | 'ancestry'
  | 'community'
  | 'traits'
  | 'starting-weapon'
  | 'starting-armor'
  | 'experiences'
  | 'domain-cards'
  | 'review';           // ADD

export const CHARACTER_TABS: Tab[] = [
  // ... existing tabs ...
  { id: 'domain-cards', label: 'Domain Cards' },
  { id: 'review', label: 'Review' },  // ADD
];
```

### 3. Define Character Sheet Data Model

**New file:** `src/app/features/create-character/models/character-sheet.model.ts`

This model represents the assembled character sheet data ready for submission:

```typescript
export interface CharacterSheetData {
  // Identity
  name: string;
  pronouns?: string;
  level: number;  // always 1 for character creation

  // Core stats
  evasion: number;           // from class startingEvasion (base only for submission)
  hitPointMax: number;       // from class startingHitPoints
  hitPointMarked: number;    // 0

  // Hope
  hopeMax: number;           // 6
  hopeMarked: number;        // 2

  // Stress
  stressMax: number;         // 6
  stressMarked: number;      // 0

  // Armor
  armorMax: number;          // from armor baseScore (0 if no armor)
  armorMarked: number;       // 0

  // Damage thresholds
  majorDamageThreshold: number;   // from armor or class default
  severeDamageThreshold: number;  // from armor or class default

  // Traits
  agilityModifier: number;
  strengthModifier: number;
  finesseModifier: number;
  instinctModifier: number;
  presenceModifier: number;
  knowledgeModifier: number;

  // All trait marked booleans
  agilityMarked: boolean;      // false
  strengthMarked: boolean;     // false
  finesseMarked: boolean;      // false
  instinctMarked: boolean;     // false
  presenceMarked: boolean;     // false
  knowledgeMarked: boolean;    // false

  // Gold
  gold: number;  // 0

  // Equipment (set as active)
  activePrimaryWeaponId: number | null;
  activeSecondaryWeaponId: number | null;
  activeArmorId: number | null;

  // Inventory
  inventoryWeaponIds: number[];
  inventoryArmorIds: number[];

  // Cards
  communityCardIds: number[];
  ancestryCardIds: number[];
  subclassCardIds: number[];
  domainCardIds: number[];     // requires backend update

  // Experiences (created separately after sheet)
  experiences: { name: string; modifier: number }[];
}

// Default damage thresholds when no armor is selected
export const DEFAULT_MAJOR_THRESHOLD = 3;
export const DEFAULT_SEVERE_THRESHOLD = 6;
```

### 4. Create Character Sheet Assembler Utility

**New file:** `src/app/features/create-character/utils/character-sheet-assembler.utils.ts`

Pure function that assembles all selections into a `CharacterSheetData`:

```typescript
export function assembleCharacterSheet(params: {
  name: string;
  pronouns?: string;
  classCard: CardData;
  subclassCard: CardData;
  ancestryCard: CardData;
  communityCard: CardData;
  traits: TraitAssignments;
  primaryWeapon: CardData | null;
  secondaryWeapon: CardData | null;
  armor: CardData | null;
  experiences: Experience[];
  domainCards: CardData[];
}): CharacterSheetData {
  const { classCard, armor, traits } = params;

  const startingEvasion = (classCard.metadata?.['startingEvasion'] as number) ?? 0;
  const startingHitPoints = (classCard.metadata?.['startingHitPoints'] as number) ?? 0;

  // Damage thresholds from armor, or defaults
  const majorDamageThreshold = armor
    ? (armor.metadata?.['baseMajorThreshold'] as number)
    : DEFAULT_MAJOR_THRESHOLD;
  const severeDamageThreshold = armor
    ? (armor.metadata?.['baseSevereThreshold'] as number)
    : DEFAULT_SEVERE_THRESHOLD;

  // Armor max from armor baseScore
  const armorMax = armor
    ? (armor.metadata?.['baseScore'] as number) ?? 0
    : 0;

  // Weapon IDs - selected weapons are both active AND in inventory
  const weaponIds: number[] = [];
  if (params.primaryWeapon) weaponIds.push(params.primaryWeapon.id);
  if (params.secondaryWeapon) weaponIds.push(params.secondaryWeapon.id);

  return {
    name: params.name,
    pronouns: params.pronouns || undefined,
    level: 1,
    evasion: startingEvasion,
    hitPointMax: startingHitPoints,
    hitPointMarked: 0,
    hopeMax: 6,
    hopeMarked: 2,
    stressMax: 6,
    stressMarked: 0,
    armorMax,
    armorMarked: 0,
    majorDamageThreshold,
    severeDamageThreshold,
    agilityModifier: traits.agility ?? 0,
    strengthModifier: traits.strength ?? 0,
    finesseModifier: traits.finesse ?? 0,
    instinctModifier: traits.instinct ?? 0,
    presenceModifier: traits.presence ?? 0,
    knowledgeModifier: traits.knowledge ?? 0,
    agilityMarked: false,
    strengthMarked: false,
    finesseMarked: false,
    instinctMarked: false,
    presenceMarked: false,
    knowledgeMarked: false,
    gold: 0,
    activePrimaryWeaponId: params.primaryWeapon?.id ?? null,
    activeSecondaryWeaponId: params.secondaryWeapon?.id ?? null,
    activeArmorId: armor?.id ?? null,
    inventoryWeaponIds: weaponIds,
    inventoryArmorIds: armor ? [armor.id] : [],
    communityCardIds: [params.communityCard.id],
    ancestryCardIds: [params.ancestryCard.id],
    subclassCardIds: [params.subclassCard.id],
    domainCardIds: params.domainCards.map(c => c.id),
    experiences: params.experiences
      .filter(exp => exp.name.trim() !== '' && exp.modifier !== null)
      .map(exp => ({ name: exp.name.trim(), modifier: exp.modifier! })),
  };
}
```

### 5. Create Evasion Display Calculator Utility

**New file:** `src/app/features/create-character/utils/stat-calculator.utils.ts`

For *display purposes only* on the review page, calculate evasion including equipment modifiers:

```typescript
export function calculateDisplayEvasion(
  baseEvasion: number,
  armor: CardData | null,
  primaryWeapon: CardData | null,
  secondaryWeapon: CardData | null,
): number {
  let evasion = baseEvasion;

  // Apply armor modifiers that target EVASION
  const armorModifiers = (armor?.metadata?.['modifiers'] as any[]) ?? [];
  evasion = applyModifiers(evasion, armorModifiers, 'EVASION');

  // Apply weapon modifiers that target EVASION
  const primaryModifiers = (primaryWeapon?.metadata?.['modifiers'] as any[]) ?? [];
  evasion = applyModifiers(evasion, primaryModifiers, 'EVASION');

  const secondaryModifiers = (secondaryWeapon?.metadata?.['modifiers'] as any[]) ?? [];
  evasion = applyModifiers(evasion, secondaryModifiers, 'EVASION');

  return evasion;
}

function applyModifiers(base: number, modifiers: any[], target: string): number {
  let result = base;
  for (const mod of modifiers) {
    if (mod.target !== target) continue;
    switch (mod.operation) {
      case 'ADD': result += mod.value; break;
      case 'SET': result = mod.value; break;
      case 'MULTIPLY': result *= mod.value; break;
    }
  }
  return result;
}
```

**Important:** When submitting to the backend (Part 3), only send the **base evasion** from the class, NOT the display value with modifiers.

### 6. Create ReviewSection Component

**New file:** `src/app/features/create-character/components/review-section/review-section.ts`

Inputs:
```typescript
classCard = input.required<CardData>();
subclassCard = input.required<CardData>();
ancestryCard = input.required<CardData>();
communityCard = input.required<CardData>();
traits = input.required<TraitAssignments>();
primaryWeapon = input<CardData | null>(null);
secondaryWeapon = input<CardData | null>(null);
armor = input<CardData | null>(null);
experiences = input.required<Experience[]>();
domainCards = input.required<CardData[]>();
```

**Display sections:**

1. **Character Identity** (from CharacterForm)
   - Name, pronouns

2. **Class & Subclass**
   - Class name, subclass name, domains

3. **Ancestry & Community**
   - Ancestry name, community name

4. **Core Stats** (calculated)
   - Evasion: `{base}` (+ show `{display}` with modifiers if different)
   - Hit Points: `{max}`
   - Hope: `{marked} / {max}` (2/6)
   - Stress: `{marked} / {max}` (0/6)
   - Armor Score: `{armorMax}` (from armor baseScore or 0)
   - Damage Thresholds: Major `{value}+` / Severe `{value}+`

5. **Traits**
   - All 6 traits with their assigned values in +/- notation

6. **Equipment**
   - Primary weapon name + damage notation
   - Secondary weapon name (if any)
   - Armor name (if any) + score/thresholds

7. **Experiences**
   - List of experience name + modifier

8. **Domain Cards**
   - Names of both selected domain cards with domain color indicators

### 7. Wire Up ReviewSection in CreateCharacter

**File:** `src/app/features/create-character/create-character.ts`

Add the review section to the template:

```html
@case ('review') {
  <app-review-section
    [classCard]="selectedClassCard()!"
    [subclassCard]="selectedSubclassCard()!"
    [ancestryCard]="selectedAncestryCard()!"
    [communityCard]="selectedCommunityCard()!"
    [traits]="traitAssignments()!"
    [primaryWeapon]="selectedPrimaryWeapon()"
    [secondaryWeapon]="selectedSecondaryWeapon()"
    [armor]="selectedArmor()"
    [experiences]="experienceAssignments()"
    [domainCards]="selectedDomainCards()"
  />
}
```

The review tab auto-completes when navigated to (all previous steps are complete).

### 8. Update Tab Reachability

**File:** `src/app/features/create-character/create-character.ts`

Remove the special-case `domain-cards` bypass in `isTabReachable()` (it was a placeholder). The review tab should only be reachable when ALL prior steps are complete:

```typescript
private isTabReachable(tabId: TabId): boolean {
  const targetIndex = this.tabs.findIndex((t) => t.id === tabId);
  const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTab());

  if (targetIndex <= currentIndex) return true;

  for (let i = 0; i < targetIndex; i++) {
    if (!this.completedStepsSignal().has(this.tabs[i].id)) return false;
  }
  return true;
}
```

---

## New Files

| File | Type | Description |
|------|------|-------------|
| `components/review-section/review-section.ts` | Component | Review display |
| `components/review-section/review-section.html` | Template | Review layout |
| `components/review-section/review-section.css` | Styles | Review styling |
| `components/review-section/review-section.spec.ts` | Test | Review tests |
| `models/character-sheet.model.ts` | Model | CharacterSheetData interface |
| `utils/character-sheet-assembler.utils.ts` | Utility | Assembles selections into sheet data |
| `utils/character-sheet-assembler.utils.spec.ts` | Test | Assembler tests |
| `utils/stat-calculator.utils.ts` | Utility | Display evasion calculation |
| `utils/stat-calculator.utils.spec.ts` | Test | Calculator tests |

## Modified Files

| File | Change |
|------|--------|
| `services/class.mapper.ts` | Add startingEvasion, startingHitPoints to metadata |
| `services/class.mapper.spec.ts` | Update tests for metadata |
| `models/create-character.model.ts` | Add 'review' to TabId, add to CHARACTER_TABS |
| `create-character.ts` | Add ReviewSection import, remove domain-cards bypass |
| `create-character.html` | Add review case |

---

## Stat Derivation Summary

| Stat | Source | Submitted Value |
|------|--------|-----------------|
| `evasion` | Class `startingEvasion` | Base only (no equipment modifiers) |
| `hitPointMax` | Class `startingHitPoints` | As-is |
| `hitPointMarked` | Default | `0` |
| `hopeMax` | Default | `6` |
| `hopeMarked` | Default | `2` |
| `stressMax` | Default | `6` |
| `stressMarked` | Default | `0` |
| `armorMax` | Armor `baseScore` (or `0`) | As-is |
| `armorMarked` | Default | `0` |
| `majorDamageThreshold` | Armor `baseMajorThreshold` (or `3`) | As-is |
| `severeDamageThreshold` | Armor `baseSevereThreshold` (or `6`) | As-is |
| `gold` | Default | `0` |
| Trait modifiers | Trait assignments | As-is |
| Trait marked | Default | All `false` |
| `activePrimaryWeaponId` | Selected primary weapon | Weapon ID |
| `activeSecondaryWeaponId` | Selected secondary weapon | Weapon ID or `null` |
| `activeArmorId` | Selected armor | Armor ID or `null` |

---

## Validation Checklist

- [ ] Review tab appears after Domain Cards in the stepper
- [ ] Review tab is only reachable when all prior steps are complete
- [ ] All selections are displayed correctly in the review
- [ ] Display evasion shows base + modifier breakdown
- [ ] Stat values are correctly derived from class, armor, and traits
- [ ] Default values (hope, stress, gold, thresholds) are correct
- [ ] Equipment shows as active in the summary
- [ ] Domain cards show with correct domain colors
- [ ] All tests pass, lint passes, build succeeds
