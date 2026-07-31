import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { CampaignService } from '../../../shared/services/campaign.service';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignResponse } from '../../../shared/models/campaign-api.model';
import { GmPanelGrid } from '../components/gm-panel-grid/gm-panel-grid';
import { STATIC_GM_PANELS } from '../content/panel-registry';
import { CAMPAIGN_GM_PANELS } from './campaign-panels';
import { GmScreenContext } from './gm-screen-context.service';
import { FearCounterPanel } from './panels/fear-counter-panel/fear-counter-panel';

@Component({
  selector: 'app-campaign-gm-screen',
  templateUrl: './campaign-gm-screen.html',
  styleUrl: './campaign-gm-screen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, GmPanelGrid, FearCounterPanel],
  host: { class: 'gm-screen-shell' },
  // Component-scoped so each campaign page gets its own context; the public
  // /gm-screen page never provides this token at all.
  providers: [GmScreenContext],
})
export class CampaignGmScreen implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly campaignService = inject(CampaignService);
  private readonly authService = inject(AuthService);
  private readonly gmScreenContext = inject(GmScreenContext);

  readonly campaign = signal<CampaignResponse | null>(null);
  readonly loading = signal(true);
  readonly errorStatus = signal<number | null>(null);

  // Deliberately inline (copied from Campaign.canManage) rather than extracted:
  // if a third consumer appears, promote to `isCampaignGameMaster` in shared/utils/.
  readonly canManage = computed(() => {
    const c = this.campaign();
    const userId = this.authService.user()?.id;
    const isGameMaster = c != null && userId != null && c.gameMasterIds.includes(userId);
    return isGameMaster || this.authService.isAdmin();
  });

  protected readonly panels = computed(() => [...CAMPAIGN_GM_PANELS, ...STATIC_GM_PANELS]);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorStatus.set(404);
      this.loading.set(false);
      return;
    }
    this.loadCampaign(id);
  }

  private loadCampaign(id: number): void {
    this.campaignService
      .getCampaign(id, 'playerCharacters,nonPlayerCharacters,characterSummaries')
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorStatus.set(err.status);
          this.loading.set(false);
          return of(null);
        }),
      )
      .subscribe(campaign => {
        if (campaign) {
          this.campaign.set(campaign);
          this.gmScreenContext.setCampaign(campaign);
        }
        this.loading.set(false);
      });
  }
}
