import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ResultCard } from '../result-card/result-card';
import { MappedSearchResult } from '../../../../shared/mappers/search-result.mapper';
import { SearchableEntityType, typeLabels, typeGlyphs } from '../../../../shared/models/search.model';

@Component({
  selector: 'app-result-section',
  templateUrl: './result-section.html',
  styleUrl: './result-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ResultCard, UpperCasePipe],
})
export class ResultSection {
  readonly type = input.required<SearchableEntityType>();
  readonly results = input.required<MappedSearchResult[]>();
  readonly totalCount = input<number>(0);
  readonly showViewAll = input<boolean>(false);
  readonly showBadges = input<boolean>(false);

  readonly viewAll = output<SearchableEntityType>();

  readonly typeLabel = computed(() => typeLabels[this.type()] ?? this.type());
  readonly typeGlyph = computed(() => typeGlyphs[this.type()] ?? '◆');

  onViewAll(): void {
    this.viewAll.emit(this.type());
  }
}
