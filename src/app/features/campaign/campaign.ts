import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { CampaignService } from '../../shared/services/campaign.service';
import { AuthService } from '../../core/services/auth.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';
import { CampaignSummary } from './components/campaign-summary/campaign-summary';
import { CampaignPlayerList } from './components/campaign-player-list/campaign-player-list';
import { CampaignCharacterList } from './components/campaign-character-list/campaign-character-list';
import { CampaignInvite } from './components/campaign-invite/campaign-invite';
import { CampaignPendingList } from './components/campaign-pending-list/campaign-pending-list';
import { CampaignNpcList } from './components/campaign-npc-list/campaign-npc-list';
import { CampaignSheetPicker } from './components/campaign-sheet-picker/campaign-sheet-picker';

@Component({
  selector: 'app-campaign',
  templateUrl: './campaign.html',
  styleUrl: './campaign.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CampaignSummary,
    CampaignPlayerList,
    CampaignCharacterList,
    CampaignInvite,
    CampaignPendingList,
    CampaignNpcList,
    CampaignSheetPicker,
  ],
})
export class Campaign implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly campaignService = inject(CampaignService);
  private readonly authService = inject(AuthService);

  readonly campaign = signal<CampaignResponse | null>(null);
  readonly loading = signal(true);
  readonly errorStatus = signal<number | null>(null);
  readonly confirmingKickId = signal<number | null>(null);
  readonly confirmingRemoveId = signal<number | null>(null);
  readonly confirmingRemoveNpcId = signal<number | null>(null);
  readonly showSubmitPicker = signal(false);
  readonly showNpcPicker = signal(false);

  readonly isGameMaster = computed(() => {
    const c = this.campaign();
    const userId = this.authService.user()?.id;
    if (!c || !userId) return false;
    return c.gameMasterIds.includes(userId);
  });

  readonly canManage = computed(() => {
    return this.isGameMaster() || this.authService.isAdmin();
  });

  readonly isPlayer = computed(() => {
    const c = this.campaign();
    const userId = this.authService.user()?.id;
    if (!c || !userId) return false;
    return c.playerIds.includes(userId);
  });

  readonly allSheetIds = computed(() => {
    const c = this.campaign();
    if (!c) return [];
    return [
      ...c.pendingCharacterSheetIds,
      ...c.playerCharacterIds,
      ...c.nonPlayerCharacterIds,
    ];
  });

  readonly hasPending = computed(() => {
    const c = this.campaign();
    return c != null && (c.pendingCharacterSheets?.length ?? c.pendingCharacterSheetIds.length) > 0;
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorStatus.set(404);
      this.loading.set(false);
      return;
    }
    this.loadCampaign(id);
  }

  onKickPlayer(userId: number): void {
    if (this.confirmingKickId() === userId) {
      this.confirmingKickId.set(null);
      const c = this.campaign();
      if (!c) return;
      this.campaignService.kickPlayer(c.id, userId).subscribe({
        next: () => this.reloadCampaign(),
        error: () => this.reloadCampaign(),
      });
    } else {
      this.confirmingKickId.set(userId);
    }
  }

  onCancelKick(): void {
    this.confirmingKickId.set(null);
  }

  onRemoveCharacter(sheetId: number): void {
    if (this.confirmingRemoveId() === sheetId) {
      this.confirmingRemoveId.set(null);
      const c = this.campaign();
      if (!c) return;
      this.campaignService.removeCharacterSheet(c.id, sheetId).subscribe({
        next: () => this.reloadCampaign(),
        error: () => this.reloadCampaign(),
      });
    } else {
      this.confirmingRemoveId.set(sheetId);
    }
  }

  onCancelRemove(): void {
    this.confirmingRemoveId.set(null);
  }

  onApproveCharacter(sheetId: number): void {
    const c = this.campaign();
    if (!c) return;
    this.campaignService.approveCharacterSheet(c.id, sheetId).subscribe({
      next: () => this.reloadCampaign(),
      error: () => this.reloadCampaign(),
    });
  }

  onRejectCharacter(sheetId: number): void {
    const c = this.campaign();
    if (!c) return;
    this.campaignService.rejectCharacterSheet(c.id, sheetId).subscribe({
      next: () => this.reloadCampaign(),
      error: () => this.reloadCampaign(),
    });
  }

  onViewPlayer(userId: number): void {
    this.router.navigate(['/profile', userId]);
  }

  onViewCharacter(sheetId: number): void {
    this.router.navigate(['/character', sheetId]);
  }

  onSubmitCharacter(sheetId: number): void {
    const c = this.campaign();
    if (!c) return;
    this.campaignService.submitCharacterSheet(c.id, sheetId).subscribe({
      next: () => {
        this.showSubmitPicker.set(false);
        this.reloadCampaign();
      },
      error: () => this.reloadCampaign(),
    });
  }

  onAddNpc(sheetId: number): void {
    const c = this.campaign();
    if (!c) return;
    this.campaignService.addNpc(c.id, sheetId).subscribe({
      next: () => {
        this.showNpcPicker.set(false);
        this.reloadCampaign();
      },
      error: () => this.reloadCampaign(),
    });
  }

  onRemoveNpc(sheetId: number): void {
    if (this.confirmingRemoveNpcId() === sheetId) {
      this.confirmingRemoveNpcId.set(null);
      const c = this.campaign();
      if (!c) return;
      this.campaignService.removeCharacterSheet(c.id, sheetId).subscribe({
        next: () => this.reloadCampaign(),
        error: () => this.reloadCampaign(),
      });
    } else {
      this.confirmingRemoveNpcId.set(sheetId);
    }
  }

  onCancelRemoveNpc(): void {
    this.confirmingRemoveNpcId.set(null);
  }

  private loadCampaign(id: number): void {
    this.campaignService
      .getCampaign(id, 'creator,gameMasters,players,playerCharacters,nonPlayerCharacters,pendingCharacterSheets')
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
        }
        this.loading.set(false);
      });
  }

  private reloadCampaign(): void {
    const c = this.campaign();
    if (c) {
      this.loadCampaign(c.id);
    }
  }
}
