# Plan: Editable Class Features + Delete Card Button

## Feature 1: Editable Hope/Class Features

**Problem**: Class edit page shows Hope Features and Class Features as multi-select checkboxes (`entityMulti`). Other card types show their features as editable accordions with inline editing via `CardEditFeatures`.

**Root cause**: The class schema defines `hopeFeatureIds` and `classFeatureIds` as `entityMulti` fields in the Relationships section. The class API response returns `hopeFeatures` and `classFeatures` as separate arrays, not a unified `features` array like other card types.

### Changes

#### `card-edit.ts` (lines 194-216, `loadCard()`)
After receiving the class response, combine `hopeFeatures` and `classFeatures` into the `rawFeatures` signal:

```diff
  next: (response) => {
    const raw = response as RawCardResponse;
    this.rawCard.set(raw);
-   this.rawFeatures.set(raw.features ?? []);
+   this.rawFeatures.set(this.extractFeatures(raw));
    ...
  },
```

Add new method:
```typescript
private extractFeatures(raw: RawCardResponse): RawFeatureResponse[] {
  if (raw.features?.length) return raw.features;
  const hope = (raw['hopeFeatures'] as RawFeatureResponse[]) ?? [];
  const cls = (raw['classFeatures'] as RawFeatureResponse[]) ?? [];
  if (hope.length || cls.length) return [...hope, ...cls];
  return [];
}
```

#### `card-edit-schema.ts` (lines 125-131, class Relationships section)
Remove `hopeFeatureIds` and `classFeatureIds` from the schema. Keep `associatedDomainIds`:

```diff
  {
    title: 'Relationships',
    fields: [
      { name: 'associatedDomainIds', label: 'Associated domains', kind: 'entityMulti', lookup: 'domains', column: 'full' },
-     { name: 'hopeFeatureIds', label: 'Hope features', kind: 'entityMulti', lookup: 'hopeFeatures', column: 'full' },
-     { name: 'classFeatureIds', label: 'Class features', kind: 'entityMulti', lookup: 'classFeatures', column: 'full' },
    ],
  },
```

#### `card-edit-features.ts` — Add `groupByType` input + grouped accessor
Add a `groupByType` input (default false). When true, expose a `getFeatureGroups()` method that returns features grouped by `featureType`, each with a display label.

```typescript
readonly groupByType = input<boolean>(false);

private readonly featureTypeLabels: Record<string, string> = {
  HOPE: 'Hope Features',
  CLASS: 'Class Features',
};

getFeatureGroups(): { label: string; features: EditableFeature[] }[] {
  const all = this.editableFeatures();
  if (!this.groupByType()) return [{ label: 'Features', features: all }];
  const groups = new Map<string, EditableFeature[]>();
  for (const f of all) {
    const type = f.form.getRawValue().featureType ?? 'OTHER';
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type)!.push(f);
  }
  return Array.from(groups.entries()).map(([type, features]) => ({
    label: this.featureTypeLabels[type] ?? type,
    features,
  }));
}
```

#### `card-edit-features.html` — Use groups for rendering
Wrap the feature list in a `@for` over groups, showing a group heading when `groupByType()` is true:

```html
@for (group of getFeatureGroups(); track group.label) {
  <div class="features-section">
    <h3 class="features-title">{{ group.label }}</h3>
    @for (feature of group.features; track feature.id) {
      <!-- existing feature-item markup, but index must be the global index -->
    }
  </div>
}
```

The global index is needed because `toggleFeature(i)`, `addCostTag(i)`, etc. reference the flat `editableFeatures` array. Add a helper:
```typescript
getGlobalIndex(feature: EditableFeature): number {
  return this.editableFeatures().indexOf(feature);
}
```

#### `card-edit.html` — Pass `groupByType` for classes
```diff
  <app-card-edit-features
    [features]="rawFeatures()"
    [saving]="saving()"
+   [groupByType]="cardType() === 'class'"
    (featureDirtyChanged)="bumpFormVersion()"
    #featuresRef
  />
```

