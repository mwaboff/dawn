import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../models/profile.model';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-roster-list',
  templateUrl: './roster-list.html',
  styleUrl: './roster-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog],
})
export class RosterList {
  readonly characters = input.required<CharacterSummary[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly showCreateButton = input(true);
  readonly canDelete = input(false);

  readonly viewCharacter = output<number>();
  readonly createCharacter = output<void>();
  readonly deleteCharacter = output<number>();

  readonly pendingDeleteId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  onDeleteClick(event: Event, id: number): void {
    event.stopPropagation();
    this.pendingDeleteId.set(id);
  }

  onInlineConfirm(event: Event): void {
    event.stopPropagation();
    this.confirmingDeleteId.set(this.pendingDeleteId());
  }

  onInlineCancel(event: Event): void {
    event.stopPropagation();
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const id = this.confirmingDeleteId();
    if (id !== null) {
      this.deletingId.set(id);
      this.deleteCharacter.emit(id);
    }
  }

  onCancelDelete(): void {
    this.confirmingDeleteId.set(null);
    this.pendingDeleteId.set(null);
  }

  resetDeleteState(): void {
    this.pendingDeleteId.set(null);
    this.confirmingDeleteId.set(null);
    this.deletingId.set(null);
  }
}
