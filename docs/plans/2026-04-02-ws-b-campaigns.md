# Workstream B: Campaign Feature

**Parent Plan:** `2026-04-02-master-plan.md`
**Depends On:** Workstream A (foundation models, services, routes)
**Execution:** Parallel worktree (`isolation: "worktree"`)
**Agent Team:** Use agents to implement components in parallel where dependencies allow

---

## Overview

Build the full campaign management UI:
- **My Campaigns** — list page showing all campaigns the user participates in
- **Campaign Page** — detailed view of a single campaign with player/character management
- **Create Campaign** — form to create a new campaign

---

## Step 1: My Campaigns List Page

### Component: `src/app/features/campaigns/campaigns.ts`

Replace the placeholder from Workstream A with the full implementation.

**Behavior:**
- On init, call `CampaignService.getMyCampaigns(0, 50, 'creator,characterSummaries')` 
- Display campaigns in a list similar to the roster-list pattern
- Each campaign entry shows: campaign name, GM username (from creator), player count, character count
- Clicking a campaign navigates to `/campaign/:id`
- "Create Campaign" button at the top navigates to `/campaigns/create`
- Empty state: "No campaigns yet — create one or join with an invite link"
- Loading skeleton (3 shimmer rows) while fetching
- Error state for failed fetches

**Template structure:**
```html
<div class="campaigns">
  <div class="grain-overlay campaigns-grain"></div>
  
  <header class="campaigns-header">
    <div class="campaigns-identity">
      <span class="campaigns-eyebrow">Campaigns</span>
      <h1 class="campaigns-title">Your Adventures</h1>
    </div>
    <button class="campaigns-create-btn" (click)="onCreateCampaign()">
      New Campaign
    </button>
  </header>

  <div class="campaigns-divider">...</div>

  <!-- Loading / Error / Empty / List states following roster-list pattern -->
  @if (loading()) {
    <!-- skeleton -->
  } @else if (error()) {
    <!-- error message -->
  } @else if (campaigns().length === 0) {
    <!-- empty state -->
  } @else {
    <ol class="campaigns-list">
      @for (campaign of campaigns(); track campaign.id) {
        <li class="campaign-entry" (click)="onViewCampaign(campaign.id)">
          <div class="campaign-entry-info">
            <span class="campaign-entry-name">{{ campaign.name }}</span>
            <span class="campaign-entry-gm">GM: {{ campaign.creator?.username ?? 'Unknown' }}</span>
          </div>
          <div class="campaign-entry-stats">
            <span>{{ campaign.playerIds.length }} players</span>
            <span>{{ campaign.playerCharacterIds.length }} characters</span>
          </div>
          @if (campaign.isEnded) {
            <span class="campaign-entry-badge ended">Ended</span>
          }
          <!-- arrow icon -->
        </li>
      }
    </ol>
  }
</div>
```

**Styling:** Follow profile page pattern — dark background, gold accents, Cinzel headings, fadeInUp animations. Campaign entries use the roster-entry style with hover effect.

### Tests: `src/app/features/campaigns/campaigns.spec.ts`
- Component creates successfully
- Shows loading skeleton while fetching
- Renders campaign list after successful fetch
- Displays empty state when no campaigns
- Navigates to campaign detail on click
- Navigates to create campaign on button click
- Shows error state on API failure
- Shows "Ended" badge for ended campaigns

---

## Step 2: Create Campaign Form

### Component: `src/app/features/campaigns/create-campaign/create-campaign.ts`

**Behavior:**
- Reactive form with fields: `name` (required, max 200), `description` (optional, max 2000)
- On submit, call `CampaignService.createCampaign(request)`
- On success, navigate to `/campaign/:newId`
- On error, display inline error message
- Cancel button navigates back to `/campaigns`

**Form:**
```typescript
form = this.fb.nonNullable.group({
  name: ['', [Validators.required, Validators.maxLength(200)]],
  description: ['', [Validators.maxLength(2000)]],
});
```

