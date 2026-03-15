# Level-Up Enhancements Spec

**Date:** 2026-03-15
**Branch:** `level-up`
**Status:** In Progress

## Summary

Six enhancements to the level-up wizard UI. All changes are **frontend-only** -- no backend modifications required.

---

## Item 1: Trait Boost Arrow Indicator

**Current:** When selecting traits in BOOST_TRAITS, each trait shows its current modifier (e.g., `+1`).
**Desired:** When a trait is selected, show the change: `+1 → +2`. When unselected, revert to just `+1`.

### Files to Modify
- `src/app/features/level-up/components/advancement-config/advancement-config.html` (add arrow indicator)
- `src/app/features/level-up/components/advancement-config/advancement-config.css` (style the arrow)

### Implementation
- In the `BOOST_TRAITS` template block, conditionally render `→ +{{ trait.modifier + 1 }}` after the current modifier when `isTraitSelected(trait.name)` is true.
- Style the arrow and new value with a distinct color (gold accent `#d4a056`) to indicate the upgrade.

### Acceptance Criteria
- [ ] Unselected trait shows only current modifier (e.g., `+1`)
- [ ] Selected trait shows `+1 → +2` with arrow
- [ ] Deselecting trait reverts to showing only current modifier
- [ ] Arrow and new value use gold accent color
- [ ] Works for negative modifiers (e.g., `-1 → +0`)

---

## Item 2: New Experience at Tier Transitions

**Finding:** Already fully implemented in both backend and frontend.

- Backend `POST /api/dh/character-sheets/{id}/level-up` accepts `newExperienceDescription` (required at tier transitions, creates experience with +2 modifier)
- Frontend `tier-achievements-step` component has the text input and emits description changes
- `computeVisibleTabs()` shows the tier-achievements tab when `isTierTransition === true`
- `assembleLevelUpRequest()` includes `newExperienceDescription` when provided during tier transition

**Tier transitions occur at:** Level 1→2, 4→5, 7→8 (entering Tiers 2, 3, 4)

### Acceptance Criteria
- [x] Backend supports `newExperienceDescription` field
- [x] Frontend shows tier-achievements tab on tier transitions
- [x] Text input for experience description exists with +2 modifier note
- [x] Request assembler includes description in level-up request

**No changes needed.**

---

## Item 3: Domain Card Tile Sizing

**Current:** Domain cards in `domain-card-step` use `CardSelectionGrid` with default layout (`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))`). Cards with `collapsibleFeatures="true"` don't expand fully to show features.
**Desired:** Fix sizing so features display properly; fallback to wide layout if needed.

### Files to Modify
- `src/app/features/level-up/components/domain-card-step/domain-card-step.html` (add `layout="wide"`)

### Implementation
- Switch domain-card-step's `CardSelectionGrid` to `layout="wide"` to match the create-character pattern.
- This uses `grid-template-columns: 1fr` (full-width single column) which gives features plenty of space.
- Also apply same fix to advancement-config's GAIN_DOMAIN_CARD card grid.

### Acceptance Criteria
- [ ] Domain cards in domain-card-step display at full width (wide layout)
- [ ] All features are visible without truncation
- [ ] Domain cards in GAIN_DOMAIN_CARD advancement config also use wide layout
- [ ] Cards remain readable and properly styled on mobile

---

## Item 4: Level Filter for Domain Card Selection

**Current:** All available domain cards (up to level cap) are shown with no filtering.
**Desired:** Filter pills/buttons allowing users to toggle which levels are displayed.

### Files to Modify
- `src/app/features/level-up/components/domain-card-step/domain-card-step.ts` (add filter state + logic)
- `src/app/features/level-up/components/domain-card-step/domain-card-step.html` (add filter UI)
- `src/app/features/level-up/components/domain-card-step/domain-card-step.css` (filter pill styles)

### Implementation
- Add `selectedLevels` signal containing a `Set<number>` (initially all levels selected).
- Compute `availableLevels` from the loaded card data (unique levels sorted ascending).
- Add `filteredCards` computed that filters `availableCards` by `selectedLevels`.
- Render filter pill buttons above the card grid (one per level).
- Toggle individual levels on/off; "All" button to reset.
- Pass `filteredCards()` instead of `availableCards()` to the CardSelectionGrid.

### Acceptance Criteria
- [ ] Filter pills show all available levels (e.g., "1", "2", "3")
- [ ] Clicking a pill toggles that level on/off
- [ ] "All" button selects all levels
- [ ] Card grid updates immediately on filter change
- [ ] At least one level must remain active (disable last active pill or show message)
- [ ] Filter persists while on the step (not reset on re-render)
- [ ] Styling matches tavern aesthetic (gold accent pills)

---

