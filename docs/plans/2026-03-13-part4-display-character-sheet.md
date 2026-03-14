# Part 4: Display Character Sheet

## Overview

Create a new page at `/character/:id` that fetches and displays a complete character sheet. Stats like Evasion and Armor Score are calculated by combining base values with modifiers from equipped armor, weapons, and features. The initial design will be simple and functional, displaying all information needed for gameplay.

---

## Prerequisites

- Part 3 (Submit Character Sheet) must be complete
- The `CharacterSheetService` from Part 3 provides the `getCharacterSheet()` method
- Route `/character/:id` is already registered in `app.routes.ts` (from Part 3)

---

## Implementation Steps

### 1. Create Character Sheet Feature Directory

```
src/app/features/character-sheet/
├── character-sheet.ts
├── character-sheet.html
├── character-sheet.css
├── character-sheet.spec.ts
├── models/
│   └── character-sheet-view.model.ts
└── utils/
    ├── modifier-calculator.utils.ts
    └── modifier-calculator.utils.spec.ts
```

### 2. Define Character Sheet View Model

**New file:** `src/app/features/character-sheet/models/character-sheet-view.model.ts`

This model represents the fully computed character sheet with display-ready values:

```typescript
export interface CharacterSheetView {
  id: number;
  name: string;
  pronouns?: string;
  level: number;

  // Computed stats (base + modifiers)
  evasion: DisplayStat;
  hitPointMax: DisplayStat;
  armorScore: DisplayStat;
  majorDamageThreshold: DisplayStat;
  severeDamageThreshold: DisplayStat;
  hopeMax: DisplayStat;
  stressMax: DisplayStat;

  // Current resource values
  hitPointMarked: number;
  armorMarked: number;
  armorMax: number;
  hopeMarked: number;
  stressMarked: number;
  gold: number;

  // Traits
  traits: TraitDisplay[];

  // Equipment
  activePrimaryWeapon: WeaponDisplay | null;
  activeSecondaryWeapon: WeaponDisplay | null;
  activeArmor: ArmorDisplay | null;

  // Cards
  subclassCards: CardSummary[];
  ancestryCards: CardSummary[];
  communityCards: CardSummary[];
  domainCards: CardSummary[];

  // Experiences
  experiences: ExperienceDisplay[];
}

export interface DisplayStat {
  base: number;
  modified: number;    // base + all applicable modifiers
  hasModifier: boolean; // true if modified !== base
}

export interface TraitDisplay {
  name: string;       // e.g., "Agility"
  abbreviation: string; // e.g., "AGI"
  modifier: number;
  marked: boolean;
}

export interface WeaponDisplay {
  id: number;
  name: string;
  damage: string;       // notation e.g., "2d10+3 phy"
  trait: string;
  range: string;
  burden: string;
  features: FeatureDisplay[];
}

export interface ArmorDisplay {
  id: number;
  name: string;
  baseScore: number;
  features: FeatureDisplay[];
}

export interface FeatureDisplay {
  name: string;
  description: string;
  tags: string[];
}

export interface CardSummary {
  id: number;
  name: string;
  features: FeatureDisplay[];
  domainName?: string;  // for domain cards
}

export interface ExperienceDisplay {
  id: number;
  description: string;
  modifier: number;
}
```

### 3. Create Modifier Calculator Utility

**New file:** `src/app/features/character-sheet/utils/modifier-calculator.utils.ts`

Computes display stats by applying all relevant modifiers from equipped items:

