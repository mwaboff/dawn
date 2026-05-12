import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';

interface MarkerTile {
  id: number;
  name: string;
  initial: string;
  routerLink: (string | number)[];
}

@Component({
  selector: 'app-dashboard-war-table',
  templateUrl: './dashboard-war-table.html',
  styleUrl: './dashboard-war-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DashboardWarTable {
  readonly characters = input.required<CharacterSummary[]>();
  readonly charactersLoading = input.required<boolean>();
  readonly charactersError = input.required<boolean>();
  readonly campaigns = input.required<CampaignResponse[]>();
  readonly campaignsLoading = input.required<boolean>();
  readonly campaignsError = input.required<boolean>();
  readonly username = input.required<string>();

  readonly featuredCharacter = computed(() => this.characters()[0] ?? null);
  readonly featuredCampaign = computed(() => this.campaigns()[0] ?? null);

  readonly characterMarkers = computed<MarkerTile[]>(() =>
    this.characters().slice(1).map(c => ({
      id: c.id,
      name: c.name,
      initial: c.name.charAt(0).toUpperCase() || '?',
      routerLink: ['/character', c.id],
    }))
  );

  readonly campaignMarkers = computed<MarkerTile[]>(() =>
    this.campaigns().slice(1).map(c => ({
      id: c.id,
      name: c.name,
      initial: c.name.charAt(0).toUpperCase() || '?',
      routerLink: ['/campaign', c.id],
    }))
  );

  readonly bothEmpty = computed(() =>
    !this.charactersLoading() && !this.campaignsLoading() &&
    !this.charactersError() && !this.campaignsError() &&
    this.characters().length === 0 && this.campaigns().length === 0
  );

  readonly anyLoading = computed(() => this.charactersLoading() || this.campaignsLoading());
}
