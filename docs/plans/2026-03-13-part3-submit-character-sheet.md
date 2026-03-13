# Part 3: Submit Character Sheet

## Overview

Add a service to submit the character sheet to the backend API. Add a submit button on the review page that creates the character sheet, then creates experiences, and navigates to the new character sheet display page.

---

## Prerequisites

- Part 2 (Review Stage) must be complete
- Backend must be updated to support `domainCardIds` on the character sheet (see Backend Changes section)

---

## Backend Changes Required

The current `CreateCharacterSheetRequest` does **not** include `domainCardIds`. The following backend changes are needed before the frontend submission will fully work:

### 1. Add `domainCardIds` to `CreateCharacterSheetRequest`

```java
// In CreateCharacterSheetRequest.java
private List<Long> domainCardIds;  // Optional, each must reference existing DomainCard
```

### 2. Add `domainCardIds` to `UpdateCharacterSheetRequest`

```java
private List<Long> domainCardIds;  // Optional, replaces entire collection when provided
```

### 3. Add `domainCardIds` / `domainCards` to `CharacterSheetResponse`

```java
private List<Long> domainCardIds;  // Always present

@JsonInclude(JsonInclude.Include.NON_NULL)
private List<DomainCardResponse> domainCards;  // Only with ?expand=domainCards
```

### 4. Add expand support

Add `domainCards` to the expand options for character sheet endpoints.

### 5. Database

Add a join table `character_sheet_domain_cards`:

```sql
CREATE TABLE character_sheet_domain_cards (
  character_sheet_id BIGINT REFERENCES character_sheets(id) ON DELETE CASCADE,
  domain_card_id BIGINT REFERENCES cards(id) ON DELETE CASCADE,
  PRIMARY KEY (character_sheet_id, domain_card_id)
);
```

---

## Implementation Steps

### 1. Create Character Sheet API Model

**New file:** `src/app/features/create-character/models/character-sheet-api.model.ts`

```typescript
export interface CreateCharacterSheetRequest {
  name: string;
  pronouns?: string;
  level: number;
  evasion: number;
  armorMax: number;
  armorMarked: number;
  majorDamageThreshold: number;
  severeDamageThreshold: number;
  agilityModifier: number;
  agilityMarked: boolean;
  strengthModifier: number;
  strengthMarked: boolean;
  finesseModifier: number;
  finesseMarked: boolean;
  instinctModifier: number;
  instinctMarked: boolean;
  presenceModifier: number;
  presenceMarked: boolean;
  knowledgeModifier: number;
  knowledgeMarked: boolean;
  hitPointMax: number;
  hitPointMarked: number;
  stressMax: number;
  stressMarked: number;
  hopeMax: number;
  hopeMarked: number;
  gold: number;
  activePrimaryWeaponId?: number | null;
  activeSecondaryWeaponId?: number | null;
  activeArmorId?: number | null;
  communityCardIds?: number[];
  ancestryCardIds?: number[];
  subclassCardIds?: number[];
  domainCardIds?: number[];
  inventoryWeaponIds?: number[];
  inventoryArmorIds?: number[];
  inventoryItemIds?: number[];
}

export interface CreateExperienceRequest {
  characterSheetId: number;
  description: string;
  modifier: number;
}

export interface CharacterSheetResponse {
  id: number;
  name: string;
  pronouns?: string;
  level: number;
  evasion: number;
  armorMax: number;
  armorMarked: number;
  majorDamageThreshold: number;
  severeDamageThreshold: number;
  agilityModifier: number;
  agilityMarked: boolean;
  strengthModifier: number;
  strengthMarked: boolean;
  finesseModifier: number;
  finesseMarked: boolean;
  instinctModifier: number;
  instinctMarked: boolean;
  presenceModifier: number;
  presenceMarked: boolean;
  knowledgeModifier: number;
  knowledgeMarked: boolean;
  hitPointMax: number;
  hitPointMarked: number;
  stressMax: number;
  stressMarked: number;
  hopeMax: number;
  hopeMarked: number;
  gold: number;
  ownerId: number;
  activePrimaryWeaponId?: number | null;
  activeSecondaryWeaponId?: number | null;
  activeArmorId?: number | null;
  communityCardIds: number[];
  ancestryCardIds: number[];
  subclassCardIds: number[];
  domainCardIds: number[];
  inventoryWeaponIds: number[];
  inventoryArmorIds: number[];
  inventoryItemIds: number[];
  experienceIds: number[];
  createdAt: string;
  lastModifiedAt: string;
}
```

