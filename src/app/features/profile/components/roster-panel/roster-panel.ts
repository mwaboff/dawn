import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InlineDeleteConfirm } from '../../../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { RosterPanelItem } from './roster-panel.model';

/**
 * A single, domain-agnostic list panel for "things a profile owns" (campaigns, encounters, ...).
 * Campaigns and encounters used to be near-identical forks of each other differing only in copy
 * and which two fields appeared on the secondary line; this parameterizes that instead. Callers
 * map their own response type to `RosterPanelItem` (see `roster-panel.mapper.ts`) and supply the
 * copy that's genuinely domain-specific via inputs.
 */
@Component({
  selector: 'app-roster-panel',
  templateUrl: './roster-panel.html',
  styleUrl: './roster-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog, InlineDeleteConfirm],
})
export class RosterPanel {
  readonly items = input.required<RosterPanelItem[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly showCreateButton = input(true);
  readonly canDelete = input(false);

  /** e.g. "Campaign" -- used for the delete dialog's "Delete {itemTypeLabel}" title/message. */
  readonly itemTypeLabel = input.required<string>();
  /** e.g. "Campaigns" -- used for the "View All {listLabel}" footer link. */
  readonly listLabel = input.required<string>();
  readonly listPath = input.required<string>();
  readonly createButtonLabel = input.required<string>();
  /** Empty-state copy when the viewer can create one (their own profile). */
  readonly emptyTextSelf = input.required<string>();
  /** Empty-state copy when the viewer can't (viewing someone else's profile). */
  readonly emptyTextOther = input.required<string>();
  readonly errorText = input.required<string>();
  readonly skeletonCount = input(2);

  readonly view = output<number>();
  readonly create = output<void>();
  readonly delete = output<number>();

  readonly skeletonIndexes = computed(() => Array.from({ length: this.skeletonCount() }, (_, i) => i));

  readonly pendingDeleteId = signal<number | null>(null);
  readonly confirmingDeleteId = signal<number | null>(null);
  readonly deletingId = signal<number | null>(null);

  onDeleteRequest(id: number): void {
    this.pendingDeleteId.set(id);
  }

  onDeleteConfirm(): void {
    this.confirmingDeleteId.set(this.pendingDeleteId());
  }

  onDeleteCancel(): void {
    this.pendingDeleteId.set(null);
  }

  onConfirmDelete(): void {
    const id = this.confirmingDeleteId();
    if (id !== null) {
      this.deletingId.set(id);
      this.delete.emit(id);
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
