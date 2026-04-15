# Plan: Bonus Domain Card Selections (Frontend)

**Backend spec:** `frontend-bonus-domain-card-selections.md`
**Backend branch:** `apr14_tweaks_3`
**Goal:** Render extra domain-card picker slots and inject matching `FEATURE_DOMAIN_CARD` advancements when a player takes a subclass card whose feature carries the new `BONUS_DOMAIN_CARD_SELECTIONS` modifier.

---

## 0. Two mechanisms — do not conflate

This plan introduces a mechanism that **adds to** — never replaces — the existing level-up domain-card advancement. Both mechanisms can be active in the same level-up and their slot counts are **additive**.

| | **`GAIN_DOMAIN_CARD`** (existing) | **`BONUS_DOMAIN_CARD_SELECTIONS`** (new) |
|---|---|---|
| What it is | Advancement **type** the player actively selects | **Modifier** sitting on a subclass-card feature |
| User-visible? | Yes — listed in the advancement picker | No — never appears in any picker |
| How triggered | Player clicks it in advancement step | Side-effect of picking a subclass card (creation, `UPGRADE_SUBCLASS`, or `MULTICLASS`) |
| Counts toward "exactly 2 player advancements"? | Yes | No |
| Per-tier limit | 1/tier (server-enforced) | None |
| Where it lives | `AdvancementType` enum | `ModifierTarget` enum |
| Request serialization | One entry `{ type: 'GAIN_DOMAIN_CARD', domainCardId, equipDomainCard }` | One entry per bonus slot `{ type: 'FEATURE_DOMAIN_CARD', domainCardId }` — always unequipped |
| Applies at creation? | No (level-up only) | Yes and at level-up |
| Shape example | — | `{ target: 'BONUS_DOMAIN_CARD_SELECTIONS', operation: 'ADD', value: 1 }` |

### Slot-count formulas

| Flow | Formula |
|---|---|
| Character creation | `2 + Σ bonus` |
| Level-up (no `GAIN_DOMAIN_CARD`) | `1 + Σ bonus` |
| Level-up (with `GAIN_DOMAIN_CARD`) | `2 + Σ bonus` |

`Σ bonus` = `sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS')` summed across **all newly-acquired subclass cards this flow** (usually one, but the code sums to stay correct as more bonus sources appear later).

### Request-assembly mapping (level-up)

Ordered `selectedDomainCards` from the UI:

- `cards[0]` → `newDomainCardId` (the always-present base slot).
- If `GAIN_DOMAIN_CARD` is among advancements, `cards[1]` → that advancement's `domainCardId`, `equipDomainCard` comes from UI toggle.
- Remaining `cards[baseRequired..]` → one `{ type: 'FEATURE_DOMAIN_CARD', domainCardId }` each, appended to the `advancements` array. Never set `equipDomainCard` here.

`GAIN_DOMAIN_CARD` logic is untouched. Bonus logic is a separate summed term.

---

## 1. Ground rules (confirmed with user)

1. Count/cap enforcement at character creation is **client-only** (server only dedupes).
2. Tier cap at creation is **client-only** (level-1 cards only).
3. Foundation / Specialization / Mastery cards can all carry the modifier — same flow applies regardless of subclass level.
4. Bonus cards always land in **vault**, never equipped — at both creation and level-up.
5. Modifier values **sum across all sources** like any other stacking character modifier. Today only one subclass card is picked at a time, but future cards may add more.
6. `FEATURE_DOMAIN_CARD` is **never** a user-selectable advancement. The only path to it is picking a qualifying subclass card.
7. Bonus is granted **once**, at the moment the feature is taken. A character who took a bonus-granting feature at a previous level must **not** get extra pickers on subsequent level-ups.

## 2. Constraints

- Angular 21 standalone components, signals, OnPush. `input()`/`output()` functions, not decorators.
- No Tailwind utility classes in templates — vanilla CSS with project design tokens.
- All new/changed code needs Vitest specs. `npm run test:run`, `npm run lint`, `npm run build` must pass.
- No speculative abstractions. The one generic helper below is generic because modifier summation is naturally generic; all other wiring stays specific to this modifier until a second use case exists.

---

## 3. File-by-file changes

### 3.1 Types — `src/app/features/level-up/models/level-up-api.model.ts`

Add `FEATURE_DOMAIN_CARD` to `AdvancementType`:

