# Plan: Submit Character Sheet & Add NPC to Campaign

**Date:** 2026-04-02
**Feature:** Allow players to submit character sheets for GM approval, and GMs to add NPC character sheets directly.

---

## 1. Overview

The campaign detail page currently shows players, characters, and pending approvals — but there's no UI for getting character sheets *into* a campaign. This plan adds two flows:

1. **Submit Character (Player flow):** A player in the campaign picks one of their own character sheets and submits it for GM approval. It appears in the "Pending Submissions" section for the GM to approve/reject.

2. **Add NPC (GM flow):** A GM picks any of their own character sheets and adds it directly as a Non-Player Character. NPCs skip the approval queue.

Both flows need a **character sheet picker** — a UI that fetches the user's sheets and lets them select one. The picker filters out sheets already in the campaign.

### What already exists
- `CampaignService.submitCharacterSheet(campaignId, sheetId)` — wired but no UI
- `CampaignService.addNpc(campaignId, sheetId)` — wired but no UI
- `UserService.getUserCharacterSheets(ownerId, page, size, expand)` — fetches a user's sheets
- Campaign detail page with sections: Summary, Pending, Players, Characters, Invite
- `CampaignCharacterSheet` model with id, name, level, ownerId, ownerUsername

### API constraints
- **Submit:** Caller must own the sheet AND be a player in the campaign (403 otherwise)
- **Add NPC:** Caller must be GM or MODERATOR+ (any character sheet ID works, but in practice the GM will pick from their own sheets)

---

## 2. Component Design

### New child component: `campaign-sheet-picker`

**Location:** `src/app/features/campaign/components/campaign-sheet-picker/`
**Files:** `campaign-sheet-picker.ts`, `.html`, `.css`, `.spec.ts`

This is a reusable inline picker shown within the campaign page. It fetches the current user's character sheets and displays them as selectable entries. Sheets already in the campaign are filtered out.

**Inputs:**
- `campaignId: number` — the campaign ID (required)
- `excludeSheetIds: number[]` — IDs of sheets already in the campaign, to filter out (required)
- `mode: 'submit' | 'npc'` — controls the heading and button labels (required)

**Outputs:**
- `sheetSelected: number` — emits the selected sheet ID
- `cancel: void` — emits when the user cancels

**Behavior:**
1. On init, fetch current user's character sheets via `UserService.getUserCharacterSheets(userId, 0, 100, 'subclassCards')`
2. Filter out any sheets whose ID is in `excludeSheetIds`
3. Display available sheets as a list (level badge, name, class names from subclassCards)
4. If no sheets are available after filtering, show a message: "All your characters are already in this campaign" (for submit mode) or "You have no characters to add as NPCs" (for npc mode)
5. Clicking a sheet entry selects it (highlighted state)
6. A "Submit" or "Add NPC" button (depending on mode) is enabled only when a sheet is selected
7. A "Cancel" button emits `cancel`
8. On confirm, emit `sheetSelected` with the selected sheet ID

**Signals:**
```typescript
readonly sheets = signal<CharacterSheetResponse[]>([]);
readonly loading = signal(true);
readonly error = signal(false);
readonly selectedSheetId = signal<number | null>(null);
```

**Template structure:**
```html
<div class="sheet-picker">
  <h3 class="sheet-picker-title">
    {{ mode() === 'submit' ? 'Submit a Character' : 'Add an NPC' }}
  </h3>

  @if (loading()) {
    <!-- 2 skeleton rows -->
  } @else if (error()) {
    <p class="sheet-picker-message">Failed to load your characters.</p>
  } @else if (availableSheets().length === 0) {
    <p class="sheet-picker-message">
      {{ mode() === 'submit'
          ? 'All your characters are already in this campaign.'
          : 'You have no characters to add as NPCs.' }}
    </p>
  } @else {
    <ol class="sheet-picker-list">
      @for (sheet of availableSheets(); track sheet.id) {
        <li
          class="sheet-picker-entry"
          [class.selected]="selectedSheetId() === sheet.id"
          (click)="onSelect(sheet.id)"
        >
          <span class="sheet-picker-level">{{ sheet.level }}</span>
          <div class="sheet-picker-info">
            <span class="sheet-picker-name">{{ sheet.name }}</span>
            <!-- class names from subclassCards -->
          </div>
          @if (selectedSheetId() === sheet.id) {
            <svg class="sheet-picker-check"><!-- checkmark --></svg>
          }
        </li>
      }
    </ol>
  }

  <div class="sheet-picker-actions">
    <button type="button" class="sheet-picker-cancel" (click)="cancel.emit()">Cancel</button>
    <button
      type="button"
      class="sheet-picker-confirm"
      [disabled]="selectedSheetId() === null || submitting()"
      (click)="onConfirm()"
    >
      {{ mode() === 'submit' ? 'Submit Character' : 'Add NPC' }}
    </button>
  </div>
</div>
```

