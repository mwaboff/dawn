import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef, OnInit, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminCardService } from '../../shared/services/admin-card.service';
import { AuthService } from '../../core/services/auth.service';
import { RawCardResponse } from '../admin/models/admin-api.model';
import { ItemForm } from '../../shared/components/item-form/item-form';
import { ItemTypeSelector, CreateItemType } from './components/item-type-selector/item-type-selector';

@Component({
  selector: 'app-create-item',
  templateUrl: './create-item.html',
  styleUrl: './create-item.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ItemForm, ItemTypeSelector],
})
export class CreateItem implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminCardService = inject(AdminCardService);
  readonly authService = inject(AuthService);

  private readonly itemFormRef = viewChild<ItemForm>('itemFormRef');

  readonly isEditMode = signal(false);
  readonly itemId = signal<number | null>(null);
  readonly step = signal<'type' | 'form'>('type');
  readonly itemType = signal<CreateItemType | null>(null);
  readonly initialData = signal<RawCardResponse | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  readonly showIsOfficialField = computed(() => this.authService.isAdmin());

  ngOnInit(): void {
    const params = this.route.snapshot.params;
    const type = params['itemType'] as CreateItemType | undefined;
    const id = params['id'] as string | undefined;
    if (type && id) {
      this.isEditMode.set(true);
      this.itemType.set(type);
      this.itemId.set(Number(id));
      this.step.set('form');
      this.loadItem(type, Number(id));
    }
  }

  onTypeSelected(type: CreateItemType): void {
    this.itemType.set(type);
    this.step.set('form');
  }

  onBackToType(): void {
    this.step.set('type');
    this.itemType.set(null);
  }

  onSave(): void {
    this.itemFormRef()?.requestSave();
  }

  onFormSaved(payload: Record<string, unknown>): void {
    const type = this.itemType();
    if (!type) return;
    this.submitted.set(true);
    this.saving.set(true);
    this.error.set('');

    const request$ = this.isEditMode()
      ? this.adminCardService.updateCard(type, this.itemId()!, payload)
      : this.adminCardService.createCard(type, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        if (this.isEditMode()) {
          this.router.navigate(['/reference']);
        } else {
          this.success.set(true);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.mapError(err));
      },
    });
  }

  onCreateAnother(): void {
    this.success.set(false);
    this.submitted.set(false);
    this.step.set('type');
    this.itemType.set(null);
  }

  onViewInReference(): void {
    this.router.navigate(['/reference'], { queryParams: { filters: JSON.stringify({ isOfficial: false }) } });
  }

  private loadItem(type: CreateItemType, id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.adminCardService.getCard(type, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.initialData.set(response as RawCardResponse);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(this.mapError(err));
        },
      });
  }

  private mapError(err: HttpErrorResponse): string {
    if (err.status === 429) {
      return (err.error?.message as string) ?? 'You have reached the limit of custom items you can create.';
    }
    if (err.status === 401 || err.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    return (err.error?.message as string) ?? 'Something went wrong. Please try again.';
  }
}