```ts
export type AdvancementType =
  | 'BOOST_TRAITS' | 'GAIN_HP' | 'GAIN_STRESS' | 'BOOST_EXPERIENCES'
  | 'GAIN_DOMAIN_CARD' | 'BOOST_EVASION' | 'UPGRADE_SUBCLASS'
  | 'BOOST_PROFICIENCY' | 'MULTICLASS'
  | 'FEATURE_DOMAIN_CARD';                   // NEW — never player-selectable
```

### 3.2 New shared modifier utility — `src/app/shared/utils/feature-modifier.utils.ts`

The user flagged more bonus modifiers are coming, so the summation helper lives in `shared/utils`, not inside a feature folder.

```ts
import { FeatureResponse, ModifierResponse } from '../../features/create-character/models/character-sheet-api.model';

export type ModifierTarget =
  | 'BONUS_DOMAIN_CARD_SELECTIONS'
  // Additional targets added lazily as they're consumed by the frontend.
  ;

/** Sum of ADD-operation modifier values targeting `target` across all features. */
export function sumFeatureModifier(
  features: readonly FeatureResponse[] | undefined,
  target: ModifierTarget,
): number {
  if (!features) return 0;
  return features.reduce((acc, f) => acc + sumOneFeature(f.modifiers, target), 0);
}

function sumOneFeature(
  modifiers: readonly ModifierResponse[] | undefined,
  target: ModifierTarget,
): number {
  if (!modifiers) return 0;
  return modifiers
    .filter(m => m.target === target && m.operation === 'ADD')
    .reduce((sum, m) => sum + m.value, 0);
}
```

Spec file `feature-modifier.utils.spec.ts`:
- Returns 0 for undefined/empty features.
- Returns 0 when no modifier matches the target.
- Sums a single `ADD` modifier.
- Sums across **multiple features** on one card.
- Ignores non-`ADD` operations (`SET`, `MULTIPLY`).
- Ignores modifiers targeting a different target string.

> This helper is the one piece of generalization we commit to now — it makes the next `BONUS_*` modifier a one-liner at the call site, which is the only justification for generalizing at all.

### 3.3 Character creation

#### 3.3.a Bonus-slot computation

In `create-character.ts`:

```ts
readonly bonusDomainCardSlots = computed<number>(() => {
  const subclass = this.selectedSubclassCard();
  const features = subclass?.metadata?.['features'] as FeatureResponse[] | undefined;
  return sumFeatureModifier(features, 'BONUS_DOMAIN_CARD_SELECTIONS');
});

private static readonly CREATION_BASE_DOMAIN_CARDS = 2;

readonly domainCardMaxSelections = computed<number>(() =>
  CreateCharacter.CREATION_BASE_DOMAIN_CARDS + this.bonusDomainCardSlots()
);
```

**Scout check (do first):** verify `CardData.metadata` on a subclass card includes `features[]` with `modifiers[]`. If not, update the subclass mapper in `src/app/shared/mappers/` or `src/app/shared/services/subclass.service.ts` to pass them through. Prefer the mapper fix — one place, no refetch. If this turns out non-trivial, pause and update this plan before continuing.

#### 3.3.b Domain-card picker wiring

`create-character.html` — pass the computed `maxSelections` into the domain-card picker. Add a visually distinct note/subtitle when `bonusDomainCardSlots() > 0`: *"Includes N bonus card(s) from your subclass feature."*

#### 3.3.c Submission

In `character-sheet-submission.utils.ts` / `character-sheet-assembler.utils.ts`: all picked domain cards (base 2 + bonus) go into `vaultDomainCardIds`; `equippedDomainCardIds` stays empty (rule 4). That matches today's creation behavior, so verify rather than change.

#### 3.3.d Step-completion guard

Require `selectedDomainCards().length === domainCardMaxSelections()` for the domain-card step to be marked complete.

#### 3.3.e Tests

- `create-character.spec.ts`: pick a subclass whose features carry `BONUS_DOMAIN_CARD_SELECTIONS: ADD 1` → step requires 3 picks; all 3 land in `vaultDomainCardIds`; `equippedDomainCardIds` stays empty.
- Pick a subclass without the modifier → still requires 2.
- Switching subclass after selecting domain cards: existing behavior clears selections; verify `bonusDomainCardSlots()` recomputes to the new card's value.

### 3.4 Level-up

