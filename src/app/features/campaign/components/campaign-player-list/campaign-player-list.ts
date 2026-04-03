import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CampaignResponse } from '../../../../shared/models/campaign-api.model';
import { UserResponse } from '../../../../core/models/auth.model';

interface PlayerEntry {
  user: UserResponse;
  isGm: boolean;
}

@Component({
  selector: 'app-campaign-player-list',
  templateUrl: './campaign-player-list.html',
  styleUrl: './campaign-player-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignPlayerList {
  readonly campaign = input.required<CampaignResponse>();
  readonly canManage = input.required<boolean>();
  readonly confirmingKickId = input.required<number | null>();

  readonly kickPlayer = output<number>();
  readonly viewPlayer = output<number>();
  readonly cancelKick = output<void>();

  readonly entries = computed<PlayerEntry[]>(() => {
    const c = this.campaign();
    const gmSet = new Set(c.gameMasterIds);
    const result: PlayerEntry[] = [];

    for (const gm of c.gameMasters ?? []) {
      result.push({ user: gm, isGm: true });
    }

    for (const player of c.players ?? []) {
      if (!gmSet.has(player.id)) {
        result.push({ user: player, isGm: false });
      }
    }

    return result;
  });

  onKickClick(userId: number, event: Event): void {
    event.stopPropagation();
    this.kickPlayer.emit(userId);
  }

  onCancelKick(event: Event): void {
    event.stopPropagation();
    this.cancelKick.emit();
  }

  onViewPlayer(userId: number): void {
    this.viewPlayer.emit(userId);
  }
}