**Template:** Simple form following the tavern aesthetic:
```html
<div class="create-campaign">
  <header>
    <span class="eyebrow">New Campaign</span>
    <h1>Begin a New Tale</h1>
  </header>

  <form [formGroup]="form" (ngSubmit)="onSubmit()">
    <div class="form-field">
      <label for="name">Campaign Name</label>
      <input id="name" formControlName="name" />
      <!-- validation error -->
    </div>
    <div class="form-field">
      <label for="description">Description</label>
      <textarea id="description" formControlName="description" rows="4"></textarea>
    </div>
    <div class="form-actions">
      <button type="button" class="btn-secondary" (click)="onCancel()">Cancel</button>
      <button type="submit" class="btn-primary" [disabled]="form.invalid || submitting()">
        Create Campaign
      </button>
    </div>
  </form>
</div>
```

### Tests: `src/app/features/campaigns/create-campaign/create-campaign.spec.ts`
- Form validation (name required, max lengths)
- Submits request on valid form
- Navigates to campaign page on success
- Shows error on API failure
- Cancel navigates to campaigns list
- Submit button disabled when form invalid or submitting

---

## Step 3: Campaign Detail Page

This is the largest component. Decompose into child components per the component design standards.

### Component: `src/app/features/campaign/campaign.ts`

**Behavior:**
- Read `id` from route params
- Fetch campaign with full expansion: `CampaignService.getCampaign(id, 'creator,gameMasters,players,characterSummaries')`
- Compute access level: `isGameMaster` (user is in gameMasterIds), `isPrivileged` (user is ADMIN/OWNER), `canManage` (isGameMaster || isPrivileged)
- Handle 403 error → show "You don't have access to this campaign" error page
- Handle 404 error → show "Campaign not found" error page

**Signals:**
```typescript
private readonly campaignId = signal<number>(0);
readonly campaign = signal<CampaignResponse | null>(null);
readonly loading = signal(true);
readonly error = signal<'forbidden' | 'not-found' | 'unknown' | null>(null);

readonly isGameMaster = computed(() => {
  const c = this.campaign();
  const userId = this.authService.user()?.id;
  return c !== null && userId !== undefined && c.gameMasterIds.includes(userId);
});

readonly canManage = computed(() => this.isGameMaster() || this.authService.isAdmin());
```

**Template structure:**
```html
<div class="campaign">
  <div class="grain-overlay"></div>

  @if (loading()) {
    <!-- Full page skeleton -->
  } @else if (error() === 'forbidden') {
    <div class="campaign-error">
      <h2>Access Denied</h2>
      <p>You are not a member of this campaign.</p>
      <a routerLink="/campaigns">Back to Campaigns</a>
    </div>
  } @else if (error() === 'not-found') {
    <div class="campaign-error">
      <h2>Campaign Not Found</h2>
      <p>This campaign doesn't exist or has been deleted.</p>
      <a routerLink="/campaigns">Back to Campaigns</a>
    </div>
  } @else if (campaign(); as c) {
    <!-- Campaign Summary Header -->
    <app-campaign-summary [campaign]="c" />

    <!-- Players Section -->
    <app-campaign-player-list
      [campaign]="c"
      [canManage]="canManage()"
      (kickPlayer)="onKickPlayer($event)"
      (viewPlayer)="onViewPlayer($event)"
    />

    <!-- Character Sheets Section -->
    <app-campaign-character-list
      [campaign]="c"
      [canManage]="canManage()"
      (removeCharacter)="onRemoveCharacter($event)"
      (viewCharacter)="onViewCharacter($event)"
    />

    <!-- Invite Section (GM/Admin only) -->
    @if (canManage()) {
      <app-campaign-invite [campaignId]="c.id" />
    }
  }
</div>
```

### Tests: `src/app/features/campaign/campaign.spec.ts`
- Shows loading state initially
- Renders campaign details after successful fetch
- Shows forbidden error for 403 responses
- Shows not-found error for 404 responses
- `canManage` computed is true for GMs
- `canManage` computed is true for admins who aren't GMs
- `canManage` computed is false for regular players

---

## Step 4: Campaign Summary Child Component

### Component: `src/app/features/campaign/components/campaign-summary/campaign-summary.ts`

**Inputs:** `campaign: CampaignResponse` (required)

