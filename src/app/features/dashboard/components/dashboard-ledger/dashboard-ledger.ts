import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-dashboard-ledger',
  templateUrl: './dashboard-ledger.html',
  styleUrl: './dashboard-ledger.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DashboardLedger {
  readonly characters = input.required<CharacterSummary[]>();
  readonly charactersLoading = input.required<boolean>();
  readonly charactersError = input.required<boolean>();
  readonly campaigns = input.required<CampaignResponse[]>();
  readonly campaignsLoading = input.required<boolean>();
  readonly campaignsError = input.required<boolean>();
  readonly username = input.required<string>();

  formatRelative(iso: string): string {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
