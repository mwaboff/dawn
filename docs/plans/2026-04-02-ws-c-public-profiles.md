# Workstream C: Public Player Profiles

**Parent Plan:** `2026-04-02-master-plan.md`
**Depends On:** Workstream A (foundation models, services, routes)
**Execution:** Parallel worktree (`isolation: "worktree"`)
**Agent Team:** Use agents for component creation

---

## Overview

- Create a public `/player/:id` route for viewing any player's profile
- Update the existing `/profile` page to also show the user's campaigns
- Public profiles show limited info (username, avatar, join date, characters, campaigns)

---

## Step 1: Player Profile Component

### Component: `src/app/features/player/player.ts` (replace Workstream A placeholder)

**Behavior:**
- Read `id` from route params
- Fetch user profile: `UserService.getUser(id)`
- Fetch user's character sheets: `UserService.getUserCharacterSheets(id, 0, 100, 'subclassCards')`
- Fetch user's campaigns: `CampaignService.getMyCampaigns()` — **NOTE:** The API only has `/mine` which returns the *current* user's campaigns. For viewing another player's campaigns, we need to check what's available. Since there's no endpoint to list another user's campaigns as a regular user, we'll display campaigns only on the self-profile. For other players, we show their character sheets only (which is what the character-sheets endpoint with `ownerId` filter gives us).
- If `id` matches current user, redirect to `/profile` (avoid duplicate profile pages)
- Handle 404 → "Player not found" error page

**Signals:**
```typescript
readonly player = signal<UserResponse | null>(null);
readonly characters = signal<CharacterSummary[]>([]);
readonly playerLoading = signal(true);
readonly charactersLoading = signal(true);
readonly error = signal<'not-found' | 'unknown' | null>(null);

readonly joinDate = computed(() => {
  const createdAt = this.player()?.createdAt;
  if (!createdAt) return '';
  return new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
});
```

**Template:** Mirror the existing profile page layout but without edit capabilities:
```html
<div class="player-profile">
  <div class="grain-overlay"></div>

  @if (playerLoading()) {
    <!-- skeleton -->
  } @else if (error() === 'not-found') {
    <div class="player-error">
      <h2>Player Not Found</h2>
      <p>This player doesn't exist.</p>
      <a routerLink="/">Back to Home</a>
    </div>
  } @else if (player(); as p) {
    <header class="profile-header">
      <div class="profile-identity">
        <span class="profile-eyebrow">Adventurer</span>
        <h1 class="profile-name">{{ p.username }}</h1>
        <p class="profile-joined">Member since {{ joinDate() }}</p>
      </div>
      <div class="profile-sigil">
        <!-- Same star SVG as profile page -->
      </div>
    </header>

    <div class="profile-divider">
      <div class="profile-divider-line"></div>
      <span class="profile-divider-label">Characters</span>
      <div class="profile-divider-line"></div>
    </div>

    <app-roster-list
      [characters]="characters()"
      [loading]="charactersLoading()"
      [error]="charactersError()"
      (viewCharacter)="onViewCharacter($event)"
    />
  }
</div>
```

**Important:** The `RosterList` component has a `createCharacter` output. On the public player profile, we should NOT show the "Create Your First Character" empty state button. Two approaches:

**Option A (Recommended):** Add an optional `showCreateButton` input to `RosterList`, default to `true`. On the player page, pass `false`. The empty state then just says "No characters yet" without a button.

**Option B:** Create a separate read-only roster display. But this duplicates too much.

Go with **Option A** — minimal change to existing component.

### Modify RosterList: `src/app/features/profile/components/roster-list/roster-list.ts`

Add optional input:
```typescript
readonly showCreateButton = input(true);
```

In `roster-list.html`, wrap the create button:
```html
@if (showCreateButton()) {
  <button type="button" class="roster-create-btn" (click)="createCharacter.emit()">
    Create Your First Character
  </button>
}
```

And change the empty text to be more generic when `showCreateButton` is false:
```html
<p class="roster-empty-text">
  {{ showCreateButton() ? 'Your story awaits' : 'No characters yet' }}
</p>
```

### Tests: `src/app/features/player/player.spec.ts`
- Fetches user profile on init
- Fetches character sheets for the user
- Renders username, join date
- Shows character list via RosterList
- Redirects to /profile when viewing own profile
- Shows "Player Not Found" on 404
- Passes showCreateButton=false to RosterList

### Tests: Update `roster-list.spec.ts`
- Shows create button when showCreateButton is true (default)
- Hides create button when showCreateButton is false
- Shows "No characters yet" text when showCreateButton is false and empty

---

## Step 2: Add Campaigns Section to Self-Profile

### Modify: `src/app/features/profile/profile.ts`

Add campaign loading alongside character loading:

```typescript
// New imports
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';

// New signals
readonly campaigns = signal<CampaignResponse[]>([]);
readonly campaignsLoading = signal(true);
readonly campaignsError = signal(false);

// In ngOnInit, after loadCharacters:
this.loadCampaigns();
```

```typescript
private loadCampaigns(): void {
  this.campaignService.getMyCampaigns(0, 50, 'creator').subscribe({
    next: (response) => {
      this.campaigns.set(response.content);
      this.campaignsLoading.set(false);
    },
    error: () => {
      this.campaignsError.set(true);
      this.campaignsLoading.set(false);
    },
  });
}

onViewCampaign(id: number): void {
  this.router.navigate(['/campaign', id]);
}

onCreateCampaign(): void {
  this.router.navigate(['/campaigns/create']);
}
```

