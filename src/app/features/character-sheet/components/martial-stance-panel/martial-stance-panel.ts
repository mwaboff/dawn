import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MartialStanceResponse } from '../../../../shared/models/martial-stance-api.model';

export interface StanceTierGroup {
  tier: number;
  stances: MartialStanceResponse[];
}

/** Drop conditions shown as a static reminder -- never varies per character, per rules text. */
export const MARTIAL_STANCE_DROP_CONDITIONS: readonly string[] = [
  'You take Severe damage',
  'You mark your last Hit Point',
  'You shift to another stance',
  'The scene ends',
];

function groupByTier(stances: MartialStanceResponse[]): StanceTierGroup[] {
  const byTier = new Map<number, MartialStanceResponse[]>();
  for (const stance of stances) {
    const tier = stance.tier ?? 0;
    const group = byTier.get(tier);
    if (group) {
      group.push(stance);
    } else {
      byTier.set(tier, [stance]);
    }
  }
  return [...byTier.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, tierStances]) => ({
      tier,
      stances: [...tierStances].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

/**
 * Known-stance display, grouped by tier, with active-stance selection. Entering a stance costs 1
 * Focus, so activation is disabled once Focus is empty; the four drop conditions are shown as a
 * static rules reminder since they are triggered by gameplay events this app does not track.
 */
@Component({
  selector: 'app-martial-stance-panel',
  templateUrl: './martial-stance-panel.html',
  styleUrl: './martial-stance-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MartialStancePanel {
  readonly knownStances = input<MartialStanceResponse[]>([]);
  readonly activeStanceId = input<number | null>(null);
  readonly focusMarked = input(0);
  readonly canAct = input(false);
  readonly actionInFlight = input(false);

  readonly activateStance = output<number>();
  readonly clearStance = output<void>();

  readonly dropConditions = MARTIAL_STANCE_DROP_CONDITIONS;

  readonly tierGroups = computed(() => groupByTier(this.knownStances()));

  readonly canActivateAnotherStance = computed(() => this.canAct() && !this.actionInFlight() && this.focusMarked() >= 1);

  isActive(stanceId: number): boolean {
    return this.activeStanceId() === stanceId;
  }

  onActivate(stanceId: number): void {
    if (this.isActive(stanceId) || !this.canActivateAnotherStance()) return;
    this.activateStance.emit(stanceId);
  }

  onClear(): void {
    if (!this.canAct() || this.actionInFlight() || this.activeStanceId() === null) return;
    this.clearStance.emit();
  }
}