#### 3.4.a Bonus detection — `src/app/features/level-up/utils/bonus-domain-card.utils.ts`

```ts
/**
 * Slots granted by BONUS_DOMAIN_CARD_SELECTIONS modifiers on subclass cards
 * newly acquired via this level-up's UPGRADE_SUBCLASS / MULTICLASS advancements.
 */
export function countBonusSlotsFromAdvancements(
  chosen: readonly AdvancementChoice[],
  ownedSubclassIds: ReadonlySet<number>,
  subclassCardLookup: (id: number) => SubclassCardResponse | undefined,
): number {
  let total = 0;
  for (const a of chosen) {
    if (a.type !== 'UPGRADE_SUBCLASS' && a.type !== 'MULTICLASS') continue;
    if (a.subclassCardId == null) continue;
    if (ownedSubclassIds.has(a.subclassCardId)) continue;  // rule 7: one-time grant
    const card = subclassCardLookup(a.subclassCardId);
    total += sumFeatureModifier(card?.features, 'BONUS_DOMAIN_CARD_SELECTIONS');
  }
  return total;
}
```

Spec covers: empty array, no matching type, matching type with no modifier, matching type with modifier, multiple matches summed, `ownedSubclassIds` filter skips re-grants, missing `subclassCardId`, lookup returning undefined.

#### 3.4.b Subclass-card lookup plumbing

The advancement picker already loads subclass cards for `UPGRADE_SUBCLASS`/`MULTICLASS` options. We need `features[]` + `modifiers[]` on those responses.

**Scout check (do first):** read `advancement-config.ts` (or wherever subclass cards are fetched for these advancement types) and confirm the fetch expands features+modifiers. If not, add the expansion parameter. Hoist the fetched cards into a `Map<number, SubclassCardResponse>` signal on `level-up.ts` so `countBonusSlotsFromAdvancements` can look them up synchronously in the `computed`. Name it `subclassCardById`.

If the advancement picker currently fetches cards lazily per-option and doesn't cache them, we'll also need to cache them into that map as they load.

#### 3.4.c Re-grant guard

The server excludes already-owned cards from `UPGRADE_SUBCLASS`/`MULTICLASS` options, but we still pass `ownedSubclassIds` into the helper (§3.4.a) as defense-in-depth and to document the invariant. Source: `rawSheet().subclassCardIds`.

#### 3.4.d `level-up.ts` wiring

Replace the current `domainCardMaxSelections` computed:

```ts
// existing
readonly domainCardMaxSelections = computed(() => {
  const hasGainDomainCard = this.selectedAdvancements().some(a => a.type === 'GAIN_DOMAIN_CARD');
  return hasGainDomainCard ? 2 : 1;
});
```

Becomes:

```ts
readonly bonusDomainCardSlots = computed<number>(() =>
  countBonusSlotsFromAdvancements(
    this.selectedAdvancements(),
    new Set(this.rawSheet()?.subclassCardIds ?? []),
    (id) => this.subclassCardById().get(id),
  )
);

readonly baseDomainCardSelections = computed<number>(() =>
  this.selectedAdvancements().some(a => a.type === 'GAIN_DOMAIN_CARD') ? 2 : 1
);

readonly domainCardMaxSelections = computed<number>(() =>
  this.baseDomainCardSelections() + this.bonusDomainCardSlots()
);
```

`GAIN_DOMAIN_CARD` logic stays identical — it's only ever the base term.

#### 3.4.e Request assembly

Update `LevelUpWizardState` and `assembleLevelUpRequest`:

```ts
export interface LevelUpWizardState {
  advancements: AdvancementChoice[];       // player-chosen only
  newExperienceDescription?: string;
  newDomainCardId: number;
  equipNewDomainCard: boolean;
  unequipDomainCardId?: number;
  trades: DomainCardTradeRequest[];
  bonusDomainCardIds: number[];            // NEW — zero or more
}
```

```ts
export function assembleLevelUpRequest(state: LevelUpWizardState): LevelUpRequest {
  const bonusEntries: AdvancementChoice[] = state.bonusDomainCardIds.map(id => ({
    type: 'FEATURE_DOMAIN_CARD',
    domainCardId: id,
  }));

  const request: LevelUpRequest = {
    advancements: [...state.advancements, ...bonusEntries],
    newDomainCardId: state.newDomainCardId,
  };

  // ...existing optional-field wiring unchanged...
  return request;
}
```