```typescript
import { ModifierTarget } from './types';

interface Modifier {
  target: string;
  operation: string;  // 'ADD' | 'SET' | 'MULTIPLY'
  value: number;
}

/**
 * Applies modifiers in the correct order: SET first, then MULTIPLY, then ADD.
 * This matches the backend's ModifierOperation evaluation order.
 */
export function applyModifiers(
  baseValue: number,
  modifiers: Modifier[],
  target: string,
): DisplayStat {
  const relevant = modifiers.filter(m => m.target === target);

  if (relevant.length === 0) {
    return { base: baseValue, modified: baseValue, hasModifier: false };
  }

  let result = baseValue;

  // Apply SET operations first
  const sets = relevant.filter(m => m.operation === 'SET');
  if (sets.length > 0) {
    result = sets[sets.length - 1].value; // last SET wins
  }

  // Apply MULTIPLY operations
  const multiplies = relevant.filter(m => m.operation === 'MULTIPLY');
  for (const mod of multiplies) {
    result = Math.floor(result * mod.value);
  }

  // Apply ADD operations
  const adds = relevant.filter(m => m.operation === 'ADD');
  for (const mod of adds) {
    result += mod.value;
  }

  return {
    base: baseValue,
    modified: result,
    hasModifier: result !== baseValue,
  };
}

/**
 * Collects all modifiers from expanded equipment on a character sheet.
 * Sources: activeArmor features, activePrimaryWeapon features, activeSecondaryWeapon features.
 */
export function collectEquipmentModifiers(sheet: CharacterSheetResponse): Modifier[] {
  const modifiers: Modifier[] = [];

  // From active armor
  if (sheet.activeArmor?.features) {
    for (const feature of sheet.activeArmor.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers);
      }
    }
  }

  // From active primary weapon
  if (sheet.activePrimaryWeapon?.features) {
    for (const feature of sheet.activePrimaryWeapon.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers);
      }
    }
  }

  // From active secondary weapon
  if (sheet.activeSecondaryWeapon?.features) {
    for (const feature of sheet.activeSecondaryWeapon.features) {
      if (feature.modifiers) {
        modifiers.push(...feature.modifiers);
      }
    }
  }

  return modifiers;
}
```

### 4. Create Character Sheet Mapper

**New file:** `src/app/features/character-sheet/utils/character-sheet-view.mapper.ts`

Maps the API response to the display-ready `CharacterSheetView`:

```typescript
export function mapToCharacterSheetView(
  sheet: CharacterSheetResponse,
): CharacterSheetView {
  const modifiers = collectEquipmentModifiers(sheet);

  return {
    id: sheet.id,
    name: sheet.name,
    pronouns: sheet.pronouns,
    level: sheet.level,

    // Computed stats
    evasion: applyModifiers(sheet.evasion, modifiers, 'EVASION'),
    hitPointMax: applyModifiers(sheet.hitPointMax, modifiers, 'HIT_POINT_MAX'),
    armorScore: applyModifiers(sheet.armorMax, modifiers, 'ARMOR_SCORE'),
    majorDamageThreshold: applyModifiers(sheet.majorDamageThreshold, modifiers, 'MAJOR_DAMAGE_THRESHOLD'),
    severeDamageThreshold: applyModifiers(sheet.severeDamageThreshold, modifiers, 'SEVERE_DAMAGE_THRESHOLD'),
    hopeMax: applyModifiers(sheet.hopeMax, modifiers, 'HOPE_MAX'),
    stressMax: applyModifiers(sheet.stressMax, modifiers, 'STRESS_MAX'),

    // Current values
    hitPointMarked: sheet.hitPointMarked,
    armorMarked: sheet.armorMarked,
    armorMax: sheet.armorMax,
    hopeMarked: sheet.hopeMarked,
    stressMarked: sheet.stressMarked,
    gold: sheet.gold,

    // Traits
    traits: mapTraits(sheet),

    // Equipment
    activePrimaryWeapon: sheet.activePrimaryWeapon ? mapWeapon(sheet.activePrimaryWeapon) : null,
    activeSecondaryWeapon: sheet.activeSecondaryWeapon ? mapWeapon(sheet.activeSecondaryWeapon) : null,
    activeArmor: sheet.activeArmor ? mapArmor(sheet.activeArmor) : null,

    // Cards
    subclassCards: (sheet.subclassCards ?? []).map(mapCardSummary),
    ancestryCards: (sheet.ancestryCards ?? []).map(mapCardSummary),
    communityCards: (sheet.communityCards ?? []).map(mapCardSummary),
    domainCards: (sheet.domainCards ?? []).map(c => mapCardSummary(c, true)),

    // Experiences
    experiences: (sheet.experiences ?? []).map(mapExperience),
  };
}
```