**CSS:** Follow the roster-entry pattern from `campaign-character-list.css`. Selected entry gets a gold border/highlight: `border-left: 3px solid var(--color-accent)`. Actions row uses the same button styles as `create-campaign.css`.

---

## 3. Integration into Campaign Detail Page

### Template changes (`campaign.html`)

Add a "Submit Character" button for **players** (users in `playerIds` who are NOT GMs), shown below the Characters section. Add an "Add NPC" button for **GMs/admins**, shown below the Characters section.

Both buttons toggle the sheet picker inline (not a modal).

```html
<!-- After the Characters section -->

@if (isPlayer() && !showSubmitPicker() && !campaign()!.isEnded) {
  <div class="campaign-action-row">
    <button type="button" class="campaign-action-btn" (click)="showSubmitPicker.set(true)">
      Submit a Character
    </button>
  </div>
}

@if (showSubmitPicker()) {
  <div class="campaign-section">
    <app-campaign-sheet-picker
      [campaignId]="campaign()!.id"
      [excludeSheetIds]="allSheetIds()"
      mode="submit"
      (sheetSelected)="onSubmitCharacter($event)"
      (cancel)="showSubmitPicker.set(false)"
    />
  </div>
}

@if (canManage() && !showNpcPicker() && !campaign()!.isEnded) {
  <div class="campaign-action-row">
    <button type="button" class="campaign-action-btn" (click)="showNpcPicker.set(true)">
      Add NPC
    </button>
  </div>
}

@if (showNpcPicker()) {
  <div class="campaign-section">
    <app-campaign-sheet-picker
      [campaignId]="campaign()!.id"
      [excludeSheetIds]="allSheetIds()"
      mode="npc"
      (sheetSelected)="onAddNpc($event)"
      (cancel)="showNpcPicker.set(false)"
    />
  </div>
}
```

### Component changes (`campaign.ts`)

Add signals and methods:

```typescript
readonly showSubmitPicker = signal(false);
readonly showNpcPicker = signal(false);

readonly isPlayer = computed(() => {
  const c = this.campaign();
  const userId = this.authService.user()?.id;
  if (!c || !userId) return false;
  return c.playerIds.includes(userId);
});

readonly allSheetIds = computed(() => {
  const c = this.campaign();
  if (!c) return [];
  return [
    ...c.pendingCharacterSheetIds,
    ...c.playerCharacterIds,
    ...c.nonPlayerCharacterIds,
  ];
});

onSubmitCharacter(sheetId: number): void {
  const c = this.campaign();
  if (!c) return;
  this.campaignService.submitCharacterSheet(c.id, sheetId).subscribe({
    next: () => {
      this.showSubmitPicker.set(false);
      this.reloadCampaign();
    },
    error: () => this.reloadCampaign(),
  });
}

onAddNpc(sheetId: number): void {
  const c = this.campaign();
  if (!c) return;
  this.campaignService.addNpc(c.id, sheetId).subscribe({
    next: () => {
      this.showNpcPicker.set(false);
      this.reloadCampaign();
    },
    error: () => this.reloadCampaign(),
  });
}
```

Add `CampaignSheetPicker` to the component's `imports` array.

### NPC Section

Currently the character list only shows `playerCharacters`. Add a separate **NPCs** section below Characters that shows `nonPlayerCharacters` (only visible if there are any, or if `canManage`). This reuses the same `campaign-character-list` component with a different data source, or adds an `@if` block in the template for NPCs.

Better approach: Add a `label` input to `campaign-character-list` so it can be reused:

```html
<!-- Characters section (existing) -->
<app-campaign-character-list
  [campaign]="c"
  [canManage]="canManage()"
  [confirmingRemoveId]="confirmingRemoveId()"
  (removeCharacter)="onRemoveCharacter($event)"
  (viewCharacter)="onViewCharacter($event)"
  (cancelRemove)="onCancelRemove()"
/>

<!-- NPCs section (new) - only visible to GMs/admins -->
@if (canManage()) {
  <div class="campaign-divider">
    <div class="campaign-divider-line"></div>
    <span class="campaign-divider-label">NPCs</span>
    <div class="campaign-divider-line"></div>
  </div>

  <div class="campaign-section">
    <app-campaign-npc-list
      [campaign]="c"
      [canManage]="canManage()"
      [confirmingRemoveId]="confirmingRemoveNpcId()"
      (removeNpc)="onRemoveNpc($event)"
      (viewCharacter)="onViewCharacter($event)"
      (cancelRemove)="onCancelRemoveNpc()"
    />
  </div>
}
```

### New child component: `campaign-npc-list`

**Location:** `src/app/features/campaign/components/campaign-npc-list/`
**Files:** `campaign-npc-list.ts`, `.html`, `.css`, `.spec.ts`

Nearly identical to `campaign-character-list` but reads from `campaign().nonPlayerCharacters` instead of `campaign().playerCharacters`. Empty state text: "No NPCs in this campaign."

Could also be done by adding a `source` input to `campaign-character-list`, but a separate component keeps things cleaner and avoids overloading the existing component.

