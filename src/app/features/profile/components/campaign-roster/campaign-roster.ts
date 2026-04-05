import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-roster',
  templateUrl: './campaign-roster.html',
  styleUrl: './campaign-roster.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class CampaignRoster {
  readonly campaigns = input.required<CampaignResponse[]>();
  readonly loading = input.required<boolean>();
  readonly error = input.required<boolean>();
  readonly showCreateButton = input(true);

  readonly viewCampaign = output<number>();
  readonly createCampaign = output<void>();
}
