import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterSummary } from '../../../profile/models/profile.model';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { classBorderColor } from '../../utils/class-color.utils';

@Component({
  selector: 'app-dashboard-sheet',
  templateUrl: './dashboard-sheet.html',
  styleUrl: './dashboard-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class DashboardSheet {
  readonly characters = input.required<CharacterSummary[]>();
  readonly charactersLoading = input.required<boolean>();
  readonly charactersError = input.required<boolean>();
  readonly campaigns = input.required<CampaignResponse[]>();
  readonly campaignsLoading = input.required<boolean>();
  readonly campaignsError = input.required<boolean>();
  readonly username = input.required<string>();

  protected readonly skeletonIndexes = [1, 2, 3] as const;

  readonly daysAdventuring = computed(() => {
    const all = this.campaigns();
    if (all.length === 0) return 0;
    const oldest = all.reduce((a, b) =>
      Date.parse(a.createdAt) < Date.parse(b.createdAt) ? a : b
    );
    const ms = Date.now() - Date.parse(oldest.createdAt);
    return Math.max(0, Math.floor(ms / 86_400_000));
  });

  borderColorFor(c: CharacterSummary): string {
    return classBorderColor(c.classEntries[0]?.className);
  }
}
