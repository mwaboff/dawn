import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SearchableEntityType, SearchFilters } from '../../models/search.model';
import { ViewMode } from '../../reference';
import { FilterRail } from '../filter-rail/filter-rail';

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
export class RefineSheet implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly activeType = input<SearchableEntityType | null>(null);
  readonly filters = input<SearchFilters>({});
  readonly viewMode = input<ViewMode>('landing');

  readonly sheetClose = output<void>();
  readonly filtersChange = output<SearchFilters>();

  @ViewChild('panelRef') panelRef!: ElementRef<HTMLElement>;
  @ViewChild('closeBtn') closeBtnRef!: ElementRef<HTMLButtonElement>;

  private openerElement: HTMLElement | null = null;

  ngOnInit(): void {
    if (this.isBrowser) {
      this.openerElement = document.activeElement as HTMLElement;
      document.body.classList.add('body-scroll-lock');
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.closeBtnRef?.nativeElement.focus();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      document.body.classList.remove('body-scroll-lock');
      this.openerElement?.focus();
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

  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.panelRef?.nativeElement;
    if (!panel) return;
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  onFiltersChanged(filters: SearchFilters): void {
    this.filtersChange.emit(filters);
  }
}
