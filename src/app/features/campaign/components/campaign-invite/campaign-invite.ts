import { Component, ChangeDetectionStrategy, inject, input, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CampaignService } from '../../../../shared/services/campaign.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-campaign-invite',
  templateUrl: './campaign-invite.html',
  styleUrl: './campaign-invite.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignInvite {
  private readonly campaignService = inject(CampaignService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly campaignId = input.required<number>();

  readonly inviteUrl = signal('');
  readonly generating = signal(false);
  readonly error = signal('');
  readonly copied = signal(false);

  onGenerate(): void {
    if (this.generating()) return;
    this.generating.set(true);
    this.error.set('');
    this.inviteUrl.set('');

    this.campaignService.generateInvite(this.campaignId()).subscribe({
      next: response => {
        const origin = isPlatformBrowser(this.platformId) ? window.location.origin : '';
        this.inviteUrl.set(`${origin}/campaigns/join/${response.token}`);
        this.generating.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.generating.set(false);
        this.error.set(err.status === 403
          ? 'You do not have permission to generate invites.'
          : 'Failed to generate invite link.');
      },
    });
  }

  async onCopy(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      await navigator.clipboard.writeText(this.inviteUrl());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.error.set('Failed to copy to clipboard.');
    }
  }
}
