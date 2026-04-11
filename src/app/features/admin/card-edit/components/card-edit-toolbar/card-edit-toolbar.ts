import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-card-edit-toolbar',
  templateUrl: './card-edit-toolbar.html',
  styleUrl: './card-edit-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEditToolbar {
  readonly hasPendingChanges = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly saveSuccess = input<boolean>(false);

  readonly back = output<void>();
  readonly save = output<void>();

  onBack(): void {
    this.back.emit();
  }

  onSave(): void {
    this.save.emit();
  }
}
