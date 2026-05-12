import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-inline-delete-confirm',
  templateUrl: './inline-delete-confirm.html',
  styleUrl: './inline-delete-confirm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
})
export class InlineDeleteConfirm {
  readonly itemLabel = input.required<string>();
  readonly active = input(false);

  readonly requested = output<void>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onTrashClick(event: Event): void {
    event.stopPropagation();
    this.requested.emit();
  }

  onYesClick(event: Event): void {
    event.stopPropagation();
    this.confirmed.emit();
  }

  onNoClick(event: Event): void {
    event.stopPropagation();
    this.cancelled.emit();
  }
}
