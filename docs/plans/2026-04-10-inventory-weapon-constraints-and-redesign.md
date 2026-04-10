# Character Sheet Inventory — Weapon Constraints + Row Redesign

**Date:** 2026-04-10
**Branch:** `character_sheet_inventory`
**Scope:** Enforce weapon equip rules (primary/secondary/two-handed) and refactor the inventory-item row to display rich equipment-card-style content at full width.

---

## Goals

1. Enforce three equip rules for weapons in the character sheet inventory:
   - **Rule 1** — Only one weapon may occupy the primary slot. Attempting to add a second shows an error telling the player to unequip the current primary first.
   - **Rule 2** — Only one weapon may occupy the secondary slot. Same messaging.
   - **Rule 3** — A two-handed weapon occupies both slots. While any equipped weapon is `TWO_HANDED`, no other weapon may be equipped. A two-handed weapon may only be equipped when both slots are free.
2. Redesign the inventory item row so that weapons (and armor/loot) display the same richness as the equipped `equipment-card` component — name, tier badge, stats, features, feature tags — while staying **full-width**. The row should feel like a first-class equipment card inside the inventory list.

Rules 1 and 2 are already partially enforced by `canEquipPrimaryWeapon()` and `canEquipSecondaryWeapon()` in `character-sheet.ts` (they silently disable the equip buttons). This plan adds **Rule 3**, adds **explicit error messaging** when users attempt an invalid equip, and upgrades the visual treatment.

---

## Current State (verified)

### Validation

**File:** `src/app/features/character-sheet/character-sheet.ts`

```ts
// Lines 90–106
readonly canEquipPrimaryWeapon = computed(() => {
  const raw = this.rawSheet();
  if (!raw) return false;
  return !(raw.inventoryWeapons ?? []).some(w => w.slot === 'PRIMARY');
});

readonly canEquipSecondaryWeapon = computed(() => {
  const raw = this.rawSheet();
  if (!raw) return false;
  return !(raw.inventoryWeapons ?? []).some(w => w.slot === 'SECONDARY');
});
```

Neither signal considers weapon burden. `onEquipWeapon()` (lines 225–257) only checks `targetEntry.equipped` before proceeding. There is no path that rejects a two-handed weapon while the other slot is occupied.

### Inventory Row

**Files:**
- `src/app/features/character-sheet/components/inventory-section/components/inventory-item-row/inventory-item-row.ts`
- `inventory-item-row.html`
- `inventory-item-row.css`

Current row shows: name, tier badge, equipped badge, one-line stats (damage/range/burden for weapons, score for armor, cost tags for loot), and equip/unequip/remove buttons. **It does not show weapon features.**

The equipped display uses `EquipmentCard` (`components/equipment-card/`) which renders: name, badge, stats row, **features block** (name + HTML-formatted description + tags). This is the richness we want in the inventory row.

### Error Banner (already built)

`inventory-section.html` lines 10–15 + `inventory-section.css` render an `inventoryError` signal from the parent as a left-accent alert. Already dismissible. Use this for the new error messages — no new UI infrastructure needed.

### Data models

- `WeaponDisplay` (`character-sheet-view.model.ts:80`) already includes `burden: string` (`'ONE_HANDED' | 'TWO_HANDED'`) and `features: FeatureDisplay[]`. No mapper changes are required for validation or for showing features in the row.
- `inventoryWeapons[].slot` in the raw API response is `'PRIMARY' | 'SECONDARY'`.

---

## Design Decisions

### Validation architecture

- Keep raw validation in `character-sheet.ts`. Replace the two boolean signals with a single `weaponEquipConstraints` computed that exposes:
  - `primarySlotOccupied: boolean`
  - `secondarySlotOccupied: boolean`
  - `twoHandedEquipped: boolean` (true if the weapon currently in either slot is `TWO_HANDED`)
- Derive per-weapon button availability in the inventory-section **computed** from `weaponEquipConstraints` + the weapon's own burden. The parent still passes coarse flags, but we also expose a helper that the template calls with the specific weapon.
- In `onEquipWeapon()`, re-check the full rule set before firing the API. If violated, set `inventoryError` to a rule-specific message and bail out. This is a defense-in-depth step: the disabled buttons are the happy-path UX, and the error banner catches anything that slips through (e.g., stale signal state).