In `level-up.ts#onSubmit`, split `selectedDomainCards`:

```ts
const cards = this.selectedDomainCards();
const base = this.baseDomainCardSelections();

const advancements = this.selectedAdvancements().map(a => {
  if (a.type === 'GAIN_DOMAIN_CARD' && cards.length > 1) {
    return { ...a, domainCardId: cards[1].id, equipDomainCard: this.equipNewDomainCard() };
  }
  return a;
});

const bonusDomainCardIds = cards.slice(base).map(c => c.id);

const request = assembleLevelUpRequest({
  advancements,
  newExperienceDescription: /* unchanged */,
  newDomainCardId: cards[0].id,
  equipNewDomainCard: this.equipNewDomainCard(),
  unequipDomainCardId: this.unequipDomainCardId(),
  trades: this.trades(),
  bonusDomainCardIds,
});
```

#### 3.4.f UX

- Domain-card step: when `bonusDomainCardSlots() > 0`, show a callout: *"Your new subclass feature grants N bonus domain card(s). These go straight to your vault."*
- Equip toggle and unequip-to-make-room UI stay as-is — they continue to apply only to `cards[0]` (the Step-4 base pick). Bonus picks are implicitly vault-only; the copy above makes this explicit.
- No changes to domain-trade step.

#### 3.4.g Undo / level-down

No frontend change. Backend `DELETE .../level-up` already reverses `FEATURE_DOMAIN_CARD` entries from the advancement log.

#### 3.4.h Tests

- `bonus-domain-card.utils.spec.ts`: see §3.4.a.
- `level-up-request-assembler.utils.spec.ts` — extend:
  - 0 bonus → no `FEATURE_DOMAIN_CARD` entries.
  - 1 bonus → exactly 1, correct `domainCardId`, no `equipDomainCard`.
  - 2 bonuses → 2 entries with correct IDs.
  - Bonus entries appear **after** player-chosen advancements (spec example order).
  - Coexists with `GAIN_DOMAIN_CARD`: request has 2 player entries + N bonus entries; `GAIN_DOMAIN_CARD.domainCardId` = `cards[1]`; bonus entries use `cards[2..]`.
- `level-up.spec.ts`:
  - `UPGRADE_SUBCLASS` (card carries `BONUS_DOMAIN_CARD_SELECTIONS: ADD 1`) + `GAIN_HP` → `domainCardMaxSelections()` = 2 (1 base + 1 bonus); submitted request has 2 advancements + 1 `FEATURE_DOMAIN_CARD`.
  - `UPGRADE_SUBCLASS` + `GAIN_DOMAIN_CARD` + bonus 1 → `domainCardMaxSelections()` = 3; `newDomainCardId` = cards[0]; `GAIN_DOMAIN_CARD.domainCardId` = cards[1]; `FEATURE_DOMAIN_CARD.domainCardId` = cards[2].
  - Character already owns the subclass card referenced by `UPGRADE_SUBCLASS` (shouldn't happen but defense-in-depth): no bonus slots added.

### 3.5 No backend changes

None. User has shipped the backend support.

---

## 4. Scout checks to do before writing code

These could invalidate parts of the plan. Verify each first; update this plan file before proceeding if any are wrong.

1. **Creation-time subclass metadata** — does `CardData.metadata` on a subclass card include `features[]` with `modifiers[]`? Source: `subclass.service.ts` + mapper in `shared/mappers/`.
2. **Level-up advancement-card expansion** — does the advancement picker fetch include `features[]` + `modifiers[]` on subclass-card responses? Source: `advancement-config.ts`.
3. **Server contract** — `UPGRADE_SUBCLASS`/`MULTICLASS` options exclude already-owned subclass cards. Source: backend spec; confirmed by inspection.

## 5. Order of execution

1. Scout checks (§4).
2. Shared helper + spec (§3.2).
3. `AdvancementType` enum addition (§3.1).
4. Creation flow (§3.3) end-to-end, with specs.
5. Level-up flow (§3.4) end-to-end, with specs.
6. `npm run lint && npm run test:run && npm run build`.
7. Commit + push per session-completion protocol in `AGENTS.md`.

## 6. Out of scope

- Additional `BONUS_*` modifier targets (helper is ready when they arrive).
- Any UI for equipping bonus cards (rule 4: always vault).
- Backend changes.
