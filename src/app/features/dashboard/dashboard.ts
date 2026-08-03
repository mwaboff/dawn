import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { EncounterService } from '../../shared/services/encounter.service';
import { EncounterResponse } from '../../shared/models/encounter-api.model';
import { CharacterSummary } from '../profile/models/profile.model';
import { mapToSummary } from '../profile/models/profile.mapper';
import { DASHBOARD_PREVIEW_LIMIT } from './models/dashboard.model';
import { classBorderColor } from './utils/class-color.utils';
import { isCampaignGameMaster } from '../../shared/utils/campaign-access.utils';
import { tierRangeLabel } from '../../shared/utils/encounter-tier.utils';
import { ENCOUNTER_NEW_PATH, ENCOUNTERS_LIST_PATH, encounterEditPath } from '../encounters/encounter-routes';

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
  private readonly encounterService = inject(EncounterService);
  private readonly destroyRef = inject(DestroyRef);

  readonly characters = signal<CharacterSummary[]>([]);
  readonly charactersLoading = signal(true);
  readonly charactersError = signal(false);

  readonly campaigns = signal<CampaignResponse[]>([]);
  readonly campaignsLoading = signal(true);
  readonly campaignsError = signal(false);

  readonly encounters = signal<EncounterResponse[]>([]);
  readonly encountersLoading = signal(true);
  readonly encountersError = signal(false);

  readonly username = computed(() => this.authService.user()?.username ?? 'Adventurer');

  /** Imported, not reimplemented -- also used by the profile roster panel's encounter mapper and
   *  the encounters list page. */
  readonly tierRangeLabel = tierRangeLabel;

  readonly newEncounterPath = ENCOUNTER_NEW_PATH;
  readonly encountersListPath = ENCOUNTERS_LIST_PATH;
  /**
   * Characters have no dedicated list page of their own -- the profile page's Characters section
   * is the closest thing to one. Campaigns has a real list page distinct from `/profile` (no
   * route-constants file exists for it, matching the literal already used for "+ Start a new
   * story" below). Both panels get the same header "View All" affordance as Encounters even
   * though the underlying destinations differ, so the three panels read as one system.
   */
  readonly charactersListPath = '/profile';
  readonly campaignsListPath = '/campaigns';

  protected readonly skeletonIndexes = [1, 2, 3] as const;

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user) {
      this.charactersLoading.set(false);
      this.campaignsLoading.set(false);
      this.encountersLoading.set(false);
      return;
    }
    this.loadCharacters(user.id);
    this.loadCampaigns();
    this.loadEncounters(user.id);
  }

  borderColorFor(c: CharacterSummary): string {
    return classBorderColor(c.classEntries[0]?.className);
  }

  gmsCampaign(c: CampaignResponse): boolean {
    return isCampaignGameMaster(c, this.authService.user()?.id);
  }

  encounterEditLink(e: EncounterResponse): string {
    return encounterEditPath(e.id);
  }

  private loadCharacters(ownerId: number): void {
    this.userService.getUserCharacterSheets(ownerId, 0, 100, 'subclassCards').pipe(
      map(response => response.content.map(mapToSummary)),
      map(list => [...list].sort(byLastModifiedDesc).slice(0, DASHBOARD_PREVIEW_LIMIT)),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) this.charactersError.set(true);
        return of([] as CharacterSummary[]);
      }),
      takeUntilDestroyed(this.destroyRef),
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(list => {
      this.campaigns.set(list);
      this.campaignsLoading.set(false);
    });
  }

  private loadEncounters(userId: number): void {
    this.encounterService.getOwnEncounters(userId).pipe(
      map(list => [...list].sort(byLastModifiedDesc).slice(0, DASHBOARD_PREVIEW_LIMIT)),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 403) this.encountersError.set(true);
        return of([] as EncounterResponse[]);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(list => {
      this.encounters.set(list);
      this.encountersLoading.set(false);
    });
  }
}

function byLastModifiedDesc<T extends { lastModifiedAt: string }>(a: T, b: T): number {
  return Date.parse(b.lastModifiedAt) - Date.parse(a.lastModifiedAt);
}