### Error messages (rule → message)

- **Rule 1 violated:** `"Unequip your current primary weapon before equipping a new one."`
- **Rule 2 violated:** `"Unequip your current secondary weapon before equipping a new one."`
- **Rule 3a** (equipping a two-handed weapon while the other slot is occupied): `"Two-handed weapons need both slots free. Unequip your other weapon first."`
- **Rule 3b** (equipping any weapon while a two-handed weapon is already equipped): `"A two-handed weapon is already equipped. Unequip it before equipping another weapon."`

### Inventory row visual refactor

We reuse the `EquipmentCard` component as the inventory row's visual foundation. The row composition becomes:

```
<div class="inventory-row">                        <!-- full-width wrapper -->
  <app-equipment-card
    [name]="..." [badge]="..." [stats]="..." [features]="..." />
  <div class="inventory-row__actions">              <!-- equip / unequip / remove -->
    ...buttons...
  </div>
</div>
```

The wrapper lives in `inventory-item-row` and:
- Preserves full-width layout (inherits parent grid/flex width).
- Composes `EquipmentCard` rather than copying its markup.
- Renders action buttons in a sibling footer (not inside the card, so equipment-card stays purely presentational).
- Shows a different visual state for the "confirming remove" mode (same red-tinted container as today).

Mapping `WeaponDisplay` → `EquipmentCard` inputs happens in the row's computed signals:
- `name` → `weapon.name`
- `badge` → equipped slot label ('Primary' / 'Secondary') **or** tier badge ('T2') when unequipped. If we want both, we can pass the equipped label as the badge and render tier as a small secondary pill in the wrapper. **Decision:** equipment-card currently supports one badge — we'll extend it to accept an optional `subBadge` for tier, or we'll render tier inside `stats` (see Open Questions).
- `stats` → `[ { damage }, { range }, { burden }, { trait } ]` for weapons; `[ { Score } ]` for armor; cost tags for loot.
- `features` → `weapon.features` (already `FeatureDisplay[]`).

Because `EquipmentCard` uses `border-left: 2px solid rgba(212,160,86,.3)` and a subtle background, the inventory list will gain a consistent visual language with the equipped weapons panel above it — which is exactly the user's goal.

### Component composition (no duplication)

Follows `.agents/rules/component-design.md`: we **reuse** `EquipmentCard` instead of duplicating its template in `inventory-item-row`. That keeps the presentational code in one place and means any future tweak to equipped display automatically propagates to inventory rows.

---

## Open Questions for Agent Team

These should be resolved during the impeccable design pass (Task B1):

1. **Badge stacking.** `EquipmentCard` currently supports one `badge` input. Do we extend it to accept a `subBadge` (for tier), or do we render the tier as the first entry in the `stats` array? The latter requires no API change to `EquipmentCard` but visually demotes tier.
2. **Loot rendering.** Loot has a description and cost tags but no stats. Should loot rows use `EquipmentCard` with description-as-feature, or keep a simpler layout? Default: use `EquipmentCard` with a synthetic `FeatureDisplay` wrapping the loot description.
3. **Action button placement.** Beneath the card (full-width footer) or aligned to the right of the header? Default: beneath, left-aligned, to match the current vertical flow.

---

## Implementation Plan

Work is split into three parallel streams (A/B/C). Stream C (tests) depends on A and B completing. Within Stream B, B1 (design) must finish before B2/B3.

### Stream A — Validation logic

#### A1 — Compute richer weapon equip constraints

**File:** `src/app/features/character-sheet/character-sheet.ts`

- Add a private computed `weaponEquipConstraints` that returns:
  ```ts
  {
    primarySlotOccupied: boolean;
    secondarySlotOccupied: boolean;
    twoHandedEquipped: boolean;
  }
  ```
  derived from `rawSheet().inventoryWeapons`.
