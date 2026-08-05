import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CampaignResponse,
  CampaignCharacterSheet,
  CampaignCharacterSummary,
  UpdateCharacterTransformationRequest,
  UpdateCharacterCompanionsEnabledRequest,
} from '../../../../shared/models/campaign-api.model';
import { TransformationCardResponse } from '../../../../shared/models/transformation-card-api.model';
import { CampaignTransformationControl } from '../campaign-transformation-control/campaign-transformation-control';
import { CampaignCharacterGrantToggle } from '../campaign-character-grant-toggle/campaign-character-grant-toggle';
import { CampaignCharacterGrantButton } from '../campaign-character-grant-button/campaign-character-grant-button';

@Component({
  selector: 'app-campaign-character-list',
  templateUrl: './campaign-character-list.html',
  styleUrl: './campaign-character-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CampaignTransformationControl, CampaignCharacterGrantToggle, CampaignCharacterGrantButton],
})
export class CampaignCharacterList {
  readonly campaign = input.required<CampaignResponse>();
  readonly canManage = input.required<boolean>();
  /**
   * Narrower than `canManage`: granting a transformation is a live-play act, so the backend refuses
   * it on an ended campaign. Removing a character stays available there because that is cleanup.
   */
  readonly canGrantTransformations = input.required<boolean>();
  /** Same gate as `canGrantTransformations`, kept separate since the two grants are independent. */
  readonly canGrantCompanions = input.required<boolean>();
  readonly confirmingRemoveId = input.required<number | null>();
  readonly characterSummaries = input<CampaignCharacterSummary[]>([]);
  readonly openTransformationId = input<number | null>(null);
  readonly savingTransformationId = input<number | null>(null);
  readonly transformationCatalog = input<TransformationCardResponse[]>([]);
  readonly transformationCatalogLoading = input(false);
  readonly transformationCatalogError = input(false);
  readonly openCompanionId = input<number | null>(null);
  readonly savingCompanionId = input<number | null>(null);

  readonly removeCharacter = output<number>();
  readonly viewCharacter = output<number>();
  readonly cancelRemove = output<void>();
  readonly toggleTransformation = output<number>();
  readonly transformationChange = output<{ sheetId: number; request: UpdateCharacterTransformationRequest }>();
  readonly retryTransformationCatalog = output<void>();
  readonly toggleCompanion = output<number>();
  readonly companionChange = output<{ sheetId: number; request: UpdateCharacterCompanionsEnabledRequest }>();

  readonly characters = computed<CampaignCharacterSheet[]>(() => {
    return this.campaign().playerCharacters ?? [];
  });

  getSummary(character: CampaignCharacterSheet): CampaignCharacterSummary | undefined {
    return this.characterSummaries().find(s => s.id === character.id);
  }

  getClassEntries(character: CampaignCharacterSheet): { className: string; subclassName?: string }[] {
    const summary = this.getSummary(character);
    if (!summary) {
      return (character.subclassCards ?? [])
        .map(c => ({ className: c.associatedClassName ?? '' }))
        .filter(e => e.className);
    }
    return summary.classNames.map((cn, i) => ({
      className: cn,
      subclassName: summary.subclassNames[i],
    }));
  }

  isTransformationEnabled(character: CampaignCharacterSheet): boolean {
    return this.getSummary(character)?.transformationEnabled ?? false;
  }

  transformationControlId(sheetId: number): string {
    return `transformation-control-${sheetId}`;
  }

  onToggleTransformationControl(sheetId: number): void {
    this.toggleTransformation.emit(sheetId);
  }

  onTransformationChange(sheetId: number, request: UpdateCharacterTransformationRequest): void {
    this.transformationChange.emit({ sheetId, request });
  }

  isCompanionsEnabled(character: CampaignCharacterSheet): boolean {
    return this.getSummary(character)?.companionsEnabled ?? false;
  }

  companionControlId(sheetId: number): string {
    return `companion-control-${sheetId}`;
  }

  companionStatusText(character: CampaignCharacterSheet): string {
    return this.isCompanionsEnabled(character)
      ? `${character.name} can create a companion from their sheet.`
      : `${character.name} can't create a new companion. This doesn't remove or hide any companion they already have.`;
  }

  onToggleCompanionControl(sheetId: number): void {
    this.toggleCompanion.emit(sheetId);
  }

  onCompanionToggled(character: CampaignCharacterSheet): void {
    this.companionChange.emit({
      sheetId: character.id,
      request: { enabled: !this.isCompanionsEnabled(character) },
    });
  }

  onRemoveClick(sheetId: number, event: Event): void {
    event.stopPropagation();
    this.removeCharacter.emit(sheetId);
  }

  onCancelRemove(event: Event): void {
    event.stopPropagation();
    this.cancelRemove.emit();
  }

  onViewCharacter(sheetId: number): void {
    this.viewCharacter.emit(sheetId);
  }
}
