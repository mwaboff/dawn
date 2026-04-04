import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CampaignResponse, CampaignCharacterSheet } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-pending-list',
  templateUrl: './campaign-pending-list.html',
  styleUrl: './campaign-pending-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignPendingList {
  readonly campaign = input.required<CampaignResponse>();

  readonly approve = output<number>();
  readonly reject = output<number>();
  readonly viewCharacter = output<number>();

  readonly pendingSheets = computed<CampaignCharacterSheet[]>(() => {
    return this.campaign().pendingCharacterSheets ?? [];
  });

  onApprove(sheetId: number, event: Event): void {
    event.stopPropagation();
    this.approve.emit(sheetId);
  }

  onReject(sheetId: number, event: Event): void {
    event.stopPropagation();
    this.reject.emit(sheetId);
  }

  onViewCharacter(sheetId: number): void {
    this.viewCharacter.emit(sheetId);
  }
}