## Item 5: Fix Subclass Selection Display (UPGRADE_SUBCLASS)

**Root Cause:** Two bugs prevent subclass cards from loading in `advancement-config.ts`:

1. **Missing model field:** `SubclassCardSummary` (view model) lacks `associatedClassId`. The `loadSubclassUpgrades()` method casts subclass cards to access this field, but it doesn't exist on the mapped view model, so `classIds` is always empty and the method returns early.

2. **Missing metadata field:** `mapSubclassResponseToCardData()` in `subclass.mapper.ts` doesn't include `subclassPathName` in metadata. The `loadSubclassUpgrades()` filter checks `c.metadata?.['subclassPathName']`, which is always undefined, so filtered results are always empty.

**Additional:** The `SubclassCardResponse` in `subclass-api.model.ts` is missing `associatedClassId`, `associatedClassName`, and `subclassPathName` fields that the API returns.

### Files to Modify
- `src/app/shared/models/subclass-api.model.ts` -- add missing fields to SubclassCardResponse
- `src/app/shared/mappers/subclass.mapper.ts` -- add `subclassPathName`, `associatedClassId`, `associatedClassName` to metadata
- `src/app/features/character-sheet/models/character-sheet-view.model.ts` -- add `associatedClassId` to SubclassCardSummary
- `src/app/features/character-sheet/utils/character-sheet-view.mapper.ts` -- map `associatedClassId`
- `src/app/features/level-up/components/advancement-config/advancement-config.ts` -- fix class ID lookup, use SubclassPathSelector
- `src/app/features/level-up/components/advancement-config/advancement-config.html` -- replace CardSelectionGrid with SubclassPathSelector for UPGRADE_SUBCLASS

### Implementation

**Step 1: Fix API model**
Add to `SubclassCardResponse` in `subclass-api.model.ts`:
```typescript
associatedClassId?: number;
associatedClassName?: string;
subclassPathName?: string;
```

**Step 2: Fix subclass mapper metadata**
In `subclass.mapper.ts`, add to metadata object:
```typescript
subclassPathName: response.subclassPathName,
associatedClassId: response.associatedClassId,
associatedClassName: response.associatedClassName,
```

**Step 3: Fix view model**
Add `associatedClassId?: number` to `SubclassCardSummary`.

**Step 4: Fix view mapper**
In `mapSubclassCardSummary()`, add `associatedClassId: card.associatedClassId`.

**Step 5: Fix advancement-config**
- Change `loadSubclassUpgrades()` to get `associatedClassId` from the fixed `SubclassCardSummary`.
- Load ALL subclass cards for the character's class (not just matching paths).
- Display with `SubclassPathSelector` component (tabs for Foundation/Specialization/Mastery).
- Filter to show only paths the character currently has (for upgrade), showing next available level.

### Acceptance Criteria
- [ ] UPGRADE_SUBCLASS shows subclass cards grouped by path with level tabs
- [ ] Foundation/Specialization/Mastery tabs work like create-character
- [ ] Only paths the character currently belongs to are shown
- [ ] Selecting a card emits correct `AdvancementChoice` with `subclassCardId`
- [ ] Wide card layout is used for display

---

## Item 6: Upgraded Subclass Card Advancement Tile

**Finding:** The UPGRADE_SUBCLASS advancement type already exists in the backend and is returned in `availableAdvancements` when applicable (Tier 3+). It appears as a tile in the advancements grid with label "Upgrade Subclass".

**Issue:** The tile appears correctly, but when selected, the config panel shows nothing because of the bugs described in Item 5. Fixing Item 5 resolves this.

**When it appears:** UPGRADE_SUBCLASS is available starting at Tier 3 (level 5+). If testing with a character below level 5, it won't appear in the advancement options.

### Acceptance Criteria
- [ ] UPGRADE_SUBCLASS tile appears for Tier 3+ characters (resolved by backend)
- [ ] Selecting the tile shows the subclass card selector (resolved by Item 5 fix)
- [ ] Selected subclass card is correctly included in level-up request

---

## Progress Checklist

- [x] **Item 1:** Trait boost arrow indicator (5 new tests)
- [x] **Item 2:** New experience at tier transitions (already implemented)
- [x] **Item 3:** Domain card wide layout fix
- [x] **Item 4:** Level filter for domain cards (6 new tests)
- [x] **Item 5:** Fix subclass model/mapper/loading bugs (4 new/updated tests)
- [x] **Item 6:** Upgrade subclass display (uses SubclassPathSelector with tabs)
- [x] All 1213 tests pass (`npm run test:run`)
- [x] Lint passes (`npm run lint`)
- [x] Build succeeds (`npm run build`)

## Backend Changes

**None required.** All level-up API endpoints already support the needed functionality.