The entire NPCs section (divider, list, and "Add NPC" button) is only visible when `canManage()` is true — regular players never see NPCs.

---

## 4. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Player has no character sheets at all | Show "You don't have any characters yet" with a link to `/create-character` |
| All player's sheets already in campaign | Show "All your characters are already in this campaign" |
| Submit fails with 403 (not owner) | Shouldn't happen since we only show the user's own sheets, but show generic error and reload |
| Submit fails with 403 (not a player) | Shouldn't happen since button only shows for players, but show error and reload |
| Add NPC fails with 403 | Show error, reload campaign |
| Sheet gets submitted while picker is open | The reload after submission will update `allSheetIds`, and if the picker is re-opened the sheet won't appear |
| Campaign is ended | Don't show Submit/Add NPC buttons |

---

## 5. Testing Strategy

### `campaign-sheet-picker.spec.ts`
- Shows loading state while fetching
- Renders available sheets after fetch
- Filters out sheets in `excludeSheetIds`
- Shows empty state when all sheets filtered out
- Highlights selected sheet on click
- Confirm button disabled when no sheet selected
- Emits `sheetSelected` with correct ID on confirm
- Emits `cancel` on cancel click
- Shows correct title/button text for 'submit' mode
- Shows correct title/button text for 'npc' mode

### `campaign-npc-list.spec.ts`
- Renders NPC entries from `nonPlayerCharacters`
- Shows empty state when no NPCs
- Shows remove button when `canManage` is true
- Hides remove button when `canManage` is false
- Emits `viewCharacter` on row click
- Emits `removeNpc` on remove click
- Shows inline confirmation when `confirmingRemoveId` matches

### `campaign.spec.ts` (additions)
- Shows "Submit a Character" button for players
- Hides "Submit a Character" button for GMs who aren't players
- Hides "Submit a Character" button when campaign is ended
- Shows "Add NPC" button for GMs
- Hides "Add NPC" button for regular players
- Toggles sheet picker visibility
- Calls `submitCharacterSheet` on submission
- Calls `addNpc` on NPC addition
- Reloads campaign after successful submission

---

## 6. Implementation Phases

### Phase 1: Campaign NPC List Component

**Goal:** Display NPCs in their own section on the campaign page.

**Tasks:**
1. Create `campaign-npc-list` component (ts, html, css, spec)
2. Add NPCs section to `campaign.html` with divider
3. Add `confirmingRemoveNpcId` signal and `onRemoveNpc`/`onCancelRemoveNpc` handlers to `campaign.ts`
4. Add `nonPlayerCharacters` to the campaign `getCampaign` expand string
5. Import `CampaignNpcList` in `campaign.ts`

**Phase Verification:**
- NPCs section renders when NPCs exist
- Remove/confirmation works for NPCs
- All existing campaign tests still pass

### Phase 2: Sheet Picker Component

**Goal:** Build the reusable character sheet picker.

**Tasks:**
1. Create `campaign-sheet-picker` component (ts, html, css, spec)
2. Fetch user's sheets via `UserService.getUserCharacterSheets`
3. Filter by `excludeSheetIds`
4. Implement select/confirm/cancel flow
5. Handle loading, error, and empty states

**Phase Verification:**
- Picker loads and displays sheets
- Filtering works correctly
- Selection and emission work
- All picker tests pass

### Phase 3: Wire Submit & NPC Flows into Campaign Page

**Goal:** Connect the picker to the campaign detail page for both flows.

**Tasks:**
1. Add `isPlayer` and `allSheetIds` computed signals to `campaign.ts`
2. Add `showSubmitPicker` and `showNpcPicker` toggle signals
3. Add `onSubmitCharacter` and `onAddNpc` handlers
4. Add "Submit a Character" and "Add NPC" buttons to template
5. Add picker instances to template with correct mode/exclude bindings
6. Import `CampaignSheetPicker` in `campaign.ts`
7. Hide buttons when campaign is ended
8. Add tests for new functionality

**Phase Verification:**
- Player sees "Submit a Character" button
- GM sees "Add NPC" button
- Picking a sheet and confirming calls the correct API
- Campaign reloads after successful action
- Buttons hidden for ended campaigns

### Phase 4: Validate

```bash
npm run test:run    # All tests green
npm run lint        # Clean
npm run build       # Succeeds
```

---

## 7. Acceptance Criteria

### Specification Requirements
- [ ] Players can submit their own character sheets to a campaign for GM approval
- [ ] GMs can add their own character sheets as NPCs directly (no approval needed)
- [ ] Character sheets already in the campaign are filtered from the picker
- [ ] Submit/Add NPC buttons are hidden when the campaign is ended
- [ ] NPCs display in their own section on the campaign page
- [ ] GMs can remove NPCs with inline confirmation

### Quality Gates
- [ ] All tests pass (`npm run test:run`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Follows tavern aesthetic (dark browns, gold accents, Cinzel/Lora fonts)
- [ ] Uses OnPush, signals, standalone components, vanilla CSS
