import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignService } from '../../shared/services/campaign.service';
import { JoinCampaignResponse } from '../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-join',
  templateUrl: './campaign-join.html',
  styleUrl: './campaign-join.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class CampaignJoin implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly campaignService = inject(CampaignService);

  readonly joining = signal(true);
  readonly result = signal<JoinCampaignResponse | null>(null);
  readonly error = signal<'expired' | 'not-found' | 'unauthorized' | 'unknown' | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.campaignService.joinCampaign(token).subscribe({
      next: (response) => {
        this.result.set(response);
        this.joining.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.joining.set(false);
        switch (err.status) {
          case 400:
            this.error.set('expired');
            break;
          case 401:
            this.error.set('unauthorized');
            break;
          case 404:
            this.error.set('not-found');
            break;
          default:
            this.error.set('unknown');
            break;
        }
      },
    });
  }
}
