import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SearchableEntityType, SearchFilters } from '../../models/search.model';
import { ViewMode } from '../../reference';
import { FilterRail } from '../filter-rail/filter-rail';

@Component({
  selector: 'app-refine-sheet',
  templateUrl: './refine-sheet.html',
  styleUrl: './refine-sheet.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FilterRail],
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
})
export class RefineSheet implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly activeType = input<SearchableEntityType | null>(null);
  readonly filters = input<SearchFilters>({});
  readonly viewMode = input<ViewMode>('landing');

  readonly sheetClose = output<void>();
  readonly filtersChange = output<SearchFilters>();

  ngOnInit(): void {
    if (this.isBrowser) {
      document.body.classList.add('body-scroll-lock');
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.body.classList.remove('body-scroll-lock');
    }
  }

  onBackdropClick(): void {
    this.sheetClose.emit();
  }

  onCloseClick(): void {
    this.sheetClose.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.sheetClose.emit();
    }
  }

  onFiltersChanged(filters: SearchFilters): void {
    this.filtersChange.emit(filters);
  }
}