- Replace `canEquipPrimaryWeapon` and `canEquipSecondaryWeapon` with computed signals that use the new constraints:
  - `canEquipPrimaryWeapon` = `!primarySlotOccupied && !twoHandedEquipped`
  - `canEquipSecondaryWeapon` = `!secondarySlotOccupied && !twoHandedEquipped`
- Keep the existing exported names to avoid downstream changes to `inventory-section` inputs.
- Add a new public method `canEquipWeaponInSlot(weapon: WeaponDisplay, slot: 'primary' | 'secondary'): boolean` that additionally checks two-handed rules:
  - A `TWO_HANDED` weapon can only be equipped to `primary`, and only when **both** slots are free.
  - A `ONE_HANDED` weapon can be equipped to the requested slot when that slot is free and no two-handed weapon is already equipped.

#### A2 — Enforce rules in `onEquipWeapon()`

**File:** `src/app/features/character-sheet/character-sheet.ts` (lines 225–257)

- At the top of the method, compute the violated rule (if any) using `canEquipWeaponInSlot()` plus an explicit check for the two-handed-target-secondary case.
- If a rule is violated, call `handleInventoryError(message, raw)` with the rule-specific string and return before touching signals.
- Otherwise, proceed with the existing optimistic-update + API call flow unchanged.

#### A3 — Pass per-weapon flags to inventory row

**Files:**
- `components/inventory-section/inventory-section.ts`
- `components/inventory-section/inventory-section.html`
- `components/inventory-section/components/inventory-item-row/inventory-item-row.ts`
- `components/inventory-section/components/inventory-item-row/inventory-item-row.html`

- Add a new input to `inventory-item-row`: `canEquipAsPrimary: boolean` and `canEquipAsSecondary: boolean` (replacing the current coarse `canEquipPrimary` / `canEquipSecondary` inputs).
- In `inventory-section.html`, compute these per-weapon by calling the parent's `canEquipWeaponInSlot` via a helper method on the section component: `canEquipAsPrimary(weapon)` / `canEquipAsSecondary(weapon)`. Because the parent passes down the constraint object, the section can do the math itself without calling back into `character-sheet.ts`.
- **Alternative:** expose `canEquipWeapon` as an `input<(w, slot) => boolean>()` callback. Avoid this — callbacks in inputs are brittle. Prefer passing the constraint object instead.
- Concretely: add `readonly weaponConstraints = input<{ primarySlotOccupied: boolean; secondarySlotOccupied: boolean; twoHandedEquipped: boolean }>()` on `inventory-section`, and have `inventory-section` expose `canEquipAsPrimary(weapon)` / `canEquipAsSecondary(weapon)` helpers used in the template.
- The row's `[disabled]` bindings switch from `canEquipPrimary()` / `canEquipSecondary()` to the new per-weapon flags.

### Stream B — Inventory row visual redesign

#### B1 — Design pass using `impeccable:frontend-design`

**Skill:** `impeccable:frontend-design`

- Invoke the skill on the `inventory-item-row` component with the brief:
  > Redesign the inventory row to match the richness of the equipped `equipment-card` (name, tier/slot badge, stats, features, feature tags) while staying full-width. It should feel like a card inside the inventory list, with the same left-accent gold border treatment. Action buttons (equip primary, equip secondary, unequip, remove) should sit in a footer beneath the card. Respect the warm tavern aesthetic (dark browns, gold `#d4a056`, Cinzel/Lora fonts) and the `anyComponentStyle` 4kB/8kB budget.
- Deliverable: a short design memo committed as a comment on the beads issue, plus any needed tweaks to `EquipmentCard` (e.g., a `subBadge` input if the team picks that option).

#### B2 — Refactor `inventory-item-row` to compose `EquipmentCard`

**Files:**
- `components/inventory-section/components/inventory-item-row/inventory-item-row.ts`
- `components/inventory-section/components/inventory-item-row/inventory-item-row.html`
- `components/inventory-section/components/inventory-item-row/inventory-item-row.css`

- Import and declare `EquipmentCard` in `inventory-item-row`'s `imports`.
- Add computed signals:
  - `cardName()` → item name
  - `cardBadge()` → equipped slot label (weapons) / 'Equipped' (armor) / consumable label (loot); fall back to tier label when nothing is equipped.
  - `cardStats()` → `EquipmentStat[]` derived from weapon/armor/loot fields.
  - `cardFeatures()` → `FeatureDisplay[]` (passed straight through for weapons/armor; wrapped description for loot).