### 2. Create Character Sheet Service

**New file:** `src/app/core/services/character-sheet.service.ts`

Place in `core/services/` because it will be used by both the character creator (Part 3) and the character sheet viewer (Part 4).

```typescript
@Injectable({ providedIn: 'root' })
export class CharacterSheetService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dh/character-sheets`;

  /**
   * Creates a new character sheet.
   * POST /api/dh/character-sheets
   */
  createCharacterSheet(request: CreateCharacterSheetRequest): Observable<CharacterSheetResponse> {
    return this.http.post<CharacterSheetResponse>(this.baseUrl, request, {
      withCredentials: true,
    });
  }

  /**
   * Creates an experience for a character sheet.
   * POST /api/dh/experiences
   */
  createExperience(request: CreateExperienceRequest): Observable<ExperienceResponse> {
    return this.http.post<ExperienceResponse>(
      `${environment.apiUrl}/dh/experiences`,
      request,
      { withCredentials: true },
    );
  }

  /**
   * Fetches a character sheet by ID with expanded relationships.
   * GET /api/dh/character-sheets/{id}?expand=...
   */
  getCharacterSheet(id: number, expand?: string[]): Observable<CharacterSheetResponse> {
    let params = new HttpParams();
    if (expand?.length) {
      params = params.set('expand', expand.join(','));
    }
    return this.http.get<CharacterSheetResponse>(`${this.baseUrl}/${id}`, {
      params,
      withCredentials: true,
    });
  }
}
```

### 3. Create Submission Orchestrator

**New file:** `src/app/features/create-character/utils/character-sheet-submission.utils.ts`

Maps `CharacterSheetData` (from Part 2's assembler) to `CreateCharacterSheetRequest`:

```typescript
export function toCreateCharacterSheetRequest(
  data: CharacterSheetData
): CreateCharacterSheetRequest {
  return {
    name: data.name,
    pronouns: data.pronouns,
    level: data.level,
    evasion: data.evasion,
    // ... map all fields directly (they match 1:1)
    activePrimaryWeaponId: data.activePrimaryWeaponId,
    activeSecondaryWeaponId: data.activeSecondaryWeaponId,
    activeArmorId: data.activeArmorId,
    communityCardIds: data.communityCardIds,
    ancestryCardIds: data.ancestryCardIds,
    subclassCardIds: data.subclassCardIds,
    domainCardIds: data.domainCardIds,
    inventoryWeaponIds: data.inventoryWeaponIds,
    inventoryArmorIds: data.inventoryArmorIds,
    inventoryItemIds: [],
  };
}
```

### 4. Submission Flow

The submission happens in 2 sequential steps:

1. **Create the character sheet** via `POST /api/dh/character-sheets`
2. **Create each experience** via `POST /api/dh/experiences` (after sheet creation, since experiences reference the sheet ID)

```typescript
submitCharacterSheet(data: CharacterSheetData): Observable<CharacterSheetResponse> {
  const request = toCreateCharacterSheetRequest(data);

  return this.characterSheetService.createCharacterSheet(request).pipe(
    switchMap(sheet => {
      if (data.experiences.length === 0) {
        return of(sheet);
      }

      // Create all experiences in parallel
      const experienceRequests = data.experiences.map(exp =>
        this.characterSheetService.createExperience({
          characterSheetId: sheet.id,
          description: exp.name,
          modifier: exp.modifier,
        })
      );

      return forkJoin(experienceRequests).pipe(map(() => sheet));
    })
  );
}
```

### 5. Add Submit Button to Review Section

**File:** `src/app/features/create-character/components/review-section/review-section.ts`

Add output and submission state:

```typescript
submitClicked = output<void>();
submitting = input<boolean>(false);
submitError = input<string | null>(null);
```

**Template addition (at bottom of review):**

```html
<div class="submit-section">
  @if (submitError()) {
    <p class="submit-error">{{ submitError() }}</p>
  }
  <button
    class="submit-button"
    [disabled]="submitting()"
    (click)="submitClicked.emit()"
  >
    @if (submitting()) {
      Creating Character...
    } @else {
      Create Character
    }
  </button>
