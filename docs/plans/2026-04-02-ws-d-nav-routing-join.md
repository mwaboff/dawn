# Workstream D: Navigation, Routing & Campaign Join Flow

**Parent Plan:** `2026-04-02-master-plan.md`
**Depends On:** Workstream A (foundation models, services, routes)
**Execution:** Parallel worktree (`isolation: "worktree"`)
**Agent Team:** Use agents for parallel component and test creation

---

## Overview

- Update navbar with Campaigns link and Create Campaign dropdown item
- Build the campaign join page (`/campaigns/join/:token`)
- Ensure routing works end-to-end for all new pages

---

## Step 1: Update Navbar Template

### Modify: `src/app/layout/navbar/navbar.html`

Add "Campaigns" link and "Create Campaign" dropdown item for logged-in users:

```html
<nav class="nav" [class.scrolled]="isScrolled()">
  <div class="nav-container">
    <a href="/" class="nav-logo" aria-label="Oh Sheet Home">
      Oh Sheet
    </a>
    <div class="nav-links">
      @if (authService.isLoggedIn()) {
        <div class="nav-create-container">
          <button
            type="button"
            class="nav-create-btn"
            (click)="toggleDropdown()"
            aria-label="Create menu"
            aria-haspopup="true"
            [attr.aria-expanded]="isDropdownOpen()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          @if (isDropdownOpen()) {
            <div class="nav-dropdown" role="menu">
              <button type="button" class="nav-dropdown-item" role="menuitem" (click)="onCreateCharacter()">
                Create Character
              </button>
              <button type="button" class="nav-dropdown-item" role="menuitem" (click)="onCreateCampaign()">
                Create Campaign
              </button>
            </div>
          }
        </div>
        <a routerLink="/reference" class="nav-link">Reference</a>
        <a routerLink="/campaigns" class="nav-link">Campaigns</a>
        <a routerLink="/profile" class="nav-link">Profile</a>
        @if (authService.isAdmin()) {
          <a routerLink="/admin" class="nav-link nav-link-admin">Admin</a>
        }
        <button type="button" class="nav-link nav-link-secondary" (click)="onLogout()">Logout</button>
      } @else {
        <a routerLink="/reference" class="nav-link">Reference</a>
        <a routerLink="/auth" class="nav-link nav-link-auth">Login / Sign Up</a>
      }
    </div>
  </div>
</nav>
```

**Changes from current:**
1. Added "Create Campaign" as second dropdown item
2. Added `<a routerLink="/campaigns">Campaigns</a>` between Reference and Profile

---

## Step 2: Update Navbar Component

### Modify: `src/app/layout/navbar/navbar.ts`

Add the `onCreateCampaign` method:

```typescript
onCreateCampaign(): void {
  this.isDropdownOpen.set(false);
  this.router.navigate(['/campaigns/create']);
}
```

This follows the same pattern as `onCreateCharacter()` — close dropdown first, then navigate.

---

## Step 3: Campaign Join Page

### Component: `src/app/features/campaign-join/campaign-join.ts` (replace Workstream A placeholder)

**Behavior:**
- Read `token` from route params
- Automatically attempt to join on page load: `CampaignService.joinCampaign(token)`
- Show loading state while joining
- On success: show success message with campaign name, then navigate to campaign page after 2 seconds (or on button click)
- On error: show appropriate error message based on status code:
  - 400: "This invite link has expired or has already been used."
  - 401: Redirect to `/auth` (not logged in)
  - 404: "This invite link is invalid."
  - Other: "Something went wrong. Please try again."

**Signals:**
```typescript
readonly joining = signal(true);
readonly result = signal<JoinCampaignResponse | null>(null);
readonly error = signal<'expired' | 'not-found' | 'unauthorized' | 'unknown' | null>(null);
```