### 5. Create Character Sheet Component

**New file:** `src/app/features/character-sheet/character-sheet.ts`

```typescript
@Component({
  selector: 'app-character-sheet',
  templateUrl: './character-sheet.html',
  styleUrl: './character-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheet implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly characterSheetService = inject(CharacterSheetService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly characterSheet = signal<CharacterSheetView | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.loadCharacterSheet(id);
  }

  private loadCharacterSheet(id: number): void {
    const expandFields = [
      'experiences',
      'activePrimaryWeapon',
      'activeSecondaryWeapon',
      'activeArmor',
      'communityCards',
      'ancestryCards',
      'subclassCards',
      'domainCards',        // requires backend support
      'inventoryWeapons',
      'inventoryArmors',
    ];

    this.characterSheetService
      .getCharacterSheet(id, expandFields)
      .subscribe({
        next: (response) => {
          this.characterSheet.set(mapToCharacterSheetView(response));
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
```

### 6. Character Sheet Template Layout

**New file:** `src/app/features/character-sheet/character-sheet.html`

The layout should display all character information organized into sections. Here is the recommended section layout:

```
+------------------------------------------------------+
|  CHARACTER NAME                        Level 1        |
|  Pronouns                                             |
+------------------------------------------------------+

+--------+--------+--------+--------+--------+--------+
| EVA    | HP     | STRESS | HOPE   | ARMOR  | GOLD   |
| 12     | 6/10   | 0/6    | 2/6    | 3      | 0      |
+--------+--------+--------+--------+--------+--------+

+------------------------------------------------------+
| DAMAGE THRESHOLDS                                     |
|  Major: 5+    |    Severe: 9+                         |
+------------------------------------------------------+

+--------+--------+--------+--------+--------+--------+
| AGI    | STR    | FIN    | INS    | PRE    | KNO    |
| +2     | +1     | +1     | 0      | 0      | -1     |
+--------+--------+--------+--------+--------+--------+

+------------------------------------------------------+
| EQUIPMENT                                             |
|  Primary Weapon: Longbow (2d8 phy, Far, Two-Handed)  |
|  Armor: Leather Armor (Score: 3, Major: 5+, Sev: 9+)|
+------------------------------------------------------+

+------------------------------------------------------+
| EXPERIENCES                                           |
|  +2 Hunting in the Wildlands                         |
|  +2 Navigating the Undercity                         |
+------------------------------------------------------+

+------------------------------------------------------+
| SUBCLASS                                              |
|  Warden of the Grove (Sage · Bone)                   |
|  Features: ...                                        |
+------------------------------------------------------+

+------------------------------------------------------+
| ANCESTRY & COMMUNITY                                  |
|  Ancestry: Halfling   |   Community: The Wanderers   |
|  Features: ...        |   Features: ...               |
+------------------------------------------------------+

+------------------------------------------------------+
| DOMAIN CARDS                                          |
|  [Card 1]              |  [Card 2]                    |
|  with domain colors    |  with domain colors          |
+------------------------------------------------------+
```

**Sections to include (comprehensive - will trim later):**

1. **Header** - Name, pronouns, level
2. **Core Stats Bar** - Evasion, HP, Stress, Hope, Armor Score, Gold
   - Show modifier breakdowns on hover/click (e.g., "Base 10 + 2 from armor")
3. **Damage Thresholds** - Major and Severe
4. **Traits Grid** - All 6 traits with modifiers and marked status
5. **Equipment** - Active weapons and armor with stats
6. **Experiences** - List with modifiers
7. **Subclass** - Name, domains, features
8. **Ancestry & Community** - Names and features
9. **Domain Cards** - Both cards displayed with domain theme colors and features
10. **Inventory** - Other weapons/armor in inventory (non-active)

### 7. Styling

**New file:** `src/app/features/character-sheet/character-sheet.css`

