import { Component, ChangeDetectionStrategy, input, output, computed, signal, inject } from '@angular/core';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { FormatTextPipe } from '../../../../shared/pipes/format-text.pipe';

@Component({
  selector: 'app-campaign-summary',
  templateUrl: './campaign-summary.html',
  styleUrl: './campaign-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormatTextPipe],
})
export class CampaignSummary {
  private readonly campaignService = inject(CampaignService);

  readonly campaign = input.required<CampaignResponse>();
  readonly canManage = input<boolean>(false);

  readonly updated = output<CampaignResponse>();

  readonly gmName = computed(() => this.campaign().creator?.username ?? 'Unknown');
  readonly isEnded = computed(() => this.campaign().isEnded);

  readonly editing = signal(false);
  readonly draft = signal('');
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onStartEdit(): void {
    this.draft.set(this.campaign().description ?? '');
    this.errorMessage.set(null);
    this.editing.set(true);
  }

  onCancelEdit(): void {
    this.editing.set(false);
    this.errorMessage.set(null);
  }

  onDraftChange(value: string): void {
    this.draft.set(value);
  }

  onSave(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.errorMessage.set(null);

    this.campaignService.updateCampaign(this.campaign().id, { description: this.draft() }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.editing.set(false);
        this.updated.emit(response);
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Failed to save changes. Please try again.');
      },
    });
  }
}
