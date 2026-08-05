import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CampaignCharacterSummary, UpdateCharacterTransformationRequest } from '../../../../shared/models/campaign-api.model';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';
import { CampaignCharacterGrantToggle } from '../campaign-character-grant-toggle/campaign-character-grant-toggle';

@Component({
  selector: 'app-campaign-transformation-control',
  templateUrl: './campaign-transformation-control.html',
  styleUrl: './campaign-transformation-control.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CampaignCharacterGrantToggle],
})
export class CampaignTransformationControl {
  readonly controlId = input.required<string>();
  readonly characterName = input.required<string>();
  readonly summary = input<CampaignCharacterSummary | undefined>(undefined);
  readonly catalog = input<TransformationCardResponse[]>([]);
  readonly catalogLoading = input(false);
  readonly catalogError = input(false);
  readonly saving = input(false);

  readonly transformationChange = output<UpdateCharacterTransformationRequest>();
  readonly retryCatalog = output<void>();

  readonly enabled = computed(() => this.summary()?.transformationEnabled ?? false);
  /** Normalises a `null` card id from the API to `undefined` so the "None" option matches cleanly. */
  readonly cardId = computed(() => this.summary()?.transformationCardId ?? undefined);

  /** Falls back to the catalog because the roster summary omits the name until the next reload. */
  readonly cardName = computed(() => {
    const id = this.cardId();
    if (id == null) return undefined;
    return this.summary()?.transformationCardName ?? this.catalog().find(card => card.id === id)?.name;
  });

  readonly statusText = computed(() => {
    const name = this.characterName();
    const card = this.cardName();
    if (!this.enabled()) {
      return card
        ? `Hidden from ${name}'s sheet. ${card} is saved and comes back when you turn this on.`
        : `Hidden from ${name}'s sheet.`;
    }
    return card ? `${name} has ${card}.` : `${name} can choose a transformation from their sheet.`;
  });

  onToggle(): void {
    this.transformationChange.emit({ enabled: !this.enabled() });
  }

  onCardChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.transformationChange.emit(
      value === ''
        ? { enabled: this.enabled(), clearTransformationCard: true }
        : { enabled: this.enabled(), transformationCardId: Number(value) },
    );
  }

  onRetry(): void {
    this.retryCatalog.emit();
  }
}
