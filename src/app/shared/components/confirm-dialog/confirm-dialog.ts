import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ModalFocusDirective } from '../../directives/modal-focus.directive';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalFocusDirective],
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly processing = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    if (!this.processing()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.processing()) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
