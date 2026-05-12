import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../shared/services/user.service';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { CharacterSummary } from '../profile/models/profile.model';
import { mapToSummary } from '../profile/models/profile.mapper';
import {
  DASHBOARD_PREVIEW_LIMIT,
  DashboardVariant,
  readStoredVariant,
  writeStoredVariant,
} from './models/dashboard.model';
import { DashboardLedger } from './components/dashboard-ledger/dashboard-ledger';
import { DashboardSheet } from './components/dashboard-sheet/dashboard-sheet';
import { DashboardWarTable } from './components/dashboard-war-table/dashboard-war-table';
import { VariantSwitcher } from './components/variant-switcher/variant-switcher';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DashboardLedger, DashboardSheet, DashboardWarTable, VariantSwitcher],
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

  readonly variant = signal<DashboardVariant>(readStoredVariant());

  readonly username = computed(() => this.authService.user()?.username ?? 'Adventurer');

  readonly bothEmpty = computed(() =>
    !this.charactersLoading() && !this.campaignsLoading() &&
    !this.charactersError() && !this.campaignsError() &&
    this.characters().length === 0 && this.campaigns().length === 0
  );

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

  setVariant(v: DashboardVariant): void {
    this.variant.set(v);
    writeStoredVariant(v);
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
