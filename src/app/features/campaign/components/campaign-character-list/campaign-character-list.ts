import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CampaignResponse, CharacterSheetSummary } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-character-list',
  templateUrl: './campaign-character-list.html',
  styleUrl: './campaign-character-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCharacterList {
  readonly campaign = input.required<CampaignResponse>();
  readonly canManage = input.required<boolean>();
  readonly confirmingRemoveId = input.required<number | null>();

  readonly removeCharacter = output<number>();
  readonly viewCharacter = output<number>();
  readonly cancelRemove = output<void>();

  readonly characters = computed<CharacterSheetSummary[]>(() => {
    return this.campaign().playerCharacters ?? [];
  });

  getClassNames(character: CharacterSheetSummary): string {
    const cards = character.subclassCards ?? [];
    const names = cards
      .map(c => c.associatedClassName)
      .filter((n): n is string => !!n);
    return names.length > 0 ? names.join(' / ') : '';
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