**Template:**
```html
<header class="campaign-header">
  <div class="campaign-identity">
    <span class="campaign-eyebrow">Campaign</span>
    <h1 class="campaign-name">{{ campaign().name }}</h1>
    <p class="campaign-gm">
      Game Master: 
      <span class="campaign-gm-name">{{ campaign().creator?.username ?? 'Unknown' }}</span>
    </p>
    @if (campaign().description) {
      <p class="campaign-description">{{ campaign().description }}</p>
    }
    @if (campaign().isEnded) {
      <span class="campaign-badge ended">Campaign Ended</span>
    }
  </div>
  <div class="campaign-sigil">
    <!-- Crossed swords or shield SVG icon -->
  </div>
</header>
```

**Styling:** Follow the profile-header pattern with eyebrow, name, subtitle layout.

### Tests: `src/app/features/campaign/components/campaign-summary/campaign-summary.spec.ts`
- Renders campaign name
- Renders GM username
- Renders description when present
- Hides description when absent
- Shows "Ended" badge for ended campaigns

---

## Step 5: Player List Child Component

### Component: `src/app/features/campaign/components/campaign-player-list/campaign-player-list.ts`

**Inputs:**
- `campaign: CampaignResponse` (required)
- `canManage: boolean` (required)

**Outputs:**
- `kickPlayer: number` (emits userId)
- `viewPlayer: number` (emits userId)

**Behavior:**
- Build a combined list: GMs (from `gameMasters` expansion) + players (from `players` expansion)
- Each GM entry has a crown icon SVG next to their name
- Each non-GM player entry has a "Remove" button (visible only if `canManage`)
- Clicking a player name/row navigates to their profile
- The campaign creator (creatorId) always shows the crown and cannot be removed

**Template:**
```html
<section>
  <div class="section-divider">
    <div class="divider-line"></div>
    <span class="divider-label">Players</span>
    <div class="divider-line"></div>
  </div>

  <ol class="player-list">
    @for (gm of campaign().gameMasters ?? []; track gm.id) {
      <li class="player-entry" (click)="viewPlayer.emit(gm.id)">
        <svg class="crown-icon"><!-- crown SVG --></svg>
        <span class="player-name">{{ gm.username }}</span>
        <span class="player-role-badge">Game Master</span>
        <svg class="entry-arrow"><!-- chevron right --></svg>
      </li>
    }
    @for (player of campaign().players ?? []; track player.id) {
      <li class="player-entry" (click)="viewPlayer.emit(player.id)">
        <span class="player-name">{{ player.username }}</span>
        @if (canManage()) {
          <button class="remove-btn" (click)="onRemovePlayer($event, player)">
            Remove
          </button>
        }
        <svg class="entry-arrow"><!-- chevron right --></svg>
      </li>
    }
  </ol>
</section>
```

**Crown SVG** (inline, ~20x20):
```html
<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-label="Game Master">
  <path d="M2 20h20v2H2v-2zm1-7l4 4 5-6 5 6 4-4-1-9H4L3 13z"/>
</svg>
```

**Remove button behavior:** Clicking "Remove" should `$event.stopPropagation()` to prevent row click, then emit `kickPlayer` with userId. The parent handles confirmation.

### Tests: `src/app/features/campaign/components/campaign-player-list/campaign-player-list.spec.ts`
- Renders GMs with crown icon
- Renders players without crown icon
- Shows remove button for non-GM players when canManage is true
- Hides remove button when canManage is false
- Emits viewPlayer on row click
- Emits kickPlayer on remove button click
- Stop propagation on remove button click

---

## Step 6: Character List Child Component

### Component: `src/app/features/campaign/components/campaign-character-list/campaign-character-list.ts`

**Inputs:**
- `campaign: CampaignResponse` (required)
- `canManage: boolean` (required)

**Outputs:**
- `removeCharacter: number` (emits sheetId)
- `viewCharacter: number` (emits sheetId)

**Behavior:**
- Use `characterSummaries` from the campaign expansion
- Each entry shows: level badge, character name, class names, owner username
- Remove button visible only if `canManage`
- Clicking a row navigates to `/character/:id`

