# Master Plan: Campaigns, Auth Roles & Public Profiles

**Date:** 2026-04-02
**Scope:** Three major backend features need frontend implementation:
1. User role tracking from auth endpoints
2. Campaign management (full CRUD + player/GM/character management)
3. Public player profiles

## Execution Strategy

This work is split into **4 workstreams**. Workstream A (Foundation) runs first. Workstreams B, C, and D run **in parallel worktrees** after A is merged.

**REQUIREMENT:** Each workstream MUST be implemented by an agent team. Use the `Agent` tool with `isolation: "worktree"` for workstreams B, C, and D to enable parallel execution.

```
┌─────────────────────────────────────────┐
│  Workstream A: Foundation (Sequential)  │
│  Models, Services, Auth Role Updates    │
└──────────────┬──────────────────────────┘
               │ merge to main
     ┌─────────┼─────────────┐
     ▼         ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────────┐
│  WS-B   │ │  WS-C    │ │    WS-D      │
│Campaign │ │ Public   │ │ Nav + Routes │
│ Feature │ │ Profiles │ │ + Join Flow  │
└─────────┘ └──────────┘ └──────────────┘
  worktree    worktree      worktree
```

## Workstream Summaries

### A — Foundation (Sequential, on main)
**Plan:** `2026-04-02-ws-a-foundation.md`
- Update `UserResponse` model to use `Role` enum type instead of raw string
- Add `isModerator`, `isPrivileged` computed signals to AuthService
- Update admin guard to use new role helpers
- Create campaign API models (`campaign-api.model.ts`)
- Create `CampaignService` with all 19 campaign endpoints
- Create `UserService` for fetching other users' profiles
- Add campaign routes to `app.routes.ts` (placeholder components)
- **Validation:** All existing tests pass, lint clean, builds

### B — Campaign Feature (Parallel Worktree)
**Plan:** `2026-04-02-ws-b-campaigns.md`
- Campaign page component (view single campaign)
  - Summary header (name, GM, description)
  - Player list with crown icon for GM
  - Character sheet list with owner names
  - GM-only: invite URL generation, remove player/character buttons, confirmation dialogs
- My Campaigns page (list user's campaigns)
- Create Campaign form
- **Validation:** Tests for all components/services, lint clean, builds

### C — Public Player Profiles (Parallel Worktree)
**Plan:** `2026-04-02-ws-c-public-profiles.md`
- New `/player/:id` route for viewing other players
- Reuse profile design pattern but with limited info (no email, no edit actions)
- Show player's character sheets (reuse RosterList)
- Show player's campaigns
- Self-profile (`/profile`) now also shows campaigns section
- Access control: 403 handling for non-participant campaign views
- **Validation:** Tests, lint, build

### D — Navigation, Routing & Join Flow (Parallel Worktree)
**Plan:** `2026-04-02-ws-d-nav-routing-join.md`
- Add "Campaigns" link to navbar (logged-in users)
- Add "Create Campaign" to the + dropdown menu
- Campaign join page (`/campaigns/join/:token`)
- Update navbar to show Campaigns between Reference and Profile
- **Validation:** Tests, lint, build

## File Impact Summary

### New Files
| File | Workstream | Description |
|------|-----------|-------------|
| `src/app/shared/models/campaign-api.model.ts` | A | Campaign DTOs |
| `src/app/shared/models/role.model.ts` | A | Role enum + helpers |
| `src/app/shared/services/campaign.service.ts` | A | Campaign API service |
| `src/app/shared/services/user.service.ts` | A | User profile API service |
| `src/app/features/campaigns/campaigns.ts` | B | My Campaigns list page |
| `src/app/features/campaigns/campaigns.html` | B | My Campaigns template |
| `src/app/features/campaigns/campaigns.css` | B | My Campaigns styles |
| `src/app/features/campaigns/campaigns.spec.ts` | B | My Campaigns tests |
| `src/app/features/campaign/campaign.ts` | B | Single campaign page |
| `src/app/features/campaign/campaign.html` | B | Campaign page template |
| `src/app/features/campaign/campaign.css` | B | Campaign page styles |
| `src/app/features/campaign/campaign.spec.ts` | B | Campaign page tests |
| `src/app/features/campaign/components/` | B | Campaign child components |
| `src/app/features/campaigns/create-campaign/` | B | Create Campaign form |
| `src/app/features/player/player.ts` | C | Public player profile |
| `src/app/features/player/player.html` | C | Player profile template |
| `src/app/features/player/player.css` | C | Player profile styles |
| `src/app/features/player/player.spec.ts` | C | Player profile tests |
| `src/app/features/campaign-join/campaign-join.ts` | D | Join campaign via invite |

### Modified Files
| File | Workstream | Changes |
|------|-----------|---------|
| `src/app/core/models/auth.model.ts` | A | Add Role type, update UserResponse |
| `src/app/core/services/auth.service.ts` | A | Add role helper computeds |
| `src/app/core/guards/admin.guard.ts` | A | Use isPrivileged() |
| `src/app/app.routes.ts` | A, D | Add campaign + player + join routes |
| `src/app/layout/navbar/navbar.ts` | D | Add Campaigns link, Create Campaign dropdown item |
| `src/app/layout/navbar/navbar.html` | D | Updated nav template |
| `src/app/features/profile/profile.ts` | C | Add campaigns section |
| `src/app/features/profile/profile.html` | C | Add campaigns list |

## Design Direction

Follow the existing warm tavern aesthetic:
- Dark brown backgrounds (`#1a1412`, `#0d0806`)
- Gold accent (`#d4a056`) via `var(--color-accent)`
- Parchment text (`var(--color-parchment)`)
- Cinzel display font (`var(--font-display)`)
- Lora body font
- Grain overlay effect
- `fadeInUp` entrance animations
- Divider pattern with centered label (see profile page)
- Roster-list style for clickable item lists

### Campaign Page Layout (Desktop)
```
┌──────────────────────────────────────┐
│ [eyebrow: Campaign]                  │
│ Campaign Name            [sigil/icon]│
│ Game Master: username                │
│ Description text here...             │
├──────────────────────────────────────┤
│ ─── Players ───                      │
│ [crown] GM Name              [→]    │
│ Player 2                [remove] [→]│
│ Player 3                [remove] [→]│
├──────────────────────────────────────┤
│ ─── Characters ───                   │
│ Lvl 5 · Character Name              │
│   Owner: player2        [remove] [→]│
│ Lvl 3 · Character Name              │
│   Owner: player3        [remove] [→]│
├──────────────────────────────────────┤
│ ─── Invite ─── (GM/Admin only)      │
│ [Generate Invite Link]               │
│ [copy-to-clipboard URL display]      │
└──────────────────────────────────────┘
```

## Merge Order

1. Merge Workstream A to main
2. Rebase B, C, D worktrees onto updated main
3. Merge B, C, D (resolve any conflicts in routes/navbar)
4. Final integration test on main

## Validation Checklist (Per Workstream)

- [ ] `npm run test:run` — all tests green
- [ ] `npm run lint` — no new lint errors
- [ ] `npm run build` — production build succeeds
- [ ] Manual smoke test of affected pages
