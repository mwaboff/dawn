import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { DaggerheartCard } from '../../../../shared/components/daggerheart-card/daggerheart-card';
import { AdversaryCard } from '../../../../shared/components/adversary-card/adversary-card';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { SearchableEntityType, typeLabels, typeGlyphs } from '../../../../shared/models/search.model';
import { CardData } from '../../../../shared/components/daggerheart-card/daggerheart-card.model';
import { canEditCustomItem } from '../../../../shared/utils/card-permissions.utils';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-result-section',
  templateUrl: './result-section.html',
  styleUrl: './result-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DaggerheartCard, AdversaryCard, UpperCasePipe],
})
export class ResultSection {
  private readonly authService = inject(AuthService);

  readonly type = input.required<SearchableEntityType>();
  readonly results = input.required<MappedSearchResult[]>();
  readonly totalCount = input<number>(0);
  readonly showViewAll = input<boolean>(false);
  readonly showBadges = input<boolean>(false);

  readonly viewAll = output<SearchableEntityType>();
  readonly editItem = output<CardData>();

  readonly typeLabel = computed(() => typeLabels[this.type()] ?? this.type());
  readonly typeGlyph = computed(() => typeGlyphs[this.type()] ?? '◆');

  onViewAll(): void {
    this.viewAll.emit(this.type());
  }

  showEditAffordanceFor(card: CardData): boolean {
    return canEditCustomItem(card, this.authService.user()?.id, this.authService.isPrivileged());
  }

  onEditClicked(card: CardData): void {
    this.editItem.emit(card);
  }
}
