import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { EncounterRosterInstance } from '../../models/encounter-roster-instance.model';

const TIER_OPTIONS = [1, 2, 3, 4] as const;

export interface RetierEvent {
  localId: string;
  tier: number | undefined;
}

export interface LabelChangeEvent {
  localId: string;
  label: string;
}

/**
 * The instances chosen for this encounter so far. Purely a view over what the parent already
 * decided the roster is -- every mutation is emitted upward rather than held here, so the
 * builder's `EncounterRosterInstance[]` stays the single source of truth.
 */
@Component({
  selector: 'app-encounter-roster',
  templateUrl: './encounter-roster.html',
  styleUrl: './encounter-roster.css',
  imports: [AdversaryCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterRoster {
  readonly instances = input.required<EncounterRosterInstance[]>();
  /** localId of the instance to briefly highlight, set by the builder right after an add. */
  readonly justAddedId = input<string | null>(null);

  readonly removeInstance = output<string>();
  readonly retierInstance = output<RetierEvent>();
  readonly labelChange = output<LabelChangeEvent>();

  readonly tierOptions = TIER_OPTIONS;

  onRetierChange(localId: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.retierInstance.emit({ localId, tier: value ? Number(value) : undefined });
  }

  onLabelInput(localId: string, event: Event): void {
    this.labelChange.emit({ localId, label: (event.target as HTMLInputElement).value });
  }
}
