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
  /**
   * Destination for the "View All" footer link. Optional: items have no browse-everything page
   * of their own (the codex mixes official content in), so that panel omits the footer rather
   * than pointing at a route that doesn't exist.
   */
  readonly listPath = input<string | null>(null);
  readonly createButtonLabel = input.required<string>();
  /** Empty-state copy when the viewer can create one (their own profile). */
  readonly emptyTextSelf = input.required<string>();
  /** Empty-state copy when the viewer can't (viewing someone else's profile). */
  readonly emptyTextOther = input.required<string>();
  readonly errorText = input.required<string>();
  readonly skeletonCount = input(2);

  /**
   * Emit the whole item rather than its id: an items panel holds three different tables, so the
   * id alone doesn't tell the host which endpoint to route to or delete against.
   */
  readonly view = output<RosterPanelItem>();
  readonly create = output<void>();
  readonly delete = output<RosterPanelItem>();

  readonly skeletonIndexes = computed(() => Array.from({ length: this.skeletonCount() }, (_, i) => i));

  readonly pendingDeleteKey = signal<string | null>(null);
  readonly confirmingDelete = signal<RosterPanelItem | null>(null);
  readonly deletingKey = signal<string | null>(null);

  /** See `RosterPanelItem.key`: falls back to the id for single-table panels. */
  itemKey(item: RosterPanelItem): string {
    return item.key ?? String(item.id);
  }

  onDeleteRequest(item: RosterPanelItem): void {
    this.pendingDeleteKey.set(this.itemKey(item));
  }

  onDeleteConfirm(item: RosterPanelItem): void {
    this.confirmingDelete.set(item);
  }

  onDeleteCancel(): void {
    this.pendingDeleteKey.set(null);
  }

  onConfirmDelete(): void {
    const item = this.confirmingDelete();
    if (item !== null) {
      this.deletingKey.set(this.itemKey(item));
      this.delete.emit(item);
    }
  }

  onCancelDelete(): void {
    this.confirmingDelete.set(null);
    this.pendingDeleteKey.set(null);
  }

  resetDeleteState(): void {
    this.pendingDeleteKey.set(null);
    this.confirmingDelete.set(null);
    this.deletingKey.set(null);
  }
}