</div>
```

### 6. Wire Up Submission in CreateCharacter

**File:** `src/app/features/create-character/create-character.ts`

```typescript
readonly submitting = signal(false);
readonly submitError = signal<string | null>(null);

private readonly characterSheetService = inject(CharacterSheetService);
private readonly router = inject(Router);

onSubmitCharacter(): void {
  // Get character name/pronouns from CharacterForm
  const characterData = assembleCharacterSheet({
    name: this.characterName(),
    pronouns: this.characterPronouns(),
    classCard: this.selectedClassCard()!,
    subclassCard: this.selectedSubclassCard()!,
    ancestryCard: this.selectedAncestryCard()!,
    communityCard: this.selectedCommunityCard()!,
    traits: this.traitAssignments()!,
    primaryWeapon: this.selectedPrimaryWeapon(),
    secondaryWeapon: this.selectedSecondaryWeapon(),
    armor: this.selectedArmor(),
    experiences: this.experienceAssignments(),
    domainCards: this.selectedDomainCards(),
  });

  this.submitting.set(true);
  this.submitError.set(null);

  this.submitCharacterSheet(characterData).subscribe({
    next: (sheet) => {
      this.submitting.set(false);
      this.router.navigate(['/character', sheet.id]);
    },
    error: (err) => {
      this.submitting.set(false);
      this.submitError.set(
        err.error?.message ?? 'Failed to create character. Please try again.'
      );
    },
  });
}
```

### 7. Expose Character Name/Pronouns from CharacterForm

The CharacterForm component currently holds name/pronouns internally. We need to expose them to the parent:

**Option A (recommended):** Add output signals from CharacterForm that emit on change, and store in CreateCharacter as signals.

**Option B:** Pass the form values up via a shared signal or service.

Add to `CreateCharacter`:
```typescript
readonly characterName = signal('');
readonly characterPronouns = signal('');

onCharacterNameChanged(name: string): void {
  this.characterName.set(name);
}

onCharacterPronounsChanged(pronouns: string): void {
  this.characterPronouns.set(pronouns);
}
```

### 8. Add Route for Character Sheet View

**File:** `src/app/app.routes.ts`

```typescript
{
  path: 'character/:id',
  loadComponent: () =>
    import('./features/character-sheet/character-sheet').then(m => m.CharacterSheet),
}
```

This route will be implemented in Part 4.

---

## New Files

| File | Type | Description |
|------|------|-------------|
| `models/character-sheet-api.model.ts` | Model | API request/response interfaces |
| `core/services/character-sheet.service.ts` | Service | Character sheet CRUD |
| `core/services/character-sheet.service.spec.ts` | Test | Service tests |
| `utils/character-sheet-submission.utils.ts` | Utility | Request mapping |
| `utils/character-sheet-submission.utils.spec.ts` | Test | Mapping tests |

## Modified Files

| File | Change |
|------|--------|
| `components/review-section/review-section.ts` | Add submit button, submitting/error inputs |
| `components/review-section/review-section.html` | Add submit button UI |
| `components/review-section/review-section.css` | Submit button styles |
| `create-character.ts` | Add submission logic, inject service/router |
| `create-character.html` | Wire submit events, pass submitting/error |
| `components/character-form/character-form.ts` | Expose name/pronouns outputs |
| `app.routes.ts` | Add `/character/:id` route |

---

## Error Handling

| Error | Response | User Feedback |
|-------|----------|---------------|
| 400 Validation | Field errors | Show error message from API |
| 401 Unauthorized | Session expired | Redirect to login |
| 404 Referenced entity | Invalid card/weapon/armor ID | Show generic error |
| 500 Server error | Unexpected | "Failed to create character. Please try again." |
| Experience creation fails | Partial success | Character sheet exists; show warning that some experiences may not have saved |

---

## Validation Checklist

- [ ] Submit button appears on the review page
- [ ] Button is disabled while submitting (shows loading state)
- [ ] Character sheet is created successfully via API
- [ ] Experiences are created after sheet creation
- [ ] All selected weapons/armor are set as both active and in inventory
- [ ] Domain card IDs are included in the request (once backend supports it)
- [ ] On success, navigates to `/character/{id}`
- [ ] On error, shows error message without losing form state
- [ ] Character name and pronouns are included in submission
- [ ] All tests pass, lint passes, build succeeds
