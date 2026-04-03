# Workstream A: Foundation — Models, Services & Auth Updates

**Parent Plan:** `2026-04-02-master-plan.md`
**Execution:** Sequential on main branch (must complete before B, C, D)
**Agent Team:** Use agents for parallel file creation where possible

---

## Step 1: Create Role Model

**File:** `src/app/shared/models/role.model.ts` (NEW)

```typescript
export type Role = 'USER' | 'MODERATOR' | 'ADMIN' | 'OWNER';

export const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function isAtLeast(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```

---

## Step 2: Update Auth Model

**File:** `src/app/core/models/auth.model.ts` (MODIFY)

```typescript
import { Role } from '../../shared/models/role.model';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string;
  timezone?: string;
  role: Role;           // Changed from string to Role
  createdAt: string;
  lastModifiedAt: string;
}

// LoginRequest and RegisterRequest unchanged
```

---

## Step 3: Update AuthService with Role Helpers

**File:** `src/app/core/services/auth.service.ts` (MODIFY)

Add these computed signals after the existing `isAdmin`:

```diff
+ import { isAtLeast, Role } from '../../shared/models/role.model';
+ export type { Role };

  readonly isAdmin = computed(() => {
    const user = this.currentUser();
-   return user !== null && (user.role === 'ADMIN' || user.role === 'OWNER');
+   return user !== null && isAtLeast(user.role, 'ADMIN');
  });

+ readonly isModerator = computed(() => {
+   const user = this.currentUser();
+   return user !== null && isAtLeast(user.role, 'MODERATOR');
+ });
+
+ readonly isPrivileged = computed(() => this.isModerator());
```

No other changes to AuthService. The `isAdmin` computed keeps the same behavior but uses the helper.

---

## Step 4: Update Admin Guard

**File:** `src/app/core/guards/admin.guard.ts` (MODIFY)

No functional change needed — `isAdmin()` already covers ADMIN and OWNER. The guard stays as-is since `isAdmin` now uses `isAtLeast('ADMIN')` which includes OWNER.

---

## Step 5: Create Campaign API Models

**File:** `src/app/shared/models/campaign-api.model.ts` (NEW)

```typescript
import { UserResponse } from '../../core/models/auth.model';

export interface CampaignResponse {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  creator?: UserResponse;
  gameMasterIds: number[];
  gameMasters?: UserResponse[];
  playerIds: number[];
  players?: UserResponse[];
  pendingCharacterSheetIds: number[];
  pendingCharacterSheets?: CampaignCharacterSheet[];
  playerCharacterIds: number[];
  playerCharacters?: CampaignCharacterSheet[];
  nonPlayerCharacterIds: number[];
  nonPlayerCharacters?: CampaignCharacterSheet[];
  characterSummaries?: CampaignCharacterSummary[];
  isEnded: boolean;
  endedAt?: string;
  createdAt: string;
  lastModifiedAt: string;
  deletedAt?: string;
}

export interface CampaignCharacterSheet {
  id: number;
  name: string;
  pronouns?: string;
  level: number;
  ownerId: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface CampaignCharacterSummary {
  id: number;
  name: string;
  level: number;
  ownerId: number;
  ownerUsername: string;
  ancestryNames: string[];
  subclassNames: string[];
  classNames: string[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  gameMasterIds?: number[];
  playerIds?: number[];
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
}

export interface CampaignInviteResponse {
  id: number;
  campaignId: number;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface JoinCampaignResponse {
  campaignId: number;
  campaignName: string;
  message: string;
}
```

---

## Step 6: Create Campaign Service