Follow the project's warm tavern aesthetic:
- Dark brown backgrounds with parchment tones
- Gold accents (#d4a056) for headers and borders
- Cinzel font for section headers
- Lora font for body text
- Use CSS custom properties for domain card colors
- Responsive layout (stack on mobile)

For stat values with modifiers, show the modified value prominently with the base value in smaller text:
```css
.stat-modified {
  color: var(--gold-accent, #d4a056);
}
.stat-base {
  font-size: 0.75em;
  opacity: 0.7;
}
```

### 8. Design Approach

Use the `frontend-design` skill when implementing to generate a polished initial design. Key design principles:

- **Information hierarchy:** Core stats (evasion, HP, stress, hope) are most prominent
- **Scannable:** Players need to find values quickly during gameplay
- **Comprehensive:** Include all information; we'll trim in later iterations
- **Consistent:** Use existing DaggerheartCard component for domain cards display
- **Accessible:** Proper contrast ratios, semantic HTML, screen reader support

---

## New Files

| File | Type | Description |
|------|------|-------------|
| `features/character-sheet/character-sheet.ts` | Component | Main character sheet page |
| `features/character-sheet/character-sheet.html` | Template | Character sheet layout |
| `features/character-sheet/character-sheet.css` | Styles | Character sheet styling |
| `features/character-sheet/character-sheet.spec.ts` | Test | Component tests |
| `features/character-sheet/models/character-sheet-view.model.ts` | Model | Display view model |
| `features/character-sheet/utils/modifier-calculator.utils.ts` | Utility | Modifier calculation |
| `features/character-sheet/utils/modifier-calculator.utils.spec.ts` | Test | Calculator tests |
| `features/character-sheet/utils/character-sheet-view.mapper.ts` | Utility | Response → view mapping |
| `features/character-sheet/utils/character-sheet-view.mapper.spec.ts` | Test | Mapper tests |

## Modified Files

| File | Change |
|------|--------|
| `app.routes.ts` | Already added in Part 3 |
| `core/services/character-sheet.service.ts` | Already created in Part 3 (getCharacterSheet used here) |

---

## API Expand Fields Used

When fetching the character sheet for display, request all available expand fields:

```
GET /api/dh/character-sheets/{id}?expand=experiences,activePrimaryWeapon,activeSecondaryWeapon,activeArmor,communityCards,ancestryCards,subclassCards,domainCards,inventoryWeapons,inventoryArmors
```

This provides all nested objects needed for display without additional API calls.

Note: `domainCards` expand requires the backend update described in Part 3.

---

## Modifier Calculation Rules

When displaying computed stats, apply modifiers from ALL equipped items in this order (per backend specification):

1. **SET** operations applied first (last SET wins)
2. **MULTIPLY** operations applied second (floor result)
3. **ADD** operations applied last

**Modifier sources:**
- Active armor features → modifiers
- Active primary weapon features → modifiers
- Active secondary weapon features → modifiers

**Modifier targets for display:**

| Target | Applies To |
|--------|-----------|
| `EVASION` | Evasion stat display |
| `HIT_POINT_MAX` | Hit Point Max display |
| `ARMOR_SCORE` | Armor score display |
| `MAJOR_DAMAGE_THRESHOLD` | Major threshold display |
| `SEVERE_DAMAGE_THRESHOLD` | Severe threshold display |
| `HOPE_MAX` | Hope max display |
| `STRESS_MAX` | Stress max display |
| `AGILITY` through `KNOWLEDGE` | Individual trait displays |

---

## Validation Checklist

- [ ] Page loads at `/character/:id`
- [ ] Loading state shows while fetching
- [ ] Error state shows for invalid IDs or API errors
- [ ] All character stats display correctly
- [ ] Modifier calculations are applied correctly to display values
- [ ] Base vs modified values are distinguishable when modifiers are present
- [ ] Equipment details show with damage notation and properties
- [ ] All 6 traits display with correct modifiers
- [ ] Experiences list with modifiers
- [ ] Domain cards display with correct domain theme colors
- [ ] Ancestry and community cards display with features
- [ ] Subclass card displays with features
- [ ] Page is responsive (works on mobile)
- [ ] Page follows project design system (tavern aesthetic, Cinzel/Lora fonts)
- [ ] All tests pass, lint passes, build succeeds
