import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-summary',
  templateUrl: './campaign-summary.html',
  styleUrl: './campaign-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignSummary {
  readonly campaign = input.required<CampaignResponse>();

  readonly gmName = computed(() => this.campaign().creator?.username ?? 'Unknown');
  readonly isEnded = computed(() => this.campaign().isEnded);
}