**File:** `src/app/shared/services/campaign.service.ts` (NEW)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse } from '../models/api.model';
import {
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignInviteResponse,
  JoinCampaignResponse,
} from '../models/campaign-api.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/campaigns`;

  getMyCampaigns(page = 0, size = 20, expand?: string): Observable<PaginatedResponse<CampaignResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (expand) params = params.set('expand', expand);
    return this.http.get<PaginatedResponse<CampaignResponse>>(
      `${this.baseUrl}/mine`, { params, withCredentials: true }
    );
  }

  getCampaign(id: number, expand?: string): Observable<CampaignResponse> {
    let params = new HttpParams();
    if (expand) params = params.set('expand', expand);
    return this.http.get<CampaignResponse>(
      `${this.baseUrl}/${id}`, { params, withCredentials: true }
    );
  }

  createCampaign(request: CreateCampaignRequest): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      this.baseUrl, request, { withCredentials: true }
    );
  }

  updateCampaign(id: number, request: UpdateCampaignRequest): Observable<CampaignResponse> {
    return this.http.put<CampaignResponse>(
      `${this.baseUrl}/${id}`, request, { withCredentials: true }
    );
  }

  deleteCampaign(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${id}`, { withCredentials: true }
    );
  }

  generateInvite(campaignId: number): Observable<CampaignInviteResponse> {
    return this.http.post<CampaignInviteResponse>(
      `${this.baseUrl}/${campaignId}/invites`, {}, { withCredentials: true }
    );
  }

  joinCampaign(token: string): Observable<JoinCampaignResponse> {
    return this.http.post<JoinCampaignResponse>(
      `${this.baseUrl}/join/${token}`, {}, { withCredentials: true }
    );
  }

  endCampaign(id: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${id}/end`, {}, { withCredentials: true }
    );
  }

  leaveCampaign(id: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${id}/leave`, {}, { withCredentials: true }
    );
  }

  kickPlayer(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/players/${userId}`, { withCredentials: true }
    );
  }

  removeCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}`, { withCredentials: true }
    );
  }

  submitCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/submit`, {}, { withCredentials: true }
    );
  }

  approveCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/approve`, {}, { withCredentials: true }
    );
  }

  rejectCharacterSheet(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/character-sheets/${sheetId}/reject`, {}, { withCredentials: true }
    );
  }

  addNpc(campaignId: number, sheetId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/npcs/${sheetId}`, {}, { withCredentials: true }
    );
  }

  addGameMaster(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.post<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/game-masters/${userId}`, {}, { withCredentials: true }
    );
  }

  removeGameMaster(campaignId: number, userId: number): Observable<CampaignResponse> {
    return this.http.delete<CampaignResponse>(
      `${this.baseUrl}/${campaignId}/game-masters/${userId}`, { withCredentials: true }
    );
  }
}
```

---

## Step 7: Create User Service

**File:** `src/app/shared/services/user.service.ts` (NEW)

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse } from '../../core/models/auth.model';
import { PaginatedResponse } from '../models/api.model';
import { CharacterSheetResponse } from '../../features/create-character/models/character-sheet-api.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getUser(userId: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${environment.apiUrl}/users/${userId}`, { withCredentials: true }
    );
  }

  getUserCharacterSheets(
    ownerId: number, page = 0, size = 100, expand?: string
  ): Observable<PaginatedResponse<CharacterSheetResponse>> {
    let params = new HttpParams()
      .set('ownerId', ownerId)
      .set('page', page)
      .set('size', size);
    if (expand) params = params.set('expand', expand);
    return this.http.get<PaginatedResponse<CharacterSheetResponse>>(
      `${environment.apiUrl}/dh/character-sheets`, { params, withCredentials: true }
    );
  }
}
```

---

## Step 8: Add Placeholder Routes

**File:** `src/app/app.routes.ts` (MODIFY)

Add these routes inside the `children` array, after the `profile` route:

```typescript
{
  path: 'campaigns',
  loadComponent: () => import('./features/campaigns/campaigns').then(m => m.Campaigns)
},
{
  path: 'campaigns/create',
  loadComponent: () => import('./features/campaigns/create-campaign/create-campaign').then(m => m.CreateCampaign)
},
{
  path: 'campaign/:id',
  loadComponent: () => import('./features/campaign/campaign').then(m => m.Campaign)
},
{
  path: 'campaigns/join/:token',
  loadComponent: () => import('./features/campaign-join/campaign-join').then(m => m.CampaignJoin)
},
{
  path: 'player/:id',
  loadComponent: () => import('./features/player/player').then(m => m.Player)
},
```

Create minimal placeholder components for each so the build succeeds. Each placeholder should be a basic `@Component` with `changeDetection: OnPush` that displays a loading/coming-soon state.

---

## Step 9: Create Tests for New Services

**File:** `src/app/shared/services/campaign.service.spec.ts` (NEW)
- Test each method makes the correct HTTP request (method, URL, params, withCredentials)
- Use `HttpClientTestingModule` / `provideHttpClientTesting()`
- Test expand parameter is included when provided

**File:** `src/app/shared/services/user.service.spec.ts` (NEW)
- Test `getUser` calls correct URL
- Test `getUserCharacterSheets` includes ownerId, page, size params

**File:** `src/app/shared/models/role.model.spec.ts` (NEW)
- Test `isAtLeast` function for all role combinations

---

## Step 10: Validate

```bash
npm run test:run          # All tests green
npm run lint              # Clean
npm run build             # Succeeds
```

---

## Completion Criteria

- [ ] `Role` type replaces raw string in `UserResponse`
- [ ] `AuthService` has `isAdmin`, `isModerator`, `isPrivileged` computeds
- [ ] `CampaignService` covers all 19 API endpoints
- [ ] `UserService` can fetch user profiles and character sheets
- [ ] Campaign API models match backend DTOs
- [ ] Placeholder routes registered for campaigns, campaign, player, join
- [ ] All tests pass, lint clean, build succeeds
