import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { InlineDeleteConfirm } from '../../../../shared/components/inline-delete-confirm/inline-delete-confirm';

@Component({
  selector: 'app-campaign-roster',
  templateUrl: './campaign-roster.html',
  styleUrl: './campaign-roster.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ConfirmDialog, InlineDeleteConfirm],
})
export class CampaignRoster {
  readonly campaigns = input.required<CampaignResponse[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly showCreateButton = input(true);
  readonly canDelete = input(false);

  readonly viewCampaign = output<number>();
  readonly createCampaign = output<void>();
  readonly deleteCampaign = output<number>();

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
      this.deleteCampaign.emit(id);
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