**Template:**
```html
<section>
  <div class="section-divider">
    <div class="divider-line"></div>
    <span class="divider-label">Characters</span>
    <div class="divider-line"></div>
  </div>

  @if ((campaign().characterSummaries ?? []).length === 0) {
    <p class="empty-message">No characters submitted yet.</p>
  } @else {
    <ol class="character-list">
      @for (char of campaign().characterSummaries ?? []; track char.id) {
        <li class="character-entry" (click)="viewCharacter.emit(char.id)">
          <span class="character-level">{{ char.level }}</span>
          <div class="character-info">
            <span class="character-name">{{ char.name }}</span>
            @if (char.classNames.length > 0) {
              <span class="character-class">{{ char.classNames.join(' / ') }}</span>
            }
            <span class="character-owner">Player: {{ char.ownerUsername }}</span>
          </div>
          @if (canManage()) {
            <button class="remove-btn" (click)="onRemoveCharacter($event, char)">
              Remove
            </button>
          }
          <svg class="entry-arrow"><!-- chevron right --></svg>
        </li>
      }
    </ol>
  }
</section>
```

### Tests: `src/app/features/campaign/components/campaign-character-list/campaign-character-list.spec.ts`
- Renders character entries with level, name, class, owner
- Shows empty message when no characters
- Shows remove button when canManage is true
- Hides remove button when canManage is false
- Emits viewCharacter on row click
- Emits removeCharacter on remove button click

---

## Step 7: Invite Section Child Component

### Component: `src/app/features/campaign/components/campaign-invite/campaign-invite.ts`

**Inputs:** `campaignId: number` (required)

**Behavior:**
- "Generate Invite Link" button
- On click, call `CampaignService.generateInvite(campaignId)`
- Display the generated URL: `{window.location.origin}/campaigns/join/{token}`
- "Copy to Clipboard" button using `navigator.clipboard.writeText()`
- Show expiration time ("Expires in 24 hours")
- Handle errors (show inline error message)

**Signals:**
```typescript
readonly inviteUrl = signal<string | null>(null);
readonly generating = signal(false);
readonly copied = signal(false);
readonly inviteError = signal(false);
```

**Template:**
```html
<section>
  <div class="section-divider">
    <div class="divider-line"></div>
    <span class="divider-label">Invite</span>
    <div class="divider-line"></div>
  </div>

  <div class="invite-section">
    @if (inviteUrl()) {
      <div class="invite-url-container">
        <input type="text" [value]="inviteUrl()" readonly class="invite-url-input" />
        <button class="invite-copy-btn" (click)="onCopy()">
          {{ copied() ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <p class="invite-expires">Single-use link. Expires in 24 hours.</p>
    } @else {
      <button
        class="invite-generate-btn"
        (click)="onGenerate()"
        [disabled]="generating()">
        {{ generating() ? 'Generating...' : 'Generate Invite Link' }}
      </button>
    }
    @if (inviteError()) {
      <p class="invite-error">Failed to generate invite link.</p>
    }
  </div>
</section>
```

### Tests: `src/app/features/campaign/components/campaign-invite/campaign-invite.spec.ts`
- Shows generate button initially
- Calls generateInvite on button click
- Displays invite URL after generation
- Copy button copies URL to clipboard
- Shows "Copied!" feedback after copy
- Shows error on API failure
- Disables button while generating

---

## Step 8: Confirmation Dialog for Removals

### Approach: Inline Confirmation Pattern

Instead of a modal, use an inline confirmation pattern on each remove action. When "Remove" is clicked, the button transforms into "Are you sure? [Yes] [Cancel]" inline.

**Implementation in parent `campaign.ts`:**

```typescript
readonly confirmingKickPlayerId = signal<number | null>(null);
readonly confirmingRemoveCharacterId = signal<number | null>(null);

onKickPlayer(userId: number): void {
  this.confirmingKickPlayerId.set(userId);
}

onConfirmKickPlayer(userId: number): void {
  this.campaignService.kickPlayer(this.campaign()!.id, userId).subscribe({
    next: (updated) => {
      this.campaign.set(updated);
      // Re-fetch with expansions to get full data
      this.loadCampaign();
    },
    error: () => { /* show error toast/inline */ }
  });
  this.confirmingKickPlayerId.set(null);
}

onCancelKick(): void {
  this.confirmingKickPlayerId.set(null);
}
```

