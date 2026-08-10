import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { AdversaryData } from '../../../../../shared/components/adversary-card/adversary-card.model';
import { DaggerheartCard } from '../../../../../shared/components/daggerheart-card/daggerheart-card';
import { EntityCard } from '../../../../../shared/components/entity-card/entity-card';
import { CardSurfaceDirective } from '../../../../../shared/directives/card-surface.directive';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../../../../../shared/components/entity-card/entity-card.model';
import { environmentCardToEntityCard } from '../../../../../shared/mappers/environment-card-to-entity-card.mapper';
import { adversaryToEntityCard } from '../../../../../shared/mappers/adversary-data-to-entity-card.mapper';
import { PreferencesService } from '../../../../../core/services/preferences.service';
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
  imports: [AdversaryCard, DaggerheartCard, EntityCard, CardSurfaceDirective, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncounterRoster {
  private readonly preferencesService = inject(PreferencesService);

  readonly sheetLayout = this.preferencesService.sheetLayout;

  readonly instances = input.required<EncounterRosterInstance[]>();
  /** localId of the instance to briefly highlight, set by the builder right after an add. */
  readonly justAddedId = input<string | null>(null);
  /** The encounter's environment, if one is attached -- shown here so picking one is visible
   * without expanding the (collapsed-by-default) Environment section. Purely a display: it costs
   * no Battle Points and never reaches the meter. */
  readonly selectedEnvironment = input<CardData | undefined>(undefined);

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

  environmentEntityCard(card: CardData): EntityCardData {
    return environmentCardToEntityCard(card);
  }

  adversaryEntityCard(adversary: AdversaryData, tierOverride: number | undefined): EntityCardData {
    return adversaryToEntityCard(adversary, tierOverride);
  }
}
