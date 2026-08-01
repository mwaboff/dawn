import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { CampaignService } from '../../../shared/services/campaign.service';
import { CampaignResponse } from '../../../shared/models/campaign-api.model';

/**
 * Shared state for the campaign GM screen panels.
 *
 * Deliberately NOT `providedIn: 'root'`: the campaign page shell lists it in its `providers`, so
 * each campaign page gets a fresh instance and the public `/gm-screen` page never provides it.
 * Panels are instantiated through `NgComponentOutlet` and receive no inputs -- this is the only
 * thing they inject.
 *
 * `fear` and `gmNotes` are the *local* (optimistically updated) values; `campaign()` holds the
 * last server-confirmed state and is what a failed save rolls back to.
 */
@Injectable()
export class GmScreenContext {
  private readonly campaignService = inject(CampaignService);

  readonly campaign = signal<CampaignResponse | null>(null);
  readonly campaignId = signal<number | null>(null);
  readonly fear = signal(0);
  readonly gmNotes = signal('');

  readonly fearSave$ = new Subject<void>();
  readonly notesSave$ = new Subject<void>();

  private readonly savingKeys = signal<ReadonlySet<string>>(new Set());

  /** Called by the page shell once the campaign loads, and after every successful save. */
  setCampaign(campaign: CampaignResponse): void {
    this.campaign.set(campaign);
    this.campaignId.set(campaign.id);
    this.fear.set(campaign.fear);
    this.gmNotes.set(campaign.gmNotes ?? '');
  }

  /**
   * Merges a save response without clobbering whatever the user has typed since.
   *
   * The PATCH endpoints answer with an *un-expanded* campaign, so `playerCharacters`,
   * `nonPlayerCharacters` and friends are absent from the payload rather than empty. Assigning the
   * response wholesale would drop the party roster the page shell loaded, leaving the sheet viewer
   * on its empty state until a full reload -- so absent keys keep their current value.
   */
  patchCampaign(campaign: CampaignResponse): void {
    this.campaign.update(current => {
      if (current === null) return campaign;
      const present = Object.entries(campaign).filter(([, value]) => value !== undefined);
      return { ...current, ...(Object.fromEntries(present) as Partial<CampaignResponse>) };
    });
    this.campaignId.set(campaign.id);
  }

  refreshCampaign(): void {
    const id = this.campaignId();
    if (id === null) return;
    this.campaignService
      .getCampaign(id, 'playerCharacters,nonPlayerCharacters,characterSummaries')
      .subscribe({ next: campaign => this.setCampaign(campaign) });
  }

  markSaving(key: string): void {
    this.savingKeys.update(keys => new Set(keys).add(key));
  }

  clearSaving(key: string): void {
    this.savingKeys.update(keys => {
      const next = new Set(keys);
      next.delete(key);
      return next;
    });
  }

  isSaving(key: string): boolean {
    return this.savingKeys().has(key);
  }
}