### Modify: `src/app/features/profile/profile.html`

Add campaigns section after the roster list:

```html
<!-- After </app-roster-list> -->

<div class="profile-divider">
  <div class="profile-divider-line"></div>
  <span class="profile-divider-label">Campaigns</span>
  <div class="profile-divider-line"></div>
</div>

<app-campaign-roster
  [campaigns]="campaigns()"
  [loading]="campaignsLoading()"
  [error]="campaignsError()"
  (viewCampaign)="onViewCampaign($event)"
  (createCampaign)="onCreateCampaign()"
/>
```

---

## Step 3: Campaign Roster Child Component

### Component: `src/app/features/profile/components/campaign-roster/campaign-roster.ts`

Similar pattern to RosterList but for campaigns.

**Inputs:**
- `campaigns: CampaignResponse[]` (required)
- `loading: boolean` (required)
- `error: boolean` (required)

**Outputs:**
- `viewCampaign: number`
- `createCampaign: void`

**Template:**
```html
<section class="campaign-roster">
  @if (loading()) {
    <div class="roster-loading">
      @for (i of [1, 2]; track i) {
        <div class="roster-skeleton"></div>
      }
    </div>
  } @else if (error()) {
    <div class="roster-message">
      <p>Something went wrong loading your campaigns.</p>
    </div>
  } @else if (campaigns().length === 0) {
    <div class="roster-empty">
      <p class="roster-empty-text">No adventures yet</p>
      <button type="button" class="roster-create-btn" (click)="createCampaign.emit()">
        Create Your First Campaign
      </button>
    </div>
  } @else {
    <ol class="roster-list">
      @for (campaign of campaigns(); track campaign.id) {
        <li class="roster-entry" tabindex="0" role="button"
            (click)="viewCampaign.emit(campaign.id)"
            (keydown.enter)="viewCampaign.emit(campaign.id)">
          <div class="roster-info">
            <div class="roster-name-row">
              <span class="roster-character-name">{{ campaign.name }}</span>
              @if (campaign.isEnded) {
                <span class="roster-pronouns">Ended</span>
              }
            </div>
            <p class="roster-class">
              <span class="roster-class-name">GM: {{ campaign.creator?.username ?? 'Unknown' }}</span>
              <span class="roster-class-sep" aria-hidden="true"> · </span>
              <span class="roster-class-subclass">{{ campaign.playerIds.length }} players</span>
            </p>
          </div>
          <svg class="roster-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </li>
      }
    </ol>
    <div class="roster-footer">
      <a routerLink="/campaigns" class="roster-add-link">View All Campaigns</a>
    </div>
  }
</section>
```

**Styling:** Reuse roster-list CSS classes. The campaign-roster can share the same CSS patterns since the visual treatment is identical. Either import/extend the roster-list styles or duplicate the relevant rules.

### Tests: `src/app/features/profile/components/campaign-roster/campaign-roster.spec.ts`
- Shows loading skeleton
- Renders campaign list
- Shows empty state with create button
- Shows error state
- Emits viewCampaign on click
- Emits createCampaign on button click
- Shows "Ended" badge for ended campaigns

---

## Step 4: Player Profile CSS

### File: `src/app/features/player/player.css` (NEW)

Reuse the exact same CSS patterns as `profile.css`. Since both pages share the same visual language, copy the profile CSS and adjust class names if needed. Or, better: use the same class names (`profile-*`) in the player template and import the styles. Since Angular component styles are scoped, just duplicate the relevant rules.

---

## Step 5: Update Profile Tests

### Modify: `src/app/features/profile/profile.spec.ts`

Add tests for the new campaigns section:
- Fetches campaigns on init
- Renders CampaignRoster component
- Passes campaign data to CampaignRoster
- Shows campaigns loading state
- Handles campaign fetch error

---

## Step 6: Validate

```bash
npm run test:run          # All tests green
npm run lint              # Clean
npm run build             # Succeeds
```

---

## File Summary

| File | Type | Description |
|------|------|-------------|
| `features/player/player.ts` | Replace placeholder | Public player profile |
| `features/player/player.html` | New | Template |
| `features/player/player.css` | New | Styles |
| `features/player/player.spec.ts` | New | Tests |
| `features/profile/profile.ts` | Modify | Add campaigns section |
| `features/profile/profile.html` | Modify | Add campaign roster |
| `features/profile/components/campaign-roster/campaign-roster.ts` | New | Campaign list component |
| `features/profile/components/campaign-roster/campaign-roster.html` | New | Template |
| `features/profile/components/campaign-roster/campaign-roster.css` | New | Styles |
| `features/profile/components/campaign-roster/campaign-roster.spec.ts` | New | Tests |
| `features/profile/components/roster-list/roster-list.ts` | Modify | Add showCreateButton input |
| `features/profile/components/roster-list/roster-list.html` | Modify | Conditional create button |
| `features/profile/components/roster-list/roster-list.spec.ts` | Modify | Test new input |

## Completion Criteria

- [ ] `/player/:id` shows public profile with username, join date, character list
- [ ] Viewing own player page redirects to `/profile`
- [ ] 404 shows "Player Not Found"
- [ ] Player profile hides "Create Character" button in roster
- [ ] Self-profile (`/profile`) now shows campaigns section
- [ ] Campaign roster shows campaign name, GM, player count
- [ ] Empty campaign state shows "Create Your First Campaign"
- [ ] All tests pass, lint clean, build succeeds
