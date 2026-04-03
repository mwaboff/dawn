import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { CampaignService } from '../../shared/services/campaign.service';
import { CampaignResponse } from '../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.html',
  styleUrl: './campaigns.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Campaigns implements OnInit {
  private readonly router = inject(Router);
  private readonly campaignService = inject(CampaignService);

  readonly campaigns = signal<CampaignResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  ngOnInit(): void {
    this.loadCampaigns();
  }

  onViewCampaign(id: number): void {
    this.router.navigate(['/campaign', id]);
  }

  onCreateCampaign(): void {
    this.router.navigate(['/campaigns/create']);
  }

  isEnded(campaign: CampaignResponse): boolean {
    return campaign.deletedAt != null;
  }

  getPlayerCount(campaign: CampaignResponse): number {
    return campaign.playerIds.length;
  }

  getCharacterCount(campaign: CampaignResponse): number {
    return campaign.playerCharacterIds.length;
  }

  getGmName(campaign: CampaignResponse): string {
    return campaign.creator?.username ?? 'Unknown';
  }

  private loadCampaigns(): void {
    this.campaignService
      .getMyCampaigns(0, 50, 'creator')
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status !== 403) {
            this.error.set(true);
          }
          return of(null);
        }),
      )
      .subscribe(response => {
        if (response) {
          this.campaigns.set(response.content);
        }
        this.loading.set(false);
      });
  }
}
