import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ELITE_ADVERSARY_TYPES } from '../../../../../shared/components/adversary-card/adversary-card';
import { EncounterRosterInstance } from '../../models/encounter-roster-instance.model';
import {
  AdversaryTypeKey,
  BattlePointAdjustments,
  pointCostForType,
  spentPoints,
  suggestedBudget,
} from '../../../../../shared/utils/battle-points.utils';

interface MeterSegment {
  key: string;
  costPoints: number;
  kind: 'elite' | 'minion' | 'standard';
  label: string;
}

const ADJUSTMENT_OPTIONS: readonly {
  key: keyof BattlePointAdjustments;
  label: string;
  deltaLabel: string;
}[] = [
  { key: 'easier', label: 'Fight should be less difficult or shorter', deltaLabel: '−1' },
  { key: 'twoPlusSolos', label: 'Using 2 or more Solo adversaries', deltaLabel: '−2' },
  { key: 'bonusDamage', label: "Adding +1d4 (or +2) to all adversaries' damage", deltaLabel: '−2' },
  { key: 'lowerTier', label: 'Choosing an adversary from a lower tier', deltaLabel: '+1' },
  { key: 'noElites', label: 'No Bruisers, Hordes, Leaders, or Solos', deltaLabel: '+1' },
  { key: 'harder', label: 'Fight should be more dangerous or last longer', deltaLabel: '+2' },
];

/**
 * The centrepiece of the builder: spent vs. suggested Battle Points, updated instantly from
 * `shared/utils/battle-points.utils.ts` as the roster, party size, or adjustments change. The
 * server value wins on save -- this is only ever a live preview.
 *
 * Minions are rendered as one merged, dashed segment sized by *groups*, not by headcount, so a
 * GM can see at a glance why the 5th minion at party size 4 jumps the cost and the 2nd-4th don't.
 */
@Component({
  selector: 'app-battle-point-meter',
  templateUrl: './battle-point-meter.html',
  styleUrl: './battle-point-meter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlePointMeter {
  readonly instances = input.required<EncounterRosterInstance[]>();
  readonly partySize = input.required<number>();
  readonly adjustments = input.required<BattlePointAdjustments>();

  readonly partySizeChange = output<number>();
  readonly adjustmentsChange = output<BattlePointAdjustments>();

  readonly adjustmentOptions = ADJUSTMENT_OPTIONS;

  readonly minionCount = computed(() => this.instances().filter(i => i.adversary.adversaryType === 'MINION').length);
  readonly minionGroups = computed(() => Math.ceil(this.minionCount() / Math.max(this.partySize(), 1)));

  readonly spent = computed(() =>
    spentPoints(
      this.instances().map(i => ({ adversaryType: i.adversary.adversaryType as AdversaryTypeKey })),
      this.partySize(),
    ),
  );
  readonly suggested = computed(() => suggestedBudget(this.partySize(), this.adjustments()));
  readonly remaining = computed(() => this.suggested() - this.spent());
  readonly isOverBudget = computed(() => this.spent() > this.suggested());

  readonly trackMax = computed(() => Math.max(this.suggested(), this.spent(), 1));
  readonly suggestedMarkerPercent = computed(() => (this.suggested() / this.trackMax()) * 100);

  readonly segments = computed<MeterSegment[]>(() => {
    const segments: MeterSegment[] = [];
    for (const instance of this.instances()) {
      const type = instance.adversary.adversaryType as AdversaryTypeKey;
      if (type === 'MINION') continue;
      segments.push({
        key: instance.localId,
        costPoints: pointCostForType(type as Exclude<AdversaryTypeKey, 'MINION'>),
        kind: ELITE_ADVERSARY_TYPES.has(type) ? 'elite' : 'standard',
        label: instance.adversary.name,
      });
    }
    const minionGroups = this.minionGroups();
    if (minionGroups > 0) {
      const count = this.minionCount();
      segments.push({
        key: 'minions',
        costPoints: minionGroups,
        kind: 'minion',
        label: `${count} Minion${count === 1 ? '' : 's'} (${minionGroups} group${minionGroups === 1 ? '' : 's'})`,
      });
    }
    return segments;
  });

  segmentWidthPercent(segment: MeterSegment): number {
    return (segment.costPoints / this.trackMax()) * 100;
  }

  onPartySizeInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value) && value > 0) {
      this.partySizeChange.emit(value);
    }
  }

  isAdjustmentActive(key: keyof BattlePointAdjustments): boolean {
    return !!this.adjustments()[key];
  }

  onAdjustmentToggle(key: keyof BattlePointAdjustments): void {
    this.adjustmentsChange.emit({ ...this.adjustments(), [key]: !this.adjustments()[key] });
  }
}
