import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { CharacterSummary } from '../profile/models/profile.model';
import { mapToSummary } from '../profile/models/profile.mapper';
import { DASHBOARD_PREVIEW_LIMIT } from './models/dashboard.model';
import { classBorderColor } from './utils/class-color.utils';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly campaignService = inject(CampaignService);

  readonly characters = signal<CharacterSummary[]>([]);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);

  readonly campaigns = signal<CampaignResponse[]>([]);
  readonly campaignsLoading = signal(true);
  readonly campaignsError = signal(false);

  readonly username = computed(() => this.authService.user()?.username ?? 'Adventurer');

  readonly bothEmpty = computed(() =>
    !this.charactersLoading() && !this.campaignsLoading() &&
    !this.charactersError() && !this.campaignsError() &&
    this.characters().length === 0 && this.campaigns().length === 0
  );

  protected readonly skeletonIndexes = [1, 2, 3] as const;

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) {
      this.charactersLoading.set(false);
      this.campaignsLoading.set(false);
      return;
    }
    this.loadCharacters(user.id);
    this.loadCampaigns();
  }

  borderColorFor(c: CharacterSummary): string {
    return classBorderColor(c.classEntries[0]?.className);
  }

  private loadCharacters(ownerId: number): void {
    this.userService.getUserCharacterSheets(ownerId, 0, 100, 'subclassCards').pipe(
      map(response => response.content.map(mapToSummary)),
      map(list => [...list].sort(byLastModifiedDesc).slice(0, DASHBOARD_PREVIEW_LIMIT)),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) this.charactersError.set(true);
        return of([] as CharacterSummary[]);
      }),
    ).subscribe(list => {
      this.characters.set(list);
      this.charactersLoading.set(false);
    });
  }

  private loadCampaigns(): void {
    this.campaignService.getMyCampaigns(0, 20, 'creator').pipe(
      map(response => [...response.content].sort(byLastModifiedDesc).slice(0, DASHBOARD_PREVIEW_LIMIT)),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) this.campaignsError.set(true);
        return of([] as CampaignResponse[]);
      }),
    ).subscribe(list => {
      this.campaigns.set(list);
      this.campaignsLoading.set(false);
    });
  }
}

function byLastModifiedDesc<T extends { lastModifiedAt: string }>(a: T, b: T): number {
  return Date.parse(b.lastModifiedAt) - Date.parse(a.lastModifiedAt);
}
