import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignResponse, CampaignCharacterSheet, CampaignCharacterSummary } from '../../../../shared/models/campaign-api.model';

@Component({
  selector: 'app-campaign-character-list',
  templateUrl: './campaign-character-list.html',
  styleUrl: './campaign-character-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class CampaignCharacterList {
  readonly campaign = input.required<CampaignResponse>();
  readonly canManage = input.required<boolean>();
  readonly confirmingRemoveId = input.required<number | null>();
  readonly characterSummaries = input<CampaignCharacterSummary[]>([]);

  readonly removeCharacter = output<number>();
  readonly viewCharacter = output<number>();
  readonly cancelRemove = output<void>();

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
