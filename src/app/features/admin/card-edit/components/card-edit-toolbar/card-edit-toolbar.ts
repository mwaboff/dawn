import { Component, ChangeDetectionStrategy, input, output, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-card-edit-toolbar',
  templateUrl: './card-edit-toolbar.html',
  styleUrl: './card-edit-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditToolbar {
  private readonly platformId = inject(PLATFORM_ID);

  readonly hasPendingChanges = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly deleting = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly saveSuccess = input<boolean>(false);

  readonly back = output<void>();
  readonly save = output<void>();
  readonly deleteCard = output<void>();

  readonly confirmingDelete = signal(false);

  onBack(): void {
    this.back.emit();
  }

  onSave(): void {
    this.save.emit();
  }

  onDeleteClick(): void {
    this.confirmingDelete.set(true);
  }

  onConfirmDelete(): void {
    if (isPlatformBrowser(this.platformId) && !confirm('This action is permanent and cannot be undone. Are you absolutely sure?')) {
      return;
    }
    this.confirmingDelete.set(false);
    this.deleteCard.emit();
  }

  onCancelDelete(): void {
    this.confirmingDelete.set(false);
  }
}
