import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { ConfirmDialog } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-card-edit-toolbar',
  templateUrl: './card-edit-toolbar.html',
  styleUrl: './card-edit-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog],
})
export class CardEditToolbar {
  readonly hasPendingChanges = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly deleting = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly saveSuccess = input<boolean>(false);

  readonly back = output<void>();
  readonly save = output<void>();
  readonly deleteCard = output<void>();

  readonly pendingDelete = signal(false);
  readonly confirmingDelete = signal(false);

  onBack(): void {
    this.back.emit();
  }

  onSave(): void {
    this.save.emit();
  }

  onDeleteClick(): void {
    this.pendingDelete.set(true);
  }

  onInlineConfirm(): void {
    this.confirmingDelete.set(true);
  }

  onInlineCancel(): void {
    this.pendingDelete.set(false);
  }

  onConfirmDelete(): void {
    this.deleteCard.emit();
  }

  onCancelDelete(): void {
    this.confirmingDelete.set(false);
    this.pendingDelete.set(false);
  }
}