Pass the `confirmingId` signal down to child components. The child shows inline confirmation when its player/character matches the confirming ID.

**For player kick:** The confirmation message should read: "Remove {username}? Their characters will also be removed from this campaign."

**For character removal:** "Remove {characterName} from this campaign?"

### Tests:
- Clicking remove shows confirmation inline
- Confirming calls the appropriate service method
- Canceling hides the confirmation
- Campaign data refreshes after successful removal

---

## Step 9: Pending Character Sheets (GM-only section)

If the campaign has `pendingCharacterSheetIds.length > 0` and `canManage`, show a "Pending Approval" section between the Players and Characters sections.

### In `campaign.ts` template:
```html
@if (canManage() && (campaign()!.pendingCharacterSheetIds.length > 0)) {
  <app-campaign-pending-list
    [campaign]="campaign()!"
    (approve)="onApproveCharacter($event)"
    (reject)="onRejectCharacter($event)"
    (viewCharacter)="onViewCharacter($event)"
  />
}
```

### Component: `src/app/features/campaign/components/campaign-pending-list/campaign-pending-list.ts`

Similar to character list but with Approve/Reject buttons instead of Remove.

---

## Step 10: Wire Up Parent Actions

In `campaign.ts`, implement all action handlers:

```typescript
onViewPlayer(userId: number): void {
  this.router.navigate(['/player', userId]);
}

onViewCharacter(sheetId: number): void {
  this.router.navigate(['/character', sheetId]);
}

onApproveCharacter(sheetId: number): void {
  this.campaignService.approveCharacterSheet(this.campaign()!.id, sheetId)
    .subscribe({ next: () => this.loadCampaign() });
}

onRejectCharacter(sheetId: number): void {
  this.campaignService.rejectCharacterSheet(this.campaign()!.id, sheetId)
    .subscribe({ next: () => this.loadCampaign() });
}
```

---

## Step 11: Validate

```bash
npm run test:run          # All tests green
npm run lint              # Clean
npm run build             # Succeeds
```

---

## File Summary

| File | Type | Description |
|------|------|-------------|
| `features/campaigns/campaigns.ts` | Replace placeholder | My Campaigns list page |
| `features/campaigns/campaigns.html` | New | Template |
| `features/campaigns/campaigns.css` | New | Styles |
| `features/campaigns/campaigns.spec.ts` | New | Tests |
| `features/campaigns/create-campaign/create-campaign.ts` | Replace placeholder | Create form |
| `features/campaigns/create-campaign/create-campaign.html` | New | Template |
| `features/campaigns/create-campaign/create-campaign.css` | New | Styles |
| `features/campaigns/create-campaign/create-campaign.spec.ts` | New | Tests |
| `features/campaign/campaign.ts` | Replace placeholder | Campaign detail page |
| `features/campaign/campaign.html` | New | Template |
| `features/campaign/campaign.css` | New | Styles |
| `features/campaign/campaign.spec.ts` | New | Tests |
| `features/campaign/components/campaign-summary/` | New | 4 files (ts, html, css, spec) |
| `features/campaign/components/campaign-player-list/` | New | 4 files |
| `features/campaign/components/campaign-character-list/` | New | 4 files |
| `features/campaign/components/campaign-invite/` | New | 4 files |
| `features/campaign/components/campaign-pending-list/` | New | 4 files |

## Completion Criteria

- [ ] My Campaigns page lists user's campaigns with loading/error/empty states
- [ ] Create Campaign form validates and creates campaigns
- [ ] Campaign page shows summary, players (with crown for GM), characters (with owner)
- [ ] GM/Admin sees invite generation, remove buttons, pending approvals
- [ ] Non-participant sees "Access Denied" error
- [ ] Inline confirmation for all destructive actions with appropriate warning text
- [ ] All components have tests covering happy path and error states
- [ ] `npm run test:run && npm run lint && npm run build` all pass