- Template: replace the non-confirming branch with:
  ```html
  <div class="inventory-row">
    <app-equipment-card
      [name]="cardName()"
      [badge]="cardBadge()"
      [stats]="cardStats()"
      [features]="cardFeatures()" />
    <div class="inventory-row__actions">
      <!-- existing action buttons, unchanged structure -->
    </div>
  </div>
  ```
- CSS: the wrapper ensures full-width layout (`display: block`, no max-width), adds spacing for the actions row, and styles the confirming state. The card's own styling comes from `equipment-card.css`.
- Delete the old `.inventory-item__header`, `.inventory-item__stats`, and `.equipped-badge`/`.tier-badge`/`.consumable-badge` rules — they're superseded by `EquipmentCard`.

#### B3 — Extend `EquipmentCard` if the design requires it

**Files:** `components/equipment-card/equipment-card.ts` / `.html` / `.css`

- Only touch this if the Task B1 design memo calls for it (e.g., `subBadge` input, optional tier pill, variant for "unequipped").
- Any changes must remain backwards-compatible with the existing equipped-weapons usage in the character sheet header.

### Stream C — Tests (depends on A and B)

#### C1 — `character-sheet.spec.ts` — validation

- Add tests for `weaponEquipConstraints` covering: empty inventory, one primary, one secondary, one two-handed, both slots full.
- Add tests for `onEquipWeapon()` rejecting:
  - equipping a second primary
  - equipping a second secondary
  - equipping a two-handed weapon when secondary is occupied
  - equipping a one-handed weapon when a two-handed weapon is already equipped
- Assert the rejection path sets the `inventoryError` signal to the expected string and does **not** call `characterSheetService.updateCharacterSheet`.

#### C2 — `inventory-section.spec.ts` — wiring

- Verify the section forwards `weaponConstraints` into the row's per-weapon flags correctly.
- One test per rule: button disabled + hint shown when the constraint applies.

#### C3 — `inventory-item-row.spec.ts` — new composition

- Verify `EquipmentCard` is rendered for weapons with correct `name`, `badge`, `stats`, `features`.
- Verify confirming-remove state still renders the red banner.
- Verify action buttons still emit `equipClicked('primary' | 'secondary')`, `unequipClicked`, `removeClicked`, etc.
- Follow `.agents/rules/testing.md` — move any assertions that are now covered by `equipment-card.spec.ts` out of this file.

### Final gates

- `npm run lint`
- `npm run test:run`
- `npm run build`
- `bd close <ids>`, `git add`, `git commit`, `git pull --rebase`, `bd dolt push`, `git push`.

---

## Agent Team Task Breakdown

| Bead | Title | Stream | Depends On | Parallelizable |
|---|---|---|---|---|
| A1 | Compute weapon equip constraints (primary/secondary/two-handed) | A | — | yes (with B1) |
| A2 | Enforce weapon equip rules in `onEquipWeapon()` with specific errors | A | A1 | no |
| A3 | Forward per-weapon equip flags through `inventory-section` to row | A | A1 | yes (with B2) |
| B1 | Design memo: inventory row visual refactor (impeccable:frontend-design) | B | — | yes (with A1) |
| B2 | Refactor `inventory-item-row` to compose `EquipmentCard` at full width | B | B1 | yes (with A3) |
| B3 | Extend `EquipmentCard` inputs per design memo (optional) | B | B1 | yes |
| C1 | Tests — character-sheet validation | C | A2 | yes (with C2, C3) |
| C2 | Tests — inventory-section wiring | C | A3 | yes |
| C3 | Tests — inventory-item-row composition | C | B2 | yes |

**Recommended dispatch:** run A1 + B1 in parallel first. When A1 finishes, start A2 and A3. When B1 finishes, start B2 (and B3 if needed). When A2/A3/B2 finish, run C1/C2/C3 in parallel. Final: lint + test + build + push.