**Template:**
```html
<div class="campaign-join">
  <div class="grain-overlay"></div>
  
  <div class="join-card">
    @if (joining()) {
      <div class="join-loading">
        <p class="join-status">Joining campaign...</p>
        <!-- Optional loading spinner -->
      </div>
    } @else if (result(); as r) {
      <div class="join-success">
        <svg class="join-icon success" viewBox="0 0 24 24">
          <!-- checkmark icon -->
        </svg>
        <h2 class="join-title">Welcome to {{ r.campaignName }}!</h2>
        <p class="join-message">{{ r.message }}</p>
        <a [routerLink]="['/campaign', r.campaignId]" class="join-btn">
          View Campaign
        </a>
      </div>
    } @else if (error()) {
      <div class="join-error">
        <svg class="join-icon error" viewBox="0 0 24 24">
          <!-- X icon -->
        </svg>
        @switch (error()) {
          @case ('expired') {
            <h2 class="join-title">Invite Expired</h2>
            <p class="join-message">This invite link has expired or has already been used. Ask the Game Master for a new one.</p>
          }
          @case ('not-found') {
            <h2 class="join-title">Invalid Invite</h2>
            <p class="join-message">This invite link is invalid.</p>
          }
          @case ('unauthorized') {
            <h2 class="join-title">Sign In Required</h2>
            <p class="join-message">You need to sign in before joining a campaign.</p>
            <a routerLink="/auth" class="join-btn">Sign In</a>
          }
          @default {
            <h2 class="join-title">Something Went Wrong</h2>
            <p class="join-message">Please try again or ask the Game Master for a new invite link.</p>
          }
        }
        <a routerLink="/campaigns" class="join-link">Go to Campaigns</a>
      </div>
    }
  </div>
</div>
```

**Styling:** Centered card on the dark background. Use the tavern aesthetic but keep it minimal — this is a transient page.

```css
:host {
  display: block;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(180, 120, 50, 0.07) 0%, transparent 50%),
    linear-gradient(175deg, #1a1412 0%, #0d0806 100%);
}

.campaign-join {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 2rem;
}

.join-card {
  position: relative;
  z-index: 1;
  max-width: 480px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  opacity: 0;
  animation: fadeInUp 0.6s ease-out 0.1s forwards;
}

.join-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 1.5rem;
}

.join-icon.success { color: var(--color-accent); }
.join-icon.error { color: #c44; }

.join-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  color: var(--color-parchment);
  margin-bottom: 1rem;
}

.join-message {
  color: rgba(245, 230, 211, 0.6);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.join-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  font-family: var(--font-display);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #1a1412;
  background: var(--color-accent);
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.2s;
}

.join-btn:hover { opacity: 0.85; }

.join-link {
  display: block;
  margin-top: 1.5rem;
  color: var(--color-accent);
  font-size: 0.875rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}
```

### Tests: `src/app/features/campaign-join/campaign-join.spec.ts`
- Shows "Joining campaign..." on init
- Calls joinCampaign with token from route
- Shows success state with campaign name on success
- Shows "View Campaign" link pointing to correct campaign
- Shows expired error for 400 responses
- Shows invalid error for 404 responses
- Redirects to auth for 401 responses
- Shows generic error for other failures

---

## Step 4: Update Navbar Tests

### Modify: `src/app/layout/navbar/navbar.spec.ts`

Add tests for new functionality:
- "Campaigns" link appears when logged in
- "Campaigns" link does not appear when logged out
- "Create Campaign" appears in dropdown when open
- Clicking "Create Campaign" navigates to `/campaigns/create`
- Clicking "Create Campaign" closes dropdown

---

## Step 5: Mobile Responsive Navbar

Check the existing navbar mobile styles. The new "Campaigns" link needs to fit in the mobile navigation. Read the current navbar CSS to understand the mobile breakpoint pattern and ensure the new link works at all viewport sizes.

If the navbar uses a horizontal link list that wraps, the new link should integrate naturally. If there's a hamburger menu pattern, add "Campaigns" and "Create Campaign" to it.

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
| `layout/navbar/navbar.html` | Modify | Add Campaigns link + Create Campaign dropdown |
| `layout/navbar/navbar.ts` | Modify | Add onCreateCampaign method |
| `layout/navbar/navbar.spec.ts` | Modify | Test new nav items |
| `features/campaign-join/campaign-join.ts` | Replace placeholder | Join campaign page |
| `features/campaign-join/campaign-join.html` | New | Template |
| `features/campaign-join/campaign-join.css` | New | Styles |
| `features/campaign-join/campaign-join.spec.ts` | New | Tests |

## Completion Criteria

- [ ] Navbar shows "Campaigns" link between Reference and Profile for logged-in users
- [ ] Dropdown "+ " menu includes "Create Campaign" option
- [ ] Create Campaign dropdown item navigates to `/campaigns/create`
- [ ] Join campaign page auto-joins on load with token from URL
- [ ] Join success shows campaign name and link to view campaign
- [ ] Join errors show appropriate messages (expired, invalid, unauthorized)
- [ ] Navigation works on mobile viewports
- [ ] All tests pass, lint clean, build succeeds