---

## Feature 2: Delete Card Button

**Problem**: No way to delete a card from the edit page. `AdminCardService.deleteCard()` already exists but nothing calls it.

### Design Decision: Inline Confirmation
Instead of a modal dialog, the delete button transforms in-place into a confirmation strip: "Delete this card? [Confirm] [Cancel]". This avoids modals (per design guidelines) and keeps the destructive action visually anchored to where it was initiated.

### Changes

#### `card-edit-toolbar.ts`
Add delete-related inputs, output, and confirmation state:

```diff
+ readonly deleting = input<boolean>(false);
+ readonly confirmingDelete = signal(false);
+ readonly deleteCard = output<void>();

+ onDelete(): void {
+   this.confirmingDelete.set(true);
+ }
+
+ onConfirmDelete(): void {
+   if (!confirm('This action is permanent and cannot be undone. Are you absolutely sure?')) return;
+   this.confirmingDelete.set(false);
+   this.deleteCard.emit();
+ }
+
+ onCancelDelete(): void {
+   this.confirmingDelete.set(false);
+ }
```

#### `card-edit-toolbar.html`
Add delete button to `toolbar-actions`, before the save button. When confirming, replace delete button with confirmation strip:

```html
@if (confirmingDelete()) {
  <span class="delete-confirm">
    <span class="delete-confirm-text">Delete this card?</span>
    <button type="button" class="btn btn--danger" (click)="onConfirmDelete()" [disabled]="deleting()">
      @if (deleting()) { Deleting... } @else { Confirm }
    </button>
    <button type="button" class="btn btn--secondary btn--sm" (click)="onCancelDelete()" [disabled]="deleting()">Cancel</button>
  </span>
} @else {
  <button type="button" class="btn btn--danger-ghost" (click)="onDelete()" [disabled]="saving()">Delete</button>
}
```

#### `card-edit-toolbar.css`
Add danger button styles:

```css
.btn--danger {
  background: linear-gradient(135deg, #8b2525, #a33030);
  color: var(--color-parchment);
}
.btn--danger:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(139, 37, 37, 0.4);
}
.btn--danger-ghost {
  background: transparent;
  border: 1px solid rgba(139, 37, 37, 0.4);
  color: #c47a7a;
}
.btn--danger-ghost:hover:not(:disabled) {
  background: rgba(139, 37, 37, 0.1);
  border-color: rgba(139, 37, 37, 0.6);
}
.delete-confirm {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.delete-confirm-text {
  color: #c47a7a;
  font-family: var(--font-body);
  font-size: 0.875rem;
}
```

#### `card-edit.ts`
Add `deleting` signal and `onDelete()` method:

```typescript
readonly deleting = signal(false);

onDelete(): void {
  this.deleting.set(true);
  this.adminCardService.deleteCard(this.cardType(), this.cardId())
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigate(['/admin/cards']);
      },
      error: (err) => {
        this.deleting.set(false);
        this.error.set(err?.error?.message ?? 'Delete failed. Please try again.');
      },
    });
}
```

#### `card-edit.html`
Wire up the toolbar:

```diff
  <app-card-edit-toolbar
    [hasPendingChanges]="hasPendingChanges()"
    [saving]="saving()"
+   [deleting]="deleting()"
    [error]="error()"
    [saveSuccess]="saveSuccess()"
    (save)="onSave()"
+   (deleteCard)="onDelete()"
    (back)="onBack()"
  />
```

---

## Test Plan

1. Run `npm run test:only -- 'src/app/features/admin/card-edit/**'` to verify existing tests pass
2. Add tests for:
   - `card-edit.ts`: `extractFeatures()` combines hopeFeatures + classFeatures
   - `card-edit.ts`: `onDelete()` calls service and navigates on success, sets error on failure
   - `card-edit-toolbar.ts`: delete confirmation flow (show confirm, emit on confirm, hide on cancel)
3. Run full test suite
4. Run lint and build
