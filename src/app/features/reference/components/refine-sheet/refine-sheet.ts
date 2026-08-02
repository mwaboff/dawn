import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SearchableEntityType, SearchFilters } from '../../../../shared/models/search.model';
import { ViewMode } from '../../reference';
import { FilterRail, FilterOption } from '../filter-rail/filter-rail';
import { ModalFocusDirective } from '../../../../shared/directives/modal-focus.directive';

@Component({
  selector: 'app-refine-sheet',
  templateUrl: './refine-sheet.html',
  styleUrl: './refine-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilterRail, ModalFocusDirective],
})
export class RefineSheet {
  readonly activeType = input<SearchableEntityType | null>(null);
  readonly filters = input<SearchFilters>({});
  readonly viewMode = input<ViewMode>('landing');
  readonly domainOptions = input<FilterOption[]>([]);
  readonly classOptions = input<FilterOption[]>([]);
  readonly expansionOptions = input<FilterOption[]>([]);

  readonly sheetClose = output<void>();
  readonly filtersChange = output<SearchFilters>();

  onBackdropClick(): void {
    this.sheetClose.emit();
  }

  onCloseClick(): void {
    this.sheetClose.emit();
  }

  onFiltersChanged(filters: SearchFilters): void {
    this.filtersChange.emit(filters);
  }
}
