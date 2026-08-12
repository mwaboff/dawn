import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

import { AdversaryCard } from '../../../../../shared/components/adversary-card/adversary-card';
import { AdversaryData } from '../../../../../shared/components/adversary-card/adversary-card.model';
import { DaggerheartCard } from '../../../../../shared/components/daggerheart-card/daggerheart-card';
import { EntityCard } from '../../../../../shared/components/entity-card/entity-card';
import { InlineDeleteConfirm } from '../../../../../shared/components/inline-delete-confirm/inline-delete-confirm';
import { CardSurfaceDirective } from '../../../../../shared/directives/card-surface.directive';
import { CardData } from '../../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { EntityCardData } from '../../../../../shared/components/entity-card/entity-card.model';
import { cardDataToEntityCard } from '../../../../../shared/mappers/card-data-to-entity-card.mapper';
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
  imports: [AdversaryCard, DaggerheartCard, EntityCard, InlineDeleteConfirm, CardSurfaceDirective, NgTemplateOutlet],
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

  /** localId of the instance whose remove is mid-confirm. Only one row confirms at a time. */
  readonly confirmingId = signal<string | null>(null);

  /**
   * The environment only when the beta face is on, where it is the first cell of the roster grid
   * rather than a labelled row of its own above it. Classic keeps the separate group: its
   * `app-daggerheart-card` is a full-height card, not a single row, so it cannot share a column
   * track with the adversaries the way a `compact` EntityCard can.
   *
   * A computed rather than `@if (sheetLayout() === 'beta' && selectedEnvironment(); as env)`, which
   * does not narrow -- `as` binds the whole `&&` expression, not its right operand.
   */
  readonly betaEnvironment = computed(() =>
    this.sheetLayout() === 'beta' ? this.selectedEnvironment() : undefined,
  );

  onRetierChange(localId: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.retierInstance.emit({ localId, tier: value ? Number(value) : undefined });
  }

  onLabelInput(localId: string, event: Event): void {
    this.labelChange.emit({ localId, label: (event.target as HTMLInputElement).value });
  }

  onRemoveRequested(localId: string): void {
    this.confirmingId.set(localId);
  }

  onRemoveConfirmed(localId: string): void {
    this.confirmingId.set(null);
    this.removeInstance.emit(localId);
  }

  onRemoveCancelled(): void {
    this.confirmingId.set(null);
  }

  environmentEntityCard(card: CardData): EntityCardData {
    return cardDataToEntityCard(card);
  }

  adversaryEntityCard(adversary: AdversaryData, tierOverride: number | undefined): EntityCardData {
    return adversaryToEntityCard(adversary, tierOverride);
  }
}
